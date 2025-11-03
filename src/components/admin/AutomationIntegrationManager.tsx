import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Zap,
  Search,
  Save,
  X,
  Play,
  Pause,
  RefreshCw,
  Download,
  Upload,
  Bell,
  Shield,
  Link,
  Database,
  Cloud,
  Smartphone,
  Mail,
  MessageSquare,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface Automacao {
  id: number;
  nome: string;
  descricao: string;
  tipo: 'email' | 'sms' | 'webhook' | 'backup' | 'relatorio';
  status: 'ativo' | 'inativo' | 'pausado';
  frequencia: 'diario' | 'semanal' | 'mensal' | 'instantaneo';
  ultimaExecucao: string;
  proximaExecucao: string;
  configuracoes: any;
  criadoEm: string;
}

interface Integracao {
  id: number;
  nome: string;
  descricao: string;
  tipo: 'api' | 'webhook' | 'importacao' | 'exportacao';
  status: 'conectado' | 'desconectado' | 'erro';
  ultimaSincronizacao: string;
  configuracoes: any;
  criadoEm: string;
}

export default function AutomationIntegrationManager() {
  const [automacoes, setAutomacoes] = useState<Automacao[]>([]);
  const [integracoes, setIntegracoes] = useState<Integracao[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('automacoes');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Automacao | Integracao | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [formData, setFormData] = useState<any>({});

  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('⚙️ Carregando automações e integrações...');

      // Simular dados de automações
      const automacoesSimuladas: Automacao[] = [
        {
          id: 1,
          nome: 'Relatório Semanal',
          descricao: 'Envio automático de relatório financeiro semanal',
          tipo: 'relatorio',
          status: 'ativo',
          frequencia: 'semanal',
          ultimaExecucao: '2025-10-15',
          proximaExecucao: '2025-10-22',
          configuracoes: {
            destinatarios: ['admin@empresa.com', 'financeiro@empresa.com'],
            formato: 'pdf',
            incluirGraficos: true
          },
          criadoEm: '2025-01-15'
        },
        {
          id: 2,
          nome: 'Backup Diário',
          descricao: 'Backup automático dos dados financeiros',
          tipo: 'backup',
          status: 'ativo',
          frequencia: 'diario',
          ultimaExecucao: '2025-10-15',
          proximaExecucao: '2025-10-16',
          configuracoes: {
            destino: 'cloud',
            retencao: 30,
            criptografia: true
          },
          criadoEm: '2025-02-20'
        },
        {
          id: 3,
          nome: 'Notificação de Vencimentos',
          descricao: 'Lembretes de vencimentos de cartões e contas',
          tipo: 'email',
          status: 'pausado',
          frequencia: 'diario',
          ultimaExecucao: '2025-10-10',
          proximaExecucao: '2025-10-16',
          configuracoes: {
            diasAntecedencia: 3,
            destinatarios: ['admin@empresa.com']
          },
          criadoEm: '2025-03-10'
        }
      ];

      // Simular dados de integrações
      const integracoesSimuladas: Integracao[] = [
        {
          id: 1,
          nome: 'Mercado Pago',
          descricao: 'Integração com gateway de pagamento',
          tipo: 'api',
          status: 'conectado',
          ultimaSincronizacao: '2025-10-15',
          configuracoes: {
            apiKey: '***',
            webhookUrl: 'https://empresa.com/webhook/mercadopago',
            ambiente: 'producao'
          },
          criadoEm: '2025-01-15'
        },
        {
          id: 2,
          nome: 'Importação de Extratos',
          descricao: 'Importação automática de extratos bancários',
          tipo: 'importacao',
          status: 'conectado',
          ultimaSincronizacao: '2025-10-15',
          configuracoes: {
            bancos: ['        Banco do Brasil', 'Nubank', 'Itaú'],
            formato: 'ofx',
            frequencia: 'diario'
          },
          criadoEm: '2025-02-20'
        },
        {
          id: 3,
          nome: 'WhatsApp Business',
          descricao: 'Integração com WhatsApp para notificações',
          tipo: 'webhook',
          status: 'erro',
          ultimaSincronizacao: '2025-10-10',
          configuracoes: {
            token: '***',
            webhookUrl: 'https://empresa.com/webhook/whatsapp',
            numero: '+5511999999999'
          },
          criadoEm: '2025-03-10'
        }
      ];

      setAutomacoes(automacoesSimuladas);
      setIntegracoes(integracoesSimuladas);
      console.log('✅ Dados carregados:', { automacoes: automacoesSimuladas.length, integracoes: integracoesSimuladas.length });

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const salvarItem = async () => {
    try {
      if (activeTab === 'automacoes') {
        if (!formData.nome?.trim()) {
          toast.error('Nome da automação é obrigatório');
          return;
        }

        const novaAutomacao: Automacao = {
          id: editingItem?.id || Date.now(),
          nome: formData.nome,
          descricao: formData.descricao || '',
          tipo: formData.tipo || 'email',
          status: formData.status || 'ativo',
          frequencia: formData.frequencia || 'diario',
          ultimaExecucao: editingItem ? (editingItem as Automacao).ultimaExecucao : '',
          proximaExecucao: editingItem ? (editingItem as Automacao).proximaExecucao : '',
          configuracoes: formData.configuracoes || {},
          criadoEm: editingItem ? (editingItem as Automacao).criadoEm : new Date().toISOString().split('T')[0]
        };

        if (editingItem) {
          setAutomacoes(automacoes.map(a => a.id === editingItem.id ? novaAutomacao : a));
          toast.success('Automação atualizada com sucesso!');
        } else {
          setAutomacoes([...automacoes, novaAutomacao]);
          toast.success('Automação criada com sucesso!');
        }
      } else {
        if (!formData.nome?.trim()) {
          toast.error('Nome da integração é obrigatório');
          return;
        }

        const novaIntegracao: Integracao = {
          id: editingItem?.id || Date.now(),
          nome: formData.nome,
          descricao: formData.descricao || '',
          tipo: formData.tipo || 'api',
          status: formData.status || 'conectado',
          ultimaSincronizacao: editingItem ? (editingItem as Integracao).ultimaSincronizacao : '',
          configuracoes: formData.configuracoes || {},
          criadoEm: editingItem ? (editingItem as Integracao).criadoEm : new Date().toISOString().split('T')[0]
        };

        if (editingItem) {
          setIntegracoes(integracoes.map(i => i.id === editingItem.id ? novaIntegracao : i));
          toast.success('Integração atualizada com sucesso!');
        } else {
          setIntegracoes([...integracoes, novaIntegracao]);
          toast.success('Integração criada com sucesso!');
        }
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
      if (activeTab === 'automacoes') {
        setAutomacoes(automacoes.filter(a => a.id !== id));
        toast.success('Automação excluída com sucesso!');
      } else {
        setIntegracoes(integracoes.filter(i => i.id !== id));
        toast.success('Integração excluída com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao excluir:', error);
      toast.error('Erro ao excluir item');
    }
  };

  const toggleStatus = async (id: number) => {
    try {
      if (activeTab === 'automacoes') {
        setAutomacoes(automacoes.map(a => 
          a.id === id 
            ? { ...a, status: a.status === 'ativo' ? 'inativo' : 'ativo' }
            : a
        ));
        toast.success('Status da automação atualizado!');
      } else {
        setIntegracoes(integracoes.map(i => 
          i.id === id 
            ? { ...i, status: i.status === 'conectado' ? 'desconectado' : 'conectado' }
            : i
        ));
        toast.success('Status da integração atualizado!');
      }
    } catch (error) {
      console.error('❌ Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const resetForm = () => {
    setFormData({});
    setEditingItem(null);
  };

  const abrirModalEdicao = (item: Automacao | Integracao) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const abrirModalNovo = () => {
    resetForm();
    setShowModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'conectado': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inativo':
      case 'desconectado': return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case 'pausado': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'erro': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
      case 'conectado': return 'bg-green-100 text-green-800';
      case 'inativo':
      case 'desconectado': return 'bg-gray-100 text-gray-800';
      case 'pausado': return 'bg-yellow-100 text-yellow-800';
      case 'erro': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      case 'webhook': return <Link className="h-4 w-4" />;
      case 'backup': return <Database className="h-4 w-4" />;
      case 'relatorio': return <TrendingUp className="h-4 w-4" />;
      case 'api': return <Cloud className="h-4 w-4" />;
      case 'importacao': return <Download className="h-4 w-4" />;
      case 'exportacao': return <Upload className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const itensFiltrados = activeTab === 'automacoes' 
    ? automacoes.filter(automacao => {
        const matchBusca = automacao.nome.toLowerCase().includes(busca.toLowerCase()) ||
                          automacao.descricao.toLowerCase().includes(busca.toLowerCase());
        const matchStatus = filtroStatus === 'todos' || automacao.status === filtroStatus;
        return matchBusca && matchStatus;
      })
    : integracoes.filter(integracao => {
        const matchBusca = integracao.nome.toLowerCase().includes(busca.toLowerCase()) ||
                          integracao.descricao.toLowerCase().includes(busca.toLowerCase());
        const matchStatus = filtroStatus === 'todos' || integracao.status === filtroStatus;
        return matchBusca && matchStatus;
      });

  const automacoesAtivas = automacoes.filter(a => a.status === 'ativo').length;
  const integracoesConectadas = integracoes.filter(i => i.status === 'conectado').length;

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">⚙️ Automações e Integrações</h2>
          <p className="text-gray-600">Automatize processos e integre com sistemas externos</p>
        </div>
        
        <Button onClick={abrirModalNovo} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          {activeTab === 'automacoes' ? 'Nova Automação' : 'Nova Integração'}
        </Button>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Zap className="h-4 w-4 mr-2 text-yellow-600" />
              Automações Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{automacoesAtivas}</div>
            <p className="text-xs text-gray-500 mt-1">
              de {automacoes.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Link className="h-4 w-4 mr-2 text-blue-600" />
              Integrações Conectadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{integracoesConectadas}</div>
            <p className="text-xs text-gray-500 mt-1">
              de {integracoes.length} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="h-4 w-4 mr-2 text-green-600" />
              Última Execução
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Hoje</div>
            <p className="text-xs text-gray-500 mt-1">
              15:30 - Backup Diário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Shield className="h-4 w-4 mr-2 text-purple-600" />
              Sistema Seguro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <p className="text-xs text-gray-500 mt-1">
              Todas as integrações seguras
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={`Buscar ${activeTab === 'automacoes' ? 'automações' : 'integrações'}...`}
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
            <SelectItem value="conectado">Conectado</SelectItem>
            <SelectItem value="desconectado">Desconectado</SelectItem>
            <SelectItem value="erro">Erro</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="automacoes" className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <span>Automações ({automacoes.length})</span>
          </TabsTrigger>
          <TabsTrigger value="integracoes" className="flex items-center space-x-2">
            <Link className="h-4 w-4" />
            <span>Integrações ({integracoes.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="automacoes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {itensFiltrados.map((automacao) => (
              <Card key={automacao.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                        {getTipoIcon(automacao.tipo)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{automacao.nome}</CardTitle>
                        <CardDescription className="text-sm">{automacao.descricao}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(automacao.id)}
                        className={`${automacao.status === 'ativo' ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        {automacao.status === 'ativo' ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEdicao(automacao)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => excluirItem(automacao.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Status e Frequência */}
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(automacao.status)}>
                        {getStatusIcon(automacao.status)}
                        <span className="ml-1 capitalize">{automacao.status}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {automacao.frequencia}
                      </Badge>
                    </div>

                    {/* Execuções */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última execução:</span>
                        <span className="font-medium">{new Date(automacao.ultimaExecucao).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Próxima execução:</span>
                        <span className="font-medium">{new Date(automacao.proximaExecucao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Configurações */}
                    <div className="text-xs text-gray-500">
                      Tipo: {automacao.tipo} • Criado em {new Date(automacao.criadoEm).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="integracoes" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {itensFiltrados.map((integracao) => (
              <Card key={integracao.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        {getTipoIcon(integracao.tipo)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integracao.nome}</CardTitle>
                        <CardDescription className="text-sm">{integracao.descricao}</CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleStatus(integracao.id)}
                        className={`${integracao.status === 'conectado' ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50'}`}
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirModalEdicao(integracao)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => excluirItem(integracao.id)}
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
                      <Badge className={getStatusColor(integracao.status)}>
                        {getStatusIcon(integracao.status)}
                        <span className="ml-1 capitalize">{integracao.status}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {integracao.tipo}
                      </Badge>
                    </div>

                    {/* Última Sincronização */}
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Última sincronização:</span>
                        <span className="font-medium">{new Date(integracao.ultimaSincronizacao).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    {/* Configurações */}
                    <div className="text-xs text-gray-500">
                      Tipo: {integracao.tipo} • Criado em {new Date(integracao.criadoEm).toLocaleDateString('pt-BR')}
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
                {editingItem ? '✏️ Editar' : '➕ Nova'} {activeTab === 'automacoes' ? 'Automação' : 'Integração'}
              </CardTitle>
              <CardDescription>
                {editingItem ? 'Atualize as configurações' : 'Configure uma nova automação ou integração'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome || ''}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder={activeTab === 'automacoes' ? 'Nome da automação' : 'Nome da integração'}
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao || ''}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o propósito desta configuração"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo</Label>
                  <Select value={formData.tipo || ''} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeTab === 'automacoes' ? (
                        <>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="backup">Backup</SelectItem>
                          <SelectItem value="relatorio">Relatório</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="api">API</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                          <SelectItem value="importacao">Importação</SelectItem>
                          <SelectItem value="exportacao">Exportação</SelectItem>
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
                      {activeTab === 'automacoes' ? (
                        <>
                          <SelectItem value="ativo">Ativo</SelectItem>
                          <SelectItem value="inativo">Inativo</SelectItem>
                          <SelectItem value="pausado">Pausado</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="conectado">Conectado</SelectItem>
                          <SelectItem value="desconectado">Desconectado</SelectItem>
                          <SelectItem value="erro">Erro</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {activeTab === 'automacoes' && (
                <div>
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select value={formData.frequencia || 'diario'} onValueChange={(value) => setFormData({ ...formData, frequencia: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diário</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="instantaneo">Instantâneo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label htmlFor="configuracoes">Configurações (JSON)</Label>
                <textarea
                  id="configuracoes"
                  value={JSON.stringify(formData.configuracoes || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const config = JSON.parse(e.target.value);
                      setFormData({ ...formData, configuracoes: config });
                    } catch (error) {
                      // Ignorar erros de JSON inválido durante digitação
                    }
                  }}
                  className="w-full p-2 border rounded-md font-mono text-sm"
                  rows={6}
                  placeholder='{"key": "value"}'
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
