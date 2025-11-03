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
        console.error('❌ Erro ao registrar Service Worker:', error);
      });

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
