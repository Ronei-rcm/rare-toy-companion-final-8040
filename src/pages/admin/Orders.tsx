import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  Package, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle,
  Clock,
  Truck,
  AlertTriangle,
  XCircle,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  Edit,
  Trash2,
  Download,
  Send,
  MapPin,
  Calendar,
  User,
  Mail,
  Phone,
  CreditCard,
  TruckIcon,
  CheckCircle2,
  X,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Order {
  id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  total: number;
  created_at: string;
  updated_at: string;
  tracking_number?: string;
  shipment_status?: string;
}

interface OrderStatusHistory {
  id: string;
  status: string;
  previous_status: string;
  notes: string;
  changed_by_name: string;
  changed_at: string;
}

interface ShippingMethod {
  id: string;
  name: string;
  description: string;
  carrier: string;
  estimated_days: number;
  base_cost: number;
  cost_per_kg: number;
  free_shipping_threshold: number;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  avg_order_value: number;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orderHistory, setOrderHistory] = useState<OrderStatusHistory[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showShippingModal, setShowShippingModal] = useState(false);

  // Formulário de atualização de status
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });

  // Formulário de envio
  const [shippingForm, setShippingForm] = useState({
    shipping_method_id: '',
    tracking_number: '',
    carrier: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadShippingMethods(),
        loadStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch('/api/orders/report?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    }
  };

  const loadShippingMethods = async () => {
    try {
      const response = await fetch('/api/orders/shipping-methods');
      
      const data = await response.json();
      if (data.success) {
        setShippingMethods(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar métodos de envio:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/orders/stats', {
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

  const loadOrderHistory = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/history`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setOrderHistory(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: statusForm.status,
          notes: statusForm.notes,
          changed_by: 'admin'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowStatusModal(false);
        setStatusForm({ status: '', notes: '' });
        loadOrders();
        loadOrderHistory(selectedOrder.id);
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const createShipment = async () => {
    if (!selectedOrder) return;

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}/shipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          shipping_method_id: shippingForm.shipping_method_id,
          tracking_number: shippingForm.tracking_number,
          carrier: shippingForm.carrier,
          notes: shippingForm.notes
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowShippingModal(false);
        setShippingForm({
          shipping_method_id: '',
          tracking_number: '',
          carrier: '',
          notes: ''
        });
        loadOrders();
      }
    } catch (error) {
      console.error('Erro ao criar envio:', error);
    }
  };

  const processOrder = async (orderId: string, action: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action })
      });
      
      if (response.ok) {
        loadOrders();
        if (selectedOrder?.id === orderId) {
          loadOrderHistory(orderId);
        }
      }
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'confirmed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processing':
        return <Settings className="w-4 h-4 text-orange-600" />;
      case 'shipped':
        return <Truck className="w-4 h-4 text-purple-600" />;
      case 'delivered':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'returned':
        return <ArrowLeft className="w-4 h-4 text-gray-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-orange-100 text-orange-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'processing':
        return 'Processando';
      case 'shipped':
        return 'Enviado';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      case 'returned':
        return 'Devolvido';
      default:
        return status;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    
    return matchesSearch && matchesStatus;
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
        <h1 className="text-3xl font-bold text-gray-900">📦 Gestão de Pedidos</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total_orders}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_orders}</div>
              <div className="text-sm text-gray-600">Pendentes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.confirmed_orders}</div>
              <div className="text-sm text-gray-600">Confirmados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.processing_orders}</div>
              <div className="text-sm text-gray-600">Processando</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.shipped_orders}</div>
              <div className="text-sm text-gray-600">Enviados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.delivered_orders}</div>
              <div className="text-sm text-gray-600">Entregues</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.cancelled_orders}</div>
              <div className="text-sm text-gray-600">Cancelados</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</div>
              <div className="text-sm text-gray-600">Receita</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Pedidos */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="ID, nome ou email do cliente"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="returned">Devolvido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Pedidos */}
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card 
                key={order.id} 
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  selectedOrder?.id === order.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => {
                  setSelectedOrder(order);
                  loadOrderHistory(order.id);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(order.status)}
                          <span className="font-semibold text-lg">#{order.id}</span>
                        </div>
                        <Badge className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Cliente:</span> {order.customer_name}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {order.customer_email}
                        </div>
                        <div>
                          <span className="font-medium">Total:</span> {formatCurrency(order.total)}
                        </div>
                        <div>
                          <span className="font-medium">Data:</span> {formatDate(order.created_at)}
                        </div>
                      </div>
                      
                      {order.tracking_number && (
                        <div className="text-sm text-gray-500 mt-2">
                          <span className="font-medium">Rastreamento:</span> {order.tracking_number}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(order);
                          setShowStatusModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Status
                      </Button>
                      
                      {order.status === 'confirmed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrder(order);
                            setShowShippingModal(true);
                          }}
                        >
                          <Truck className="w-4 h-4 mr-1" />
                          Enviar
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detalhes do Pedido */}
        <div className="space-y-6">
          {selectedOrder ? (
            <>
              {/* Informações do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="w-5 h-5 mr-2" />
                    Pedido #{selectedOrder.id}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={getStatusColor(selectedOrder.status)}>
                      {getStatusIcon(selectedOrder.status)}
                      <span className="ml-1">{getStatusLabel(selectedOrder.status)}</span>
                    </Badge>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Cliente</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                    <p className="text-sm text-gray-500">{selectedOrder.customer_email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-medium text-lg">{formatCurrency(selectedOrder.total)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Data de Criação</p>
                    <p className="font-medium">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  
                  {selectedOrder.tracking_number && (
                    <div>
                      <p className="text-sm text-gray-600">Rastreamento</p>
                      <p className="font-medium">{selectedOrder.tracking_number}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ações Rápidas */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {selectedOrder.status === 'pending' && (
                    <Button
                      className="w-full"
                      onClick={() => processOrder(selectedOrder.id, 'confirm')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirmar Pedido
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'confirmed' && (
                    <Button
                      className="w-full"
                      onClick={() => processOrder(selectedOrder.id, 'process')}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Processar
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'processing' && (
                    <Button
                      className="w-full"
                      onClick={() => processOrder(selectedOrder.id, 'ship')}
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Enviar
                    </Button>
                  )}
                  
                  {selectedOrder.status === 'shipped' && (
                    <Button
                      className="w-full"
                      onClick={() => processOrder(selectedOrder.id, 'deliver')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Marcar como Entregue
                    </Button>
                  )}
                  
                  {(selectedOrder.status === 'pending' || selectedOrder.status === 'confirmed') && (
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => processOrder(selectedOrder.id, 'cancel')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {orderHistory.map((history) => (
                      <div key={history.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className="flex-shrink-0">
                          {getStatusIcon(history.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{getStatusLabel(history.status)}</p>
                            <p className="text-xs text-gray-500">{formatDate(history.changed_at)}</p>
                          </div>
                          {history.notes && (
                            <p className="text-xs text-gray-600 mt-1">{history.notes}</p>
                          )}
                          <p className="text-xs text-gray-500">
                            Por: {history.changed_by_name || 'Sistema'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecione um pedido para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Atualização de Status */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Atualizar Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">Novo Status</Label>
                <Select value={statusForm.status} onValueChange={(value) => setStatusForm({...statusForm, status: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="processing">Processando</SelectItem>
                    <SelectItem value="shipped">Enviado</SelectItem>
                    <SelectItem value="delivered">Entregue</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="returned">Devolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm({...statusForm, notes: e.target.value})}
                  placeholder="Observações sobre a mudança de status"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={updateOrderStatus} className="flex-1">
                  Atualizar
                </Button>
                <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Envio */}
      {showShippingModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Criar Envio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="shipping_method">Método de Envio</Label>
                <Select value={shippingForm.shipping_method_id} onValueChange={(value) => setShippingForm({...shippingForm, shipping_method_id: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingMethods.map(method => (
                      <SelectItem key={method.id} value={method.id}>
                        {method.name} - {formatCurrency(method.base_cost)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tracking_number">Código de Rastreamento</Label>
                <Input
                  id="tracking_number"
                  value={shippingForm.tracking_number}
                  onChange={(e) => setShippingForm({...shippingForm, tracking_number: e.target.value})}
                  placeholder="Código de rastreamento"
                />
              </div>
              
              <div>
                <Label htmlFor="carrier">Transportadora</Label>
                <Input
                  id="carrier"
                  value={shippingForm.carrier}
                  onChange={(e) => setShippingForm({...shippingForm, carrier: e.target.value})}
                  placeholder="Nome da transportadora"
                />
              </div>
              
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  value={shippingForm.notes}
                  onChange={(e) => setShippingForm({...shippingForm, notes: e.target.value})}
                  placeholder="Observações sobre o envio"
                  rows={3}
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createShipment} className="flex-1">
                  Criar Envio
                </Button>
                <Button variant="outline" onClick={() => setShowShippingModal(false)}>
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

export default Orders;
