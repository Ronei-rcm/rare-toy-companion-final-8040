import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  ArrowRight
} from 'lucide-react';

interface InteractiveComparisonChartsProps {
  transactions?: any[];
  onRefresh?: () => void;
  loading?: boolean;
}

export const InteractiveComparisonCharts: React.FC<InteractiveComparisonChartsProps> = ({
  transactions = [],
  onRefresh,
  loading = false
}) => {
  const [viewMode, setViewMode] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [comparisonData, setComparisonData] = useState<any[]>([]);

  useEffect(() => {
    calculateComparisonData();
  }, [transactions, viewMode]);

  const calculateComparisonData = () => {
    const data = [];
    const today = new Date();
    
    if (viewMode === 'monthly') {
      // Últimos 12 meses
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
        
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.data || t.date);
          return tDate >= monthDate && tDate < nextMonth;
        });

        const revenue = monthTransactions
          .filter(t => t.tipo === 'entrada' || t.type === 'income')
          .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

        const expenses = monthTransactions
          .filter(t => t.tipo === 'saida' || t.type === 'expense')
          .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

        data.push({
          period: monthDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
    } else if (viewMode === 'quarterly') {
      // Últimos 4 trimestres
      for (let i = 3; i >= 0; i--) {
        const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - (i * 3), 1);
        const quarterEnd = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3 - (i * 3) + 3, 1);
        
        const quarterTransactions = transactions.filter(t => {
          const tDate = new Date(t.data || t.date);
          return tDate >= quarterStart && tDate < quarterEnd;
        });

        const revenue = quarterTransactions
          .filter(t => t.tipo === 'entrada' || t.type === 'income')
          .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

        const expenses = quarterTransactions
          .filter(t => t.tipo === 'saida' || t.type === 'expense')
          .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

        data.push({
          period: `Q${Math.floor(quarterStart.getMonth() / 3) + 1} ${quarterStart.getFullYear()}`,
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
    } else {
      // Últimos 3 anos
      for (let i = 2; i >= 0; i--) {
        const year = today.getFullYear() - i;
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year + 1, 0, 1);
        
        const yearTransactions = transactions.filter(t => {
          const tDate = new Date(t.data || t.date);
          return tDate >= yearStart && tDate < yearEnd;
        });

        const revenue = yearTransactions
          .filter(t => t.tipo === 'entrada' || t.type === 'income')
          .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

        const expenses = yearTransactions
          .filter(t => t.tipo === 'saida' || t.type === 'expense')
          .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

        data.push({
          period: year.toString(),
          revenue,
          expenses,
          profit: revenue - expenses
        });
      }
    }

    setComparisonData(data);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const getMaxValue = () => {
    const allValues = comparisonData.flatMap(d => [d.revenue, d.expenses, Math.abs(d.profit)]);
    return Math.max(...allValues, 1);
  };

  const maxValue = getMaxValue();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-purple-600" />
            Análise Comparativa
          </h2>
          <p className="text-muted-foreground">
            Compare receitas, despesas e lucros ao longo do tempo
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Seletor de Período */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'monthly' ? 'default' : 'outline'}
          onClick={() => setViewMode('monthly')}
        >
          Mensal
        </Button>
        <Button
          variant={viewMode === 'quarterly' ? 'default' : 'outline'}
          onClick={() => setViewMode('quarterly')}
        >
          Trimestral
        </Button>
        <Button
          variant={viewMode === 'yearly' ? 'default' : 'outline'}
          onClick={() => setViewMode('yearly')}
        >
          Anual
        </Button>
      </div>

      {/* Gráfico de Barras Comparativo */}
      <Card>
        <CardHeader>
          <CardTitle>Comparativo de Receitas vs Despesas</CardTitle>
          <CardDescription>
            Visualização {viewMode === 'monthly' ? 'mensal' : viewMode === 'quarterly' ? 'trimestral' : 'anual'} dos últimos períodos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {comparisonData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm font-medium">
                  <span>{item.period}</span>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">
                      Receita: {formatCurrency(item.revenue)}
                    </span>
                    <span className="text-red-600">
                      Despesas: {formatCurrency(item.expenses)}
                    </span>
                    <span className={item.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}>
                      Lucro: {formatCurrency(item.profit)}
                    </span>
                  </div>
                </div>
                
                <div className="relative h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {/* Barra de Receita */}
                  <div
                    className="absolute left-0 top-0 h-full bg-green-500 opacity-70 transition-all"
                    style={{ width: `${(item.revenue / maxValue) * 100}%` }}
                  />
                  
                  {/* Barra de Despesas */}
                  <div
                    className="absolute left-0 bottom-0 h-1/2 bg-red-500 opacity-70 transition-all"
                    style={{ width: `${(item.expenses / maxValue) * 100}%` }}
                  />
                  
                  {/* Indicador de Lucro/Prejuízo */}
                  {item.profit >= 0 ? (
                    <div
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      title="Lucro"
                    >
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div
                      className="absolute right-2 top-1/2 transform -translate-y-1/2"
                      title="Prejuízo"
                    >
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded" />
              <span className="text-sm">Receitas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span className="text-sm">Despesas</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Lucro</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-orange-600" />
              <span className="text-sm">Prejuízo</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Tendências */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {comparisonData.length >= 2 && (
          <>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Tendência de Receita</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const lastPeriod = comparisonData[comparisonData.length - 1]?.revenue || 0;
                  const previousPeriod = comparisonData[comparisonData.length - 2]?.revenue || 0;
                  const growth = previousPeriod > 0 ? ((lastPeriod - previousPeriod) / previousPeriod) * 100 : 0;
                  return (
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</p>
                      {growth >= 0 ? (
                        <TrendingUp className="h-8 w-8 text-green-600" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-red-600" />
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Tendência de Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const lastPeriod = comparisonData[comparisonData.length - 1]?.expenses || 0;
                  const previousPeriod = comparisonData[comparisonData.length - 2]?.expenses || 0;
                  const growth = previousPeriod > 0 ? ((lastPeriod - previousPeriod) / previousPeriod) * 100 : 0;
                  return (
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</p>
                      {growth >= 0 ? (
                        <TrendingUp className="h-8 w-8 text-red-600" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-green-600" />
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Tendência de Lucro</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const lastPeriod = comparisonData[comparisonData.length - 1]?.profit || 0;
                  const previousPeriod = comparisonData[comparisonData.length - 2]?.profit || 0;
                  const growth = previousPeriod !== 0 ? ((lastPeriod - previousPeriod) / Math.abs(previousPeriod)) * 100 : 0;
                  return (
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold">{growth >= 0 ? '+' : ''}{growth.toFixed(1)}%</p>
                      {growth >= 0 ? (
                        <TrendingUp className="h-8 w-8 text-blue-600" />
                      ) : (
                        <TrendingDown className="h-8 w-8 text-orange-600" />
                      )}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Tabela Comparativa Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Dados Detalhados</CardTitle>
          <CardDescription>
            Comparação período a período
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-semibold">Período</th>
                  <th className="text-right p-2 font-semibold text-green-600">Receitas</th>
                  <th className="text-right p-2 font-semibold text-red-600">Despesas</th>
                  <th className="text-right p-2 font-semibold text-blue-600">Lucro</th>
                  <th className="text-right p-2 font-semibold">Margem</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((item, index) => {
                  const margin = item.revenue > 0 ? (item.profit / item.revenue) * 100 : 0;
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2">{item.period}</td>
                      <td className="p-2 text-right font-medium text-green-600">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="p-2 text-right font-medium text-red-600">
                        {formatCurrency(item.expenses)}
                      </td>
                      <td className={`p-2 text-right font-medium ${item.profit >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className={`p-2 text-right font-medium ${margin >= 20 ? 'text-green-600' : margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-gray-50 font-bold">
                <tr>
                  <td className="p-2">TOTAL</td>
                  <td className="p-2 text-right text-green-600">
                    {formatCurrency(comparisonData.reduce((sum, d) => sum + d.revenue, 0))}
                  </td>
                  <td className="p-2 text-right text-red-600">
                    {formatCurrency(comparisonData.reduce((sum, d) => sum + d.expenses, 0))}
                  </td>
                  <td className={`p-2 text-right ${comparisonData.reduce((sum, d) => sum + d.profit, 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(comparisonData.reduce((sum, d) => sum + d.profit, 0))}
                  </td>
                  <td className="p-2 text-right">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InteractiveComparisonCharts;

