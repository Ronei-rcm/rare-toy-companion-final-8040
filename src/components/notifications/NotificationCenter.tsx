import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Package, 
  Star,
  Mail,
  MessageSquare,
  Smartphone,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion' | 'order' | 'loyalty';
  channel: 'push' | 'email' | 'whatsapp' | 'sms' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  created_at: string;
  read_at?: string;
}

interface NotificationCenterProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  userId, 
  isOpen, 
  onClose 
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen && userId) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/notifications/user/${userId}?limit=20`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
        const unread = data.data.filter((n: Notification) => !n.read_at).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, status: 'read' as const, read_at: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read_at);
      
      for (const notification of unreadNotifications) {
        await markAsRead(notification.id);
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'promotion':
        return <TrendingUp className="w-4 h-4 text-purple-600" />;
      case 'order':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'loyalty':
        return <Star className="w-4 h-4 text-orange-600" />;
      default:
        return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return <Mail className="w-3 h-3" />;
      case 'whatsapp':
        return <MessageSquare className="w-3 h-3" />;
      case 'push':
        return <Smartphone className="w-3 h-3" />;
      case 'sms':
        return <MessageSquare className="w-3 h-3" />;
      case 'in_app':
        return <Bell className="w-3 h-3" />;
      default:
        return <Bell className="w-3 h-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500 bg-green-50';
      case 'error':
        return 'border-l-red-500 bg-red-50';
      case 'warning':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'promotion':
        return 'border-l-purple-500 bg-purple-50';
      case 'order':
        return 'border-l-blue-500 bg-blue-50';
      case 'loyalty':
        return 'border-l-orange-500 bg-orange-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Agora mesmo';
    } else if (diffInHours < 24) {
      return `${diffInHours}h atrás`;
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end z-50 p-4">
      <Card className="w-full max-w-md max-h-[80vh] overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {unreadCount}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  <Eye className="w-3 h-3 mr-1" />
                  Marcar todas como lidas
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Nenhuma notificação</p>
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                    !notification.read_at ? 'bg-opacity-100' : 'bg-opacity-50'
                  } hover:bg-opacity-75 transition-colors cursor-pointer`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className={`text-sm font-medium ${
                          !notification.read_at ? 'text-gray-900' : 'text-gray-600'
                        }`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          {getChannelIcon(notification.channel)}
                          {!notification.read_at && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      
                      <p className={`text-sm ${
                        !notification.read_at ? 'text-gray-700' : 'text-gray-500'
                      } mb-2`}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {formatDate(notification.created_at)}
                        </span>
                        <Badge 
                          variant={notification.status === 'read' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {notification.status === 'read' ? 'Lida' : 'Nova'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
