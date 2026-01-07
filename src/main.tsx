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

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
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

    // Verificar se há problemas conhecidos de SSL antes de tentar registrar
    const hasSSLIssue = location.protocol === 'https:' && 
                        (location.hostname.includes('re9suainternet.com.br') || 
                         location.hostname.includes('muhlstore'));

    if (hasSSLIssue) {
      // Tentar verificar se o certificado é válido fazendo uma requisição de teste
      fetch('/sw.js', { method: 'HEAD', cache: 'no-cache' })
        .then(() => {
          // Se a requisição funcionou, tentar registrar o SW
          registerServiceWorker();
        })
        .catch((err) => {
          console.warn('⚠️ Problema detectado com certificado SSL. Service Worker não será registrado:', err.message);
          console.info('💡 O app continuará funcionando normalmente, mas sem recursos offline.');
        });
    } else {
      registerServiceWorker();
    }

    function registerServiceWorker() {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registrado com sucesso:', registration.scope);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 Nova versão disponível! Recarregue a página.');
                  // Opcional: mostrar notificação ao usuário
                  if (confirm('Nova versão disponível! Deseja atualizar?')) {
                    newWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                }
              });
            }
          });
        })
        .catch((error) => {
          // Tratar erros específicos de SSL
          if (error.name === 'SecurityError' || 
              error.message.includes('SSL certificate') || 
              error.message.includes('certificate')) {
            console.warn('⚠️ Erro de certificado SSL ao registrar Service Worker:', error.message);
            console.info('💡 O app continuará funcionando normalmente, mas sem recursos offline.');
          } else {
            console.error('❌ Erro ao registrar Service Worker:', error);
          }
        });
    }

    // Recarregar quando novo SW assumir controle
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
