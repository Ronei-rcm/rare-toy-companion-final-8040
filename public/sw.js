// Service Worker para MuhlStore PWA
const CACHE_NAME = 'muhlstore-v1.0.8';
const STATIC_CACHE = 'muhlstore-static-v1.0.8';
const DYNAMIC_CACHE = 'muhlstore-dynamic-v1.0.8';
const API_CACHE = 'muhlstore-api-v1.0.8';

// Detectar ambiente
const isDevelopment = self.location.hostname === 'localhost' ||
                     self.location.hostname === '127.0.0.1' ||
                     self.location.hostname.includes('192.168.') ||
                     self.location.hostname.includes('10.0.') ||
                     self.location.hostname.includes('172.') ||
                     self.location.port === '8040' ||
                     self.location.protocol === 'http:';

const isLocalhost = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Base URL para APIs
const API_BASE_URL = isDevelopment ? (isLocalhost ? 'http://localhost:8040' : '') : 'https://muhlstore.re9suainternet.com.br';
if (isDevelopment) {
  console.log('Service Worker: Ambiente detectado:', 'desenvolvimento');
  console.log('Service Worker: Hostname:', self.location.hostname, 'Port:', self.location.port, 'Protocol:', self.location.protocol);
  console.log('Service Worker: API_BASE_URL:', API_BASE_URL || 'relativo');
  console.log('Service Worker: isLocalhost:', isLocalhost, 'isDevelopment:', isDevelopment);
}

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
  if (isDevelopment) {
    console.log('Service Worker: Instalando...');
  }
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        if (isDevelopment) {
          console.log('Service Worker: Cacheando arquivos estáticos');
        }
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        if (isDevelopment) {
          console.log('Service Worker: Instalação concluída');
        }
        return self.skipWaiting();
      })
      .catch((error) => {
        if (isDevelopment) {
          console.error('Service Worker: Erro na instalação:', error);
        }
      })
  );
});

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  if (isDevelopment) {
    console.log('Service Worker: Ativando...');
  }
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              if (isDevelopment) {
                console.log('Service Worker: Removendo cache antigo:', cacheName);
              }
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(async () => {
        // Limpar respostas 404 do cache de imagens
        if (isDevelopment) {
          console.log('Service Worker: Limpando respostas 404 do cache...');
        }
        const cache = await caches.open(STATIC_CACHE);
        const keys = await cache.keys();
        let cleaned = 0;
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response && response.status === 404) {
            await cache.delete(request);
            cleaned++;
            if (isDevelopment) {
              console.log('Service Worker: Removido 404 do cache:', request.url);
            }
          }
        }
        
        if (cleaned > 0 && isDevelopment) {
          console.log(`Service Worker: ${cleaned} resposta(s) 404 removida(s) do cache`);
        }
        
        if (isDevelopment) {
          console.log('Service Worker: Ativação concluída');
        }
        return self.clients.claim();
      })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar requisições de extensões do navegador
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:' ||
      url.protocol === 'chrome-search:') {
    return; // Deixar o navegador lidar
  }

  // Estratégia para diferentes tipos de requisições
  if (request.method === 'GET') {
    try {
      if (url.pathname.startsWith('/api/')) {
        // Estratégia para APIs: Network First com fallback para cache
        event.respondWith(handleApiRequest(request).catch(err => {
          // Se houver erro não tratado, deixar o navegador lidar
          if (isDevelopment) {
            console.error('Service Worker: Erro não tratado em handleApiRequest:', err);
          }
          return fetch(request);
        }));
      } else if (isStaticFile(url.pathname)) {
        // Estratégia para arquivos estáticos: Cache First
        event.respondWith(handleStaticRequest(request).catch(err => {
          // Tratamento final de erro para evitar "Uncaught (in promise)"
          if (isDevelopment) {
            console.warn('Service Worker: Erro final em handleStaticRequest:', err);
          }
          // Deixar o navegador lidar com a requisição original
          return fetch(request).catch(() => {
            // Se até o fetch falhar, retornar 404 silencioso para não poluir o console
            return new Response('', { status: 404, statusText: 'Not Found' });
          });
        }));
      } else {
        // Estratégia para páginas: Stale While Revalidate
        event.respondWith(handlePageRequest(request).catch(err => {
          // Se houver erro não tratado, tentar fetch direto
          if (isDevelopment) {
            console.error('Service Worker: Erro não tratado em handlePageRequest:', err);
          }
          return fetch(request);
        }));
      }
    } catch (error) {
      // Erro síncrono não esperado - deixar o navegador lidar
      if (isDevelopment) {
        console.error('Service Worker: Erro síncrono no fetch:', error);
      }
    }
  } else {
    // Para requisições não-GET, sempre usar network
    event.respondWith(
      fetch(request).catch(err => {
        // Tratamento de erro para requisições não-GET
        if (isDevelopment) {
          console.warn('Service Worker: Erro em requisição não-GET:', err);
        }
        // Retornar resposta de erro apropriada
        return new Response(
          JSON.stringify({ error: 'Network error', message: err.message }),
          { status: 503, statusText: 'Service Unavailable', headers: { 'Content-Type': 'application/json' } }
        );
      })
    );
  }
});

