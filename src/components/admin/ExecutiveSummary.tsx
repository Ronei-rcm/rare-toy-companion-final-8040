import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ExecutiveSummaryProps {
  revenue: number;
  expenses: number;
  profit: number;
  revenueGrowth: number;
  expenseGrowth: number;
  profitGrowth: number;
  pendingPayments?: number;
  overduePayments?: number;
  periodLabel?: string;
}

export const ExecutiveSummary = ({
  revenue,
  expenses,
  profit,
  revenueGrowth,
  expenseGrowth,
  profitGrowth,
  pendingPayments = 0,
  overduePayments = 0,
  periodLabel = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR })
}: ExecutiveSummaryProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 border-indigo-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Resumo Executivo</h2>
            <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
              <Calendar className="h-3 w-3" />
              {periodLabel}
            </p>
          </div>
          {profit > 0 ? (
            <Badge className="bg-green-500 hover:bg-green-600 text-white px-3 py-1">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Lucro Positivo
            </Badge>
          ) : (
            <Badge variant="destructive" className="px-3 py-1">
              <AlertCircle className="h-3 w-3 mr-1" />
              Atenção Necessária
            </Badge>
          )}
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Receita */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Receita</span>
              <DollarSign className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(revenue)}
            </div>
            <div className={`flex items-center text-sm ${revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(revenueGrowth)} vs período anterior
            </div>
          </div>

          {/* Despesas */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Despesas</span>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatCurrency(expenses)}
            </div>
            <div className={`flex items-center text-sm ${expenseGrowth <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {expenseGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {formatPercentage(expenseGrowth)} vs período anterior
            </div>
          </div>

          {/* Lucro */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Lucro Líquido</span>
              <Target className="h-4 w-4 text-blue-600" />
            </div>
            <div className={`text-2xl font-bold mb-1 ${profit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-sm ${profitGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(profitGrowth)} vs anterior
              </span>
              <span className="text-xs text-gray-500">
                Margem: {profitMargin}%
              </span>
            </div>
          </div>
        </div>

        {/* Alertas e Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Contas Pendentes */}
          {pendingPayments > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-900">
                  {pendingPayments} conta{pendingPayments !== 1 ? 's' : ''} pendente{pendingPayments !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-yellow-700">Programadas para este período</p>
              </div>
            </div>
          )}

          {/* Contas Vencidas */}
          {overduePayments > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-900">
                  {overduePayments} conta{overduePayments !== 1 ? 's' : ''} vencida{overduePayments !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-700">Requer atenção imediata</p>
              </div>
            </div>
          )}

          {/* Saúde Financeira */}
          {pendingPayments === 0 && overduePayments === 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-3 md:col-span-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-900">Situação Financeira Saudável</p>
                <p className="text-xs text-green-700">Nenhuma pendência financeira no momento</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

