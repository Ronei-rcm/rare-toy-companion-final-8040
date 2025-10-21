import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

// Interface para transação financeira
interface Transacao {
  id: number;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento: string;
  data: string;
  origem: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

// Interface para resumo financeiro
interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  totalTransacoes: number;
}

export default function FinanceiroNovo() {
  // Estados principais
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalEntradas: 0,
    totalSaidas: 0,
    saldoLiquido: 0,
    totalTransacoes: 0
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [transacaoEditando, setTransacaoEditando] = useState<Transacao | null>(null);

  // Estado do formulário
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: '',
    status: 'Pago' as 'Pago' | 'Pendente' | 'Atrasado',
    metodo_pagamento: 'PIX',
    data: new Date().toISOString().split('T')[0],
    origem: '',
    observacoes: ''
  });

  // Função para carregar transações
  const carregarTransacoes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando transações...');
      
      const response = await fetch('/api/financial/transactions');
      if (!response.ok) {
        throw new Error('Erro ao carregar transações');
      }
      
      const data = await response.json();
      const transacoesData = data.transactions || [];
      
      console.log('✅ Transações carregadas:', transacoesData.length);
      setTransacoes(transacoesData);
      
      // Calcular resumo
      const resumoCalculado = calcularResumo(transacoesData);
      setResumo(resumoCalculado);
      
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular resumo financeiro
  const calcularResumo = (transacoes: Transacao[]): ResumoFinanceiro => {
    const totalEntradas = transacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const totalSaidas = transacoes
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido: totalEntradas - totalSaidas,
      totalTransacoes: transacoes.length
    };
  };

  // Função para salvar transação
  const salvarTransacao = async () => {
    try {
      // Validação
      if (!formData.descricao || !formData.categoria || !formData.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const dadosTransacao = {
        descricao: formData.descricao,
        categoria: formData.categoria,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        status: formData.status,
        metodo_pagamento: formData.metodo_pagamento,
        data: formData.data,
        origem: formData.origem,
        observacoes: formData.observacoes
      };

      console.log('💾 Salvando transação:', dadosTransacao);

      const url = modalMode === 'create' 
        ? '/api/financial/transactions'
        : `/api/financial/transactions/${transacaoEditando?.id}`;
      
      const method = modalMode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dadosTransacao)
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar transação');
      }

      const result = await response.json();
      console.log('✅ Transação salva:', result);

      toast.success(
        modalMode === 'create' 
          ? `Transação criada com sucesso! ID: ${result.id}`
          : 'Transação atualizada com sucesso!'
      );

      // Fechar modal e recarregar dados
      setShowModal(false);
      resetForm();
      await carregarTransacoes();

    } catch (error) {
      console.error('❌ Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  // Função para excluir transação
  const excluirTransacao = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) {
      return;
    }

    try {
      console.log('🗑️ Excluindo transação:', id);

      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir transação');
      }

      toast.success('Transação excluída com sucesso!');
      await carregarTransacoes();

    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
    }
  };

  // Função para abrir modal de edição
  const abrirModalEdicao = (transacao: Transacao) => {
    setTransacaoEditando(transacao);
    setModalMode('edit');
    setFormData({
      descricao: transacao.descricao,
      categoria: transacao.categoria,
      tipo: transacao.tipo,
      valor: transacao.valor.toString(),
      status: transacao.status,
      metodo_pagamento: transacao.metodo_pagamento,
      data: transacao.data,
      origem: transacao.origem,
      observacoes: transacao.observacoes
    });
    setShowModal(true);
  };

  // Função para abrir modal de criação
  const abrirModalCriacao = () => {
    setTransacaoEditando(null);
    setModalMode('create');
    resetForm();
    setShowModal(true);
  };

  // Função para resetar formulário
  const resetForm = () => {
    setFormData({
      descricao: '',
      categoria: '',
      tipo: 'entrada',
      valor: '',
      status: 'Pago',
      metodo_pagamento: 'PIX',
      data: new Date().toISOString().split('T')[0],
      origem: '',
      observacoes: ''
    });
  };

  // Função para obter ícone de status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pago':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Atrasado':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Função para obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Atrasado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    carregarTransacoes();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Módulo Financeiro</h1>
          <p className="text-gray-600">Sistema novo e organizado</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={carregarTransacoes} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={abrirModalCriacao} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {resumo.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {resumo.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Líquido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resumo.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {resumo.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {resumo.totalTransacoes}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Transações Financeiras</CardTitle>
          <CardDescription>
            Lista de todas as transações ({resumo.totalTransacoes} encontradas)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando transações...</p>
            </div>
          ) : (
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
                    <TableHead>Método</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    transacoes.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell className="font-medium">
                          {new Date(transacao.data).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={transacao.descricao}>
                            {transacao.descricao}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transacao.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {transacao.tipo === 'entrada' ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <Badge className={transacao.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {transacao.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className={`font-semibold ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'}R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(transacao.status)}
                            <Badge className={getStatusColor(transacao.status)}>
                              {transacao.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{transacao.metodo_pagamento}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => abrirModalEdicao(transacao)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => excluirTransacao(transacao.id)}
                              title="Excluir"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {modalMode === 'create' ? 'Nova Transação' : 'Editar Transação'}
              </CardTitle>
              <CardDescription>
                {modalMode === 'create' ? 'Crie uma nova transação financeira' : 'Edite os dados da transação'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    placeholder="Ex: Venda de produtos"
                  />
                </div>

                <div>
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Input
                    id="categoria"
                    value={formData.categoria}
                    onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    placeholder="Ex: Vendas"
                  />
                </div>

                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: 'Pago' | 'Pendente' | 'Atrasado') => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="metodo">Método de Pagamento</Label>
                  <Select value={formData.metodo_pagamento} onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                      <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                      <SelectItem value="Transferência">Transferência</SelectItem>
                      <SelectItem value="Boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Input
                    id="origem"
                    value={formData.origem}
                    onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                    placeholder="Ex: Cliente, Fornecedor"
                  />
                </div>

                <div className="col-span-2">
                  <Label htmlFor="observacoes">Observações</Label>
                  <textarea
                    id="observacoes"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    placeholder="Informações adicionais"
                  />
                </div>
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarTransacao} className="bg-blue-600 hover:bg-blue-700">
                {modalMode === 'create' ? 'Criar Transação' : 'Salvar Alterações'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
