import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Truck,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Bell,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface InventoryMovement {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  movement_type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  cost_per_unit: number;
  total_cost: number;
  created_at: string;
}

interface StockAlert {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring' | 'expired';
  threshold_quantity: number;
  current_quantity: number;
  is_active: boolean;
  triggered_at: string;
}

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  city: string;
  state: string;
  is_active: boolean;
  created_at: string;
}

interface PurchaseOrder {
  id: string;
  order_number: string;
  supplier_name: string;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'completed' | 'cancelled';
  total_amount: number;
  expected_delivery_date: string;
  created_at: string;
}

const Inventory: React.FC = () => {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAdjustForm, setShowAdjustForm] = useState(false);

  // Formulário de ajuste de estoque
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    newQuantity: 0,
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMovements(),
        loadAlerts(),
        loadSuppliers(),
        loadPurchaseOrders()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      const response = await fetch('/api/inventory/movements?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setMovements(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await fetch('/api/inventory/alerts?is_active=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const response = await fetch('/api/inventory/suppliers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSuppliers(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadPurchaseOrders = async () => {
    try {
      const response = await fetch('/api/inventory/purchase-orders?limit=20', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setPurchaseOrders(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos de compra:', error);
    }
  };

  const adjustStock = async () => {
    try {
      const response = await fetch('/api/inventory/stock/adjust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(adjustForm)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowAdjustForm(false);
        setAdjustForm({ productId: '', newQuantity: 0, reason: '' });
        loadMovements();
        loadAlerts();
      } else {
        alert('Erro ao ajustar estoque: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao ajustar estoque:', error);
      alert('Erro ao ajustar estoque');
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/inventory/alerts/${alertId}/resolve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        loadAlerts();
      }
    } catch (error) {
      console.error('Erro ao resolver alerta:', error);
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'out':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      case 'adjustment':
        return <Settings className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <Truck className="w-4 h-4 text-orange-600" />;
      case 'return':
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementLabel = (type: string) => {
    switch (type) {
      case 'in':
        return 'Entrada';
      case 'out':
        return 'Saída';
      case 'adjustment':
        return 'Ajuste';
      case 'transfer':
        return 'Transferência';
      case 'return':
        return 'Devolução';
      default:
        return type;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'out_of_stock':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'overstock':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'expiring':
        return <Bell className="w-4 h-4 text-orange-600" />;
      case 'expired':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'Estoque Baixo';
      case 'out_of_stock':
        return 'Sem Estoque';
      case 'overstock':
        return 'Excesso de Estoque';
      case 'expiring':
        return 'Próximo do Vencimento';
      case 'expired':
        return 'Vencido';
      default:
        return type;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'low_stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_of_stock':
        return 'bg-red-100 text-red-800';
      case 'overstock':
        return 'bg-blue-100 text-blue-800';
      case 'expiring':
        return 'bg-orange-100 text-orange-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-purple-100 text-purple-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'confirmed':
        return 'Confirmado';
      case 'partial':
        return 'Parcial';
      case 'sent':
        return 'Enviado';
      case 'draft':
        return 'Rascunho';
      case 'cancelled':
        return 'Cancelado';
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

  const filteredMovements = movements.filter(movement => {
    const matchesSearch = movement.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.product_sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || movement.movement_type === filterType;
    return matchesSearch && matchesType;
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
        <h1 className="text-3xl font-bold text-gray-900">📦 Gestão de Estoque</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowAdjustForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajustar Estoque
          </Button>
        </div>
      </div>

      {/* Alertas de Estoque */}
      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-800">
              <Bell className="w-5 h-5 mr-2" />
              Alertas de Estoque ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.alert_type)}
                    <div>
                      <p className="font-medium">{alert.product_name}</p>
                      <p className="text-sm text-gray-600">
                        {alert.current_quantity} unidades restantes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getAlertColor(alert.alert_type)}>
                      {getAlertLabel(alert.alert_type)}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => resolveAlert(alert.id)}
                    >
                      Resolver
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="movements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="movements">Movimentações</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="purchase-orders">Pedidos de Compra</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nome ou SKU do produto"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="in">Entrada</SelectItem>
                      <SelectItem value="out">Saída</SelectItem>
                      <SelectItem value="adjustment">Ajuste</SelectItem>
                      <SelectItem value="transfer">Transferência</SelectItem>
                      <SelectItem value="return">Devolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Movimentações */}
          <div className="grid gap-4">
            {filteredMovements.map((movement) => (
              <Card key={movement.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getMovementIcon(movement.movement_type)}
                          <span className="font-semibold text-lg">{movement.product_name}</span>
                        </div>
                        <Badge variant="outline">
                          {getMovementLabel(movement.movement_type)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">SKU:</span> {movement.product_sku}
                        </div>
                        <div>
                          <span className="font-medium">Quantidade:</span> {movement.quantity}
                        </div>
                        <div>
                          <span className="font-medium">Estoque Anterior:</span> {movement.previous_stock}
                        </div>
                        <div>
                          <span className="font-medium">Novo Estoque:</span> {movement.new_stock}
                        </div>
                      </div>
                      
                      {movement.reason && (
                        <p className="text-sm text-gray-500 mt-2">Motivo: {movement.reason}</p>
                      )}
                      
                      {movement.total_cost && (
                        <p className="text-sm text-gray-500 mt-1">
                          Custo Total: {formatCurrency(movement.total_cost)}
                        </p>
                      )}
                      
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(movement.created_at)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas de Estoque</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getAlertIcon(alert.alert_type)}
                      <div>
                        <p className="font-medium">{alert.product_name}</p>
                        <p className="text-sm text-gray-600">
                          {alert.current_quantity} unidades (limite: {alert.threshold_quantity})
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getAlertColor(alert.alert_type)}>
                        {getAlertLabel(alert.alert_type)}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolver
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fornecedores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suppliers.map((supplier) => (
                  <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{supplier.name}</p>
                      <p className="text-sm text-gray-600">{supplier.contact_person}</p>
                      <p className="text-sm text-gray-500">{supplier.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                        {supplier.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos de Compra</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {purchaseOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-gray-600">{order.supplier_name}</p>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(order.total_amount)} • {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusLabel(order.status)}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Ajuste de Estoque */}
      {showAdjustForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Ajustar Estoque</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="productId">ID do Produto</Label>
                <Input
                  id="productId"
                  value={adjustForm.productId}
                  onChange={(e) => setAdjustForm({...adjustForm, productId: e.target.value})}
                  placeholder="ID do produto"
                />
              </div>
              
              <div>
                <Label htmlFor="newQuantity">Nova Quantidade</Label>
                <Input
                  id="newQuantity"
                  type="number"
                  value={adjustForm.newQuantity}
                  onChange={(e) => setAdjustForm({...adjustForm, newQuantity: parseInt(e.target.value)})}
                  placeholder="0"
                />
              </div>
              
              <div>
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm({...adjustForm, reason: e.target.value})}
                  placeholder="Motivo do ajuste"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={adjustStock} className="flex-1">
                  Ajustar
                </Button>
                <Button variant="outline" onClick={() => setShowAdjustForm(false)}>
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

export default Inventory;
