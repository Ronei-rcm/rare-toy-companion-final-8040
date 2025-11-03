import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Star,
  MessageSquare,
  BarChart,
  BarChart,
  Activity,
  Zap,
  Target,
  Award,
  Shield,
  Settings,
  Bell,
  Archive,
  Trash2,
  Copy,
  Share2,
  Printer,
  Upload,
  Plus,
  Minus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Info,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminOrders } from '@/hooks/useAdminOrders';

// Tipos
interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  payment_method: string;
  items_count: number;
  shipping_address?: string;
  notes?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  tags?: string[];
  estimated_delivery?: string;
  tracking_code?: string;
  payment_status?: string;
  source?: string;
  discount?: number;
  tax?: number;
  shipping_cost?: number;
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
  totalCustomers: number;
  newCustomers: number;
  conversionRate?: number;
  averageOrderValue?: number;
  topSellingProducts?: any[];
  recentActivity?: any[];
}

const PedidosSuperEvolved = () => {
  const { toast } = useToast();
  
  // Hook personalizado para gerenciar pedidos
  const {
    orders,
    stats,
    loading,
    pagination,
    loadOrders,
    loadStats,
    updateOrderStatus,
    associateCustomer,
    searchCustomers,
    bulkAction,
    exportOrders,
  } = useAdminOrders();

  // Estados principais
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'timeline'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);

  // Seleção e ações em lote
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Modais e diálogos
  const [detailsModal, setDetailsModal] = useState<Order | null>(null);
  const [statusModal, setStatusModal] = useState<Order | null>(null);
  const [trackingModal, setTrackingModal] = useState<Order | null>(null);
  const [notesModal, setNotesModal] = useState<Order | null>(null);
  const [customerModal, setCustomerModal] = useState<Order | null>(null);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);

  // Estados para funcionalidades avançadas
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [notifications, setNotifications] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedFilters, setSavedFilters] = useState<any[]>([]);

  // Estados para busca de clientes
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Estados para analytics
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [timeRange, setTimeRange] = useState('7d');

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  // Aplicar filtros
  useEffect(() => {
    applyAdvancedFilters();
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter, priorityFilter, customerFilter, sortBy, sortOrder, priceRange, tagsFilter]);

  const loadInitialData = async () => {
    try {
      await Promise.all([
        loadOrders(),
        loadStats(),
        loadAnalytics(),
        loadNotifications(),
        loadSavedFilters()
      ]);
    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados iniciais",
        variant: "destructive",
      });
    }
  };

  const loadAnalytics = async () => {
    try {
      // Simular dados de analytics
      setAnalyticsData({
        ordersTrend: [
          { date: '2025-10-17', orders: 12, revenue: 1200 },
          { date: '2025-10-18', orders: 15, revenue: 1500 },
          { date: '2025-10-19', orders: 8, revenue: 800 },
          { date: '2025-10-20', orders: 20, revenue: 2000 },
          { date: '2025-10-21', orders: 18, revenue: 1800 },
          { date: '2025-10-22', orders: 25, revenue: 2500 },
          { date: '2025-10-23', orders: 22, revenue: 2200 },
        ],
        topProducts: [
          { name: 'Boneco de Ação Super Herói', sales: 45, revenue: 2250 },
          { name: 'Carrinho de Controle Remoto', sales: 32, revenue: 1600 },
          { name: 'Puzzle 3D', sales: 28, revenue: 1400 },
        ],
        customerSegments: [
          { segment: 'VIP', count: 15, revenue: 4500 },
          { segment: 'Regular', count: 120, revenue: 6000 },
          { segment: 'Novo', count: 45, revenue: 1800 },
        ]
      });
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    }
  };

  const loadNotifications = async () => {
    // Simular notificações
    setNotifications([
      {
        id: '1',
        type: 'order',
        title: 'Novo pedido recebido',
        message: 'Pedido #PED-001 foi criado',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'payment',
        title: 'Pagamento confirmado',
        message: 'Pagamento do pedido #PED-002 foi confirmado',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ]);
  };

  const loadSavedFilters = async () => {
    // Carregar filtros salvos do localStorage
    const saved = localStorage.getItem('savedFilters');
    if (saved) {
      setSavedFilters(JSON.parse(saved));
    }
  };

  const applyAdvancedFilters = () => {
    let filtered = [...orders];

    // Filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_phone && order.customer_phone.includes(searchTerm))
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtro de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_method === paymentFilter);
    }

    // Filtro de prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(order => order.priority === priorityFilter);
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
          case 'year':
            const yearAgo = new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000);
            return orderDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    // Filtro de faixa de preço
    if (priceRange.min) {
      filtered = filtered.filter(order => order.total >= parseFloat(priceRange.min));
    }
    if (priceRange.max) {
      filtered = filtered.filter(order => order.total <= parseFloat(priceRange.max));
    }

    // Filtro de tags
    if (tagsFilter.length > 0) {
      filtered = filtered.filter(order => 
        order.tags && order.tags.some(tag => tagsFilter.includes(tag))
      );
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

    setFilteredOrders(filtered);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadOrders(), loadStats()]);
      toast({
        title: "Atualizado",
        description: "Dados atualizados com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar dados",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: "Aviso",
        description: "Selecione pelo menos um pedido",
        variant: "destructive",
      });
      return;
    }

    try {
      await bulkAction(action, selectedOrders);
      setSelectedOrders([]);
      setBulkActionModal(false);
      toast({
        title: "Sucesso",
        description: `Ação ${action} executada em ${selectedOrders.length} pedidos`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao executar ação em lote",
        variant: "destructive",
      });
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      await exportOrders(format, filteredOrders);
      toast({
        title: "Exportado",
        description: `Pedidos exportados em formato ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao exportar pedidos",
        variant: "destructive",
      });
    }
  };

  const saveFilter = () => {
    const filter = {
      id: Date.now().toString(),
      name: `Filtro ${new Date().toLocaleDateString()}`,
      filters: {
        searchTerm,
        statusFilter,
        paymentFilter,
        dateFilter,
        priorityFilter,
        customerFilter,
        sortBy,
        sortOrder,
        priceRange,
        tagsFilter
      }
    };
    
    const newSavedFilters = [...savedFilters, filter];
    setSavedFilters(newSavedFilters);
    localStorage.setItem('savedFilters', JSON.stringify(newSavedFilters));
    
    toast({
      title: "Filtro Salvo",
      description: "Filtro salvo com sucesso",
    });
  };

  const loadFilter = (filter: any) => {
    setSearchTerm(filter.filters.searchTerm);
    setStatusFilter(filter.filters.statusFilter);
    setPaymentFilter(filter.filters.paymentFilter);
    setDateFilter(filter.filters.dateFilter);
    setPriorityFilter(filter.filters.priorityFilter);
    setCustomerFilter(filter.filters.customerFilter);
    setSortBy(filter.filters.sortBy);
    setSortOrder(filter.filters.sortOrder);
    setPriceRange(filter.filters.priceRange);
    setTagsFilter(filter.filters.tagsFilter);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <Package className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  // Componente de estatísticas avançadas
  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.todayOrders} hoje
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Number(stats.totalRevenue || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              +R$ {Number(stats.todayRevenue || 0).toFixed(2)} hoje
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {Number(stats.averageTicket || 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Por pedido
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">
              Aguardando ação
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );

  // Componente de filtros avançados
  const AdvancedFilters = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avançados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="ID, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="processing">Processando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pagamento</Label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos pagamentos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos pagamentos</SelectItem>
                <SelectItem value="PIX">PIX</SelectItem>
                <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                <SelectItem value="Boleto">Boleto</SelectItem>
                <SelectItem value="Transferência">Transferência</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos períodos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas prioridades</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="low">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Ordenar por</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Mais recentes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="total">Valor total</SelectItem>
                <SelectItem value="customer">Cliente</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Faixa de Preço</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Mín"
                value={priceRange.min}
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                type="number"
              />
              <Input
                placeholder="Máx"
                value={priceRange.max}
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                type="number"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ações</Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveFilter}
              >
                <Star className="h-4 w-4 mr-2" />
                Salvar Filtro
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setPaymentFilter('all');
                  setDateFilter('all');
                  setPriorityFilter('all');
                  setCustomerFilter('all');
                  setSortBy('recent');
                  setSortOrder('desc');
                  setPriceRange({ min: '', max: '' });
                  setTagsFilter([]);
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </div>

        {savedFilters.length > 0 && (
          <div className="mt-4">
            <Label>Filtros Salvos</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {savedFilters.map((filter) => (
                <Button
                  key={filter.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadFilter(filter)}
                >
                  {filter.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Componente de ações em lote
  const BulkActions = () => (
    <AnimatePresence>
      {selectedOrders.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
        >
          <Card className="shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedOrders.length} pedido(s) selecionado(s)
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setBulkActionModal(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Ações em Lote
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedOrders([])}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Componente principal da tabela
  const OrdersTable = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModal(true)}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsModal(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
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
                <TableHead>Data</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead className="w-12"></TableHead>
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
                          setSelectedOrders(prev => [...prev, order.id]);
                        } else {
                          setSelectedOrders(prev => prev.filter(id => id !== order.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-muted-foreground">{order.customer_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </TableCell>
                  <TableCell>{order.payment_method}</TableCell>
                  <TableCell className="font-medium">
                    R$ {Number(order.total || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>{order.items_count}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setDetailsModal(order)}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setStatusModal(order)}>
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
                        <DropdownMenuItem onClick={() => setCustomerModal(order)}>
                          <Users className="h-4 w-4 mr-2" />
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

        {filteredOrders.length === 0 && (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou criar um novo pedido
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos da loja com ferramentas avançadas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Zap className="h-4 w-4 mr-2" />
            Auto-refresh {autoRefresh ? 'ON' : 'OFF'}
          </Button>
          <Button onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <StatsCards />

      {/* Filtros Avançados */}
      <AdvancedFilters />

      {/* Tabela de Pedidos */}
      <OrdersTable />

      {/* Ações em Lote */}
      <BulkActions />

      {/* Modais */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              Informações completas do pedido {detailsModal?.id}
            </DialogDescription>
          </DialogHeader>
          {detailsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cliente</Label>
                  <p className="font-medium">{detailsModal.customer_name}</p>
                  <p className="text-sm text-muted-foreground">{detailsModal.customer_email}</p>
                </div>
                <div>
                  <Label>Status</Label>
                  <Badge className={getStatusColor(detailsModal.status)}>
                    {getStatusIcon(detailsModal.status)}
                    <span className="ml-1 capitalize">{detailsModal.status}</span>
                  </Badge>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="font-medium">R$ {Number(detailsModal.total || 0).toFixed(2)}</p>
                </div>
                <div>
                  <Label>Método de Pagamento</Label>
                  <p>{detailsModal.payment_method}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Ações em Lote */}
      <Dialog open={bulkActionModal} onOpenChange={setBulkActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ações em Lote</DialogTitle>
            <DialogDescription>
              Selecione uma ação para aplicar em {selectedOrders.length} pedido(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                onClick={() => handleBulkAction('update_status')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Alterar Status
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('export')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('add_note')}
              >
                <FileText className="h-4 w-4 mr-2" />
                Adicionar Nota
              </Button>
              <Button
                variant="outline"
                onClick={() => handleBulkAction('send_email')}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Email
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Exportação */}
      <Dialog open={exportModal} onOpenChange={setExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Pedidos</DialogTitle>
            <DialogDescription>
              Escolha o formato para exportar {filteredOrders.length} pedido(s)
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
            >
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('excel')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('pdf')}
            >
              <FileText className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PedidosSuperEvolved;
