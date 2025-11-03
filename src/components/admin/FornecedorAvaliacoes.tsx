import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Star, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Calendar,
  TrendingUp,
  Filter,
  Search,
  Plus,
  Edit,
  Trash2,
  Flag,
  Reply,
  Award,
  Target,
  BarChart
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AvaliacaoFornecedor {
  id: string;
  fornecedorId: string;
  fornecedorNome: string;
  avaliador: string;
  email: string;
  data: string;
  nota: number;
  categoria: 'qualidade' | 'entrega' | 'atendimento' | 'preco' | 'geral';
  comentario: string;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  resposta?: string;
  dataResposta?: string;
  tags: string[];
  votosUtil: number;
  votosNaoUtil: number;
  moderado: boolean;
}

interface FornecedorAvaliacoesProps {
  fornecedorId?: string;
  fornecedorNome?: string;
}

const FornecedorAvaliacoes: React.FC<FornecedorAvaliacoesProps> = ({
  fornecedorId,
  fornecedorNome
}) => {
  const { toast } = useToast();
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [showNovaAvaliacao, setShowNovaAvaliacao] = useState(false);

  // Dados mockados para demonstração
  const mockAvaliacoes: AvaliacaoFornecedor[] = [
    {
      id: '1',
      fornecedorId: '1',
      fornecedorNome: 'Brinquedos & Cia Ltda',
      avaliador: 'Maria Silva',
      email: 'maria@email.com',
      data: '2024-01-15',
      nota: 5,
      categoria: 'geral',
      comentario: 'Excelente fornecedor! Produtos de alta qualidade, entrega rápida e atendimento impecável. Recomendo!',
      status: 'aprovado',
      resposta: 'Obrigado pelo feedback, Maria! Ficamos felizes em atendê-la.',
      dataResposta: '2024-01-16',
      tags: ['qualidade', 'rapidez', 'atendimento'],
      votosUtil: 12,
      votosNaoUtil: 0,
      moderado: true
    },
    {
      id: '2',
      fornecedorId: '1',
      fornecedorNome: 'Brinquedos & Cia Ltda',
      avaliador: 'João Santos',
      email: 'joao@email.com',
      data: '2024-01-10',
      nota: 4,
      categoria: 'entrega',
      comentario: 'Produtos bons, mas a entrega demorou um pouco mais do que o prometido. Mesmo assim, recomendo.',
      status: 'aprovado',
      tags: ['entrega'],
      votosUtil: 8,
      votosNaoUtil: 2,
      moderado: true
    },
    {
      id: '3',
      fornecedorId: '2',
      fornecedorNome: 'Distribuidora Kids',
      avaliador: 'Ana Costa',
      email: 'ana@email.com',
      data: '2024-01-08',
      nota: 3,
      categoria: 'preco',
      comentario: 'Os preços estão um pouco altos comparado à concorrência. Qualidade é boa.',
      status: 'aprovado',
      tags: ['preco'],
      votosUtil: 5,
      votosNaoUtil: 3,
      moderado: true
    },
    {
      id: '4',
      fornecedorId: '1',
      fornecedorNome: 'Brinquedos & Cia Ltda',
      avaliador: 'Pedro Oliveira',
      email: 'pedro@email.com',
      data: '2024-01-20',
      nota: 2,
      categoria: 'atendimento',
      comentario: 'Atendimento deixou a desejar. Demoraram para responder minhas dúvidas.',
      status: 'pendente',
      tags: ['atendimento'],
      votosUtil: 3,
      votosNaoUtil: 7,
      moderado: false
    }
  ];

  useEffect(() => {
    loadAvaliacoes();
  }, [fornecedorId]);

  const loadAvaliacoes = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let avaliacoesFiltradas = mockAvaliacoes;
      if (fornecedorId) {
        avaliacoesFiltradas = mockAvaliacoes.filter(a => a.fornecedorId === fornecedorId);
      }
      
      setAvaliacoes(avaliacoesFiltradas);
    } catch (error) {
      toast({
        title: 'Erro ao carregar avaliações',
        description: 'Não foi possível carregar as avaliações',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAprovarAvaliacao = async (id: string) => {
    try {
      setAvaliacoes(prev => 
        prev.map(a => a.id === id ? { ...a, status: 'aprovado', moderado: true } : a)
      );
      toast({
        title: 'Avaliação aprovada',
        description: 'A avaliação foi aprovada e está visível',
      });
    } catch (error) {
      toast({
        title: 'Erro ao aprovar',
        description: 'Não foi possível aprovar a avaliação',
        variant: 'destructive'
      });
    }
  };

  const handleRejeitarAvaliacao = async (id: string) => {
    try {
      setAvaliacoes(prev => 
        prev.map(a => a.id === id ? { ...a, status: 'rejeitado', moderado: true } : a)
      );
      toast({
        title: 'Avaliação rejeitada',
        description: 'A avaliação foi rejeitada',
      });
    } catch (error) {
      toast({
        title: 'Erro ao rejeitar',
        description: 'Não foi possível rejeitar a avaliação',
        variant: 'destructive'
      });
    }
  };

  const handleResponderAvaliacao = async (id: string, resposta: string) => {
    try {
      setAvaliacoes(prev => 
        prev.map(a => a.id === id ? { 
          ...a, 
          resposta, 
          dataResposta: new Date().toISOString().split('T')[0] 
        } : a)
      );
      toast({
        title: 'Resposta enviada',
        description: 'Resposta à avaliação foi enviada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro ao responder',
        description: 'Não foi possível enviar a resposta',
        variant: 'destructive'
      });
    }
  };

  const filteredAvaliacoes = avaliacoes.filter(avaliacao => {
    const matchesSearch = avaliacao.avaliador.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avaliacao.comentario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         avaliacao.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || avaliacao.status === statusFilter;
    const matchesCategoria = categoriaFilter === 'todas' || avaliacao.categoria === categoriaFilter;
    return matchesSearch && matchesStatus && matchesCategoria;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: 'outline',
      aprovado: 'default',
      rejeitado: 'destructive'
    } as const;

    const colors = {
      pendente: 'text-yellow-600',
      aprovado: 'text-green-600',
      rejeitado: 'text-red-600'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejeitado':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const renderStars = (nota: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={cn(
          "h-4 w-4",
          index < nota ? "text-yellow-500 fill-current" : "text-gray-300"
        )}
      />
    ));
  };

  // Calcular estatísticas
  const totalAvaliacoes = avaliacoes.length;
  const avaliacoesPendentes = avaliacoes.filter(a => a.status === 'pendente').length;
  const avaliacoesAprovadas = avaliacoes.filter(a => a.status === 'aprovado').length;
  const notaMedia = avaliacoes.length > 0 
    ? avaliacoes.reduce((sum, a) => sum + a.nota, 0) / avaliacoes.length 
    : 0;

  const categorias = [
    'Todas',
    'Qualidade',
    'Entrega',
    'Atendimento',
    'Preço',
    'Geral'
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Avaliações de Fornecedores</h2>
            <p className="text-muted-foreground">Carregando avaliações...</p>
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
          <h2 className="text-2xl font-bold">
            {fornecedorNome ? `Avaliações de ${fornecedorNome}` : 'Avaliações de Fornecedores'}
          </h2>
          <p className="text-muted-foreground">
            Gerencie as avaliações e feedback dos fornecedores
          </p>
        </div>
        <Button onClick={() => setShowNovaAvaliacao(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Avaliação
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Avaliações</p>
                <p className="text-2xl font-bold">{totalAvaliacoes}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nota Média</p>
                <p className="text-2xl font-bold">{notaMedia.toFixed(1)}</p>
                <div className="flex mt-1">
                  {renderStars(Math.round(notaMedia))}
                </div>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{avaliacoesPendentes}</p>
                <p className="text-xs text-yellow-600">
                  Aguardando moderação
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aprovadas</p>
                <p className="text-2xl font-bold">{avaliacoesAprovadas}</p>
                <p className="text-xs text-green-600">
                  {totalAvaliacoes > 0 ? ((avaliacoesAprovadas / totalAvaliacoes) * 100).toFixed(1) : 0}% do total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
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
                  placeholder="Buscar avaliações..."
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
                <option value="pendente">Pendente</option>
                <option value="aprovado">Aprovado</option>
                <option value="rejeitado">Rejeitado</option>
              </select>
              <select
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                {categorias.map((categoria) => (
                  <option key={categoria} value={categoria === 'Todas' ? 'todas' : categoria.toLowerCase()}>
                    {categoria}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Lista de Avaliações ({filteredAvaliacoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAvaliacoes.map((avaliacao) => (
              <div key={avaliacao.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/50 rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{avaliacao.avaliador}</h4>
                        {getStatusIcon(avaliacao.status)}
                        {getStatusBadge(avaliacao.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {avaliacao.fornecedorNome} • {new Date(avaliacao.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {renderStars(avaliacao.nota)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {avaliacao.categoria.charAt(0).toUpperCase() + avaliacao.categoria.slice(1)}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm">{avaliacao.comentario}</p>
                </div>

                {/* Tags */}
                {avaliacao.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {avaliacao.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Resposta */}
                {avaliacao.resposta && (
                  <div className="bg-muted/30 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Reply className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Resposta do fornecedor</span>
                      {avaliacao.dataResposta && (
                        <span className="text-xs text-muted-foreground">
                          ({new Date(avaliacao.dataResposta).toLocaleDateString('pt-BR')})
                        </span>
                      )}
                    </div>
                    <p className="text-sm">{avaliacao.resposta}</p>
                  </div>
                )}

                {/* Ações */}
                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      <span>{avaliacao.votosUtil} útil</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsDown className="h-3 w-3" />
                      <span>{avaliacao.votosNaoUtil} não útil</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {avaliacao.status === 'pendente' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAprovarAvaliacao(avaliacao.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejeitarAvaliacao(avaliacao.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}
                    
                    {!avaliacao.resposta && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const resposta = prompt('Digite sua resposta:');
                          if (resposta) {
                            handleResponderAvaliacao(avaliacao.id, resposta);
                          }
                        }}
                      >
                        <Reply className="h-3 w-3 mr-1" />
                        Responder
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost">
                      <Flag className="h-3 w-3 mr-1" />
                      Denunciar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FornecedorAvaliacoes;
