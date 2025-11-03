import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Search, 
  RefreshCw, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Star,
  Bell,
  MessageSquare,
  Download,
  Filter,
  BarChart,
  ShoppingBag,
  Heart,
  Repeat,
  Share2,
  XCircle,
  Trash2
} from 'lucide-react';

interface Order {
  id: string;
  status: string;
  total: number;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    product_name?: string;
    product_image?: string;
  }>;
  created_at: string;
  updated_at: string;
  tracking_code?: string;
  estimated_delivery?: string;
  shipping_address?: string;
  payment_method?: string;
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
  avgDeliveryTimeHours: number;
}

const OrdersUnified: React.FC = () => {
  const { toast } = useToast();
  const { user } = useCurrentUser() as any;
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
    period: 'all',
    sort: 'created_at',
    order: 'DESC'
  });
  
  // Modais e seleções
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // WebSocket para atualizações em tempo real
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  // ==================== WEBSOCKET ====================
  // DESABILITADO TEMPORARIAMENTE - Backend não suporta WebSocket
  
  // useEffect(() => {
  //   if (!user?.email) return;
    
  //   const connectWebSocket = () => {
  //     const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  //     const wsUrl = `${protocol}//${window.location.host}/ws/orders`;
      
  //     const websocket = new WebSocket(wsUrl);
      
  //     websocket.onopen = () => {
  //       console.log('WebSocket conectado');
  //       setWsConnected(true);
  //       websocket.send(JSON.stringify({ 
  //         type: 'join_customer_room', 
  //         email: user.email 
  //       }));
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
  // }, [user?.email]);
  
  // const handleWebSocketMessage = (data: any) => {
  //   switch (data.type) {
  //     case 'order_updated':
  //       toast({
  //         title: 'Pedido Atualizado! 🎉',
  //         description: data.message,
  //       });
  //       loadOrders(); // Recarregar lista
  //       break;
  //     case 'order_status_updated':
  //       setNotifications(prev => [...prev, {
  //         id: Date.now(),
  //         type: 'status_update',
  //         order_id: data.order_id,
  //         message: `Seu pedido #${data.order_id.substring(0, 8)} foi atualizado para: ${data.new_status}`,
  //         timestamp: new Date().toISOString()
  //       }]);
  //       break;
  //   }
  // };

  // ==================== CARREGAMENTO DE DADOS ====================
  
  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        customer_id: user?.id || '',
        ...filters
      });
      
      const response = await fetch(`${API_BASE_URL}/orders/unified?${params}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
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
  }, [filters, user?.id]);
  
  const loadStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/stats/unified?customer_id=${user?.id}&period=${filters.period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [filters.period, user?.id]);
  
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadStats()]);
    setRefreshing(false);
  };

  // ==================== AÇÕES ====================
  
  const reorderItems = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: 'Itens Adicionados ao Carrinho',
          description: 'Os itens foram adicionados ao seu carrinho'
        });
      } else {
        throw new Error('Falha ao reordenar');
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar os itens ao carrinho',
        variant: 'destructive'
      });
    }
  };
  
  const trackOrder = (trackingCode: string) => {
    if (trackingCode) {
      // Abrir rastreamento em nova aba
      window.open(`https://www2.correios.com.br/sistemas/rastreamento/ctrl/ctrlRastreamento.cfm?codigo=${trackingCode}`, '_blank');
    } else {
      toast({
        title: 'Código de Rastreamento',
        description: 'Código de rastreamento ainda não disponível',
        variant: 'destructive'
      });
    }
  };
  
  const cancelOrder = async (orderId: string) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (response.ok) {
        toast({
          title: 'Pedido Cancelado',
          description: 'Seu pedido foi cancelado com sucesso. O estoque será restaurado.',
          duration: 5000
        });
        setShowCancelModal(false);
        setSelectedOrder(null);
        await loadOrders();
      } else {
        throw new Error('Falha ao cancelar pedido');
      }
    } catch (error) {
      console.error('Erro ao cancelar pedido:', error);
      toast({
        title: 'Erro ao Cancelar',
        description: 'Não foi possível cancelar o pedido. Tente novamente ou entre em contato com o suporte.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const deleteOrder = async (orderId: string) => {
    try {
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: 'Pedido Excluído',
          description: 'O pedido foi removido do seu histórico permanentemente.',
          duration: 5000
        });
        setShowDeleteModal(false);
        setSelectedOrder(null);
        await loadOrders();
      } else {
        throw new Error('Falha ao excluir pedido');
      }
    } catch (error) {
      console.error('Erro ao excluir pedido:', error);
      toast({
        title: 'Erro ao Excluir',
        description: 'Não foi possível excluir o pedido. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setActionLoading(false);
    }
  };
  
  const canCancelOrder = (status: string) => {
    return ['pending', 'processing'].includes(status);
  };
  
  const canDeleteOrder = (status: string, createdAt: string) => {
    // Pode excluir pedidos cancelados ou entregues há mais de 30 dias
    const orderDate = new Date(createdAt);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return status === 'cancelled' || (status === 'delivered' && daysSinceOrder > 30);
  };

  // ==================== RENDERIZAÇÃO ====================
  
  const getStatusInfo = (status: string) => {
    const statusMap = {
      pending: { 
        color: 'bg-yellow-500', 
        icon: Clock, 
        label: 'Pendente',
        description: 'Seu pedido está sendo processado'
      },
      processing: { 
        color: 'bg-blue-500', 
        icon: Package, 
        label: 'Processando',
        description: 'Preparando seu pedido para envio'
      },
      shipped: { 
        color: 'bg-purple-500', 
        icon: Truck, 
        label: 'Enviado',
        description: 'Seu pedido está a caminho'
      },
      delivered: { 
        color: 'bg-green-500', 
        icon: CheckCircle, 
        label: 'Entregue',
        description: 'Pedido entregue com sucesso!'
      },
      cancelled: { 
        color: 'bg-red-500', 
        icon: AlertCircle, 
        label: 'Cancelado',
        description: 'Pedido foi cancelado'
      }
    };
    
    return statusMap[status as keyof typeof statusMap] || statusMap.pending;
  };

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    if (user?.id) {
      loadOrders();
      loadStats();
    }
  }, [loadOrders, loadStats, user?.id]);
  
  useEffect(() => {
    loadOrders();
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header com estatísticas pessoais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Meus Pedidos</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gasto</p>
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
                <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                <p className="text-2xl font-bold">R$ {Number(stats?.averageTicket || 0).toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">{stats?.pending || 0} pendentes</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notificações */}
      {notifications.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <h3 className="font-medium text-blue-900">Atualizações Recentes</h3>
            </div>
            <div className="space-y-2">
              {notifications.slice(-3).map((notification) => (
                <div key={notification.id} className="text-sm text-blue-800">
                  {notification.message}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Buscar meus pedidos..."
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
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="90d">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={refreshData} disabled={refreshing} variant="outline">
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Meus Pedidos ({orders.length})</span>
            <div className="flex items-center gap-2">
              <Badge variant={wsConnected ? "default" : "destructive"}>
                {wsConnected ? "Atualizações em tempo real" : "Modo offline"}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500">Você ainda não fez nenhum pedido ou não há pedidos que correspondam aos filtros.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = getStatusInfo(order.status);
                const StatusIcon = statusInfo.icon;
                
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        
                        <div>
                          <p className="font-medium">#{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {statusInfo.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">R$ {Number(order.total || 0).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
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
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canCancelOrder(order.status) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowCancelModal(true);
                              }}
                              title="Cancelar Pedido"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canDeleteOrder(order.status, order.created_at) && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={() => {
                                setSelectedOrder(order);
                                setShowDeleteModal(true);
                              }}
                              title="Excluir do Histórico"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {order.status === 'delivered' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reorderItems(order.id)}
                              title="Comprar Novamente"
                            >
                              <Repeat className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {order.tracking_code && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => trackOrder(order.tracking_code!)}
                              title="Rastrear Entrega"
                            >
                              <Truck className="h-4 w-4" />
                            </Button>
                          )}
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

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido #{selectedOrder.id.substring(0, 8)}</DialogTitle>
              <DialogDescription>
                Informações completas sobre seu pedido, incluindo status, itens e histórico.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status Atual */}
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                {(() => {
                  const statusInfo = getStatusInfo(selectedOrder.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div className="flex items-center justify-center gap-3">
                      <StatusIcon className={`h-8 w-8 ${statusInfo.color.replace('bg-', 'text-')}`} />
                      <div>
                        <h3 className="text-lg font-medium">{statusInfo.label}</h3>
                        <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
              
              {/* Informações de Entrega */}
              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </h3>
                  <p className="text-sm text-muted-foreground">{selectedOrder.shipping_address}</p>
                </div>
              )}
              
              {/* Código de Rastreamento */}
              {selectedOrder.tracking_code && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Rastreamento
                  </h3>
                  <div className="flex items-center gap-2">
                    <code className="bg-gray-100 px-2 py-1 rounded text-sm">
                      {selectedOrder.tracking_code}
                    </code>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => trackOrder(selectedOrder.tracking_code!)}
                    >
                      Rastrear
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Itens do Pedido */}
              <div>
                <h3 className="font-medium mb-2">Itens</h3>
                <div className="space-y-2">
                  {(selectedOrder.items || []).map((item) => (
                    <div key={item.id} className="flex items-center gap-4 p-2 border rounded">
                      <img 
                        src={item.image_url || item.product_image} 
                        alt={item.name || item.product_name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name || item.product_name}</p>
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
              {selectedOrder.status_timeline && selectedOrder.status_timeline.length > 0 && (
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
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Modal de Cancelamento */}
      {selectedOrder && (
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Cancelar Pedido
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar este pedido?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Pedido:</strong> #{selectedOrder.id.substring(0, 8)}
                </p>
                <p className="text-sm text-yellow-800">
                  <strong>Valor:</strong> R$ {Number(selectedOrder.total || 0).toFixed(2)}
                </p>
                <p className="text-sm text-yellow-800 mt-2">
                  <strong>⚠️ Atenção:</strong> Esta ação não pode ser desfeita. O estoque dos produtos será restaurado automaticamente.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelModal(false)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => cancelOrder(selectedOrder.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Sim, Cancelar
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Modal de Exclusão */}
      {selectedOrder && (
        <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-gray-700">
                <Trash2 className="h-5 w-5" />
                Excluir Pedido do Histórico
              </DialogTitle>
              <DialogDescription>
                Tem certeza que deseja remover este pedido do seu histórico?
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>Pedido:</strong> #{selectedOrder.id.substring(0, 8)}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Status:</strong> {getStatusInfo(selectedOrder.status).label}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Data:</strong> {new Date(selectedOrder.created_at).toLocaleDateString('pt-BR')}
                </p>
                <p className="text-sm text-red-800 mt-2">
                  <strong>⚠️ Atenção:</strong> Esta ação é PERMANENTE e não pode ser desfeita. O pedido será removido completamente do seu histórico.
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteOrder(selectedOrder.id)}
                  disabled={actionLoading}
                  className="flex-1"
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Sim, Excluir
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default OrdersUnified;

