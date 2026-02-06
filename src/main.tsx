import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/accessibility.css'

// Handler global de erro para debug
window.addEventListener('error', (event) => {
  console.error('🚨 ERRO GLOBAL CAPTURADO:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error,
    stack: event.error?.stack
  });
  
  // Se for o erro de undefined.length, vamos investigar mais
  if (event.message.includes('Cannot read properties of undefined (reading \'length\')')) {
    console.error('🔍 ERRO DE UNDEFINED.LENGTH DETECTADO!');
    console.error('Stack trace completo:', event.error?.stack);
    
    // Tentar identificar o componente que está causando o erro
    const stackLines = event.error?.stack?.split('\n') || [];
    console.error('Linhas do stack trace:', stackLines);
  }
});

// Handler para erros não capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 PROMISE REJECTION NÃO CAPTURADA:', event.reason);
});

// Detectar navegador para compatibilidade
function detectBrowser() {
  const userAgent = navigator.userAgent.toLowerCase();
  const isEdge = userAgent.includes('edg/') || userAgent.includes('edge/');
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isSafariIOS = /iphone|ipad|ipod/.test(userAgent) && /safari/i.test(userAgent);
  const isChrome = userAgent.includes('chrome') && !isEdge;
  const isAndroid = userAgent.includes('android');
  const isSamsung = userAgent.includes('samsung') || userAgent.includes('sm-');
  const isSamsungBrowser = userAgent.includes('samsungbrowser');
  const isGalaxy = isSamsung || userAgent.includes('galaxy');
  const isGoogleApp = userAgent.includes('googleapp') || (isChrome && isAndroid);
  
  return {
    isEdge,
    isSafari,
    isSafariIOS,
    isChrome,
    isAndroid,
    isSamsung,
    isSamsungBrowser,
    isGalaxy,
    isGoogleApp,
    userAgent
  };
}

// Registrar Service Worker para PWA (compatível com Edge, Safari iOS e Google App)
if ('serviceWorker' in navigator) {
  const browser = detectBrowser();
  
  window.addEventListener('load', () => {
    // Verificar se está em contexto seguro (HTTPS ou localhost)
    const isSecureContext = window.isSecureContext || 
                            location.protocol === 'https:' || 
                            location.hostname === 'localhost' || 
                            location.hostname === '127.0.0.1' ||
                            location.hostname.includes('192.168.') ||
                            location.hostname.includes('10.0.') ||
                            location.hostname.includes('172.');

    if (!isSecureContext && location.protocol !== 'http:') {
      console.warn('⚠️ Service Worker requer contexto seguro (HTTPS ou localhost). Pulando registro.');
      return;
    }

    const isDev = import.meta.env?.DEV ?? (process.env.NODE_ENV === 'development');
    if (isDev) {
      if (browser.isSafariIOS) console.info('📱 Safari iOS - SW será registrado se suportado.');
      if (browser.isEdge) console.info('🌐 Edge - Service Worker será registrado.');
      if (browser.isGoogleApp) console.info('📲 Google App - Service Worker será registrado.');
      if (browser.isGalaxy || browser.isSamsungBrowser) console.info('📱 Samsung - Service Worker será registrado.');
      if (browser.isAndroid && !browser.isSamsung) console.info('🤖 Android - Service Worker será registrado.');
    }

    // Verificar se há problemas conhecidos de SSL antes de tentar registrar
    const hasSSLIssue = location.protocol === 'https:' && 
                        (location.hostname.includes('re9suainternet.com.br') || 
                         location.hostname.includes('muhlstore'));

    if (hasSSLIssue) {
      // Tentar verificar se o certificado é válido fazendo uma requisição de teste
      // Usar timeout para não bloquear
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout
      
      fetch('/sw.js', { 
        method: 'HEAD', 
        cache: 'no-cache',
        signal: controller.signal
      })
        .then(() => {
          clearTimeout(timeoutId);
          // Se a requisição funcionou, tentar registrar o SW
          registerServiceWorker(browser);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          // Se for erro de SSL/certificado, apenas avisar sem tentar registrar
          if (err.name === 'SecurityError' || 
              err.message?.includes('SSL') || 
              err.message?.includes('certificate') ||
              err.name === 'AbortError') {
            // Timeout ou erro de SSL - não tentar registrar
            if (err.name === 'AbortError') {
              registerServiceWorker(browser);
            } else {
              if (import.meta.env?.DEV ?? process.env.NODE_ENV === 'development') {
                console.warn('⚠️ SSL: Service Worker não registrado. App funciona normalmente. Renove o certificado no servidor para PWA offline.');
              }
            }
          } else {
            // Outro tipo de erro - tentar registrar mesmo assim
            registerServiceWorker(browser);
          }
        });
    } else {
      registerServiceWorker(browser);
    }

    function registerServiceWorker(browserInfo: ReturnType<typeof detectBrowser>) {
      // Configurações específicas por navegador
      const swOptions: ServiceWorkerRegistrationOptions = {
        scope: '/',
        // Para Safari iOS, usar updateViaCache mais conservador
        ...(browserInfo.isSafariIOS && { updateViaCache: 'none' })
      };

      navigator.serviceWorker
        .register('/sw.js', swOptions)
        .then((registration) => {
          const browserName = browserInfo.isEdge ? 'Edge' : 
                             browserInfo.isSafariIOS ? 'Safari iOS' : 
                             browserInfo.isGalaxy ? 'Samsung Galaxy' :
                             browserInfo.isSamsungBrowser ? 'Samsung Browser' :
                             browserInfo.isGoogleApp ? 'Google App' : 
                             browserInfo.isAndroid ? 'Android' :
                             'Chrome';
          console.log(`✅ Service Worker registrado com sucesso (${browserName}):`, registration.scope);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 Nova versão disponível! Recarregue a página.');
                  // Opcional: mostrar notificação ao usuário (apenas em desktop, não em mobile)
                  if (!browserInfo.isSafariIOS && !browserInfo.isAndroid && confirm('Nova versão disponível! Deseja atualizar?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          // Tratar erros específicos de SSL e compatibilidade
          const errorMessage = error?.message || error?.toString() || 'Erro desconhecido';
          const errorName = error?.name || '';
          
          if (errorName === 'SecurityError' || 
              errorMessage.includes('SSL certificate') || 
              errorMessage.includes('certificate') ||
              errorMessage.includes('SSL certificate error')) {
            if (import.meta.env?.DEV ?? process.env.NODE_ENV === 'development') {
              console.warn('⚠️ SSL: Service Worker não registrado. App funciona normalmente. Renove o certificado no servidor para PWA offline.');
            }
          } else if (browserInfo.isSafariIOS && errorMessage.includes('not supported')) {
            console.warn('⚠️ Service Worker não suportado nesta versão do Safari iOS.');
            console.info('💡 Atualize para iOS 11.3+ para suporte completo a PWA.');
          } else {
            // Outros erros - logar mas não bloquear
            console.warn('⚠️ Erro ao registrar Service Worker (não crítico):', errorMessage);
            if (process.env.NODE_ENV === 'development') {
              console.error('Detalhes do erro:', error);
            }
          }
        });
    }

    // Recarregar quando novo SW assumir controle (mas não em Safari iOS para evitar loops)
    if (!browser.isSafariIOS) {
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    }
  });
}

createRoot(document.getElementById("root")!).render(<App />);
