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
  User,
  UserPlus,
  History,
  Heart,
  Star,
  Tag,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminOrdersApi } from '@/services/admin-orders-api';
import { adminCustomersApi } from '@/services/admin-customers-api';

const PedidosEvolved = () => {
  const { toast } = useToast();

  // Estados
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
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
    totalCustomers: 0,
    newCustomers: 0,
  });

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  // Seleção múltipla
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Modais
  const [detailsModal, setDetailsModal] = useState<any>(null);
  const [statusModal, setStatusModal] = useState<any>(null);
  const [customerModal, setCustomerModal] = useState<any>(null);
  const [associateModal, setAssociateModal] = useState<any>(null);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  // Estados para busca de clientes
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  // Carregar dados
  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [orders, searchTerm, statusFilter, paymentFilter, dateFilter, customerFilter, sortBy]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await adminOrdersApi.getOrdersEvolved();

      setOrders(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Erro ao carregar pedidos:', error);
      toast({
        title: 'Erro ao carregar pedidos',
        description: error.message || 'Não foi possível carregar os pedidos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await adminOrdersApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...orders];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.id?.toLowerCase().includes(term) ||
        order.nome?.toLowerCase().includes(term) ||
        order.email?.toLowerCase().includes(term) ||
        order.customer?.nome?.toLowerCase().includes(term) ||
        order.customer?.email?.toLowerCase().includes(term)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtro de pagamento
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(order => order.metodo_pagamento === paymentFilter);
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

    // Filtro de cliente
    if (customerFilter !== 'all') {
      if (customerFilter === 'with_customer') {
        filtered = filtered.filter(order => order.customer_id);
      } else if (customerFilter === 'without_customer') {
        filtered = filtered.filter(order => !order.customer_id);
      }
    }

    // Ordenação
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'total_high':
          return b.total - a.total;
        case 'total_low':
          return a.total - b.total;
        case 'name':
          return (a.nome || a.customer?.nome || '').localeCompare(b.nome || b.customer?.nome || '');
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await adminOrdersApi.updateStatus(orderId, newStatus);

      toast({
        title: 'Status atualizado!',
        description: `Pedido ${orderId} atualizado para ${newStatus}`,
      });
      loadOrders();
      loadStats();
      setStatusModal(null);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível atualizar o status do pedido',
        variant: 'destructive',
      });
    }
  };

  const handleAssociateCustomer = async (orderId: string, customerId: string) => {
    try {
      await adminOrdersApi.associateCustomer(orderId, customerId);

      toast({
        title: 'Cliente associado!',
        description: 'Pedido associado ao cliente com sucesso',
      });
      loadOrders();
      setAssociateModal(null);
    } catch (error) {
      console.error('Erro ao associar cliente:', error);
      toast({
        title: 'Erro ao associar cliente',
        description: 'Não foi possível associar o cliente ao pedido',
        variant: 'destructive',
      });
    }
  };

  const searchCustomers = async (term: string) => {
    if (term.length < 2) {
      setUserResults([]);
      return;
    }

    try {
      setSearchingUsers(true);
      const data = await adminCustomersApi.searchCustomers(term);
      setUserResults(data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'criado': { label: 'Criado', variant: 'secondary', icon: Clock },
      'pendente': { label: 'Pendente', variant: 'default', icon: Clock },
      'processando': { label: 'Processando', variant: 'default', icon: Package },
      'enviado': { label: 'Enviado', variant: 'default', icon: Truck },
      'entregue': { label: 'Entregue', variant: 'default', icon: CheckCircle },
      'cancelado': { label: 'Cancelado', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig['criado'];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant as any} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const exportOrders = () => {
    const csv = [
      ['ID', 'Cliente', 'Email', 'Total', 'Status', 'Data', 'Método Pagamento'].join(','),
      ...filteredOrders.map((order) =>
        [
          order.id,
          order.customer?.nome || order.nome || 'N/A',
          order.customer?.email || order.email || 'N/A',
          `R$ ${Number(order.total || 0).toFixed(2)}`,
          order.status,
          new Date(order.created_at).toLocaleString('pt-BR'),
          order.metodo_pagamento || 'N/A',
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pedidos-evolved-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    try {
      await adminOrdersApi.bulkAction({
        orderIds: selectedOrders,
        action: bulkAction,
      });

      toast({
        title: 'Ação em massa realizada!',
        description: `${selectedOrders.length} pedidos atualizados`,
      });
      loadOrders();
      loadStats();
      setSelectedOrders([]);
      setBulkActionModal(false);
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      toast({
        title: 'Erro na ação em massa',
        description: 'Não foi possível executar a ação',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pedidos Evolved</h1>
          <p className="text-muted-foreground">
            Gestão avançada de pedidos com sincronização de clientes
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportOrders} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button onClick={loadOrders} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Total</p>
                <p className="text-2xl font-bold">{Number(stats.total || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Clientes</p>
                <p className="text-2xl font-bold">{Number(stats.totalCustomers || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Receita</p>
                <p className="text-2xl font-bold">R$ {Number(stats.totalRevenue || 0).toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold">{Number(stats.pending || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Enviados</p>
                <p className="text-2xl font-bold">{Number(stats.shipped || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Entregues</p>
                <p className="text-2xl font-bold">{Number(stats.delivered || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por ID, nome, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="criado">Criado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="entregue">Entregue</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="with_customer">Com Cliente</SelectItem>
                <SelectItem value="without_customer">Sem Cliente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">7 dias</SelectItem>
                <SelectItem value="month">30 dias</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="oldest">Mais Antigos</SelectItem>
                <SelectItem value="total_high">Maior Valor</SelectItem>
                <SelectItem value="total_low">Menor Valor</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Pedidos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pedidos ({filteredOrders.length})</CardTitle>
            {selectedOrders.length > 0 && (
              <Button
                onClick={() => setBulkActionModal(true)}
                variant="outline"
                size="sm"
              >
                Ações em Massa ({selectedOrders.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
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
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="w-12">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {filteredOrders.map((order) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="hover:bg-muted/50"
                    >
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
                        {order.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {order.customer ? (
                            <>
                              <User className="w-4 h-4 text-blue-500" />
                              <div>
                                <p className="font-medium">{order.customer.nome}</p>
                                <p className="text-sm text-muted-foreground">{order.customer.email}</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-4 h-4 text-gray-400" />
                              <div>
                                <p className="font-medium">{order.nome || 'Cliente Anônimo'}</p>
                                <p className="text-sm text-muted-foreground">{order.email || 'Sem email'}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        R$ {Number(order.total || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {order.metodo_pagamento || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => setDetailsModal(order)}>
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setStatusModal(order)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Alterar Status
                            </DropdownMenuItem>
                            {!order.customer && (
                              <DropdownMenuItem onClick={() => setAssociateModal(order)}>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Associar Cliente
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setCustomerModal(order)}>
                              <User className="w-4 h-4 mr-2" />
                              Ver Cliente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Detalhes */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pedido</DialogTitle>
            <DialogDescription>
              ID: {detailsModal?.id}
            </DialogDescription>
          </DialogHeader>

          {detailsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{detailsModal.customer?.nome || detailsModal.nome || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{detailsModal.customer?.email || detailsModal.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{detailsModal.customer?.telefone || detailsModal.telefone || 'N/A'}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Pedido</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(detailsModal.created_at).toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>R$ {Number(detailsModal.total || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span>{detailsModal.metodo_pagamento || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(detailsModal.status)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {detailsModal.endereco && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Endereço de Entrega</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1" />
                      <pre className="text-sm whitespace-pre-wrap">{detailsModal.endereco}</pre>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Status */}
      <Dialog open={!!statusModal} onOpenChange={() => setStatusModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Status</DialogTitle>
            <DialogDescription>
              Pedido: {statusModal?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {['criado', 'pendente', 'processando', 'enviado', 'entregue', 'cancelado'].map((status) => (
              <Button
                key={status}
                variant={statusModal?.status === status ? 'default' : 'outline'}
                onClick={() => handleUpdateStatus(statusModal.id, status)}
                className="justify-start"
              >
                {getStatusBadge(status)}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Associar Cliente */}
      <Dialog open={!!associateModal} onOpenChange={() => setAssociateModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associar Cliente</DialogTitle>
            <DialogDescription>
              Pedido: {associateModal?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Buscar Cliente</Label>
              <Input
                placeholder="Digite nome ou email..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  searchCustomers(e.target.value);
                }}
              />
            </div>

            <div className="max-h-60 overflow-y-auto space-y-2">
              {searchingUsers && (
                <div className="flex items-center justify-center p-4">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                </div>
              )}

              {userResults.map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                  onClick={() => handleAssociateCustomer(associateModal.id, customer.id)}
                >
                  <div>
                    <p className="font-medium">{customer.nome}</p>
                    <p className="text-sm text-muted-foreground">{customer.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {customer.total_pedidos} pedidos • R$ {Number(customer.total_gasto || 0).toFixed(2)}
                    </p>
                  </div>
                  <Button size="sm">Associar</Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Ações em Massa */}
      <AlertDialog open={bulkActionModal} onOpenChange={setBulkActionModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ações em Massa</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione uma ação para aplicar em {selectedOrders.length} pedidos:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="grid grid-cols-2 gap-2">
            {['pendente', 'processando', 'enviado', 'entregue'].map((status) => (
              <Button
                key={status}
                variant="outline"
                onClick={() => {
                  setBulkAction(status);
                  handleBulkAction();
                }}
              >
                Marcar como {status}
              </Button>
            ))}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PedidosEvolved;
