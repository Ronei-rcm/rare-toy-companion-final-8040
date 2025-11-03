import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  Eye, 
  Edit, 
  MessageSquare, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Users,
  DollarSign,
  Package,
  Bell,
  Settings,
  BarChart,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  Zap,
  Shield,
  Crown
} from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  customer: {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    type: string;
    total_pedidos: number;
    total_gasto: number;
  };
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
  }>;
  created_at: string;
  updated_at: string;
  tracking_code?: string;
  estimated_delivery?: string;
  notes?: string;
  priority: string;
  assigned_to?: string;
  status_timeline: Array<{
    status: string;
    created_at: string;
    notes?: string;
  }>;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  totalRevenue: number;
  averageTicket: number;
  todayOrders: number;
  todayRevenue: number;
  uniqueCustomers: number;
  newCustomersToday: number;
  avgDeliveryTimeHours: number;
  urgent_orders: number;
  assigned_orders: number;
}

const OrdersUnified: React.FC = () => {
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  
  // Estados principais
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtros e busca
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    assigned: 'all',
    period: '30d',
    sort: 'created_at',
    order: 'DESC'
  });
  
  // Paginação
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  
  // Modais e seleções
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Estados para ações
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [newComment, setNewComment] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  
  // WebSocket para atualizações em tempo real
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // ==================== WEBSOCKET ====================
  // DESABILITADO TEMPORARIAMENTE - Backend não suporta WebSocket
  
  // useEffect(() => {
  //   const connectWebSocket = () => {
  //     const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  //     const wsUrl = `${protocol}//${window.location.host}/ws/orders`;
      
  //     const websocket = new WebSocket(wsUrl);
      
  //     websocket.onopen = () => {
  //       console.log('WebSocket conectado');
  //       setWsConnected(true);
  //       websocket.send(JSON.stringify({ type: 'join_admin_room' }));
  //     };
      
  //     websocket.onmessage = (event) => {
  //       const data = JSON.parse(event.data);
  //       handleWebSocketMessage(data);
  //     };
      
  //     websocket.onclose = () => {
  //       console.log('WebSocket desconectado');
  //       setWsConnected(false);
  //       // Reconectar após 5 segundos
  //       setTimeout(connectWebSocket, 5000);
  //     };
      
  //     websocket.onerror = (error) => {
  //       console.error('Erro WebSocket:', error);
  //       setWsConnected(false);
  //     };
      
  //     setWs(websocket);
  //   };
    
  //   connectWebSocket();
    
  //   return () => {
  //     if (ws) {
  //       ws.close();
  //     }
  //   };
  // }, []);
  
  // const handleWebSocketMessage = (data: any) => {
  //   switch (data.type) {
  //     case 'order_status_updated':
  //       toast({
  //         title: 'Pedido Atualizado',
  //         description: `Pedido #${data.order_id.substring(0, 8)} foi atualizado para: ${data.new_status}`,
  //       });
  //       loadOrders(); // Recarregar lista
  //       break;
  //     case 'order_comment_added':
  //       toast({
  //         title: 'Novo Comentário',
  //         description: `Comentário adicionado ao pedido #${data.order_id.substring(0, 8)}`,
  //       });
  //       break;
  //   }
  // };

  // ==================== CARREGAMENTO DE DADOS ====================
  
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        admin_view: 'true',
        ...filters
      });
      
      const response = await fetch(`${API_BASE_URL}/orders/unified?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
        setPagination(data.pagination || pagination);
      } else {
        throw new Error('Falha ao carregar pedidos');
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, pagination.limit]);
  
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/stats/unified?period=${filters.period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [filters.period]);
  
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadStats()]);
    setRefreshing(false);
  };

  // ==================== AÇÕES ====================
  
  const updateOrderStatus = async (orderId: string, status: string, notes?: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin-token' // Implementar autenticação real
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes, notify_customer: true })
      });
      
      if (response.ok) {
        toast({
          title: 'Status Atualizado',
          description: 'Status do pedido foi atualizado com sucesso'
        });
        loadOrders();
        setShowStatusModal(false);
      } else {
        throw new Error('Falha ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive'
      });
    }
  };
  
  const addComment = async (orderId: string, comment: string, isInternal: boolean) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': 'admin-token'
        },
        credentials: 'include',
        body: JSON.stringify({ comment, is_internal: isInternal })
      });
      
      if (response.ok) {
        toast({
          title: 'Comentário Adicionado',
          description: 'Comentário foi adicionado com sucesso'
        });
        setNewComment('');
        setCommentInternal(false);
      } else {
        throw new Error('Falha ao adicionar comentário');
      }
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o comentário',
        variant: 'destructive'
      });
    }
  };

  // ==================== RENDERIZAÇÃO ====================
  
  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { color: 'bg-yellow-500', icon: Clock, label: 'Pendente' },
      processing: { color: 'bg-blue-500', icon: Package, label: 'Processando' },
      shipped: { color: 'bg-purple-500', icon: Truck, label: 'Enviado' },
      delivered: { color: 'bg-green-500', icon: CheckCircle, label: 'Entregue' },
      cancelled: { color: 'bg-red-500', icon: AlertCircle, label: 'Cancelado' }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };
  
  const getPriorityInfo = (priority: string) => {
    const priorityMap = {
      low: { color: 'bg-gray-500', icon: Clock, label: 'Baixa' },
      normal: { color: 'bg-blue-500', icon: Package, label: 'Normal' },
      high: { color: 'bg-orange-500', icon: AlertCircle, label: 'Alta' },
      urgent: { color: 'bg-red-500', icon: Zap, label: 'Urgente' }
    };
    
    return priorityMap[priority as keyof typeof priorityMap] || priorityMap.normal;
  };

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    loadOrders();
    loadStats();
  }, [loadOrders, loadStats]);
  
  useEffect(() => {
    loadOrders();
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Pedidos</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">R$ {Number(stats?.totalRevenue || 0).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pedidos Hoje</p>
                <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes Únicos</p>
                <p className="text-2xl font-bold">{stats?.uniqueCustomers || 0}</p>
              </div>
              <Users className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e controles */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar pedidos..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
                <SelectItem value="1y">Último ano</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={refreshData} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pedidos ({orders.length})</span>
            <div className="flex items-center gap-2">
              <Badge variant={wsConnected ? "default" : "destructive"}>
                {wsConnected ? "Conectado" : "Desconectado"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const priorityInfo = getPriorityInfo(order.priority);
                const StatusIcon = statusInfo.icon;
                const PriorityIcon = priorityInfo.icon;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                          <Badge variant="outline" className={priorityInfo.color}>
                            <PriorityIcon className="h-3 w-3 mr-1" />
                            {priorityInfo.label}
                          </Badge>
                        </div>
                        
                        <div>
                          <p className="font-medium">#{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">R$ {Number(order.total || 0).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.customer.nome} ({order.customer.type})
                          </p>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowDetailsModal(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowStatusModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCommentsModal(true);
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modais */}
      {selectedOrder && (
        <>
          {/* Modal de Detalhes */}
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Detalhes do Pedido #{selectedOrder.id.substring(0, 8)}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Informações do Cliente */}
                <div>
                  <h3 className="font-medium mb-2">Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{selectedOrder.customer.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{selectedOrder.customer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{selectedOrder.customer.telefone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      <span>{selectedOrder.customer.total_pedidos} pedidos</span>
                    </div>
                  </div>
                </div>
                
                {/* Itens do Pedido */}
                <div>
                  <h3 className="font-medium mb-2">Itens</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-2 border rounded">
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Qtd: {item.quantity} × R$ {Number(item.price || 0).toFixed(2)}
                          </p>
                        </div>
                        <p className="font-medium">
                          R$ {Number((item.price * item.quantity) || 0).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Timeline de Status */}
                <div>
                  <h3 className="font-medium mb-2">Histórico de Status</h3>
                  <div className="space-y-2">
                    {selectedOrder.status_timeline.map((entry, index) => {
                      const statusInfo = getStatusInfo(entry.status);
                      const StatusIcon = statusInfo.icon;
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-2 border rounded">
                          <StatusIcon className={`h-4 w-4 ${statusInfo.color.replace('bg-', 'text-')}`} />
                          <div className="flex-1">
                            <p className="font-medium">{statusInfo.label}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString('pt-BR')}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {entry.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Atualização de Status */}
          <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar Status - #{selectedOrder.id.substring(0, 8)}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Novo Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Observações</Label>
                  <Textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Adicione observações sobre a mudança de status..."
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => updateOrderStatus(selectedOrder.id, newStatus, statusNotes)}
                    disabled={!newStatus}
                  >
                    Atualizar Status
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Modal de Comentários */}
          <Dialog open={showCommentsModal} onOpenChange={setShowCommentsModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Comentários - #{selectedOrder.id.substring(0, 8)}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label>Novo Comentário</Label>
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Adicione um comentário..."
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="internal"
                    checked={commentInternal}
                    onChange={(e) => setCommentInternal(e.target.checked)}
                  />
                  <Label htmlFor="internal">Comentário interno (não visível para o cliente)</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCommentsModal(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => addComment(selectedOrder.id, newComment, commentInternal)}
                    disabled={!newComment.trim()}
                  >
                    Adicionar Comentário
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default OrdersUnified;

