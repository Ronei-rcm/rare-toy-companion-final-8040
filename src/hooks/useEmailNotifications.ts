import { useState, useEffect } from 'react';

interface EmailNotification {
  id: string;
  type: 'newsletter' | 'cart-recovery' | 'order-confirmation' | 'welcome' | 'promotion';
  title: string;
  message: string;
  timestamp: Date;
  status: 'success' | 'error' | 'info';
  recipientCount?: number;
}

export const useEmailNotifications = () => {
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Adicionar notificação
  const addNotification = (notification: Omit<EmailNotification, 'id' | 'timestamp'>) => {
    const newNotification: EmailNotification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Manter últimas 50
    setUnreadCount(prev => prev + 1);

    // Auto-remover após 10 segundos para notificações de sucesso
    if (notification.status === 'success') {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, 10000);
    }
  };

  // Remover notificação
  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Marcar como lida
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, status: 'info' as const } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // Marcar todas como lidas
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, status: 'info' as const }))
    );
    setUnreadCount(0);
  };

  // Limpar todas as notificações
  const clearAll = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  // Notificações de exemplo para demonstração
  useEffect(() => {
    const exampleNotifications: EmailNotification[] = [
      {
        id: '1',
        type: 'newsletter',
        title: 'Newsletter Enviada',
        message: 'Newsletter semanal enviada para 150 clientes',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        status: 'success',
        recipientCount: 150
      },
      {
        id: '2',
        type: 'cart-recovery',
        title: 'Carrinho Recuperado',
        message: 'E-mail de recuperação enviado para João Silva',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'success',
        recipientCount: 1
      },
      {
        id: '3',
        type: 'order-confirmation',
        title: 'Confirmação de Pedido',
        message: 'E-mail de confirmação enviado para Maria Santos',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        status: 'success',
        recipientCount: 1
      }
    ];

    setNotifications(exampleNotifications);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
};
