import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart,
  MoreHorizontal
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
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProdutoFornecedor {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  precoCusto: number;
  estoque: number;
  status: 'ativo' | 'inativo' | 'sem_estoque';
  avaliacao: number;
  vendasMes: number;
  margemLucro: number;
  dataCadastro: string;
  ultimaAtualizacao: string;
  imagem?: string;
  descricao?: string;
  marca?: string;
  peso?: number;
  dimensoes?: string;
  codigoBarras?: string;
  codigoFornecedor?: string;
}

interface FornecedorProdutosProps {
  fornecedorId: string;
  fornecedorNome: string;
  onClose?: () => void;
}

const FornecedorProdutos: React.FC<FornecedorProdutosProps> = ({
  fornecedorId,
  fornecedorNome,
  onClose
}) => {
  const { toast } = useToast();
  const [produtos, setProdutos] = useState<ProdutoFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');

  // Dados mockados para demonstração
  const mockProdutos: ProdutoFornecedor[] = [
    {
      id: '1',
      nome: 'Boneca Interativa',
      categoria: 'Brinquedos',
      preco: 89.90,
      precoCusto: 45.00,
      estoque: 25,
      status: 'ativo',
      avaliacao: 4.5,
      vendasMes: 12,
      margemLucro: 49.9,
      dataCadastro: '2023-06-15',
      ultimaAtualizacao: '2024-01-15',
      marca: 'ToyBrand',
      peso: 0.8,
      codigoBarras: '1234567890123',
      codigoFornecedor: 'TB001'
    },
    {
      id: '2',
      nome: 'Carrinho de Controle Remoto',
      categoria: 'Brinquedos',
      preco: 159.90,
      precoCusto: 80.00,
      estoque: 8,
      status: 'ativo',
      avaliacao: 4.2,
      vendasMes: 6,
      margemLucro: 49.9,
      dataCadastro: '2023-07-20',
      ultimaAtualizacao: '2024-01-10',
      marca: 'RC Toys',
      peso: 1.2,
      codigoBarras: '2345678901234',
      codigoFornecedor: 'RC002'
    },
    {
      id: '3',
      nome: 'Jogo de Tabuleiro Educativo',
      categoria: 'Jogos',
      preco: 45.90,
      precoCusto: 25.00,
      estoque: 0,
      status: 'sem_estoque',
      avaliacao: 4.8,
      vendasMes: 15,
      margemLucro: 45.5,
      dataCadastro: '2023-08-10',
      ultimaAtualizacao: '2024-01-05',
      marca: 'EduGames',
      peso: 0.5,
      codigoBarras: '3456789012345',
      codigoFornecedor: 'EG003'
    }
  ];

  const categorias = [
    'Todas',
    'Brinquedos',
    'Jogos',
    'Brinquedos Educativos',
    'Roupas',
    'Eletrônicos'
  ];

  useEffect(() => {
    loadProdutos();
  }, [fornecedorId]);

  const loadProdutos = async () => {
    try {
      setLoading(true);
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProdutos(mockProdutos);
    } catch (error) {
      toast({
        title: 'Erro ao carregar produtos',
        description: 'Não foi possível carregar os produtos do fornecedor',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduto = (produto: ProdutoFornecedor) => {
    toast({
      title: 'Editar Produto',
      description: `Funcionalidade de edição para ${produto.nome} será implementada`,
    });
  };

  const handleDeleteProduto = async (id: string) => {
    try {
      setProdutos(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Produto excluído',
        description: 'Produto removido com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o produto',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      setProdutos(prev => 
        prev.map(p => p.id === id ? { ...p, status: newStatus as any } : p)
      );
      toast({
        title: 'Status atualizado',
        description: 'Status do produto alterado com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao atualizar status',
        description: 'Não foi possível alterar o status',
        variant: 'destructive'
      });
    }
  };

  const filteredProdutos = produtos.filter(produto => {
    const matchesSearch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         produto.codigoFornecedor?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || produto.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'todas' || produto.categoria === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      ativo: 'default',
      inativo: 'secondary',
      sem_estoque: 'destructive'
    } as const;

    const colors = {
      ativo: 'text-green-600',
      inativo: 'text-gray-600',
      sem_estoque: 'text-red-600'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status === 'sem_estoque' ? 'Sem Estoque' : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ativo':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'inativo':
        return <Clock className="h-4 w-4 text-gray-600" />;
      case 'sem_estoque':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  // Calcular estatísticas
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter(p => p.status === 'ativo').length;
  const produtosSemEstoque = produtos.filter(p => p.status === 'sem_estoque').length;
  const totalVendasMes = produtos.reduce((sum, p) => sum + p.vendasMes, 0);
  const margemMedia = produtos.length > 0 
    ? produtos.reduce((sum, p) => sum + p.margemLucro, 0) / produtos.length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Produtos de {fornecedorNome}</h2>
            <p className="text-muted-foreground">Carregando produtos...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Produtos de {fornecedorNome}</h2>
          <p className="text-muted-foreground">
            Gerencie os produtos fornecidos por este fornecedor
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Voltar
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Produtos</p>
                <p className="text-2xl font-bold">{totalProdutos}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Produtos Ativos</p>
                <p className="text-2xl font-bold">{produtosAtivos}</p>
                <p className="text-xs text-green-600">
                  {totalProdutos > 0 ? ((produtosAtivos / totalProdutos) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sem Estoque</p>
                <p className="text-2xl font-bold">{produtosSemEstoque}</p>
                <p className="text-xs text-red-600">
                  {totalProdutos > 0 ? ((produtosSemEstoque / totalProdutos) * 100).toFixed(1) : 0}%
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Margem Média</p>
                <p className="text-2xl font-bold">{margemMedia.toFixed(1)}%</p>
                <p className="text-xs text-muted-foreground">
                  {totalVendasMes} vendas/mês
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
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
                <option value="sem_estoque">Sem Estoque</option>
              </select>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria === 'Todas' ? 'todas' : categoria}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos ({filteredProdutos.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preços</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Margem</TableHead>
                  <TableHead>Vendas/Mês</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProdutos.map((produto) => (
                  <TableRow key={produto.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{produto.nome}</div>
                        <div className="text-sm text-muted-foreground">
                          {produto.marca && `Marca: ${produto.marca}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {produto.codigoFornecedor && `Código: ${produto.codigoFornecedor}`}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{produto.categoria}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">R$ {produto.preco.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">
                          Custo: R$ {produto.precoCusto.toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className={cn(
                          "font-medium",
                          produto.estoque === 0 ? "text-red-600" : 
                          produto.estoque <= 5 ? "text-yellow-600" : "text-green-600"
                        )}>
                          {produto.estoque}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(produto.status)}
                        {getStatusBadge(produto.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        "font-medium",
                        produto.margemLucro >= 40 ? "text-green-600" :
                        produto.margemLucro >= 30 ? "text-yellow-600" : "text-red-600"
                      )}>
                        {produto.margemLucro.toFixed(1)}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <span>{produto.vendasMes}</span>
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
                          <DropdownMenuItem onClick={() => handleEditProduto(produto)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {produto.status === 'ativo' ? (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(produto.id, 'inativo')}
                              className="text-yellow-600"
                            >
                              <Clock className="h-4 w-4 mr-2" />
                              Desativar
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => handleStatusChange(produto.id, 'ativo')}
                              className="text-green-600"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Ativar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => handleDeleteProduto(produto.id)}
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
    </div>
  );
};

export default FornecedorProdutos;
