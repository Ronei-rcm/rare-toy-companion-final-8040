import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function PWAInstallPrompt() {
  const { isInstallable, promptInstall } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Verificar se usuário já dispensou o prompt
    const isDismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Mostrar prompt após 30 segundos de navegação
    const timer = setTimeout(() => {
      if (isInstallable && !dismissed) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [isInstallable, dismissed]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-prompt-dismissed', 'true');
  };

  if (!isInstallable || dismissed) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50"
        >
          <Card className="p-4 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-2xl border-0">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Smartphone className="w-8 h-8" />
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  Instale nosso app!
                </h3>
                <p className="text-sm text-white/90 mb-4">
                  Acesso rápido, notificações de ofertas e funciona offline!
                </p>

                <div className="flex gap-2">
                  <Button
                    onClick={handleInstall}
                    size="sm"
                    className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Instalar Agora
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                  >
                    Depois
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/20">
              <div className="flex items-center justify-between text-xs text-white/80">
                <span>✨ Funciona offline</span>
                <span>🔔 Notificações</span>
                <span>⚡ Mais rápido</span>
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

