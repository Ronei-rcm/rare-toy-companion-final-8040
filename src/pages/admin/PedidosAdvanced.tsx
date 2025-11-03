import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  MoreVertical,
  Eye,
  Edit,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  FileText,
  Send,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  MapPin,
  CreditCard,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  AlertCircle,
  User,
  History,
  MessageSquare,
  Star,
  Flag,
  BarChart,
  BarChart,
  Activity,
  Zap,
  Target,
  Award,
  Shield,
  Bell,
  Settings,
  Plus,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  Check,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductImage } from '@/utils/imageUtils';
import { formatCurrency } from '@/utils/currencyUtils';
import { formatDate } from '@/utils/dateUtils';

interface Order {
  id: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total: number;
  payment_method: string;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
  shipping_address: any;
  billing_address: any;
  notes?: string;
  tracking_code?: string;
  estimated_delivery?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  customer_history: {
    total_orders: number;
    total_spent: number;
    last_order: string;
    average_ticket: number;
    customer_type: 'new' | 'regular' | 'vip' | 'premium';
  };
}

interface OrderItem {
  id: string;
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  category: string;
  brand?: string;
  sku?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_orders: number;
  total_spent: number;
  last_order: string;
  customer_type: string;
  registration_date: string;
  status: 'active' | 'inactive' | 'blocked';
  tags: string[];
  notes?: string;
}

