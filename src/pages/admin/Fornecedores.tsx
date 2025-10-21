import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Star,
  Package,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Calendar,
  DollarSign,
  CreditCard
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import FornecedorModal from '@/components/admin/FornecedorModal';
import FornecedorStats from '@/components/admin/FornecedorStats';

interface Fornecedor {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cnpj: string;
  contato: string;
  status: 'ativo' | 'inativo' | 'pendente';
  avaliacao: number;
  totalProdutos: number;
  vendasMes: number;
  ultimaAtualizacao: string;
  dataCadastro: string;
  observacoes?: string;
  categorias: string[];
  prazoEntrega: number;
  condicoesPagamento: string;
  // Campos financeiros
  limiteCredito?: number;
  saldoDevedor?: number;
  scoreFinanceiro?: number;
  riscoCredito?: 'baixo' | 'medio' | 'alto';
}

const Fornecedores: React.FC = () => {
  console.log('🏢 Componente Fornecedores renderizando...');
  
  const { toast } = useToast();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null);
  const [activeTab, setActiveTab] = useState('list');

  // Dados mockados para demonstração
  const mockFornecedores: Fornecedor[] = [
    {
      id: '1',
      nome: 'Brinquedos & Cia Ltda',
      email: 'contato@brinquedosecia.com.br',
      telefone: '(11) 3456-7890',
      endereco: 'Rua das Flores, 123',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01234-567',
      cnpj: '12.345.678/0001-90',
      contato: 'João Silva',
      status: 'ativo',
      avaliacao: 4.8,
      totalProdutos: 156,
      vendasMes: 12500,
      ultimaAtualizacao: '2024-01-15',
      dataCadastro: '2023-06-15',
      categorias: ['Brinquedos Educativos', 'Jogos'],
      prazoEntrega: 7,
      condicoesPagamento: '30 dias',
      limiteCredito: 50000,
      saldoDevedor: 8500,
      scoreFinanceiro: 85,
      riscoCredito: 'baixo'
    },
    {
      id: '2',
      nome: 'Distribuidora Kids',
      email: 'vendas@distribuidorakids.com',
      telefone: '(21) 9876-5432',
      endereco: 'Av. Principal, 456',
      cidade: 'Rio de Janeiro',
      estado: 'RJ',
      cep: '20000-000',
      cnpj: '98.765.432/0001-10',
      contato: 'Maria Santos',
      status: 'ativo',
      avaliacao: 4.5,
      totalProdutos: 89,
      vendasMes: 8900,
      ultimaAtualizacao: '2024-01-10',
      dataCadastro: '2023-08-20',
      categorias: ['Brinquedos de Bebê', 'Roupas'],
      prazoEntrega: 5,
      condicoesPagamento: '15 dias',
      limiteCredito: 30000,
      saldoDevedor: 3200,
      scoreFinanceiro: 72,
      riscoCredito: 'medio'
    },
    {
      id: '3',
      nome: 'Importadora Toys',
      email: 'import@importadoratoys.com',
      telefone: '(31) 1234-5678',
      endereco: 'Rua Industrial, 789',
      cidade: 'Belo Horizonte',
      estado: 'MG',
      cep: '30000-000',
      cnpj: '11.222.333/0001-44',
      contato: 'Pedro Costa',
      status: 'pendente',
      avaliacao: 0,
      totalProdutos: 0,
      vendasMes: 0,
      ultimaAtualizacao: '2024-01-20',
      dataCadastro: '2024-01-20',
      categorias: ['Importados'],
      prazoEntrega: 15,
      condicoesPagamento: 'À vista',
      limiteCredito: 10000,
      saldoDevedor: 0,
      scoreFinanceiro: 50,
      riscoCredito: 'alto'
    }
  ];

  useEffect(() => {
    loadFornecedores();
  }, []);

  const loadFornecedores = async () => {
    try {
      setLoading(true);
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setFornecedores(mockFornecedores);
    } catch (error) {
      toast({
        title: 'Erro ao carregar fornecedores',
        description: 'Não foi possível carregar a lista de fornecedores',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (fornecedor: Fornecedor) => {
    setEditingFornecedor(fornecedor);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Simular exclusão
      await new Promise(resolve => setTimeout(resolve, 500));
      setFornecedores(prev => prev.filter(f => f.id !== id));
      toast({
        title: 'Fornecedor excluído',
        description: 'Fornecedor removido com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o fornecedor',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setFornecedores(prev => 
        prev.map(f => f.id === id ? { ...f, status: newStatus as any } : f)
      );
      toast({
        title: 'Status atualizado',
        description: `Fornecedor ${newStatus === 'ativo' ? 'ativado' : 'desativado'}`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível alterar o status',
        variant: 'destructive'
      });
    }
  };

  const filteredFornecedores = fornecedores.filter(fornecedor => {
    const matchesSearch = fornecedor.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         fornecedor.cnpj.includes(searchTerm);
    const matchesStatus = statusFilter === 'todos' || fornecedor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: 'default',
      inativo: 'secondary',
      pendente: 'outline'
    } as const;

    const colors = {
      ativo: 'text-green-600',
      inativo: 'text-gray-600',
      pendente: 'text-yellow-600'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inativo':
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
      case 'pendente':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Fornecedores</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  try {
    console.log('✅ Renderizando componente principal. Fornecedores:', fornecedores.length);
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie seus fornecedores e parceiros comerciais
            </p>
          </div>
          <Button onClick={() => setShowModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Fornecedor
          </Button>
        </div>

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Lista de Fornecedores</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Stats Cards */}
          <FornecedorStats fornecedores={fornecedores} />

          {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar fornecedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="todos">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Lista de Fornecedores ({filteredFornecedores.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Score Financeiro</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                  <TableHead>Produtos</TableHead>
                  <TableHead>Vendas/Mês</TableHead>
                  <TableHead>Última Atualização</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFornecedores.map((fornecedor) => (
                  <TableRow key={fornecedor.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{fornecedor.nome}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {fornecedor.cidade}, {fornecedor.estado}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          CNPJ: {fornecedor.cnpj}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {fornecedor.email}
                        </div>
                        <div className="text-sm flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {fornecedor.telefone}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Contato: {fornecedor.contato}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(fornecedor.status)}
                        {getStatusBadge(fornecedor.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {fornecedor.avaliacao > 0 ? (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{fornecedor.avaliacao}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Sem avaliação</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              (fornecedor.scoreFinanceiro || 0) >= 80 ? 'bg-green-500' :
                              (fornecedor.scoreFinanceiro || 0) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${fornecedor.scoreFinanceiro || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{fornecedor.scoreFinanceiro || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className={`h-4 w-4 ${(fornecedor.saldoDevedor || 0) > 0 ? 'text-red-600' : 'text-green-600'}`} />
                        <span className={`font-medium ${(fornecedor.saldoDevedor || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          R$ {(fornecedor.saldoDevedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{fornecedor.totalProdutos}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>R$ {fornecedor.vendasMes.toLocaleString()}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(fornecedor.ultimaAtualizacao).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(fornecedor)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Registrar Pagamento
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {fornecedor.status === 'ativo' ? (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(fornecedor.id, 'inativo')}
                              className="text-yellow-600"
                            >
                              <AlertCircle className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(fornecedor.id, 'ativo')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDelete(fornecedor.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Fornecedores</CardTitle>
              <CardDescription>
                Análises e insights sobre o desempenho dos fornecedores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold">Score Médio</h3>
                  <div className="text-3xl font-bold text-blue-600">
                    {fornecedores.length > 0 ? 
                      (fornecedores.reduce((sum, s) => sum + (s.scoreFinanceiro || 0), 0) / fornecedores.length).toFixed(0) : 
                      '0'
                    }
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Total em Débito</h3>
                  <div className="text-3xl font-bold text-red-600">
                    R$ {fornecedores.reduce((sum, s) => sum + (s.saldoDevedor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Limite Total</h3>
                  <div className="text-3xl font-bold text-green-600">
                    R$ {fornecedores.reduce((sum, s) => sum + (s.limiteCredito || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>
              
              <div className="mt-8">
                <h3 className="font-semibold mb-4">Distribuição por Risco</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {fornecedores.filter(s => s.riscoCredito === 'baixo').length}
                    </div>
                    <div className="text-sm text-green-600">Baixo Risco</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {fornecedores.filter(s => s.riscoCredito === 'medio').length}
                    </div>
                    <div className="text-sm text-yellow-600">Médio Risco</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {fornecedores.filter(s => s.riscoCredito === 'alto').length}
                    </div>
                    <div className="text-sm text-red-600">Alto Risco</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Fornecedor */}
      <FornecedorModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingFornecedor(null);
        }}
        fornecedor={editingFornecedor}
        onSave={(fornecedor) => {
          if (editingFornecedor) {
            setFornecedores(prev => 
              prev.map(f => f.id === fornecedor.id ? fornecedor : f)
            );
          } else {
            setFornecedores(prev => [...prev, { ...fornecedor, id: Date.now().toString() }]);
          }
          setShowModal(false);
          setEditingFornecedor(null);
        }}
      />
    </div>
    );
  } catch (error) {
    console.error('❌ Erro crítico ao renderizar Fornecedores:', error);
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Erro ao Carregar Fornecedores</h2>
          <p className="text-red-600 mb-4">
            Ocorreu um erro ao carregar a página de fornecedores. Por favor, recarregue a página.
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

export default Fornecedores;
