import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  CreditCard, 
  Building,
  Search,
  DollarSign,
  Save,
  X,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface ContaBancaria {
  id: number;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento';
  saldo: number;
  limite: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
  ultimaMovimentacao: string;
  observacoes: string;
  criadoEm: string;
}

interface Cartao {
  id: number;
  nome: string;
  numero: string;
  bandeira: string;
  limite: number;
  faturaAtual: number;
  vencimento: string;
  status: 'ativo' | 'inativo' | 'bloqueado';
  tipo: 'credito' | 'debito' | 'prepago';
  observacoes: string;
  criadoEm: string;
}

export default function AccountCardManager() {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [cartoes, setCartoes] = useState<Cartao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('contas');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ContaBancaria | Cartao | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [formData, setFormData] = useState<any>({});

  const bancos = [
    'Banco do Brasil', 'Caixa Econômica', 'Bradesco', 'Itaú', 'Santander',
    'Nubank', 'Inter', 'C6 Bank', 'Original', 'BTG Pactual'
  ];

  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('💳 Carregando contas e cartões...');

      // Carregar contas bancárias da API
      const contasResponse = await fetch('/api/financial/contas');
      if (contasResponse.ok) {
        const contasData = await contasResponse.json();
        const contasFormatadas = contasData.contas.map((conta: any) => ({
          id: conta.id,
          nome: conta.nome,
          banco: conta.banco,
          agencia: conta.agencia,
          conta: conta.conta,
          tipo: conta.tipo,
          saldo: parseFloat(conta.saldo) || 0,
          limite: parseFloat(conta.limite) || 0,
          status: conta.status,
          ultimaMovimentacao: conta.ultima_movimentacao,
          observacoes: conta.observacoes,
          criadoEm: conta.created_at
        }));
        setContas(contasFormatadas);
        console.log('✅ Contas carregadas:', contasFormatadas.length);
      } else {
        console.error('❌ Erro ao carregar contas:', contasResponse.status);
        toast.error('Erro ao carregar contas bancárias');
      }

      // Carregar cartões da API
      const cartoesResponse = await fetch('/api/financial/cartoes');
      if (cartoesResponse.ok) {
        const cartoesData = await cartoesResponse.json();
        const cartoesFormatados = cartoesData.cartoes.map((cartao: any) => ({
          id: cartao.id,
          nome: cartao.nome,
          numero: cartao.numero,
          bandeira: cartao.bandeira,
          limite: parseFloat(cartao.limite) || 0,
          faturaAtual: parseFloat(cartao.fatura_atual) || 0,
          vencimento: cartao.vencimento,
          status: cartao.status,
          tipo: cartao.tipo,
          observacoes: cartao.observacoes,
          criadoEm: cartao.created_at
        }));
        setCartoes(cartoesFormatados);
        console.log('✅ Cartões carregados:', cartoesFormatados.length);
      } else {
        console.error('❌ Erro ao carregar cartões:', cartoesResponse.status);
        toast.error('Erro ao carregar cartões');
      }

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const abrirModal = (tipo: 'conta' | 'cartao', item?: ContaBancaria | Cartao) => {
    setEditingItem(item || null);
    setFormData(item ? { ...item } : {
      nome: '',
      banco: '',
      agencia: '',
      conta: '',
      tipo: 'corrente',
      saldo: 0,
      limite: 0,
      status: 'ativo',
      observacoes: '',
      // Campos específicos de cartão
      numero: '',
      bandeira: 'Visa',
      faturaAtual: 0,
      vencimento: ''
    });
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditingItem(null);
    setFormData({});
  };

  const salvarItem = async () => {
    try {
      if (activeTab === 'contas') {
        const contaData = {
          nome: formData.nome,
          banco: formData.banco,
          agencia: formData.agencia,
          conta: formData.conta,
          tipo: formData.tipo,
          saldo: parseFloat(formData.saldo) || 0,
          limite: parseFloat(formData.limite) || 0,
          status: formData.status,
          observacoes: formData.observacoes || ''
        };

        const url = editingItem ? `/api/financial/contas/${editingItem.id}` : '/api/financial/contas';
        const method = editingItem ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contaData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao salvar conta');
        }

        toast.success(editingItem ? 'Conta atualizada com sucesso!' : 'Conta criada com sucesso!');
      } else {
        const cartaoData = {
          nome: formData.nome,
          numero: formData.numero,
          bandeira: formData.bandeira,
          limite: parseFloat(formData.limite) || 0,
          fatura_atual: parseFloat(formData.faturaAtual) || 0,
          vencimento: formData.vencimento,
          status: formData.status,
          tipo: formData.tipo,
          observacoes: formData.observacoes || ''
        };

        const url = editingItem ? `/api/financial/cartoes/${editingItem.id}` : '/api/financial/cartoes';
        const method = editingItem ? 'PUT' : 'POST';

        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cartaoData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Erro ao salvar cartão');
        }

        toast.success(editingItem ? 'Cartão atualizado com sucesso!' : 'Cartão criado com sucesso!');
      }

      fecharModal();
      await carregarDados(); // Recarregar dados da API
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar item');
    }
  };

  const excluirItem = async (id: number, tipo: 'conta' | 'cartao') => {
    if (window.confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const url = tipo === 'conta' ? `/api/financial/contas/${id}` : `/api/financial/cartoes/${id}`;
        
        const response = await fetch(url, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Erro ao excluir ${tipo}`);
        }

        toast.success(tipo === 'conta' ? 'Conta excluída com sucesso!' : 'Cartão excluído com sucesso!');
        await carregarDados(); // Recarregar dados da API
      } catch (error) {
        console.error('Erro ao excluir:', error);
        toast.error(error instanceof Error ? error.message : `Erro ao excluir ${tipo}`);
      }
    }
  };

  const filtrarContas = () => {
    return contas.filter(conta => {
      const matchBusca = conta.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        conta.banco.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'todos' || conta.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  };

  const filtrarCartoes = () => {
    return cartoes.filter(cartao => {
      const matchBusca = cartao.nome.toLowerCase().includes(busca.toLowerCase()) ||
                        cartao.bandeira.toLowerCase().includes(busca.toLowerCase());
      const matchStatus = filtroStatus === 'todos' || cartao.status === filtroStatus;
      return matchBusca && matchStatus;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inativo':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'bloqueado':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: 'bg-green-100 text-green-800',
      inativo: 'bg-yellow-100 text-yellow-800',
      bloqueado: 'bg-red-100 text-red-800'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando contas e cartões...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="h-6 w-6 text-blue-600" />
            Gerenciamento de Contas e Cartões
          </h2>
          <p className="text-gray-600">Gerencie suas contas bancárias e cartões de crédito</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => abrirModal('conta')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
          <Button onClick={() => abrirModal('cartao')} className="bg-green-600 hover:bg-green-700">
            <CreditCard className="h-4 w-4 mr-2" />
            Novo Cartão
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar contas ou cartões..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="bloqueado">Bloqueado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="contas" className="flex items-center gap-2">
            <Building className="h-4 w-4" />
            Contas Bancárias ({contas.length})
          </TabsTrigger>
          <TabsTrigger value="cartoes" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Cartões ({cartoes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="space-y-4">
          {filtrarContas().length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhuma conta encontrada</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtrarContas().map((conta) => (
                <Card key={conta.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{conta.nome}</CardTitle>
                        <CardDescription>{conta.banco}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(conta.status)}
                        <Badge className={getStatusBadge(conta.status)}>
                          {conta.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Agência:</span>
                        <p className="font-medium">{conta.agencia}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Conta:</span>
                        <p className="font-medium">{conta.conta}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Saldo:</span>
                        <span className="font-semibold text-green-600">
                          R$ {conta.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {conta.limite > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Limite:</span>
                          <span className="font-semibold text-blue-600">
                            R$ {conta.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirModal('conta', conta)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => excluirItem(conta.id, 'conta')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cartoes" className="space-y-4">
          {filtrarCartoes().length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Nenhum cartão encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtrarCartoes().map((cartao) => (
                <Card key={cartao.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cartao.nome}</CardTitle>
                        <CardDescription>{cartao.bandeira}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(cartao.status)}
                        <Badge className={getStatusBadge(cartao.status)}>
                          {cartao.status}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div>
                        <span className="text-gray-500">Número:</span>
                        <p className="font-medium">{cartao.numero}</p>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Limite:</span>
                        <span className="font-semibold text-blue-600">
                          R$ {cartao.limite.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      {cartao.limite > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fatura Atual:</span>
                          <span className="font-semibold text-red-600">
                            R$ {cartao.faturaAtual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Vencimento:</span>
                        <span className="font-medium">{cartao.vencimento}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => abrirModal('cartao', cartao)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => excluirItem(cartao.id, 'cartao')}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingItem ? (
                  <>
                    <Edit className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-600">
                      {activeTab === 'contas' ? 'Editar Conta' : 'Editar Cartão'}
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">
                      {activeTab === 'contas' ? 'Nova Conta' : 'Novo Cartão'}
                    </span>
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {activeTab === 'contas' 
                  ? 'Preencha os dados da conta bancária'
                  : 'Preencha os dados do cartão'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Conta Principal"
                  />
                </div>
                
                {activeTab === 'contas' ? (
                  <>
                    <div>
                      <Label htmlFor="banco">Banco *</Label>
                      <Select value={formData.banco || ''} onValueChange={(value) => setFormData({ ...formData, banco: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o banco" />
                        </SelectTrigger>
                        <SelectContent>
                          {bancos.map((banco) => (
                            <SelectItem key={banco} value={banco}>{banco}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="agencia">Agência *</Label>
                      <Input
                        id="agencia"
                        value={formData.agencia || ''}
                        onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                        placeholder="Ex: 1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="conta">Conta *</Label>
                      <Input
                        id="conta"
                        value={formData.conta || ''}
                        onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                        placeholder="Ex: 12345-6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select value={formData.tipo || 'corrente'} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="corrente">Conta Corrente</SelectItem>
                          <SelectItem value="poupanca">Poupança</SelectItem>
                          <SelectItem value="investimento">Investimento</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="saldo">Saldo Atual</Label>
                      <Input
                        id="saldo"
                        type="number"
                        step="0.01"
                        value={formData.saldo || ''}
                        onChange={(e) => setFormData({ ...formData, saldo: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="limite">Limite</Label>
                      <Input
                        id="limite"
                        type="number"
                        step="0.01"
                        value={formData.limite || ''}
                        onChange={(e) => setFormData({ ...formData, limite: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="numero">Número do Cartão *</Label>
                      <Input
                        id="numero"
                        value={formData.numero || ''}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        placeholder="**** **** **** 1234"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bandeira">Bandeira *</Label>
                      <Select value={formData.bandeira || 'Visa'} onValueChange={(value) => setFormData({ ...formData, bandeira: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Visa">Visa</SelectItem>
                          <SelectItem value="Mastercard">Mastercard</SelectItem>
                          <SelectItem value="American Express">American Express</SelectItem>
                          <SelectItem value="Elo">Elo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="limite">Limite</Label>
                      <Input
                        id="limite"
                        type="number"
                        step="0.01"
                        value={formData.limite || ''}
                        onChange={(e) => setFormData({ ...formData, limite: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="faturaAtual">Fatura Atual</Label>
                      <Input
                        id="faturaAtual"
                        type="number"
                        step="0.01"
                        value={formData.faturaAtual || ''}
                        onChange={(e) => setFormData({ ...formData, faturaAtual: e.target.value })}
                        placeholder="0,00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="vencimento">Vencimento</Label>
                      <Input
                        id="vencimento"
                        type="date"
                        value={formData.vencimento || ''}
                        onChange={(e) => setFormData({ ...formData, vencimento: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="tipo">Tipo *</Label>
                      <Select value={formData.tipo || 'credito'} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="credito">Crédito</SelectItem>
                          <SelectItem value="debito">Débito</SelectItem>
                          <SelectItem value="prepago">Pré-pago</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status || 'ativo'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Input
                  id="observacoes"
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  placeholder="Observações adicionais..."
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={fecharModal}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={salvarItem} className="bg-green-600 hover:bg-green-700">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}