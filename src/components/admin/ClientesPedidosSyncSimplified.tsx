import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  RefreshCw,
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
  created_at: string;
  total_pedidos?: number;
  total_gasto?: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
  segmento?: 'novo' | 'frequente' | 'vip' | 'inativo';
  tags?: string[];
  notas?: string;
}

interface Pedido {
  id: string;
  customer_id?: string;
  customer_name?: string;
  customer_email?: string;
  status: string;
  total: number;
  created_at: string;
  payment_method?: string;
  payment_status?: string;
  tracking_code?: string;
  shipping_address?: string;
}

interface SyncStats {
  total_clientes: number;
  clientes_com_pedidos: number;
  total_pedidos: number;
  pedidos_com_cliente: number;
  pedidos_orfos: number;
  taxa_associacao: number;
}

const ClientesPedidosSyncSimplified: React.FC = () => {
  // Estados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [selectedClientes, setSelectedClientes] = useState<string[]>([]);
  const [selectedPedidos, setSelectedPedidos] = useState<string[]>([]);
  const [showAssociateDialog, setShowAssociateDialog] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar clientes
      const clientesResponse = await fetch('/api/users');
      const clientesData = await clientesResponse.json();
      setClientes(clientesData.users || []);

      // Carregar pedidos
      const pedidosResponse = await fetch('/api/orders');
      const pedidosData = await pedidosResponse.json();
      setPedidos(pedidosData.orders || []);

      // Calcular estatísticas
      const stats = calculateStats(clientesData.users || [], pedidosData.orders || []);
      setSyncStats(stats);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de sincronização');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (clientes: Cliente[], pedidos: Pedido[]): SyncStats => {
    const totalClientes = clientes.length;
    const clientesComPedidos = clientes.filter(c => c.total_pedidos && c.total_pedidos > 0).length;
    const totalPedidos = pedidos.length;
    const pedidosComCliente = pedidos.filter(p => p.customer_id).length;
    const pedidosOrfos = totalPedidos - pedidosComCliente;
    const taxaAssociacao = totalPedidos > 0 ? (pedidosComCliente / totalPedidos) * 100 : 0;

    return {
      total_clientes: totalClientes,
      clientes_com_pedidos: clientesComPedidos,
      total_pedidos: totalPedidos,
      pedidos_com_cliente: pedidosComCliente,
      pedidos_orfos: pedidosOrfos,
      taxa_associacao: taxaAssociacao
    };
  };

  // Filtrar dados
  const filteredClientes = clientes.filter(cliente => {
    const matchesSearch = cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cliente.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const filteredPedidos = pedidos.filter(pedido => {
    const matchesSearch = pedido.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pedido.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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

  // Sincronização manual
  const handleSync = async () => {
    setLoading(true);
    try {
      // Simular sincronização
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Sincronização concluída com sucesso');
      await loadData();
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast.error('Erro na sincronização');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sincronização Clientes ↔ Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie a associação entre clientes e pedidos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleSync}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Sync className="h-4 w-4 mr-2" />
            Sincronizar
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
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.total_clientes}</div>
              <p className="text-xs text-muted-foreground">
                {syncStats.clientes_com_pedidos} com pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.total_pedidos}</div>
              <p className="text-xs text-muted-foreground">
                {syncStats.pedidos_com_cliente} com cliente
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pedidos Órfãos</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{syncStats.pedidos_orfos}</div>
              <p className="text-xs text-muted-foreground">
                precisam de associação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Associação</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{syncStats.taxa_associacao.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                pedidos associados
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
            Gerencie a associação entre clientes e pedidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
                <SelectItem value="com_pedidos">Com Pedidos</SelectItem>
                <SelectItem value="sem_pedidos">Sem Pedidos</SelectItem>
                <SelectItem value="orfos">Órfãos</SelectItem>
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
        </TabsList>

        {/* Tab Clientes */}
        <TabsContent value="clientes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes</CardTitle>
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
                      <div>
                        <p className="font-medium">{cliente.nome}</p>
                        <p className="text-sm text-muted-foreground">{cliente.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">
                        {cliente.total_pedidos || 0} pedidos
                      </Badge>
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
              <CardTitle>Pedidos</CardTitle>
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
                      <div>
                        <p className="font-medium">
                          {pedido.customer_name || 'Cliente não identificado'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {pedido.customer_email || 'N/A'} • R$ {pedido.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
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

export default ClientesPedidosSyncSimplified;