const PedidosAdvanced = () => {
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Estados principais
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Estados de seleção
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Estados de modais
  const [orderDetailsModal, setOrderDetailsModal] = useState<Order | null>(null);
  const [customerDetailsModal, setCustomerDetailsModal] = useState<Customer | null>(null);
  const [statusUpdateModal, setStatusUpdateModal] = useState<Order | null>(null);
  const [trackingModal, setTrackingModal] = useState<Order | null>(null);
  const [notesModal, setNotesModal] = useState<Order | null>(null);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Estados de estatísticas
  const [stats, setStats] = useState({
    total_orders: 0,
    total_revenue: 0,
    pending_orders: 0,
    processing_orders: 0,
    shipped_orders: 0,
    delivered_orders: 0,
    cancelled_orders: 0,
    total_customers: 0,
    new_customers_today: 0,
    average_ticket: 0,
    conversion_rate: 0,
    top_customers: [],
    recent_orders: [],
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadOrders(),
        loadCustomers(),
        loadStats(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders-advanced`);
      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar pedidos",
        variant: "destructive",
      });
    }
  };

  const loadCustomers = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/customers-advanced`);
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders-stats-advanced`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  // Filtros e ordenação
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_phone.includes(searchTerm)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtro de cliente
    if (customerFilter !== 'all') {
      filtered = filtered.filter(order => order.customer_id === customerFilter);
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.created_at);
        switch (dateFilter) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filtro de prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter);
    }

    // Filtro de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_method === paymentFilter);
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'recent':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case 'total':
          comparison = a.total - b.total;
          break;
        case 'customer':
          comparison = a.customer_name.localeCompare(b.customer_name);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [orders, searchTerm, statusFilter, customerFilter, dateFilter, priorityFilter, paymentFilter, sortBy, sortOrder]);

  const filteredCustomers = useMemo(() => {
    let filtered = [...customers];

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)
      );
    }

    return filtered;
  }, [customers, searchTerm]);

  // Funções de ação
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
        toast({
          title: "Sucesso",
          description: "Status do pedido atualizado com sucesso",
        });
        setStatusUpdateModal(null);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar status do pedido",
        variant: "destructive",
      });
    }
  };

  const updateTrackingCode = async (orderId: string, trackingCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tracking_code: trackingCode }),
      });

      if (response.ok) {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, tracking_code: trackingCode } : order
        ));
        toast({
          title: "Sucesso",
          description: "Código de rastreamento atualizado",
        });
        setTrackingModal(null);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao atualizar código de rastreamento",
        variant: "destructive",
      });
    }
  };

  const addOrderNote = async (orderId: string, note: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Nota adicionada ao pedido",
        });
        setNotesModal(null);
        loadOrders();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao adicionar nota",
        variant: "destructive",
      });
    }
  };

  const exportOrders = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          filters: {
            searchTerm,
            statusFilter,
            customerFilter,
            dateFilter,
            priorityFilter,
            paymentFilter
          }
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Sucesso",
          description: "Relatório exportado com sucesso",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao exportar relatório",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
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

  const getCustomerTypeColor = (type: string) => {
    const colors = {
      new: 'bg-green-100 text-green-800',
      regular: 'bg-blue-100 text-blue-800',
      vip: 'bg-purple-100 text-purple-800',
      premium: 'bg-gold-100 text-gold-800',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão Avançada de Pedidos</h1>
          <p className="text-gray-600 mt-1">
            Gerencie pedidos e clientes com ferramentas profissionais
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={exportOrders} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Receita Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.total_revenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_customers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.average_ticket)}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="orders">Pedidos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        {/* Tab de Pedidos */}
        <TabsContent value="orders" className="space-y-4">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search"
                      placeholder="ID, nome, email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="processing">Preparando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="customer">Cliente</Label>
                  <Select value={customerFilter} onValueChange={setCustomerFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Clientes</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="date">Período</Label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Períodos</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Última Semana</SelectItem>
                      <SelectItem value="month">Último Mês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Pedidos */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Mais Recentes</SelectItem>
                      <SelectItem value="total">Maior Valor</SelectItem>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="status">Status</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  >
                    {sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedOrders.length === filteredOrders.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedOrders(filteredOrders.map(order => order.id));
                            } else {
                              setSelectedOrders([]);
                            }
                          }}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prioridade</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="w-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedOrders([...selectedOrders, order.id]);
                              } else {
                                setSelectedOrders(selectedOrders.filter(id => id !== order.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          #{order.id.slice(-8)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.customer_name}</div>
                            <div className="text-sm text-gray-500">{order.customer_email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(order.priority)}>
                            {order.priority}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(order.total)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(order.created_at)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setOrderDetailsModal(order)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setStatusUpdateModal(order)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Alterar Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTrackingModal(order)}>
                                <Truck className="h-4 w-4 mr-2" />
                                Rastreamento
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setNotesModal(order)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Adicionar Nota
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setCustomerDetailsModal(
                                customers.find(c => c.id === order.customer_id) || null
                              )}>
                                <User className="h-4 w-4 mr-2" />
                                Ver Cliente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Clientes */}
        <TabsContent value="customers" className="space-y-4">
          {/* Tabela de Clientes */}
          <Card>
            <CardHeader>
              <CardTitle>Clientes ({filteredCustomers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Total de Pedidos</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Último Pedido</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getCustomerTypeColor(customer.customer_type)}>
                            {customer.customer_type}
                          </Badge>
                        </TableCell>
                        <TableCell>{customer.total_orders}</TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(customer.total_spent)}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {formatDate(customer.last_order)}
                        </TableCell>
                        <TableCell>
                          <Badge className={customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setCustomerDetailsModal(customer)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setCustomerFilter(customer.id);
                                setActiveTab('orders');
                              }}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ver Pedidos
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Enviar Mensagem
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={!!orderDetailsModal} onOpenChange={() => setOrderDetailsModal(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{orderDetailsModal?.id}</DialogTitle>
            <DialogDescription>
              Informações completas do pedido e itens
            </DialogDescription>
          </DialogHeader>
          {orderDetailsModal && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p><strong>Nome:</strong> {orderDetailsModal.customer_name}</p>
                    <p><strong>Email:</strong> {orderDetailsModal.customer_email}</p>
                    <p><strong>Telefone:</strong> {orderDetailsModal.customer_phone}</p>
                  </div>
                  <div>
                    <p><strong>Total de Pedidos:</strong> {orderDetailsModal.customer_history.total_orders}</p>
                    <p><strong>Total Gasto:</strong> {formatCurrency(orderDetailsModal.customer_history.total_spent)}</p>
                    <p><strong>Tipo:</strong> {orderDetailsModal.customer_history.customer_type}</p>
                  </div>
                </div>
              </div>

              {/* Itens do Pedido */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {orderDetailsModal.items.map((item: OrderItem) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 border rounded-lg">
                      <img
                        src={getProductImage(item.image_url)}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price)}</p>
                        <p className="text-sm text-gray-500">Qtd: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total do Pedido:</span>
                  <span className="text-xl font-bold text-blue-600">
                    {formatCurrency(orderDetailsModal.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Atualizar Status */}
      <Dialog open={!!statusUpdateModal} onOpenChange={() => setStatusUpdateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Pedido</DialogTitle>
            <DialogDescription>
              Selecione o novo status para o pedido #{statusUpdateModal?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              defaultValue={statusUpdateModal?.status}
              onValueChange={(value) => {
                if (statusUpdateModal) {
                  updateOrderStatus(statusUpdateModal.id, value);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="processing">Preparando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Rastreamento */}
      <Dialog open={!!trackingModal} onOpenChange={() => setTrackingModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Código de Rastreamento</DialogTitle>
            <DialogDescription>
              Adicione ou atualize o código de rastreamento para o pedido #{trackingModal?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tracking">Código de Rastreamento</Label>
              <Input
                id="tracking"
                placeholder="Ex: BR123456789"
                defaultValue={trackingModal?.tracking_code || ''}
                onChange={(e) => {
                  if (trackingModal) {
                    updateTrackingCode(trackingModal.id, e.target.value);
                  }
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Notas */}
      <Dialog open={!!notesModal} onOpenChange={() => setNotesModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Nota</DialogTitle>
            <DialogDescription>
              Adicione uma nota interna para o pedido #{notesModal?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Nota</Label>
              <Textarea
                id="note"
                placeholder="Digite sua nota aqui..."
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => {
                  const note = (document.getElementById('note') as HTMLTextAreaElement)?.value;
                  if (note && notesModal) {
                    addOrderNote(notesModal.id, note);
                  }
                }}
              >
                Adicionar Nota
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={!!customerDetailsModal} onOpenChange={() => setCustomerDetailsModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>
              Informações completas do cliente
            </DialogDescription>
          </DialogHeader>
          {customerDetailsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><strong>Nome:</strong> {customerDetailsModal.name}</p>
                  <p><strong>Email:</strong> {customerDetailsModal.email}</p>
                  <p><strong>Telefone:</strong> {customerDetailsModal.phone}</p>
                </div>
                <div>
                  <p><strong>Total de Pedidos:</strong> {customerDetailsModal.total_orders}</p>
                  <p><strong>Total Gasto:</strong> {formatCurrency(customerDetailsModal.total_spent)}</p>
                  <p><strong>Tipo:</strong> {customerDetailsModal.customer_type}</p>
                </div>
              </div>
              {customerDetailsModal.notes && (
                <div>
                  <p><strong>Notas:</strong></p>
                  <p className="text-gray-600">{customerDetailsModal.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedidosAdvanced;
