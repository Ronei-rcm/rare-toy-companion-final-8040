// Service Worker para MuhlStore PWA
const CACHE_NAME = 'muhlstore-v1.0.0';
const STATIC_CACHE = 'muhlstore-static-v1.0.0';
const DYNAMIC_CACHE = 'muhlstore-dynamic-v1.0.0';
const API_CACHE = 'muhlstore-api-v1.0.0';

// Arquivos estáticos para cache
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html'
];

// URLs da API para cache
const API_URLS = [
  '/api/produtos',
  '/api/categorias',
  '/api/usuarios/profile',
  '/api/carrinho'
];

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Cacheando arquivos estáticos');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Service Worker: Instalação concluída');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Erro na instalação:', error);
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Ativação concluída');
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Estratégia para diferentes tipos de requisições
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // Estratégia para APIs: Network First com fallback para cache
      event.respondWith(handleApiRequest(request));
    } else if (isStaticFile(url.pathname)) {
      // Estratégia para arquivos estáticos: Cache First
      event.respondWith(handleStaticRequest(request));
    } else {
      // Estratégia para páginas: Stale While Revalidate
      event.respondWith(handlePageRequest(request));
    }
  } else {
    // Para requisições não-GET, sempre usar network
    event.respondWith(fetch(request));
  }
});

// Estratégia para requisições de API
async function handleApiRequest(request) {
  try {
    // Tentar network primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear resposta bem-sucedida
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network falhou, tentando cache:', error);
    
    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não há cache, retornar página offline
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'Você está offline. Algumas funcionalidades podem estar limitadas.' 
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Estratégia para arquivos estáticos
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Erro ao buscar arquivo estático:', error);
    return new Response('Arquivo não encontrado', { status: 404 });
  }
}

// Estratégia para páginas
async function handlePageRequest(request) {
  try {
    // Tentar network primeiro
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network falhou, tentando cache:', error);
    
    // Fallback para cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não há cache, retornar página offline
    return caches.match('/offline.html');
  }
}

// Verificar se é arquivo estático
function isStaticFile(pathname) {
  return pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$/);
}

// Interceptar mensagens do cliente
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_URLS':
      cacheUrls(payload.urls);
      break;
      
    case 'CLEAR_CACHE':
      clearCache(payload.cacheName);
      break;
      
    case 'GET_CACHE_SIZE':
      getCacheSize().then(size => {
        event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
      });
      break;
      
    default:
      console.log('Service Worker: Mensagem desconhecida:', type);
  }
});

// Cachear URLs específicas
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('Service Worker: URL cacheada:', url);
      }
    } catch (error) {
      console.error('Service Worker: Erro ao cachear URL:', url, error);
    }
  }
}

// Limpar cache específico
async function clearCache(cacheName) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  for (const key of keys) {
    await cache.delete(key);
  }
  
  console.log(`Service Worker: Cache ${cacheName} limpo`);
}

// Obter tamanho do cache
async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }
  
  return totalSize;
}

// Interceptar notificações push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push recebido:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação da MuhlStore',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Ver ofertas',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/action-close.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };
  
  event.waitUntil(
    self.registration.showNotification('MuhlStore', options)
  );
});

// Interceptar cliques em notificações
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clique em notificação:', event);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/ofertas')
    );
  } else if (event.action === 'close') {
    // Apenas fechar a notificação
  } else {
    // Clique na notificação principal
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Interceptar sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync em background:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Sincronização em background
async function doBackgroundSync() {
  try {
    // Sincronizar carrinho offline
    await syncOfflineCart();
    
    // Sincronizar dados do usuário
    await syncUserData();
    
    console.log('Service Worker: Sincronização em background concluída');
  } catch (error) {
    console.error('Service Worker: Erro na sincronização em background:', error);
  }
}

// Sincronizar carrinho offline
async function syncOfflineCart() {
  const offlineCart = await getOfflineCart();
  
  if (offlineCart && offlineCart.length > 0) {
    try {
      const response = await fetch('/api/carrinho/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify({ items: offlineCart })
      });
      
      if (response.ok) {
        await clearOfflineCart();
        console.log('Service Worker: Carrinho offline sincronizado');
      }
    } catch (error) {
      console.error('Service Worker: Erro ao sincronizar carrinho:', error);
    }
  }
}

// Sincronizar dados do usuário
async function syncUserData() {
  try {
    const userData = await getOfflineUserData();
    
    if (userData) {
      const response = await fetch('/api/usuarios/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getAuthToken()}`
        },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        await clearOfflineUserData();
        console.log('Service Worker: Dados do usuário sincronizados');
      }
    }
  } catch (error) {
    console.error('Service Worker: Erro ao sincronizar dados do usuário:', error);
  }
}

// Funções auxiliares para dados offline
async function getOfflineCart() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = await cache.match('/offline-cart');
  return response ? await response.json() : null;
}

async function clearOfflineCart() {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.delete('/offline-cart');
}

async function getOfflineUserData() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = await cache.match('/offline-user-data');
  return response ? await response.json() : null;
}

async function clearOfflineUserData() {
  const cache = await caches.open(DYNAMIC_CACHE);
  await cache.delete('/offline-user-data');
}

async function getAuthToken() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const response = await cache.match('/auth-token');
  return response ? await response.text() : null;
}

// Interceptar instalação do PWA
self.addEventListener('beforeinstallprompt', (event) => {
  console.log('Service Worker: PWA pode ser instalado');
  
  // Prevenir instalação automática
  event.preventDefault();
  
  // Armazenar evento para uso posterior
  self.deferredPrompt = event;
  
  // Notificar cliente sobre disponibilidade de instalação
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_INSTALLABLE',
        event: event
      });
    });
  });
});

// Interceptar appinstalled
self.addEventListener('appinstalled', (event) => {
  console.log('Service Worker: PWA instalado');
  
  // Notificar cliente sobre instalação
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_INSTALLED'
      });
    });
  });
});

console.log('Service Worker: Carregado e pronto!');