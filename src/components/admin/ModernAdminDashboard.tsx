import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  Target,
  Award,
  Zap,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Bell,
  Settings,
  Plus
} from 'lucide-react';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useDashboardMetrics, useVendasData, useProdutosPopulares, usePedidosRecentes, useRefreshData } from '@/hooks/useAnalytics';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DashboardMetric {
  title: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'neutral';
  icon: React.ComponentType<any>;
  color: string;
  format: 'currency' | 'number' | 'percentage';
  link?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ModernAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { metrics, loading: metricsLoading, error: metricsError, refetch: refetchMetrics } = useDashboardMetrics();
  const { vendas, loading: vendasLoading, refetch: refetchVendas } = useVendasData();
  const { produtos, loading: produtosLoading, refetch: refetchProdutos } = useProdutosPopulares();
  const { pedidos, loading: pedidosLoading, refetch: refetchPedidos } = usePedidosRecentes();
  const { refreshing, refreshData } = useRefreshData();
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      // Atualizar todos os dados sem recarregar página
      Promise.all([
        refetchMetrics(),
        refetchVendas(),
        refetchProdutos(),
        refetchPedidos()
      ]).then(() => {
        toast({
          title: 'Dados atualizados',
          description: 'Dashboard atualizado automaticamente'
        });
      });
    }, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [autoRefresh, refetchMetrics, refetchVendas, refetchProdutos, refetchPedidos, toast]);

  const formatValue = (value: number, type: 'currency' | 'number' | 'percentage'): string => {
    if (type === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    if (type === 'percentage') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('pt-BR');
  };

  // Processar métricas
  const dashboardMetrics: DashboardMetric[] = metrics ? [
    {
      title: 'Receita Total',
      value: metrics.totalRevenue || 0,
      change: metrics.revenueChange || 0,
      changeType: (metrics.revenueChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: DollarSign,
      color: 'text-green-600',
      format: 'currency',
      link: '/admin/financeiro'
    },
    {
      title: 'Pedidos',
      value: metrics.totalOrders || 0,
      change: metrics.ordersChange || 0,
      changeType: (metrics.ordersChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: ShoppingCart,
      color: 'text-blue-600',
      format: 'number',
      link: '/admin/pedidos'
    },
    {
      title: 'Clientes',
      value: metrics.totalCustomers || 0,
      change: metrics.customersChange || 0,
      changeType: (metrics.customersChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Users,
      color: 'text-purple-600',
      format: 'number',
      link: '/admin/clientes'
    },
    {
      title: 'Produtos',
      value: metrics.totalProducts || 0,
      change: metrics.productsChange || 0,
      changeType: (metrics.productsChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Package,
      color: 'text-orange-600',
      format: 'number',
      link: '/admin/produtos'
    },
    {
      title: 'Taxa de Conversão',
      value: metrics.conversionRate || 0,
      change: metrics.conversionChange || 0,
      changeType: (metrics.conversionChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Target,
      color: 'text-indigo-600',
      format: 'percentage',
      link: '/admin/analytics'
    },
    {
      title: 'Ticket Médio',
      value: metrics.averageOrderValue || 0,
      change: metrics.aovChange || 0,
      changeType: (metrics.aovChange || 0) >= 0 ? 'increase' : 'decrease',
      icon: Award,
      color: 'text-pink-600',
      format: 'currency',
      link: '/admin/analytics'
    }
  ] : [];

  // Preparar dados de vendas para gráfico
  const salesChartData = vendas?.map((v: any) => ({
    date: new Date(v.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    vendas: v.sales || 0,
    receita: v.revenue || 0
  })) || [];

  // Preparar dados de produtos populares
  const productsChartData = produtos?.slice(0, 5).map((p: any) => ({
    name: (p.nome || 'Produto').substring(0, 20),
    vendas: parseInt(p.sales || p.vendas || 0),
    receita: parseFloat(p.revenue || p.receita_total || 0),
    growth: parseFloat(p.growth || 0)
  })) || [];

  // Atalhos rápidos
  const quickActions = [
    { label: 'Novo Produto', icon: Plus, link: '/admin/produtos', color: 'bg-blue-600' },
    { label: 'Novo Pedido', icon: ShoppingCart, link: '/admin/pedidos', color: 'bg-green-600' },
    { label: 'Novo Cliente', icon: Users, link: '/admin/clientes', color: 'bg-purple-600' },
    { label: 'Nova Transação', icon: DollarSign, link: '/admin/financeiro', color: 'bg-orange-600' }
  ];

  const handleRefresh = async () => {
    try {
      await Promise.all([
        refetchMetrics(),
        refetchVendas(),
        refetchProdutos(),
        refetchPedidos()
      ]);
      toast({
        title: 'Dashboard atualizado',
        description: 'Os dados foram atualizados com sucesso'
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar todos os dados',
        variant: 'destructive'
      });
    }
  };

  const MetricCard = ({ metric }: { metric: DashboardMetric }) => {
    const Icon = metric.icon;
    const ChangeIcon = metric.changeType === 'increase' ? ArrowUpRight : ArrowDownRight;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card 
          className={cn(
            "hover:shadow-lg transition-all cursor-pointer",
            metric.link && "hover:border-primary"
          )}
          onClick={() => metric.link && navigate(metric.link)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <Icon className={cn("h-4 w-4", metric.color)} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatValue(metric.value, metric.format)}</div>
            <div className={cn(
              "text-xs flex items-center gap-1 mt-1",
              metric.changeType === 'increase' ? "text-green-600" : 
              metric.changeType === 'decrease' ? "text-red-600" : 
              "text-gray-600"
            )}>
              <ChangeIcon className="h-3 w-3" />
              {Math.abs(metric.change).toFixed(1)}% em relação ao período anterior
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Exibir erro se houver
  if (metricsError && !metrics) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertCircle className="h-5 w-5" />
              Erro ao Carregar Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{metricsError}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (metricsLoading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 bg-gray-200 rounded animate-pulse w-48 mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-24" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse w-32 mb-2" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do seu negócio em tempo real</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(autoRefresh && "bg-green-50 border-green-200")}
          >
            <Activity className={cn("h-4 w-4 mr-2", autoRefresh && "animate-pulse text-green-600")} />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Atualizar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin/analytics')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardMetrics.map((metric, index) => (
          <MetricCard key={index} metric={metric} />
        ))}
      </div>

      {/* Atalhos Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-600" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Button
                  key={index}
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-gray-50"
                  onClick={() => navigate(action.link)}
                >
                  <div className={cn("p-2 rounded-lg", action.color, "text-white")}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium">{action.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Gráficos e Análises */}
      <Tabs defaultValue="vendas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendas">Vendas</TabsTrigger>
          <TabsTrigger value="produtos">Produtos</TabsTrigger>
          <TabsTrigger value="pedidos">Pedidos Recentes</TabsTrigger>
        </TabsList>

        <TabsContent value="vendas" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Vendas */}
            <Card>
              <CardHeader>
                <CardTitle>Vendas e Receita</CardTitle>
                <CardDescription>Últimos 30 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={salesChartData}>
                    <defs>
                      <linearGradient id="colorVendas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="vendas" stroke="#8884d8" fillOpacity={1} fill="url(#colorVendas)" />
                    <Area type="monotone" dataKey="receita" stroke="#82ca9d" fillOpacity={1} fill="url(#colorReceita)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Produtos</CardTitle>
                <CardDescription>Mais vendidos</CardDescription>
              </CardHeader>
              <CardContent>
                {produtosLoading ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : productsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={productsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-15} textAnchor="end" height={60} />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        formatter={(value: any, name: string) => {
                          if (name === 'receita') {
                            return [new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value), 'Receita'];
                          }
                          return [value, 'Vendas'];
                        }}
                      />
                      <Legend />
                      <Bar yAxisId="left" dataKey="vendas" fill="#8884d8" name="Vendas" />
                      <Bar yAxisId="right" dataKey="receita" fill="#82ca9d" name="Receita (R$)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>Nenhum produto encontrado</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produtos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Produtos Populares</CardTitle>
              <CardDescription>Ranking de vendas</CardDescription>
            </CardHeader>
            <CardContent>
              {produtosLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : produtos && produtos.length > 0 ? (
                <div className="space-y-3">
                  {produtos.slice(0, 10).map((produto: any, index: number) => {
                    const nome = produto.nome || 'Produto';
                    const vendas = parseInt(produto.sales || produto.vendas || 0);
                    const receita = parseFloat(produto.revenue || produto.receita_total || 0);
                    const quantidade = parseInt(produto.quantidade_vendida || 0);
                    
                    return (
                      <div key={produto.id || index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => produto.id && navigate(`/admin/produtos?id=${produto.id}`)}>
                        <div className="flex items-center gap-3 flex-1">
                          <Badge variant="outline" className="w-8 h-8 flex items-center justify-center shrink-0 font-bold">
                            {index + 1}
                          </Badge>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{nome}</p>
                            {quantidade > 0 && (
                              <p className="text-sm text-gray-500">{quantidade} unidades vendidas</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-green-600">
                            {formatValue(receita, 'currency')}
                          </p>
                          <p className="text-xs text-gray-500">{vendas} {vendas === 1 ? 'venda' : 'vendas'}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum produto encontrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pedidos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
              <CardDescription>Últimos pedidos do sistema</CardDescription>
            </CardHeader>
            <CardContent>
              {pedidosLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
                  ))}
                </div>
              ) : pedidos && pedidos.length > 0 ? (
                <div className="space-y-3">
                  {pedidos.slice(0, 10).map((pedido: any, index: number) => {
                    const status = (pedido.status || 'pending').toLowerCase();
                    const customerName = pedido.customer || pedido.user_email || pedido.customer_name || 'Cliente';
                    const orderId = pedido.id || pedido.order_id || `ORD-${index + 1}`;
                    const amount = parseFloat(pedido.amount || pedido.total || 0);
                    
                    return (
                      <div key={orderId} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate(`/admin/pedidos?id=${orderId}`)}>
                        <div className="flex items-center gap-3 flex-1">
                          <div className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            status === 'delivered' || status === 'entregue' ? "bg-green-500" :
                            status === 'processing' || status === 'processando' ? "bg-blue-500" :
                            status === 'shipped' || status === 'enviado' ? "bg-purple-500" :
                            status === 'pending' || status === 'pendente' ? "bg-yellow-500" :
                            status === 'cancelled' || status === 'cancelado' ? "bg-red-500" :
                            "bg-gray-500"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">Pedido #{String(orderId).substring(0, 8)}</p>
                            <p className="text-sm text-gray-500 truncate">{customerName}</p>
                            {pedido.created_at && (
                              <p className="text-xs text-gray-400">
                                {new Date(pedido.created_at).toLocaleDateString('pt-BR')}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-bold text-green-600">{formatValue(amount, 'currency')}</p>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs mt-1",
                              status === 'delivered' || status === 'entregue' ? "border-green-500 text-green-700" :
                              status === 'processing' || status === 'processando' ? "border-blue-500 text-blue-700" :
                              status === 'pending' || status === 'pendente' ? "border-yellow-500 text-yellow-700" :
                              "border-gray-500 text-gray-700"
                            )}
                          >
                            {status === 'delivered' ? 'Entregue' :
                             status === 'processing' ? 'Processando' :
                             status === 'shipped' ? 'Enviado' :
                             status === 'pending' ? 'Pendente' :
                             status === 'cancelled' ? 'Cancelado' :
                             status}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">Nenhum pedido recente</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas e Notificações */}
      {metrics && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertCircle className="h-5 w-5" />
              Alertas e Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.lowStockProducts && metrics.lowStockProducts > 0 && (
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm">
                  {metrics.lowStockProducts} produtos com estoque baixo
                </span>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/produtos?filter=low_stock')}>
                  Ver Produtos
                </Button>
              </div>
            )}
            {metrics.pendingOrders && metrics.pendingOrders > 0 && (
              <div className="flex items-center justify-between p-2 bg-white rounded">
                <span className="text-sm">
                  {metrics.pendingOrders} pedidos pendentes
                </span>
                <Button size="sm" variant="outline" onClick={() => navigate('/admin/pedidos?status=pending')}>
                  Ver Pedidos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

