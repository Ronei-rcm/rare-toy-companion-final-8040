import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bell,
  Mail,
  MessageSquare,
  ShoppingBag,
  Heart,
  Tag,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface NotificationsTabProps {
  userId: string;
}

const NotificationsTab: React.FC<NotificationsTabProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [preferences, setPreferences] = useState({
    email: {
      orders: true,
      promotions: true,
      newsletter: true,
      recommendations: false,
    },
    push: {
      orders: true,
      promotions: false,
      newsletter: false,
      recommendations: false,
    },
    sms: {
      orders: true,
      promotions: false,
      newsletter: false,
      recommendations: false,
    },
  });
  const [showPreferences, setShowPreferences] = useState(false);
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadNotifications();
    loadPreferences();
  }, [userId]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/notifications`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPreferences = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/notification-preferences`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar preferências:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/notifications/read-all`, {
        method: 'PATCH',
        credentials: 'include',
      });

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast({
        title: 'Todas marcadas como lidas',
        description: 'Todas as notificações foram marcadas como lidas',
      });
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/notifications/${notificationId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      toast({
        title: 'Notificação removida',
        description: 'A notificação foi removida com sucesso',
      });
    } catch (error) {
      console.error('Erro ao remover notificação:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Deseja realmente remover todas as notificações?')) return;

    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/notifications/clear`, {
        method: 'DELETE',
        credentials: 'include',
      });

      setNotifications([]);
      toast({
        title: 'Notificações limpas',
        description: 'Todas as notificações foram removidas',
      });
    } catch (error) {
      console.error('Erro ao limpar notificações:', error);
    }
  };

  const handleSavePreferences = async () => {
    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/notification-preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências de notificação foram atualizadas',
      });
      setShowPreferences(false);
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar as preferências',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBag className="w-5 h-5 text-blue-600" />;
      case 'promotion':
        return <Tag className="w-5 h-5 text-green-600" />;
      case 'favorite':
        return <Heart className="w-5 h-5 text-red-600" />;
      case 'recommendation':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFilteredNotifications = () => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    return notifications.filter(n => n.type === filter);
  };

  const filteredNotifications = getFilteredNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreferences(!showPreferences)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Preferências
          </Button>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="outline" onClick={handleClearAll}>
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar todas
            </Button>
          )}
        </div>
      </div>

      {/* Preferências */}
      {showPreferences && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <Card className="border-2 border-primary">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferências de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  E-mail
                </h3>
                <div className="space-y-2">
                  {Object.entries(preferences.email).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`email-${key}`} className="cursor-pointer">
                        {key === 'orders' && 'Atualizações de pedidos'}
                        {key === 'promotions' && 'Promoções e ofertas'}
                        {key === 'newsletter' && 'Newsletter'}
                        {key === 'recommendations' && 'Recomendações'}
                      </Label>
                      <Switch
                        id={`email-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            email: { ...preferences.email, [key]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Push */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notificações Push
                </h3>
                <div className="space-y-2">
                  {Object.entries(preferences.push).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`push-${key}`} className="cursor-pointer">
                        {key === 'orders' && 'Atualizações de pedidos'}
                        {key === 'promotions' && 'Promoções e ofertas'}
                        {key === 'newsletter' && 'Newsletter'}
                        {key === 'recommendations' && 'Recomendações'}
                      </Label>
                      <Switch
                        id={`push-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            push: { ...preferences.push, [key]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* SMS */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  SMS
                </h3>
                <div className="space-y-2">
                  {Object.entries(preferences.sms).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label htmlFor={`sms-${key}`} className="cursor-pointer">
                        {key === 'orders' && 'Atualizações de pedidos'}
                        {key === 'promotions' && 'Promoções e ofertas'}
                        {key === 'newsletter' && 'Newsletter'}
                        {key === 'recommendations' && 'Recomendações'}
                      </Label>
                      <Switch
                        id={`sms-${key}`}
                        checked={value}
                        onCheckedChange={(checked) =>
                          setPreferences({
                            ...preferences,
                            sms: { ...preferences.sms, [key]: checked },
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button onClick={handleSavePreferences} className="flex-1">
                  Salvar Preferências
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPreferences(false)}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({notifications.length})
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Não lidas ({unreadCount})
            </Button>
            <Button
              variant={filter === 'order' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('order')}
            >
              <ShoppingBag className="w-3 h-3 mr-1" />
              Pedidos
            </Button>
            <Button
              variant={filter === 'promotion' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('promotion')}
            >
              <Tag className="w-3 h-3 mr-1" />
              Promoções
            </Button>
            <Button
              variant={filter === 'recommendation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('recommendation')}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Recomendações
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      {filteredNotifications.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma notificação</h3>
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'Você não tem notificações no momento'
                : filter === 'unread'
                ? 'Você não tem notificações não lidas'
                : 'Nenhuma notificação deste tipo'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`${
                    !notification.read
                      ? 'border-l-4 border-l-primary bg-primary/5'
                      : 'hover:bg-muted/50'
                  } transition-all cursor-pointer`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-white rounded-lg shadow-sm">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold mb-1">
                              {notification.title}
                              {!notification.read && (
                                <Badge variant="default" className="ml-2 text-xs">
                                  Nova
                                </Badge>
                              )}
                            </h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {new Date(notification.created_at).toLocaleString('pt-BR')}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification.id);
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NotificationsTab;

