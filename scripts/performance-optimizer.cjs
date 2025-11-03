#!/usr/bin/env node

/**
 * Script para otimização de performance avançada
 * Implementa cache, compressão, minificação e outras otimizações
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('⚡ Iniciando otimização de performance...');

// 1. Otimizar imagens
console.log('\n🖼️ Otimizando imagens...');
try {
  // Verificar se sharp está disponível
  execSync('node -e "require(\'sharp\')"', { stdio: 'ignore' });
  
  const imageOptimizer = `
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '..', 'public');
  const uploadsDir = path.join(__dirname, '..', 'public', 'lovable-uploads');
  
  console.log('🔍 Buscando imagens para otimizar...');
  
  const optimizeImage = async (filePath) => {
    try {
      const outputPath = filePath.replace(/\\.(jpg|jpeg|png)$/i, '.webp');
      
      await sharp(filePath)
        .webp({ quality: 85 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toFile(outputPath);
      
      console.log(\`✅ Otimizada: \${path.basename(filePath)} -> \${path.basename(outputPath)}\`);
      
      // Remover arquivo original se for muito grande
      const stats = fs.statSync(filePath);
      if (stats.size > 500000) { // 500KB
        fs.unlinkSync(filePath);
        console.log(\`🗑️ Removido arquivo original: \${path.basename(filePath)}\`);
      }
    } catch (error) {
      console.warn(\`⚠️ Erro ao otimizar \${filePath}: \${error.message}\`);
    }
  };
  
  const processDirectory = async (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await processDirectory(filePath);
      } else if (/\.(jpg|jpeg|png)$/i.test(file)) {
        await optimizeImage(filePath);
      }
    }
  };
  
  await processDirectory(publicDir);
  await processDirectory(uploadsDir);
  
  console.log('🎉 Otimização de imagens concluída!');
}

optimizeImages().catch(console.error);
`;

  fs.writeFileSync(path.join(__dirname, 'optimize-images.js'), imageOptimizer);
  execSync('node scripts/optimize-images.js', { stdio: 'inherit' });
  console.log('✅ Imagens otimizadas');
} catch (error) {
  console.warn('⚠️ Sharp não disponível, pulando otimização de imagens');
}

// 2. Implementar cache avançado
console.log('\n💾 Implementando cache avançado...');
const cacheConfig = `
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
`;

fs.writeFileSync(path.join(__dirname, '..', 'config', 'advancedCache.cjs'), cacheConfig);
console.log('✅ Cache avançado implementado');

// 3. Implementar compressão de respostas
console.log('\n🗜️ Implementando compressão...');
const compressionMiddleware = `
const compression = require('compression');

/**
 * Middleware de compressão otimizado
 */
function setupCompression(app) {
  app.use(compression({
    level: 6, // Nível de compressão (1-9)
    threshold: 1024, // Comprimir apenas arquivos > 1KB
    filter: (req, res) => {
      // Não comprimir se já foi comprimido
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Usar compressão para todos os tipos de conteúdo
      return compression.filter(req, res);
    }
  }));
  
  console.log('✅ Middleware de compressão configurado');
}

module.exports = { setupCompression };
`;

fs.writeFileSync(path.join(__dirname, '..', 'server', 'modules', 'compression.middleware.cjs'), compressionMiddleware);
console.log('✅ Compressão implementada');

// 4. Implementar lazy loading de componentes
console.log('\n🔄 Implementando lazy loading...');
const lazyLoadingExample = `
// Exemplo de lazy loading para componentes React
import { lazy, Suspense } from 'react';

// Componentes lazy
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const CartPage = lazy(() => import('./pages/Cart'));
const CheckoutPage = lazy(() => import('./pages/Checkout'));

// Componente de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

// Wrapper com Suspense
const LazyWrapper = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

export { AdminDashboard, ProductDetail, CartPage, CheckoutPage, LazyWrapper };
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'components', 'LazyComponents.tsx'), lazyLoadingExample);
console.log('✅ Lazy loading implementado');

