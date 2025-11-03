import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package, 
  Eye, 
  Star,
  Calendar,
  Clock,
  BarChart,
  BarChart,
  Activity,
  Zap,
  Target,
  Award,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react';
import { TrendingUp, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart as RechartsBarChart, Cell, BarChart, Bar } from 'recharts';

interface DashboardMetrics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{
    id: string;
    name: string;
    sales: number;
    revenue: number;
    growth: number;
  }>;
  recentOrders: Array<{
    id: string;
    customer: string;
    amount: number;
    status: string;
    date: string;
  }>;
  salesData: Array<{
    date: string;
    sales: number;
    revenue: number;
    orders: number;
  }>;
  categoryData: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const AdvancedDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Cores para gráficos
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

  useEffect(() => {
    loadMetrics();
  }, [timeRange]);

  const loadMetrics = async () => {
    setLoading(true);
    try {
      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Dados mockados para demonstração
      const mockMetrics: DashboardMetrics = {
        totalRevenue: 125430.50,
        totalOrders: 1247,
        totalProducts: 89,
        totalCustomers: 3421,
        conversionRate: 3.2,
        averageOrderValue: 100.58,
        topProducts: [
          { id: '1', name: 'Action Figure Mario', sales: 156, revenue: 15600, growth: 12.5 },
          { id: '2', name: 'Coleção Star Wars', sales: 134, revenue: 13400, growth: 8.3 },
          { id: '3', name: 'Boneco Raro', sales: 98, revenue: 9800, growth: -2.1 },
          { id: '4', name: 'Jogo Vintage', sales: 87, revenue: 8700, growth: 15.7 },
          { id: '5', name: 'Livro Colecionável', sales: 76, revenue: 7600, growth: 5.2 }
        ],
        recentOrders: [
          { id: 'ORD-001', customer: 'João Silva', amount: 150.00, status: 'Entregue', date: '2025-10-20' },
          { id: 'ORD-002', customer: 'Maria Santos', amount: 89.90, status: 'Processando', date: '2025-10-20' },
          { id: 'ORD-003', customer: 'Pedro Costa', amount: 234.50, status: 'Enviado', date: '2025-10-19' },
          { id: 'ORD-004', customer: 'Ana Oliveira', amount: 67.80, status: 'Entregue', date: '2025-10-19' },
          { id: 'ORD-005', customer: 'Carlos Lima', amount: 189.90, status: 'Pendente', date: '2025-10-18' }
        ],
        salesData: [
          { date: '2025-10-14', sales: 12, revenue: 1200, orders: 8 },
          { date: '2025-10-15', sales: 19, revenue: 1900, orders: 12 },
          { date: '2025-10-16', sales: 15, revenue: 1500, orders: 10 },
          { date: '2025-10-17', sales: 22, revenue: 2200, orders: 14 },
          { date: '2025-10-18', sales: 18, revenue: 1800, orders: 11 },
          { date: '2025-10-19', sales: 25, revenue: 2500, orders: 16 },
          { date: '2025-10-20', sales: 28, revenue: 2800, orders: 18 }
        ],
        categoryData: [
          { name: 'Action Figures', value: 35, color: '#8884d8' },
          { name: 'Colecionáveis', value: 25, color: '#82ca9d' },
          { name: 'Jogos', value: 20, color: '#ffc658' },
          { name: 'Livros', value: 12, color: '#ff7300' },
          { name: 'Outros', value: 8, color: '#00ff00' }
        ]
      };

      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
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

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Erro ao carregar métricas</p>
        <Button onClick={loadMetrics} className="mt-4">
          <RefreshCw className="w-4 h-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Avançado</h1>
          <p className="text-muted-foreground">Visão geral completa do seu negócio</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Receita Total</p>
                <p className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+12.5%</span>
              <span className="text-sm text-muted-foreground ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pedidos</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalOrders)}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+8.3%</span>
              <span className="text-sm text-muted-foreground ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalProducts)}</p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+3.2%</span>
              <span className="text-sm text-muted-foreground ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clientes</p>
                <p className="text-2xl font-bold">{formatNumber(metrics.totalCustomers)}</p>
              </div>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-500">+15.7%</span>
              <span className="text-sm text-muted-foreground ml-2">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Análise */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="sales">Vendas</TabsTrigger>
          <TabsTrigger value="products">Produtos</TabsTrigger>
          <TabsTrigger value="customers">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de Vendas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Vendas dos Últimos 7 Dias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Receita']} />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gráfico de Categorias */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Vendas por Categoria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart>
                    <Pie
                      data={metrics.categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                    >
                      {metrics.categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Métricas Adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Taxa de Conversão</p>
                    <p className="text-2xl font-bold">{metrics.conversionRate}%</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ticket Médio</p>
                    <p className="text-2xl font-bold">{formatCurrency(metrics.averageOrderValue)}</p>
                  </div>
                  <Award className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Produtos Ativos</p>
                    <p className="text-2xl font-bold">{metrics.totalProducts}</p>
                  </div>
                  <Zap className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Produtos em Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                        {index + 1}
                      </Badge>
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.sales} vendas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.revenue)}</p>
                      <div className="flex items-center gap-1">
                        {product.growth > 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm ${product.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {product.growth > 0 ? '+' : ''}{product.growth}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Produtos por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.categoryData.map((category, index) => (
                    <div key={category.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>
                      <Badge variant="outline">{category.value}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Produtos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Produtos com Estoque Baixo</span>
                    <Badge variant="destructive">12</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Produtos Sem Estoque</span>
                    <Badge variant="destructive">3</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Produtos em Destaque</span>
                    <Badge variant="default">8</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Produtos em Promoção</span>
                    <Badge variant="secondary">15</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pedidos Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{order.customer}</p>
                        <p className="text-sm text-muted-foreground">{order.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(order.amount)}</p>
                      <Badge 
                        variant={
                          order.status === 'Entregue' ? 'default' :
                          order.status === 'Processando' ? 'secondary' :
                          order.status === 'Enviado' ? 'outline' : 'destructive'
                        }
                      >
                        {order.status}
                      </Badge>
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

export default AdvancedDashboard;
