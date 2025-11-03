import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  AlertTriangle,
  RefreshCw,
  Activity,
  Eye,
  Calendar,
  CreditCard
} from 'lucide-react';
import { useDashboardMetrics, useVendasData, useProdutosPopulares, usePedidosRecentes, useRefreshData } from '@/hooks/useAnalytics';
import VendasChart from './VendasChart';
import ProdutosPopulares from './ProdutosPopulares';
import PedidosRecentes from './PedidosRecentes';

const EnhancedDashboard = () => {
  const { metrics, loading: metricsLoading, error: metricsError } = useDashboardMetrics();
  const { vendas, loading: vendasLoading } = useVendasData();
  const { produtos, loading: produtosLoading } = useProdutosPopulares();
  const { pedidos, loading: pedidosLoading } = usePedidosRecentes();
  const { refreshing, refreshData } = useRefreshData();

  // Função para formatar valores
  const formatValue = (value: number, type: string) => {
    if (type === 'currency') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value);
    }
    return value.toLocaleString('pt-BR');
  };

  // Função para formatar variação percentual
  const formatVariation = (variation: number) => {
    const isPositive = variation >= 0;
    const icon = isPositive ? TrendingUp : TrendingDown;
    const color = isPositive ? 'text-green-600' : 'text-red-600';
    const bgColor = isPositive ? 'bg-green-50' : 'bg-red-50';
    
    return {
      icon,
      color,
      bgColor,
      text: `${variation >= 0 ? '+' : ''}${variation.toFixed(1)}%`
    };
  };

  // Componente de card de métrica
  const MetricCard = ({ 
    title, 
    value, 
    variation, 
    type, 
    icon: Icon, 
    isLoading = false 
  }: {
    title: string;
    value: number;
    variation: number;
    type: string;
    icon: React.ComponentType<any>;
    isLoading?: boolean;
  }) => {
    const variationData = formatVariation(variation);
    
    if (isLoading) {
      return (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold animate-pulse bg-gray-200 h-8 w-24 rounded"></div>
            <div className="text-xs text-muted-foreground mt-1 animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatValue(value, type)}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${variationData.color}`}>
            <variationData.icon className="h-3 w-3" />
            {variationData.text} em relação a ontem
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header com botão de refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio em tempo real</p>
        </div>
        <Button 
          onClick={refreshData} 
          disabled={refreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Atualizando...' : 'Atualizar'}
        </Button>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Vendas de Hoje"
          value={metrics?.vendas?.hoje || 0}
          variation={metrics?.vendas?.variacao || 0}
          type={metrics?.vendas?.formato || 'currency'}
          icon={DollarSign}
          isLoading={metricsLoading}
        />
        
        <MetricCard
          title="Novos Clientes"
          value={metrics?.clientes?.hoje || 0}
          variation={metrics?.clientes?.variacao || 0}
          type={metrics?.clientes?.formato || 'number'}
          icon={Users}
          isLoading={metricsLoading}
        />
        
        <MetricCard
          title="Pedidos"
          value={metrics?.pedidos?.hoje || 0}
          variation={metrics?.pedidos?.variacao || 0}
          type={metrics?.pedidos?.formato || 'number'}
          icon={ShoppingCart}
          isLoading={metricsLoading}
        />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos com Baixo Estoque</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsLoading ? (
                <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
              ) : (
                metrics?.estoque?.baixo || 0
              )}
            </div>
            <p className="text-xs text-destructive mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Requer atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de gráficos e análises */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de vendas */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Visão Geral de Vendas (Últimos 30 dias)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {vendasLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <VendasChart />
            )}
          </CardContent>
        </Card>
        
        {/* Produtos populares */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Produtos Mais Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {produtosLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
                    <div className="flex-1">
                      <div className="animate-pulse bg-gray-200 h-4 w-24 rounded mb-1"></div>
                      <div className="animate-pulse bg-gray-200 h-3 w-16 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ProdutosPopulares />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pedidos recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Pedidos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pedidosLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="animate-pulse bg-gray-200 h-10 w-10 rounded"></div>
                    <div>
                      <div className="animate-pulse bg-gray-200 h-4 w-32 rounded mb-2"></div>
                      <div className="animate-pulse bg-gray-200 h-3 w-24 rounded"></div>
                    </div>
                  </div>
                  <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <PedidosRecentes />
          )}
        </CardContent>
      </Card>

      {/* Status de erro */}
      {metricsError && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Erro ao carregar métricas: {metricsError}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedDashboard;
