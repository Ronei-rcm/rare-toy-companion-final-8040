import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  MemoryStick,
  Network,
  Users,
  ShoppingCart,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  uptime: number;
  processes: number;
}

interface ApplicationStats {
  users: {
    total: number;
    active: number;
    new: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    revenue: number;
  };
  products: {
    total: number;
    active: number;
    lowStock: number;
  };
  performance: {
    responseTime: number;
    uptime: number;
    errors: number;
  };
}

const SystemMonitor: React.FC = () => {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [appStats, setAppStats] = useState<ApplicationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Dados de exemplo para demonstração
  const sampleSystemStats: SystemStats = {
    cpu: {
      usage: 45.2,
      cores: 8,
      load: [1.2, 1.5, 1.8]
    },
    memory: {
      total: 16 * 1024 * 1024 * 1024, // 16GB
      used: 8.5 * 1024 * 1024 * 1024,  // 8.5GB
      free: 7.5 * 1024 * 1024 * 1024,  // 7.5GB
      usage: 53.1
    },
    disk: {
      total: 500 * 1024 * 1024 * 1024, // 500GB
      used: 125 * 1024 * 1024 * 1024,  // 125GB
      free: 375 * 1024 * 1024 * 1024,  // 375GB
      usage: 25.0
    },
    network: {
      bytesIn: 1024 * 1024 * 500,  // 500MB
      bytesOut: 1024 * 1024 * 200, // 200MB
      packetsIn: 125000,
      packetsOut: 98000
    },
    uptime: 86400 * 7 + 3600 * 12, // 7 dias e 12 horas
    processes: 156
  };

  const sampleAppStats: ApplicationStats = {
    users: {
      total: 1247,
      active: 89,
      new: 23
    },
    orders: {
      total: 456,
      pending: 12,
      completed: 444,
      revenue: 45680.50
    },
    products: {
      total: 234,
      active: 198,
      lowStock: 15
    },
    performance: {
      responseTime: 245,
      uptime: 99.9,
      errors: 2
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      // Simular carregamento de dados reais
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Adicionar variação aos dados para simular mudanças
      const variation = () => (Math.random() - 0.5) * 0.1; // ±5% de variação
      
      setSystemStats({
        ...sampleSystemStats,
        cpu: {
          ...sampleSystemStats.cpu,
          usage: Math.max(0, Math.min(100, sampleSystemStats.cpu.usage + variation() * 10))
        },
        memory: {
          ...sampleSystemStats.memory,
          usage: Math.max(0, Math.min(100, sampleSystemStats.memory.usage + variation() * 5))
        }
      });
      
      setAppStats(sampleAppStats);
      setLastUpdate(new Date());
    } catch (error) {
      toast.error('Erro ao carregar estatísticas do sistema');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusColor = (usage: number): string => {
    if (usage < 50) return 'text-green-600';
    if (usage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusBadge = (usage: number) => {
    if (usage < 50) return <Badge className="bg-green-100 text-green-800">Ótimo</Badge>;
    if (usage < 80) return <Badge className="bg-yellow-100 text-yellow-800">Atenção</Badge>;
    return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
  };

  if (loading && !systemStats) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Activity className="h-6 w-6" />
            <span>Monitor do Sistema</span>
          </h2>
          <p className="text-muted-foreground">
            Estatísticas em tempo real do servidor e aplicação
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <p className="text-sm text-muted-foreground">
            Última atualização: {lastUpdate.toLocaleTimeString()}
          </p>
          <Button variant="outline" size="sm" onClick={loadStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Estatísticas do Sistema */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Server className="h-5 w-5" />
          <span>Recursos do Sistema</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>CPU</span>
                </div>
                {systemStats && getStatusBadge(systemStats.cpu.usage)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {systemStats?.cpu.usage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {systemStats?.cpu.cores} cores
                  </span>
                </div>
                <Progress value={systemStats?.cpu.usage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  Load: {systemStats?.cpu.load.map(l => l.toFixed(2)).join(', ')}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Memória */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4" />
                  <span>Memória</span>
                </div>
                {systemStats && getStatusBadge(systemStats.memory.usage)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {systemStats?.memory.usage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {systemStats && formatBytes(systemStats.memory.used)}
                  </span>
                </div>
                <Progress value={systemStats?.memory.usage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {systemStats && formatBytes(systemStats.memory.free)} livres
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Disco */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span>Disco</span>
                </div>
                {systemStats && getStatusBadge(systemStats.disk.usage)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">
                    {systemStats?.disk.usage.toFixed(1)}%
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {systemStats && formatBytes(systemStats.disk.used)}
                  </span>
                </div>
                <Progress value={systemStats?.disk.usage} className="h-2" />
                <div className="text-xs text-muted-foreground">
                  {systemStats && formatBytes(systemStats.disk.free)} livres
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rede */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span>Rede</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Download</span>
                  <span className="text-sm text-muted-foreground">
                    {systemStats && formatBytes(systemStats.network.bytesIn)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Upload</span>
                  <span className="text-sm text-muted-foreground">
                    {systemStats && formatBytes(systemStats.network.bytesOut)}
                  </span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">
                  Pacotes: {systemStats?.network.packetsIn.toLocaleString()} in, {systemStats?.network.packetsOut.toLocaleString()} out
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Estatísticas da Aplicação */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Estatísticas da Aplicação</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Usuários */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Usuários</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{appStats?.users.total}</span>
                  <span className="text-sm text-green-600">+{appStats?.users.new}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {appStats?.users.active} ativos agora
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pedidos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <ShoppingCart className="h-4 w-4" />
                <span>Pedidos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{appStats?.orders.total}</span>
                  <Badge variant="outline">{appStats?.orders.pending} pendentes</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {appStats?.orders.completed} concluídos
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Produtos */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" />
                <span>Produtos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{appStats?.products.total}</span>
                  <span className="text-sm text-green-600">{appStats?.products.active} ativos</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {appStats?.products.lowStock} com estoque baixo
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center space-x-2">
                <Activity className="h-4 w-4" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{appStats?.performance.responseTime}ms</span>
                  <span className="text-sm text-green-600">{appStats?.performance.uptime}% uptime</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {appStats?.performance.errors} erros hoje
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Status do Sistema</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Servidor</p>
                <p className="text-sm text-muted-foreground">
                  Online há {systemStats && formatUptime(systemStats.uptime)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Aplicação</p>
                <p className="text-sm text-muted-foreground">
                  {systemStats?.processes} processos ativos
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="font-medium">Banco de Dados</p>
                <p className="text-sm text-muted-foreground">Conectado</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemMonitor;
