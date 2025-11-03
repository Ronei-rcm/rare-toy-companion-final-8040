/**
 * Sistema de Monitoramento e Alertas Robusto
 */

const winston = require('winston');
const nodemailer = require('nodemailer');
const axios = require('axios');

class MonitoringSystem {
  constructor() {
    this.setupLogger();
    this.setupEmailAlerts();
    this.setupHealthChecks();
    this.setupMetrics();
  }

  // Configurar logger estruturado
  setupLogger() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      defaultMeta: { service: 'muhlstore-api' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
        })
      ]
    });
  }

  // Configurar alertas por email
  setupEmailAlerts() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  // Configurar health checks
  setupHealthChecks() {
    this.healthChecks = {
      database: { status: 'unknown', lastCheck: null, responseTime: null },
      redis: { status: 'unknown', lastCheck: null, responseTime: null },
      api: { status: 'unknown', lastCheck: null, responseTime: null },
      disk: { status: 'unknown', lastCheck: null, responseTime: null },
      memory: { status: 'unknown', lastCheck: null, responseTime: null }
    };

    // Executar health checks a cada 30 segundos
    setInterval(() => this.runHealthChecks(), 30000);
  }

  // Configurar métricas
  setupMetrics() {
    this.metrics = {
      requests: { total: 0, errors: 0, avgResponseTime: 0 },
      database: { queries: 0, slowQueries: 0, connectionErrors: 0 },
      memory: { used: 0, free: 0, heapUsed: 0 },
      errors: { total: 0, byType: {} },
      uptime: Date.now()
    };
  }

  // Executar health checks
  async runHealthChecks() {
    const checks = [
      this.checkDatabase(),
      this.checkRedis(),
      this.checkApi(),
      this.checkDiskSpace(),
      this.checkMemory()
    ];

    const results = await Promise.allSettled(checks);
    
    results.forEach((result, index) => {
      const checkName = Object.keys(this.healthChecks)[index];
      if (result.status === 'fulfilled') {
        this.healthChecks[checkName] = result.value;
      } else {
        this.healthChecks[checkName] = {
          status: 'error',
          lastCheck: new Date(),
          error: result.reason.message
        };
      }
    });

    // Verificar se algum serviço está com problemas
    this.checkForAlerts();
  }

  // Health check do banco de dados
  async checkDatabase() {
    const startTime = Date.now();
    try {
      const pool = require('./database.cjs').pool;
      await pool.execute('SELECT 1');
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  // Health check do Redis
  async checkRedis() {
    const startTime = Date.now();
    try {
      if (process.env.REDIS_HOST) {
        const Redis = require('ioredis');
        const redis = new Redis({
          host: process.env.REDIS_HOST,
          port: process.env.REDIS_PORT || 6379,
          password: process.env.REDIS_PASSWORD,
          db: process.env.REDIS_DB || 0,
          lazyConnect: true,
          maxRetriesPerRequest: 1
        });
        
        await redis.ping();
        redis.disconnect();
        
        return {
          status: 'healthy',
          lastCheck: new Date(),
          responseTime: Date.now() - startTime
        };
      } else {
        return {
          status: 'disabled',
          lastCheck: new Date(),
          responseTime: 0
        };
      }
    } catch (error) {
      return {
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  // Health check da API
  async checkApi() {
    const startTime = Date.now();
    try {
      const response = await axios.get(`http://localhost:${process.env.SERVER_PORT || 3001}/api/health`, {
        timeout: 5000
      });
      
      return {
        status: response.status === 200 ? 'healthy' : 'error',
        lastCheck: new Date(),
        responseTime: Date.now() - startTime,
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }

  // Health check do espaço em disco
  async checkDiskSpace() {
    try {
      const fs = require('fs');
      const stats = fs.statSync('.');
      const freeSpace = require('fs').statSync('.').dev;
      
      // Simulação de verificação de espaço em disco
      const diskUsage = process.memoryUsage();
      
      return {
        status: 'healthy',
        lastCheck: new Date(),
        responseTime: 0,
        freeSpace: 'N/A' // Implementar verificação real de espaço em disco
      };
    } catch (error) {
      return {
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
        responseTime: 0
      };
    }
  }

  // Health check da memória
  async checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMem = require('os').totalmem();
    const freeMem = require('os').freemem();
    const memUsagePercent = ((totalMem - freeMem) / totalMem) * 100;
    
    return {
      status: memUsagePercent > 90 ? 'warning' : 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      usagePercent: memUsagePercent,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal
    };
  }

  // Verificar alertas
  checkForAlerts() {
    const alerts = [];
    
    // Verificar serviços com erro
    Object.entries(this.healthChecks).forEach(([service, status]) => {
      if (status.status === 'error') {
        alerts.push({
          type: 'service_down',
          service,
          message: `${service} está com erro: ${status.error}`,
          severity: 'critical'
        });
      }
    });

    // Verificar uso de memória
    const memoryCheck = this.healthChecks.memory;
    if (memoryCheck.status === 'warning') {
      alerts.push({
        type: 'high_memory_usage',
        message: `Uso de memória alto: ${memoryCheck.usagePercent.toFixed(1)}%`,
        severity: 'warning'
      });
    }

    // Verificar tempo de resposta
    Object.entries(this.healthChecks).forEach(([service, status]) => {
      if (status.responseTime && status.responseTime > 5000) {
        alerts.push({
          type: 'slow_response',
          service,
          message: `${service} está lento: ${status.responseTime}ms`,
          severity: 'warning'
        });
      }
    });

    // Enviar alertas se necessário
    if (alerts.length > 0) {
      this.sendAlerts(alerts);
    }
  }

  // Enviar alertas
  async sendAlerts(alerts) {
    alerts.forEach(alert => {
      this.logger.error('ALERTA:', alert);
      
      // Enviar email se configurado
      if (this.emailTransporter && alert.severity === 'critical') {
        this.sendEmailAlert(alert);
      }
    });
  }

  // Enviar alerta por email
  async sendEmailAlert(alert) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.ADMIN_EMAIL || process.env.SMTP_USER,
        subject: `🚨 Alerta Crítico - MuhlStore API`,
        html: `
          <h2>🚨 Alerta Crítico Detectado</h2>
          <p><strong>Tipo:</strong> ${alert.type}</p>
          <p><strong>Serviço:</strong> ${alert.service || 'N/A'}</p>
          <p><strong>Mensagem:</strong> ${alert.message}</p>
          <p><strong>Severidade:</strong> ${alert.severity}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          
          <h3>Status dos Serviços:</h3>
          <ul>
            ${Object.entries(this.healthChecks).map(([service, status]) => 
              `<li><strong>${service}:</strong> ${status.status}</li>`
            ).join('')}
          </ul>
          
          <p>Verifique o sistema imediatamente.</p>
        `
      };

      await this.emailTransporter.sendMail(mailOptions);
      this.logger.info('Email de alerta enviado');
    } catch (error) {
      this.logger.error('Erro ao enviar email de alerta:', error);
    }
  }

  // Registrar métricas
  recordMetric(type, value) {
    if (!this.metrics[type]) {
      this.metrics[type] = {};
    }
    
    this.metrics[type] = {
      ...this.metrics[type],
      ...value,
      timestamp: Date.now()
    };
  }

  // Obter status geral
  getStatus() {
    const allHealthy = Object.values(this.healthChecks).every(check => 
      check.status === 'healthy' || check.status === 'disabled'
    );

    return {
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.metrics.uptime,
      healthChecks: this.healthChecks,
      metrics: this.metrics
    };
  }

  // Middleware para logging de requests
  requestLogger(req, res, next) {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      this.recordMetric('requests', {
        total: this.metrics.requests.total + 1,
        errors: res.statusCode >= 400 ? this.metrics.requests.errors + 1 : this.metrics.requests.errors
      });

      this.logger.info('Request', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Log de requests lentos
      if (duration > 3000) {
        this.logger.warn('Slow request', {
          method: req.method,
          url: req.url,
          duration
        });
      }
    });

    next();
  }
}

// Instância global
const monitoringSystem = new MonitoringSystem();

module.exports = monitoringSystem;
