import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  Clock,
  Target,
  Award,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ExecutiveKPIDashboardProps {
  transactions?: any[];
  summary?: any;
  onRefresh?: () => void;
  loading?: boolean;
}

export const ExecutiveKPIDashboard: React.FC<ExecutiveKPIDashboardProps> = ({
  transactions = [],
  summary = {},
  onRefresh,
  loading = false
}) => {
  const [todayData, setTodayData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    transactionCount: 0,
    avgTicket: 0
  });

  const [monthData, setMonthData] = useState({
    revenue: 0,
    expenses: 0,
    profit: 0,
    transactionCount: 0,
    avgTicket: 0
  });

  const [comparisonData, setComparisonData] = useState({
    revenueGrowth: 0,
    expensesGrowth: 0,
    profitGrowth: 0
  });

  useEffect(() => {
    calculateKPIs();
  }, [transactions]);

  const calculateKPIs = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    // KPIs do Dia
    const todayTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.data || t.date);
      transactionDate.setHours(0, 0, 0, 0);
      return transactionDate.getTime() === today.getTime();
    });

    const todayRevenue = todayTransactions
      .filter(t => t.tipo === 'entrada' || t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

    const todayExpenses = todayTransactions
      .filter(t => t.tipo === 'saida' || t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

    setTodayData({
      revenue: todayRevenue,
      expenses: todayExpenses,
      profit: todayRevenue - todayExpenses,
      transactionCount: todayTransactions.length,
      avgTicket: todayTransactions.length > 0 ? todayRevenue / todayTransactions.length : 0
    });

    // KPIs do Mês
    const monthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.data || t.date);
      return transactionDate >= startOfMonth;
    });

    const monthRevenue = monthTransactions
      .filter(t => t.tipo === 'entrada' || t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

    const monthExpenses = monthTransactions
      .filter(t => t.tipo === 'saida' || t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

    setMonthData({
      revenue: monthRevenue,
      expenses: monthExpenses,
      profit: monthRevenue - monthExpenses,
      transactionCount: monthTransactions.length,
      avgTicket: monthTransactions.length > 0 ? monthRevenue / monthTransactions.length : 0
    });

    // Comparação com mês anterior
    const lastMonthTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.data || t.date);
      return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
    });

    const lastMonthRevenue = lastMonthTransactions
      .filter(t => t.tipo === 'entrada' || t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter(t => t.tipo === 'saida' || t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.valor || t.amount) || 0), 0);

    const lastMonthProfit = lastMonthRevenue - lastMonthExpenses;

    setComparisonData({
      revenueGrowth: lastMonthRevenue > 0 ? ((monthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0,
      expensesGrowth: lastMonthExpenses > 0 ? ((monthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0,
      profitGrowth: lastMonthProfit !== 0 ? ((monthData.profit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const KPICard = ({ 
    title, 
    value, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue',
    badge 
  }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`border-l-4 border-l-${color}-500 hover:shadow-lg transition-all`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
            <div className={`p-2 bg-${color}-50 rounded-lg`}>
              <Icon className={`h-5 w-5 text-${color}-600`} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-3xl font-bold">{value}</p>
              {badge && (
                <Badge variant="outline" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            {trend && (
              <div className={`flex items-center text-sm ${
                trendValue >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {trendValue >= 0 ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
                <span className="font-medium">{trend}</span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-purple-600" />
            Dashboard Executivo
          </h2>
          <p className="text-muted-foreground">
            Acompanhamento em tempo real dos principais indicadores
          </p>
        </div>
        <Button onClick={onRefresh} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* KPIs do Dia */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Hoje</h3>
          <Badge variant="outline" className="ml-auto">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Receita do Dia"
            value={formatCurrency(todayData.revenue)}
            icon={TrendingUp}
            color="green"
            badge={`${todayData.transactionCount} transações`}
          />
          <KPICard
            title="Despesas do Dia"
            value={formatCurrency(todayData.expenses)}
            icon={TrendingDown}
            color="red"
          />
          <KPICard
            title="Lucro do Dia"
            value={formatCurrency(todayData.profit)}
            icon={DollarSign}
            color={todayData.profit >= 0 ? 'blue' : 'orange'}
          />
          <KPICard
            title="Ticket Médio"
            value={formatCurrency(todayData.avgTicket)}
            icon={Target}
            color="purple"
          />
        </div>
      </div>

      {/* KPIs do Mês */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Mês Atual</h3>
          <Badge variant="outline" className="ml-auto">
            {new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Receita do Mês"
            value={formatCurrency(monthData.revenue)}
            icon={TrendingUp}
            trend={formatPercent(comparisonData.revenueGrowth)}
            trendValue={comparisonData.revenueGrowth}
            color="green"
          />
          <KPICard
            title="Despesas do Mês"
            value={formatCurrency(monthData.expenses)}
            icon={TrendingDown}
            trend={formatPercent(comparisonData.expensesGrowth)}
            trendValue={comparisonData.expensesGrowth}
            color="red"
          />
          <KPICard
            title="Lucro do Mês"
            value={formatCurrency(monthData.profit)}
            icon={DollarSign}
            trend={formatPercent(comparisonData.profitGrowth)}
            trendValue={comparisonData.profitGrowth}
            color={monthData.profit >= 0 ? 'blue' : 'orange'}
          />
        </div>
      </div>

      {/* Alertas e Insights */}
      <Card className="border-orange-200 bg-orange-50/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <CardTitle className="text-lg">Alertas e Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {monthData.profit < 0 && (
            <div className="flex items-center gap-2 text-orange-700">
              <div className="w-2 h-2 bg-orange-600 rounded-full" />
              <p>Lucro negativo este mês. Revise suas despesas.</p>
            </div>
          )}
          {comparisonData.expensesGrowth > 20 && (
            <div className="flex items-center gap-2 text-orange-700">
              <div className="w-2 h-2 bg-orange-600 rounded-full" />
              <p>Despesas aumentaram {formatPercent(comparisonData.expensesGrowth)} em relação ao mês anterior.</p>
            </div>
          )}
          {comparisonData.revenueGrowth < -10 && (
            <div className="flex items-center gap-2 text-orange-700">
              <div className="w-2 h-2 bg-orange-600 rounded-full" />
              <p>Receita caiu {formatPercent(Math.abs(comparisonData.revenueGrowth))} este mês.</p>
            </div>
          )}
          {monthData.profit > 0 && comparisonData.profitGrowth > 10 && (
            <div className="flex items-center gap-2 text-green-700">
              <div className="w-2 h-2 bg-green-600 rounded-full" />
              <p>Excelente! Lucro cresceu {formatPercent(comparisonData.profitGrowth)} este mês! 🎉</p>
            </div>
          )}
          {todayData.transactionCount === 0 && (
            <div className="flex items-center gap-2 text-blue-700">
              <div className="w-2 h-2 bg-blue-600 rounded-full" />
              <p>Nenhuma transação registrada hoje. Mantenha seu registro atualizado.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ExecutiveKPIDashboard;

