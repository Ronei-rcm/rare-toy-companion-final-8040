import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Search,
  Upload,
  Link2,
  Unlink,
  Wallet,
  Building,
  DollarSign,
  FileText,
  TrendingUp,
  Edit,
  Trash2,
  CheckSquare,
  Square
} from 'lucide-react';
import { toast } from 'sonner';
import MetricCard from './MetricCard';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import PayBillModal from './PayBillModal';
import ImportBankStatementModal from './ImportBankStatementModal';
import SimpleTransactionModal from './SimpleTransactionModal';
import { formatCurrency } from '@/utils/currencyUtils';

interface Transacao {
  id: number;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento: string;
  data: string;
  hora?: string | null;
  origem: string;
  observacoes: string;
}

interface MovimentacaoBancaria {
  id: number;
  conta_id: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'credito' | 'debito';
  conciliada: boolean;
  transaction_id?: number;
}

interface ContaBancaria {
  id: number;
  nome: string;
  banco: string;
  saldo: number;
  status: 'ativo' | 'inativo';
}

// Função helper para verificar se transação está conciliada
const isTransacaoConciliada = (transacao: Transacao): boolean => {
  return !!(transacao.observacoes?.includes('[CONCILIADO'));
};

export default function BankReconciliationManager() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoBancaria[]>([]);
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'conciliadas' | 'pendentes'>('pendentes');
  const [selectedTransaction, setSelectedTransaction] = useState<Transacao | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transacao | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [dataInicio, setDataInicio] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, []);

  // Recarregar movimentações quando transações ou contas mudarem
  useEffect(() => {
    if (transacoes.length > 0 && contas.length > 0) {
      gerarMovimentacoesBancarias();
    }
  }, [transacoes, contas]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      
      // Carregar transações
      const transacoesRes = await fetch('/api/financial/transactions');
      if (transacoesRes.ok) {
        const transacoesData = await transacoesRes.json();
        setTransacoes(transacoesData.transactions || []);
      }

      // Carregar contas bancárias
      const contasRes = await fetch('/api/financial/contas');
      if (contasRes.ok) {
        const contasData = await contasRes.json();
        const contasAtivas = (contasData.contas || []).filter((c: any) => c.status === 'ativo');
        setContas(contasAtivas);
        if (contasAtivas.length > 0 && contaSelecionada === 'all') {
          setContaSelecionada(contasAtivas[0].id.toString());
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados de conciliação');
    } finally {
      setLoading(false);
    }
  };

  const gerarMovimentacoesBancarias = () => {
    try {
      const movimentacoesSimuladas: MovimentacaoBancaria[] = [];
      
      transacoes.forEach((transacao) => {
        if (transacao.status === 'Pago' && transacao.metodo_pagamento?.includes('Conta:')) {
          const contaMatch = transacao.metodo_pagamento.match(/Conta: ([^(]+)/);
          const conta = contas.find(c => c.nome === contaMatch?.[1]?.trim());
          
          if (conta) {
            movimentacoesSimuladas.push({
              id: transacao.id * 1000,
              conta_id: conta.id,
              data: transacao.data,
              descricao: transacao.descricao,
              valor: Math.abs(transacao.valor),
              tipo: transacao.tipo === 'entrada' ? 'credito' : 'debito',
              conciliada: isTransacaoConciliada(transacao),
              transaction_id: transacao.id
            });
          }
        }
      });

      setMovimentacoes(movimentacoesSimuladas);
    } catch (error) {
      console.error('Erro ao gerar movimentações:', error);
    }
  };

  // Filtrar transações
  const transacoesFiltradas = useMemo(() => {
    let filtered = [...transacoes];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.descricao.toLowerCase().includes(term) ||
        t.categoria.toLowerCase().includes(term) ||
        t.origem?.toLowerCase().includes(term)
      );
    }

    if (filterStatus === 'conciliadas') {
      filtered = filtered.filter(t => isTransacaoConciliada(t));
    } else if (filterStatus === 'pendentes') {
      filtered = filtered.filter(t => !isTransacaoConciliada(t) && t.status === 'Pago');
    }

    if (dataInicio && dataFim) {
      filtered = filtered.filter(t => {
        const dataTransacao = new Date(t.data);
        return dataTransacao >= new Date(dataInicio) && dataTransacao <= new Date(dataFim);
      });
    }

    if (contaSelecionada && contaSelecionada !== 'all') {
      filtered = filtered.filter(t => {
        if (t.metodo_pagamento?.includes('Conta:')) {
          const contaMatch = t.metodo_pagamento.match(/Conta: ([^(]+)/);
          const conta = contas.find(c => c.nome === contaMatch?.[1]?.trim());
          return conta?.id.toString() === contaSelecionada;
        }
        return false;
      });
    }

    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [transacoes, searchTerm, filterStatus, contaSelecionada, dataInicio, dataFim, contas]);

  // Filtrar movimentações
  const movimentacoesFiltradas = useMemo(() => {
    let filtered = [...movimentacoes];

    if (contaSelecionada && contaSelecionada !== 'all') {
      filtered = filtered.filter(m => m.conta_id.toString() === contaSelecionada);
    }

    if (dataInicio && dataFim) {
      filtered = filtered.filter(m => {
        const dataMov = new Date(m.data);
        return dataMov >= new Date(dataInicio) && dataMov <= new Date(dataFim);
      });
    }

    if (filterStatus === 'conciliadas') {
      filtered = filtered.filter(m => m.conciliada);
    } else if (filterStatus === 'pendentes') {
      filtered = filtered.filter(m => !m.conciliada);
    }

    return filtered.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [movimentacoes, contaSelecionada, filterStatus, dataInicio, dataFim]);

  // Estatísticas
  const estatisticas = useMemo(() => {
    const pendentes = transacoesFiltradas.filter(t => !isTransacaoConciliada(t) && t.status === 'Pago').length;
    const conciliadas = transacoesFiltradas.filter(t => isTransacaoConciliada(t)).length;
    const totalPendente = transacoesFiltradas
      .filter(t => !isTransacaoConciliada(t) && t.status === 'Pago')
      .reduce((sum, t) => sum + (t.tipo === 'entrada' ? t.valor : -t.valor), 0);
    
    return {
      pendentes,
      conciliadas,
      totalPendente: Math.abs(totalPendente),
      porcentagemConciliacao: transacoesFiltradas.length > 0 
        ? (conciliadas / transacoesFiltradas.length) * 100 
        : 0
    };
  }, [transacoesFiltradas]);

  // Conciliação manual
  const reconciliarTransacao = async (transacaoId: number, movimentacaoId?: number) => {
    try {
      const transacao = transacoes.find(t => t.id === transacaoId);
      if (!transacao) {
        toast.error('Transação não encontrada');
        return;
      }

      const dataConciliacao = new Date().toISOString();
      const observacaoConciliacao = movimentacaoId
        ? `\n\n[CONCILIADO em ${new Date(dataConciliacao).toLocaleString('pt-BR')} - Movimentação ID: ${movimentacaoId}]`
        : `\n\n[CONCILIADO em ${new Date(dataConciliacao).toLocaleString('pt-BR')}]`;

      const response = await fetch(`/api/financial/transactions/${transacaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacoes: `${transacao.observacoes || ''}${observacaoConciliacao}`.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao conciliar');
      }

      toast.success('Transação conciliada com sucesso!');
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao conciliar:', error);
      toast.error(error.message || 'Erro ao conciliar transação');
    }
  };

  // Desconciliar
  const desconciliarTransacao = async (transacaoId: number) => {
    try {
      const transacao = transacoes.find(t => t.id === transacaoId);
      if (!transacao) {
        toast.error('Transação não encontrada');
        return;
      }

      const observacoesSemConciliacao = (transacao.observacoes || '')
        .replace(/\n\n\[CONCILIADO[^\]]*\]/g, '')
        .trim();

      const response = await fetch(`/api/financial/transactions/${transacaoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          observacoes: observacoesSemConciliacao
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao desconciliar');
      }

      toast.success('Conciliação removida!');
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao desconciliar:', error);
      toast.error(error.message || 'Erro ao remover conciliação');
    }
  };

  // Abrir modal de pagamento
  const abrirModalPagamento = (transacao: Transacao) => {
    if (transacao.status === 'Pago') {
      toast.info('Esta transação já está paga');
      return;
    }
    setSelectedTransaction(transacao);
    setShowPayModal(true);
  };

  // Processar pagamento bem-sucedido
  const handlePagamentoSucesso = async () => {
    await carregarDados();
    setShowPayModal(false);
    setSelectedTransaction(null);
  };

  // Editar transação
  const abrirModalEdicao = (transacao: Transacao) => {
    setEditingTransaction(transacao);
    setShowEditModal(true);
  };

  const fecharModalEdicao = () => {
    setShowEditModal(false);
    setEditingTransaction(null);
  };

  const salvarTransacaoEditada = async (data: any) => {
    try {
      const isEdit = data.id;
      const url = '/api/financial/transactions';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar transação');
      }

      toast.success('Transação atualizada com sucesso!');
      await carregarDados();
      fecharModalEdicao();
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error);
      toast.error(error.message || 'Erro ao salvar transação');
    }
  };

  // Excluir transação
  const excluirTransacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir transação');
      }

      toast.success('Transação excluída com sucesso!');
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error);
      toast.error(error.message || 'Erro ao excluir transação');
    }
  };

  // Seleção em lote
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(transacoesFiltradas.map(t => t.id));
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === transacoesFiltradas.length);
  };

  // Ações em lote
  const excluirSelecionadas = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione pelo menos uma transação');
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir ${selectedIds.size} transação(ões)?`)) {
      return;
    }

    try {
      let sucesso = 0;
      let erros = 0;

      for (const id of selectedIds) {
        try {
          const response = await fetch(`/api/financial/transactions/${id}`, {
            method: 'DELETE'
          });

          if (response.ok) {
            sucesso++;
          } else {
            erros++;
          }
        } catch (error) {
          erros++;
        }
      }

      if (sucesso > 0) {
        toast.success(`${sucesso} transação(ões) excluída(s) com sucesso!`);
      }
      if (erros > 0) {
        toast.error(`${erros} transação(ões) não puderam ser excluídas`);
      }

      setSelectedIds(new Set());
      setSelectAll(false);
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao excluir transações:', error);
      toast.error('Erro ao excluir transações');
    }
  };

  const conciliarSelecionadas = async () => {
    if (selectedIds.size === 0) {
      toast.warning('Selecione pelo menos uma transação');
      return;
    }

    try {
      let sucesso = 0;
      let erros = 0;

      for (const id of selectedIds) {
        try {
          await reconciliarTransacao(id);
          sucesso++;
        } catch (error) {
          erros++;
        }
      }

      if (sucesso > 0) {
        toast.success(`${sucesso} transação(ões) conciliada(s) com sucesso!`);
      }
      if (erros > 0) {
        toast.error(`${erros} transação(ões) não puderam ser conciliadas`);
      }

      setSelectedIds(new Set());
      setSelectAll(false);
      await carregarDados();
    } catch (error: any) {
      console.error('Erro ao conciliar transações:', error);
      toast.error('Erro ao conciliar transações');
    }
  };

  if (loading) {
    return <LoadingState message="Carregando dados de conciliação..." fullHeight />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Link2 className="h-6 w-6 text-blue-600" />
            Conciliação Bancária
          </h2>
          <p className="text-gray-600 text-sm mt-1">
            Sincronize transações do sistema com movimentações bancárias
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={carregarDados}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              setShowImportModal(true);
            }}
          >
            <Upload className="h-4 w-4 mr-2" />
            Importar Extrato
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Pendentes"
          value={estatisticas.pendentes}
          format="number"
          color="yellow"
          icon={<AlertCircle className="h-5 w-5" />}
          subtitle="Aguardando conciliação"
        />
        <MetricCard
          title="Conciliadas"
          value={estatisticas.conciliadas}
          format="number"
          color="green"
          icon={<CheckCircle className="h-5 w-5" />}
          subtitle="Já reconciliadas"
        />
        <MetricCard
          title="Total Pendente"
          value={estatisticas.totalPendente}
          format="currency"
          color="blue"
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="Valor a conciliar"
        />
        <MetricCard
          title="Taxa de Conciliação"
          value={estatisticas.porcentagemConciliacao}
          format="percentage"
          color="purple"
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="% conciliado"
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label>Conta Bancária</Label>
              <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {contas.map(conta => (
                    <SelectItem key={conta.id} value={conta.id.toString()}>
                      {conta.nome} - {conta.banco}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="pendentes">Pendentes</SelectItem>
                  <SelectItem value="conciliadas">Conciliadas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            <div>
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Transações vs Movimentações */}
      <Tabs defaultValue="transacoes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transacoes">
            <FileText className="h-4 w-4 mr-2" />
            Transações ({transacoesFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="movimentacoes">
            <Building className="h-4 w-4 mr-2" />
            Movimentações ({movimentacoesFiltradas.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab: Transações do Sistema */}
        <TabsContent value="transacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Transações do Sistema</CardTitle>
                  <CardDescription>
                    Transações que podem ser conciliadas com movimentações bancárias
                  </CardDescription>
                </div>
                {selectedIds.size > 0 && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={conciliarSelecionadas}
                      className="text-blue-600"
                    >
                      <Link2 className="h-4 w-4 mr-2" />
                      Conciliação em Lote ({selectedIds.size})
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={excluirSelecionadas}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Selecionadas ({selectedIds.size})
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {transacoesFiltradas.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="Nenhuma transação encontrada"
                  description="Não há transações para conciliar no período selecionado"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSelectAll}
                            className="h-8 w-8 p-0"
                            title={selectAll ? 'Desmarcar todas' : 'Marcar todas'}
                          >
                            {selectAll ? (
                              <CheckSquare className="h-4 w-4" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        </TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Conciliação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transacoesFiltradas.map((transacao) => (
                        <TableRow key={transacao.id}>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSelect(transacao.id)}
                              className="h-8 w-8 p-0"
                            >
                              {selectedIds.has(transacao.id) ? (
                                <CheckSquare className="h-4 w-4 text-blue-600" />
                              ) : (
                                <Square className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div>
                              {new Date(transacao.data).toLocaleDateString('pt-BR')}
                              {transacao.hora && (
                                <span className="text-xs text-gray-500 ml-2">
                                  {transacao.hora}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium" title={transacao.descricao}>
                            <div className="max-w-xs truncate">{transacao.descricao}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{transacao.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={transacao.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {transacao.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-semibold ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                            {transacao.tipo === 'entrada' ? '+' : '-'}{formatCurrency(transacao.valor)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {transacao.metodo_pagamento || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate" title={transacao.origem || 'N/A'}>
                              {transacao.origem || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={
                              transacao.status === 'Pago' ? 'bg-green-100 text-green-800' :
                              transacao.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {transacao.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {isTransacaoConciliada(transacao) ? (
                              <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                                <CheckCircle className="h-3 w-3" />
                                Conciliada
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                <AlertCircle className="h-3 w-3" />
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => abrirModalEdicao(transacao)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                title="Editar transação"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => excluirTransacao(transacao.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Excluir transação"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {transacao.status !== 'Pago' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => abrirModalPagamento(transacao)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  title="Pagar conta"
                                >
                                  <Wallet className="h-4 w-4" />
                                </Button>
                              )}
                              {isTransacaoConciliada(transacao) ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => desconciliarTransacao(transacao.id)}
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  title="Desconciliar"
                                >
                                  <Unlink className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => reconciliarTransacao(transacao.id)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  disabled={transacao.status !== 'Pago'}
                                  title="Conciliação manual"
                                >
                                  <Link2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Movimentações Bancárias */}
        <TabsContent value="movimentacoes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Bancárias</CardTitle>
              <CardDescription>
                Movimentações importadas dos extratos bancários
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimentacoesFiltradas.length === 0 ? (
                <EmptyState
                  icon={Building}
                  title="Nenhuma movimentação encontrada"
                  description="Importe um extrato bancário para ver as movimentações"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Transação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimentacoesFiltradas.map((mov) => (
                        <TableRow key={mov.id}>
                          <TableCell>
                            {new Date(mov.data).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="font-medium">{mov.descricao}</TableCell>
                          <TableCell>
                            <Badge className={mov.tipo === 'credito' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {mov.tipo === 'credito' ? '💰 Crédito' : '💸 Débito'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`font-semibold ${mov.tipo === 'credito' ? 'text-green-600' : 'text-red-600'}`}>
                            {mov.tipo === 'credito' ? '+' : '-'}{formatCurrency(mov.valor)}
                          </TableCell>
                          <TableCell>
                            {mov.conciliada ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Conciliada
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {mov.transaction_id ? (
                              <Badge variant="outline">ID: {mov.transaction_id}</Badge>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Pagamento */}
      <PayBillModal
        isOpen={showPayModal}
        onClose={() => {
          setShowPayModal(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
        onSuccess={handlePagamentoSucesso}
      />

      {/* Modal de Importação */}
      <ImportBankStatementModal
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
        }}
        onSuccess={async () => {
          await carregarDados();
          setShowImportModal(false);
        }}
        contaId={contaSelecionada && contaSelecionada !== 'all' ? parseInt(contaSelecionada) : undefined}
      />

      {/* Modal de Edição */}
      <SimpleTransactionModal
        isOpen={showEditModal}
        onClose={fecharModalEdicao}
        onSave={salvarTransacaoEditada}
        mode="edit"
        transaction={editingTransaction}
      />
    </div>
  );
}
