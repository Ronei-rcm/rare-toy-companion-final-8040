import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  Building,
  Users,
  CreditCard,
  Settings,
  Zap,
  Link,
  TrendingUp,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import AdvancedFinancialDashboard from '@/components/admin/AdvancedFinancialDashboard';
import CategoryManager from '@/components/admin/CategoryManager';
import SupplierClientManager from '@/components/admin/SupplierClientManager';
import AccountCardManager from '@/components/admin/AccountCardManager';
import AutomationIntegrationManager from '@/components/admin/AutomationIntegrationManager';

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
}

export default function FinanceiroCompleto() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [ automacoes, setAutomacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('transacoes');
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

  // Carregar transações
  const carregarTransacoes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando transações...');
      
      const response = await fetch('/api/financial/transactions');
      if (!response.ok) throw new Error('Erro ao carregar');
      
      const data = await response.json();
      setTransacoes(data.transactions || []);
      
      console.log('✅ Transações carregadas:', data.transactions?.length || 0);
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  // Salvar transação
  const salvarTransacao = async () => {
    try {
      if (!formData.descricao || !formData.categoria || !formData.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const dados = {
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

      console.log('💾 Salvando:', dados);

      const response = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      const result = await response.json();
      console.log('✅ Salvo:', result);

      toast.success(`Transação criada! ID: ${result.id}`);
      setShowModal(false);
      resetForm();
      await carregarTransacoes();
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  // Excluir transação
  const excluirTransacao = async (id: number) => {
    if (!confirm('Excluir esta transação?')) return;

    try {
      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast.success('Transação excluída!');
      await carregarTransacoes();
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao excluir');
    }
  };

  // Resetar formulário
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

  // Calcular resumo
  const resumo = {
    totalEntradas: transacoes.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + Number(t.valor), 0),
    totalSaidas: transacoes.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + Number(t.valor), 0),
    totalTransacoes: transacoes.length
  };

  resumo.saldoLiquido = resumo.totalEntradas - resumo.totalSaidas;

  useEffect(() => {
    carregarTransacoes();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">💰 Sistema Financeiro COMPLETO</h1>
          <p className="text-gray-600">Sistema financeiro de classe mundial com todas as funcionalidades</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={carregarTransacoes} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowModal(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="transacoes" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span>Transações</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center space-x-2">
            <PieChart className="h-4 w-4" />
            <span>Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="contas" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Contas</span>
          </TabsTrigger>
          <TabsTrigger value="automatizacoes" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Automações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes" className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">💰 Entradas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {resumo.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">💸 Saídas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {resumo.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">📊 Saldo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${resumo.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {resumo.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">📋 Total</CardTitle>
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
              <CardTitle>📋 Transações ({resumo.totalTransacoes})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando...</p>
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
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transacoes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-500">
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
                              <Badge className={transacao.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                                {transacao.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                              </Badge>
                            </TableCell>
                            <TableCell className={`font-semibold ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {transacao.tipo === 'entrada' ? '+' : '-'}R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {transacao.status === 'Pago' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {transacao.status === 'Pendente' && <Clock className="h-4 w-4 text-yellow-600" />}
                                {transacao.status === 'Atrasado' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                <Badge className={
                                  transacao.status === 'Pago' ? 'bg-green-100 text-green-800' :
                                  transacao.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {transacao.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => excluirTransacao(transacao.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
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
        </TabsContent>

        <TabsContent value="dashboard">
          <AdvancedFinancialDashboard />
        </TabsContent>

        <TabsContent value="categorias">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="fornecedores">
          <SupplierClientManager />
        </TabsContent>

        <TabsContent value="contas">
          <AccountCardManager />
        </TabsContent>

        <TabsContent value="automatizacoes">
          <AutomationIntegrationManager />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>➕ Nova Transação</CardTitle>
              <CardDescription>Preencha os dados da nova transação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Venda de produtos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="entrada">💰 Entrada</SelectItem>
                      <SelectItem value="saida">💸 Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label htmlFor="origem">Origem</Label>
                <Input
                  id="origem"
                  value={formData.origem}
                  onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                  placeholder="Ex: Cliente, Fornecedor"
                />
              </div>

              <div>
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
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarTransacao} className="bg-green-600 hover:bg-green-700">
                💾 Salvar Transação
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
