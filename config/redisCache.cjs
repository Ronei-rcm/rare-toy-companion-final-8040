/**
 * Redis Cache Service
 * Cache de produtos, sessões e dados frequentes
 */

const Redis = require('ioredis');
const logger = require('./logger.cjs');

let redisClient = null;
let isRedisAvailable = false;

/**
 * Inicializar cliente Redis
 */
function initializeRedis() {
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
    maxRetriesPerRequest: 3,
  };

  try {
    redisClient = new Redis(config);

    redisClient.on('connect', () => {
      logger.info('Redis conectado com sucesso');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      logger.error('Erro no Redis', { error: err.message });
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      logger.warn('Conexão Redis fechada');
      isRedisAvailable = false;
    });

    return true;
  } catch (error) {
    logger.error('Falha ao inicializar Redis', { error: error.message });
    return false;
  }
}

/**
 * Verificar se Redis está disponível
 */
function isAvailable() {
  return isRedisAvailable && redisClient !== null;
}

/**
 * Obter valor do cache
 */
async function get(key) {
  if (!isAvailable()) return null;

  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Erro ao ler do cache', { key, error: error.message });
    return null;
  }
}

/**
 * Definir valor no cache
 */
async function set(key, value, ttl = 3600) {
  if (!isAvailable()) return false;

  try {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redisClient.setex(key, ttl, serialized);
    } else {
      await redisClient.set(key, serialized);
    }
    return true;
  } catch (error) {
    logger.error('Erro ao escrever no cache', { key, error: error.message });
    return false;
  }
}

/**
 * Deletar valor do cache
 */
async function del(key) {
  if (!isAvailable()) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    logger.error('Erro ao deletar do cache', { key, error: error.message });
    return false;
  }
}

/**
 * Deletar múltiplas chaves por padrão
 */
async function delPattern(pattern) {
  if (!isAvailable()) return 0;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
      return keys.length;
    }
    return 0;
  } catch (error) {
    logger.error('Erro ao deletar padrão do cache', { pattern, error: error.message });
    return 0;
  }
}

/**
 * Incrementar valor
 */
async function incr(key, ttl = 3600) {
  if (!isAvailable()) return 0;

  try {
    const value = await redisClient.incr(key);
    if (ttl && value === 1) {
      await redisClient.expire(key, ttl);
    }
    return value;
  } catch (error) {
    logger.error('Erro ao incrementar no cache', { key, error: error.message });
    return 0;
  }
}

/**
 * Cache de função (memoização com TTL)
 */
function cacheFunction(keyPrefix, fn, ttl = 3600) {
  return async (...args) => {
    // Gerar chave baseada nos argumentos
    const cacheKey = `${keyPrefix}:${JSON.stringify(args)}`;

    // Tentar obter do cache
    const cached = await get(cacheKey);
    if (cached !== null) {
      logger.debug('Cache hit', { key: cacheKey });
      return cached;
    }

    // Executar função
    logger.debug('Cache miss', { key: cacheKey });
    const result = await fn(...args);

    // Armazenar no cache
    await set(cacheKey, result, ttl);

    return result;
  };
}

/**
 * Middleware Express para cache de rotas
 */
function cacheMiddleware(ttl = 60) {
  return async (req, res, next) => {
    if (!isAvailable() || req.method !== 'GET') {
      return next();
    }

    const cacheKey = `route:${req.originalUrl}`;

    try {
      const cached = await get(cacheKey);
      if (cached) {
        logger.debug('Route cache hit', { url: req.originalUrl });
        return res.json(cached);
      }

      // Interceptar res.json para cachear a resposta
      const originalJson = res.json.bind(res);
      res.json = (data) => {
        set(cacheKey, data, ttl).catch(err => 
          logger.error('Erro ao cachear resposta', { error: err.message })
        );
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error('Erro no middleware de cache', { error: error.message });
      next();
    }
  };
}

/**
 * Limpar todo o cache
 */
async function flushAll() {
  if (!isAvailable()) return false;

  try {
    await redisClient.flushdb();
    logger.info('Cache limpo completamente');
    return true;
  } catch (error) {
    logger.error('Erro ao limpar cache', { error: error.message });
    return false;
  }
}

/**
 * Obter estatísticas do Redis
 */
async function getStats() {
  if (!isAvailable()) {
    return { available: false };
  }

  try {
    const info = await redisClient.info('stats');
    const dbsize = await redisClient.dbsize();

    return {
      available: true,
      dbsize,
      info,
    };
  } catch (error) {
    logger.error('Erro ao obter stats do Redis', { error: error.message });
    return { available: false, error: error.message };
  }
}

/**
 * Gerenciar sessões de usuário
 */
async function setSession(sessionId, data, ttl = 86400) {
  return await set(`session:${sessionId}`, data, ttl); // 24h padrão
}

async function getSession(sessionId) {
  return await get(`session:${sessionId}`);
}

async function deleteSession(sessionId) {
  return await del(`session:${sessionId}`);
}

/**
 * Gerenciar carrinho de compras
 */
async function setCart(cartId, data, ttl = 604800) {
  return await set(`cart:${cartId}`, data, ttl); // 7 dias padrão
}

async function getCart(cartId) {
  return await get(`cart:${cartId}`);
}

async function deleteCart(cartId) {
  return await del(`cart:${cartId}`);
}

module.exports = {
  initializeRedis,
  isAvailable,
  get,
  set,
  del,
  delPattern,
  incr,
  cacheFunction,
  cacheMiddleware,
  flushAll,
  getStats,
  setSession,
  getSession,
  deleteSession,
  setCart,
  getCart,
  deleteCart,
  client: () => redisClient,
};
