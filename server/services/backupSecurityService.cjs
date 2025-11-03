const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');
const logger = require('../../config/logger.cjs');

const execAsync = promisify(exec);

class BackupSecurityService {
  constructor() {
    this.db = null;
    this.initializeDatabase();
  }

  async initializeDatabase() {
    try {
      this.db = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'rare_toy_companion',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('✅ Backup Security Service: Pool de conexões MySQL inicializado');
    } catch (error) {
      console.error('❌ Backup Security Service: Erro na inicialização:', error.message);
    }
  }

  // ===== SISTEMA DE BACKUP =====

  // Criar job de backup
  async createBackupJob(jobData) {
    try {
      const id = uuidv4();
      const {
        name,
        description,
        backup_type,
        source_type,
        source_config,
        destination_config,
        schedule_config,
        retention_days = 30,
        is_active = true,
        created_by
      } = jobData;

      // Calcular próxima execução se agendado
      const nextRun = schedule_config ? this.calculateNextBackupRun(schedule_config) : null;

      const [result] = await this.db.execute(`
        INSERT INTO backup_jobs (
          id, name, description, backup_type, source_type, 
          source_config, destination_config, schedule_config, 
          retention_days, is_active, next_run, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, name, description, backup_type, source_type,
        JSON.stringify(source_config), JSON.stringify(destination_config), 
        JSON.stringify(schedule_config), retention_days, is_active, nextRun, created_by
      ]);

      return {
        success: true,
        data: { id, ...jobData, next_run: nextRun }
      };
    } catch (error) {
      console.error('Erro ao criar job de backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular próxima execução de backup
  calculateNextBackupRun(scheduleConfig) {
    const now = new Date();
    
    switch (scheduleConfig.frequency) {
      case 'hourly':
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        return nextHour;
        
      case 'daily':
        const dailyHour = scheduleConfig.hour || 2; // 2 AM por padrão
        const nextDaily = new Date(now);
        nextDaily.setHours(dailyHour, 0, 0, 0);
        if (nextDaily <= now) {
          nextDaily.setDate(nextDaily.getDate() + 1);
        }
        return nextDaily;
        
      case 'weekly':
        const weeklyDay = scheduleConfig.day || 0; // Domingo
        const weeklyHour = scheduleConfig.hour || 2;
        const nextWeekly = new Date(now);
        const daysUntilNext = (weeklyDay - now.getDay() + 7) % 7;
        nextWeekly.setDate(now.getDate() + (daysUntilNext === 0 ? 7 : daysUntilNext));
        nextWeekly.setHours(weeklyHour, 0, 0, 0);
        return nextWeekly;
        
      case 'monthly':
        const monthlyDay = scheduleConfig.day || 1;
        const monthlyHour = scheduleConfig.hour || 2;
        const nextMonthly = new Date(now.getFullYear(), now.getMonth() + 1, monthlyDay, monthlyHour, 0, 0, 0);
        return nextMonthly;
        
      default:
        return null;
    }
  }

  // Executar backup
  async executeBackup(jobId, userId = null) {
    try {
      // Obter configuração do job
      const [jobs] = await this.db.execute(`
        SELECT * FROM backup_jobs WHERE id = ?
      `, [jobId]);

      if (jobs.length === 0) {
        return {
          success: false,
          error: 'Job de backup não encontrado'
        };
      }

      const job = jobs[0];
      const sourceConfig = JSON.parse(job.source_config);
      const destinationConfig = JSON.parse(job.destination_config);

      // Criar registro de execução
      const executionId = uuidv4();
      await this.db.execute(`
        INSERT INTO backup_executions (
          id, job_id, status, started_at
        ) VALUES (?, ?, 'running', NOW())
      `, [executionId, jobId]);

      const startTime = Date.now();
      let backupResult;

      try {
        // Executar backup baseado no tipo
        if (job.source_type === 'database' || job.source_type === 'both') {
          backupResult = await this.backupDatabase(sourceConfig, destinationConfig, job.backup_type);
        } else if (job.source_type === 'files') {
          backupResult = await this.backupFiles(sourceConfig, destinationConfig, job.backup_type);
        }

        if (!backupResult.success) {
          throw new Error(backupResult.error);
        }

        // Calcular checksum
        const checksum = await this.calculateFileChecksum(backupResult.filePath);
        const fileStats = await fs.stat(backupResult.filePath);
        const duration = Math.round((Date.now() - startTime) / 1000);

        // Atualizar execução
        await this.db.execute(`
          UPDATE backup_executions 
          SET status = 'completed', backup_size = ?, file_path = ?, 
              checksum = ?, completed_at = NOW(), duration_seconds = ?
          WHERE id = ?
        `, [fileStats.size, backupResult.filePath, checksum, duration, executionId]);

        // Atualizar próxima execução se agendado
        if (job.schedule_config) {
          const nextRun = this.calculateNextBackupRun(JSON.parse(job.schedule_config));
          await this.db.execute(`
            UPDATE backup_jobs SET last_run = NOW(), next_run = ? WHERE id = ?
          `, [nextRun, jobId]);
        }

        return {
          success: true,
          data: {
            executionId,
            filePath: backupResult.filePath,
            size: fileStats.size,
            checksum,
            duration
          }
        };
      } catch (error) {
        // Registrar erro
        await this.db.execute(`
          UPDATE backup_executions 
          SET status = 'failed', error_message = ?, completed_at = NOW()
          WHERE id = ?
        `, [error.message, executionId]);

        return {
          success: false,
          error: error.message
        };
      }
    } catch (error) {
      console.error('Erro ao executar backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Backup do banco de dados
  async backupDatabase(sourceConfig, destinationConfig, backupType) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_db_${timestamp}.sql`;
      const filePath = path.join(destinationConfig.path, fileName);

      // Criar diretório se não existir
      await fs.mkdir(destinationConfig.path, { recursive: true });

      // Comando mysqldump
      const dbConfig = sourceConfig.database;
      const dumpCommand = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user} -p${dbConfig.password} ${dbConfig.database} > "${filePath}"`;

      await execAsync(dumpCommand);

      // Comprimir se necessário
      if (destinationConfig.compress) {
        const compressedPath = filePath + '.gz';
        await execAsync(`gzip "${filePath}"`);
        return {
          success: true,
          filePath: compressedPath
        };
      }

      return {
        success: true,
        filePath: filePath
      };
    } catch (error) {
      console.error('Erro no backup do banco:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Backup de arquivos
  async backupFiles(sourceConfig, destinationConfig, backupType) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `backup_files_${timestamp}.tar.gz`;
      const filePath = path.join(destinationConfig.path, fileName);

      // Criar diretório se não existir
      await fs.mkdir(destinationConfig.path, { recursive: true });

      // Comando tar
      const sourcePaths = sourceConfig.paths.join(' ');
      const tarCommand = `tar -czf "${filePath}" ${sourcePaths}`;

      await execAsync(tarCommand);

      return {
        success: true,
        filePath: filePath
      };
    } catch (error) {
      console.error('Erro no backup de arquivos:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Calcular checksum do arquivo
  async calculateFileChecksum(filePath) {
    try {
      const data = await fs.readFile(filePath);
      return crypto.createHash('sha256').update(data).digest('hex');
    } catch (error) {
      console.error('Erro ao calcular checksum:', error);
      return null;
    }
  }

  // Executar backups agendados
  async executeScheduledBackups() {
    try {
      const now = new Date();
      
      // Buscar jobs agendados para execução
      const [jobs] = await this.db.execute(`
        SELECT * FROM backup_jobs 
        WHERE is_active = TRUE AND next_run <= ?
      `, [now]);

      const results = [];

      for (const job of jobs) {
        try {
          const result = await this.executeBackup(job.id);
          results.push({
            jobId: job.id,
            jobName: job.name,
            status: result.success ? 'success' : 'failed',
            error: result.error
          });
        } catch (error) {
          console.error(`Erro ao executar backup ${job.id}:`, error);
          results.push({
            jobId: job.id,
            jobName: job.name,
            status: 'failed',
            error: error.message
          });
        }
      }

      return {
        success: true,
        data: results
      };
    } catch (error) {
      console.error('Erro ao executar backups agendados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar jobs de backup
  async getBackupJobs(filters = {}) {
    try {
      let query = 'SELECT * FROM backup_jobs WHERE 1=1';
      const params = [];

      if (filters.is_active !== undefined) {
        query += ' AND is_active = ?';
        params.push(filters.is_active);
      }

      if (filters.backup_type) {
        query += ' AND backup_type = ?';
        params.push(filters.backup_type);
      }

      query += ' ORDER BY created_at DESC';

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar jobs de backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Listar execuções de backup
  async getBackupExecutions(filters = {}) {
    try {
      let query = `
        SELECT be.*, bj.name as job_name 
        FROM backup_executions be
        LEFT JOIN backup_jobs bj ON be.job_id = bj.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.job_id) {
        query += ' AND be.job_id = ?';
        params.push(filters.job_id);
      }

      if (filters.status) {
        query += ' AND be.status = ?';
        params.push(filters.status);
      }

      if (filters.limit) {
        query += ' ORDER BY be.started_at DESC LIMIT ?';
        params.push(filters.limit);
      } else {
        query += ' ORDER BY be.started_at DESC';
      }

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao listar execuções de backup:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== SISTEMA DE SEGURANÇA =====

  // Registrar evento de segurança
  async logSecurityEvent(eventData) {
    try {
      const id = uuidv4();
      const {
        event_type,
        user_id,
        ip_address,
        user_agent,
        resource,
        action,
        details = {},
        severity = 'medium'
      } = eventData;

      await this.db.execute(`
        INSERT INTO security_events (
          id, event_type, user_id, ip_address, user_agent, 
          resource, action, details, severity
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, event_type, user_id, ip_address, user_agent,
        resource, action, JSON.stringify(details), severity
      ]);

      // Verificar se é evento crítico
      if (severity === 'critical' || severity === 'high') {
        await this.handleCriticalSecurityEvent(eventData);
      }

      return {
        success: true,
        data: { id }
      };
    } catch (error) {
      console.error('Erro ao registrar evento de segurança:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tratar evento crítico de segurança
  async handleCriticalSecurityEvent(eventData) {
    try {
      // Aqui você pode implementar ações automáticas como:
      // - Bloquear IP suspeito
      // - Desativar usuário
      // - Enviar alertas
      // - Notificar administradores
      
      console.log('🚨 EVENTO CRÍTICO DE SEGURANÇA:', eventData);
      
      // Exemplo: Bloquear IP após múltiplas tentativas de login falhadas
      if (eventData.event_type === 'failed_login') {
        const failedAttempts = await this.getFailedLoginAttempts(eventData.ip_address, 15); // 15 minutos
        if (failedAttempts >= 5) {
          await this.blockIPAddress(eventData.ip_address, 60); // Bloquear por 1 hora
        }
      }
    } catch (error) {
      console.error('Erro ao tratar evento crítico:', error);
    }
  }

  // Obter tentativas de login falhadas
  async getFailedLoginAttempts(ipAddress, minutes = 15) {
    try {
      const [rows] = await this.db.execute(`
        SELECT COUNT(*) as count 
        FROM security_events 
        WHERE event_type = 'failed_login' 
        AND ip_address = ? 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? MINUTE)
      `, [ipAddress, minutes]);

      return rows[0].count;
    } catch (error) {
      console.error('Erro ao obter tentativas de login:', error);
      return 0;
    }
  }

  // Bloquear endereço IP
  async blockIPAddress(ipAddress, minutes = 60) {
    try {
      // Aqui você implementaria o bloqueio real do IP
      // Por exemplo, usando iptables ou um sistema de firewall
      console.log(`🚫 Bloqueando IP ${ipAddress} por ${minutes} minutos`);
      
      // Registrar o bloqueio
      await this.logSecurityEvent({
        event_type: 'suspicious_activity',
        ip_address: ipAddress,
        action: 'ip_blocked',
        details: { blocked_for_minutes: minutes },
        severity: 'high'
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao bloquear IP:', error);
      return { success: false, error: error.message };
    }
  }

  // Registrar log de acesso
  async logAccess(accessData) {
    try {
      const id = uuidv4();
      const {
        user_id,
        session_id,
        ip_address,
        user_agent,
        endpoint,
        method,
        status_code,
        response_time_ms,
        request_size,
        response_size
      } = accessData;

      await this.db.execute(`
        INSERT INTO access_logs (
          id, user_id, session_id, ip_address, user_agent, 
          endpoint, method, status_code, response_time_ms, 
          request_size, response_size
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, user_id, session_id, ip_address, user_agent,
        endpoint, method, status_code, response_time_ms,
        request_size, response_size
      ]);

      return { success: true };
    } catch (error) {
      console.error('Erro ao registrar log de acesso:', error);
      return { success: false, error: error.message };
    }
  }

