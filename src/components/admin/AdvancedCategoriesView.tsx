import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  BarChart,
  Package,
  TrendingUp,
  Image as ImageIcon,
  Save,
  X,
  Grid3x3,
  List,
  ArrowUpDown,
  Sparkles,
  Tag as TagIcon,
  Upload,
  Loader2,
  Move,
  GripVertical,
  Palette,
  Smile
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import ImageUpload from '@/components/admin/ImageUpload';

interface Categoria {
  id: number;
  nome: string;
  slug: string;
  descricao: string;
  icon: string;
  cor: string;
  imagem_url: string | null;
  ordem: number;
  ativo: boolean;
  quantidade: number;
  precoMinimo: number;
  precoMaximo: number;
  avaliacaoMedia: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  created_at: string;
  updated_at: string;
}

const CORES_PREDEFINIDAS = [
  { nome: 'Azul', classe: 'from-blue-500 to-blue-600' },
  { nome: 'Roxo', classe: 'from-purple-500 to-purple-600' },
  { nome: 'Amarelo', classe: 'from-yellow-500 to-orange-500' },
  { nome: 'Verde', classe: 'from-green-500 to-green-600' },
  { nome: 'Vermelho', classe: 'from-red-500 to-red-600' },
  { nome: 'Índigo', classe: 'from-indigo-500 to-indigo-600' },
  { nome: 'Laranja', classe: 'from-orange-500 to-orange-600' },
  { nome: 'Rosa', classe: 'from-pink-500 to-pink-600' },
  { nome: 'Teal', classe: 'from-teal-500 to-teal-600' },
  { nome: 'Âmbar', classe: 'from-amber-500 to-amber-600' },
  { nome: 'Cinza Escuro', classe: 'from-slate-700 to-slate-900' },
  { nome: 'Azul Escuro', classe: 'from-blue-700 to-blue-900' },
];

