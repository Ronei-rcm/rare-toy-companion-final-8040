import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  Tag,
  Image as ImageIcon,
  Save,
  X,
  FileText,
  TrendingUp,
  BarChart3,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadApi } from '@/services/upload-api';

interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo?: string;
  categoria: string;
  imagem_url?: string;
  imagem_destaque?: string;
  autor: string;
  autor_avatar?: string;
  tempo_leitura: number;
  visualizacoes: number;
  destaque: boolean;
  status: 'publicado' | 'rascunho' | 'arquivado';
  tags?: string[];
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  publicado_em?: string;
  created_at: string;
  updated_at: string;
}

const BlogAdmin = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todas');
  
  // Estados do formulário
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [activeTab, setActiveTab] = useState('conteudo');
  
  const [formData, setFormData] = useState({
    titulo: '',
    slug: '',
    resumo: '',
    conteudo: '',
    categoria: 'Notícias',
    imagem_url: '',
    imagem_destaque: '',
    autor: 'Equipe MuhlStore',
    autor_avatar: '',
    tempo_leitura: 5,
    destaque: false,
    status: 'rascunho' as 'publicado' | 'rascunho' | 'arquivado',
    tags: [] as string[],
    meta_title: '',
    meta_description: '',
    meta_keywords: ''
  });
  
  const [newTag, setNewTag] = useState('');
  const [uploading, setUploading] = useState(false);

  const categorias = ['Notícias', 'Lançamentos', 'Guias', 'Calendário', 'Reviews', 'Tutoriais', 'Eventos'];

  // Carregar posts
  const loadPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterStatus !== 'todos') params.append('status', filterStatus);
      if (filterCategoria !== 'todas') params.append('categoria', filterCategoria);
      if (searchTerm) params.append('busca', searchTerm);
      
      const response = await fetch(`/api/admin/blog/posts?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar posts');
      
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
      toast.error('Erro ao carregar posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [filterStatus, filterCategoria]);

  // Gerar slug automaticamente
  const generateSlug = (titulo: string) => {
    return titulo
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handler de mudança no título
  const handleTituloChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      titulo: value,
      slug: generateSlug(value)
    }));
  };

  // Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imagem_url' | 'imagem_destaque') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const uploadResult = await uploadApi.uploadImage(file);
      setFormData(prev => ({ ...prev, [field]: uploadResult.imageUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao enviar imagem:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  // Adicionar tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  // Remover tag
  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Abrir dialog de criação
  const handleCreate = () => {
    setEditingPost(null);
    setFormData({
      titulo: '',
      slug: '',
      resumo: '',
      conteudo: '',
      categoria: 'Notícias',
      imagem_url: '',
      imagem_destaque: '',
      autor: 'Equipe MuhlStore',
      autor_avatar: '',
      tempo_leitura: 5,
      destaque: false,
      status: 'rascunho',
      tags: [],
      meta_title: '',
      meta_description: '',
      meta_keywords: ''
    });
    setActiveTab('conteudo');
    setIsEditDialogOpen(true);
  };

  // Abrir dialog de edição
  const handleEdit = async (post: BlogPost) => {
    try {
      // Buscar post completo
      const response = await fetch(`/api/admin/blog/posts/${post.id}`);
      if (!response.ok) throw new Error('Erro ao carregar post');
      
      const fullPost = await response.json();
      setEditingPost(fullPost);
      setFormData({
        titulo: fullPost.titulo,
        slug: fullPost.slug,
        resumo: fullPost.resumo,
        conteudo: fullPost.conteudo || '',
        categoria: fullPost.categoria,
        imagem_url: fullPost.imagem_url || '',
        imagem_destaque: fullPost.imagem_destaque || '',
        autor: fullPost.autor,
        autor_avatar: fullPost.autor_avatar || '',
        tempo_leitura: fullPost.tempo_leitura,
        destaque: fullPost.destaque,
        status: fullPost.status,
        tags: fullPost.tags || [],
        meta_title: fullPost.meta_title || '',
        meta_description: fullPost.meta_description || '',
        meta_keywords: fullPost.meta_keywords || ''
      });
      setActiveTab('conteudo');
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar post:', error);
      toast.error('Erro ao carregar post');
    }
  };

  // Salvar post
  const handleSave = async () => {
    if (!formData.titulo || !formData.resumo || !formData.conteudo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const url = editingPost 
        ? `/api/admin/blog/posts/${editingPost.id}`
        : '/api/admin/blog/posts';
      
      const method = editingPost ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar post');
      }

      toast.success(editingPost ? 'Post atualizado com sucesso!' : 'Post criado com sucesso!');
      setIsEditDialogOpen(false);
      loadPosts();
    } catch (error: any) {
      console.error('Erro ao salvar post:', error);
      toast.error(error.message || 'Erro ao salvar post');
    }
  };

  // Deletar post
  const handleDelete = async () => {
    if (!postToDelete) return;

    try {
      const response = await fetch(`/api/admin/blog/posts/${postToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar post');

      toast.success('Post deletado com sucesso!');
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
      loadPosts();
    } catch (error) {
      console.error('Erro ao deletar post:', error);
      toast.error('Erro ao deletar post');
    }
  };

  // Alterar status
  const handleStatusChange = async (post: BlogPost, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/blog/posts/${post.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Erro ao alterar status');

      toast.success('Status atualizado com sucesso!');
      loadPosts();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
    }
  };

  // Filtrar posts
  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.resumo.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Estatísticas
  const stats = {
    total: posts.length,
    publicados: posts.filter(p => p.status === 'publicado').length,
    rascunhos: posts.filter(p => p.status === 'rascunho').length,
    destaques: posts.filter(p => p.destaque).length,
    visualizacoes: posts.reduce((acc, p) => acc + p.visualizacoes, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Blog & Notícias
          </h1>
          <p className="text-muted-foreground">Gerencie os posts do seu blog</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadPosts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Post
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total de Posts</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.publicados}</div>
              <div className="text-sm text-muted-foreground">Publicados</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Edit className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <div className="text-2xl font-bold">{stats.rascunhos}</div>
              <div className="text-sm text-muted-foreground">Rascunhos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{stats.destaques}</div>
              <div className="text-sm text-muted-foreground">Destaques</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.visualizacoes}</div>
              <div className="text-sm text-muted-foreground">Visualizações</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="publicado">Publicados</SelectItem>
                  <SelectItem value="rascunho">Rascunhos</SelectItem>
                  <SelectItem value="arquivado">Arquivados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Categoria</Label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('todos');
                  setFilterCategoria('todas');
                }}
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Posts */}
      <Card>
        <CardHeader>
          <CardTitle>Posts ({filteredPosts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum post encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Imagem */}
                    <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {post.imagem_url ? (
                        <img
                          src={post.imagem_url}
                          alt={post.titulo}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{post.titulo}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {post.resumo}
                          </p>
                        </div>
                        {post.destaque && (
                          <Badge variant="default" className="ml-2">
                            Destaque
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          {post.categoria}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {post.autor}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {post.tempo_leitura} min
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {post.visualizacoes} visualizações
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(post.created_at).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Select 
                          value={post.status} 
                          onValueChange={(value) => handleStatusChange(post, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="publicado">Publicado</SelectItem>
                            <SelectItem value="rascunho">Rascunho</SelectItem>
                            <SelectItem value="arquivado">Arquivado</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPostToDelete(post);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Edição/Criação */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPost ? 'Editar Post' : 'Novo Post'}
            </DialogTitle>
            <DialogDescription>
              Preencha as informações do post
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="conteudo">Conteúdo</TabsTrigger>
              <TabsTrigger value="imagens">Imagens</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            
            {/* Aba Conteúdo */}
            <TabsContent value="conteudo" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Título *</Label>
                  <Input
                    value={formData.titulo}
                    onChange={(e) => handleTituloChange(e.target.value)}
                    placeholder="Título do post"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-do-post"
                  />
                </div>
                
                <div>
                  <Label>Categoria</Label>
                  <Select 
                    value={formData.categoria} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value: any) => setFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="publicado">Publicado</SelectItem>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="arquivado">Arquivado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Autor</Label>
                  <Input
                    value={formData.autor}
                    onChange={(e) => setFormData(prev => ({ ...prev, autor: e.target.value }))}
                    placeholder="Nome do autor"
                  />
                </div>
                
                <div>
                  <Label>Tempo de Leitura (min)</Label>
                  <Input
                    type="number"
                    value={formData.tempo_leitura}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempo_leitura: parseInt(e.target.value) || 5 }))}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Resumo *</Label>
                  <Textarea
                    value={formData.resumo}
                    onChange={(e) => setFormData(prev => ({ ...prev, resumo: e.target.value }))}
                    placeholder="Breve resumo do post..."
                    rows={3}
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Conteúdo * (HTML permitido)</Label>
                  <Textarea
                    value={formData.conteudo}
                    onChange={(e) => setFormData(prev => ({ ...prev, conteudo: e.target.value }))}
                    placeholder="Conteúdo completo do post em HTML..."
                    rows={12}
                    className="font-mono text-sm"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Adicionar tag"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    />
                    <Button type="button" onClick={handleAddTag}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                        {tag}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center gap-2">
                  <Switch
                    checked={formData.destaque}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, destaque: checked }))}
                  />
                  <Label>Marcar como destaque</Label>
                </div>
              </div>
            </TabsContent>
            
            {/* Aba Imagens */}
            <TabsContent value="imagens" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Imagem Principal</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'imagem_url')}
                    disabled={uploading}
                  />
                  {formData.imagem_url && (
                    <div className="mt-2">
                      <img 
                        src={formData.imagem_url} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded border" 
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', formData.imagem_url);
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div>
                  <Label>Imagem Destaque (Banner)</Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'imagem_destaque')}
                    disabled={uploading}
                  />
                  {formData.imagem_destaque && (
                    <div className="mt-2">
                      <img 
                        src={formData.imagem_destaque} 
                        alt="Preview" 
                        className="w-full h-48 object-cover rounded border" 
                        onError={(e) => {
                          console.error('Erro ao carregar imagem:', formData.imagem_destaque);
                          (e.target as HTMLImageElement).src = '/placeholder.svg';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Aba SEO */}
            <TabsContent value="seo" className="space-y-4">
              <div className="space-y-4">
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
                    placeholder="Descrição para SEO (150-160 caracteres)"
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {formData.meta_description.length}/160 caracteres
                  </p>
                </div>
                
                <div>
                  <Label>Meta Keywords</Label>
                  <Input
                    value={formData.meta_keywords}
                    onChange={(e) => setFormData(prev => ({ ...prev, meta_keywords: e.target.value }))}
                    placeholder="palavras, chave, separadas, por, vírgula"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Post
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o post "<strong>{postToDelete?.titulo}</strong>"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BlogAdmin;