  // Obter eventos de segurança
  async getSecurityEvents(filters = {}) {
    try {
      let query = 'SELECT * FROM security_events WHERE 1=1';
      const params = [];

      if (filters.event_type) {
        query += ' AND event_type = ?';
        params.push(filters.event_type);
      }

      if (filters.severity) {
        query += ' AND severity = ?';
        params.push(filters.severity);
      }

      if (filters.user_id) {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.ip_address) {
        query += ' AND ip_address = ?';
        params.push(filters.ip_address);
      }

      if (filters.date_from) {
        query += ' AND created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter eventos de segurança:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter logs de acesso
  async getAccessLogs(filters = {}) {
    try {
      let query = 'SELECT * FROM access_logs WHERE 1=1';
      const params = [];

      if (filters.user_id) {
        query += ' AND user_id = ?';
        params.push(filters.user_id);
      }

      if (filters.ip_address) {
        query += ' AND ip_address = ?';
        params.push(filters.ip_address);
      }

      if (filters.endpoint) {
        query += ' AND endpoint LIKE ?';
        params.push(`%${filters.endpoint}%`);
      }

      if (filters.status_code) {
        query += ' AND status_code = ?';
        params.push(filters.status_code);
      }

      if (filters.date_from) {
        query += ' AND created_at >= ?';
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ' AND created_at <= ?';
        params.push(filters.date_to);
      }

      query += ' ORDER BY created_at DESC';

      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
      }

      const [rows] = await this.db.execute(query, params);

      return {
        success: true,
        data: rows
      };
    } catch (error) {
      console.error('Erro ao obter logs de acesso:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // ===== SISTEMA DE CRIPTOGRAFIA =====

  // Gerar chave de criptografia
  async generateEncryptionKey(keyName, keyType = 'aes', expiresInDays = 365) {
    try {
      const id = uuidv4();
      let keyData;

      switch (keyType) {
        case 'aes':
          keyData = crypto.randomBytes(32).toString('hex');
          break;
        case 'rsa':
          const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
          });
          keyData = JSON.stringify({ publicKey, privateKey });
          break;
        case 'ec':
          const ecKeyPair = crypto.generateKeyPairSync('ec', {
            namedCurve: 'prime256v1',
            publicKeyEncoding: { type: 'spki', format: 'pem' },
            privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
          });
          keyData = JSON.stringify(ecKeyPair);
          break;
        default:
          throw new Error('Tipo de chave não suportado');
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      await this.db.execute(`
        INSERT INTO encryption_keys (
          id, key_name, key_type, key_data, expires_at
        ) VALUES (?, ?, ?, ?, ?)
      `, [id, keyName, keyType, keyData, expiresAt]);

      return {
        success: true,
        data: { id, keyName, keyType }
      };
    } catch (error) {
      console.error('Erro ao gerar chave de criptografia:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Criptografar dados
  async encryptData(data, keyName) {
    try {
      // Obter chave ativa
      const [keys] = await this.db.execute(`
        SELECT * FROM encryption_keys 
        WHERE key_name = ? AND is_active = TRUE 
        ORDER BY created_at DESC LIMIT 1
      `, [keyName]);

      if (keys.length === 0) {
        throw new Error('Chave de criptografia não encontrada');
      }

      const key = keys[0];
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher('aes-256-cbc', key.key_data);
      
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');

      return {
        success: true,
        data: {
          encrypted,
          iv: iv.toString('hex'),
          keyId: key.id
        }
      };
    } catch (error) {
      console.error('Erro ao criptografar dados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Descriptografar dados
  async decryptData(encryptedData, iv, keyName) {
    try {
      // Obter chave
      const [keys] = await this.db.execute(`
        SELECT * FROM encryption_keys 
        WHERE key_name = ? AND is_active = TRUE 
        ORDER BY created_at DESC LIMIT 1
      `, [keyName]);

      if (keys.length === 0) {
        throw new Error('Chave de criptografia não encontrada');
      }

      const key = keys[0];
      const decipher = crypto.createDecipher('aes-256-cbc', key.key_data);
      
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return {
        success: true,
        data: JSON.parse(decrypted)
      };
    } catch (error) {
      console.error('Erro ao descriptografar dados:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Obter estatísticas de segurança
  async getSecurityStats() {
    try {
      const [eventsByType] = await this.db.execute(`
        SELECT event_type, COUNT(*) as count 
        FROM security_events 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY event_type
      `);

      const [eventsBySeverity] = await this.db.execute(`
        SELECT severity, COUNT(*) as count 
        FROM security_events 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY severity
      `);

      const [topIPs] = await this.db.execute(`
        SELECT ip_address, COUNT(*) as count 
        FROM access_logs 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
        GROUP BY ip_address 
        ORDER BY count DESC 
        LIMIT 10
      `);

      const [failedLogins] = await this.db.execute(`
        SELECT COUNT(*) as count 
        FROM security_events 
        WHERE event_type = 'failed_login' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      `);

      return {
        success: true,
        data: {
          eventsByType,
          eventsBySeverity,
          topIPs,
          failedLogins: failedLogins[0].count
        }
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de segurança:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Limpeza de logs antigos
  async cleanupOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Limpar logs de acesso antigos
      const [accessResult] = await this.db.execute(`
        DELETE FROM access_logs 
        WHERE created_at < ?
      `, [cutoffDate]);

      // Limpar eventos de segurança antigos (exceto críticos)
      const [securityResult] = await this.db.execute(`
        DELETE FROM security_events 
        WHERE created_at < ? AND severity NOT IN ('critical', 'high')
      `, [cutoffDate]);

      return {
        success: true,
        data: {
          accessLogsDeleted: accessResult.affectedRows,
          securityEventsDeleted: securityResult.affectedRows
        }
      };
    } catch (error) {
      console.error('Erro na limpeza de logs:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new BackupSecurityService();
