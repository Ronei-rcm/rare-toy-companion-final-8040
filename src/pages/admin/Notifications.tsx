import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bell, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle,
  Clock,
  Mail,
  MessageSquare,
  Smartphone,
  Users,
  TrendingUp,
  RefreshCw,
  Settings,
  Template,
  Zap
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'promotion' | 'order' | 'loyalty';
  channel: 'push' | 'email' | 'whatsapp' | 'sms' | 'in_app';
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed';
  scheduled_at?: string;
  sent_at?: string;
  read_at?: string;
  created_at: string;
}

interface NotificationStats {
  total_notifications: number;
  sent_count: number;
  delivered_count: number;
  read_count: number;
  failed_count: number;
  push_count: number;
  email_count: number;
  whatsapp_count: number;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterChannel, setFilterChannel] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formulário de criação de notificação
  const [newNotification, setNewNotification] = useState({
    user_id: '',
    title: '',
    message: '',
    type: 'info' as const,
    channel: 'push' as const,
    scheduled_at: '',
    metadata: {}
  });

  useEffect(() => {
    loadNotifications();
    loadStats();
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/notifications/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data.overview);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const createNotification = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newNotification)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setNewNotification({
          user_id: '',
          title: '',
          message: '',
          type: 'info',
          channel: 'push',
          scheduled_at: '',
          metadata: {}
        });
        loadNotifications();
      } else {
        alert('Erro ao criar notificação: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar notificação:', error);
      alert('Erro ao criar notificação');
    }
  };

  const sendNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/notifications/${id}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        loadNotifications();
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
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
        return <Mail className="w-4 h-4" />;
      case 'whatsapp':
        return <MessageSquare className="w-4 h-4" />;
      case 'push':
        return <Smartphone className="w-4 h-4" />;
      case 'sms':
        return <MessageSquare className="w-4 h-4" />;
      case 'in_app':
        return <Bell className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-purple-100 text-purple-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'sent':
        return 'Enviada';
      case 'delivered':
        return 'Entregue';
      case 'read':
        return 'Lida';
      case 'failed':
        return 'Falhou';
      case 'pending':
        return 'Pendente';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || notification.type === filterType;
    const matchesChannel = filterChannel === 'all' || notification.channel === filterChannel;
    return matchesSearch && matchesType && matchesChannel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">🔔 Notificações</h1>
        <div className="flex gap-2">
          <Button onClick={loadNotifications} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Notificação
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Bell className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-xl font-bold text-gray-900">{stats.total_notifications}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Enviadas</p>
                  <p className="text-xl font-bold text-gray-900">{stats.sent_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Eye className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Lidas</p>
                  <p className="text-xl font-bold text-gray-900">{stats.read_count}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-orange-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Taxa de Leitura</p>
                  <p className="text-xl font-bold text-gray-900">
                    {stats.sent_count > 0 ? Math.round((stats.read_count / stats.sent_count) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Título ou mensagem"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="promotion">Promoção</SelectItem>
                      <SelectItem value="order">Pedido</SelectItem>
                      <SelectItem value="loyalty">Fidelidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="channel">Canal</Label>
                  <Select value={filterChannel} onValueChange={setFilterChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={loadNotifications} className="w-full">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtrar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Notificações */}
          <div className="grid gap-4">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(notification.type)}
                          <span className="font-semibold text-lg">{notification.title}</span>
                        </div>
                        <Badge className={getStatusColor(notification.status)}>
                          {getStatusLabel(notification.status)}
                        </Badge>
                        <div className="flex items-center space-x-1">
                          {getChannelIcon(notification.channel)}
                          <span className="text-sm text-gray-600 capitalize">
                            {notification.channel}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Criado: {formatDate(notification.created_at)}</span>
                        {notification.sent_at && (
                          <span>Enviado: {formatDate(notification.sent_at)}</span>
                        )}
                        {notification.read_at && (
                          <span>Lido: {formatDate(notification.read_at)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {notification.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => sendNotification(notification.id)}
                        >
                          <Send className="w-4 h-4 mr-1" />
                          Enviar
                        </Button>
                      )}
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Template className="w-5 h-5 mr-2" />
                Templates de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Template className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de templates em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatsapp" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Integração WhatsApp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">WhatsApp Business API</h3>
                <p className="text-gray-600 mb-4">
                  Envie mensagens automáticas e gerencie conversas
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Mensagens Enviadas</p>
                    <p className="text-gray-600">1.250</p>
                  </div>
                  <div>
                    <p className="font-medium">Taxa de Entrega</p>
                    <p className="text-gray-600">98.5%</p>
                  </div>
                  <div>
                    <p className="font-medium">Taxa de Leitura</p>
                    <p className="text-gray-600">85.2%</p>
                  </div>
                  <div>
                    <p className="font-medium">Usuários Ativos</p>
                    <p className="text-gray-600">450</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="w-5 h-5 mr-2" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-sm text-gray-600">Enviar notificações push para dispositivos</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-gray-600">Enviar notificações por email</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações WhatsApp</p>
                    <p className="text-sm text-gray-600">Enviar notificações via WhatsApp</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Notificações SMS</p>
                    <p className="text-sm text-gray-600">Enviar notificações por SMS</p>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Notificação */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newNotification.title}
                  onChange={(e) => setNewNotification({...newNotification, title: e.target.value})}
                  placeholder="Título da notificação"
                />
              </div>
              
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={newNotification.message}
                  onChange={(e) => setNewNotification({...newNotification, message: e.target.value})}
                  placeholder="Conteúdo da notificação"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={newNotification.type} onValueChange={(value: any) => setNewNotification({...newNotification, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Sucesso</SelectItem>
                      <SelectItem value="warning">Aviso</SelectItem>
                      <SelectItem value="error">Erro</SelectItem>
                      <SelectItem value="promotion">Promoção</SelectItem>
                      <SelectItem value="order">Pedido</SelectItem>
                      <SelectItem value="loyalty">Fidelidade</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="channel">Canal</Label>
                  <Select value={newNotification.channel} onValueChange={(value: any) => setNewNotification({...newNotification, channel: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="push">Push</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_app">In-App</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createNotification} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Notifications;