// Estratégia para requisições de API
async function handleApiRequest(request) {
  try {
    // Se estiver em desenvolvimento, usar localhost para APIs
    let fetchUrl = request.url;
    if (isDevelopment && (request.url.startsWith('/api/') || request.url.includes('/api/'))) {
      const url = new URL(request.url);
      fetchUrl = `http://localhost:8040${url.pathname}${url.search}`;
      console.log('Service Worker: Redirecionando API para localhost:', fetchUrl);
    }

    // Tentar network primeiro
    const networkResponse = await fetch(fetchUrl);
    
    // Só cachear se for resposta OK (200-299) e não for Partial Content (206)
    if (networkResponse.ok && networkResponse.status !== 206) {
      // Cachear resposta bem-sucedida
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Silenciar erros de rede esperados para APIs (não logar excessivamente)
    // Apenas logar se for um erro inesperado ou em modo desenvolvimento
    if (isDevelopment) {
      console.log('Service Worker: Network falhou, tentando cache:', error.message || error);
    }
    
    // Fallback para cache
    let cachedResponse = null;
    try {
      cachedResponse = await caches.match(request);
    } catch (cacheErr) {
      // Erro ao acessar cache - ignorar silenciosamente
    }
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
  const url = new URL(request.url);

  // Se estiver em desenvolvimento e for arquivo de upload, redirecionar para localhost
  let fetchUrl = request.url;
  if (isDevelopment && (url.pathname.startsWith('/lovable-uploads/') || url.pathname.startsWith('/uploads/'))) {
    fetchUrl = `http://localhost:8040${url.pathname}${url.search}`;
    console.log('Service Worker: Redirecionando upload para localhost:', fetchUrl);
  }
  
  // Ignorar fontes externas conhecidas para evitar logs de 404 (ex: rsms Inter)
  if (url.hostname === 'rsms.me') {
    return fetch(request);
  }

  // Ignorar URLs de extensões do Chrome e outros esquemas não suportados
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'moz-extension:' || 
      url.protocol === 'safari-extension:') {
    // Não tentar cachear extensões do navegador
    return fetch(request).catch(() => new Response('', { status: 404 }));
  }
  
  let cachedResponse = null;
  try {
    cachedResponse = await caches.match(request);
  } catch (err) {
    // Se houver erro ao acessar cache, continuar normalmente
    if (isDevelopment) {
      console.warn('Service Worker: Erro ao acessar cache:', err);
    }
  }
  
  // Se houver cache, verificar se não é 404
  if (cachedResponse) {
    // Se for 404 em cache, remover do cache e buscar novamente
    if (cachedResponse.status === 404) {
      if (isDevelopment) {
        console.log('Service Worker: Removendo 404 do cache e tentando novamente:', request.url);
      }
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.delete(request);
      } catch (cacheErr) {
        // Erro ao remover do cache - continuar normalmente
      }
    } else {
      // Retornar cache válido
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(fetchUrl);
    
    // Detectar se é vídeo ou arquivo de mídia
    const pathname = url.pathname.toLowerCase();
    const isVideo = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v)$/i.test(pathname);
    const isMedia = isVideo || /\.(mp3|wav|ogg|aac|flac|m4a)$/i.test(pathname);
    
    // Só cachear se for resposta OK (200-299), não for extensão, não for Partial Content (206)
    // e não for arquivo de mídia (vídeos e áudios usam streaming e não devem ser cacheados)
    // Respostas 206 são usadas para streaming de vídeos e não podem ser cacheadas
    if (networkResponse.ok && 
        networkResponse.status !== 206 && 
        !isMedia &&
        url.protocol.startsWith('http')) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
      if (isDevelopment) {
        console.log('Service Worker: Arquivo estático cacheado:', request.url);
      }
    } else if (networkResponse.status === 206 || isMedia) {
      // Para vídeos e respostas 206, apenas retornar sem cachear (silenciosamente)
      return networkResponse;
      } else if (!networkResponse.ok) {
      // Se for 404 em imagens ou uploads, não logar (é esperado quando arquivos não existem)
      // Detectar imagens de várias formas para garantir precisão
      const acceptHeader = request.headers ? request.headers.get('accept') : null;
      
      // Detecção robusta de imagens
      const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp)$/i.test(pathname);
      const isLovableUploadsImage = pathname.includes('/lovable-uploads/') && 
                                    /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp)/i.test(pathname);
      const isUploadPath = pathname.includes('/lovable-uploads/') || pathname.includes('/uploads/');
      
      const isImage = 
        request.destination === 'image' || 
        (acceptHeader && acceptHeader.includes('image/')) ||
        hasImageExtension ||
        isLovableUploadsImage;
      
      // Só logar se NÃO for uma imagem/upload 404 (silenciosamente ignorar 404s)
      const isImageOrUpload404 = (isImage || isUploadPath) && networkResponse.status === 404;
      if (!isImageOrUpload404 && isDevelopment) {
        console.warn('Service Worker: Arquivo não encontrado (não será cacheado):', request.url);
      }
      // Para imagens/uploads 404: não logar, não cachear, apenas deixar passar silenciosamente
    }
    
    return networkResponse;
  } catch (error) {
    // Verificar se é uma imagem ou arquivo de upload que provavelmente não existe
    const pathname = url.pathname.toLowerCase();
    const isImage = /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp)$/i.test(pathname);
    const isLovableUploads = pathname.includes('/lovable-uploads/') || pathname.includes('/uploads/');
    
    // Para imagens de upload que falharam, retornar cache se existir, senão deixar falhar silenciosamente
    if (isImage || isLovableUploads) {
      let fallbackCache = null;
      try {
        fallbackCache = await caches.match(request);
      } catch (cacheErr) {
        // Erro ao acessar cache - ignorar silenciosamente
      }
      
      if (fallbackCache && fallbackCache.status !== 404) {
        return fallbackCache;
      }
      // Se não há cache válido, deixar falhar silenciosamente (imagem não existe)
      // Não logar, não tentar fetch novamente - apenas retornar 404 silenciosamente
      return new Response('', { status: 404, statusText: 'Not Found' });
    }
    
    // Para outros arquivos estáticos, tentar cache antes de deixar falhar
    let fallbackCache = null;
    try {
      fallbackCache = await caches.match(request);
    } catch (cacheErr) {
      // Erro ao acessar cache - ignorar silenciosamente
    }
    
    if (fallbackCache && fallbackCache.status !== 404) {
      return fallbackCache;
    }
    
    // Para outros tipos de arquivo, tentar fetch com tratamento de erro
    try {
      return await fetch(request);
    } catch (fetchErr) {
      // Se fetch também falhar, retornar 404 silenciosamente
      return new Response('', { status: 404, statusText: 'Not Found' });
    }
  }
}

