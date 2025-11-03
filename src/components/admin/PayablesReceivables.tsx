import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar,
  DollarSign,
  ArrowDownRight,
  ArrowUpRight
} from "lucide-react";
import { format, differenceInDays, isPast, isToday, isTomorrow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PaymentItem {
  id: string;
  type: 'pagar' | 'receber';
  description: string;
  amount: number;
  dueDate: string;
  status: 'pendente' | 'pago' | 'vencido' | 'agendado';
  supplier?: string;
  customer?: string;
  category?: string;
}

interface PayablesReceivablesProps {
  items: PaymentItem[];
  onMarkAsPaid?: (id: string) => void;
  onViewDetails?: (item: PaymentItem) => void;
}

export const PayablesReceivables = ({
  items,
  onMarkAsPaid,
  onViewDetails
}: PayablesReceivablesProps) => {
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getUrgencyBadge = (dueDate: string, status: string) => {
    if (status === 'pago') {
      return <Badge className="bg-green-100 text-green-800 text-xs">Pago</Badge>;
    }

    const date = new Date(dueDate);
    const daysUntilDue = differenceInDays(date, new Date());

    if (isPast(date) && !isToday(date)) {
      return <Badge variant="destructive" className="text-xs">Vencido</Badge>;
    }

    if (isToday(date)) {
      return <Badge className="bg-orange-100 text-orange-800 text-xs">Vence Hoje</Badge>;
    }

    if (isTomorrow(date)) {
      return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Vence Amanhã</Badge>;
    }

    if (daysUntilDue <= 7) {
      return <Badge variant="secondary" className="text-xs">Próximo</Badge>;
    }

    return <Badge variant="outline" className="text-xs">Agendado</Badge>;
  };

  const getDueDateLabel = (dueDate: string) => {
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return 'Hoje';
    }

    if (isTomorrow(date)) {
      return 'Amanhã';
    }

    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };

  // Separar em pagar e receber
  const payables = items.filter(item => item.type === 'pagar' && item.status !== 'pago');
  const receivables = items.filter(item => item.type === 'receber' && item.status !== 'pago');

  // Ordenar por data de vencimento
  const sortedPayables = payables.sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );
  
  const sortedReceivables = receivables.sort((a, b) => 
    new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
  );

  // Calcular totais
  const totalPayables = payables.reduce((sum, item) => sum + item.amount, 0);
  const totalReceivables = receivables.reduce((sum, item) => sum + item.amount, 0);
  const overduePayables = payables.filter(item => isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate))).length;
  const overdueReceivables = receivables.filter(item => isPast(new Date(item.dueDate)) && !isToday(new Date(item.dueDate))).length;

  const renderItem = (item: PaymentItem) => (
    <div
      key={item.id}
      className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Ícone */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          item.type === 'receber' 
            ? 'bg-green-100' 
            : 'bg-red-100'
        }`}>
          {item.type === 'receber' ? (
            <ArrowUpRight className="h-4 w-4 text-green-600" />
          ) : (
            <ArrowDownRight className="h-4 w-4 text-red-600" />
          )}
        </div>

        {/* Detalhes */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {item.description}
            </p>
            {getUrgencyBadge(item.dueDate, item.status)}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            <span>{getDueDateLabel(item.dueDate)}</span>
            {(item.supplier || item.customer) && (
              <>
                <span>•</span>
                <span className="truncate">{item.supplier || item.customer}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Valor e Ações */}
      <div className="flex items-center gap-3 ml-3">
        <p className={`text-sm font-bold ${
          item.type === 'receber' 
            ? 'text-green-600' 
            : 'text-red-600'
        }`}>
          {formatCurrency(item.amount)}
        </p>
        {onMarkAsPaid && item.status !== 'pago' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onMarkAsPaid(item.id)}
            className="text-xs"
          >
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Pagar
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Contas a Pagar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowDownRight className="h-5 w-5 text-red-600" />
            Contas a Pagar
          </CardTitle>
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <div>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(totalPayables)}</p>
              <p className="text-xs text-gray-500">{payables.length} conta{payables.length !== 1 ? 's' : ''} pendente{payables.length !== 1 ? 's' : ''}</p>
            </div>
            {overduePayables > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {overduePayables} vencida{overduePayables !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedPayables.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {sortedPayables.map(renderItem)}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p className="text-sm">Nenhuma conta a pagar pendente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contas a Receber */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-green-600" />
            Contas a Receber
          </CardTitle>
          <div className="flex items-center justify-between mt-2 pt-2 border-t">
            <div>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalReceivables)}</p>
              <p className="text-xs text-gray-500">{receivables.length} conta{receivables.length !== 1 ? 's' : ''} pendente{receivables.length !== 1 ? 's' : ''}</p>
            </div>
            {overdueReceivables > 0 && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                {overdueReceivables} vencida{overdueReceivables !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {sortedReceivables.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-2">
                {sortedReceivables.map(renderItem)}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Nenhuma conta a receber pendente</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

