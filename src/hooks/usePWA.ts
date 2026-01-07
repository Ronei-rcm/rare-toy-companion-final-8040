import { useState, useEffect } from 'react';

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isStandalone: boolean;
  deferredPrompt: any;
  installPrompt: () => Promise<void>;
  updateAvailable: boolean;
  updateApp: () => void;
}

export const usePWA = (): PWAState => {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isStandalone, setIsStandalone] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Detectar se está em modo standalone (PWA instalado)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                              (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      setIsInstalled(isStandaloneMode);
    };

    checkStandalone();

    // Detectar mudanças no display mode
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = () => {
      checkStandalone();
    };

    mediaQuery.addEventListener('change', handleDisplayModeChange);

    // Detectar prompt de instalação
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Detectar se foi instalado
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    // Detectar status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Registrar event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Registrar Service Worker
    if ('serviceWorker' in navigator) {
      // Verificar se está em contexto seguro
      const isSecureContext = window.isSecureContext || 
                              location.protocol === 'https:' || 
                              location.hostname === 'localhost' || 
                              location.hostname === '127.0.0.1' ||
                              location.hostname.includes('192.168.') ||
                              location.hostname.includes('10.0.') ||
                              location.hostname.includes('172.');

      if (!isSecureContext && location.protocol !== 'http:') {
        console.warn('⚠️ Service Worker requer contexto seguro (HTTPS ou localhost).');
        return;
      }

      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          setSwRegistration(registration);
          
          // Verificar atualizações
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
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
          } else {
            console.error('Erro ao registrar Service Worker:', error);
          }
        });
    }

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installPrompt = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalado pelo usuário');
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      setDeferredPrompt(null);
    }
  };

  const updateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    isStandalone,
    deferredPrompt,
    installPrompt,
    updateAvailable,
    updateApp
  };
};