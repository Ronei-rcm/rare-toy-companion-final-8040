import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface OfflineIndicatorProps {
  onRetry?: () => void;
  showDetails?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  onRetry,
  showDetails = true,
  autoHide = true,
  hideDelay = 3000
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isVisible, setIsVisible] = useState(!navigator.onLine);
  const [retryCount, setRetryCount] = useState(0);
  const [lastOnlineTime, setLastOnlineTime] = useState<Date | null>(null);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(new Date());
      setRetryCount(0);
      
      if (autoHide) {
        setTimeout(() => {
          setIsVisible(false);
        }, hideDelay);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsVisible(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoHide, hideDelay]);

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryCount(prev => prev + 1);

    try {
      // Tentar fazer uma requisição simples
      const response = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });

      if (response.ok) {
        setIsOnline(true);
        setLastOnlineTime(new Date());
        setRetryCount(0);
        
        if (autoHide) {
          setTimeout(() => {
            setIsVisible(false);
          }, hideDelay);
        }
      } else {
        throw new Error('Resposta não OK');
      }
    } catch (error) {
      console.log('Tentativa de reconexão falhou:', error);
      
      // Mostrar erro temporariamente
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    }

    if (onRetry) {
      onRetry();
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  const formatLastOnlineTime = () => {
    if (!lastOnlineTime) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - lastOnlineTime.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes} min atrás`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    
    const days = Math.floor(hours / 24);
    return `${days}d atrás`;
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4">
      <Card className={`shadow-lg border-0 ${
        isOnline 
          ? 'bg-green-50 border-green-200' 
          : 'bg-red-50 border-red-200'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isOnline 
                  ? 'bg-green-100' 
                  : 'bg-red-100'
              }`}>
                {isOnline ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-600" />
                )}
              </div>
              
              <div>
                <p className={`font-medium text-sm ${
                  isOnline ? 'text-green-800' : 'text-red-800'
                }`}>
                  {isOnline ? 'Conectado novamente!' : 'Você está offline'}
                </p>
                
                {showDetails && (
                  <p className={`text-xs ${
                    isOnline ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isOnline 
                      ? 'Sua conexão foi restaurada' 
                      : 'Verifique sua conexão com a internet'
                    }
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isOnline && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className={`text-xs ${
                    isRetrying ? 'opacity-50' : ''
                  }`}
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Tentando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Tentar
                    </>
                  )}
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          {showDetails && !isOnline && (
            <div className="mt-3 pt-3 border-t border-red-200">
              <div className="flex items-center justify-between text-xs text-red-600">
                <span>Tentativas: {retryCount}</span>
                <span>Última conexão: {formatLastOnlineTime()}</span>
              </div>
              
              <div className="mt-2 p-2 bg-red-100 rounded text-xs text-red-700">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Funcionalidades limitadas offline</span>
                </div>
              </div>
            </div>
          )}

          {/* Online Status Details */}
          {showDetails && isOnline && (
            <div className="mt-3 pt-3 border-t border-green-200">
              <div className="flex items-center gap-2 text-xs text-green-600">
                <Wifi className="w-3 h-3" />
                <span>Conexão restaurada às {lastOnlineTime?.toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OfflineIndicator;
