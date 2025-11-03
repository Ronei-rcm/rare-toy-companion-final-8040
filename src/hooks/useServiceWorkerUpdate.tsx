import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerUpdateState {
  isUpdateAvailable: boolean;
  isInstalling: boolean;
  isWaitingToActivate: boolean;
  registration: ServiceWorkerRegistration | null;
}

interface UseServiceWorkerUpdateReturn extends ServiceWorkerUpdateState {
  updateServiceWorker: () => Promise<void>;
  skipWaiting: () => void;
  checkForUpdates: () => Promise<void>;
}

/**
 * Hook para gerenciar atualizações do Service Worker
 * 
 * Detecta automaticamente quando há uma nova versão disponível
 * e fornece métodos para atualizar de forma controlada.
 * 
 * @example
 * ```tsx
 * const { isUpdateAvailable, updateServiceWorker } = useServiceWorkerUpdate();
 * 
 * if (isUpdateAvailable) {
 *   return <button onClick={updateServiceWorker}>Atualizar App</button>;
 * }
 * ```
 */
export function useServiceWorkerUpdate(
  autoCheckInterval: number = 60000, // Verificar a cada 1 minuto
  autoUpdate: boolean = false // Se true, atualiza automaticamente sem perguntar
): UseServiceWorkerUpdateReturn {
  const [state, setState] = useState<ServiceWorkerUpdateState>({
    isUpdateAvailable: false,
    isInstalling: false,
    isWaitingToActivate: false,
    registration: null,
  });

  /**
   * Verifica se há atualizações disponíveis
   */
  const checkForUpdates = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW Update] Service Worker não suportado');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('[SW Update] Nenhum Service Worker registrado');
        return;
      }

      console.log('[SW Update] Verificando atualizações...');
      await registration.update();
      
    } catch (error) {
      console.error('[SW Update] Erro ao verificar atualizações:', error);
    }
  }, []);

  /**
   * Força o Service Worker a pular a fase de espera e ativar imediatamente
   */
  const skipWaiting = useCallback(() => {
    const { registration } = state;
    
    if (registration?.waiting) {
      console.log('[SW Update] Enviando mensagem SKIP_WAITING');
      
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      
      // Recarregar a página após um curto delay
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [state.registration]);

  /**
   * Atualiza o Service Worker
   */
  const updateServiceWorker = useCallback(async () => {
    console.log('[SW Update] Iniciando atualização...');
    
    setState(prev => ({ ...prev, isInstalling: true }));
    
    try {
      // Se há um SW esperando, ativa ele
      if (state.registration?.waiting) {
        skipWaiting();
      } else {
        // Caso contrário, verifica por atualizações
        await checkForUpdates();
      }
    } catch (error) {
      console.error('[SW Update] Erro ao atualizar:', error);
      setState(prev => ({ ...prev, isInstalling: false }));
    }
  }, [state.registration, skipWaiting, checkForUpdates]);

  /**
   * Monitora mudanças de estado do Service Worker
   */
  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let registration: ServiceWorkerRegistration | null = null;

    const setupListeners = async () => {
      try {
        registration = await navigator.serviceWorker.getRegistration();
        
        if (!registration) {
          console.log('[SW Update] Nenhum Service Worker registrado ainda');
          return;
        }

        setState(prev => ({ ...prev, registration }));

        // Listener para quando um novo SW está instalando
        registration.addEventListener('updatefound', () => {
          console.log('[SW Update] Nova versão encontrada, instalando...');
          
          const newWorker = registration!.installing;
          
          setState(prev => ({
            ...prev,
            isInstalling: true,
            isUpdateAvailable: true,
          }));

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              console.log('[SW Update] Estado mudou para:', newWorker.state);
              
              if (newWorker.state === 'installed') {
                setState(prev => ({ ...prev, isInstalling: false }));
                
                if (navigator.serviceWorker.controller) {
                  // Há um SW ativo antigo, novo está esperando
                  console.log('[SW Update] Nova versão instalada, esperando para ativar');
                  
                  setState(prev => ({
                    ...prev,
                    isWaitingToActivate: true,
                    isUpdateAvailable: true,
                  }));

                  // Se autoUpdate está ativo, atualiza automaticamente
                  if (autoUpdate) {
                    console.log('[SW Update] Auto-update ativado, atualizando...');
                    setTimeout(() => {
                      skipWaiting();
                    }, 1000);
                  }
                } else {
                  // Primeira instalação
                  console.log('[SW Update] Service Worker instalado pela primeira vez');
                  
                  setState(prev => ({
                    ...prev,
                    isUpdateAvailable: false,
                    isWaitingToActivate: false,
                  }));
                }
              }
            });
          }
        });

        // Verificar se já há um SW esperando
        if (registration.waiting) {
          console.log('[SW Update] Service Worker já está esperando');
          
          setState(prev => ({
            ...prev,
            isUpdateAvailable: true,
            isWaitingToActivate: true,
          }));

          if (autoUpdate) {
            console.log('[SW Update] Auto-update ativado, atualizando SW em espera...');
            setTimeout(() => {
              skipWaiting();
            }, 1000);
          }
        }

        // Listener para mudanças de controller (quando SW ativa)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW Update] Controller mudou, novo SW ativo');
          
          setState(prev => ({
            ...prev,
            isUpdateAvailable: false,
            isInstalling: false,
            isWaitingToActivate: false,
          }));
        });

      } catch (error) {
        console.error('[SW Update] Erro ao configurar listeners:', error);
      }
    };

    setupListeners();

    // Verificar atualizações periodicamente
    const intervalId = setInterval(() => {
      console.log('[SW Update] Verificação periódica de atualizações');
      checkForUpdates();
    }, autoCheckInterval);

    // Verificar atualizações quando a página ganha foco
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('[SW Update] Página ganhou foco, verificando atualizações');
        checkForUpdates();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [autoCheckInterval, autoUpdate, checkForUpdates, skipWaiting]);

  return {
    ...state,
    updateServiceWorker,
    skipWaiting,
    checkForUpdates,
  };
}

