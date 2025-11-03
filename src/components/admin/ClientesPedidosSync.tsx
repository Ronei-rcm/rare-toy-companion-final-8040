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
  ShoppingCart, 
  RefreshCw, 
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
  Star,
  Clock,
  Activity,
  BarChart,
  Target,
  Send,
  FileText,
  Settings,
  Link,
  Unlink,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Database,
  Sync,
  GitBranch,
  GitCommit,
  GitMerge,
  Layers,
  Network,
  Workflow,
  Cpu,
  MemoryStick,
  HardDrive,
  Wifi,
  WifiOff,
  Signal,
  SignalZero,
  SignalLow,
  SignalMedium,
  SignalHigh
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
  sync_status?: 'sincronizado' | 'pendente' | 'erro' | 'nunca_sincronizado';
  last_sync?: string;
  sync_errors?: string[];
}

interface Pedido {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  payment_method?: string;
  payment_status?: string;
  tracking_code?: string;
  shipping_address?: string;
  sync_status?: 'sincronizado' | 'pendente' | 'erro' | 'nunca_sincronizado';
  last_sync?: string;
  sync_errors?: string[];
}

interface SyncStats {
  total_clientes: number;
  clientes_sincronizados: number;
  clientes_pendentes: number;
  clientes_com_erro: number;
  total_pedidos: number;
  pedidos_sincronizados: number;
  pedidos_pendentes: number;
  pedidos_com_erro: number;
  ultima_sincronizacao: string;
  proxima_sincronizacao: string;
  taxa_sucesso: number;
}

interface SyncLog {
  id: string;
  tipo: 'cliente' | 'pedido' | 'sistema';
  acao: 'criado' | 'atualizado' | 'sincronizado' | 'erro' | 'associado' | 'desassociado';
  entidade_id: string;
  entidade_nome: string;
  detalhes: string;
  status: 'sucesso' | 'erro' | 'pendente';
  timestamp: string;
  duracao_ms?: number;
  erro?: string;
}

