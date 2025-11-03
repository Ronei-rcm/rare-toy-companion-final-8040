import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Mail,
  MessageSquare,
  Phone,
  Send,
  CheckCircle,
  AlertCircle,
  Clock,
  User,
  MoreVertical,
  Eye,
  Reply,
  Archive,
  Trash2,
  Filter,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Notification {
  id: string;
  order_id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  type: 'email' | 'sms' | 'whatsapp' | 'push';
  status: 'pending' | 'sent' | 'delivered' | 'failed';
  subject: string;
  message: string;
  created_at: string;
  sent_at?: string;
  delivered_at?: string;
  error_message?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channel: 'order_confirmation' | 'status_update' | 'shipping_update' | 'delivery_confirmation' | 'payment_reminder' | 'custom';
}

interface OrderNotificationsProps {
  orderId?: string;
  customerId?: string;
  onClose?: () => void;
}

const OrderNotifications: React.FC<OrderNotificationsProps> = ({ 
  orderId, 
  customerId, 
  onClose 
}) => {
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Estados
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    priority: 'all',
    search: '',
  });

  // Estados de modais
  const [sendModal, setSendModal] = useState(false);
  const [viewModal, setViewModal] = useState<Notification | null>(null);
  const [replyModal, setReplyModal] = useState<Notification | null>(null);

  // Estados para envio de notificação
  const [newNotification, setNewNotification] = useState({
    type: 'email' as const,
    channel: 'custom' as const,
    subject: '',
    message: '',
    priority: 'medium' as const,
  });

  // Carregar notificações
  useEffect(() => {
    loadNotifications();
  }, [orderId, customerId, filters]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (orderId) params.append('order_id', orderId);
      if (customerId) params.append('customer_id', customerId);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE_URL}/admin/notifications?${params}`);
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar notificações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendNotification = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newNotification,
          order_id: orderId,
          customer_id: customerId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Notificação enviada com sucesso",
        });
        setSendModal(false);
        setNewNotification({
          type: 'email',
          channel: 'custom',
          subject: '',
          message: '',
          priority: 'medium',
        });
        loadNotifications();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar notificação",
        variant: "destructive",
      });
    }
  };

  const resendNotification = async (notificationId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/notifications/${notificationId}/resend`, {
        method: 'POST',
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Notificação reenviada",
        });
        loadNotifications();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao reenviar notificação",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      sent: 'bg-blue-100 text-blue-800',
      delivered: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-gray-100 text-gray-800',
      medium: 'bg-blue-100 text-blue-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      email: Mail,
      sms: MessageSquare,
      whatsapp: MessageSquare,
      push: Bell,
    };
    return icons[type as keyof typeof icons] || Bell;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        notification.subject.toLowerCase().includes(searchTerm) ||
        notification.message.toLowerCase().includes(searchTerm) ||
        notification.customer_name.toLowerCase().includes(searchTerm)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Notificações</h2>
          <p className="text-gray-600">
            Gerencie notificações para pedidos e clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadNotifications} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setSendModal(true)} size="sm">
            <Send className="h-4 w-4 mr-2" />
            Enviar Notificação
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Assunto, mensagem, cliente..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters({ ...filters, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Tipos</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="sent">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={filters.priority}
                onValueChange={(value) => setFilters({ ...filters, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Prioridades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Notificações */}
      <div className="space-y-4">
        <AnimatePresence>
          {filteredNotifications.map((notification) => {
            const TypeIcon = getTypeIcon(notification.type);
            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <TypeIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {notification.subject}
                            </h3>
                            <Badge className={getStatusColor(notification.status)}>
                              {notification.status}
                            </Badge>
                            <Badge className={getPriorityColor(notification.priority)}>
                              {notification.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Para: {notification.customer_name} ({notification.customer_email})
                          </p>
                          <p className="text-sm text-gray-700 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>
                              Criado: {new Date(notification.created_at).toLocaleString('pt-BR')}
                            </span>
                            {notification.sent_at && (
                              <span>
                                Enviado: {new Date(notification.sent_at).toLocaleString('pt-BR')}
                              </span>
                            )}
                            {notification.delivered_at && (
                              <span>
                                Entregue: {new Date(notification.delivered_at).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </div>
                          {notification.error_message && (
                            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                              <strong>Erro:</strong> {notification.error_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setViewModal(notification)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {notification.status === 'failed' && (
                              <DropdownMenuItem onClick={() => resendNotification(notification.id)}>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reenviar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => setReplyModal(notification)}>
                              <Reply className="h-4 w-4 mr-2" />
                              Responder
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Modal de Enviar Notificação */}
      <Dialog open={sendModal} onOpenChange={setSendModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Notificação</DialogTitle>
            <DialogDescription>
              Envie uma notificação para o cliente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={newNotification.priority}
                  onValueChange={(value: any) => setNewNotification({ ...newNotification, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                placeholder="Assunto da notificação"
                value={newNotification.subject}
                onChange={(e) => setNewNotification({ ...newNotification, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                placeholder="Digite sua mensagem aqui..."
                rows={6}
                value={newNotification.message}
                onChange={(e) => setNewNotification({ ...newNotification, message: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendModal(false)}>
              Cancelar
            </Button>
            <Button onClick={sendNotification}>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Ver Detalhes */}
      <Dialog open={!!viewModal} onOpenChange={() => setViewModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Notificação</DialogTitle>
            <DialogDescription>
              Informações completas da notificação
            </DialogDescription>
          </DialogHeader>
          {viewModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Assunto</Label>
                  <p className="text-gray-700">{viewModal.subject}</p>
                </div>
                <div>
                  <Label className="font-semibold">Tipo</Label>
                  <p className="text-gray-700 capitalize">{viewModal.type}</p>
                </div>
              </div>
              <div>
                <Label className="font-semibold">Mensagem</Label>
                <p className="text-gray-700 whitespace-pre-wrap">{viewModal.message}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Cliente</Label>
                  <p className="text-gray-700">{viewModal.customer_name}</p>
                  <p className="text-sm text-gray-500">{viewModal.customer_email}</p>
                </div>
                <div>
                  <Label className="font-semibold">Status</Label>
                  <Badge className={getStatusColor(viewModal.status)}>
                    {viewModal.status}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold">Criado em</Label>
                  <p className="text-gray-700">
                    {new Date(viewModal.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold">Enviado em</Label>
                  <p className="text-gray-700">
                    {viewModal.sent_at 
                      ? new Date(viewModal.sent_at).toLocaleString('pt-BR')
                      : 'Não enviado'
                    }
                  </p>
                </div>
              </div>
              {viewModal.error_message && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <Label className="font-semibold text-red-700">Erro</Label>
                  <p className="text-red-700">{viewModal.error_message}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderNotifications;
