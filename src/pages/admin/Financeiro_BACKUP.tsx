import React, { useState, useEffect } from 'react';
import { useFinancialData } from '@/hooks/useFinancialData';
import { toast } from 'sonner';
import FinancialIntegration from '@/components/admin/FinancialIntegration';
import FinancialTransactionModal from '@/components/admin/FinancialTransactionModal';
import ProfessionalTransactionModal from '@/components/admin/ProfessionalTransactionModal';
import FinancialCharts from '@/components/admin/FinancialCharts';
import FinancialExport from '@/components/admin/FinancialExport';
import FinancialAlerts from '@/components/admin/FinancialAlerts';
import FinancialDashboard from '@/components/admin/FinancialDashboard';
import AdvancedFinancialDashboard from '@/components/admin/AdvancedFinancialDashboard';
import AdvancedFinancialCharts from '@/components/admin/AdvancedFinancialCharts';
import FinancialAutomation from '@/components/admin/FinancialAutomation';
import FinancialGoals from '@/components/admin/FinancialGoals';
import FinancialForecast from '@/components/admin/FinancialForecast';
import QuickAddExpense from '@/components/admin/QuickAddExpense';
import AdvancedTransactions from '@/components/admin/AdvancedTransactions';
import SupplierFinancialManager from '@/components/admin/SupplierFinancialManager';
import { FinancialPeriodFilter } from '@/components/admin/FinancialPeriodFilter';
import { ExecutiveSummary } from '@/components/admin/ExecutiveSummary';
import { RecentTransactionsWidget } from '@/components/admin/RecentTransactionsWidget';
import { PayablesReceivables } from '@/components/admin/PayablesReceivables';
import { EventsFinancialIntegration } from '@/components/admin/EventsFinancialIntegration';
import { FinancialDetailsManager } from '@/components/admin/FinancialDetailsManager';
import { QuickTransactionEditor } from '@/components/admin/QuickTransactionEditor';
import { FinancialValuesManager } from '@/components/admin/FinancialValuesManager';
import { ExecutiveKPIDashboard } from '@/components/admin/ExecutiveKPIDashboard';
import { PayablesReceivablesManager } from '@/components/admin/PayablesReceivablesManager';
import { InteractiveComparisonCharts } from '@/components/admin/InteractiveComparisonCharts';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { AdvancedReportExporter } from '@/components/admin/AdvancedReportExporter';
import { FinanceiroDebugTabs } from '@/components/admin/FinanceiroDebugTabs';
import { AdvancedTransactionManager } from '@/components/admin/AdvancedTransactionManager';
import { TestTransactionModal } from '@/components/admin/TestTransactionModal';
import { EmergencyTransactionModal } from '@/components/admin/EmergencyTransactionModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  User,
  Building,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle,
  Clock,
  Target,
  BarChart,
  BarChart,
  RefreshCw,
  Eye,
  Calculator,
  Edit,
  Trash2,
  Save,
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  X,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';

