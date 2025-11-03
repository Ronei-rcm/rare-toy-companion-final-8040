import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw, X, Download } from 'lucide-react';
import { useServiceWorkerUpdate } from '@/hooks/useServiceWorkerUpdate';

interface ServiceWorkerUpdatePromptProps {
  /**
   * Se true, atualiza automaticamente após delay (sem perguntar ao usuário)
   * @default false
   */
  autoUpdate?: boolean;
  
  /**
   * Intervalo em ms para verificar atualizações
   * @default 60000 (1 minuto)
   */
  checkInterval?: number;
  
  /**
   * Delay em ms antes de atualizar automaticamente (se autoUpdate = true)
   * @default 3000 (3 segundos)
   */
  autoUpdateDelay?: number;
  
  /**
   * Mostrar toast de notificação quando atualização estiver disponível
   * @default true
   */
  showToast?: boolean;
}

/**
 * Componente que gerencia atualizações do Service Worker
 * 
 * Mostra notificação quando há nova versão disponível e permite
 * que o usuário atualize de forma controlada.
 * 
 * @example
 * ```tsx
 * // No Layout principal
 * <ServiceWorkerUpdatePrompt showToast={true} autoUpdate={false} />
 * ```
 */
export function ServiceWorkerUpdatePrompt({
  autoUpdate = false,
  checkInterval = 60000,
  autoUpdateDelay = 3000,
  showToast = true,
}: ServiceWorkerUpdatePromptProps) {
  const {
    isUpdateAvailable,
    isInstalling,
    isWaitingToActivate,
    updateServiceWorker,
  } = useServiceWorkerUpdate(checkInterval, autoUpdate);

  const [toastId, setToastId] = useState<string | number | null>(null);
  const [hasShownToast, setHasShownToast] = useState(false);

  /**
   * Mostra toast de notificação quando atualização está disponível
   */
  useEffect(() => {
    if (!showToast || !isUpdateAvailable || hasShownToast) {
      return;
    }

    const handleUpdate = () => {
      updateServiceWorker();
      if (toastId) {
        toast.dismiss(toastId);
      }
    };

    const handleDismiss = () => {
      if (toastId) {
        toast.dismiss(toastId);
      }
      setHasShownToast(true);
    };

    // Se autoUpdate está ativo, mostrar countdown
    if (autoUpdate && isWaitingToActivate) {
      let countdown = Math.floor(autoUpdateDelay / 1000);
      
      const id = toast.info(
        <div className="flex flex-col gap-2 pr-8">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span className="font-semibold">Nova versão disponível!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Atualizando automaticamente em {countdown}s...
          </p>
        </div>,
        {
          duration: autoUpdateDelay,
          action: {
            label: 'Atualizar Agora',
            onClick: handleUpdate,
          },
        }
      );
      
      setToastId(id);
      setHasShownToast(true);
      
      // Countdown
      const countdownInterval = setInterval(() => {
        countdown--;
        if (countdown > 0) {
          toast.info(
            <div className="flex flex-col gap-2 pr-8">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                <span className="font-semibold">Nova versão disponível!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Atualizando automaticamente em {countdown}s...
              </p>
            </div>,
            {
              id,
              duration: autoUpdateDelay,
            }
          );
        } else {
          clearInterval(countdownInterval);
        }
      }, 1000);
      
      return () => clearInterval(countdownInterval);
    }

    // Toast manual (usuário decide quando atualizar)
    if (!autoUpdate && isWaitingToActivate) {
      const id = toast.success(
        <div className="flex flex-col gap-2 pr-8">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-green-500" />
            <span className="font-semibold">Nova versão disponível! 🎉</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Clique em "Atualizar" para usar a versão mais recente
          </p>
        </div>,
        {
          duration: Infinity, // Não fecha automaticamente
          action: {
            label: 'Atualizar',
            onClick: handleUpdate,
          },
          cancel: {
            label: <X className="w-4 h-4" />,
            onClick: handleDismiss,
          },
        }
      );
      
      setToastId(id);
      setHasShownToast(true);
    }

    // Toast durante instalação
    if (isInstalling && !isWaitingToActivate) {
      const id = toast.loading(
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Baixando atualização...</span>
        </div>,
        {
          duration: Infinity,
        }
      );
      
      setToastId(id);
      
      return () => {
        if (id) {
          toast.dismiss(id);
        }
      };
    }
  }, [
    isUpdateAvailable,
    isInstalling,
    isWaitingToActivate,
    autoUpdate,
    autoUpdateDelay,
    showToast,
    hasShownToast,
    toastId,
    updateServiceWorker,
  ]);

  /**
   * Resetar flag quando atualização for concluída
   */
  useEffect(() => {
    if (!isUpdateAvailable && !isInstalling) {
      setHasShownToast(false);
      if (toastId) {
        toast.dismiss(toastId);
        setToastId(null);
      }
    }
  }, [isUpdateAvailable, isInstalling, toastId]);

  // Componente não renderiza nada visualmente
  // Tudo é gerenciado via toasts
  return null;
}

/**
 * Componente de botão para verificar atualizações manualmente
 */
export function UpdateButton() {
  const { isUpdateAvailable, isInstalling, updateServiceWorker, checkForUpdates } = 
    useServiceWorkerUpdate(60000, false);

  const handleClick = () => {
    if (isUpdateAvailable) {
      updateServiceWorker();
    } else {
      checkForUpdates();
      toast.info('Verificando atualizações...', {
        duration: 2000,
      });
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={isInstalling}
      className="gap-2"
    >
      <RefreshCw className={`w-4 h-4 ${isInstalling ? 'animate-spin' : ''}`} />
      {isUpdateAvailable ? 'Atualizar App' : 'Verificar Atualizações'}
    </Button>
  );
}

