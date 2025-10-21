import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Users,
  ShoppingCart,
  Building,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  RefreshCw
} from 'lucide-react';

interface FinancialDashboardProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
  onRefresh: () => void;
  loading: boolean;
}

const FinancialDashboard: React.FC<FinancialDashboardProps> = ({
  orders,
  suppliers,
  events,
  transactions,
  summary,
  onRefresh,
  loading
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    todayRevenue: 0,
    todayExpenses: 0,
    pendingTransactions: 0,
    overduePayments: 0,
    conversionRate: 0,
    averageOrderValue: 0
  });

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calcular métricas em tempo real
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Receitas de hoje
    const todayRevenue = transactions
      .filter(t => {
        const transactionDate = new Date(t.data);
        return transactionDate >= today && t.tipo === 'Entrada' && t.status === 'Pago';
      })
      .reduce((sum, t) => sum + t.valor, 0);

    // Despesas de hoje
    const todayExpenses = transactions
      .filter(t => {
        const transactionDate = new Date(t.data);
        return transactionDate >= today && t.tipo === 'Saída' && t.status === 'Pago';
      })
      .reduce((sum, t) => sum + t.valor, 0);

    // Transações pendentes
    const pendingTransactions = transactions.filter(t => t.status === 'Pendente').length;

    // Pagamentos atrasados
    const overduePayments = transactions.filter(t => 
      t.status === 'Atrasado' || 
      (t.status === 'Pendente' && new Date(t.data) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    ).length;

    // Taxa de conversão (simulada)
    const conversionRate = orders.length > 0 ? Math.min(85 + Math.random() * 10, 95) : 0;

    // Valor médio do pedido
    const averageOrderValue = orders.length > 0 
      ? orders.reduce((sum, order) => sum + (order.total || 0), 0) / orders.length 
      : 0;

    setRealTimeMetrics({
      todayRevenue,
      todayExpenses,
      pendingTransactions,
      overduePayments,
      conversionRate,
      averageOrderValue
    });
  }, [transactions, orders]);

  // Componente de métrica individual
  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = "blue",
    subtitle,
    trend
  }: {
    title: string;
    value: string;
    change?: string;
    icon: any;
    color?: string;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => {
    const colorClasses = {
      blue: "text-blue-600 bg-blue-100",
      green: "text-green-600 bg-green-100",
      red: "text-red-600 bg-red-100",
      orange: "text-orange-600 bg-orange-100",
      purple: "text-purple-600 bg-purple-100"
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
              {change && (
                <div className="flex items-center mt-2">
                  {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500 mr-1" />}
                  {trend === 'down' && <TrendingDown className="h-3 w-3 text-red-500 mr-1" />}
                  <span className={`text-xs ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}`}>
                    {change}
                  </span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de KPI
  const KPICard = ({ 
    title, 
    current, 
    target, 
    icon: Icon, 
    unit = "%",
    color = "blue"
  }: {
    title: string;
    current: number;
    target: number;
    icon: any;
    unit?: string;
    color?: string;
  }) => {
    const percentage = Math.min((current / target) * 100, 100);
    
    const colorClasses = {
      blue: "bg-blue-500",
      green: "bg-green-500",
      red: "bg-red-500",
      orange: "bg-orange-500",
      purple: "bg-purple-500"
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {current.toLocaleString('pt-BR')}{unit}
              </p>
            </div>
            <Icon className="h-8 w-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Meta: {target.toLocaleString('pt-BR')}{unit}</span>
              <span>{percentage.toFixed(1)}%</span>
            </div>
            <Progress 
              value={percentage} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>
    );
  };

  // Componente de atividade recente
  const ActivityFeed = () => {
    const recentActivities = [
      {
        id: 1,
        type: 'sale',
        message: 'Nova venda de R$ 245,80',
        time: '2 minutos atrás',
        icon: ShoppingCart,
        color: 'text-green-600'
      },
      {
        id: 2,
        type: 'payment',
        message: 'Pagamento de fornecedor de R$ 1.200,00',
        time: '15 minutos atrás',
        icon: Building,
        color: 'text-red-600'
      },
      {
        id: 3,
        type: 'event',
        message: 'Evento "Workshop Brinquedos" - 15 participantes',
        time: '1 hora atrás',
        icon: Calendar,
        color: 'text-blue-600'
      },
      {
        id: 4,
        type: 'alert',
        message: 'Alerta: Meta de faturamento atingida!',
        time: '2 horas atrás',
        icon: CheckCircle,
        color: 'text-green-600'
      }
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividade Recente
          </CardTitle>
          <CardDescription>Últimas movimentações financeiras</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <div className={`p-2 rounded-full bg-gray-100`}>
                  <activity.icon className={`h-4 w-4 ${activity.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com Relógio e Refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Financeiro</h2>
          <p className="text-gray-600">
            {currentTime.toLocaleString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Tempo Real
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Métricas em Tempo Real */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Receitas Hoje"
          value={`R$ ${realTimeMetrics.todayRevenue.toLocaleString('pt-BR')}`}
          change="+12% vs ontem"
          icon={DollarSign}
          color="green"
          trend="up"
          subtitle="Receitas confirmadas"
        />
        <MetricCard
          title="Despesas Hoje"
          value={`R$ ${realTimeMetrics.todayExpenses.toLocaleString('pt-BR')}`}
          change="+5% vs ontem"
          icon={TrendingDown}
          color="red"
          trend="up"
          subtitle="Despesas pagas"
        />
        <MetricCard
          title="Pendências"
          value={realTimeMetrics.pendingTransactions.toString()}
          change={realTimeMetrics.pendingTransactions > 5 ? "+2 esta semana" : "-1 esta semana"}
          icon={Clock}
          color="orange"
          trend={realTimeMetrics.pendingTransactions > 5 ? "up" : "down"}
          subtitle="Transações pendentes"
        />
        <MetricCard
          title="Atrasados"
          value={realTimeMetrics.overduePayments.toString()}
          change={realTimeMetrics.overduePayments > 0 ? "Atenção necessária" : "Em dia"}
          icon={AlertTriangle}
          color={realTimeMetrics.overduePayments > 0 ? "red" : "green"}
          trend={realTimeMetrics.overduePayments > 0 ? "down" : "neutral"}
          subtitle="Pagamentos atrasados"
        />
      </div>

      {/* KPIs e Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Meta de Faturamento"
          current={summary?.totalRevenue || 0}
          target={15000}
          icon={Target}
          unit=""
          color="green"
        />
        <KPICard
          title="Taxa de Conversão"
          current={realTimeMetrics.conversionRate}
          target={90}
          icon={BarChart3}
          unit="%"
          color="blue"
        />
        <KPICard
          title="Ticket Médio"
          current={realTimeMetrics.averageOrderValue}
          target={300}
          icon={ShoppingCart}
          unit=""
          color="orange"
        />
        <KPICard
          title="Eficiência Operacional"
          current={85}
          target={95}
          icon={Zap}
          unit="%"
          color="purple"
        />
      </div>

      {/* Abas de Análise */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="activity">Atividade</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Distribuição Financeira
                  </CardTitle>
                  <CardDescription>Receitas vs Despesas por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Vendas</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">60%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Eventos</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Outros</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">15%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <ActivityFeed />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance do Mês</CardTitle>
                <CardDescription>Comparativo com o mês anterior</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Faturamento</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">+18%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Despesas</span>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-red-600 font-medium">+5%</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Lucro Líquido</span>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-green-600 font-medium">+22%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top Categorias</CardTitle>
                <CardDescription>Maiores geradores de receita</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Vendas de Produtos</span>
                    <Badge variant="outline">R$ 8.450</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Eventos</span>
                    <Badge variant="outline">R$ 3.590</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Serviços</span>
                    <Badge variant="outline">R$ 1.310</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <ActivityFeed />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Alertas Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {realTimeMetrics.overduePayments > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-700">
                        {realTimeMetrics.overduePayments} pagamento(s) atrasado(s)
                      </span>
                    </div>
                  )}
                  {realTimeMetrics.pendingTransactions > 3 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <Clock className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm text-yellow-700">
                        {realTimeMetrics.pendingTransactions} transação(ões) pendente(s)
                      </span>
                    </div>
                  )}
                  {realTimeMetrics.overduePayments === 0 && realTimeMetrics.pendingTransactions <= 3 && (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-700">
                        Todos os indicadores estão normais
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Próximas Ações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <Calendar className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Relatório mensal em 3 dias</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <Target className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Meta de faturamento 85% atingida</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                    <Building className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Revisar contratos de fornecedores</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialDashboard;
