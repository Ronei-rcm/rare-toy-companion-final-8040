import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
  Trash2,
  FileText,
  Printer,
  Grid3x3,
  List,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Activity,
  ArrowUpDown,
  Edit3
} from 'lucide-react';
import OrderTimeline from './OrderTimeline';

// Função auxiliar para informações de status
const getStatusInfo = (status: string) => {
  const statusMap: Record<string, { color: string; icon: any; label: string; description: string; bgColor: string }> = {
    pending: { 
      color: 'bg-yellow-500', 
      bgColor: 'bg-yellow-50 border-yellow-200',
      icon: Clock, 
      label: 'Pendente',
      description: 'Seu pedido está sendo processado'
    },
    processing: { 
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50 border-blue-200',
      icon: Package, 
      label: 'Processando',
      description: 'Preparando seu pedido para envio'
    },
    shipped: { 
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50 border-purple-200',
      icon: Truck, 
      label: 'Enviado',
      description: 'Seu pedido está a caminho'
    },
    delivered: { 
      color: 'bg-green-500',
      bgColor: 'bg-green-50 border-green-200',
      icon: CheckCircle, 
      label: 'Entregue',
      description: 'Pedido entregue com sucesso!'
    },
    cancelled: { 
      color: 'bg-red-500',
      bgColor: 'bg-red-50 border-red-200',
      icon: AlertCircle, 
      label: 'Cancelado',
      description: 'Pedido foi cancelado'
    }
  };
  
  return statusMap[status] || statusMap.pending;
};

// Normalização segura de um pedido
const normalizeOrder = (order: any = {}): Order => {
  return {
    id: String(order.id || ''),
    status: order.status || 'pending',
    total: Number(order.total || 0),
    items: Array.isArray(order.items) ? order.items : [],
    created_at: order.created_at || new Date().toISOString(),
    updated_at: order.updated_at || order.created_at || new Date().toISOString(),
    tracking_code: order.tracking_code || null,
    estimated_delivery: order.estimated_delivery || null,
    shipping_address: order.shipping_address || '',
    payment_method: order.payment_method || 'N/A',
    status_timeline: Array.isArray(order.status_timeline) ? order.status_timeline : [],
  };
};

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

// Filtros padrão (fora do componente para evitar problemas de inicialização)
const DEFAULT_FILTERS = {
  search: '',
  status: 'all',
  period: 'all',
  sort: 'created_at',
  order: 'DESC',
  minValue: '',
  maxValue: '',
  paymentMethod: 'all'
};

