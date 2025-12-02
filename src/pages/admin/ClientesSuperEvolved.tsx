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
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  TrendingUp,
  ShoppingCart,
  Users,
  Star,
  UserCheck,
  UserX,
  Activity,
  BarChart,
  Target,
  Settings,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Info,
  AlertTriangle,
  FileText,
  Send,
  Tag,
  CreditCard,
  Award,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdminCustomers, Customer } from '@/hooks/useAdminCustomers';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const ClientesSuperEvolved = () => {
  const { toast } = useToast();
  
  // Hook personalizado para gerenciar clientes
  const {
    customers,
    stats,
    loading,
    pagination,
    loadCustomers,
    loadStats,
    updateCustomer,
    deleteCustomer,
    bulkAction,
    getCustomerOrders,
    exportCustomers,
  } = useAdminCustomers();

  // Estados principais
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filtros avançados
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerTypeFilter, setCustomerTypeFilter] = useState('all');
  const [cidadeFilter, setCidadeFilter] = useState('all');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minOrders, setMinOrders] = useState('');
  const [minSpent, setMinSpent] = useState('');

  // Seleção e ações em lote
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [bulkActionType, setBulkActionType] = useState('');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Modais e diálogos
  const [detailsModal, setDetailsModal] = useState<Customer | null>(null);
  const [editModal, setEditModal] = useState<Customer | null>(null);
  const [deleteModal, setDeleteModal] = useState<Customer | null>(null);
  const [bulkActionModal, setBulkActionModal] = useState(false);
  const [exportModal, setExportModal] = useState(false);
  const [ordersModal, setOrdersModal] = useState<Customer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Estados para funcionalidades avançadas
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [editFormData, setEditFormData] = useState<Partial<Customer>>({});
  const [bulkActionValue, setBulkActionValue] = useState('');

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

  // Aplicar filtros no backend quando mudarem
  useEffect(() => {
    const filters: any = {
      page: pagination.page,
      limit: pagination.limit,
      sort: sortBy,
      order: sortOrder,
    };

    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (customerTypeFilter !== 'all') filters.customer_type = customerTypeFilter;
    if (cidadeFilter !== 'all') filters.cidade = cidadeFilter;
    if (estadoFilter !== 'all') filters.estado = estadoFilter;
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    if (minOrders) filters.min_orders = minOrders;
    if (minSpent) filters.min_spent = minSpent;

    loadCustomers(filters);
  }, [
    searchTerm,
    statusFilter,
    customerTypeFilter,
    cidadeFilter,
    estadoFilter,
    sortBy,
    sortOrder,
    dateFrom,
    dateTo,
    minOrders,
    minSpent,
    pagination.page,
  ]);

  // Filtrar clientes localmente (para busca instantânea)
  useEffect(() => {
    setFilteredCustomers(customers);
  }, [customers]);

  const loadInitialData = async () => {
    await Promise.all([loadCustomers(), loadStats()]);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadInitialData();
    setIsRefreshing(false);
    toast({
      title: 'Dados atualizados',
      description: 'Lista de clientes atualizada com sucesso',
    });
  };

  // Funções de seleção
  const toggleSelectCustomer = (customerId: string | number) => {
    setSelectedCustomers(prev =>
      prev.includes(String(customerId))
        ? prev.filter(id => id !== String(customerId))
        : [...prev, String(customerId)]
    );
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(filteredCustomers.map(c => String(c.id)));
    }
  };

  // Funções de ação
  const handleEdit = (customer: Customer) => {
    setEditFormData({
      nome: customer.nome,
      email: customer.email,
      telefone: customer.telefone,
      status: customer.status,
      endereco_cidade: customer.endereco_cidade,
      endereco_estado: customer.endereco_estado,
      endereco_cep: customer.endereco_cep,
      endereco_rua: customer.endereco_rua,
      endereco_numero: customer.endereco_numero,
      endereco_bairro: customer.endereco_bairro,
      notas: customer.notas,
    });
    setEditModal(customer);
  };

  const handleSaveEdit = async () => {
    if (!editModal) return;

    const success = await updateCustomer(editModal.id, editFormData);
    if (success) {
      setEditModal(null);
      setEditFormData({});
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;

    const success = await deleteCustomer(deleteModal.id);
    if (success) {
      setDeleteModal(null);
    }
  };

  const handleBulkAction = async () => {
    if (selectedCustomers.length === 0) {
      toast({
        title: 'Nenhum cliente selecionado',
        description: 'Selecione pelo menos um cliente para executar a ação',
        variant: 'destructive',
      });
      return;
    }

    if (!bulkActionType) {
      toast({
        title: 'Ação não selecionada',
        description: 'Selecione uma ação para executar',
        variant: 'destructive',
      });
      return;
    }

    console.log('[BulkAction] Executando ação em lote:', {
      customerIds: selectedCustomers,
      action: bulkActionType,
      value: bulkActionValue,
    });

    const success = await bulkAction(
      selectedCustomers,
      bulkActionType,
      bulkActionValue || undefined
    );

    if (success) {
      setBulkActionModal(false);
      setSelectedCustomers([]);
      setBulkActionType('');
      setBulkActionValue('');
    }
  };

  const handleViewOrders = async (customer: Customer) => {
    setOrdersModal(customer);
    setLoadingOrders(true);
    const orders = await getCustomerOrders(customer.id);
    // Normalizar valores numéricos dos pedidos
    const normalizedOrders = Array.isArray(orders) ? orders.map((order: any) => ({
      ...order,
      total: order.total !== null && order.total !== undefined ? Number(order.total) : 0,
      items_count: order.items_count !== null && order.items_count !== undefined ? Number(order.items_count) : 0,
    })) : [];
    setCustomerOrders(normalizedOrders);
    setLoadingOrders(false);
  };

  const handleExport = async (format: 'csv' | 'json') => {
    const filters: any = {};
    if (searchTerm) filters.search = searchTerm;
    if (statusFilter !== 'all') filters.status = statusFilter;
    if (customerTypeFilter !== 'all') filters.customer_type = customerTypeFilter;

    const success = await exportCustomers(format, filters);
    if (success) {
      setExportModal(false);
    }
  };

  // Cidades e estados únicos para filtros
  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    customers.forEach(c => {
      if (c.endereco_cidade) cities.add(c.endereco_cidade);
    });
    return Array.from(cities).sort();
  }, [customers]);

  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    customers.forEach(c => {
      if (c.endereco_estado) states.add(c.endereco_estado);
    });
    return Array.from(states).sort();
  }, [customers]);

  // Renderizar métricas
  const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  // Renderizar cliente como card
  const CustomerCard = ({ customer }: { customer: Customer }) => (
    <Card className="hover:shadow-md transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <Checkbox
              checked={selectedCustomers.includes(String(customer.id))}
              onCheckedChange={() => toggleSelectCustomer(customer.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">{customer.nome}</h3>
                <Badge variant={customer.status === 'ativo' ? 'default' : 'secondary'}>
                  {customer.status}
                </Badge>
                {customer.customer_type && (
                  <Badge variant="outline" className={
                    customer.customer_type === 'vip' || customer.customer_type === 'premium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : customer.customer_type === 'regular'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }>
                    {customer.customer_type}
                  </Badge>
                )}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </div>
                {customer.telefone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {customer.telefone}
                  </div>
                )}
                {(customer.endereco_cidade || customer.endereco_estado) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {[customer.endereco_cidade, customer.endereco_estado].filter(Boolean).join(', ')}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm">
                {customer.total_pedidos !== undefined && customer.total_pedidos > 0 && (
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-4 w-4" />
                    {customer.total_pedidos} pedidos
                  </div>
                )}
                {customer.total_gasto !== undefined && Number(customer.total_gasto) > 0 && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    R$ {Number(customer.total_gasto).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDetailsModal(customer)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEdit(customer)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModal(customer)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleViewOrders(customer)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Pedidos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setDetailsModal(customer)}>
                  <Info className="h-4 w-4 mr-2" />
                  Detalhes Completos
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleEdit(customer)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteModal(customer)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus clientes de forma avançada</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => setExportModal(true)}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          {selectedCustomers.length > 0 && (
            <Button onClick={() => setBulkActionModal(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Ações em Lote ({selectedCustomers.length})
            </Button>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Clientes"
          value={stats.total}
          icon={Users}
          color="text-blue-600"
        />
        <MetricCard
          title="Clientes Ativos"
          value={stats.ativos}
          icon={UserCheck}
          color="text-green-600"
          subtitle={`${stats.total > 0 ? ((stats.ativos / stats.total) * 100).toFixed(1) : 0}% do total`}
        />
        <MetricCard
          title="Clientes VIP"
          value={stats.vip}
          icon={Star}
          color="text-yellow-600"
        />
        <MetricCard
          title="Receita Total"
          value={`R$ ${stats.receita_total.toFixed(2)}`}
          icon={TrendingUp}
          color="text-green-600"
          subtitle={`Ticket médio: R$ ${stats.ticket_medio.toFixed(2)}`}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Busca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Tipo de Cliente</Label>
              <Select value={customerTypeFilter} onValueChange={setCustomerTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="new">Novo</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de Cadastro</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="total_gasto">Valor Gasto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Data de (de)</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label>Data de (até)</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div>
              <Label>Mín. Pedidos</Label>
              <Input
                type="number"
                placeholder="0"
                value={minOrders}
                onChange={(e) => setMinOrders(e.target.value)}
              />
            </div>

            <div>
              <Label>Mín. Gasto (R$)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={minSpent}
                onChange={(e) => setMinSpent(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'table' ? 'cards' : 'table')}
            >
              {viewMode === 'table' ? '📋' : '🎴'} {viewMode === 'table' ? 'Tabela' : 'Cards'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {filteredCustomers.length > 0 ? (
          <>
            {viewMode === 'table' ? (
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Localização</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Pedidos</TableHead>
                      <TableHead>Total Gasto</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedCustomers.includes(String(customer.id))}
                            onCheckedChange={() => toggleSelectCustomer(customer.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{customer.nome}</div>
                            {customer.customer_type && (
                              <Badge variant="outline" className="mt-1 text-xs">
                                {customer.customer_type}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{customer.email}</div>
                            {customer.telefone && (
                              <div className="text-muted-foreground">{customer.telefone}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {customer.endereco_cidade || customer.endereco_estado ? (
                            <div className="text-sm">
                              {customer.endereco_cidade && <div>{customer.endereco_cidade}</div>}
                              {customer.endereco_estado && (
                                <div className="text-muted-foreground">{customer.endereco_estado}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={customer.status === 'ativo' ? 'default' : 'secondary'}>
                            {customer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {customer.total_pedidos !== undefined ? customer.total_pedidos : 0}
                        </TableCell>
                        <TableCell>
                          R$ {customer.total_gasto !== undefined && customer.total_gasto !== null ? Number(customer.total_gasto).toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          {format(new Date(customer.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setDetailsModal(customer)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleViewOrders(customer)}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Ver Pedidos
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleEdit(customer)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDeleteModal(customer)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCustomers.map((customer) => (
                  <CustomerCard key={customer.id} customer={customer} />
                ))}
              </div>
            )}

            {/* Paginação */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} clientes
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadCustomers({ page: pagination.page - 1 })}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => loadCustomers({ page: pagination.page + 1 })}
                    disabled={pagination.page >= pagination.pages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum cliente encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all' || customerTypeFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Nenhum cliente cadastrado ainda.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal: Detalhes */}
      <Dialog open={!!detailsModal} onOpenChange={() => setDetailsModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Cliente</DialogTitle>
            <DialogDescription>Informações completas do cliente</DialogDescription>
          </DialogHeader>
          {detailsModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <div className="text-sm font-medium">{detailsModal.nome}</div>
                </div>
                <div>
                  <Label>Email</Label>
                  <div className="text-sm">{detailsModal.email}</div>
                </div>
                {detailsModal.telefone && (
                  <div>
                    <Label>Telefone</Label>
                    <div className="text-sm">{detailsModal.telefone}</div>
                  </div>
                )}
                {detailsModal.cpf && (
                  <div>
                    <Label>CPF</Label>
                    <div className="text-sm">{detailsModal.cpf}</div>
                  </div>
                )}
                <div>
                  <Label>Status</Label>
                  <Badge variant={detailsModal.status === 'ativo' ? 'default' : 'secondary'}>
                    {detailsModal.status}
                  </Badge>
                </div>
                {detailsModal.customer_type && (
                  <div>
                    <Label>Tipo</Label>
                    <Badge variant="outline">{detailsModal.customer_type}</Badge>
                  </div>
                )}
              </div>
              {(detailsModal.endereco_rua || detailsModal.endereco_cidade) && (
                <div>
                  <Label>Endereço</Label>
                  <div className="text-sm">
                    {[
                      detailsModal.endereco_rua,
                      detailsModal.endereco_numero,
                      detailsModal.endereco_complemento,
                      detailsModal.endereco_bairro,
                      detailsModal.endereco_cidade,
                      detailsModal.endereco_estado,
                      detailsModal.endereco_cep,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Total de Pedidos</Label>
                  <div className="text-sm font-medium">{detailsModal.total_pedidos || 0}</div>
                </div>
                <div>
                  <Label>Total Gasto</Label>
                  <div className="text-sm font-medium">
                    R$ {detailsModal.total_gasto !== undefined && detailsModal.total_gasto !== null ? Number(detailsModal.total_gasto).toFixed(2) : '0.00'}
                  </div>
                </div>
                <div>
                  <Label>Ticket Médio</Label>
                  <div className="text-sm">
                    R${' '}
                    {detailsModal.average_ticket !== undefined && detailsModal.average_ticket !== null
                      ? Number(detailsModal.average_ticket).toFixed(2)
                      : detailsModal.total_pedidos && Number(detailsModal.total_pedidos) > 0 && detailsModal.total_gasto !== undefined && detailsModal.total_gasto !== null
                      ? (Number(detailsModal.total_gasto) / Number(detailsModal.total_pedidos)).toFixed(2)
                      : '0.00'}
                  </div>
                </div>
                <div>
                  <Label>Data de Cadastro</Label>
                  <div className="text-sm">
                    {format(new Date(detailsModal.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </div>
                </div>
              </div>
              {detailsModal.notas && (
                <div>
                  <Label>Notas</Label>
                  <div className="text-sm p-2 bg-muted rounded">{detailsModal.notas}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsModal(null)}>
              Fechar
            </Button>
            {detailsModal && (
              <>
                <Button variant="outline" onClick={() => handleViewOrders(detailsModal)}>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Ver Pedidos
                </Button>
                <Button onClick={() => {
                  setDetailsModal(null);
                  handleEdit(detailsModal);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar */}
      <Dialog open={!!editModal} onOpenChange={() => setEditModal(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>Atualize as informações do cliente</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={editFormData.nome || ''}
                onChange={(e) => setEditFormData({ ...editFormData, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={editFormData.email || ''}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input
                value={editFormData.telefone || ''}
                onChange={(e) => setEditFormData({ ...editFormData, telefone: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editFormData.status || 'ativo'}
                onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="bloqueado">Bloqueado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cidade</Label>
              <Input
                value={editFormData.endereco_cidade || ''}
                onChange={(e) => setEditFormData({ ...editFormData, endereco_cidade: e.target.value })}
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Input
                value={editFormData.endereco_estado || ''}
                onChange={(e) => setEditFormData({ ...editFormData, endereco_estado: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>CEP</Label>
              <Input
                value={editFormData.endereco_cep || ''}
                onChange={(e) => setEditFormData({ ...editFormData, endereco_cep: e.target.value })}
              />
            </div>
            <div className="col-span-2">
              <Label>Notas</Label>
              <Textarea
                value={editFormData.notas || ''}
                onChange={(e) => setEditFormData({ ...editFormData, notas: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModal(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Excluir */}
      <AlertDialog open={!!deleteModal} onOpenChange={() => setDeleteModal(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. O cliente {deleteModal?.nome} será removido permanentemente.
              {deleteModal && deleteModal.total_pedidos && deleteModal.total_pedidos > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <AlertTriangle className="h-4 w-4 inline mr-2" />
                  Este cliente possui {deleteModal.total_pedidos} pedido(s). A exclusão pode não ser permitida.
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Ações em Lote */}
      <Dialog open={bulkActionModal} onOpenChange={setBulkActionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ações em Lote</DialogTitle>
            <DialogDescription>
              Executar ação para {selectedCustomers.length} cliente(s) selecionado(s)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Ação</Label>
              <Select value={bulkActionType} onValueChange={setBulkActionType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma ação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="update_status">Alterar Status</SelectItem>
                  <SelectItem value="add_tags">Adicionar Tags</SelectItem>
                  <SelectItem value="delete">Excluir</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(bulkActionType === 'update_status' || bulkActionType === 'add_tags') && (
              <div>
                <Label>
                  {bulkActionType === 'update_status' ? 'Novo Status' : 'Tags (separadas por vírgula)'}
                </Label>
                <Input
                  value={bulkActionValue}
                  onChange={(e) => setBulkActionValue(e.target.value)}
                  placeholder={
                    bulkActionType === 'update_status'
                      ? 'ativo, inativo ou bloqueado'
                      : 'VIP, Frequente, etc.'
                  }
                />
              </div>
            )}
            {bulkActionType === 'delete' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <AlertTriangle className="h-4 w-4 inline mr-2 text-red-600" />
                <span className="text-sm text-red-800">
                  Atenção: Esta ação não pode ser desfeita. Clientes com pedidos não poderão ser excluídos.
                </span>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkActionModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleBulkAction} disabled={!bulkActionType}>
              Executar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Exportar */}
      <Dialog open={exportModal} onOpenChange={setExportModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exportar Clientes</DialogTitle>
            <DialogDescription>Escolha o formato de exportação</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleExport('csv')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar como CSV
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleExport('json')}
            >
              <FileText className="h-4 w-4 mr-2" />
              Exportar como JSON
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportModal(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Pedidos do Cliente */}
      <Dialog open={!!ordersModal} onOpenChange={() => setOrdersModal(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pedidos de {ordersModal?.nome}</DialogTitle>
            <DialogDescription>Histórico completo de pedidos do cliente</DialogDescription>
          </DialogHeader>
          {loadingOrders ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              <span>Carregando pedidos...</span>
            </div>
          ) : customerOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Itens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.id}</TableCell>
                    <TableCell>
                      <Badge>{order.status}</Badge>
                    </TableCell>
                    <TableCell>R$ {order.total !== null && order.total !== undefined ? Number(order.total).toFixed(2) : '0.00'}</TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{order.items_count || 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Este cliente ainda não possui pedidos</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOrdersModal(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesSuperEvolved;

