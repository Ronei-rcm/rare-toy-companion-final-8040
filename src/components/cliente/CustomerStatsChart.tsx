import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatComparison {
  current: number;
  previous: number;
  label: string;
  format?: 'currency' | 'number' | 'percentage';
}

interface CustomerStatsChartProps {
  stats: {
    totalPedidos: number;
    pedidosPendentes: number;
    totalGasto: number;
    ticketMedio: number;
    pedidosUltimoMes?: number;
    gastoUltimoMes?: number;
  };
}

const CustomerStatsChart: React.FC<CustomerStatsChartProps> = ({ stats }) => {
  const formatValue = (value: number, format: string = 'number'): string => {
    if (format === 'currency') {
      return `R$ ${Number(value).toFixed(2)}`;
    }
    if (format === 'percentage') {
      return `${Number(value).toFixed(1)}%`;
    }
    return Number(value).toFixed(0);
  };

  const calculateTrend = (current: number, previous: number): { 
    value: number; 
    icon: React.ElementType; 
    color: string;
    label: string;
  } => {
    if (previous === 0) {
      return { value: 0, icon: Minus, color: 'text-gray-500', label: 'Sem comparação' };
    }
    
    const change = ((current - previous) / previous) * 100;
    
    if (change > 0) {
      return { 
        value: Math.abs(change), 
        icon: TrendingUp, 
        color: 'text-green-600', 
        label: 'Aumento' 
      };
    } else if (change < 0) {
      return { 
        value: Math.abs(change), 
        icon: TrendingDown, 
        color: 'text-red-600', 
        label: 'Queda' 
      };
    }
    
    return { value: 0, icon: Minus, color: 'text-gray-500', label: 'Sem mudança' };
  };

  const comparisons: StatComparison[] = [
    {
      current: stats.totalPedidos,
      previous: stats.pedidosUltimoMes || 0,
      label: 'Total de Pedidos',
      format: 'number'
    },
    {
      current: stats.totalGasto,
      previous: stats.gastoUltimoMes || 0,
      label: 'Total Gasto',
      format: 'currency'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {comparisons.map((comparison, index) => {
        const trend = calculateTrend(comparison.current, comparison.previous);
        const TrendIcon = trend.icon;
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {comparison.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold">
                    {formatValue(comparison.current, comparison.format)}
                  </p>
                  {comparison.previous > 0 && (
                    <div className={cn("flex items-center gap-1 mt-2", trend.color)}>
                      <TrendIcon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {formatValue(trend.value, 'percentage')} {trend.label}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1">
                        vs mês anterior
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CustomerStatsChart;