const ICONES_PREDEFINIDOS = {
  'Brinquedos & Figuras': ['🤖', '🦸', '🦇', '🕷️', '👾', '🎮', '🎯', '🎲', '🧩', '🪀', '🎪', '🎨', '🎭', '🎬'],
  'Personagens': ['👑', '👸', '🤴', '🧙', '🧚', '🧛', '🧜', '🧝', '🦹', '🥷', '👻', '👽', '🤠', '🤡'],
  'Veículos': ['🚗', '🚙', '🚕', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🛵', '🏍️', '✈️', '🚁', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇', '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🏎️', '🏍️', '🛵', '🦽', '🦼', '🛴', '🚲', '🛹', '🛼', '⛸️'],
  'Animais': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🦍', '🦧', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞', '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🦣', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🦬', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐈‍⬛', '🪶', '🐓', '🦃', '🦤', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦫', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
  'Fantasia & Magia': ['⚔️', '🗡️', '🛡️', '🏹', '🪄', '🔮', '💎', '👑', '🪙', '🏺', '⚱️', '🧿', '📿', '💍', '💝', '⚡', '🔥', '❄️', '💧', '🌟', '⭐', '✨', '💫', '🌙', '☄️', '🪐', '🌍', '🌈'],
  'Esportes': ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌', '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏄', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️'],
  'Diversão': ['🎉', '🎊', '🎈', '🎀', '🎁', '🎂', '🎄', '🎃', '🎆', '🎇', '🧨', '✨', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧', '🎀'],
  'Música & Arte': ['🎸', '🎹', '🎺', '🎻', '🪕', '🥁', '🪘', '🎷', '🎤', '🎧', '🎨', '🖌️', '🖍️', '🖊️', '✏️', '📝', '📓', '📔', '📕', '📖', '📚'],
  'Tecnologia': ['💻', '⌨️', '🖱️', '🖨️', '🖥️', '💾', '💿', '📱', '📞', '☎️', '📟', '📠', '📡', '🔋', '🔌', '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '🔧', '🔨', '⚒️', '🛠️', '⛏️', '🪛', '🪚', '🔩', '⚙️', '🗜️'],
  'Natureza': ['🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🏵️', '🌱', '🪴', '🌿', '☘️', '🍀', '🌾', '🌳', '🌲', '🌴', '🌵', '🎋', '🎍', '🍁', '🍂', '🍃', '🪺', '🪹'],
  'Comida & Bebida': ['🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠', '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🦴', '🌭', '🍔', '🍟', '🍕', '🫓', '🥪', '🥙', '🧆', '🌮', '🌯', '🫔', '🥗', '🥘', '🫕', '🥫', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🍥', '🥠', '🥮', '🍢', '🍡', '🍧', '🍨', '🍦', '🥧', '🧁', '🍰', '🎂', '🍮', '🍭', '🍬', '🍫', '🍿', '🍩', '🍪', '🌰', '🥜', '🫘', '🍯', '🥛', '🍼', '🫖', '☕', '🍵', '🧃', '🥤', '🧋', '🍶', '🍺', '🍻', '🥂', '🍷', '🥃', '🍸', '🍹', '🧉', '🍾', '🧊'],
  'Símbolos': ['❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❣️', '💔', '❤️‍🔥', '❤️‍🩹', '💯', '✅', '✨', '⭐', '🌟', '💫', '🔥', '💥', '💢', '💦', '💨', '🕳️', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '💤']
};

export function AdvancedCategoriesView() {
  // Estados
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'ordem' | 'nome' | 'produtos'>('ordem');

  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<Categoria | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    icon: '📦',
    cor: 'from-purple-500 to-purple-600',
    imagem_url: '',
    ordem: 0,
    ativo: true,
    meta_title: '',
    meta_description: '',
    meta_keywords: ''
  });

  // Carregar categorias
  React.useEffect(() => {
    fetchCategorias();
  }, []);

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categorias/gerenciaveis', {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao buscar categorias');

      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Não foi possível carregar as categorias');
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas
  const stats = useMemo(() => {
    const total = categorias.length;
    const ativas = categorias.filter(c => c.ativo).length;
    const comProdutos = categorias.filter(c => c.quantidade > 0).length;
    const totalProdutos = categorias.reduce((sum, c) => sum + c.quantidade, 0);
    const comImagem = categorias.filter(c => c.imagem_url).length;

    return {
      total,
      ativas,
      inativas: total - ativas,
      comProdutos,
      semProdutos: total - comProdutos,
      totalProdutos,
      mediaProdutos: total > 0 ? Math.round(totalProdutos / total) : 0,
      comImagem,
      semImagem: total - comImagem
    };
  }, [categorias]);

  // Filtrar e ordenar
  const filteredCategorias = useMemo(() => {
    let filtered = categorias.filter(cat => {
      const matchesSearch = cat.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cat.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || 
                           (filterStatus === 'ativo' ? cat.ativo : !cat.ativo);
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'ordem':
          return a.ordem - b.ordem;
        case 'nome':
          return a.nome.localeCompare(b.nome);
        case 'produtos':
          return b.quantidade - a.quantidade;
        default:
          return 0;
      }
    });

    return filtered;
  }, [categorias, searchTerm, filterStatus, sortBy]);

  // Handlers
  const handleCreate = () => {
    setFormData({
      nome: '',
      descricao: '',
      icon: '📦',
      cor: 'from-purple-500 to-purple-600',
      imagem_url: '',
      ordem: categorias.length,
      ativo: true,
      meta_title: '',
      meta_description: '',
      meta_keywords: ''
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (categoria: Categoria) => {
    console.log('🖱️ [ADVANCED] Botão Editar clicado para categoria:', categoria.id, categoria.nome);
    setSelectedCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao,
      icon: categoria.icon,
      cor: categoria.cor,
      imagem_url: categoria.imagem_url || '',
      ordem: categoria.ordem,
      ativo: Boolean(categoria.ativo),
      meta_title: categoria.meta_title || '',
      meta_description: categoria.meta_description || '',
      meta_keywords: categoria.meta_keywords || ''
    });
    setShowEditDialog(true);
    console.log('✅ [ADVANCED] Dialog de edição aberto');
  };

  const handleSave = async (isEdit: boolean) => {
    if (!formData.nome.trim()) {
      toast.error('Nome da categoria é obrigatório');
      return;
    }

    try {
      const url = isEdit ? `/api/categorias/${selectedCategoria?.id}` : '/api/categorias';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar categoria');
      }

      toast.success(isEdit ? '✅ Categoria atualizada!' : '✅ Categoria criada!');
      setShowCreateDialog(false);
      setShowEditDialog(false);
      setSelectedCategoria(null);
      fetchCategorias();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDelete = (categoria: Categoria) => {
    console.log('🗑️ [ADVANCED] Botão Excluir clicado para categoria:', categoria.id, categoria.nome);
    setSelectedCategoria(categoria);
    setShowDeleteDialog(true);
    console.log('✅ [ADVANCED] Dialog de exclusão aberto');
  };

  const confirmDelete = async () => {
    if (!selectedCategoria) return;

    try {
      const response = await fetch(`/api/categorias/${selectedCategoria.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao deletar categoria');
      }

      toast.success('✅ Categoria deletada!');
      setShowDeleteDialog(false);
      setSelectedCategoria(null);
      fetchCategorias();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (id: number) => {
    try {
      console.log('🔄 [ADVANCED] Toggle status categoria ID:', id);
      const response = await fetch(`/api/categorias/${id}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao alterar status');

      console.log('✅ [ADVANCED] Status alterado com sucesso');
      toast.success('✅ Status alterado!');
      fetchCategorias();
    } catch (error) {
      console.error('❌ [ADVANCED] Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Render
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart className="w-4 h-4" />
            <span className="hidden sm:inline">Visão Geral</span>
          </TabsTrigger>
          <TabsTrigger value="gerenciar" className="gap-2">
            <FolderTree className="w-4 h-4" />
            <span className="hidden sm:inline">Gerenciar</span>
          </TabsTrigger>
          <TabsTrigger value="estatisticas" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Estatísticas</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA: VISÃO GERAL */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.ativas} ativas • {stats.inativas} inativas
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Produtos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalProdutos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Média de {stats.mediaProdutos} por categoria
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Com Produtos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.comProdutos}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.semProdutos} vazias
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Com Imagem</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.comImagem}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.semImagem} sem imagem
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Preview das Categorias */}
          <Card>
            <CardHeader>
              <CardTitle>Categorias Principais</CardTitle>
              <CardDescription>Top 6 categorias com mais produtos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorias
                  .filter(c => c.ativo)
                  .sort((a, b) => b.quantidade - a.quantidade)
                  .slice(0, 6)
                  .map((cat, index) => (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative h-32 rounded-lg overflow-hidden group cursor-pointer"
                      onClick={() => handleEdit(cat)}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${cat.cor} opacity-90`} />
                      {cat.imagem_url && (
                        <img src={cat.imagem_url} alt={cat.nome} className="absolute inset-0 w-full h-full object-cover opacity-30" />
                      )}
                      <div className="relative h-full p-4 flex flex-col justify-between text-white">
                        <div>
                          <div className="text-3xl mb-1">{cat.icon}</div>
                          <h3 className="font-bold">{cat.nome}</h3>
                        </div>
                        <div className="text-xs">
                          {cat.quantidade} produto{cat.quantidade !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: GERENCIAR */}
        <TabsContent value="gerenciar" className="space-y-4 mt-6">
          {/* Barra de Ações */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Busca */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Pesquisar categorias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filtros */}
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('all')}
                  >
                    Todas
                  </Button>
                  <Button
                    variant={filterStatus === 'ativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('ativo')}
                  >
                    Ativas
                  </Button>
                  <Button
                    variant={filterStatus === 'inativo' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterStatus('inativo')}
                  >
                    Inativas
                  </Button>
                </div>

                {/* Ordenação */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="ordem">Ordem</option>
                  <option value="nome">Nome</option>
                  <option value="produtos">Produtos</option>
                </select>

                {/* Modo de Visualização */}
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3x3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>

                {/* Botão Criar */}
                <Button onClick={handleCreate} className="whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Categoria
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Categorias */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-48 animate-pulse bg-muted" />
              ))}
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              <AnimatePresence>
                {filteredCategorias.map((categoria, index) => (
                  <motion.div
                    key={categoria.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    style={{ pointerEvents: 'auto' }}
                  >
                    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
                      <div className={`absolute inset-0 bg-gradient-to-br ${categoria.cor} opacity-5 pointer-events-none`} />
                      
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${categoria.cor} flex items-center justify-center text-2xl`}>
                              {categoria.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{categoria.nome}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                {categoria.quantidade} produto{categoria.quantidade !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant={Boolean(categoria.ativo) ? 'default' : 'secondary'}>
                            {Boolean(categoria.ativo) ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {categoria.descricao || 'Sem descrição'}
                        </p>

                        {categoria.imagem_url && (
                          <div className="w-full h-24 rounded-lg overflow-hidden bg-muted">
                            <img
                              src={categoria.imagem_url}
                              alt={categoria.nome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        {categoria.quantidade > 0 && (
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              R$ {categoria.precoMinimo.toFixed(2)} - R$ {categoria.precoMaximo.toFixed(2)}
                            </span>
                            {categoria.avaliacaoMedia && (
                              <span>⭐ {categoria.avaliacaoMedia}</span>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2 pt-2" style={{ position: 'relative', zIndex: 10 }}>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ CLICK DETECTADO - Editar categoria:', categoria.id, categoria.nome);
                              handleEdit(categoria);
                            }}
                            className="flex-1"
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ CLICK DETECTADO - Toggle status:', categoria.id);
                              handleToggleStatus(categoria.id);
                            }}
                            style={{ pointerEvents: 'auto' }}
                          >
                            {Boolean(categoria.ativo) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('🖱️ CLICK DETECTADO - Excluir categoria:', categoria.id);
                              handleDelete(categoria);
                            }}
                            disabled={Number(categoria.quantidade) > 0}
                            style={{ pointerEvents: 'auto' }}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {filteredCategorias.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <FolderTree className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'Tente ajustar os filtros de busca' : 'Comece criando sua primeira categoria'}
              </p>
              {!searchTerm && (
                <Button onClick={handleCreate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeira Categoria
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {/* ABA: ESTATÍSTICAS */}
        <TabsContent value="estatisticas" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Estatísticas Gerais */}
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Categorias</span>
                  <span className="text-2xl font-bold">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Categorias Ativas</span>
                  <span className="text-2xl font-bold text-green-600">{stats.ativas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Categorias Inativas</span>
                  <span className="text-2xl font-bold text-orange-600">{stats.inativas}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total de Produtos</span>
                  <span className="text-2xl font-bold text-blue-600">{stats.totalProdutos}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Média de Produtos</span>
                  <span className="text-2xl font-bold text-purple-600">{stats.mediaProdutos}</span>
                </div>
              </CardContent>
            </Card>

            {/* Top Categorias */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 Categorias</CardTitle>
                <CardDescription>Por número de produtos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {categorias
                  .sort((a, b) => b.quantidade - a.quantidade)
                  .slice(0, 5)
                  .map((cat, index) => (
                    <div key={cat.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="text-2xl">{cat.icon}</div>
                      <div className="flex-1">
                        <p className="font-medium">{cat.nome}</p>
                        <p className="text-xs text-muted-foreground">{cat.quantidade} produtos</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Criar/Editar */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
          setSelectedCategoria(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {showEditDialog ? 'Editar Categoria' : 'Nova Categoria'}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da categoria abaixo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <Label>Nome *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                placeholder="Ex: Action Figures"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Breve descrição da categoria"
                rows={3}
              />
            </div>

            {/* Ícone */}
            <div>
              <Label className="flex items-center gap-2">
                <Smile className="w-4 h-4" />
                Ícone Selecionado: <span className="text-3xl">{formData.icon || '📦'}</span>
              </Label>
              <div className="space-y-4">
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  placeholder="Digite ou selecione um ícone"
                  className="text-2xl text-center"
                />
                
                <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-muted/30">
                  {Object.entries(ICONES_PREDEFINIDOS).map(([categoria, icones]) => (
                    <div key={categoria} className="mb-6 last:mb-0">
                      <h4 className="font-semibold text-sm mb-3 text-primary flex items-center gap-2">
                        <TagIcon className="w-4 h-4" />
                        {categoria}
                      </h4>
                      <div className="grid grid-cols-8 gap-2">
                        {icones.map(icone => (
                          <Button
                            key={icone}
                            type="button"
                            variant={formData.icon === icone ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFormData(prev => ({ ...prev, icon: icone }))}
                            className="text-2xl h-12 w-12 p-0 hover:scale-110 transition-transform"
                            title={icone}
                          >
                            {icone}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground text-center">
                  💡 Dica: Role para ver mais de 500 ícones organizados por categoria!
                </p>
              </div>
            </div>

            {/* Cor */}
            <div>
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Cor de Fundo
              </Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {CORES_PREDEFINIDAS.map(cor => (
                  <button
                    key={cor.classe}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, cor: cor.classe }))}
                    className={`h-12 rounded-lg bg-gradient-to-br ${cor.classe} ${
                      formData.cor === cor.classe ? 'ring-2 ring-primary ring-offset-2' : ''
                    }`}
                    title={cor.nome}
                  />
                ))}
              </div>
            </div>

            {/* Imagem */}
            <div>
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Imagem da Categoria
              </Label>
              <ImageUpload
                currentImage={formData.imagem_url}
                onImageUploaded={(url) => setFormData(prev => ({ ...prev, imagem_url: url }))}
                accept="image/*"
              />
            </div>

            {/* Ordem */}
            <div>
              <Label>Ordem de Exibição</Label>
              <Input
                type="number"
                value={formData.ordem}
                onChange={(e) => setFormData(prev => ({ ...prev, ordem: parseInt(e.target.value) }))}
                min={0}
              />
            </div>

            {/* SEO */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold">SEO (Opcional)</h3>
              
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={formData.meta_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                  placeholder="Título para SEO"
                />
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={formData.meta_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                  placeholder="Descrição para SEO"
                  rows={2}
                />
              </div>

              <div>
                <Label>Meta Keywords</Label>
                <Input
                  value={formData.meta_keywords}
                  onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                setShowEditDialog(false);
                setSelectedCategoria(null);
              }}
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={() => handleSave(showEditDialog)}>
              <Save className="w-4 h-4 mr-2" />
              {showEditDialog ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Deletar */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A categoria "{selectedCategoria?.nome}" será deletada permanentemente.
              {selectedCategoria && selectedCategoria.quantidade > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Esta categoria possui {selectedCategoria.quantidade} produto(s) associado(s)!
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

