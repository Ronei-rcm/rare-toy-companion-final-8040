
/**
 * Configuração de cache avançado
 */

const NodeCache = require('node-cache');
const redis = require('ioredis');

// Cache em memória para desenvolvimento
const memoryCache = new NodeCache({
  stdTTL: 600, // 10 minutos
  checkperiod: 120, // 2 minutos
  useClones: false
});

// Cache Redis para produção
let redisClient = null;
if (process.env.REDIS_HOST) {
  redisClient = new redis({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3
  });
}

class CacheService {
  constructor() {
    this.isRedisAvailable = redisClient && redisClient.status === 'ready';
  }

  async get(key) {
    try {
      if (this.isRedisAvailable) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        return memoryCache.get(key);
      }
    } catch (error) {
      console.warn('Cache get error:', error.message);
      return null;
    }
  }

  async set(key, value, ttl = 600) {
    try {
      if (this.isRedisAvailable) {
        await redisClient.setex(key, ttl, JSON.stringify(value));
      } else {
        memoryCache.set(key, value, ttl);
      }
    } catch (error) {
      console.warn('Cache set error:', error.message);
    }
  }

  async del(key) {
    try {
      if (this.isRedisAvailable) {
        await redisClient.del(key);
      } else {
        memoryCache.del(key);
      }
    } catch (error) {
      console.warn('Cache delete error:', error.message);
    }
  }

  async clear() {
    try {
      if (this.isRedisAvailable) {
        await redisClient.flushdb();
      } else {
        memoryCache.flushAll();
      }
    } catch (error) {
      console.warn('Cache clear error:', error.message);
    }
  }
}

module.exports = new CacheService();
