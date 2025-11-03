import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Tag, 
  Folder,
  Search,
  Filter,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  tipo: 'entrada' | 'saida' | 'ambos';
  subcategorias: Subcategoria[];
  totalTransacoes: number;
  valorTotal: number;
  criadoEm: string;
}

interface Subcategoria {
  id: number;
  nome: string;
  descricao: string;
  cor: string;
  totalTransacoes: number;
  valorTotal: number;
}

export default function CategoryManager() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [filtroTipo, setFiltroTipo] = useState('todas');
  const [busca, setBusca] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    cor: '#3B82F6',
    icone: '📁',
    tipo: 'ambos' as 'entrada' | 'saida' | 'ambos'
  });

  const cores = [
    { nome: 'Azul', valor: '#3B82F6' },
    { nome: 'Verde', valor: '#10B981' },
    { nome: 'Vermelho', valor: '#EF4444' },
    { nome: 'Amarelo', valor: '#F59E0B' },
    { nome: 'Roxo', valor: '#8B5CF6' },
    { nome: 'Rosa', valor: '#EC4899' },
    { nome: 'Cinza', valor: '#6B7280' },
    { nome: 'Laranja', valor: '#F97316' }
  ];

  const icones = [
    '📁', '💰', '🛒', '🍔', '🚗', '🏠', '⚡', '📱',
    '💊', '👕', '🎮', '📚', '✈️', '🎬', '🏋️', '🎵',
    '🌿', '🔧', '🎨', '📊', '💡', '🔒', '📞', '📧'
  ];

  const carregarCategorias = async () => {
    try {
      setLoading(true);
      console.log('🏷️ Carregando categorias da API...');

      const response = await fetch('/api/financial/categorias');
      if (!response.ok) {
        throw new Error('Erro ao buscar categorias');
      }

      const data = await response.json();
      console.log('📦 Dados recebidos da API:', data);

      // Transformar dados da API para o formato esperado pelo componente
      const categoriasFormatadas: Categoria[] = (data.categorias || []).map((cat: any) => ({
        id: cat.id,
        nome: cat.nome,
        descricao: cat.descricao || '',
        cor: cat.cor || '#3B82F6',
        icone: cat.icone || '📁',
        tipo: cat.tipo || 'ambos',
        subcategorias: [], // API atual não tem subcategorias
        totalTransacoes: 0, // Pode ser calculado posteriormente
        valorTotal: 0, // Pode ser calculado posteriormente
        criadoEm: cat.criado_em ? new Date(cat.criado_em).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      }));

      setCategorias(categoriasFormatadas);
      console.log('✅ Categorias carregadas:', categoriasFormatadas.length);

    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias da API');
    } finally {
      setLoading(false);
    }
  };

  const salvarCategoria = async () => {
    try {
      if (!formData.nome.trim()) {
        toast.error('Nome da categoria é obrigatório');
        return;
      }

      const dadosCategoria = {
        nome: formData.nome,
        descricao: formData.descricao,
        cor: formData.cor,
        icone: formData.icone,
        tipo: formData.tipo
      };

      let response;
      
      if (editingCategoria) {
        // Atualizar categoria existente
        console.log('📝 Atualizando categoria ID:', editingCategoria.id);
        response = await fetch(`/api/financial/categorias/${editingCategoria.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dadosCategoria)
        });
      } else {
        // Criar nova categoria
        console.log('➕ Criando nova categoria');
        response = await fetch('/api/financial/categorias', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(dadosCategoria)
        });
      }

      if (!response.ok) {
        throw new Error('Erro ao salvar categoria');
      }

      const result = await response.json();
      console.log('✅ Categoria salva:', result);

      // Recarregar categorias
      await carregarCategorias();
      
      toast.success(editingCategoria ? 'Categoria atualizada com sucesso!' : 'Categoria criada com sucesso!');
      setShowModal(false);
      resetForm();

    } catch (error) {
      console.error('❌ Erro ao salvar categoria:', error);
      toast.error('Erro ao salvar categoria');
    }
  };

  const excluirCategoria = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      console.log('🗑️ Excluindo categoria ID:', id);
      
      const response = await fetch(`/api/financial/categorias/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao excluir categoria');
      }

      const result = await response.json();
      console.log('✅ Categoria excluída:', result);
      
      // Atualizar o estado local
      setCategorias(categorias.filter(cat => cat.id !== id));
      toast.success('Categoria excluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao excluir categoria:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      cor: '#3B82F6',
      icone: '📁',
      tipo: 'ambos'
    });
    setEditingCategoria(null);
  };

  const abrirModalEdicao = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao,
      cor: categoria.cor,
      icone: categoria.icone,
      tipo: categoria.tipo
    });
    setShowModal(true);
  };

  const abrirModalNova = () => {
    resetForm();
    setShowModal(true);
  };

  const categoriasFiltradas = categorias.filter(categoria => {
    const matchBusca = categoria.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      categoria.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = filtroTipo === 'todas' || categoria.tipo === filtroTipo;
    return matchBusca && matchTipo;
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando categorias...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🏷️ Gestão de Categorias</h2>
          <p className="text-gray-600">Organize suas transações por categorias e subcategorias</p>
        </div>
        
        <Button onClick={abrirModalNova} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nova Categoria
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar categorias..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
            <SelectItem value="ambos">Ambos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Grid de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categoriasFiltradas.map((categoria) => (
          <Card key={categoria.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: categoria.cor }}
                  >
                    {categoria.icone}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{categoria.nome}</CardTitle>
                    <CardDescription className="text-sm">{categoria.descricao}</CardDescription>
                  </div>
                </div>
                
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => abrirModalEdicao(categoria)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => excluirCategoria(categoria.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                {/* Tipo */}
                <div className="flex items-center space-x-2">
                  <Badge className={
                    categoria.tipo === 'entrada' ? 'bg-green-100 text-green-800' :
                    categoria.tipo === 'saida' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }>
                    {categoria.tipo === 'entrada' ? '💰 Entrada' :
                     categoria.tipo === 'saida' ? '💸 Saída' : '🔄 Ambos'}
                  </Badge>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-bold text-gray-900">{categoria.totalTransacoes}</div>
                    <div className="text-gray-600">Transações</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className={`font-bold ${categoria.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {categoria.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-gray-600">Total</div>
                  </div>
                </div>

                {/* Subcategorias */}
                {categoria.subcategorias.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Subcategorias:</div>
                    <div className="space-y-1">
                      {categoria.subcategorias.slice(0, 3).map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: sub.cor }}
                            ></div>
                            <span>{sub.nome}</span>
                          </div>
                          <span className="text-gray-600">
                            R$ {sub.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      {categoria.subcategorias.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{categoria.subcategorias.length - 3} mais...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>
                {editingCategoria ? '✏️ Editar Categoria' : '➕ Nova Categoria'}
              </CardTitle>
              <CardDescription>
                {editingCategoria ? 'Atualize os dados da categoria' : 'Crie uma nova categoria para organizar suas transações'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome da Categoria *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Vendas, Fornecedores, Marketing"
                />
              </div>

              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Descreva o propósito desta categoria"
                />
              </div>

              <div>
                <Label htmlFor="tipo">Tipo de Transação</Label>
                <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida' | 'ambos') => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">💰 Entrada</SelectItem>
                    <SelectItem value="saida">💸 Saída</SelectItem>
                    <SelectItem value="ambos">🔄 Ambos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Cor</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {cores.map((cor) => (
                    <button
                      key={cor.valor}
                      onClick={() => setFormData({ ...formData, cor: cor.valor })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        formData.cor === cor.valor ? 'border-gray-900' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: cor.valor }}
                      title={cor.nome}
                    />
                  ))}
                </div>
              </div>

              <div>
                <Label>Ícone</Label>
                <div className="grid grid-cols-8 gap-2 mt-2">
                  {icones.map((icone) => (
                    <button
                      key={icone}
                      onClick={() => setFormData({ ...formData, icone })}
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center text-lg ${
                        formData.icone === icone ? 'border-gray-900 bg-gray-100' : 'border-gray-300'
                      }`}
                    >
                      {icone}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
            
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={salvarCategoria} className="bg-green-600 hover:bg-green-700">
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