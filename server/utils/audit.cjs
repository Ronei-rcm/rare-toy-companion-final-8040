/**
 * Sistema de Auditoria
 * Registra todas as ações administrativas para rastreabilidade e segurança
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

let pool = null;

// Inicializar pool de conexões
function getPool() {
  if (!pool) {
    try {
      const { pool: serverPool } = require('../database/mysql');
      pool = serverPool;
    } catch (error) {
      // Tentar pegar do server.cjs se disponível
      const serverModule = require('../server.cjs');
      if (serverModule && serverModule.locals && serverModule.locals.pool) {
        pool = serverModule.locals.pool;
      } else {
        // Usar pool global se disponível
        pool = global.pool;
      }
    }
  }
  return pool;
}

/**
 * Sanitiza dados sensíveis antes de salvar no log
 * @param {object} data - Dados a serem sanitizados
 * @returns {object} Dados sanitizados
 */
function sanitizeAuditData(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }
  
  const sensitiveFields = [
    'password', 'senha', 'senha_hash',
    'token', 'access_token', 'refresh_token',
    'api_key', 'secret', 'secret_key',
    'credit_card', 'card_number', 'cvv',
    'cpf', 'cnpj', 'rg'
  ];
  
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  // Limitar tamanho de strings longas
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string' && sanitized[key].length > 1000) {
      sanitized[key] = sanitized[key].substring(0, 1000) + '... [TRUNCATED]';
    }
  }
  
  return sanitized;
}

/**
 * Registra uma ação no log de auditoria
 * @param {object} options - Opções de auditoria
 * @param {number} options.userId - ID do usuário admin
 * @param {string} options.userEmail - Email do usuário
 * @param {string} options.action - Tipo de ação (create, update, delete, etc)
 * @param {string} options.resourceType - Tipo de recurso (product, order, etc)
 * @param {string} options.resourceId - ID do recurso
 * @param {object} options.req - Objeto request do Express
 * @param {object} options.res - Objeto response do Express (opcional)
 * @param {object} options.metadata - Metadados adicionais
 */
async function logAudit({
  userId,
  userEmail,
  action,
  resourceType,
  resourceId = null,
  req = null,
  res = null,
  metadata = {}
}) {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      console.warn('⚠️ Pool de conexões não disponível para auditoria');
      return;
    }
    
    // Extrair informações da requisição
    const ipAddress = req?.ip || req?.connection?.remoteAddress || req?.headers['x-forwarded-for']?.split(',')[0] || null;
    const userAgent = req?.headers['user-agent'] || null;
    const requestMethod = req?.method || null;
    const requestPath = req?.path || req?.url || null;
    
    // Sanitizar dados sensíveis
    const requestBody = req?.body ? sanitizeAuditData(req.body) : null;
    const responseStatus = res?.statusCode || null;
    const responseBody = res?.locals?.responseData ? sanitizeAuditData(res.locals.responseData) : null;
    
    // Preparar metadados
    const auditMetadata = {
      ...metadata,
      timestamp: new Date().toISOString()
    };
    
    // Inserir no banco
    await dbPool.execute(
      `INSERT INTO audit_logs (
        user_id, user_email, action, resource_type, resource_id,
        ip_address, user_agent, request_method, request_path,
        request_body, response_status, response_body, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        userEmail,
        action,
        resourceType,
        resourceId,
        ipAddress,
        userAgent,
        requestMethod,
        requestPath,
        requestBody ? JSON.stringify(requestBody) : null,
        responseStatus,
        responseBody ? JSON.stringify(responseBody) : null,
        JSON.stringify(auditMetadata)
      ]
    );
    
  } catch (error) {
    // Não falhar a requisição se o log falhar
    console.error('❌ Erro ao registrar log de auditoria:', error);
  }
}

/**
 * Middleware para capturar resposta e registrar auditoria
 * @param {string} action - Tipo de ação
 * @param {string} resourceType - Tipo de recurso
 */
function auditMiddleware(action, resourceType) {
  return async (req, res, next) => {
    // Capturar resposta original
    const originalJson = res.json.bind(res);
    const originalSend = res.send.bind(res);
    
    // Interceptar resposta
    res.json = function(data) {
      res.locals.responseData = data;
      return originalJson(data);
    };
    
    res.send = function(data) {
      res.locals.responseData = data;
      return originalSend(data);
    };
    
    // Registrar auditoria após resposta
    res.on('finish', async () => {
      const userId = req.adminUser?.id || null;
      const userEmail = req.adminUser?.email || null;
      
      // Extrair resource_id do body ou params
      const resourceId = req.body?.id || req.params?.id || req.body?.product_id || req.body?.order_id || null;
      
      await logAudit({
        userId,
        userEmail,
        action,
        resourceType,
        resourceId: resourceId ? String(resourceId) : null,
        req,
        res,
        metadata: {
          params: req.params,
          query: req.query
        }
      });
    });
    
    next();
  };
}

/**
 * Buscar logs de auditoria
 * @param {object} filters - Filtros de busca
 * @returns {Promise<Array>} Array de logs
 */
async function getAuditLogs(filters = {}) {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Pool de conexões não disponível');
    }
    
    const {
      userId = null,
      action = null,
      resourceType = null,
      resourceId = null,
      startDate = null,
      endDate = null,
      limit = 100,
      offset = 0
    } = filters;
    
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    
    if (userId) {
      query += ' AND user_id = ?';
      params.push(userId);
    }
    
    if (action) {
      query += ' AND action = ?';
      params.push(action);
    }
    
    if (resourceType) {
      query += ' AND resource_type = ?';
      params.push(resourceType);
    }
    
    if (resourceId) {
      query += ' AND resource_id = ?';
      params.push(resourceId);
    }
    
    if (startDate) {
      query += ' AND created_at >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND created_at <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const [logs] = await dbPool.execute(query, params);
    
    // Parse JSON fields
    return logs.map(log => ({
      ...log,
      request_body: log.request_body ? JSON.parse(log.request_body) : null,
      response_body: log.response_body ? JSON.parse(log.response_body) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null
    }));
    
  } catch (error) {
    console.error('❌ Erro ao buscar logs de auditoria:', error);
    throw error;
  }
}

/**
 * Limpar logs antigos (manter apenas últimos N dias)
 * @param {number} daysToKeep - Número de dias para manter
 */
async function cleanOldAuditLogs(daysToKeep = 90) {
  try {
    const dbPool = getPool();
    if (!dbPool) {
      throw new Error('Pool de conexões não disponível');
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const [result] = await dbPool.execute(
      'DELETE FROM audit_logs WHERE created_at < ?',
      [cutoffDate]
    );
    
    console.log(`✅ Limpeza de logs: ${result.affectedRows} registros removidos`);
    return result.affectedRows;
    
  } catch (error) {
    console.error('❌ Erro ao limpar logs antigos:', error);
    throw error;
  }
}

module.exports = {
  logAudit,
  auditMiddleware,
  getAuditLogs,
  cleanOldAuditLogs,
  sanitizeAuditData
};