const OrdersUnifiedEvolved: React.FC = () => {
  const { toast } = useToast();
  const { user } = useCurrentUser() as any;
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  
  // Estados principais
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Visualização
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filtros e busca
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const itemsPerPage = 12;
  
  // Modais e seleções
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editForm, setEditForm] = useState<{ status: string; payment_method: string; tracking_code: string }>({
    status: 'pending',
    payment_method: '',
    tracking_code: ''
  });
  
  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // ==================== CARREGAMENTO DE DADOS ====================
  
  const loadOrders = useCallback(async () => {
    try {
      console.log('📦 Carregando pedidos...', { userId: user?.id, email: user?.email, page: currentPage });
      setLoading(true);
      
      const params = new URLSearchParams({
        customer_id: user?.id || user?.email || '',
        page: String(currentPage),
        limit: String(itemsPerPage),
        ...filters
      });
      
      const url = `${API_BASE_URL}/orders/unified?${params}`;
      console.log('📤 Requisição GET para:', url);
      
      const response = await fetch(url, {
        credentials: 'include'
      });
      
      console.log('📥 Resposta recebida:', response.status, response.statusText);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Pedidos carregados:', data.orders?.length || 0, 'pedidos');
        const normalizedOrders = (data.orders || []).map((order: any) => normalizeOrder(order));
        setOrders(normalizedOrders);
        setTotalOrders(data.total || normalizedOrders.length);
        setTotalPages(Math.ceil((data.total || normalizedOrders.length) / itemsPerPage));
        setLastUpdate(new Date());
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Erro ao carregar pedidos:', response.status, errorData);
        setOrders([]);
        if (response.status !== 500) {
          toast({
            title: 'Aviso',
            description: `Não foi possível carregar os pedidos (${response.status})`,
            variant: 'destructive'
          });
        }
      }
    } catch (error) {
      console.error('❌ Erro ao carregar pedidos:', error);
      setOrders([]);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os pedidos. Verifique sua conexão.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [filters, user?.id, user?.email, currentPage, itemsPerPage, API_BASE_URL, toast]);
  
  const loadStats = useCallback(async () => {
    try {
      const customerId = user?.id || user?.email || '';
      let response;
      try {
        response = await fetch(`${API_BASE_URL}/orders/stats/unified?customer_id=${customerId}&period=${filters.period}`, {
          credentials: 'include'
        });
      } catch {
        // Fallback para endpoint alternativo se unified não existir
        response = await fetch(`${API_BASE_URL}/orders/stats?customer_id=${customerId}&period=${filters.period}`, {
          credentials: 'include'
        });
      }
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        setStats({
          period: filters.period,
          total: 0,
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
          totalRevenue: 0,
          averageTicket: 0,
          todayOrders: 0,
          todayRevenue: 0,
          avgDeliveryTimeHours: 0
        });
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats({
        period: filters.period,
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        averageTicket: 0,
        todayOrders: 0,
        todayRevenue: 0,
        avgDeliveryTimeHours: 0
      });
    }
  }, [filters.period, user?.id, user?.email, API_BASE_URL]);
  
  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([loadOrders(), loadStats()]);
    setRefreshing(false);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setCurrentPage(1);
  };

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadOrders();
      loadStats();
    }, 30000); // 30 segundos
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadOrders, loadStats]);

  // ==================== EFFECTS ====================
  
  useEffect(() => {
    if (user?.id || user?.email) {
      loadOrders();
      loadStats();
    }
  }, [user?.id, user?.email]);
  
  useEffect(() => {
    if (user?.id || user?.email) {
      setCurrentPage(1); // Resetar página ao mudar filtros
      loadOrders();
    }
  }, [filters.search, filters.status, filters.period, filters.sort, filters.order, filters.minValue, filters.maxValue, filters.paymentMethod]);

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
      console.log('🗑️ Excluindo pedido:', orderId);
      setActionLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json().catch(() => ({}));
      
      if (response.ok) {
        console.log('✅ Pedido excluído com sucesso');
        toast({
          title: 'Pedido Excluído',
          description: 'O pedido foi removido do seu histórico permanentemente.',
          duration: 5000
        });
        setShowDeleteModal(false);
        setSelectedOrder(null);
        await loadOrders();
      } else {
        const errorMsg = responseData.message || responseData.error || `Erro ${response.status}: ${response.statusText}`;
        console.error('❌ Erro ao excluir pedido:', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('❌ Erro ao excluir pedido:', error);
      toast({
        title: 'Erro ao Excluir',
        description: error?.message || 'Não foi possível excluir o pedido. Tente novamente.',
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setActionLoading(false);
    }
  };

  const updateOrderDetails = async () => {
    if (!selectedOrder) {
      console.warn('⚠️ Nenhum pedido selecionado para editar');
      toast({
        title: 'Erro',
        description: 'Nenhum pedido selecionado para editar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('💾 Atualizando pedido:', selectedOrder.id, editForm);
      setActionLoading(true);
      
      // Validação básica
      if (!editForm.status) {
        toast({
          title: 'Validação',
          description: 'O status do pedido é obrigatório.',
          variant: 'destructive'
        });
        setActionLoading(false);
        return;
      }

      const body = {
        status: editForm.status,
        payment_method: editForm.payment_method || selectedOrder.payment_method || '',
        tracking_code: editForm.tracking_code || selectedOrder.tracking_code || ''
      };

      console.log('📤 Enviando requisição PUT para:', `${API_BASE_URL}/orders/${selectedOrder.id}`, body);

      const response = await fetch(`${API_BASE_URL}/orders/${selectedOrder.id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      console.log('📥 Resposta recebida:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro desconhecido' }));
        console.error('❌ Erro na resposta:', errorData);
        throw new Error(errorData.message || errorData.error || `Erro ${response.status}: ${response.statusText}`);
      }

      const data = await response.json().catch(() => null);
      console.log('✅ Pedido atualizado com sucesso:', data);

      toast({
        title: 'Pedido atualizado',
        description: 'Status e dados do pedido foram salvos com sucesso.',
      });

      // Atualiza estado local para refletir edição sem esperar refetch
      const updated = normalizeOrder({
        ...selectedOrder,
        ...(data || {}),
        status: body.status,
        payment_method: body.payment_method,
        tracking_code: body.tracking_code
      });
      setSelectedOrder(updated);
      setShowEditModal(false);
      
      // Recarrega a lista de pedidos
      await loadOrders();
    } catch (error: any) {
      console.error('❌ Erro ao editar pedido:', error);
      const errorMessage = error?.message || 'Não foi possível salvar as alterações do pedido.';
      toast({
        title: 'Erro ao editar',
        description: errorMessage,
        variant: 'destructive',
        duration: 5000
      });
    } finally {
      setActionLoading(false);
    }
  };

  const openDetails = (order: Order) => {
    try {
      console.log('🔍 Abrindo detalhes do pedido:', order);
      const normalized = normalizeOrder(order);
      setSelectedOrder(normalized);
      setEditForm({
        status: normalized.status,
        payment_method: normalized.payment_method || '',
        tracking_code: normalized.tracking_code || ''
      });
      setShowDetailsModal(true);
      console.log('✅ Modal de detalhes aberto');
    } catch (error) {
      console.error('❌ Erro ao abrir detalhes:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir os detalhes do pedido.',
        variant: 'destructive'
      });
    }
  };

  const openEdit = (order: Order) => {
    try {
      console.log('✏️ Abrindo edição do pedido:', order);
      const normalized = normalizeOrder(order);
      setSelectedOrder(normalized);
      setEditForm({
        status: normalized.status,
        payment_method: normalized.payment_method || '',
        tracking_code: normalized.tracking_code || ''
      });
      setShowEditModal(true);
      console.log('✅ Modal de edição aberto');
    } catch (error) {
      console.error('❌ Erro ao abrir edição:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível abrir a edição do pedido.',
        variant: 'destructive'
      });
    }
  };
  
  const canCancelOrder = (status: string) => {
    return ['pending', 'processing'].includes(status);
  };
  
  const canDeleteOrder = (status: string, createdAt: string) => {
    const orderDate = new Date(createdAt);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return status === 'cancelled' || (status === 'delivered' && daysSinceOrder > 30);
  };

  const canEditOrder = (status: string) => {
    return status !== 'cancelled';
  };

  // Exportação
  const exportOrders = (format: 'csv' | 'json') => {
    const safeOrders = Array.isArray(orders) ? orders : [];
    if (format === 'csv') {
      const csv = [
        ['ID', 'Data', 'Status', 'Total', 'Itens', 'Método Pagamento'].join(','),
        ...safeOrders.map(order => [
          (order.id || '').substring(0, 8),
          new Date(order.created_at || new Date()).toLocaleDateString('pt-BR'),
          getStatusInfo(order.status || 'pending').label,
          Number(order.total || 0).toFixed(2),
          Array.isArray(order.items) ? order.items.length : 0,
          order.payment_method || 'N/A'
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pedidos_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast({
        title: 'Exportado!',
        description: 'Lista de pedidos exportada em CSV'
      });
    } else {
      const json = JSON.stringify(safeOrders, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `pedidos_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      
      toast({
        title: 'Exportado!',
        description: 'Lista de pedidos exportada em JSON'
      });
    }
  };

  // Filtrar pedidos localmente (para busca instantânea)
  const filteredOrders = useMemo(() => {
    if (!orders || !Array.isArray(orders) || orders.length === 0) {
      return [];
    }
    
    const ordersList = orders.map((order) => normalizeOrder(order));
    const currentFilters = filters || DEFAULT_FILTERS;
    let filtered = [...ordersList];
    
    const searchTerm = (currentFilters.search || '').trim();
    const minValue = currentFilters.minValue || '';
    const maxValue = currentFilters.maxValue || '';
    const paymentMethod = currentFilters.paymentMethod || 'all';
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((order) => {
        const orderId = String(order?.id || '');
        const trackingCode = String(order?.tracking_code || '');
        const orderItems = Array.isArray(order?.items) ? order.items : [];
        
        return (
          orderId.toLowerCase().includes(searchLower) ||
          trackingCode.toLowerCase().includes(searchLower) ||
          orderItems.some((item) => {
            const itemName = String(item?.name || item?.product_name || '');
            return itemName.toLowerCase().includes(searchLower);
          })
        );
      });
    }
    
    if (minValue) {
      const min = Number(minValue) || 0;
      filtered = filtered.filter((order) => {
        const orderTotal = Number(order?.total || 0);
        return orderTotal >= min;
      });
    }
    
    if (maxValue) {
      const max = Number(maxValue) || Infinity;
      filtered = filtered.filter((order) => {
        const orderTotal = Number(order?.total || 0);
        return orderTotal <= max;
      });
    }
    
    if (paymentMethod && paymentMethod !== 'all') {
      filtered = filtered.filter((order) => {
        const orderPaymentMethod = String(order?.payment_method || '');
        return orderPaymentMethod === paymentMethod;
      });
    }
    
    return filtered;
  }, [orders, filters]);

  // Garantir que filteredOrders sempre seja um array válido
  const safeFilteredOrders = Array.isArray(filteredOrders) ? filteredOrders : [];

  return (
    <div className="space-y-6">
      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Total de Pedidos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <Package className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Total Gasto</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {Number(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-900">
                    R$ {Number(stats.averageTicket || 0).toFixed(2)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-600 font-medium">Pendentes</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.pending || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Barra de Ações e Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Busca e Filtros Básicos */}
            <div className="flex flex-1 gap-4 items-center min-w-[300px]">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Buscar pedidos por ID, código de rastreamento..."
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
              
              <Select value={filters.sort} onValueChange={(value) => setFilters(prev => ({ ...prev, sort: value }))}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Ordenar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data</SelectItem>
                  <SelectItem value="total">Valor</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
                {showFilters ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
              >
                {viewMode === 'list' ? <Grid3x3 className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
              
              <Button onClick={refreshData} disabled={refreshing} variant="outline" size="sm">
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportOrders('csv')}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowStatsModal(true)}
              >
                <BarChart className="h-4 w-4 mr-2" />
                Estatísticas
              </Button>
            </div>
          </div>
          
          {/* Filtros Avançados Colapsáveis */}
          <Collapsible open={showFilters} onOpenChange={setShowFilters}>
            <CollapsibleContent className="mt-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Período</label>
                  <Select value={filters.period} onValueChange={(value) => setFilters(prev => ({ ...prev, period: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="7d">Últimos 7 dias</SelectItem>
                      <SelectItem value="30d">Últimos 30 dias</SelectItem>
                      <SelectItem value="90d">Últimos 90 dias</SelectItem>
                      <SelectItem value="year">Este ano</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor Mínimo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.minValue}
                    onChange={(e) => setFilters(prev => ({ ...prev, minValue: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Valor Máximo</label>
                  <Input
                    type="number"
                    placeholder="R$ 0,00"
                    value={filters.maxValue}
                    onChange={(e) => setFilters(prev => ({ ...prev, maxValue: e.target.value }))}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Método de Pagamento</label>
                  <Select value={filters.paymentMethod} onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mt-4 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFilters({
                      search: '',
                      status: 'all',
                      period: 'all',
                      sort: 'created_at',
                      order: 'DESC',
                      minValue: '',
                      maxValue: '',
                      paymentMethod: 'all'
                    });
                  }}
                >
                  Limpar Filtros
                </Button>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="autoRefresh"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="autoRefresh" className="text-sm text-muted-foreground cursor-pointer">
                    Atualização automática (30s)
                  </label>
                </div>
                
                {lastUpdate && (
                  <p className="text-xs text-muted-foreground ml-auto">
                    Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Meus Pedidos ({safeFilteredOrders.length})</span>
            <Badge variant="outline" className="flex items-center gap-2">
              {autoRefresh ? (
                <>
                  <Activity className="h-3 w-3 animate-pulse text-green-500" />
                  Atualização automática ativa
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3" />
                  Modo manual
                </>
              )}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : safeFilteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500">Você ainda não fez nenhum pedido ou não há pedidos que correspondam aos filtros.</p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Button variant="outline" onClick={clearFilters}>
                  Limpar filtros
                </Button>
                <Button asChild>
                  <Link to="/loja">
                    Ver produtos
                  </Link>
                </Button>
                <Button variant="ghost" onClick={refreshData} disabled={refreshing}>
                  Recarregar
                </Button>
              </div>
            </div>
          ) : viewMode === 'list' ? (
            <div className="space-y-4">
              {safeFilteredOrders.length > 0 ? safeFilteredOrders.map((order) => {
                if (!order) return null;
                
                const orderStatus = order.status || 'pending';
                const statusInfo = getStatusInfo(orderStatus);
                const StatusIcon = statusInfo.icon;
                const orderId = String(order.id || '');
                const orderTotal = Number(order.total || 0);
                const orderItems = Array.isArray(order.items) ? order.items : [];
                const itemsCount = orderItems.length;
                const orderCreatedAt = order.created_at || new Date().toISOString();
                const orderTrackingCode = order.tracking_code || null;
                const canCancel = canCancelOrder(orderStatus);
                const canDelete = canDeleteOrder(orderStatus, orderCreatedAt);
                const isDelivered = orderStatus === 'delivered';
                
                return (
                  <motion.div
                    key={orderId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${statusInfo.bgColor}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        
                        <div>
                          <p className="font-medium">#{String(orderId || '').substring(0, 8)}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(orderCreatedAt || new Date()).toLocaleDateString('pt-BR')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {statusInfo.description}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="font-medium">R$ {orderTotal.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            {itemsCount} item{itemsCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('👁️ Clicou em Ver Detalhes:', order);
                              openDetails(order);
                            }}
                            title="Ver Detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {canEditOrder(orderStatus) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('✏️ Clicou em Editar:', order);
                                openEdit(order);
                              }}
                              title="Editar pedido"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {canCancel && (
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
                          
                          {canDelete && (
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
                          
                          {isDelivered && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => reorderItems(orderId)}
                              title="Comprar Novamente"
                            >
                              <Repeat className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {orderTrackingCode && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => trackOrder(orderTrackingCode)}
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
              }).filter(Boolean) : null}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {safeFilteredOrders.length > 0 ? safeFilteredOrders.map((order) => {
                if (!order) return null;
                
                const orderStatus = order.status || 'pending';
                const statusInfo = getStatusInfo(orderStatus);
                const StatusIcon = statusInfo.icon;
                const orderId = String(order.id || '');
                const orderTotal = Number(order.total || 0);
                const orderItems = Array.isArray(order.items) ? order.items : [];
                const itemsCount = orderItems.length;
                const orderCreatedAt = order.created_at || new Date().toISOString();
                const orderTrackingCode = order.tracking_code || null;
                const canCancel = canCancelOrder(orderStatus);
                const isDelivered = orderStatus === 'delivered';
                
                return (
                  <motion.div
                    key={orderId}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`border rounded-lg p-4 hover:shadow-lg transition-shadow ${statusInfo.bgColor}`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={statusInfo.color}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {statusInfo.label}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          #{String(orderId || '').substring(0, 8)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-2xl font-bold">R$ {orderTotal.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">
                          {itemsCount} item{itemsCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(orderCreatedAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('👁️ Clicou em Ver Detalhes (grid):', order);
                            openDetails(order);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver
                        </Button>

                        {canEditOrder(orderStatus) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('✏️ Clicou em Editar (grid):', order);
                              openEdit(order);
                            }}
                            title="Editar"
                          >
                            <Edit3 className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCancelModal(true);
                            }}
                            title="Cancelar"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {orderTrackingCode && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => trackOrder(orderTrackingCode)}
                            title="Rastrear"
                          >
                            <Truck className="h-3 w-3" />
                          </Button>
                        )}
                        
                        {isDelivered && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => reorderItems(orderId)}
                            title="Comprar Novamente"
                          >
                            <Repeat className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              }).filter(Boolean) : null}
            </div>
          )}
          
          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages} • {totalOrders} pedidos
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <Dialog open={showDetailsModal} onOpenChange={(open) => {
          setShowDetailsModal(open);
          if (!open) {
            setSelectedOrder(null);
          }
        }}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido #{selectedOrder.id.substring(0, 8)}</DialogTitle>
              <DialogDescription>
                Informações completas sobre seu pedido, incluindo status, itens e histórico.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Status Atual */}
              {(() => {
                const statusInfo = getStatusInfo(selectedOrder.status);
                const StatusIcon = statusInfo.icon;
                const statusColorClass = statusInfo.color.replace('bg-', 'text-');
                
                return (
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-center gap-3">
                      <StatusIcon className={`h-8 w-8 ${statusColorClass}`} />
                      <div>
                        <h3 className="text-lg font-medium">{statusInfo.label}</h3>
                        <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
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
                    <div key={item.id || `${item.name || item.product_name || 'item'}-${Math.random()}`} className="flex items-center gap-4 p-2 border rounded">
                      <img 
                        src={item.image_url || item.product_image || '/placeholder.svg'} 
                        alt={item.name || item.product_name || 'Produto'}
                        className="w-12 h-12 object-cover rounded"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src && !target.src.includes('/placeholder')) {
                            target.src = '/placeholder.svg';
                          }
                        }}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{item.name || item.product_name || 'Produto'}</p>
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
              
              {/* Timeline de Status Visual */}
              <div>
                <h3 className="font-medium mb-4">Acompanhamento do Pedido</h3>
                <OrderTimeline
                  currentStatus={selectedOrder.status}
                  timeline={selectedOrder.status_timeline}
                  createdAt={selectedOrder.created_at}
                />
              </div>
              
              {/* Ações do Pedido */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {selectedOrder.tracking_code && (
                  <Button
                    variant="outline"
                    onClick={() => trackOrder(selectedOrder.tracking_code!)}
                    className="flex-1"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Rastrear Entrega
                  </Button>
                )}
                
                {selectedOrder.status === 'delivered' && (
                  <Button
                    variant="outline"
                    onClick={() => reorderItems(selectedOrder.id)}
                    className="flex-1"
                  >
                    <Repeat className="h-4 w-4 mr-2" />
                    Comprar Novamente
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex-1"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const orderText = `
Pedido #${String(selectedOrder.id || '').substring(0, 8)}
Data: ${new Date(selectedOrder.created_at || new Date()).toLocaleDateString('pt-BR')}
Status: ${getStatusInfo(selectedOrder.status || 'pending').label}
Total: R$ ${Number(selectedOrder.total || 0).toFixed(2)}

Itens:
${(selectedOrder.items || []).map((item: any) => 
  `- ${item.name || item.product_name || 'Produto'} (${item.quantity || 1}x) - R$ ${Number(item.price || 0).toFixed(2)}`
).join('\n')}
                    `.trim();
                    navigator.clipboard.writeText(orderText);
                    toast({
                      title: 'Copiado!',
                      description: 'Detalhes do pedido copiados para a área de transferência'
                    });
                  }}
                  className="flex-1"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Copiar Detalhes
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowEditModal(true)}
                  disabled={actionLoading}
                >
                  Editar
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => setShowDeleteModal(true)}
                  disabled={actionLoading}
                >
                  Excluir
                </Button>
              </div>
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
                  <strong>Pedido:</strong> #{String(selectedOrder.id || '').substring(0, 8)}
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
      
  {/* Modal de Edição */}
  {selectedOrder && (
    <Dialog open={showEditModal} onOpenChange={(open) => {
      setShowEditModal(open);
      if (!open) {
        setSelectedOrder(null);
      }
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Editar Pedido #{String(selectedOrder.id || '').substring(0, 8)}
          </DialogTitle>
          <DialogDescription>Atualize status, pagamento ou rastreamento.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={editForm.status}
              onValueChange={(value) => setEditForm((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue />
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

          <div className="space-y-2">
            <Label>Método de pagamento</Label>
            <Input
              placeholder="PIX, Cartão, Boleto..."
              value={editForm.payment_method}
              onChange={(e) => setEditForm((prev) => ({ ...prev, payment_method: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label>Código de rastreamento</Label>
            <Input
              placeholder="Ex.: AB123456789BR"
              value={editForm.tracking_code}
              onChange={(e) => setEditForm((prev) => ({ ...prev, tracking_code: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={actionLoading}>
            Cancelar
          </Button>
          <Button onClick={updateOrderDetails} disabled={actionLoading}>
            {actionLoading ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )}

      {/* Modal de Exclusão */}
      {selectedOrder && (
        <Dialog open={showDeleteModal} onOpenChange={(open) => {
          setShowDeleteModal(open);
          if (!open) {
            setSelectedOrder(null);
          }
        }}>
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
                  <strong>Status:</strong> {getStatusInfo(selectedOrder.status || 'pending').label}
                </p>
                <p className="text-sm text-red-800">
                  <strong>Data:</strong> {new Date(selectedOrder.created_at || new Date()).toLocaleDateString('pt-BR')}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🗑️ Clicou em Excluir pedido:', selectedOrder.id);
                    deleteOrder(selectedOrder.id);
                  }}
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
      
      {/* Modal de Estatísticas */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Estatísticas dos Pedidos</DialogTitle>
            <DialogDescription>
              Análise detalhada do seu histórico de compras
            </DialogDescription>
          </DialogHeader>
          
          {stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
                  <p className="text-sm text-muted-foreground">Total de Pedidos</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    R$ {Number(stats.totalRevenue || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Gasto</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    R$ {Number(stats.averageTicket || 0).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">Ticket Médio</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.avgDeliveryTimeHours ? `${Math.round(stats.avgDeliveryTimeHours)}h` : 'N/A'}
                  </p>
                  <p className="text-sm text-muted-foreground">Tempo Médio Entrega</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Por Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pendentes:</span>
                      <span className="font-medium">{stats.pending || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processando:</span>
                      <span className="font-medium">{stats.processing || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Enviados:</span>
                      <span className="font-medium">{stats.shipped || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Entregues:</span>
                      <span className="font-medium">{stats.delivered || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cancelados:</span>
                      <span className="font-medium">{stats.cancelled || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-2">Hoje</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Pedidos:</span>
                      <span className="font-medium">{stats.todayOrders || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Receita:</span>
                      <span className="font-medium">
                        R$ {Number(stats.todayRevenue || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersUnifiedEvolved;

