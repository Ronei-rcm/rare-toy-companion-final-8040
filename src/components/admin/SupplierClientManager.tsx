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
  Building, 
  Users,
  Search,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Calendar,
  Eye,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

interface Fornecedor {
  id: number;
  nome: string;
  cnpj: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  contato: string;
  tipo: 'brinquedos' | 'material_escolar' | 'outros';
  status: 'ativo' | 'inativo' | 'suspenso';
  totalCompras: number;
  valorTotal: number;
  ultimaCompra: string;
  observacoes: string;
  criadoEm: string;
}

interface Cliente {
  id: number;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  dataNascimento: string;
  tipo: 'pessoa_fisica' | 'pessoa_juridica';
  status: 'ativo' | 'inativo';
  totalCompras: number;
  valorTotal: number;
  ultimaCompra: string;
  observacoes: string;
  criadoEm: string;
}

export default function SupplierClientManager() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fornecedores');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Fornecedor | Cliente | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [formData, setFormData] = useState<any>({});
  const [buscandoCep, setBuscandoCep] = useState(false);

  const carregarFornecedores = async () => {
    try {
      console.log('🏢 Carregando fornecedores da API...');
      const response = await fetch('/api/financial/fornecedores');
      if (!response.ok) {
        throw new Error('Erro ao buscar fornecedores');
      }

      const data = await response.json();
      console.log('📦 Fornecedores recebidos da API:', data);

      // Transformar dados da API para o formato esperado
      const fornecedoresFormatados: Fornecedor[] = (data.fornecedores || []).map((forn: any) => ({
        id: forn.id,
        nome: forn.nome,
        cnpj: forn.cnpj || '',
        email: forn.email || '',
        telefone: forn.telefone || '',
        endereco: forn.endereco || '',
        cidade: forn.cidade || '',
        estado: forn.estado || '',
        cep: forn.cep || '',
        contato: forn.contato || '',
        tipo: forn.tipo || 'outros',
        status: forn.status || 'ativo',
        totalCompras: 0,
        valorTotal: 0,
        ultimaCompra: '',
        observacoes: forn.observacoes || '',
        criadoEm: forn.created_at ? new Date(forn.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      setFornecedores(fornecedoresFormatados);
      console.log('✅ Fornecedores carregados:', fornecedoresFormatados.length);
    } catch (error) {
      console.error('❌ Erro ao carregar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores da API');
    }
  };

  const carregarClientes = async () => {
    try {
      console.log('👥 Carregando clientes da API...');
      const response = await fetch('/api/financial/clientes');
      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      const data = await response.json();
      console.log('📦 Clientes recebidos da API:', data);

      // Transformar dados da API para o formato esperado
      const clientesFormatados: Cliente[] = (data.clientes || []).map((cli: any) => ({
        id: cli.id,
        nome: cli.nome,
        cpf: cli.cpf || '',
        email: cli.email || '',
        telefone: cli.telefone || '',
        endereco: cli.endereco || '',
        cidade: cli.cidade || '',
        estado: cli.estado || '',
        cep: cli.cep || '',
        dataNascimento: cli.data_nascimento || '',
        tipo: cli.tipo || 'pessoa_fisica',
        status: cli.status || 'ativo',
        totalCompras: 0,
        valorTotal: 0,
        ultimaCompra: '',
        observacoes: cli.observacoes || '',
        criadoEm: cli.criado_em ? new Date(cli.criado_em).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      setClientes(clientesFormatados);
      console.log('✅ Clientes carregados:', clientesFormatados.length);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      toast.error('Erro ao carregar clientes da API');
    }
  };

  const carregarDados = async () => {
    setLoading(true);
    await Promise.all([carregarFornecedores(), carregarClientes()]);
    setLoading(false);
  };

  const salvarItem = async () => {
    try {
      if (!formData.nome?.trim()) {
        toast.error(`Nome do ${activeTab === 'fornecedores' ? 'fornecedor' : 'cliente'} é obrigatório`);
        return;
      }

      const endpoint = activeTab === 'fornecedores' 
        ? '/api/financial/fornecedores' 
        : '/api/financial/clientes';

      let response;

      if (editingItem) {
        // Atualizar item existente
        console.log(`📝 Atualizando ${activeTab} ID:`, editingItem.id);
        response = await fetch(`${endpoint}/${editingItem.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: formData.nome,
            cnpj: formData.cnpj,
            cpf: formData.cpf,
            email: formData.email,
            telefone: formData.telefone,
            endereco: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: formData.cep,
            contato: formData.contato,
            data_nascimento: formData.dataNascimento,
            tipo: formData.tipo,
            status: formData.status,
            observacoes: formData.observacoes
          })
        });
      } else {
        // Criar novo item
        console.log(`➕ Criando novo ${activeTab}`);
        response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: formData.nome,
            cnpj: formData.cnpj,
            cpf: formData.cpf,
            email: formData.email,
            telefone: formData.telefone,
            endereco: formData.endereco,
            cidade: formData.cidade,
            estado: formData.estado,
            cep: formData.cep,
            contato: formData.contato,
            data_nascimento: formData.dataNascimento,
            tipo: formData.tipo,
            status: formData.status,
            observacoes: formData.observacoes
          })
        });
      }

      if (!response.ok) {
        throw new Error(`Erro ao salvar ${activeTab}`);
      }

      const result = await response.json();
      console.log(`✅ ${activeTab} salvo:`, result);

      // Recarregar dados
      if (activeTab === 'fornecedores') {
        await carregarFornecedores();
        toast.success(editingItem ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor criado com sucesso!');
      } else {
        await carregarClientes();
        toast.success(editingItem ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
      }

      setShowModal(false);
      resetForm();

    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast.error('Erro ao salvar dados');
    }
  };

  const excluirItem = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const endpoint = activeTab === 'fornecedores' 
        ? `/api/financial/fornecedores/${id}` 
        : `/api/financial/clientes/${id}`;
      
      console.log(`🗑️ Excluindo ${activeTab} ID:`, id);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao excluir ${activeTab}`);
      }

      const result = await response.json();
      console.log(`✅ ${activeTab} excluído:`, result);
      
      // Atualizar o estado local
      if (activeTab === 'fornecedores') {
        setFornecedores(fornecedores.filter(f => f.id !== id));
        toast.success('Fornecedor excluído com sucesso!');
      } else {
        setClientes(clientes.filter(c => c.id !== id));
        toast.success('Cliente excluído com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
  };

  const abrirModalEdicao = (item: Fornecedor | Cliente) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const abrirModalNovo = () => {
    resetForm();
    setShowModal(true);
  };

  const sanitizeCep = (value: string) => value.replace(/\D/g, '');

  const preencherEnderecoPorCep = async () => {
    const cepLimpo = sanitizeCep(formData.cep || '');
    if (!cepLimpo || cepLimpo.length !== 8) {
      toast.error('Informe um CEP válido com 8 dígitos');
      return;
    }

    try {
      setBuscandoCep(true);
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!response.ok) throw new Error('Erro ao buscar CEP');
      const data = await response.json();

      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData((prev: any) => ({
        ...prev,
        cep: data.cep || prev.cep,
        endereco: data.logradouro ? `${data.logradouro}${data.bairro ? `, ${data.bairro}` : ''}` : prev.endereco,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado
      }));

      toast.success('Endereço preenchido pelo CEP');
    } catch (error) {
      console.error('❌ Erro ao buscar CEP:', error);
      toast.error('Não foi possível buscar o CEP agora');
    } finally {
      setBuscandoCep(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inativo': return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case 'suspenso': return <Clock className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'suspenso': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const itensFiltrados = activeTab === 'fornecedores' 
    ? fornecedores.filter(fornecedor => {
        const matchBusca = fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
                          fornecedor.email.toLowerCase().includes(busca.toLowerCase()) ||
                          fornecedor.cnpj.includes(busca);
        const matchStatus = filtroStatus === 'todos' || fornecedor.status === filtroStatus;
        return matchBusca && matchStatus;
      })
    : clientes.filter(cliente => {
        const matchBusca = cliente.nome.toLowerCase().includes(busca.toLowerCase()) ||
                          cliente.email.toLowerCase().includes(busca.toLowerCase()) ||
                          cliente.cpf.includes(busca);
        const matchStatus = filtroStatus === 'todos' || cliente.status === filtroStatus;
        return matchBusca && matchStatus;
      });

  useEffect(() => {
    carregarDados();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando dados...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">👥 Gestão de Fornecedores e Clientes</h2>
          <p className="text-gray-600">Gerencie seus fornecedores e clientes de forma completa</p>
        </div>
        
        <Button onClick={abrirModalNovo} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'fornecedores' ? 'Novo Fornecedor' : 'Novo Cliente'}
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Buscar ${activeTab === 'fornecedores' ? 'fornecedores' : 'clientes'}...`}
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filtroStatus} onValueChange={setFiltroStatus}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
            <SelectItem value="suspenso">Suspenso</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="fornecedores" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span>Fornecedores ({fornecedores.length})</span>
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Clientes ({clientes.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fornecedores" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {itensFiltrados.map((fornecedor) => (
              <Card key={fornecedor.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Building className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{fornecedor.nome}</CardTitle>
                        <CardDescription className="text-sm">{fornecedor.cnpj}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEdicao(fornecedor)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => excluirItem(fornecedor.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Status e Tipo */}
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(fornecedor.status)}>
                        {getStatusIcon(fornecedor.status)}
                        <span className="ml-1 capitalize">{fornecedor.status}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {fornecedor.tipo.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Contato */}
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{fornecedor.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{fornecedor.telefone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{fornecedor.cidade}, {fornecedor.estado}</span>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-gray-900">{fornecedor.totalCompras}</div>
                        <div className="text-gray-600">Compras</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-green-600">
                          R$ {fornecedor.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-gray-600">Total</div>
                      </div>
                    </div>

                    {/* Última Compra */}
                    <div className="text-xs text-gray-500">
                      Última compra: {new Date(fornecedor.ultimaCompra).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {itensFiltrados.map((cliente) => (
              <Card key={cliente.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cliente.nome}</CardTitle>
                        <CardDescription className="text-sm">{cliente.cpf}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEdicao(cliente)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => excluirItem(cliente.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Status e Tipo */}
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(cliente.status)}>
                        {getStatusIcon(cliente.status)}
                        <span className="ml-1 capitalize">{cliente.status}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {cliente.tipo.replace('_', ' ')}
                      </Badge>
                    </div>

                    {/* Contato */}
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{cliente.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{cliente.telefone}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span>{cliente.cidade}, {cliente.estado}</span>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-gray-900">{cliente.totalCompras}</div>
                        <div className="text-gray-600">Compras</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <div className="font-bold text-green-600">
                          R$ {cliente.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-gray-600">Total</div>
                      </div>
                    </div>

                    {/* Última Compra */}
                    <div className="text-xs text-gray-500">
                      Última compra: {new Date(cliente.ultimaCompra).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>
                {editingItem ? '✏️ Editar' : '➕ Novo'} {activeTab === 'fornecedores' ? 'Fornecedor' : 'Cliente'}
              </CardTitle>
              <CardDescription>
                {editingItem ? 'Atualize os dados' : 'Preencha os dados do novo item'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder={activeTab === 'fornecedores' ? 'Nome da empresa' : 'Nome completo'}
                  />
                </div>

                <div>
                  <Label htmlFor={activeTab === 'fornecedores' ? 'cnpj' : 'cpf'}>
                    {activeTab === 'fornecedores' ? 'CNPJ' : 'CPF'} *
                  </Label>
                  <Input
                    id={activeTab === 'fornecedores' ? 'cnpj' : 'cpf'}
                    value={formData[activeTab === 'fornecedores' ? 'cnpj' : 'cpf'] || ''}
                    onChange={(e) => setFormData({ ...formData, [activeTab === 'fornecedores' ? 'cnpj' : 'cpf']: e.target.value })}
                    placeholder={activeTab === 'fornecedores' ? '00.000.000/0000-00' : '000.000.000-00'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>

                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone || ''}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco || ''}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  placeholder="Rua, número, bairro"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade || ''}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    placeholder="Cidade"
                  />
                </div>

                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado || ''}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    placeholder="SP"
                  />
                </div>

                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      id="cep"
                      value={formData.cep || ''}
                      onChange={(e) => setFormData({ ...formData, cep: e.target.value })}
                      onBlur={() => formData.cep && formData.cep.length >= 8 ? preencherEnderecoPorCep() : undefined}
                      placeholder="00000-000"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={preencherEnderecoPorCep}
                      disabled={buscandoCep}
                      className="shrink-0"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      {buscandoCep ? 'Buscando...' : 'Buscar'}
                    </Button>
                  </div>
                </div>
              </div>

              {activeTab === 'fornecedores' && (
                <div>
                  <Label htmlFor="contato">Contato</Label>
                  <Input
                    id="contato"
                    value={formData.contato || ''}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </div>
              )}

              {activeTab === 'clientes' && (
                <div>
                  <Label htmlFor="dataNascimento">Data de Nascimento</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento || ''}
                    onChange={(e) => setFormData({ ...formData, dataNascimento: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo || ''} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === 'fornecedores' ? (
                        <>
                          <SelectItem value="brinquedos">Brinquedos</SelectItem>
                          <SelectItem value="material_escolar">Material Escolar</SelectItem>
                          <SelectItem value="outros">Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="pessoa_fisica">Pessoa Física</SelectItem>
                          <SelectItem value="pessoa_juridica">Pessoa Jurídica</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status || 'ativo'} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      {activeTab === 'fornecedores' && <SelectItem value="suspenso">Suspenso</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes || ''}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Informações adicionais"
                />
              </div>
            </CardContent>
            
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowModal(false)}>
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
