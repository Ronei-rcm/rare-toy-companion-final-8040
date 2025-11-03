const express = require('express');
const router = express.Router();
const backupSecurityService = require('../services/backupSecurityService.cjs');

// Middleware de autenticação simples
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ success: false, message: 'Token de acesso necessário' });
  }
  next();
};

// Middleware para logging de acesso
const logAccess = async (req, res, next) => {
  const startTime = Date.now();
  
  // Interceptar resposta
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Registrar log de acesso
    backupSecurityService.logAccess({
      user_id: req.user?.id || null,
      session_id: req.sessionID || null,
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method,
      status_code: res.statusCode,
      response_time_ms: responseTime,
      request_size: req.get('Content-Length') || 0,
      response_size: Buffer.byteLength(data, 'utf8')
    });
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Aplicar middleware de logging
router.use(logAccess);

// ===== SISTEMA DE BACKUP =====

// Criar job de backup
router.post('/backup/jobs', authenticateToken, async (req, res) => {
  try {
    const result = await backupSecurityService.createBackupJob({
      ...req.body,
      created_by: req.user?.id || 'admin'
    });
    res.json(result);
  } catch (error) {
    console.error('Erro ao criar job de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar jobs de backup
router.get('/backup/jobs', authenticateToken, async (req, res) => {
  try {
    const filters = {
      is_active: req.query.is_active,
      backup_type: req.query.backup_type
    };

    const result = await backupSecurityService.getBackupJobs(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar jobs de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Executar backup
router.post('/backup/jobs/:jobId/execute', authenticateToken, async (req, res) => {
  try {
    const { jobId } = req.params;
    const result = await backupSecurityService.executeBackup(jobId, req.user?.id);
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Executar backups agendados
router.post('/backup/execute-scheduled', async (req, res) => {
  try {
    const result = await backupSecurityService.executeScheduledBackups();
    res.json(result);
  } catch (error) {
    console.error('Erro ao executar backups agendados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Listar execuções de backup
router.get('/backup/executions', authenticateToken, async (req, res) => {
  try {
    const filters = {
      job_id: req.query.job_id,
      status: req.query.status,
      limit: req.query.limit
    };

    const result = await backupSecurityService.getBackupExecutions(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao listar execuções de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== SISTEMA DE SEGURANÇA =====

// Registrar evento de segurança
router.post('/security/events', async (req, res) => {
  try {
    const result = await backupSecurityService.logSecurityEvent(req.body);
    res.json(result);
  } catch (error) {
    console.error('Erro ao registrar evento de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter eventos de segurança
router.get('/security/events', authenticateToken, async (req, res) => {
  try {
    const filters = {
      event_type: req.query.event_type,
      severity: req.query.severity,
      user_id: req.query.user_id,
      ip_address: req.query.ip_address,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit
    };

    const result = await backupSecurityService.getSecurityEvents(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter eventos de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter logs de acesso
router.get('/security/access-logs', authenticateToken, async (req, res) => {
  try {
    const filters = {
      user_id: req.query.user_id,
      ip_address: req.query.ip_address,
      endpoint: req.query.endpoint,
      status_code: req.query.status_code,
      date_from: req.query.date_from,
      date_to: req.query.date_to,
      limit: req.query.limit
    };

    const result = await backupSecurityService.getAccessLogs(filters);
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter logs de acesso:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter estatísticas de segurança
router.get('/security/stats', authenticateToken, async (req, res) => {
  try {
    const result = await backupSecurityService.getSecurityStats();
    res.json(result);
  } catch (error) {
    console.error('Erro ao obter estatísticas de segurança:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== SISTEMA DE CRIPTOGRAFIA =====

// Gerar chave de criptografia
router.post('/encryption/keys', authenticateToken, async (req, res) => {
  try {
    const { key_name, key_type = 'aes', expires_in_days = 365 } = req.body;
    
    const result = await backupSecurityService.generateEncryptionKey(
      key_name, 
      key_type, 
      expires_in_days
    );
    res.json(result);
  } catch (error) {
    console.error('Erro ao gerar chave de criptografia:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Criptografar dados
router.post('/encryption/encrypt', authenticateToken, async (req, res) => {
  try {
    const { data, key_name } = req.body;
    
    const result = await backupSecurityService.encryptData(data, key_name);
    res.json(result);
  } catch (error) {
    console.error('Erro ao criptografar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Descriptografar dados
router.post('/encryption/decrypt', authenticateToken, async (req, res) => {
  try {
    const { encrypted_data, iv, key_name } = req.body;
    
    const result = await backupSecurityService.decryptData(encrypted_data, iv, key_name);
    res.json(result);
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== UTILITÁRIOS =====

// Limpeza de logs antigos
router.post('/cleanup/logs', authenticateToken, async (req, res) => {
  try {
    const { days_to_keep = 90 } = req.body;
    
    const result = await backupSecurityService.cleanupOldLogs(days_to_keep);
    res.json(result);
  } catch (error) {
    console.error('Erro na limpeza de logs:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Verificar integridade de backup
router.post('/backup/verify', authenticateToken, async (req, res) => {
  try {
    const { file_path } = req.body;
    
    // Verificar se arquivo existe
    const fs = require('fs').promises;
    const crypto = require('crypto');
    
    try {
      const fileStats = await fs.stat(file_path);
      const fileData = await fs.readFile(file_path);
      const checksum = crypto.createHash('sha256').update(fileData).digest('hex');
      
      res.json({
        success: true,
        data: {
          exists: true,
          size: fileStats.size,
          checksum,
          last_modified: fileStats.mtime
        }
      });
    } catch (fileError) {
      res.json({
        success: false,
        error: 'Arquivo não encontrado ou inacessível'
      });
    }
  } catch (error) {
    console.error('Erro ao verificar integridade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Obter status do sistema
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const fs = require('fs').promises;
    const os = require('os');
    
    // Informações do sistema
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
      uptime: os.uptime(),
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    };
    
    // Verificar espaço em disco
    const diskUsage = await new Promise((resolve) => {
      require('child_process').exec('df -h /', (error, stdout) => {
        if (error) {
          resolve({ error: error.message });
        } else {
          const lines = stdout.trim().split('\n');
          const data = lines[1].split(/\s+/);
          resolve({
            total: data[1],
            used: data[2],
            available: data[3],
            percentage: data[4]
          });
        }
      });
    });
    
    // Estatísticas de backup
    const backupStats = await backupSecurityService.getBackupExecutions({ limit: 10 });
    
    // Estatísticas de segurança
    const securityStats = await backupSecurityService.getSecurityStats();
    
    res.json({
      success: true,
      data: {
        system: systemInfo,
        disk: diskUsage,
        recentBackups: backupStats.data || [],
        securityStats: securityStats.data || {}
      }
    });
  } catch (error) {
    console.error('Erro ao obter status do sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// ===== RELATÓRIOS DE SEGURANÇA =====

// Relatório de tentativas de login
router.get('/reports/login-attempts', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, limit = 100 } = req.query;
    
    let query = `
      SELECT 
        se.ip_address,
        se.user_agent,
        se.created_at,
        se.details,
        COUNT(*) as attempt_count
      FROM security_events se
      WHERE se.event_type IN ('login', 'failed_login')
    `;
    
    const params = [];
    
    if (date_from) {
      query += ' AND se.created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND se.created_at <= ?';
      params.push(date_to);
    }
    
    query += `
      GROUP BY se.ip_address, se.user_agent, DATE(se.created_at)
      ORDER BY attempt_count DESC, se.created_at DESC
      LIMIT ?
    `;
    
    params.push(parseInt(limit));
    
    const [rows] = await backupSecurityService.db.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter relatório de tentativas de login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatório de atividade suspeita
router.get('/reports/suspicious-activity', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        se.*,
        al.endpoint,
        al.method,
        al.status_code
      FROM security_events se
      LEFT JOIN access_logs al ON se.ip_address = al.ip_address 
        AND DATE(se.created_at) = DATE(al.created_at)
      WHERE se.severity IN ('high', 'critical')
    `;
    
    const params = [];
    
    if (date_from) {
      query += ' AND se.created_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND se.created_at <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY se.created_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [rows] = await backupSecurityService.db.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter relatório de atividade suspeita:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

// Relatório de performance de backup
router.get('/reports/backup-performance', authenticateToken, async (req, res) => {
  try {
    const { date_from, date_to, limit = 50 } = req.query;
    
    let query = `
      SELECT 
        bj.name as job_name,
        be.status,
        be.backup_size,
        be.duration_seconds,
        be.started_at,
        be.completed_at,
        be.error_message
      FROM backup_executions be
      LEFT JOIN backup_jobs bj ON be.job_id = bj.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (date_from) {
      query += ' AND be.started_at >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND be.started_at <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY be.started_at DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [rows] = await backupSecurityService.db.execute(query, params);
    
    res.json({
      success: true,
      data: rows
    });
  } catch (error) {
    console.error('Erro ao obter relatório de performance de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