// Estratégia para páginas
async function handlePageRequest(request) {
  try {
    // Tentar network primeiro (páginas já são servidas corretamente em desenvolvimento)
    const networkResponse = await fetch(request);
    
    // Só cachear se for resposta OK (200-299) e não for Partial Content (206)
    if (networkResponse.ok && networkResponse.status !== 206) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Silenciar erros de rede esperados para páginas (não logar excessivamente)
    // Apenas logar em desenvolvimento ou se for um erro inesperado
    if (isDevelopment) {
      console.log('Service Worker: Network falhou, tentando cache:', error.message || error);
    }
    
    // Fallback para cache
    let cachedResponse = null;
    try {
      cachedResponse = await caches.match(request);
    } catch (cacheErr) {
      // Erro ao acessar cache - ignorar silenciosamente
    }
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Se não há cache, tentar página offline
    let offlinePage = null;
    try {
      offlinePage = await caches.match('/offline.html');
    } catch (cacheErr) {
      // Erro ao acessar cache - ignorar silenciosamente
    }
    
    return offlinePage || new Response('Página offline', { status: 503 });
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
      if (isDevelopment) {
        console.log('Service Worker: Mensagem desconhecida:', type);
      }
  }
});

// Cachear URLs específicas
async function cacheUrls(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  for (const url of urls) {
    try {
      const response = await fetch(url);
      // Não cachear respostas 206 (Partial Content) ou arquivos de mídia
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      const isMedia = /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v|mp3|wav|aac|flac|m4a)$/i.test(pathname);
      
      if (response.ok && response.status !== 206 && !isMedia) {
        await cache.put(url, response);
        if (isDevelopment) {
          console.log('Service Worker: URL cacheada:', url);
        }
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('Service Worker: Erro ao cachear URL:', url, error);
      }
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
  
  if (isDevelopment) {
    console.log(`Service Worker: Cache ${cacheName} limpo`);
  }
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
  if (isDevelopment) {
    console.log('Service Worker: Push recebido:', event);
  }
  
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
  if (isDevelopment) {
    console.log('Service Worker: Clique em notificação:', event);
  }
  
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
  if (isDevelopment) {
    console.log('Service Worker: Sync em background:', event.tag);
  }
  
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
    
    if (isDevelopment) {
      console.log('Service Worker: Sincronização em background concluída');
    }
  } catch (error) {
    if (isDevelopment) {
      console.error('Service Worker: Erro na sincronização em background:', error);
    }
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
        if (isDevelopment) {
          console.log('Service Worker: Carrinho offline sincronizado');
        }
      }
    } catch (error) {
      if (isDevelopment) {
        console.error('Service Worker: Erro ao sincronizar carrinho:', error);
      }
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
        if (isDevelopment) {
          console.log('Service Worker: Dados do usuário sincronizados');
        }
      }
    }
  } catch (error) {
    if (isDevelopment) {
      console.error('Service Worker: Erro ao sincronizar dados do usuário:', error);
    }
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
  if (isDevelopment) {
    console.log('Service Worker: PWA pode ser instalado');
  }
  
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
  if (isDevelopment) {
    console.log('Service Worker: PWA instalado');
  }
  
  // Notificar cliente sobre instalação
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PWA_INSTALLED'
      });
    });
  });
});

// Função de debug para desenvolvimento
self.debugServiceWorker = () => {
  console.log('🔧 Service Worker Debug:');
  console.log('- Ambiente:', isDevelopment ? 'desenvolvimento' : 'produção');
  console.log('- API_BASE_URL:', API_BASE_URL || 'relativo');
  console.log('- Localização:', self.location.href);
  console.log('- Versão:', CACHE_NAME);
};

if (isDevelopment) {
  console.log('Service Worker: Carregado e pronto!');
  console.log('💡 Execute debugServiceWorker() no console para informações de debug');
}