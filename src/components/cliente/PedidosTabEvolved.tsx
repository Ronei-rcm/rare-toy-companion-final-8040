import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Search,
  Download,
  RefreshCw,
  Eye,
  MapPin,
  CreditCard,
  FileText,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  Zap,
  Heart,
  Filter,
  BarChart,
  BarChart,
  Activity,
  AlertCircle,
  Bell,
  Share2,
  Bookmark,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import OrderTracking from './OrderTracking';
import { getProductImage } from '@/utils/imageUtils';

const PedidosTabEvolved = () => {
  const navigate = useNavigate();
  const { user } = useCurrentUser() as any;
  const { addItem } = useCart();
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const [isLoading, setIsLoading] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    delivered: 0,
    totalSpent: 0,
    lastMonth: 0,
  });
  
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    period: 'todos',
    sortBy: 'recente',
    minValue: '',
    maxValue: '',
    paymentMethod: 'todos',
  });
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [insights, setInsights] = useState({
    averageOrderValue: 0,
    mostOrderedCategory: '',
    favoritePaymentMethod: '',
    orderFrequency: 0,
    totalSavings: 0,
  });

  useEffect(() => {
    if (user) {
      loadOrders();
      loadStats();
    }
  }, [user, filters.status, filters.period, filters.sortBy]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (filters.status !== 'todos') params.append('status', filters.status);
      if (filters.period !== 'todos') params.append('period', filters.period);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(
        `${API_BASE_URL}/orders?${params}`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        let orders = data.orders || data || [];

        // Ordenação
        orders = orders.sort((a: any, b: any) => {
          switch (filters.sortBy) {
            case 'antigo':
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            case 'maior':
              return Number(b.total) - Number(a.total);
            case 'menor':
              return Number(a.total) - Number(b.total);
            default: // recente
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }
        });

        setPedidos(orders);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setPedidos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/${user.id}/order-stats`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadInsights = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/${user.id}/order-insights`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setInsights(data);
      }
    } catch (error) {
      console.error('Erro ao carregar insights:', error);
    }
  };

  const handleBulkAction = (action: string) => {
    if (selectedOrders.length === 0) {
      toast({
        title: 'Nenhum pedido selecionado',
        description: 'Selecione pelo menos um pedido para realizar a ação',
        variant: 'destructive',
      });
      return;
    }

    switch (action) {
      case 'export':
        const selectedPedidos = pedidos.filter(p => selectedOrders.includes(p.id));
        const csv = [
          ['ID', 'Data', 'Status', 'Total', 'Itens'].join(','),
          ...selectedPedidos.map((order) =>
            [
              order.id.substring(0, 8),
              new Date(order.created_at).toLocaleDateString('pt-BR'),
              order.status,
              `R$ ${Number(order.total).toFixed(2)}`,
              order.items?.length || 0,
            ].join(',')
          ),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pedidos-selecionados-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        break;
      case 'reorder':
        selectedOrders.forEach(orderId => {
          handleReorder(orderId);
        });
        break;
    }
    
    setSelectedOrders([]);
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'todos',
      period: 'todos',
      sortBy: 'recente',
      minValue: '',
      maxValue: '',
      paymentMethod: 'todos',
    });
  };

  const handleReorder = async (orderId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: 'Produtos adicionados! 🛒',
          description: 'Os produtos foram adicionados ao seu carrinho',
        });
        navigate('/carrinho');
      }
    } catch (error) {
      toast({
        title: 'Erro ao reordenar',
        description: 'Não foi possível adicionar os produtos',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    window.open(`${API_BASE_URL}/orders/${orderId}/invoice`, '_blank');
  };

  const handleExportOrders = () => {
    const csv = [
      ['ID', 'Data', 'Status', 'Total', 'Itens'].join(','),
      ...pedidos.map((order) =>
        [
          order.id.substring(0, 8),
          new Date(order.created_at).toLocaleDateString('pt-BR'),
          order.status,
          `R$ ${Number(order.total).toFixed(2)}`,
          order.items?.length || 0,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meus-pedidos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      pending: { label: 'Pendente', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'bg-blue-100 text-blue-800 border-blue-300' },
      processing: { label: 'Preparando', icon: Package, color: 'bg-purple-100 text-purple-800 border-purple-300' },
      shipped: { label: 'Enviado', icon: Truck, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
      delivered: { label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
      cancelled: { label: 'Cancelado', icon: Clock, color: 'bg-red-100 text-red-800 border-red-300' },
    };

    return configs[status] || configs.pending;
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Faça login</h3>
          <p className="text-muted-foreground mb-4">
            Entre na sua conta para ver seus pedidos
          </p>
          <Button onClick={() => navigate('/auth/login')}>Fazer Login</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 mb-1">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-700 mb-1">Total Gasto</p>
                  <p className="text-xl font-bold text-green-900">R$ {Number(stats.totalSpent || 0).toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-purple-700 mb-1">Entregues</p>
                  <p className="text-2xl font-bold text-purple-900">{stats.delivered}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-amber-700 mb-1">Este Mês</p>
                  <p className="text-2xl font-bold text-amber-900">{stats.lastMonth}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights Personalizados */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Insights dos Seus Pedidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/60 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">Ticket Médio</span>
              </div>
              <p className="text-2xl font-bold text-green-700">R$ {Number(insights.averageOrderValue || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">Frequência</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{insights.orderFrequency} dias</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium">Economia Total</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">R$ {Number(insights.totalSavings || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white/60 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">Pagamento Favorito</span>
              </div>
              <p className="text-lg font-bold text-orange-700">{insights.favoritePaymentMethod || 'PIX'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros e Busca */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span>Meus Pedidos ({pedidos.length})</span>
              {selectedOrders.length > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Bookmark className="w-3 h-3" />
                  {selectedOrders.length} selecionados
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'chart' : 'list')}
              >
                {viewMode === 'list' ? <BarChart className="w-4 h-4 mr-2" /> : <BarChart className="w-4 h-4 mr-2" />}
                {viewMode === 'list' ? 'Gráficos' : 'Lista'}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportOrders}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, produto..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status}
              onValueChange={(value) => setFilters({ ...filters, status: value })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="processing">Preparando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.period}
              onValueChange={(value) => setFilters({ ...filters, period: value })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recente">Mais recentes</SelectItem>
                <SelectItem value="antigo">Mais antigos</SelectItem>
                <SelectItem value="maior">Maior valor</SelectItem>
                <SelectItem value="menor">Menor valor</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Filtros Avançados */}
          {showAdvancedFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t pt-4 mb-6"
            >
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor Mínimo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.minValue}
                    onChange={(e) => setFilters({ ...filters, minValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor Máximo</label>
                  <Input
                    type="number"
                    placeholder="R$ 1000,00"
                    value={filters.maxValue}
                    onChange={(e) => setFilters({ ...filters, maxValue: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Método de Pagamento</label>
                  <Select
                    value={filters.paymentMethod}
                    onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="apple_pay">Apple Pay</SelectItem>
                      <SelectItem value="google_pay">Google Pay</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </motion.div>
          )}

          {/* Ações em Lote */}
          {selectedOrders.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-900">
                    {selectedOrders.length} pedido{selectedOrders.length > 1 ? 's' : ''} selecionado{selectedOrders.length > 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('export')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Selecionados
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleBulkAction('reorder')}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reordenar Todos
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedOrders([])}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lista de Pedidos */}
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-20 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : pedidos.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
                <p className="text-muted-foreground mb-6">
                  {filters.search || filters.status !== 'todos' || filters.period !== 'todos'
                    ? 'Tente ajustar os filtros'
                    : 'Você ainda não fez nenhum pedido. Que tal começar?'}
                </p>
                <Button onClick={() => navigate('/loja')}>
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Explorar Produtos
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Accordion type="single" collapsible className="space-y-4">
              <AnimatePresence>
                {pedidos.map((order, index) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <AccordionItem value={order.id} className="border-none">
                        <Card className="hover:shadow-lg transition-all duration-300">
                          <AccordionTrigger className="px-6 hover:no-underline">
                            <div className="flex items-center justify-between w-full pr-4">
                              {/* Esquerda - Checkbox e Info do Pedido */}
                              <div className="flex items-center gap-4">
                                <input
                                  type="checkbox"
                                  checked={selectedOrders.includes(order.id)}
                                  onChange={() => toggleOrderSelection(order.id)}
                                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                />
                                <div className="p-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl">
                                  <Package className="w-6 h-6 text-primary" />
                                </div>
                                <div className="text-left">
                                  <p className="font-bold text-lg">#{order.id.substring(0, 8)}</p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(order.created_at).toLocaleDateString('pt-BR', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </div>
                                </div>
                              </div>

                              {/* Direita - Status e Valor */}
                              <div className="flex items-center gap-4">
                                <div className="text-right hidden md:block">
                                  <p className="text-2xl font-bold text-primary">
                                    R$ {Number(order.total).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                                  </p>
                                </div>
                                <Badge className={`${statusConfig.color} gap-1`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusConfig.label}
                                </Badge>
                              </div>
                            </div>
                          </AccordionTrigger>

                          <AccordionContent>
                            <div className="px-6 pb-6 space-y-6">
                              {/* Timeline de Rastreamento */}
                              <OrderTracking
                                status={order.status}
                                createdAt={order.created_at}
                                estimatedDelivery={order.estimated_delivery}
                              />

                              {/* Detalhes do Pedido */}
                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Informações de Entrega */}
                                <Card className="bg-muted/30">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <MapPin className="w-4 h-4 text-primary" />
                                      <h4 className="font-semibold text-sm">Entrega</h4>
                                    </div>
                                    <div className="text-sm text-muted-foreground space-y-1">
                                      {order.shipping_address && (
                                        <>
                                          <p>{order.shipping_address}</p>
                                          {order.shipping_city && <p>{order.shipping_city} - {order.shipping_state}</p>}
                                          {order.shipping_cep && <p>CEP: {order.shipping_cep}</p>}
                                        </>
                                      )}
                                      {!order.shipping_address && (
                                        <p className="text-muted-foreground">Informações não disponíveis</p>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>

                                {/* Informações de Pagamento */}
                                <Card className="bg-muted/30">
                                  <CardContent className="p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                      <CreditCard className="w-4 h-4 text-primary" />
                                      <h4 className="font-semibold text-sm">Pagamento</h4>
                                    </div>
                                    <div className="text-sm space-y-2">
                                      <p>
                                        {order.payment_method === 'pix' && '💳 PIX'}
                                        {order.payment_method === 'credit_card' && '💳 Cartão de Crédito'}
                                        {order.payment_method === 'apple_pay' && '🍎 Apple Pay'}
                                        {order.payment_method === 'google_pay' && '🎨 Google Pay'}
                                        {!order.payment_method && 'Não informado'}
                                      </p>
                                      {order.payment_status === 'paid' && (
                                        <Badge className="bg-green-100 text-green-800 border-green-300">
                                          ✅ Pago
                                        </Badge>
                                      )}
                                      {order.payment_status === 'pending' && (
                                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                          ⏳ Aguardando
                                        </Badge>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Produtos do Pedido */}
                              {order.items && order.items.length > 0 && (
                                <div>
                                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                                    <Package className="w-4 h-4" />
                                    Produtos ({order.items.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {order.items.map((item: any, idx: number) => (
                                      <Card key={idx} className="bg-muted/20">
                                        <CardContent className="p-4">
                                          <div className="flex items-center gap-4">
                                            <img
                                              src={getProductImage(item)}
                                              alt={item.name}
                                              className="w-16 h-16 object-cover rounded-lg border"
                                            />
                                            <div className="flex-1">
                                              <p className="font-medium">{item.name}</p>
                                              <p className="text-sm text-muted-foreground">
                                                Qtd: {item.quantity}
                                              </p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-bold">
                                                R$ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                                              </p>
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => addItem(item, 1)}
                                                className="mt-1"
                                              >
                                                <Zap className="w-3 h-3 mr-1" />
                                                Comprar novamente
                                              </Button>
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Ações Rápidas */}
                              <div className="flex flex-wrap gap-2 pt-4 border-t">
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => navigate(`/minha-conta/pedido/${order.id}`)}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Ver Detalhes Completos
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleReorder(order.id)}
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Repetir Pedido
                                </Button>

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(order.id)}
                                >
                                  <FileText className="w-4 h-4 mr-2" />
                                  Nota Fiscal
                                </Button>

                                {order.tracking_code && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`https://rastreamento.correios.com.br/app/index.php?objeto=${order.tracking_code}`, '_blank')}
                                  >
                                    <Truck className="w-4 h-4 mr-2" />
                                    Rastrear Entrega
                                  </Button>
                                )}

                                {order.status === 'delivered' && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate(`/minha-conta/avaliar/${order.id}`)}
                                  >
                                    <Star className="w-4 h-4 mr-2" />
                                    Avaliar Pedido
                                  </Button>
                                )}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const url = `${window.location.origin}/minha-conta/pedido/${order.id}`;
                                    navigator.clipboard.writeText(url);
                                    toast({
                                      title: 'Link copiado!',
                                      description: 'Link do pedido copiado para a área de transferência',
                                    });
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  Compartilhar
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </Card>
                      </AccordionItem>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PedidosTabEvolved;
