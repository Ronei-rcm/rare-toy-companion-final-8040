import React, { useState, useEffect } from 'react';
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
  DropdownMenuCheckboxItem,
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import OrderTracking from '@/components/cliente/OrderTracking';
import { getProductImage } from '@/utils/imageUtils';
import { useAdminOrders } from '@/hooks/useAdminOrders';

const PedidosAdminEvolved = () => {
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

  // Estados locais
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Seleção múltipla
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Modais
  const [detailsModal, setDetailsModal] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<any>(null);
  const [trackingModal, setTrackingModal] = useState<any>(null);
  const [associateModal, setAssociateModal] = useState<any>(null);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [bulkActionType, setBulkActionType] = useState('');
  
  // Estados para associação de cliente
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Função para buscar clientes usando o hook
  const handleSearchCustomers = async (query: string) => {
    if (!query || query.length < 2) {
      setUserResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const customers = await searchCustomers(query);
      setUserResults(customers);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter, sortBy]);

  const applyFilters = () => {
    let filtered = [...orders];

    // Busca
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.id.toString().includes(searchTerm) ||
          order.customer?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customer?.telefone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.telefone?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Filtro de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter((order) => order.payment_method === paymentFilter);
    }

    // Filtro de data
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.created_at);
        switch (dateFilter) {
          case 'today':
            return orderDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return Number(b.total) - Number(a.total);
        case 'lowest':
          return Number(a.total) - Number(b.total);
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: 'Status atualizado!',
          description: 'O status do pedido foi atualizado com sucesso',
        });
        loadOrders();
        loadStats();
        setStatusModal(null);
      }
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status',
        variant: 'destructive',
      });
    }
  };

  const handleAddTracking = async (orderId: string, trackingCode: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/tracking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tracking_code: trackingCode }),
      });

      if (response.ok) {
        toast({
          title: 'Código de rastreamento adicionado!',
          description: 'O cliente receberá uma notificação',
        });
        loadOrders();
        setTrackingModal(null);
      }
    } catch (error) {
      toast({
        title: 'Erro ao adicionar código',
        description: 'Não foi possível adicionar o código de rastreamento',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async () => {
    if (!bulkActionType || selectedOrders.length === 0) return;

    const success = await bulkAction(selectedOrders, bulkActionType);
    
    if (success) {
      setSelectedOrders([]);
      setBulkActionModal(false);
      setBulkActionType('');
    }
  };

  // Buscar usuários para associação
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setUserResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const response = await fetch(`${API_BASE_URL}/admin/users/search?q=${encodeURIComponent(query)}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const users = await response.json();
        setUserResults(users);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  // Associar pedido com cliente
  const handleAssociateUser = async (orderId: string, userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/associate-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ user_id: userId }),
      });

      if (response.ok) {
        toast({
          title: 'Cliente associado!',
          description: 'O pedido foi associado ao cliente com sucesso',
        });
        setAssociateModal(null);
        setUserSearch('');
        setUserResults([]);
        loadOrders();
      }
    } catch (error) {
      toast({
        title: 'Erro ao associar cliente',
        description: 'Não foi possível associar o pedido ao cliente',
        variant: 'destructive',
      });
    }
  };

  // Auto-associar por email
  const handleAutoAssociate = async (orderId: string, customerEmail: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/associate-user`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ customer_email: customerEmail }),
      });

      if (response.ok) {
        toast({
          title: 'Cliente associado automaticamente!',
          description: 'Pedido associado pelo email',
        });
        loadOrders();
      } else {
        toast({
          title: 'Cliente não encontrado',
          description: 'Nenhum usuário cadastrado com este email',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro na associação automática',
        description: 'Não foi possível associar automaticamente',
        variant: 'destructive',
      });
    }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    const filters = {
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchTerm || undefined,
    };
    
    await exportOrders(format, filters);
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, any> = {
      pending: { label: 'Pendente', icon: Clock, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      confirmed: { label: 'Confirmado', icon: CheckCircle, color: 'bg-blue-100 text-blue-800 border-blue-300' },
      processing: { label: 'Preparando', icon: Package, color: 'bg-purple-100 text-purple-800 border-purple-300' },
      shipped: { label: 'Enviado', icon: Truck, color: 'bg-indigo-100 text-indigo-800 border-indigo-300' },
      delivered: { label: 'Entregue', icon: CheckCircle, color: 'bg-green-100 text-green-800 border-green-300' },
      cancelled: { label: 'Cancelado', icon: XCircle, color: 'bg-red-100 text-red-800 border-red-300' },
    };

    return configs[status] || configs.pending;
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-12">
            <div className="h-64 bg-muted rounded" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Pedidos</h1>
          <p className="text-muted-foreground">Gerencie todos os pedidos da loja</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadOrders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Exportar
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 mb-1">Total de Pedidos</p>
                  <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    +{stats.todayOrders} hoje
                  </p>
                </div>
                <ShoppingCart className="w-12 h-12 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 mb-1">Receita Total</p>
                  <p className="text-2xl font-bold text-green-900">
                    R$ {stats.totalRevenue.toFixed(2)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    +R$ {stats.todayRevenue.toFixed(2)} hoje
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 mb-1">Ticket Médio</p>
                  <p className="text-2xl font-bold text-purple-900">
                    R$ {stats.averageTicket.toFixed(2)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">Por pedido</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 mb-1">Pendentes</p>
                  <p className="text-3xl font-bold text-amber-900">{stats.pending}</p>
                  <p className="text-xs text-amber-600 mt-1">Aguardando ação</p>
                </div>
                <Clock className="w-12 h-12 text-amber-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="processing">Preparando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos pagamentos</SelectItem>
                <SelectItem value="pix">PIX</SelectItem>
                <SelectItem value="credit_card">Cartão</SelectItem>
                <SelectItem value="apple_pay">Apple Pay</SelectItem>
                <SelectItem value="google_pay">Google Pay</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="oldest">Mais antigos</SelectItem>
                <SelectItem value="highest">Maior valor</SelectItem>
                <SelectItem value="lowest">Menor valor</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {selectedOrders.length > 0 && (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                {selectedOrders.length} pedido(s) selecionado(s)
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkActionModal(true);
                    setBulkAction('processing');
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Processar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkActionModal(true);
                    setBulkActionType('shipped');
                  }}
                >
                  <Truck className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setBulkActionModal(true);
                    setBulkActionType('delivered');
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Entregar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setSelectedOrders([])}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedOrders.length === filteredOrders.length && filteredOrders.length > 0}
                      onCheckedChange={toggleSelectAll}
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
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order, index) => {
                    const statusConfig = getStatusConfig(order.status);
                    const StatusIcon = statusConfig.icon;

                    return (
                      <motion.tr
                        key={order.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedOrders.includes(order.id)}
                            onCheckedChange={() => toggleOrderSelection(order.id)}
                          />
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          #{order.id}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {order.customer?.nome || order.nome || 'Cliente não identificado'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.customer?.email || order.email || 'Email não informado'}
                            </span>
                            {(order.customer?.telefone || order.telefone) && (
                              <span className="text-xs text-muted-foreground">
                                📞 {order.customer?.telefone || order.telefone}
                              </span>
                            )}
                            {order.customer?.type && (
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                {order.customer.type}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">
                              {new Date(order.created_at).toLocaleDateString('pt-BR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm capitalize">
                              {order.payment_method?.replace('_', ' ') || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">
                          R$ {Number(order.total).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.items_count || order.items?.length || 0}</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Ações</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDetailsModal(order)}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setStatusModal(order)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Atualizar Status
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setTrackingModal(order)}>
                                <Truck className="w-4 h-4 mr-2" />
                                Código Rastreamento
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  window.open(`${API_BASE_URL}/orders/${order.id}/invoice`, '_blank')
                                }
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Nota Fiscal
                              </DropdownMenuItem>
                              {!order.user_id && (
                                <DropdownMenuItem onClick={() => setAssociateModal(order)}>
                                  <Users className="w-4 h-4 mr-2" />
                                  Associar Cliente
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => {/* Enviar email */}}>
                                <Mail className="w-4 h-4 mr-2" />
                                Notificar Cliente
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido #{detailsModal?.id.substring(0, 8)}</DialogTitle>
            <DialogDescription>
              Informações completas do pedido
            </DialogDescription>
          </DialogHeader>
          {detailsModal && (
            <div className="space-y-6">
              {/* Timeline */}
              <div>
                <h3 className="font-semibold mb-4">Timeline de Status</h3>
                <OrderTracking
                  status={detailsModal.status}
                  createdAt={detailsModal.created_at}
                  estimatedDelivery={detailsModal.estimated_delivery}
                />
              </div>

              {/* Informações do Cliente */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Nome:</strong> {detailsModal.customer?.nome || detailsModal.nome || 'Não informado'}</p>
                    <p><strong>Email:</strong> {detailsModal.customer?.email || detailsModal.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> {detailsModal.customer?.telefone || detailsModal.telefone || 'Não informado'}</p>
                    {detailsModal.customer?.type && (
                      <p><strong>Tipo:</strong> 
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {detailsModal.customer.type}
                        </span>
                      </p>
                    )}
                    {(detailsModal.user_id || detailsModal.customer_id) && (
                      <p><strong>ID do Cliente:</strong> 
                        <span className="font-mono text-xs ml-2 bg-muted px-2 py-1 rounded">
                          {detailsModal.customer_id || detailsModal.user_id}
                        </span>
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Endereço de Entrega
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {detailsModal.endereco ? (
                      <>
                        <p>{detailsModal.endereco}</p>
                        {detailsModal.cidade && (
                          <p>{detailsModal.cidade} - {detailsModal.estado}</p>
                        )}
                        {detailsModal.cep && <p>CEP: {detailsModal.cep}</p>}
                      </>
                    ) : (
                      <p className="text-muted-foreground">Não informado</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Produtos */}
              <div>
                <h3 className="font-semibold mb-4">Produtos ({detailsModal.items_count || detailsModal.items?.length || 0})</h3>
                <div className="space-y-2">
                  {detailsModal.items?.map((item: any, idx: number) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={getProductImage(item)}
                            alt={item.name || item.product_name}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                          <div className="flex-1">
                            <p className="font-medium">{item.name || item.product_name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantidade: {item.quantity}
                            </p>
                            {item.product_category && (
                              <p className="text-xs text-muted-foreground">
                                Categoria: {item.product_category}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">
                              R$ {(Number(item.price) * Number(item.quantity)).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              R$ {Number(item.price).toFixed(2)} cada
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Resumo Financeiro */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {Number(detailsModal.total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">
                        R$ {Number(detailsModal.total).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Atualizar Status */}
      <Dialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Pedido</DialogTitle>
            <DialogDescription>
              Selecione o novo status para o pedido #{statusModal?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              defaultValue={statusModal?.status}
              onValueChange={(value) => {
                if (statusModal) {
                  updateOrderStatus(statusModal.id, value);
                  setStatusModal(null);
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

      {/* Modal de Código de Rastreamento */}
      <Dialog open={!!trackingModal} onOpenChange={() => setTrackingModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Código de Rastreamento</DialogTitle>
            <DialogDescription>
              Pedido #{trackingModal?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tracking">Código de Rastreamento</Label>
              <Input
                id="tracking"
                placeholder="BR123456789BR"
                onBlur={(e) => {
                  if (trackingModal && e.target.value) {
                    handleAddTracking(trackingModal.id, e.target.value);
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              O cliente receberá um email com o código de rastreamento
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Associação de Cliente */}
      <Dialog open={!!associateModal} onOpenChange={() => {
        setAssociateModal(null);
        setUserSearch('');
        setUserResults([]);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associar Pedido ao Cliente</DialogTitle>
            <DialogDescription>
              Pedido #{associateModal?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Auto-associação por email */}
            {(associateModal?.customer?.email || associateModal?.email) && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-2">
                  <strong>Associação Automática:</strong>
                </p>
                <p className="text-sm text-blue-600 mb-3">
                  Email do pedido: {associateModal.customer?.email || associateModal.email}
                </p>
                <Button
                  size="sm"
                  onClick={() => {
                    // Buscar cliente por email e associar
                    const email = associateModal.customer?.email || associateModal.email;
                    handleSearchCustomers(email);
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Buscar por Email
                </Button>
              </div>
            )}

            <div className="border-t pt-4">
              <Label htmlFor="user-search">Buscar Cliente Manualmente</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="user-search"
                  placeholder="Digite nome ou email do cliente..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value);
                    handleSearchCustomers(e.target.value);
                  }}
                  className="pl-10"
                />
              </div>
              
              {searchingUsers && (
                <p className="text-sm text-muted-foreground mt-2">Buscando...</p>
              )}
              
              {userResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-lg">
                  {userResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                      onClick={() => associateCustomer(associateModal.id, user.id)}
                    >
                      <p className="font-medium">{user.nome}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      {user.telefone && (
                        <p className="text-sm text-muted-foreground">📞 {user.telefone}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
              
              {userSearch.length >= 2 && userResults.length === 0 && !searchingUsers && (
                <p className="text-sm text-muted-foreground mt-2">
                  Nenhum cliente encontrado com "{userSearch}"
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Ação em Massa */}
      <AlertDialog open={bulkActionModal} onOpenChange={setBulkActionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a atualizar {selectedOrders.length} pedido(s).
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkActionType('')}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkAction}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PedidosAdminEvolved;
