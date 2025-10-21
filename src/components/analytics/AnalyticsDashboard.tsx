import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Eye,
  MousePointer,
  Clock,
  Target,
  Zap,
  Activity,
  PieChart,
  LineChart,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  Calendar,
  RefreshCw,
  Download,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useAnalytics } from '@/hooks/useAnalytics';
import { toast } from 'sonner';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  color?: string;
}

function MetricCard({ title, value, change, changeType, icon, description, color = 'blue' }: MetricCardProps) {
  const getChangeIcon = () => {
    switch (changeType) {
      case 'increase': return <ArrowUpRight className="w-4 h-4 text-green-600" />;
      case 'decrease': return <ArrowDownRight className="w-4 h-4 text-red-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeColor = () => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
              {change !== undefined && (
                <div className={`flex items-center gap-1 mt-2 ${getChangeColor()}`}>
                  {getChangeIcon()}
                  <span className="text-sm font-medium">{Math.abs(change)}%</span>
                  <span className="text-xs">vs período anterior</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full bg-${color}-100`}>
              {React.cloneElement(icon as React.ReactElement, { 
                className: `w-6 h-6 text-${color}-600` 
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
  }>;
}

function SimpleChart({ data, type = 'bar' }: { data: ChartData; type?: 'bar' | 'line' | 'doughnut' }) {
  const [chartRef, setChartRef] = useState<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!chartRef || typeof window === 'undefined') return;

    // Simular renderização de gráfico (em produção, usar Chart.js ou similar)
    const ctx = chartRef.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, chartRef.width, chartRef.height);

    // Desenhar gráfico simples
    if (type === 'bar') {
      drawBarChart(ctx, data);
    } else if (type === 'line') {
      drawLineChart(ctx, data);
    }
  }, [chartRef, data, type]);

  const drawBarChart = (ctx: CanvasRenderingContext2D, data: ChartData) => {
    const maxValue = Math.max(...data.datasets[0].data);
    const barWidth = (chartRef!.width - 40) / data.labels.length;
    
    data.datasets[0].data.forEach((value, index) => {
      const barHeight = (value / maxValue) * (chartRef!.height - 60);
      const x = 20 + index * barWidth;
      const y = chartRef!.height - 40 - barHeight;
      
      ctx.fillStyle = '#3B82F6';
      ctx.fillRect(x, y, barWidth - 5, barHeight);
    });
  };

  const drawLineChart = (ctx: CanvasRenderingContext2D, data: ChartData) => {
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.datasets[0].data.forEach((value, index) => {
      const maxValue = Math.max(...data.datasets[0].data);
      const x = 20 + (index * (chartRef!.width - 40)) / (data.labels.length - 1);
      const y = chartRef!.height - 40 - (value / maxValue) * (chartRef!.height - 60);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
  };

  return (
    <div className="relative">
      <canvas
        ref={setChartRef}
        width={400}
        height={200}
        className="w-full h-48"
      />
    </div>
  );
}

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const {
    userBehavior,
    realTimeMetrics,
    funnelData,
    cohortData,
    loadUserBehavior,
    loadFunnelData,
    loadCohortData
  } = useAnalytics();

  // Dados simulados para demonstração
  const mockMetrics = {
    totalUsers: 15420,
    activeUsers: 1240,
    pageViews: 45680,
    bounceRate: 42.5,
    avgSessionDuration: '3m 24s',
    conversionRate: 3.2,
    revenue: 45680.50,
    avgOrderValue: 156.80
  };

  const mockChartData = {
    pageViews: {
      labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      datasets: [{
        label: 'Visualizações',
        data: [1200, 1900, 3000, 5000, 2000, 3000, 4500],
        backgroundColor: '#3B82F6'
      }]
    },
    revenue: {
      labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
      datasets: [{
        label: 'Receita (R$)',
        data: [25000, 32000, 28000, 41000, 38000, 45680],
        borderColor: '#10B981',
        fill: true
      }]
    },
    deviceBreakdown: {
      labels: ['Desktop', 'Mobile', 'Tablet'],
      datasets: [{
        label: 'Dispositivos',
        data: [45, 50, 5],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
      }]
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadUserBehavior(),
        loadFunnelData(),
        loadCohortData()
      ]);
      toast.success('Dados atualizados com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar dados');
    } finally {
      setIsRefreshing(false);
    }
  };

  const exportData = () => {
    const data = {
      metrics: mockMetrics,
      userBehavior,
      realTimeMetrics,
      funnelData,
      cohortData,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Dados exportados com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Métricas em tempo real do seu e-commerce</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Último dia</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={exportData}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Usuários Totais"
          value={mockMetrics.totalUsers.toLocaleString()}
          change={12.5}
          changeType="increase"
          icon={<Users />}
          description="Últimos 30 dias"
          color="blue"
        />
        
        <MetricCard
          title="Usuários Ativos"
          value={mockMetrics.activeUsers.toLocaleString()}
          change={8.2}
          changeType="increase"
          icon={<Activity />}
          description="Online agora"
          color="green"
        />
        
        <MetricCard
          title="Taxa de Conversão"
          value={`${mockMetrics.conversionRate}%`}
          change={-2.1}
          changeType="decrease"
          icon={<Target />}
          description="Últimos 7 dias"
          color="purple"
        />
        
        <MetricCard
          title="Receita Total"
          value={`R$ ${mockMetrics.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          change={15.8}
          changeType="increase"
          icon={<DollarSign />}
          description="Este mês"
          color="green"
        />
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Visualizações de Página
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart data={mockChartData.pageViews} type="line" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Receita por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleChart data={mockChartData.revenue} type="bar" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs com Análises Detalhadas */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="traffic">Tráfego</TabsTrigger>
          <TabsTrigger value="conversion">Conversão</TabsTrigger>
          <TabsTrigger value="audience">Audiência</TabsTrigger>
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Dispositivos</CardTitle>
              </CardHeader>
              <CardContent>
                <SimpleChart data={mockChartData.deviceBreakdown} type="doughnut" />
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Desktop
                    </span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      Mobile
                    </span>
                    <span className="font-medium">50%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2">
                      <Tablet className="w-4 h-4" />
                      Tablet
                    </span>
                    <span className="font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Páginas Mais Visitadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { page: '/loja', views: 15420, change: 12.5 },
                    { page: '/produto/123', views: 8940, change: -3.2 },
                    { page: '/carrinho', views: 5670, change: 8.1 },
                    { page: '/sobre', views: 3420, change: 15.3 }
                  ].map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{item.page}</p>
                        <p className="text-sm text-gray-500">{item.views.toLocaleString()} visualizações</p>
                      </div>
                      <Badge variant={item.change > 0 ? 'default' : 'secondary'}>
                        {item.change > 0 ? '+' : ''}{item.change}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Métricas de Engajamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Taxa de Rejeição</span>
                      <span className="text-sm font-medium">{mockMetrics.bounceRate}%</span>
                    </div>
                    <Progress value={mockMetrics.bounceRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Tempo na Sessão</span>
                      <span className="text-sm font-medium">{mockMetrics.avgSessionDuration}</span>
                    </div>
                    <Progress value={68} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-medium">Páginas por Sessão</span>
                      <span className="text-sm font-medium">3.2</span>
                    </div>
                    <Progress value={64} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Usuários Online</p>
                    <p className="text-2xl font-bold text-green-900">
                      {realTimeMetrics?.active_users || 124}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Eye className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-800">Páginas/min</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {realTimeMetrics?.page_views_per_minute || 45}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <MousePointer className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-purple-800">Conversões/min</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {realTimeMetrics?.conversion_rate_live ? 
                        (realTimeMetrics.conversion_rate_live * 100).toFixed(1) : '2.3'}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800">Receita/min</p>
                    <p className="text-2xl font-bold text-green-900">
                      R$ {realTimeMetrics?.revenue_per_minute?.toFixed(2) || '156.80'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Mapa de Calor em Tempo Real */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Atividade Geográfica
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { country: 'Brasil', users: 89, flag: '🇧🇷' },
                  { country: 'Argentina', users: 23, flag: '🇦🇷' },
                  { country: 'Chile', users: 12, flag: '🇨🇱' },
                  { country: 'Uruguai', users: 8, flag: '🇺🇾' }
                ].map((item, index) => (
                  <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl mb-2">{item.flag}</div>
                    <div className="font-medium">{item.country}</div>
                    <div className="text-sm text-gray-600">{item.users} usuários</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
