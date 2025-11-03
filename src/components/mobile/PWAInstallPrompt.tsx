import React, { useState, useEffect } from 'react';
import { 
  X, 
  Download, 
  Smartphone, 
  Wifi, 
  Shield, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '@/hooks/usePWA';

interface PWAInstallPromptProps {
  onClose?: () => void;
  showOnDelay?: number; // Mostrar após X segundos
}

const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ 
  onClose, 
  showOnDelay = 5000 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [hasSeenPrompt, setHasSeenPrompt] = useState(false);
  
  const { 
    isInstallable, 
    isInstalled, 
    installPrompt 
  } = usePWA();

  useEffect(() => {
    // Verificar se já viu o prompt
    const hasSeen = localStorage.getItem('pwa-prompt-seen');
    if (hasSeen === 'true') {
      setHasSeenPrompt(true);
      return;
    }

    // Mostrar prompt após delay
    const timer = setTimeout(() => {
      if (isInstallable && !isInstalled && !hasSeenPrompt) {
        setIsVisible(true);
      }
    }, showOnDelay);

    return () => clearTimeout(timer);
  }, [isInstallable, isInstalled, hasSeenPrompt, showOnDelay]);

  useEffect(() => {
    // Se PWA foi instalado, esconder prompt
    if (isInstalled) {
      setIsVisible(false);
    }
  }, [isInstalled]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installPrompt();
      setIsVisible(false);
      localStorage.setItem('pwa-prompt-seen', 'true');
    } catch (error) {
      console.error('Erro ao instalar PWA:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('pwa-prompt-seen', 'true');
    if (onClose) {
      onClose();
    }
  };

  const handleDismiss = () => {
    handleClose();
  };

  if (!isVisible || isInstalled) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto animate-in slide-in-from-bottom-4 duration-300">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Instalar App</h3>
                <p className="text-sm text-gray-600">Melhor experiência mobile</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="p-2"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Wifi className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Funciona Offline</p>
                <p className="text-xs text-gray-600">Acesse produtos mesmo sem internet</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Mais Rápido</p>
                <p className="text-xs text-gray-600">Carregamento instantâneo</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Mais Seguro</p>
                <p className="text-xs text-gray-600">Dados protegidos e criptografados</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">Notificações</p>
                <p className="text-xs text-gray-600">Ofertas e atualizações em tempo real</p>
              </div>
            </div>
          </div>

          {/* Install Button */}
          <div className="space-y-3">
            <Button
              onClick={handleInstall}
              disabled={isInstalling}
              className="w-full h-12 text-base font-semibold"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Instalando...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Instalar Agora
                </>
              )}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleDismiss}
                className="flex-1"
              >
                Agora Não
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
              >
                Fechar
              </Button>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600 text-center">
              📱 O app será adicionado à sua tela inicial e funcionará como um app nativo
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PWAInstallPrompt;
