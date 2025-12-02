/**
 * Helpers de Cache para Endpoints Críticos
 * Funções auxiliares para cachear dados frequentes
 */

const redisCache = require('../../config/redisCache.cjs');

/**
 * Cache de produtos ativos
 * TTL: 5 minutos
 */
async function getCachedProducts(filters = {}) {
  const { status = 'ativo', categoriaId = null, limit = 20, offset = 0 } = filters;
  
  const cacheKey = `products:${status}:${categoriaId || 'all'}:${limit}:${offset}`;
  
  // Tentar buscar do cache
  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  
  return null; // Cache miss
}

async function setCachedProducts(filters, products) {
  const { status = 'ativo', categoriaId = null, limit = 20, offset = 0 } = filters;
  
  const cacheKey = `products:${status}:${categoriaId || 'all'}:${limit}:${offset}`;
  
  // Cachear por 5 minutos
  await redisCache.set(cacheKey, products, 300);
}

/**
 * Invalidar cache de produtos
 */
async function invalidateProductsCache() {
  await redisCache.delPattern('products:*');
}

/**
 * Cache de categorias
 * TTL: 30 minutos (mudam raramente)
 */
async function getCachedCategories() {
  const cacheKey = 'categories:all';
  return await redisCache.get(cacheKey);
}

async function setCachedCategories(categories) {
  const cacheKey = 'categories:all';
  await redisCache.set(cacheKey, categories, 1800); // 30 minutos
}

async function invalidateCategoriesCache() {
  await redisCache.del('categories:all');
}

/**
 * Cache de produto individual
 * TTL: 10 minutos
 */
async function getCachedProduct(productId) {
  const cacheKey = `product:${productId}`;
  return await redisCache.get(cacheKey);
}

async function setCachedProduct(productId, product) {
  const cacheKey = `product:${productId}`;
  await redisCache.set(cacheKey, product, 600); // 10 minutos
}

async function invalidateProductCache(productId) {
  await redisCache.del(`product:${productId}`);
  // Também invalidar listas
  await invalidateProductsCache();
}

/**
 * Cache de pedidos do cliente
 * TTL: 2 minutos (dados mais dinâmicos)
 */
async function getCachedCustomerOrders(customerId, filters = {}) {
  const { status = null, limit = 50, offset = 0 } = filters;
  const cacheKey = `orders:customer:${customerId}:${status || 'all'}:${limit}:${offset}`;
  return await redisCache.get(cacheKey);
}

async function setCachedCustomerOrders(customerId, filters, orders) {
  const { status = null, limit = 50, offset = 0 } = filters;
  const cacheKey = `orders:customer:${customerId}:${status || 'all'}:${limit}:${offset}`;
  await redisCache.set(cacheKey, orders, 120); // 2 minutos
}

async function invalidateCustomerOrdersCache(customerId) {
  await redisCache.delPattern(`orders:customer:${customerId}:*`);
}

/**
 * Cache de estatísticas do dashboard
 * TTL: 1 minuto (dados muito dinâmicos)
 */
async function getCachedDashboardStats(period = '30') {
  const cacheKey = `stats:dashboard:${period}`;
  return await redisCache.get(cacheKey);
}

async function setCachedDashboardStats(period, stats) {
  const cacheKey = `stats:dashboard:${period}`;
  await redisCache.set(cacheKey, stats, 60); // 1 minuto
}

async function invalidateDashboardStatsCache() {
  await redisCache.delPattern('stats:dashboard:*');
}

/**
 * Cache de configurações
 * TTL: 1 hora (mudam raramente)
 */
async function getCachedSettings() {
  const cacheKey = 'settings:all';
  return await redisCache.get(cacheKey);
}

async function setCachedSettings(settings) {
  const cacheKey = 'settings:all';
  await redisCache.set(cacheKey, settings, 3600); // 1 hora
}

async function invalidateSettingsCache() {
  await redisCache.del('settings:all');
}

/**
 * Cache de cupons ativos
 * TTL: 15 minutos
 */
async function getCachedActiveCoupons() {
  const cacheKey = 'coupons:active';
  return await redisCache.get(cacheKey);
}

async function setCachedActiveCoupons(coupons) {
  const cacheKey = 'coupons:active';
  await redisCache.set(cacheKey, coupons, 900); // 15 minutos
}

async function invalidateCouponsCache() {
  await redisCache.del('coupons:active');
}

/**
 * Cache de carrinho
 * TTL: 1 hora (já existe no redisCache, mas adicionamos helpers)
 */
async function getCachedCart(cartId) {
  return await redisCache.getCart(cartId);
}

async function setCachedCart(cartId, cartData) {
  await redisCache.setCart(cartId, cartData, 3600); // 1 hora
}

/**
 * Wrapper para cachear função assíncrona
 */
function withCache(keyPrefix, fn, ttl = 300) {
  return async (...args) => {
    // Gerar chave baseada nos argumentos
    const argsKey = args.length > 0 
      ? JSON.stringify(args).replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50)
      : 'default';
    const cacheKey = `${keyPrefix}:${argsKey}`;
    
    // Tentar cache
    if (redisCache.isAvailable()) {
      const cached = await redisCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }
    
    // Executar função
    const result = await fn(...args);
    
    // Cachear resultado
    if (redisCache.isAvailable()) {
      await redisCache.set(cacheKey, result, ttl);
    }
    
    return result;
  };
}

module.exports = {
  // Produtos
  getCachedProducts,
  setCachedProducts,
  invalidateProductsCache,
  getCachedProduct,
  setCachedProduct,
  invalidateProductCache,
  
  // Categorias
  getCachedCategories,
  setCachedCategories,
  invalidateCategoriesCache,
  
  // Pedidos
  getCachedCustomerOrders,
  setCachedCustomerOrders,
  invalidateCustomerOrdersCache,
  
  // Estatísticas
  getCachedDashboardStats,
  setCachedDashboardStats,
  invalidateDashboardStatsCache,
  
  // Configurações
  getCachedSettings,
  setCachedSettings,
  invalidateSettingsCache,
  
  // Cupons
  getCachedActiveCoupons,
  setCachedActiveCoupons,
  invalidateCouponsCache,
  
  // Carrinho
  getCachedCart,
  setCachedCart,
  
  // Utilitário
  withCache
};

