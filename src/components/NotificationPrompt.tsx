import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Gift, ShoppingCart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export function NotificationPrompt() {
  const { isSupported, isSubscribed, permission, requestPermission } = usePushNotifications();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Não mostrar se não suportado ou já inscrito
    if (!isSupported || isSubscribed || permission === 'denied') {
      return;
    }

    // Verificar se usuário já dispensou
    const isDismissed = localStorage.getItem('notification-prompt-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Mostrar após 45 segundos (depois do PWA prompt)
    const timer = setTimeout(() => {
      if (!dismissed && permission === 'default') {
        setShowPrompt(true);
      }
    }, 45000);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission, dismissed]);

  const handleEnable = async () => {
    const granted = await requestPermission();
    if (granted) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('notification-prompt-dismissed', 'true');
  };

  // Não renderizar se já inscrito ou não suportado
  if (!isSupported || isSubscribed || dismissed || permission === 'denied') {
    return null;
  }

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed bottom-20 right-4 w-96 max-w-[calc(100vw-2rem)] z-50"
        >
          <Card className="p-5 bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-2xl border-0">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-white/80 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-4 mb-4">
              <div className="bg-white/20 p-3 rounded-lg backdrop-blur-sm">
                <Bell className="w-7 h-7 animate-pulse" />
              </div>

              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">
                  Ative as notificações!
                </h3>
                <p className="text-sm text-white/90">
                  Receba alertas sobre ofertas imperdíveis e atualizações dos seus pedidos
                </p>
              </div>
            </div>

            {/* Benefícios */}
            <div className="space-y-2 mb-5 pl-1">
              <div className="flex items-center gap-2 text-sm">
                <Gift className="w-4 h-4" />
                <span>Ofertas e cupons exclusivos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4" />
                <span>Alertas de carrinho abandonado</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4" />
                <span>Produtos em promoção</span>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                size="sm"
                className="flex-1 bg-white text-purple-600 hover:bg-white/90 font-semibold"
              >
                <Bell className="w-4 h-4 mr-2" />
                Ativar Agora
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
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