// 5. Implementar service worker otimizado
console.log('\n🔧 Otimizando service worker...');
const optimizedServiceWorker = `
/**
 * Service Worker Otimizado
 * Versão: 2.0.0
 */

const CACHE_NAME = 'rare-toy-v2';
const STATIC_CACHE = 'rare-toy-static-v2';
const DYNAMIC_CACHE = 'rare-toy-dynamic-v2';

// Recursos para cache estático
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/favicon.ico'
];

// Estratégias de cache
const CACHE_STRATEGIES = {
  // Cache First - para assets estáticos
  CACHE_FIRST: 'cache-first',
  // Network First - para dados dinâmicos
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate - para recursos que mudam pouco
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

// Instalar service worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 Cacheando assets estáticos...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('✅ Service Worker instalado');
        return self.skipWaiting();
      })
  );
});

// Ativar service worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker ativando...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('🗑️ Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('✅ Service Worker ativado');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Estratégia baseada no tipo de recurso
  if (request.destination === 'image') {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
  } else if (url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});

// Cache First Strategy
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first error:', error);
    return new Response('Offline', { status: 503 });
  }
}

// Network First Strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}

// Mensagens do service worker
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('⚡ Service Worker otimizado carregado');
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'sw-optimized.js'), optimizedServiceWorker);
console.log('✅ Service Worker otimizado');

// 6. Implementar monitoramento de performance
console.log('\n📊 Implementando monitoramento de performance...');
const performanceMonitor = `
/**
 * Monitor de Performance
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoad: [],
      apiCalls: [],
      errors: [],
      userInteractions: []
    };
  }

  // Medir tempo de carregamento da página
  measurePageLoad() {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.getEntriesByType('navigation')[0];
      
      const metrics = {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: this.getFirstPaint(),
        firstContentfulPaint: this.getFirstContentfulPaint()
      };
      
      this.metrics.pageLoad.push({
        ...metrics,
        timestamp: Date.now(),
        url: window.location.href
      });
      
      console.log('📊 Métricas de carregamento:', metrics);
    }
  }

  // Medir tempo de chamadas da API
  measureApiCall(url, method, duration, status) {
    this.metrics.apiCalls.push({
      url,
      method,
      duration,
      status,
      timestamp: Date.now()
    });
    
    if (duration > 3000) { // Chamadas > 3s
      console.warn('⚠️ API call lenta:', { url, duration });
    }
  }

  // Registrar erros
  recordError(error, context) {
    this.metrics.errors.push({
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      url: window.location.href
    });
  }

  // Obter métricas agregadas
  getMetrics() {
    return {
      ...this.metrics,
      summary: {
        totalPageLoads: this.metrics.pageLoad.length,
        averagePageLoadTime: this.getAveragePageLoadTime(),
        totalApiCalls: this.metrics.apiCalls.length,
        averageApiResponseTime: this.getAverageApiResponseTime(),
        errorRate: this.getErrorRate()
      }
    };
  }

  getAveragePageLoadTime() {
    if (this.metrics.pageLoad.length === 0) return 0;
    const total = this.metrics.pageLoad.reduce((sum, metric) => sum + metric.loadComplete, 0);
    return total / this.metrics.pageLoad.length;
  }

  getAverageApiResponseTime() {
    if (this.metrics.apiCalls.length === 0) return 0;
    const total = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return total / this.metrics.apiCalls.length;
  }

  getErrorRate() {
    const totalEvents = this.metrics.pageLoad.length + this.metrics.apiCalls.length;
    if (totalEvents === 0) return 0;
    return (this.metrics.errors.length / totalEvents) * 100;
  }

  getFirstPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  getFirstContentfulPaint() {
    const paintEntries = window.performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }
}

// Instância global
const performanceMonitor = new PerformanceMonitor();

// Auto-inicializar
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.measurePageLoad();
    }, 0);
  });
  
  // Interceptar erros globais
  window.addEventListener('error', (event) => {
    performanceMonitor.recordError(event.error, 'global');
  });
}

module.exports = performanceMonitor;
`;

fs.writeFileSync(path.join(__dirname, '..', 'src', 'utils', 'performanceMonitor.js'), performanceMonitor);
console.log('✅ Monitor de performance implementado');

console.log('\n🎉 Otimização de performance concluída!');
console.log('\n📋 Melhorias implementadas:');
console.log('✅ Otimização de imagens com WebP');
console.log('✅ Cache avançado (Redis + Memory)');
console.log('✅ Compressão de respostas');
console.log('✅ Lazy loading de componentes');
console.log('✅ Service Worker otimizado');
console.log('✅ Monitoramento de performance');
console.log('\n🚀 Próximos passos:');
console.log('   1. Testar performance com Lighthouse');
console.log('   2. Configurar Redis para produção');
console.log('   3. Implementar alertas de performance');
