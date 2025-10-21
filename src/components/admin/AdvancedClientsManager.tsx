import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  TrendingUp,
  ShoppingCart,
  Star,
  Clock,
  Activity,
  BarChart3,
  Target,
  Send,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Interfaces
interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  total_pedidos?: number;
  total_gasto?: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
  segmento?: 'novo' | 'frequente' | 'vip' | 'inativo';
  tags?: string[];
  notas?: string;
}

interface ClienteForm {
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  tags: string[];
  notas: string;
}

interface Metricas {
  total: number;
  ativos: number;
  novos: number;
  vip: number;
  receita_total: number;
  ticket_medio: number;
}

const estados = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const tagsDisponiveis = [
  'VIP', 'Frequente', 'Novo Cliente', 'Problema Pagamento', 
  'Cliente Especial', 'Promocional', 'Black Friday', 'Natal'
];

export const AdvancedClientsManager = () => {
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Estados principais
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricas, setMetricas] = useState<Metricas>({
    total: 0,
    ativos: 0,
    novos: 0,
    vip: 0,
    receita_total: 0,
    ticket_medio: 0
  });

  // Filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSegmento, setFilterSegmento] = useState<string>('all');
  const [filterCidade, setFilterCidade] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Seleção múltipla
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Dialogs
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  // Seleções
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [clienteToDelete, setClienteToDelete] = useState<Cliente | null>(null);

  // Form
  const [formData, setFormData] = useState<ClienteForm>({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    status: 'ativo',
    tags: [],
    notas: ''
  });

  // Carregar dados
  useEffect(() => {
    loadClientes();
    loadMetricas();
  }, []);

  const loadClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/users`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setClientes(data.map((c: any) => ({
          ...c,
          segmento: calcularSegmento(c),
          total_pedidos: c.total_pedidos || 0,
          total_gasto: c.total_gasto || 0,
          tags: c.tags ? JSON.parse(c.tags) : [],
          status: c.status || 'ativo'
        })));
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const loadMetricas = async () => {
    try {
      // Simular métricas por enquanto
      setMetricas({
        total: clientes.length,
        ativos: clientes.filter(c => c.status === 'ativo').length,
        novos: clientes.filter(c => {
          const created = new Date(c.created_at);
          const now = new Date();
          const diffDays = (now.getTime() - created.getTime()) / (1000 * 3600 * 24);
          return diffDays <= 30;
        }).length,
        vip: clientes.filter(c => c.segmento === 'vip').length,
        receita_total: clientes.reduce((sum, c) => sum + (c.total_gasto || 0), 0),
        ticket_medio: clientes.length > 0 ? clientes.reduce((sum, c) => sum + (c.total_gasto || 0), 0) / clientes.length : 0
      });
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
    }
  };

  const calcularSegmento = (cliente: any): string => {
    const totalGasto = cliente.total_gasto || 0;
    const totalPedidos = cliente.total_pedidos || 0;
    
    if (totalGasto > 1000 || totalPedidos > 10) return 'vip';
    if (totalPedidos > 3) return 'frequente';
    if (totalPedidos === 0) return 'inativo';
    return 'novo';
  };

  // Filtrar e ordenar clientes
  const filteredClientes = clientes
    .filter(cliente => {
      const matchSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (cliente.telefone && cliente.telefone.includes(searchTerm));
      
      const matchStatus = filterStatus === 'all' || cliente.status === filterStatus;
      const matchSegmento = filterSegmento === 'all' || cliente.segmento === filterSegmento;
      const matchCidade = filterCidade === 'all' || cliente.cidade === filterCidade;
      
      return matchSearch && matchStatus && matchSegmento && matchCidade;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Cliente];
      let bValue = b[sortBy as keyof Cliente];
      
      if (sortBy === 'created_at') {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Funções CRUD
  const handleAddCliente = () => {
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      status: 'ativo',
      tags: [],
      notas: ''
    });
    setShowAddDialog(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone || '',
      endereco: cliente.endereco || '',
      cidade: cliente.cidade || '',
      estado: cliente.estado || '',
      cep: cliente.cep || '',
      status: cliente.status,
      tags: cliente.tags || [],
      notas: cliente.notas || ''
    });
    setShowEditDialog(true);
  };

  const handleDeleteCliente = (cliente: Cliente) => {
    setClienteToDelete(cliente);
    setShowDeleteDialog(true);
  };

  const handleBulkAction = (action: string) => {
    if (selectedClientes.length === 0) {
      toast.error('Selecione pelo menos um cliente');
      return;
    }
    setShowBulkDialog(true);
  };

  // Seleção
  const toggleSelectCliente = (clienteId: string) => {
    setSelectedClientes(prev => 
      prev.includes(clienteId) 
        ? prev.filter(id => id !== clienteId)
        : [...prev, clienteId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedClientes([]);
    } else {
      setSelectedClientes(filteredClientes.map(c => c.id));
    }
    setSelectAll(!selectAll);
  };

  // Renderizar métricas
  const MetricCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  // Renderizar cliente como card
  const ClienteCard = ({ cliente }: { cliente: Cliente }) => (
    <Card className={cn(
      "overflow-hidden hover:shadow-md transition-all cursor-pointer",
      selectedClientes.includes(cliente.id) && "ring-2 ring-primary"
    )}>
      <div className="flex">
        {/* Checkbox */}
        <div className="flex items-center justify-center p-4">
          <Checkbox
            checked={selectedClientes.includes(cliente.id)}
            onCheckedChange={() => toggleSelectCliente(cliente.id)}
          />
        </div>

        {/* Avatar */}
        <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center bg-primary/10">
          {cliente.avatar_url ? (
            <img src={cliente.avatar_url} alt={cliente.nome} className="w-16 h-16 rounded-full object-cover" />
          ) : (
            <Users className="h-8 w-8 text-primary" />
          )}
        </div>
        
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-lg">{cliente.nome}</h3>
                <Badge variant={cliente.status === 'ativo' ? 'default' : 'secondary'}>
                  {cliente.status}
                </Badge>
                <Badge variant="outline" className={cn(
                  cliente.segmento === 'vip' && 'bg-yellow-100 text-yellow-800',
                  cliente.segmento === 'frequente' && 'bg-blue-100 text-blue-800',
                  cliente.segmento === 'novo' && 'bg-green-100 text-green-800',
                  cliente.segmento === 'inativo' && 'bg-gray-100 text-gray-800'
                )}>
                  {cliente.segmento}
                </Badge>
              </div>
              
              <div className="space-y-1 mb-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  {cliente.email}
                </div>
                {cliente.telefone && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Phone className="w-4 h-4 mr-2" />
                    {cliente.telefone}
                  </div>
                )}
                {(cliente.cidade || cliente.estado) && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {[cliente.cidade, cliente.estado].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(cliente.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </div>
                {cliente.total_pedidos > 0 && (
                  <div className="flex items-center">
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    {cliente.total_pedidos} pedidos
                  </div>
                )}
                {cliente.total_gasto > 0 && (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    R$ {cliente.total_gasto.toFixed(2)}
                  </div>
                )}
              </div>

              {cliente.tags && cliente.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {cliente.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCliente(cliente);
                  setShowDetailsDialog(true);
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditCliente(cliente)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteCliente(cliente)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando clientes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Clientes</h1>
          <p className="text-muted-foreground">Gerencie todos os seus clientes de forma avançada</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadClientes()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleAddCliente}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Clientes"
          value={metricas.total}
          icon={Users}
          color="text-blue-600"
        />
        <MetricCard
          title="Clientes Ativos"
          value={metricas.ativos}
          icon={UserCheck}
          color="text-green-600"
          subtitle={`${((metricas.ativos / metricas.total) * 100).toFixed(1)}% do total`}
        />
        <MetricCard
          title="Clientes VIP"
          value={metricas.vip}
          icon={Star}
          color="text-yellow-600"
        />
        <MetricCard
          title="Receita Total"
          value={`R$ ${metricas.receita_total.toFixed(2)}`}
          icon={TrendingUp}
          color="text-green-600"
          subtitle={`Ticket médio: R$ ${metricas.ticket_medio.toFixed(2)}`}
        />
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros e Ações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
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
              <Label>Segmento</Label>
              <Select value={filterSegmento} onValueChange={setFilterSegmento}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os segmentos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="frequente">Frequente</SelectItem>
                  <SelectItem value="novo">Novo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Ordenar por</Label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Data de Cadastro</SelectItem>
                  <SelectItem value="nome">Nome</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="total_gasto">Valor Gasto</SelectItem>
                  <SelectItem value="total_pedidos">Número de Pedidos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
              >
                {viewMode === 'cards' ? '📋' : '🎴'}
              </Button>
            </div>
          </div>

          {/* Ações em lote */}
          {selectedClientes.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedClientes.length} cliente(s) selecionado(s)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('email')}>
                  <Mail className="h-4 w-4 mr-1" />
                  Enviar Email
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('tags')}>
                  <Target className="h-4 w-4 mr-1" />
                  Adicionar Tags
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('status')}>
                  <Settings className="h-4 w-4 mr-1" />
                  Alterar Status
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleBulkAction('export')}>
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Clientes */}
      <div className="space-y-4">
        {filteredClientes.length > 0 ? (
          <>
            {/* Selecionar todos */}
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectAll}
                onCheckedChange={toggleSelectAll}
              />
              <Label>Selecionar todos ({filteredClientes.length})</Label>
            </div>

            {/* Cards dos clientes */}
            <div className="grid gap-4">
              {filteredClientes.map((cliente) => (
                <ClienteCard key={cliente.id} cliente={cliente} />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm || filterStatus !== 'all' || filterSegmento !== 'all' 
                  ? 'Nenhum cliente encontrado' 
                  : 'Nenhum cliente cadastrado'
                }
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || filterStatus !== 'all' || filterSegmento !== 'all'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Comece adicionando seu primeiro cliente.'
                }
              </p>
              {!searchTerm && filterStatus === 'all' && filterSegmento === 'all' && (
                <Button onClick={handleAddCliente}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Primeiro Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs - Serão implementados nas próximas etapas */}
    </div>
  );
};
