import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  X,
  Clock,
  ShoppingCart,
  Package,
  DollarSign,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  read: boolean;
}

export default function DashboardNotifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Obter userId do admin logado
  useEffect(() => {
    try {
      const adminUser = localStorage.getItem('admin_user');
      if (adminUser) {
        const parsed = JSON.parse(adminUser);
        // Tentar obter ID do admin (pode estar em id, user_id, userId, ou admin_id)
        const adminId = parsed?.id || parsed?.user_id || parsed?.userId || parsed?.admin_id;
        if (adminId) {
          setUserId(String(adminId));
        } else if (parsed?.email) {
          // Se não tiver ID, usar email como fallback (a API aceita email)
          setUserId(parsed.email);
        } else {
          console.warn('⚠️ Não foi possível obter userId do admin. Notificações podem não funcionar.');
        }
      }
    } catch (error) {
      console.error('Erro ao obter userId do admin:', error);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadNotifications();
      // Polling a cada 30 segundos
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [userId]);

  const loadNotifications = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/user/${userId}?limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
        }
      });
      
      const data = await response.json();
      
      if (data.success && data.data && Array.isArray(data.data)) {
        // Mapear dados da API para o formato do componente
        const mappedNotifications: Notification[] = data.data.map((notif: any) => {
          // Parse metadata se for string JSON
          let metadata = {};
          if (notif.metadata) {
            try {
              metadata = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;
            } catch (e) {
              metadata = {};
            }
          }
          
          return {
            id: String(notif.id || notif.notification_id),
            type: mapNotificationType(notif.type || notif.notification_type || 'info'),
            title: notif.title || notif.subject || 'Notificação',
            message: notif.message || notif.body || notif.content || '',
            timestamp: notif.created_at ? new Date(notif.created_at) : new Date(),
            actionUrl: notif.action_url || notif.link || metadata?.actionUrl || metadata?.action_url,
            actionLabel: notif.action_label || metadata?.actionLabel || metadata?.action_label,
            read: !!(notif.read_at || notif.is_read || notif.read)
          };
        });
        
        setNotifications(mappedNotifications);
      } else {
        // Se não houver notificações, deixar array vazio
        setNotifications([]);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      // Em caso de erro, manter array vazio ao invés de mostrar mock
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Mapear tipos de notificação da API para os tipos do componente
  const mapNotificationType = (type: string): 'success' | 'warning' | 'info' | 'error' => {
    const normalized = type?.toLowerCase() || 'info';
    if (normalized.includes('success') || normalized.includes('successo')) return 'success';
    if (normalized.includes('warning') || normalized.includes('aviso') || normalized.includes('alerta')) return 'warning';
    if (normalized.includes('error') || normalized.includes('erro')) return 'error';
    return 'info';
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = async (id: string) => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token') || localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        // Atualizar estado local
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      } else {
        // Se falhar na API, atualizar localmente mesmo assim
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      // Atualizar localmente mesmo em caso de erro
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  };

  const markAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    
    try {
      // Marcar todas individualmente (ou usar endpoint batch se existir)
      await Promise.all(
        notifications.filter(n => !n.read).map(n => markAsRead(n.id))
      );
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      // Atualizar localmente mesmo em caso de erro
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  };

  const removeNotification = (id: string) => {
    // Remover apenas localmente (a API pode não ter endpoint de delete)
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Há ${days} dias`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-12 z-50 w-80"
            >
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row items-center justify-between pb-3">
                  <CardTitle className="text-sm font-medium">Notificações</CardTitle>
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs"
                      >
                        Marcar todas
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                        Carregando notificações...
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                        Nenhuma notificação
                      </div>
                    ) : (
                      <div className="divide-y">
                        <AnimatePresence>
                          {notifications.map((notification) => (
                            <motion.div
                              key={notification.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 20 }}
                              className={cn(
                                "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                                !notification.read && "bg-blue-50"
                              )}
                              onClick={() => {
                                markAsRead(notification.id);
                                if (notification.actionUrl) {
                                  navigate(notification.actionUrl);
                                  setIsOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                {getIcon(notification.type)}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-sm font-medium">{notification.title}</p>
                                    {!notification.read && (
                                      <div className="h-2 w-2 bg-blue-600 rounded-full" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mb-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {formatTime(notification.timestamp)}
                                    </span>
                                    {notification.actionLabel && (
                                      <Button
                                        variant="link"
                                        size="sm"
                                        className="h-auto p-0 text-xs"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (notification.actionUrl) {
                                            navigate(notification.actionUrl);
                                            setIsOpen(false);
                                          }
                                        }}
                                      >
                                        {notification.actionLabel}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeNotification(notification.id);
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

