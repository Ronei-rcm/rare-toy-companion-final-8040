import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  X, 
  Check, 
  Trash2, 
  Eye, 
  EyeOff,
  Filter,
  Search,
  Clock,
  AlertCircle,
  CheckCircle,
  Info,
  ShoppingCart,
  Package,
  User,
  Zap
} from 'lucide-react';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ className = "" }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.read) || 
      (filter === 'read' && notification.read);
    
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
      case 'order':
        return <ShoppingCart className="w-5 h-5 text-purple-500" />;
      case 'product':
        return <Package className="w-5 h-5 text-orange-500" />;
      case 'customer':
        return <User className="w-5 h-5 text-cyan-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

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
    <Card className={cn("w-full max-w-md", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              disabled={notifications.length === 0}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            Não lidas
          </Button>
          <Button
            variant={filter === 'read' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('read')}
          >
            Lidas
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredNotifications.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhuma notificação encontrada</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 border-b hover:bg-gray-50 transition-colors cursor-pointer",
                    !notification.read && "bg-blue-50 border-l-4 border-l-blue-500"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className={cn(
                            "text-sm font-medium",
                            !notification.read && "font-semibold"
                          )}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1 ml-2">
                          <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {notification.action && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              notification.action?.onClick();
                            }}
                          >
                            {notification.action.label}
                          </Button>
                        </div>
                      )}

                      {!notification.read && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Nova
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default NotificationCenter;
