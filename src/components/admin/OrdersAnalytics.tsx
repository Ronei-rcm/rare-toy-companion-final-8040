import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  BarChart,
  BarChart,
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Users,
  Calendar,
  Target,
  Award,
  Activity,
  Zap,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  ordersTrend: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  customerSegments: Array<{
    segment: string;
    count: number;
    revenue: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  hourlyDistribution: Array<{
    hour: number;
    orders: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    current: number;
    previous: number;
  }>;
}

interface OrdersAnalyticsProps {
  stats: any;
  orders: any[];
  timeRange?: string;
  onTimeRangeChange?: (range: string) => void;
}

const OrdersAnalytics: React.FC<OrdersAnalyticsProps> = ({
  stats,
  orders,
  timeRange = '7d',
  onTimeRangeChange
}) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'trend' | 'products' | 'customers' | 'status' | 'payment' | 'hourly'>('trend');

  useEffect(() => {
    loadAnalyticsData();
  }, [orders, timeRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados de analytics
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockData: AnalyticsData = {
        ordersTrend: [
          { date: '2025-10-17', orders: 12, revenue: 1200 },
          { date: '2025-10-18', orders: 15, revenue: 1500 },
          { date: '2025-10-19', orders: 8, revenue: 800 },
          { date: '2025-10-20', orders: 20, revenue: 2000 },
          { date: '2025-10-21', orders: 18, revenue: 1800 },
          { date: '2025-10-22', orders: 25, revenue: 2500 },
          { date: '2025-10-23', orders: 22, revenue: 2200 },
        ],
        topProducts: [
          { name: 'Boneco de Ação Super Herói', sales: 45, revenue: 2250 },
          { name: 'Carrinho de Controle Remoto', sales: 32, revenue: 1600 },
          { name: 'Puzzle 3D', sales: 28, revenue: 1400 },
          { name: 'Boneca Princesa', sales: 25, revenue: 1250 },
          { name: 'Kit de Construção', sales: 20, revenue: 1000 },
        ],
        customerSegments: [
          { segment: 'VIP', count: 15, revenue: 4500 },
          { segment: 'Regular', count: 120, revenue: 6000 },
          { segment: 'Novo', count: 45, revenue: 1800 },
        ],
        statusDistribution: [
          { status: 'delivered', count: 45, percentage: 60 },
          { status: 'processing', count: 15, percentage: 20 },
          { status: 'shipped', count: 10, percentage: 13.3 },
          { status: 'pending', count: 5, percentage: 6.7 },
        ],
        paymentMethods: [
          { method: 'PIX', count: 35, percentage: 46.7 },
          { method: 'Cartão de Crédito', count: 25, percentage: 33.3 },
          { method: 'Boleto', count: 10, percentage: 13.3 },
          { method: 'Transferência', count: 5, percentage: 6.7 },
        ],
        hourlyDistribution: [
          { hour: 9, orders: 5 },
          { hour: 10, orders: 8 },
          { hour: 11, orders: 12 },
          { hour: 12, orders: 15 },
          { hour: 13, orders: 10 },
          { hour: 14, orders: 18 },
          { hour: 15, orders: 22 },
          { hour: 16, orders: 20 },
          { hour: 17, orders: 25 },
          { hour: 18, orders: 30 },
          { hour: 19, orders: 28 },
          { hour: 20, orders: 15 },
        ],
        monthlyComparison: [
          { month: 'Jan', current: 120, previous: 100 },
          { month: 'Fev', current: 135, previous: 110 },
          { month: 'Mar', current: 150, previous: 125 },
          { month: 'Abr', current: 140, previous: 130 },
          { month: 'Mai', current: 160, previous: 140 },
          { month: 'Jun', current: 175, previous: 150 },
        ]
      };
      
      setAnalyticsData(mockData);
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'shipped': return 'bg-purple-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentColor = (method: string) => {
    switch (method) {
      case 'PIX': return 'bg-green-500';
      case 'Cartão de Crédito': return 'bg-blue-500';
      case 'Boleto': return 'bg-orange-500';
      case 'Transferência': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'VIP': return 'bg-yellow-500';
      case 'Regular': return 'bg-blue-500';
      case 'Novo': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics de Pedidos</h2>
          <p className="text-muted-foreground">
            Análise detalhada do desempenho dos pedidos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={onTimeRangeChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="1y">Último ano</SelectItem>
            </SelectContent>
          </Select>
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
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                +{stats.todayOrders} hoje
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
                +{formatCurrency(stats.todayRevenue)} hoje
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
                Por pedido
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
              <div className="text-2xl font-bold">12.5%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% vs mês anterior
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs de Analytics */}
      <Tabs value={selectedChart} onValueChange={(value: any) => setSelectedChart(value)}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="trend">Tendência</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="payment">Pagamento</TabsTrigger>
          <TabsTrigger value="hourly">Horário</TabsTrigger>
        </TabsList>

        <TabsContent value="trend" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tendência de Pedidos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.ordersTrend.map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-20 text-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short' })}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(day.orders / 30) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{day.orders} pedidos</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(day.revenue)}</div>
                      <div className="text-xs text-muted-foreground">receita</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.topProducts.map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">{product.sales} vendas</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(product.revenue)}</div>
                      <div className="text-xs text-muted-foreground">receita</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Segmentação de Clientes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.customerSegments.map((segment) => (
                  <div key={segment.segment} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${getSegmentColor(segment.segment)}`}></div>
                      <div className="font-medium">{segment.segment}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-medium">{segment.count} clientes</div>
                        <div className="text-xs text-muted-foreground">
                          {((segment.count / (analyticsData?.customerSegments.reduce((acc, s) => acc + s.count, 0) || 1)) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(segment.revenue)}</div>
                        <div className="text-xs text-muted-foreground">receita</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.statusDistribution.map((status) => (
                  <div key={status.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${getStatusColor(status.status)}`}></div>
                      <div className="font-medium capitalize">{status.status}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getStatusColor(status.status)}`}
                          style={{ width: `${status.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{status.count}</div>
                        <div className="text-xs text-muted-foreground">{status.percentage}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métodos de Pagamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.paymentMethods.map((method) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full ${getPaymentColor(method.method)}`}></div>
                      <div className="font-medium">{method.method}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getPaymentColor(method.method)}`}
                          style={{ width: `${method.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{method.count}</div>
                        <div className="text-xs text-muted-foreground">{method.percentage}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Horário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.hourlyDistribution.map((hour) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 text-sm text-muted-foreground">
                        {hour.hour}:00
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(hour.orders / 30) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium">{hour.orders} pedidos</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersAnalytics;
