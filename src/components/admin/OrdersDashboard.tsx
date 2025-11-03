import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  Activity,
  Zap,
  Target,
  Award,
  BarChart,
  BarChart,
  Calendar,
  RefreshCw,
  Settings,
  Bell,
  Eye,
  Download,
  Share2,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Gift,
  Crown,
  Flame,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  averageTicket: number;
  conversionRate: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalCustomers: number;
  newCustomersToday: number;
  topSellingProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    total: number;
    status: string;
    timestamp: Date;
  }>;
  hourlyStats: Array<{
    hour: number;
    orders: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    revenue: number;
    growth: number;
  }>;
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
  }>;
}

interface OrdersDashboardProps {
  onOrderClick?: (orderId: string) => void;
  onCustomerClick?: (customerId: string) => void;
  onProductClick?: (productId: string) => void;
  onAlertClick?: (alertId: string) => void;
}

const OrdersDashboard: React.FC<OrdersDashboardProps> = ({
  onOrderClick,
  onCustomerClick,
  onProductClick,
  onAlertClick
}) => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // segundos
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [selectedView, setSelectedView] = useState<'overview' | 'analytics' | 'alerts' | 'realtime'>('overview');

  useEffect(() => {
    loadDashboardData();
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, refreshInterval * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados do dashboard
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockStats: DashboardStats = {
        totalOrders: 1247,
        totalRevenue: 156780.50,
        averageTicket: 125.75,
        conversionRate: 12.5,
        pendingOrders: 23,
        processingOrders: 15,
        shippedOrders: 8,
        deliveredOrders: 1189,
        cancelledOrders: 12,
        totalCustomers: 892,
        newCustomersToday: 18,
        topSellingProducts: [
          { name: 'Boneco de Ação Super Herói', sales: 145, revenue: 7250, growth: 15.2 },
          { name: 'Carrinho de Controle Remoto', sales: 98, revenue: 4900, growth: 8.7 },
          { name: 'Puzzle 3D', sales: 76, revenue: 3800, growth: 22.1 },
          { name: 'Boneca Princesa', sales: 65, revenue: 3250, growth: -5.3 },
          { name: 'Kit de Construção', sales: 54, revenue: 2700, growth: 12.8 },
        ],
        recentOrders: [
          { id: 'PED-001', customer: 'João Silva', total: 150.00, status: 'pending', timestamp: new Date() },
          { id: 'PED-002', customer: 'Maria Santos', total: 89.90, status: 'processing', timestamp: new Date(Date.now() - 300000) },
          { id: 'PED-003', customer: 'Pedro Costa', total: 234.50, status: 'shipped', timestamp: new Date(Date.now() - 600000) },
          { id: 'PED-004', customer: 'Ana Oliveira', total: 67.80, status: 'delivered', timestamp: new Date(Date.now() - 900000) },
          { id: 'PED-005', customer: 'Carlos Lima', total: 189.99, status: 'pending', timestamp: new Date(Date.now() - 1200000) },
        ],
        hourlyStats: [
          { hour: 9, orders: 12, revenue: 1200 },
          { hour: 10, orders: 18, revenue: 1800 },
          { hour: 11, orders: 25, revenue: 2500 },
          { hour: 12, orders: 32, revenue: 3200 },
          { hour: 13, orders: 28, revenue: 2800 },
          { hour: 14, orders: 35, revenue: 3500 },
          { hour: 15, orders: 42, revenue: 4200 },
          { hour: 16, orders: 38, revenue: 3800 },
          { hour: 17, orders: 45, revenue: 4500 },
          { hour: 18, orders: 52, revenue: 5200 },
          { hour: 19, orders: 48, revenue: 4800 },
          { hour: 20, orders: 35, revenue: 3500 },
        ],
        statusDistribution: [
          { status: 'delivered', count: 1189, percentage: 95.3, color: 'bg-green-500' },
          { status: 'processing', count: 15, percentage: 1.2, color: 'bg-blue-500' },
          { status: 'shipped', count: 8, percentage: 0.6, color: 'bg-purple-500' },
          { status: 'pending', count: 23, percentage: 1.8, color: 'bg-yellow-500' },
          { status: 'cancelled', count: 12, percentage: 1.0, color: 'bg-red-500' },
        ],
        paymentMethods: [
          { method: 'PIX', count: 580, percentage: 46.5, color: 'bg-green-500' },
          { method: 'Cartão de Crédito', count: 420, percentage: 33.7, color: 'bg-blue-500' },
          { method: 'Boleto', count: 180, percentage: 14.4, color: 'bg-orange-500' },
          { method: 'Transferência', count: 67, percentage: 5.4, color: 'bg-purple-500' },
        ],
        customerSegments: [
          { segment: 'VIP', count: 45, revenue: 45000, growth: 25.3 },
          { segment: 'Regular', count: 650, revenue: 78000, growth: 8.7 },
          { segment: 'Novo', count: 197, revenue: 33780.50, growth: 45.2 },
        ],
        alerts: [
          {
            id: '1',
            type: 'warning',
            title: 'Estoque Baixo',
            message: 'Produto "Boneco de Ação" está com estoque baixo (2 unidades)',
            timestamp: new Date()
          },
          {
            id: '2',
            type: 'info',
            title: 'Novo Cliente VIP',
            message: 'Cliente João Silva atingiu status VIP',
            timestamp: new Date(Date.now() - 1800000)
          },
          {
            id: '3',
            type: 'success',
            title: 'Meta Atingida',
            message: 'Meta de vendas do mês foi atingida com 5 dias de antecedência',
            timestamp: new Date(Date.now() - 3600000)
          }
        ]
      };
      
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora mesmo';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'info': return <Activity className="h-4 w-4 text-blue-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      case 'success': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard de Pedidos</h2>
          <p className="text-muted-foreground">
            Visão geral em tempo real do desempenho dos pedidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.newCustomersToday} novos clientes hoje
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +12.5% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageTicket)}</div>
              <p className="text-xs text-muted-foreground">
                +8.3% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.conversionRate}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs de visualização */}
      <Tabs value={selectedView} onValueChange={(value: any) => setSelectedView(value)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status dos Pedidos */}
            <Card>
              <CardHeader>
                <CardTitle>Status dos Pedidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.statusDistribution.map((status) => (
                    <div key={status.status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                        <span className="capitalize font-medium">{status.status}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${status.color}`}
                            style={{ width: `${status.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{status.count}</span>
                        <span className="text-xs text-muted-foreground">({status.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Métodos de Pagamento */}
            <Card>
              <CardHeader>
                <CardTitle>Métodos de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.paymentMethods.map((method) => (
                    <div key={method.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${method.color}`}></div>
                        <span className="font-medium">{method.method}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${method.color}`}
                            style={{ width: `${method.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{method.count}</span>
                        <span className="text-xs text-muted-foreground">({method.percentage}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pedidos Recentes */}
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => onOrderClick?.(order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <ShoppingCart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{order.id}</div>
                        <div className="text-sm text-muted-foreground">{order.customer}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(order.total)}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatTimeAgo(order.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Produtos */}
            <Card>
              <CardHeader>
                <CardTitle>Top Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.topSellingProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">{product.sales} vendas</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(product.revenue)}</div>
                        <div className={`text-xs flex items-center gap-1 ${
                          product.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {product.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(product.growth)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Segmentação de Clientes */}
            <Card>
              <CardHeader>
                <CardTitle>Segmentação de Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.customerSegments.map((segment) => (
                    <div key={segment.segment} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <Crown className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <div className="font-medium">{segment.segment}</div>
                          <div className="text-sm text-muted-foreground">{segment.count} clientes</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(segment.revenue)}</div>
                        <div className="text-xs text-green-600 flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          +{segment.growth}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.alerts.map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`p-4 border rounded-lg ${getAlertColor(alert.type)} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => onAlertClick?.(alert.id)}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="font-medium">{alert.title}</div>
                        <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {formatTimeAgo(alert.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Atividade em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{stats.pendingOrders}</div>
                    <div className="text-sm text-muted-foreground">Pedidos Pendentes</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{stats.processingOrders}</div>
                    <div className="text-sm text-muted-foreground">Em Processamento</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Pedidos por Hora</span>
                    <span className="text-xs text-muted-foreground">Últimas 12 horas</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {stats.hourlyStats.slice(-6).map((hour) => (
                      <div key={hour.hour} className="text-center">
                        <div className="text-xs text-muted-foreground">{hour.hour}h</div>
                        <div className="w-full bg-gray-200 rounded-full h-8 flex items-end">
                          <div 
                            className="bg-blue-500 rounded-full w-full"
                            style={{ height: `${(hour.orders / 50) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs font-medium mt-1">{hour.orders}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersDashboard;
