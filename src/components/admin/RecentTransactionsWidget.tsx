import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreHorizontal,
  TrendingUp,
  Clock
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Transaction {
  id: string;
  type: 'receita' | 'despesa';
  description: string;
  amount: number;
  category?: string;
  date: string;
  status?: 'concluida' | 'pendente' | 'agendada';
  paymentMethod?: string;
}

interface RecentTransactionsWidgetProps {
  transactions: Transaction[];
  limit?: number;
  onViewAll?: () => void;
  onViewTransaction?: (transaction: Transaction) => void;
}

export const RecentTransactionsWidget = ({
  transactions,
  limit = 5,
  onViewAll,
  onViewTransaction
}: RecentTransactionsWidgetProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const recentTransactions = transactions
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'concluida':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">Concluída</Badge>;
      case 'pendente':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">Pendente</Badge>;
      case 'agendada':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">Agendada</Badge>;
      default:
        return null;
    }
  };

  const getTotalToday = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTransactions = transactions.filter(t => 
      format(new Date(t.date), 'yyyy-MM-dd') === today
    );
    
    const todayRevenue = todayTransactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const todayExpenses = todayTransactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0);

    return { revenue: todayRevenue, expenses: todayExpenses, count: todayTransactions.length };
  };

  const todayStats = getTotalToday();

  if (recentTransactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Últimas Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">Nenhuma transação registrada ainda</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Últimas Movimentações
          </CardTitle>
          {onViewAll && (
            <Button variant="ghost" size="sm" onClick={onViewAll}>
              Ver todas
            </Button>
          )}
        </div>
        
        {/* Stats do Dia */}
        {todayStats.count > 0 && (
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
            <div className="bg-green-50 rounded-lg p-2">
              <p className="text-xs text-green-700 font-medium">Receita Hoje</p>
              <p className="text-sm font-bold text-green-900">{formatCurrency(todayStats.revenue)}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-2">
              <p className="text-xs text-red-700 font-medium">Despesa Hoje</p>
              <p className="text-sm font-bold text-red-900">{formatCurrency(todayStats.expenses)}</p>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => onViewTransaction?.(transaction)}
              >
                <div className="flex items-center gap-3 flex-1">
                  {/* Ícone */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'receita' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {transaction.type === 'receita' ? (
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownRight className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  {/* Detalhes */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {transaction.description}
                      </p>
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{format(new Date(transaction.date), "dd MMM", { locale: ptBR })}</span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span className="truncate">{transaction.category}</span>
                        </>
                      )}
                      {transaction.paymentMethod && (
                        <>
                          <span>•</span>
                          <span className="truncate">{transaction.paymentMethod}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Valor */}
                <div className="text-right ml-3">
                  <p className={`text-sm font-bold ${
                    transaction.type === 'receita' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {transaction.type === 'receita' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Resumo no rodapé */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              Mostrando {recentTransactions.length} de {transactions.length} transações
            </span>
            {transactions.length > limit && onViewAll && (
              <Button variant="link" size="sm" onClick={onViewAll} className="text-blue-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                Ver histórico completo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

