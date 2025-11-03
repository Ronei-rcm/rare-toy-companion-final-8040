import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, ShoppingBag, X, Clock, Gift } from 'lucide-react';
import { useCartRecovery } from '@/hooks/useCartRecovery';
import { useCart } from '@/contexts/CartContext';
import { cn } from '@/lib/utils';

interface CartRecoveryPushNotificationProps {
  className?: string;
}

const CartRecoveryPushNotification: React.FC<CartRecoveryPushNotificationProps> = ({ className }) => {
  const { recoveryData, restoreCart, clearRecoveryData } = useCartRecovery();
  const { setCartOpen } = useCart();
  const [showNotification, setShowNotification] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Verificar permissão de notificação
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Mostrar notificação quando há carrinho abandonado
  useEffect(() => {
    if (!recoveryData || recoveryData.itemCount === 0) return;

    const timeAgo = Date.now() - recoveryData.lastActivity;
    const shouldShow = timeAgo > 300000; // 5 minutos

    if (shouldShow && notificationPermission === 'granted') {
      showBrowserNotification();
    } else if (shouldShow) {
      setShowNotification(true);
    }
  }, [recoveryData, notificationPermission]);

  const showBrowserNotification = () => {
    if (!('Notification' in window)) return;

    const notification = new Notification('Seu carrinho está esperando! 🛒', {
      body: `${recoveryData?.itemCount} itens • R$ ${recoveryData?.totalValue.toFixed(2)}`,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'cart-recovery',
      requireInteraction: true,
      actions: [
        {
          action: 'restore',
          title: 'Restaurar Carrinho'
        },
        {
          action: 'dismiss',
          title: 'Depois'
        }
      ]
    });

    notification.onclick = () => {
      handleRestoreCart();
      notification.close();
    };

    // Limpar notificação após 30 segundos
    setTimeout(() => {
      notification.close();
    }, 30000);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('Este navegador não suporta notificações');
      return;
    }

    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      showBrowserNotification();
      setShowNotification(false);
    }
  };

  const handleRestoreCart = () => {
    restoreCart();
    setCartOpen(true);
    setShowNotification(false);
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification || !recoveryData) return null;

  const timeAgo = Math.floor((Date.now() - recoveryData.lastActivity) / (1000 * 60));

  return (
    <div className={cn("fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]", className)}>
      <Card className="border-2 border-primary/20 bg-background shadow-lg animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-full">
                <ShoppingBag className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Carrinho Salvo</h3>
                <p className="text-xs text-muted-foreground">
                  {timeAgo} min atrás
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={handleDismiss}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-3">
            {/* Informações do carrinho */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {recoveryData.itemCount} item{recoveryData.itemCount !== 1 ? 's' : ''}
                </span>
              </div>
              <span className="font-semibold text-primary">
                R$ {recoveryData.totalValue.toFixed(2)}
              </span>
            </div>

            {/* Incentivo */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-md">
              <Gift className="h-3 w-3" />
              <span>Complete sua compra e ganhe benefícios!</span>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-2">
              <Button
                onClick={handleRestoreCart}
                size="sm"
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                <ShoppingBag className="h-3 w-3 mr-1" />
                Continuar
              </Button>
              
              {notificationPermission !== 'granted' && (
                <Button
                  onClick={requestNotificationPermission}
                  variant="outline"
                  size="sm"
                  className="px-2"
                  title="Ativar notificações"
                >
                  <Bell className="h-3 w-3" />
                </Button>
              )}
            </div>

            {/* Link para ativar notificações */}
            {notificationPermission === 'default' && (
              <div className="text-center">
                <Button
                  variant="link"
                  size="sm"
                  onClick={requestNotificationPermission}
                  className="text-xs text-muted-foreground"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Ativar notificações para não perder ofertas
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CartRecoveryPushNotification;
