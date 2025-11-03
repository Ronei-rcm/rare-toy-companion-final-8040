
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
