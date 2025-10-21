import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'order' | 'product' | 'customer';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showToast: (notification: Notification) => void;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Carregar notificações do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setNotifications(parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        })));
      } catch (error) {
        console.error('Erro ao carregar notificações:', error);
      }
    }
  }, []);

  // Salvar notificações no localStorage
  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Manter apenas 50 notificações

    // Mostrar toast
    showToast(newNotification);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const showToast = useCallback((notification: Notification) => {
    const toastOptions = {
      duration: notification.type === 'error' ? 5000 : 3000,
      action: notification.action ? {
        label: notification.action.label,
        onClick: notification.action.onClick
      } : undefined
    };

    switch (notification.type) {
      case 'success':
        toast.success(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'error':
        toast.error(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'warning':
        toast.warning(notification.title, {
          description: notification.message,
          ...toastOptions
        });
        break;
      case 'order':
        toast(notification.title, {
          description: notification.message,
          icon: '🛒',
          ...toastOptions
        });
        break;
      case 'product':
        toast(notification.title, {
          description: notification.message,
          icon: '📦',
          ...toastOptions
        });
        break;
      case 'customer':
        toast(notification.title, {
          description: notification.message,
          icon: '👤',
          ...toastOptions
        });
        break;
      default:
        toast(notification.title, {
          description: notification.message,
          ...toastOptions
        });
    }
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    showToast
  };
};

// Hook para notificações específicas do sistema
export const useSystemNotifications = () => {
  const { addNotification } = useNotifications();

  const notifyNewOrder = useCallback((orderData: any) => {
    addNotification({
      type: 'order',
      title: 'Novo Pedido Recebido!',
      message: `Pedido #${orderData.id} de ${orderData.customer} - ${orderData.amount}`,
      action: {
        label: 'Ver Pedido',
        onClick: () => {
          // Navegar para o pedido
          console.log('Navegar para pedido:', orderData.id);
        }
      },
      data: orderData
    });
  }, [addNotification]);

  const notifyLowStock = useCallback((productData: any) => {
    addNotification({
      type: 'warning',
      title: 'Estoque Baixo!',
      message: `${productData.name} está com apenas ${productData.stock} unidades`,
      action: {
        label: 'Gerenciar Estoque',
        onClick: () => {
          // Navegar para gestão de estoque
          console.log('Navegar para estoque:', productData.id);
        }
      },
      data: productData
    });
  }, [addNotification]);

  const notifyProductUpdate = useCallback((productData: any) => {
    addNotification({
      type: 'product',
      title: 'Produto Atualizado',
      message: `${productData.name} foi atualizado com sucesso`,
      data: productData
    });
  }, [addNotification]);

  const notifyCustomerRegistration = useCallback((customerData: any) => {
    addNotification({
      type: 'customer',
      title: 'Novo Cliente Cadastrado',
      message: `${customerData.name} se cadastrou na loja`,
      data: customerData
    });
  }, [addNotification]);

  const notifySystemError = useCallback((error: any) => {
    addNotification({
      type: 'error',
      title: 'Erro no Sistema',
      message: error.message || 'Ocorreu um erro inesperado',
      data: error
    });
  }, [addNotification]);

  const notifySuccess = useCallback((title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message
    });
  }, [addNotification]);

  return {
    notifyNewOrder,
    notifyLowStock,
    notifyProductUpdate,
    notifyCustomerRegistration,
    notifySystemError,
    notifySuccess
  };
};