const ClientesPedidosSync: React.FC = () => {
  // Estados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [showAssociateDialog, setShowAssociateDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [syncInterval, setSyncInterval] = useState(300); // 5 minutos

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
    if (autoSync) {
      const interval = setInterval(loadData, syncInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoSync, syncInterval]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar clientes com status de sincronização
      const clientesResponse = await fetch('/api/admin/clients/sync-status');
      const clientesData = await clientesResponse.json();
      setClientes(clientesData.clientes || []);

      // Carregar pedidos com status de sincronização
      const pedidosResponse = await fetch('/api/admin/orders/sync-status');
      const pedidosData = await pedidosResponse.json();
      setPedidos(pedidosData.pedidos || []);

      // Carregar estatísticas de sincronização
      const statsResponse = await fetch('/api/admin/sync/stats');
      const statsData = await statsResponse.json();
      setSyncStats(statsData);

      // Carregar logs de sincronização
      const logsResponse = await fetch('/api/admin/sync/logs');
      const logsData = await logsResponse.json();
      setSyncLogs(logsData.logs || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de sincronização');
    } finally {
      setLoading(false);
    }
  };

  // Filtrar dados
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || cliente.sync_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'todos' || pedido.sync_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Sincronização manual
  const handleSync = async (tipo: 'clientes' | 'pedidos' | 'todos') => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/sync/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo, ids: tipo === 'clientes' ? selectedClientes : selectedPedidos })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success(`${result.sincronizados} ${tipo} sincronizados com sucesso`);
        await loadData();
      } else {
        toast.error(result.message || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    } finally {
      setLoading(false);
    }
  };

  // Associar cliente com pedido
  const handleAssociate = async (clienteId: string, pedidoId: string) => {
    try {
      const response = await fetch(`/api/orders/${pedidoId}/associate-customer`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: clienteId })
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Cliente associado ao pedido com sucesso');
        await loadData();
        setShowAssociateDialog(false);
      } else {
        toast.error(result.message || 'Erro ao associar cliente');
      }
    } catch (error) {
      console.error('Erro ao associar:', error);
      toast.error('Erro ao associar cliente');
    }
  };

  // Desassociar cliente de pedido
  const handleDisassociate = async (pedidoId: string) => {
    try {
      const response = await fetch(`/api/orders/${pedidoId}/disassociate-customer`, {
        method: 'PATCH'
      });

      const result = await response.json();
      
      if (result.success) {
        toast.success('Cliente desassociado do pedido com sucesso');
        await loadData();
      } else {
        toast.error(result.message || 'Erro ao desassociar cliente');
      }
    } catch (error) {
      console.error('Erro ao desassociar:', error);
      toast.error('Erro ao desassociar cliente');
    }
  };

  // Obter ícone de status de sincronização
  const getSyncStatusIcon = (status?: string) => {
    switch (status) {
      case 'sincronizado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Obter cor do badge de status
  const getSyncStatusColor = (status?: string) => {
    switch (status) {
      case 'sincronizado':
        return 'bg-green-100 text-green-800';
      case 'pendente':
        return 'bg-yellow-100 text-yellow-800';
      case 'erro':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronização Clientes ↔ Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie a sincronização entre clientes e pedidos em tempo real
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => handleSync('todos')}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sync className="h-4 w-4 mr-2" />
            Sincronizar Tudo
          </Button>
          <Button
            onClick={loadData}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {syncStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes Sincronizados</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.clientes_sincronizados}</div>
              <p className="text-xs text-muted-foreground">
                de {syncStats.total_clientes} clientes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Sincronizados</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.pedidos_sincronizados}</div>
              <p className="text-xs text-muted-foreground">
                de {syncStats.total_pedidos} pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.taxa_sucesso.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                sincronizações bem-sucedidas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Última Sincronização</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatDistanceToNow(new Date(syncStats.ultima_sincronizacao), { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {format(new Date(syncStats.ultima_sincronizacao), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle>Controles de Sincronização</CardTitle>
          <CardDescription>
            Configure e execute sincronizações entre clientes e pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-sync"
                checked={autoSync}
                onCheckedChange={setAutoSync}
              />
              <Label htmlFor="auto-sync">Sincronização Automática</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="sync-interval">Intervalo (segundos):</Label>
              <Input
                id="sync-interval"
                type="number"
                value={syncInterval}
                onChange={(e) => setSyncInterval(Number(e.target.value))}
                className="w-20"
                min="60"
                max="3600"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              placeholder="Buscar clientes ou pedidos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="sincronizado">Sincronizado</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="erro">Com Erro</SelectItem>
                <SelectItem value="nunca_sincronizado">Nunca Sincronizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para Clientes e Pedidos */}
      <Tabs defaultValue="clientes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clientes">
            <Users className="h-4 w-4 mr-2" />
            Clientes ({filteredClientes.length})
          </TabsTrigger>
          <TabsTrigger value="pedidos">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Pedidos ({filteredPedidos.length})
          </TabsTrigger>
          <TabsTrigger value="logs">
            <FileText className="h-4 w-4 mr-2" />
            Logs de Sincronização
          </TabsTrigger>
        </TabsList>

        {/* Tab Clientes */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Clientes</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleSync('clientes')}
                    disabled={loading || selectedClientes.length === 0}
                    size="sm"
                  >
                    <Sync className="h-4 w-4 mr-2" />
                    Sincronizar Selecionados
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredClientes.map((cliente) => (
                  <div
                    key={cliente.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedClientes.includes(cliente.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedClientes([...selectedClientes, cliente.id]);
                          } else {
                            setSelectedClientes(selectedClientes.filter(id => id !== cliente.id));
                          }
                        }}
                      />
                      <div className="flex items-center space-x-2">
                        {getSyncStatusIcon(cliente.sync_status)}
                        <div>
                          <p className="font-medium">{cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">{cliente.email}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSyncStatusColor(cliente.sync_status)}>
                        {cliente.sync_status || 'Nunca Sincronizado'}
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {cliente.total_pedidos || 0} pedidos
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCliente(cliente);
                          setShowAssociateDialog(true);
                        }}
                      >
                        <Link className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Pedidos */}
        <TabsContent value="pedidos" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Pedidos</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleSync('pedidos')}
                    disabled={loading || selectedPedidos.length === 0}
                    size="sm"
                  >
                    <Sync className="h-4 w-4 mr-2" />
                    Sincronizar Selecionados
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredPedidos.map((pedido) => (
                  <div
                    key={pedido.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <Checkbox
                        checked={selectedPedidos.includes(pedido.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPedidos([...selectedPedidos, pedido.id]);
                          } else {
                            setSelectedPedidos(selectedPedidos.filter(id => id !== pedido.id));
                          }
                        }}
                      />
                      <div className="flex items-center space-x-2">
                        {getSyncStatusIcon(pedido.sync_status)}
                        <div>
                          <p className="font-medium">
                            {pedido.customer_name || 'Cliente não identificado'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {pedido.customer_email || 'N/A'} • R$ {pedido.total.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getSyncStatusColor(pedido.sync_status)}>
                        {pedido.sync_status || 'Nunca Sincronizado'}
                      </Badge>
                      <Badge variant="outline">
                        {pedido.status}
                      </Badge>
                      {pedido.customer_id ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDisassociate(pedido.id)}
                        >
                          <Unlink className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedPedido(pedido);
                            setShowAssociateDialog(true);
                          }}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Sincronização</CardTitle>
              <CardDescription>
                Histórico de todas as operações de sincronização
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {syncLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {log.status === 'sucesso' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : log.status === 'erro' ? (
                        <XCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-yellow-500" />
                      )}
                      <div>
                        <p className="font-medium">{log.acao} {log.tipo}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.entidade_nome} • {log.detalhes}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(log.timestamp), { 
                        addSuffix: true, 
                        locale: ptBR 
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Associação */}
      <Dialog open={showAssociateDialog} onOpenChange={setShowAssociateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Associar Cliente com Pedido</DialogTitle>
            <DialogDescription>
              {selectedCliente 
                ? `Associar cliente "${selectedCliente.nome}" com um pedido`
                : `Associar pedido "${selectedPedido?.id}" com um cliente`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCliente && (
              <div>
                <Label>Pedidos Disponíveis</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um pedido" />
                  </SelectTrigger>
                  <SelectContent>
                    {pedidos
                      .filter(p => !p.customer_id)
                      .map(pedido => (
                        <SelectItem key={pedido.id} value={pedido.id}>
                          {pedido.id} - R$ {pedido.total.toFixed(2)} - {pedido.status}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedPedido && (
              <div>
                <Label>Clientes Disponíveis</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.map(cliente => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAssociateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => {
              // Implementar lógica de associação
              setShowAssociateDialog(false);
            }}>
              Associar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientesPedidosSync;





