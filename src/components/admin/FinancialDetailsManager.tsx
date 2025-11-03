import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Calendar,
  Building,
  ShoppingCart,
  Target,
  BarChart,
  BarChart,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialDetailsManagerProps {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    projectedBalance: number;
    revenueGrowth: number;
    expenseGrowth: number;
  };
  transactions: any[];
  orders: any[];
  suppliers: any[];
  events: any[];
  onRefresh: () => void;
  onEditTransaction?: (transaction: any) => void;
  onDeleteTransaction?: (id: string) => void;
  onAddTransaction?: () => void;
}

export const FinancialDetailsManager: React.FC<FinancialDetailsManagerProps> = ({
  summary,
  transactions,
  orders,
  suppliers,
  events,
  onRefresh,
  onEditTransaction,
  onDeleteTransaction,
  onAddTransaction
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.origem.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
                         (filterType === 'entrada' && transaction.tipo === 'Entrada') ||
                         (filterType === 'saida' && transaction.tipo === 'Saída');
    
    return matchesSearch && matchesFilter;
  });

  // Calcular estatísticas
  const stats = {
    totalTransactions: transactions.length,
    totalRevenue: summary.totalRevenue,
    totalExpenses: summary.totalExpenses,
    netProfit: summary.netProfit,
    averageTransaction: transactions.length > 0 ? (summary.totalRevenue + summary.totalExpenses) / transactions.length : 0,
    pendingTransactions: transactions.filter(t => t.status === 'Pendente').length,
    overdueTransactions: transactions.filter(t => t.status === 'Atrasado').length
  };

  const handleEdit = (transaction: any) => {
    setSelectedTransaction(transaction);
    onEditTransaction?.(transaction);
  };

  const handleDelete = (transaction: any) => {
    setSelectedTransaction(transaction);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedTransaction) return;
    
    setLoading(true);
    try {
      await onDeleteTransaction?.(selectedTransaction.id);
      toast.success('Transação excluída com sucesso!');
      setShowDeleteDialog(false);
      setSelectedTransaction(null);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir transação');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago': return 'bg-green-100 text-green-800';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800';
      case 'Atrasado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (tipo: string) => {
    return tipo === 'Entrada' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalRevenue)}
            </div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {summary.revenueGrowth > 0 ? '+' : ''}{summary.revenueGrowth.toFixed(1)}% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalExpenses)}
            </div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              {summary.expenseGrowth > 0 ? '+' : ''}{summary.expenseGrowth.toFixed(1)}% vs período anterior
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.netProfit)}
            </div>
            <div className="text-xs text-gray-600">
              Margem: {stats.totalRevenue > 0 ? ((stats.netProfit / stats.totalRevenue) * 100).toFixed(1) : 0}%
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço Projetado</CardTitle>
            <BarChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.projectedBalance)}
            </div>
            <div className="text-xs text-orange-600">
              Projeção baseada em dados reais
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de Filtro e Busca */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="text-lg">Gestão Financeira Detalhada</CardTitle>
              <CardDescription>
                Visualize, edite e gerencie todas as transações financeiras
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button onClick={onAddTransaction} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Buscar transações</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Buscar por descrição, categoria ou origem..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="filter">Filtrar por tipo</Label>
              <select
                id="filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">Todas as transações</option>
                <option value="entrada">Apenas entradas</option>
                <option value="saida">Apenas saídas</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Gestão */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="transactions">💰 Transações</TabsTrigger>
          <TabsTrigger value="sources">🔗 Fontes</TabsTrigger>
          <TabsTrigger value="analytics">📈 Análises</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BarChart className="h-4 w-4" />
                  Resumo de Transações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de transações:</span>
                  <span className="font-semibold">{stats.totalTransactions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valor médio:</span>
                  <span className="font-semibold">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.averageTransaction)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pendentes:</span>
                  <Badge variant="secondary">{stats.pendingTransactions}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Atrasadas:</span>
                  <Badge variant="destructive">{stats.overdueTransactions}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de pedidos:</span>
                  <span className="font-semibold">{orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pedidos pagos:</span>
                  <span className="font-semibold text-green-600">
                    {orders.filter(o => o.payment_status === 'paid').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Pedidos pendentes:</span>
                  <span className="font-semibold text-yellow-600">
                    {orders.filter(o => o.payment_status === 'pending').length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Fornecedores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total de fornecedores:</span>
                  <span className="font-semibold">{suppliers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Com saldo devedor:</span>
                  <span className="font-semibold text-red-600">
                    {suppliers.filter(s => (s.saldo_devedor || 0) > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Ativos:</span>
                  <span className="font-semibold text-green-600">
                    {suppliers.filter(s => s.status === 'ativo').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Transações</CardTitle>
              <CardDescription>
                {filteredTransactions.length} transação(ões) encontrada(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.data), 'dd/MM/yyyy', { locale: ptBR })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.descricao}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.tipo)}
                            {transaction.tipo}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(transaction.valor)}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(transaction)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(transaction)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Receitas de Pedidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {orders.map((order) => (
                    <div key={order.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">Pedido #{order.id.slice(-8)}</p>
                        <p className="text-sm text-gray-600">{order.customer_name || 'Cliente'}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total)}
                        </p>
                        <Badge className={getStatusColor(order.payment_status === 'paid' ? 'Pago' : 'Pendente')}>
                          {order.payment_status === 'paid' ? 'Pago' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Despesas de Fornecedores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <p className="font-medium">{supplier.name}</p>
                        <p className="text-sm text-gray-600">Fornecedor</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(supplier.total_expenses || 0)}
                        </p>
                        <Badge variant="outline">{supplier.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análises Financeiras</CardTitle>
              <CardDescription>
                Insights e tendências dos seus dados financeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold">Distribuição por Categoria</h4>
                  {Object.entries(
                    transactions.reduce((acc, t) => {
                      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([categoria, valor]) => (
                    <div key={categoria} className="flex justify-between">
                      <span className="text-sm">{categoria}</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Status das Transações</h4>
                  {Object.entries(
                    transactions.reduce((acc, t) => {
                      acc[t.status] = (acc[t.status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <div key={status} className="flex justify-between">
                      <span className="text-sm">{status}</span>
                      <Badge variant="outline">{count}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja excluir esta transação?
            </p>
            {selectedTransaction && (
              <div className="bg-gray-50 p-3 rounded">
                <p className="font-medium">{selectedTransaction.descricao}</p>
                <p className="text-sm text-gray-600">
                  {selectedTransaction.tipo} - {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedTransaction.valor)}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
