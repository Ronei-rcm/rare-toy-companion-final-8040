/**
 * Logger configurado com Winston para logging estruturado
 */

const winston = require('winston');
const path = require('path');

// Formato personalizado
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para console (mais legível)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let msg = `${timestamp} [${level}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

// Criar logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  defaultMeta: { service: 'muhlstore-api' },
  transports: [
    // Logs de erro em arquivo separado
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Todos os logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Se não estiver em produção, logar também no console
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// Criar diretório de logs se não existir
const fs = require('fs');
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Helper para logar requests HTTP
logger.logRequest = (req, res, duration) => {
  logger.info('HTTP Request', {
    method: req.method,
    path: req.path,
    status: res.statusCode,
    duration: `${duration}ms`,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
};

// Helper para logar erros com contexto
logger.logError = (error, req = null) => {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    code: error.code,
  };

  if (req) {
    errorLog.method = req.method;
    errorLog.path = req.path;
    errorLog.ip = req.ip;
  }

  logger.error('Application Error', errorLog);
};

module.exports = logger;
