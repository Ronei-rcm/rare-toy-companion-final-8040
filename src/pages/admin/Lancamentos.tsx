import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, RefreshCw, DollarSign, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const Lancamentos = () => {
  console.log('💰 Componente Lancamentos renderizando...');
  
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Garantir que transactions seja sempre um array
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  console.log('💰 Lançamentos:', { 
    transactionsCount: safeTransactions.length, 
    loading,
    transactionsType: typeof transactions,
    isArray: Array.isArray(transactions)
  });

  // Buscar transações reais do banco de dados
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financial/transactions');
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Transações carregadas do banco:', data);
        // Garantir que sempre seja um array
        const transactionsArray = Array.isArray(data) ? data : (Array.isArray(data.transactions) ? data.transactions : []);
        setTransactions(transactionsArray);
      } else {
        console.error('❌ Erro ao buscar transações:', response.status);
        setTransactions([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar transações:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    // Verificar se é um ID numérico válido (transações reais do banco)
    if (!/^\d+$/.test(id)) {
      toast.error('Não é possível excluir lançamentos simulados');
      return;
    }

    if (!confirm('Deseja realmente excluir este lançamento?')) return;
    
    try {
      const response = await fetch(`/api/financial/transactions/${id}`, { 
        method: 'DELETE' 
      });
      
      if (response.ok) {
        toast.success('Lançamento excluído com sucesso');
        fetchTransactions(); // Recarregar lista
      } else {
        throw new Error('Erro ao excluir');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir lançamento');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      'Pago': 'default',
      'Pendente': 'secondary',
      'Atrasado': 'destructive'
    };
    const colors = {
      'Pago': 'bg-green-100 text-green-700',
      'Pendente': 'bg-yellow-100 text-yellow-700',
      'Atrasado': 'bg-red-100 text-red-700'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status}
      </Badge>
    );
  };

  const getTypeIcon = (tipo: string) => {
    return tipo === 'Entrada' ? 
      <TrendingUp className="h-4 w-4 text-green-600" /> : 
      <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  try {
    console.log('✅ Renderizando componente principal. Transações:', safeTransactions.length);
    
    return (
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => navigate('/admin/financeiro')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Lançamentos Financeiros</h1>
              <p className="text-muted-foreground">
                Gerencie todas as entradas e saídas financeiras
              </p>
            </div>
          </div>
        <div className="flex gap-2">
          <Button onClick={fetchTransactions} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => {
            toast.info('Em breve: criação de novos lançamentos');
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Lançamento
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Carregando lançamentos...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Lançamentos</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeTransactions.length}</div>
                <p className="text-xs text-muted-foreground">Lançamentos registrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {safeTransactions.filter((t: any) => t.tipo === 'Entrada').reduce((sum: number, t: any) => sum + (t.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">Receitas totais</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {safeTransactions.filter((t: any) => t.tipo === 'Saída').reduce((sum: number, t: any) => sum + (t.valor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">Despesas totais</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lançamentos Pendentes</CardTitle>
                <Calendar className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {safeTransactions.filter((t: any) => t.status === 'Pendente').length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Aguardando pagamento</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Lançamentos */}
          <Card>
            <CardHeader>
              <CardTitle>Lançamentos Financeiros</CardTitle>
              <CardDescription>
                Lista de todas as transações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {safeTransactions.length === 0 ? (
                <div className="text-center p-8">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum lançamento encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {safeTransactions.map((transaction: any) => (
                    <Card key={transaction.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            transaction.tipo === 'Entrada' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            {getTypeIcon(transaction.tipo)}
                          </div>
                          <div>
                            <h3 className="font-semibold">{transaction.descricao || 'Lançamento'}</h3>
                            <p className="text-sm text-muted-foreground">
                              {transaction.categoria || 'Sem categoria'} • 
                              {new Date(transaction.data).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className={`text-lg font-bold ${
                              transaction.tipo === 'Entrada' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.tipo === 'Entrada' ? '+' : '-'}R$ {(transaction.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(transaction.status || 'Pendente')}
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteTransaction(transaction.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
    );
  } catch (error) {
    console.error('❌ Erro crítico ao renderizar Lancamentos:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao Carregar Lançamentos</h2>
          <p className="text-red-600 mb-4">
            Ocorreu um erro ao carregar a página de lançamentos. Por favor, recarregue a página.
          </p>
          <p className="text-sm text-red-500 mb-4">
            Erro: {error instanceof Error ? error.message : 'Erro desconhecido'}
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

export default Lancamentos;