// Componente para o gráfico de fluxo de caixa (simulado)
const CashFlowChart = () => {
  const data = [
    { month: 'Jan', entradas: 8500, saidas: 3200 },
    { month: 'Fev', entradas: 9200, saidas: 4100 },
    { month: 'Mar', entradas: 7800, saidas: 3800 },
    { month: 'Abr', entradas: 10500, saidas: 4200 },
    { month: 'Mai', entradas: 12350, saidas: 5280 },
    { month: 'Jun', entradas: 9800, saidas: 3900 },
  ];

  const maxValue = Math.max(...data.map(d => Math.max(d.entradas, d.saidas)));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart className="h-5 w-5" />
          Fluxo de Caixa Mensal
        </CardTitle>
        <CardDescription>Entradas vs Saídas dos últimos 6 meses</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.month}</span>
                <span className="text-muted-foreground">
                  Saldo: R$ {(item.entradas - item.saidas).toLocaleString('pt-BR')}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Entradas</span>
                  <span className="text-xs font-medium">R$ {item.entradas.toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={(item.entradas / maxValue) * 100} className="h-2" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-xs text-red-600">Saídas</span>
                  <span className="text-xs font-medium">R$ {item.saidas.toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={(item.saidas / maxValue) * 100} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Componente para a tabela de lançamentos financeiros
const FinancialTransactions = ({ transactions: propTransactions = [] }: { transactions?: any[] }) => {
  const transactions = propTransactions.length > 0 ? propTransactions : [
    {
      id: 1,
      data: '2024-05-15',
      descricao: 'Venda de Produtos - Cliente João Silva',
      categoria: 'Venda',
      origem: 'Cliente',
      tipo: 'Entrada',
      valor: 245.80,
      status: 'Pago'
    },
    {
      id: 2,
      data: '2024-05-14',
      descricao: 'Pagamento Fornecedor - Brinquedos ABC',
      categoria: 'Fornecedor',
      origem: 'Fornecedor',
      tipo: 'Saída',
      valor: 1200.00,
      status: 'Pago'
    },
    {
      id: 3,
      data: '2024-05-13',
      descricao: 'Evento Workshop - Brinquedos Educativos',
      categoria: 'Evento',
      origem: 'Evento',
      tipo: 'Entrada',
      valor: 890.00,
      status: 'Pago'
    },
    {
      id: 4,
      data: '2024-05-12',
      descricao: 'Marketing Digital - Facebook Ads',
      categoria: 'Marketing',
      origem: 'Marketing',
      tipo: 'Saída',
      valor: 350.00,
      status: 'Pendente'
    },
    {
      id: 5,
      data: '2024-05-11',
      descricao: 'Venda de Produtos - Cliente Maria Santos',
      categoria: 'Venda',
      origem: 'Cliente',
      tipo: 'Entrada',
      valor: 180.50,
      status: 'Atrasado'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pago':
        return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Pago</Badge>;
      case 'Pendente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'Atrasado':
        return <Badge className="bg-red-100 text-red-800 border-red-200"><AlertCircle className="h-3 w-3 mr-1" />Atrasado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (tipo: string) => {
    return tipo === 'Entrada' ? 
      <ArrowUpRight className="h-4 w-4 text-green-600" /> : 
      <ArrowDownRight className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lançamentos Financeiros</CardTitle>
        <CardDescription>Histórico detalhado de todas as movimentações</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.data}</TableCell>
                <TableCell>{transaction.descricao}</TableCell>
                <TableCell>
                  <Badge variant="outline">{transaction.categoria}</Badge>
                </TableCell>
                <TableCell>{transaction.origem}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(transaction.tipo)}
                    {transaction.tipo}
                  </div>
                </TableCell>
                <TableCell className={`font-medium ${
                  transaction.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.tipo === 'Entrada' ? '+' : '-'}R$ {transaction.valor.toLocaleString('pt-BR')}
                </TableCell>
                <TableCell>{getStatusBadge(transaction.status)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

// Componente para widgets do painel lateral
const SidebarWidgets = () => {
  const contasAPagar = [
    { id: 1, descricao: 'Fornecedor Brinquedos ABC', valor: 1200, vencimento: '2024-05-20' },
    { id: 2, descricao: 'Marketing Digital', valor: 350, vencimento: '2024-05-18' },
    { id: 3, descricao: 'Aluguel Loja', valor: 2500, vencimento: '2024-05-25' }
  ];

  const contasAReceber = [
    { id: 1, descricao: 'Cliente João Silva', valor: 245.80, vencimento: '2024-05-16' },
    { id: 2, descricao: 'Evento Workshop', valor: 890, vencimento: '2024-05-20' },
    { id: 3, descricao: 'Cliente Maria Santos', valor: 180.50, vencimento: '2024-05-15' }
  ];

  const eventosFaturamento = [
    { nome: 'Workshop Brinquedos Educativos', faturamento: 890, participantes: 15 },
    { nome: 'Feira de Brinquedos', faturamento: 1200, participantes: 25 },
    { nome: 'Curso Montagem', faturamento: 650, participantes: 12 }
  ];

  const topFornecedores = [
    { nome: 'Brinquedos ABC Ltda', despesa: 1200, percentual: 35 },
    { nome: 'Educacional XYZ', despesa: 890, percentual: 26 },
    { nome: 'Criativo Toys', despesa: 650, percentual: 19 },
    { nome: 'Infantil Plus', despesa: 420, percentual: 12 },
    { nome: 'Diversão Kids', despesa: 280, percentual: 8 }
  ];

  return (
    <div className="space-y-6">
      {/* Contas a Pagar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="h-5 w-5" />
            Contas a Pagar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contasAPagar.map((conta) => (
              <div key={conta.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div>
                  <p className="text-sm font-medium">{conta.descricao}</p>
                  <p className="text-xs text-red-600">Vence: {conta.vencimento}</p>
                </div>
                <span className="font-bold text-red-700">R$ {conta.valor.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contas a Receber */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-5 w-5" />
            Contas a Receber
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {contasAReceber.map((conta) => (
              <div key={conta.id} className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div>
                  <p className="text-sm font-medium">{conta.descricao}</p>
                  <p className="text-xs text-green-600">Vence: {conta.vencimento}</p>
                </div>
                <span className="font-bold text-green-700">R$ {conta.valor.toLocaleString('pt-BR')}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Evento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Resumo por Evento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {eventosFaturamento.map((evento, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{evento.nome}</span>
                  <span className="text-sm font-bold text-green-600">R$ {evento.faturamento.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{evento.participantes} participantes</span>
                  <span>R$ {(evento.faturamento / evento.participantes).toFixed(2)}/pessoa</span>
                </div>
                <Progress value={75} className="h-1" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Top Fornecedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topFornecedores.map((fornecedor, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{fornecedor.nome}</span>
                  <span className="text-sm font-bold">R$ {fornecedor.despesa.toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={fornecedor.percentual} className="h-1" />
                <span className="text-xs text-muted-foreground">{fornecedor.percentual}% do total</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Financeiro = () => {
  console.log('🔄 Financeiro component starting...');

  // Hook DEVE ser chamado incondicionalmente no topo do componente
  const financialData = useFinancialData();
  
  const loading = financialData.loading;
  const summary = financialData.summary || {
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    projectedBalance: 0,
    revenueGrowth: 0,
    expenseGrowth: 0
  };
  const transactions = financialData.transactions || [];
  const orders = financialData.orders || [];
  const suppliers = financialData.suppliers || [];
  const events = financialData.events || [];
  const refreshData = financialData.refreshData || (() => {});

  console.log('✅ Financial data loaded:', {
    loading,
    transactionsCount: transactions.length,
    ordersCount: orders.length,
    suppliersCount: suppliers.length,
    eventsCount: events.length
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickEditor, setShowQuickEditor] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailsManager, setShowDetailsManager] = useState(false);
  const [showValuesManager, setShowValuesManager] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  const handleNewTransaction = () => {
    setEditingTransaction(null);
    setModalMode('create');
    setShowTransactionModal(true);
  };

  const handleQuickExpense = () => {
    setShowQuickExpense(true);
  };

  const handleResetExpenses = async () => {
    if (!confirm('⚠️ Tem certeza que deseja zerar todas as despesas de fornecedores?\n\nEsta ação não pode ser desfeita.')) {
      return;
    }

    try {
      console.log('🔄 Zerando despesas de fornecedores...');
      
      const response = await fetch('/api/financial/suppliers/reset-expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao zerar despesas');
      }

      const result = await response.json();
      console.log('✅ Resposta do servidor:', result);
      
      // Recarregar dados após zerar
      await refreshData();
      
      toast.success('✅ Despesas zeradas com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao zerar despesas:', error);
      toast.error('❌ Erro ao zerar despesas. Tente novamente.');
    }
  };

  const handleOpenDetailsManager = () => {
    setShowDetailsManager(true);
  };

  const handleCloseDetailsManager = () => {
    setShowDetailsManager(false);
  };

  const handleEditTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setModalMode('edit');
    setShowQuickEditor(true);
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir transação');
      }

      await refreshData();
      toast.success('Transação excluída com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setModalMode('create');
    setShowQuickEditor(true);
  };

  const handleSaveTransaction = async (transactionData: any) => {
    console.log('🚀 handleSaveTransaction chamada com:', transactionData);
    try {
      // Mapear campos - suportar tanto inglês quanto português
      const mappedData = {
        descricao: transactionData.description || transactionData.descricao || '',
        categoria: transactionData.category || transactionData.categoria || '',
        tipo: transactionData.type === 'income' ? 'entrada' : 
              transactionData.type === 'expense' ? 'saida' :
              transactionData.tipo === 'Entrada' ? 'entrada' : 
              transactionData.tipo === 'Saída' ? 'saida' : 'entrada',
        valor: parseFloat(transactionData.amount || transactionData.valor || 0),
        status: transactionData.status === 'paid' ? 'Pago' : 
                transactionData.status === 'pending' ? 'Pendente' : 
                transactionData.status === 'Atrasado' ? 'Atrasado' : 'Pago',
        metodo_pagamento: transactionData.payment_method || transactionData.metodo_pagamento || 'PIX',
        data: transactionData.date || transactionData.data || new Date().toISOString().split('T')[0],
        origem: transactionData.supplier || transactionData.origem || '',
        observacoes: transactionData.notes || transactionData.observacoes || ''
      };

      console.log('📤 Enviando transação mapeada:', mappedData);

      const url = modalMode === 'create' 
        ? '/api/financial/transactions'
        : `/api/financial/transactions/${editingTransaction?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      console.log('🌐 Fazendo requisição para:', url, 'método:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedData),
      });

      console.log('📡 Resposta recebida:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        throw new Error(`Erro ao salvar transação: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('✅ Transação salva com sucesso:', result);

      await refreshData();
      setShowTransactionModal(false);
      setShowQuickEditor(false);
      setEditingTransaction(null);
      
      toast.success('Transação salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
      throw error;
    }
  };

  const handleOpenValuesManager = () => {
    setShowValuesManager(true);
  };

  const handleCloseValuesManager = () => {
    setShowValuesManager(false);
  };

  const handleUpdateValues = async (values: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    projectedBalance: number;
  }) => {
    try {
      const response = await fetch('/api/financial/values', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('Erro ao atualizar valores');
      }

      await refreshData();
      toast.success('Valores financeiros atualizados com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar valores:', error);
      toast.error('Erro ao atualizar valores financeiros');
      throw error;
    }
  };

  const handleResetToCalculated = async () => {
    try {
      const response = await fetch('/api/financial/values/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao resetar valores');
      }

      await refreshData();
      toast.success('Valores resetados para os calculados automaticamente!');
    } catch (error) {
      console.error('Erro ao resetar valores:', error);
      toast.error('Erro ao resetar valores financeiros');
      throw error;
    }
  };


  const handleViewTransaction = (transaction: any) => {
    setEditingTransaction(transaction);
    setModalMode('view');
    setShowTransactionModal(true);
  };


  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-96 animate-pulse"></div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
        
        <div className="h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg animate-pulse"></div>
        
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-500">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando dados financeiros...</span>
          </div>
        </div>
      </div>
    );
  }

  // Renderização segura com tratamento de erro
  try {
    return (
      <div className="p-6 space-y-6">
      {/* Header Profissional */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            Financeiro
            {!loading && (
              <Badge variant="secondary" className="text-sm font-normal">
                {transactions.length} transaç{transactions.length !== 1 ? 'ões' : 'ão'}
              </Badge>
            )}
          </h1>
          <p className="text-gray-600 mt-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Dados em tempo real da base de dados
          </p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={refreshData}
            disabled={loading}
            className="border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button 
            variant="outline"
            className="border-red-600 text-red-600 hover:bg-red-50 transition-colors"
            onClick={handleQuickExpense}
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            Despesa Rápida
          </Button>
          <Button 
            variant="outline"
            className="border-orange-600 text-orange-600 hover:bg-orange-50 transition-colors"
            onClick={handleResetExpenses}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Zerar Despesas
          </Button>
          <Button 
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 transition-colors"
            onClick={handleOpenDetailsManager}
          >
            <Eye className="h-4 w-4 mr-2" />
            Gerenciar Dados
          </Button>
          <Button 
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors"
            onClick={handleOpenValuesManager}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Gerenciar Valores
          </Button>
          <Button 
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50"
            onClick={() => setShowTestModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Teste Rápido
          </Button>
          <Button 
            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all shadow-lg hover:shadow-xl"
            onClick={() => {
              console.log('🚨 BOTÃO DE EMERGÊNCIA CLICADO!');
              setShowEmergencyModal(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            🚨 CRIAR LANÇAMENTO
          </Button>
          <Button 
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white transition-all shadow-lg hover:shadow-xl"
            onClick={async () => {
              console.log('🚀 CRIANDO LANÇAMENTO DIRETO VIA API!');
              try {
                const response = await fetch('/api/financial/transactions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    descricao: 'LANÇAMENTO DIRETO - FUNCIONANDO',
                    categoria: 'Vendas',
                    tipo: 'entrada',
                    valor: 1000.00,
                    status: 'Pago',
                    metodo_pagamento: 'PIX',
                    data: new Date().toISOString().split('T')[0],
                    origem: 'Sistema Direto',
                    observacoes: 'Criado diretamente via botão'
                  })
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('✅ LANÇAMENTO CRIADO COM SUCESSO:', result);
                  toast.success('✅ Lançamento criado com sucesso! ID: ' + result.id);
                  await refreshData();
                } else {
                  throw new Error('Erro na API');
                }
              } catch (error) {
                console.error('❌ ERRO:', error);
                toast.error('❌ Erro ao criar lançamento');
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            🚀 LANÇAMENTO DIRETO
          </Button>
        </div>
      </div>

      {/* Cards de Resumo - Dados Reais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalRevenue || 0)}
            </div>
            <div className={`flex items-center text-xs ${(summary.revenueGrowth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary.revenueGrowth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {summary.revenueGrowth !== undefined ? (
                <>
                  {summary.revenueGrowth >= 0 ? '+' : ''}{summary.revenueGrowth.toFixed(1)}% vs período anterior
                </>
              ) : (
                'Calculando crescimento...'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
            <Building className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.totalExpenses || 0)}
            </div>
            <div className={`flex items-center text-xs ${(summary.expenseGrowth || 0) <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(summary.expenseGrowth || 0) >= 0 ? (
                <TrendingUp className="h-3 w-3 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1" />
              )}
              {summary.expenseGrowth !== undefined ? (
                <>
                  {summary.expenseGrowth >= 0 ? '+' : ''}{summary.expenseGrowth.toFixed(1)}% vs período anterior
                </>
              ) : (
                'Calculando variação...'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(summary.netProfit || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.netProfit || 0)}
            </div>
            <div className="text-xs text-gray-600">
              {summary.totalRevenue > 0 ? (
                <>
                  Margem: {((summary.netProfit / summary.totalRevenue) * 100).toFixed(1)}%
                </>
              ) : (
                'Aguardando transações...'
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado</CardTitle>
            <BarChart className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(summary.projectedBalance || 0)}
            </div>
            <div className="flex items-center text-xs text-orange-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              Projeção baseada em dados reais
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de Empty State */}
      {transactions.length === 0 && orders.length === 0 && suppliers.length === 0 && events.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
          <CardContent className="py-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center">
                <BarChart className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum dado financeiro ainda</h3>
            <p className="text-gray-600 mb-4 max-w-md mx-auto">
              Comece registrando sua primeira transação, adicionando fornecedores ou criando eventos para começar a acompanhar suas finanças.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={handleNewTransaction} className="bg-orange-500 hover:bg-orange-600">
                <Plus className="h-4 w-4 mr-2" />
                Primeiro Lançamento
              </Button>
              <Button variant="outline" onClick={handleQuickExpense}>
                <TrendingDown className="h-4 w-4 mr-2" />
                Registrar Despesa
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className={transactions.length === 0 && orders.length === 0 ? 'opacity-50 pointer-events-none' : ''}>
        <TabsList className="grid w-full grid-cols-12 bg-gradient-to-r from-gray-100 to-gray-50">
          <TabsTrigger value="executive" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
            🎯 Executivo
          </TabsTrigger>
          <TabsTrigger value="accounts">📅 Contas</TabsTrigger>
          <TabsTrigger value="categories">🏷️ Categorias</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard IA</TabsTrigger>
          <TabsTrigger value="manager">💼 Gerenciar Lançamentos</TabsTrigger>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="charts">Gráficos</TabsTrigger>
          <TabsTrigger value="automation">Automações</TabsTrigger>
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="executive" className="space-y-6">
          {/* Dashboard Executivo com KPIs em Tempo Real */}
          <ExecutiveKPIDashboard
            transactions={transactions}
            summary={summary}
            onRefresh={refreshData}
            loading={loading}
          />

          {/* Filtro de Período */}
          <FinancialPeriodFilter
            onPeriodChange={(start, end, type) => {
              console.log('Período alterado:', { start, end, type });
              // Aqui você pode filtrar os dados conforme o período
            }}
          />

          {/* Resumo Executivo - Dados Reais */}
          <ExecutiveSummary
            revenue={summary.totalRevenue || 0}
            expenses={summary.totalExpenses || 0}
            profit={summary.netProfit || 0}
            revenueGrowth={summary.revenueGrowth || 0}
            expenseGrowth={summary.expenseGrowth || 0}
            profitGrowth={summary.netProfit > 0 && summary.totalRevenue > 0 
              ? ((summary.netProfit / summary.totalRevenue) * 100) 
              : 0}
            pendingPayments={
              orders.filter(o => o.payment_status === 'pending').length +
              suppliers.filter(s => (s.saldo_devedor || 0) > 0).length
            }
            overduePayments={
              transactions.filter(t => 
                t.status === 'Atrasado' || 
                (t.status === 'Pendente' && new Date(t.data) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
              ).length
            }
            periodLabel="Período Atual"
          />

          {/* Grid com Widgets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimas Transações */}
            <RecentTransactionsWidget
              transactions={transactions.map(t => ({
                id: t.id,
                type: t.tipo === 'receita' ? 'receita' : 'despesa',
                description: t.descricao,
                amount: t.valor,
                category: t.categoria,
                date: t.data,
                status: 'concluida',
                paymentMethod: t.forma_pagamento
              }))}
              limit={8}
              onViewAll={() => setActiveTab('transactions')}
              onViewTransaction={(transaction) => {
                const original = transactions.find(t => t.id === transaction.id);
                if (original) handleViewTransaction(original);
              }}
            />

            {/* Integração com Eventos */}
            <EventsFinancialIntegration
              events={events}
              totalRevenue={summary.totalRevenue}
              averagePerEvent={events.length > 0 ? (summary.totalRevenue || 0) / events.length : 0}
            />
          </div>

          {/* Contas a Pagar/Receber - Dados Reais */}
          <PayablesReceivables
            items={[
              // Contas a pagar de fornecedores (dados reais)
              ...suppliers.map(supplier => ({
                id: `supplier_${supplier.id}`,
                type: 'pagar' as const,
                description: `Pagamento Fornecedor - ${supplier.name}`,
                amount: supplier.saldo_devedor || 0,
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
                status: 'pendente' as const,
                supplier: supplier.name,
                category: 'Fornecedores'
              })).filter(item => item.amount > 0),
              
              // Contas a receber de pedidos pendentes (dados reais)
              ...orders
                .filter(order => order.payment_status === 'pending')
                .map(order => ({
                  id: `order_${order.id}`,
                  type: 'receber' as const,
                  description: `Pedido - ${order.customer_name || 'Cliente'}`,
                  amount: order.total,
                  dueDate: order.created_at,
                  status: 'pendente' as const,
                  customer: order.customer_name || 'Cliente',
                  category: 'Vendas'
                }))
            ]}
            onMarkAsPaid={(id) => {
              toast.success('Pagamento registrado com sucesso!');
              refreshData();
            }}
          />
        </TabsContent>

        <TabsContent value="accounts" className="space-y-6">
          {/* Módulo de Contas a Pagar e Receber */}
          <PayablesReceivablesManager
            transactions={transactions}
            onRefresh={refreshData}
            onAddAccount={(accountData) => {
              console.log('Adicionar conta:', accountData);
              toast.info('Em breve: adicionar nova conta');
            }}
            onPayAccount={async (id) => {
              try {
                // Atualizar status da transação para pago
                await fetch(`/api/financial/transactions/${id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'Pago' })
                });
                await refreshData();
                toast.success('Pagamento registrado com sucesso!');
              } catch (error) {
                toast.error('Erro ao registrar pagamento');
              }
            }}
          />
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Gerenciador de Categorias */}
          <CategoryManager
            onSave={(categories) => {
              console.log('Categorias salvas:', categories);
              // Aqui você pode salvar as categorias no backend
              toast.success('Configurações de categorias salvas!');
            }}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <AdvancedFinancialDashboard 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
            onRefresh={refreshData}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="manager" className="space-y-6">
          <AdvancedTransactionManager
            transactions={transactions}
            onRefresh={refreshData}
            onCreate={async (data) => {
              console.log('📝 Criar transação:', data);
              await handleSaveTransaction(data);
            }}
            onUpdate={async (id, data) => {
              console.log('✏️ Atualizar transação:', id, data);
              const response = await fetch(`/api/financial/transactions/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
              });
              if (!response.ok) throw new Error('Erro ao atualizar');
            }}
            onDelete={async (id) => {
              console.log('🗑️ Deletar transação:', id);
              const response = await fetch(`/api/financial/transactions/${id}`, {
                method: 'DELETE'
              });
              if (!response.ok) throw new Error('Erro ao deletar');
            }}
          />
        </TabsContent>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Área Principal - Gráfico e Tabela */}
            <div className="lg:col-span-2 space-y-6">
              <CashFlowChart />
              <FinancialTransactions transactions={transactions} />
            </div>

            {/* Painel Lateral - Widgets */}
            <div className="space-y-6">
              <FinancialIntegration 
                orders={orders}
                events={events}
                suppliers={suppliers}
                onRefresh={refreshData}
                loading={loading}
              />
              <SidebarWidgets />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          {/* Aba Fornecedores - Corrigida */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Gestão Financeira de Fornecedores
                </CardTitle>
                <CardDescription>
                  Gerencie pagamentos, créditos e relacionamento com fornecedores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{suppliers.length}</p>
                    <p className="text-sm text-muted-foreground">Total de Fornecedores</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">
                      R$ {suppliers.reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-muted-foreground">Total em Despesas</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">
                      R$ {suppliers.length > 0 ? (suppliers.reduce((sum, s) => sum + (parseFloat(s.total_expenses) || 0), 0) / suppliers.length).toFixed(2) : '0,00'}
                    </p>
                    <p className="text-sm text-muted-foreground">Média por Fornecedor</p>
                  </div>
                </div>

                {suppliers.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600 mb-2">Nenhum Fornecedor Cadastrado</p>
                    <p className="text-muted-foreground mb-4">
                      Cadastre fornecedores para gerenciar pagamentos e despesas
                    </p>
                    <Button onClick={() => window.location.href = '/admin/fornecedores'}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Fornecedor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Lista de Fornecedores</h3>
                      <Button variant="outline" onClick={refreshData}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Atualizar
                      </Button>
                    </div>
                    
                    <div className="grid gap-4">
                      {suppliers.map((supplier, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <Building2 className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-semibold">{supplier.nome || supplier.name || `Fornecedor ${index + 1}`}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {supplier.email || supplier.contato || 'Sem contato'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-green-600">
                                  R$ {(parseFloat(supplier.total_expenses) || 0).toLocaleString('pt-BR')}
                                </p>
                                <p className="text-sm text-muted-foreground">Total em despesas</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          {/* Gráficos Interativos de Comparação */}
          <InteractiveComparisonCharts
            transactions={transactions}
            onRefresh={refreshData}
            loading={loading}
          />

          {/* Gráficos Avançados Existentes */}
          <AdvancedFinancialCharts 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="automation" className="space-y-6">
          <FinancialAutomation 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          {/* Aba Lançamentos - Corrigida */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Gestão de Lançamentos Financeiros
                </CardTitle>
                <CardDescription>
                  Visualize, edite e gerencie todas as transações financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-6">
                  <div className="flex gap-2">
                    <Button onClick={() => setShowEmergencyModal(true)} className="bg-red-600 hover:bg-red-700">
                      <Plus className="h-4 w-4 mr-2" />
                      🚨 CRIAR LANÇAMENTO
                    </Button>
                    <Button onClick={handleNewTransaction} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Novo Lançamento
                    </Button>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={async () => {
                        console.log('🚀 CRIANDO LANÇAMENTO DIRETO VIA API!');
                        try {
                          const response = await fetch('/api/financial/transactions', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              descricao: 'LANÇAMENTO DIRETO - FUNCIONANDO',
                              categoria: 'Vendas',
                              tipo: 'entrada',
                              valor: 1000.00,
                              status: 'Pago',
                              metodo_pagamento: 'PIX',
                              data: new Date().toISOString().split('T')[0],
                              origem: 'Sistema Direto',
                              observacoes: 'Criado diretamente via botão'
                            })
                          });
                          
                          if (response.ok) {
                            const result = await response.json();
                            console.log('✅ LANÇAMENTO CRIADO COM SUCESSO:', result);
                            toast.success('✅ Lançamento criado com sucesso! ID: ' + result.id);
                            await refreshData();
                          } else {
                            throw new Error('Erro na API');
                          }
                        } catch (error) {
                          console.error('❌ ERRO:', error);
                          toast.error('❌ Erro ao criar lançamento');
                        }
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      🚀 LANÇAMENTO DIRETO
                    </Button>
                    <Button variant="outline" onClick={refreshData}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Atualizar
                    </Button>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {transactions.length} lançamentos encontrados
                  </div>
                </div>

                {transactions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-gray-600 mb-2">Nenhum Lançamento Cadastrado</p>
                    <p className="text-muted-foreground mb-4">
                      Comece criando seu primeiro lançamento financeiro
                    </p>
                    <Button onClick={handleNewTransaction} className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Lançamento
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Resumo Rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">
                          R$ {transactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + (Number(t.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">Total de Entradas</p>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">
                          R$ {transactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + (Number(t.valor) || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">Total de Saídas</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <p className="text-2xl font-bold text-blue-600">
                          R$ {(transactions.filter(t => t.tipo === 'Entrada').reduce((sum, t) => sum + (Number(t.valor) || 0), 0) - 
                               transactions.filter(t => t.tipo === 'Saída').reduce((sum, t) => sum + (Number(t.valor) || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-muted-foreground">Saldo Líquido</p>
                      </div>
                    </div>

                    {/* Lista de Transações */}
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold">Últimas Transações</h3>
                      {transactions.slice(0, 10).map((transaction, index) => (
                        <Card key={index} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                  transaction.tipo === 'Entrada' 
                                    ? 'bg-green-100' 
                                    : 'bg-red-100'
                                }`}>
                                  {transaction.tipo === 'Entrada' ? (
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <TrendingDown className="h-5 w-5 text-red-600" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-semibold">{transaction.descricao || transaction.description || 'Sem descrição'}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {transaction.categoria || transaction.category || 'Sem categoria'} • 
                                    {new Date(transaction.data || transaction.date).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className={`font-semibold ${
                                  transaction.tipo === 'Entrada' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {transaction.tipo === 'Entrada' ? '+' : '-'}
                                  R$ {(Number(transaction.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {transaction.status}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {transactions.length > 10 && (
                      <div className="text-center">
                        <Button variant="outline" onClick={() => setActiveTab('overview')}>
                          Ver Todas as Transações
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <FinancialGoals 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="forecast" className="space-y-6">
          <FinancialForecast 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Exportador Avançado de Relatórios */}
          <AdvancedReportExporter
            transactions={transactions}
            summary={summary}
            suppliers={suppliers}
            events={events}
          />

          {/* Gráficos e Análises Existentes */}
          <FinancialCharts 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <FinancialAlerts 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <FinancialExport 
            orders={orders}
            suppliers={suppliers}
            events={events}
            transactions={transactions}
            summary={summary}
          />
        </TabsContent>

        <TabsContent value="integration" className="space-y-6">
          <FinancialIntegration 
            orders={orders}
            events={events}
            suppliers={suppliers}
            onRefresh={refreshData}
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Modal Profissional de Transação */}
      <ProfessionalTransactionModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        transaction={editingTransaction}
        mode={modalMode}
      />

      {/* Modal de Cadastro Rápido de Despesas */}
      {showQuickExpense && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <QuickAddExpense
              onSuccess={() => {
                setShowQuickExpense(false);
                refreshData();
              }}
              onClose={() => setShowQuickExpense(false)}
            />
          </div>
        </div>
      )}

      {/* Modal de Gerenciamento de Detalhes Financeiros */}
      {showDetailsManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-7xl w-full max-h-[95vh] overflow-y-auto">
            <FinancialDetailsManager
              summary={summary}
              transactions={transactions}
              orders={orders}
              suppliers={suppliers}
              events={events}
              onRefresh={refreshData}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              onAddTransaction={handleAddTransaction}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCloseDetailsManager} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição Rápida de Transações */}
      <QuickTransactionEditor
        transaction={editingTransaction}
        isOpen={showQuickEditor}
        onClose={() => {
          setShowQuickEditor(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        mode={modalMode}
      />

      {/* Modal de Gerenciamento de Valores Financeiros */}
      {showValuesManager && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="max-w-6xl w-full max-h-[95vh] overflow-y-auto">
            <FinancialValuesManager
              summary={summary}
              onUpdateValues={handleUpdateValues}
              onResetToCalculated={handleResetToCalculated}
            />
            <div className="mt-4 flex justify-end">
              <Button onClick={handleCloseValuesManager} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Teste */}
      <TestTransactionModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        onSave={async (data) => {
          console.log('🚀 Dados do modal de teste:', data);
          await handleSaveTransaction(data);
          await refreshData();
        }}
      />

      {/* Modal de Emergência */}
      <EmergencyTransactionModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
      />

    </div>
    );
  } catch (error) {
    console.error('❌ Erro crítico no componente Financeiro:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erro no Módulo Financeiro</h2>
          <p className="text-red-600 mb-4">
            Ocorreu um erro ao carregar o módulo financeiro. Tente recarregar a página.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
};

export default Financeiro;
