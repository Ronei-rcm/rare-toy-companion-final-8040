import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ShoppingCart,
  DollarSign,
  Truck,
  Package,
  User,
  Mail,
  Phone,
  Clock,
  Star,
  Archive,
  Trash2,
  Settings,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Notification {
  id: string;
  type: 'order' | 'payment' | 'shipping' | 'customer' | 'system' | 'alert';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  action?: {
    label: string;
    onClick: () => void;
  };
  data?: any;
}

interface OrdersNotificationsProps {
  onNotificationClick?: (notification: Notification) => void;
  onMarkAsRead?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
  onDeleteNotification?: (notificationId: string) => void;
}

const OrdersNotifications: React.FC<OrdersNotificationsProps> = ({
  onNotificationClick,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification
}) => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');

  useEffect(() => {
    loadNotifications();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadNotifications();
      }, 30000); // 30 segundos
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      // Simular carregamento de notificações
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: 'Novo Pedido Recebido',
          message: 'Pedido #PED-001 foi criado por João Silva',
          timestamp: new Date(),
          read: false,
          priority: 'high',
          action: {
            label: 'Ver Pedido',
            onClick: () => handleNotificationClick('1')
          },
          data: { orderId: 'PED-001' }
        },
        {
          id: '2',
          type: 'payment',
          title: 'Pagamento Confirmado',
          message: 'Pagamento do pedido #PED-002 foi confirmado via PIX',
          timestamp: new Date(Date.now() - 3600000),
          read: false,
          priority: 'medium',
          action: {
            label: 'Ver Detalhes',
            onClick: () => handleNotificationClick('2')
          },
          data: { orderId: 'PED-002' }
        },
        {
          id: '3',
          type: 'shipping',
          title: 'Pedido Enviado',
          message: 'Pedido #PED-003 foi enviado com código de rastreamento ABC123',
          timestamp: new Date(Date.now() - 7200000),
          read: true,
          priority: 'medium',
          action: {
            label: 'Rastrear',
            onClick: () => handleNotificationClick('3')
          },
          data: { orderId: 'PED-003', trackingCode: 'ABC123' }
        },
        {
          id: '4',
          type: 'customer',
          title: 'Novo Cliente Cadastrado',
          message: 'Maria Santos se cadastrou na plataforma',
          timestamp: new Date(Date.now() - 10800000),
          read: true,
          priority: 'low',
          action: {
            label: 'Ver Perfil',
            onClick: () => handleNotificationClick('4')
          },
          data: { customerId: 'CUST-001' }
        },
        {
          id: '5',
          type: 'alert',
          title: 'Estoque Baixo',
          message: 'Produto "Boneco de Ação" está com estoque baixo (2 unidades)',
          timestamp: new Date(Date.now() - 14400000),
          read: false,
          priority: 'urgent',
          action: {
            label: 'Ver Produto',
            onClick: () => handleNotificationClick('5')
          },
          data: { productId: 'PROD-001' }
        },
        {
          id: '6',
          type: 'system',
          title: 'Backup Realizado',
          message: 'Backup automático do sistema foi concluído com sucesso',
          timestamp: new Date(Date.now() - 18000000),
          read: true,
          priority: 'low'
        }
      ];

      setNotifications(mockNotifications);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      if (!notification.read) {
        markAsRead(notificationId);
      }
      onNotificationClick?.(notification);
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    onMarkAsRead?.(notificationId);
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );
    onMarkAllAsRead?.();
    toast({
      title: "Notificações",
      description: "Todas as notificações foram marcadas como lidas",
    });
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    onDeleteNotification?.(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      case 'shipping': return <Truck className="h-4 w-4" />;
      case 'customer': return <User className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      case 'alert': return <AlertTriangle className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-blue-600';
      case 'payment': return 'text-green-600';
      case 'shipping': return 'text-purple-600';
      case 'customer': return 'text-indigo-600';
      case 'system': return 'text-gray-600';
      case 'alert': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.read;
      case 'urgent': return notification.priority === 'urgent';
      default: return true;
    }
  });

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  return (
    <>
      {/* Botão de notificações */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge 
                className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                variant="destructive"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notificações</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {/* Filtros */}
          <div className="px-2 py-1">
            <div className="flex gap-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('all')}
                className="text-xs"
              >
                Todas
              </Button>
              <Button
                variant={filter === 'unread' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('unread')}
                className="text-xs"
              >
                Não lidas
              </Button>
              <Button
                variant={filter === 'urgent' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilter('urgent')}
                className="text-xs"
              >
                Urgentes
              </Button>
            </div>
          </div>
          
          <DropdownMenuSeparator />

          {/* Lista de notificações */}
          <div className="max-h-96 overflow-y-auto">
            <AnimatePresence>
              {filteredNotifications.map((notification) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <DropdownMenuItem
                    className="flex items-start gap-3 p-3 cursor-pointer"
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex-shrink-0 mt-1">
                      <div className={`p-1 rounded-full ${getTypeColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${!notification.read ? 'font-bold' : ''}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimeAgo(notification.timestamp)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`}></div>
                        </div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filteredNotifications.length === 0 && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação encontrada
            </div>
          )}

          <DropdownMenuSeparator />
          
          {/* Ações */}
          <div className="p-2">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex-1"
                disabled={unreadCount === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar todas como lidas
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Implementar configurações de notificação
                  toast({
                    title: "Configurações",
                    description: "Configurações de notificação em desenvolvimento",
                  });
                }}
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal de detalhes da notificação */}
      <Dialog open={!!notifications.find(n => n.id === '1')} onOpenChange={() => {}}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Notificação</DialogTitle>
            <DialogDescription>
              Informações completas sobre a notificação
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Conteúdo do modal seria implementado aqui */}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OrdersNotifications;
