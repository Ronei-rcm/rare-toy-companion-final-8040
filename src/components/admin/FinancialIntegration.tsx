import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  RefreshCw, 
  ShoppingCart, 
  Calendar, 
  Building, 
  Users,
  Link,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface FinancialIntegrationProps {
  orders: any[];
  events: any[];
  suppliers: any[];
  onRefresh: () => void;
  loading: boolean;
}

const FinancialIntegration: React.FC<FinancialIntegrationProps> = ({
  orders,
  events,
  suppliers,
  onRefresh,
  loading
}) => {
  // Estatísticas de integração
  const integrationStats = {
    orders: {
      total: orders.length,
      paid: orders.filter(order => order.payment_status === 'paid').length,
      pending: orders.filter(order => order.payment_status === 'pending').length,
      revenue: orders
        .filter(order => order.payment_status === 'paid')
        .reduce((sum, order) => sum + order.total, 0)
    },
    events: {
      total: events.length,
      completed: events.filter(event => event.revenue && event.revenue > 0).length,
      upcoming: events.filter(event => new Date(event.data_evento) > new Date()).length,
      revenue: events.reduce((sum, event) => sum + (event.revenue || 0), 0)
    },
    suppliers: {
      total: suppliers.length,
      active: suppliers.length, // Assumindo que todos estão ativos
      totalExpenses: suppliers.reduce((sum, supplier) => sum + supplier.total_expenses, 0)
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="h-5 w-5" />
            Integração com Módulos
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardTitle>
        <CardDescription>
          Dados sincronizados automaticamente dos módulos Clientes, Carrinho, Fornecedores e Eventos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Módulo Pedidos */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <ShoppingCart className="h-4 w-4" />
                Pedidos/Vendas
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total de Pedidos:</span>
                  <Badge variant="secondary">{integrationStats.orders.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pagos:</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {integrationStats.orders.paid}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Pendentes:</span>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    {integrationStats.orders.pending}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Faturamento:</span>
                  <span className="text-sm font-bold text-green-600">
                    R$ {integrationStats.orders.revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Eventos */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Eventos
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total de Eventos:</span>
                  <Badge variant="secondary">{integrationStats.events.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Realizados:</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {integrationStats.events.completed}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Próximos:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    <Calendar className="h-3 w-3 mr-1" />
                    {integrationStats.events.upcoming}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Receita:</span>
                  <span className="text-sm font-bold text-green-600">
                    R$ {integrationStats.events.revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Módulo Fornecedores */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building className="h-4 w-4" />
                Fornecedores
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Total de Fornecedores:</span>
                  <Badge variant="secondary">{integrationStats.suppliers.total}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Ativos:</span>
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {integrationStats.suppliers.active}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Despesas:</span>
                  <span className="text-sm font-bold text-red-600">
                    R$ {integrationStats.suppliers.totalExpenses.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Média por Fornecedor:</span>
                  <span className="text-xs text-muted-foreground">
                    R$ {(integrationStats.suppliers.totalExpenses / integrationStats.suppliers.total).toLocaleString('pt-BR')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status de Sincronização */}
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Sincronização automática ativa - Dados atualizados em tempo real
            </span>
          </div>
          <p className="text-xs text-green-600 mt-1">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialIntegration;
