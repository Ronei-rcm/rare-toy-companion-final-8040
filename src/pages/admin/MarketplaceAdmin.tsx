import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Search,
  Filter,
  Store,
  MapPin,
  Star,
  Award,
  Users,
  TrendingUp,
  RefreshCw,
  Save,
  X,
  Shield,
  Eye,
  Phone,
  Mail,
  Instagram as InstagramIcon,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { uploadApi } from '@/services/upload-api';
import { onImageError } from '@/utils/resolveImage';

interface MarketplaceSeller {
  id: string;
  nome: string;
  slug: string;
  descricao: string;
  especialidade: string;
  categoria: string;
  imagem_perfil?: string;
  imagem_capa?: string;
  avaliacao: number;
  total_avaliacoes: number;
  total_vendas: number;
  total_produtos: number;
  localizacao?: string;
  cidade?: string;
  estado?: string;
  tempo_resposta: string;
  destaque: boolean;
  verificado: boolean;
  ativo: boolean;
  email?: string;
  telefone?: string;
  whatsapp?: string;
  instagram?: string;
  website?: string;
  politica_troca?: string;
  politica_envio?: string;
  horario_atendimento?: string;
  tags?: string[];
  certificacoes?: string[];
  created_at: string;
}

const MarketplaceAdmin = () => {
  const [sellers, setSellers] = useState<MarketplaceSeller[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('todos');
  const [filterAtivo, setFilterAtivo] = useState('todos');
  
  // Estados do formulário
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSeller, setEditingSeller] = useState<MarketplaceSeller | null>(null);
  const [sellerToDelete, setSellerToDelete] = useState<MarketplaceSeller | null>(null);
  const [activeTab, setActiveTab] = useState('basico');
  
  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    descricao: '',
    especialidade: '',
    categoria: 'vintage',
    imagem_perfil: '',
    imagem_capa: '',
    avaliacao: 0,
    localizacao: '',
    cidade: '',
    estado: '',
    tempo_resposta: '24h',
    destaque: false,
    verificado: false,
    ativo: true,
    email: '',
    telefone: '',
    whatsapp: '',
    instagram: '',
    website: '',
    politica_troca: '',
    politica_envio: '',
    horario_atendimento: '',
    tags: [] as string[],
    certificacoes: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');
  const [newCertificacao, setNewCertificacao] = useState('');
  const [uploading, setUploading] = useState(false);

  const categorias = [
    'vintage',
    'trens',
    'pelucia',
    'carrinhos',
    'bonecas',
    'jogos',
    'action-figures',
    'lego',
    'outros'
  ];

  // Carregar vendedores
  const loadSellers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterCategoria !== 'todos') params.append('categoria', filterCategoria);
      if (filterAtivo !== 'todos') params.append('ativo', filterAtivo);
      if (searchTerm) params.append('busca', searchTerm);
      
      const response = await fetch(`/api/admin/marketplace/sellers?${params}`);
      if (!response.ok) throw new Error('Erro ao carregar vendedores');
      
      const data = await response.json();
      setSellers(data);
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      toast.error('Erro ao carregar vendedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, [filterCategoria, filterAtivo]);

  // Gerar slug
  const generateSlug = (nome: string) => {
    return nome
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Upload de imagem
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'imagem_perfil' | 'imagem_capa') => {
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

  // Tags e Certificações
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag.trim()] }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const handleAddCertificacao = () => {
    if (newCertificacao.trim() && !formData.certificacoes.includes(newCertificacao.trim())) {
      setFormData(prev => ({ ...prev, certificacoes: [...prev.certificacoes, newCertificacao.trim()] }));
      setNewCertificacao('');
    }
  };

  const handleRemoveCertificacao = (cert: string) => {
    setFormData(prev => ({ ...prev, certificacoes: prev.certificacoes.filter(c => c !== cert) }));
  };

  // CRUD operations
  const handleCreate = () => {
    setEditingSeller(null);
    setFormData({
      nome: '',
      slug: '',
      descricao: '',
      especialidade: '',
      categoria: 'vintage',
      imagem_perfil: '',
      imagem_capa: '',
      avaliacao: 0,
      localizacao: '',
      cidade: '',
      estado: '',
      tempo_resposta: '24h',
      destaque: false,
      verificado: false,
      ativo: true,
      email: '',
      telefone: '',
      whatsapp: '',
      instagram: '',
      website: '',
      politica_troca: '',
      politica_envio: '',
      horario_atendimento: '',
      tags: [],
      certificacoes: []
    });
    setActiveTab('basico');
    setIsEditDialogOpen(true);
  };

  const handleEdit = async (seller: MarketplaceSeller) => {
    try {
      const response = await fetch(`/api/admin/marketplace/sellers/${seller.id}`);
      if (!response.ok) throw new Error('Erro ao carregar vendedor');
      
      const fullSeller = await response.json();
      setEditingSeller(fullSeller);
      setFormData({
        nome: fullSeller.nome,
        slug: fullSeller.slug,
        descricao: fullSeller.descricao,
        especialidade: fullSeller.especialidade || '',
        categoria: fullSeller.categoria,
        imagem_perfil: fullSeller.imagem_perfil || '',
        imagem_capa: fullSeller.imagem_capa || '',
        avaliacao: fullSeller.avaliacao || 0,
        localizacao: fullSeller.localizacao || '',
        cidade: fullSeller.cidade || '',
        estado: fullSeller.estado || '',
        tempo_resposta: fullSeller.tempo_resposta || '24h',
        destaque: fullSeller.destaque,
        verificado: fullSeller.verificado,
        ativo: fullSeller.ativo,
        email: fullSeller.email || '',
        telefone: fullSeller.telefone || '',
        whatsapp: fullSeller.whatsapp || '',
        instagram: fullSeller.instagram || '',
        website: fullSeller.website || '',
        politica_troca: fullSeller.politica_troca || '',
        politica_envio: fullSeller.politica_envio || '',
        horario_atendimento: fullSeller.horario_atendimento || '',
        tags: fullSeller.tags || [],
        certificacoes: fullSeller.certificacoes || []
      });
      setActiveTab('basico');
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error('Erro ao carregar vendedor:', error);
      toast.error('Erro ao carregar vendedor');
    }
  };

  const handleSave = async () => {
    if (!formData.nome || !formData.descricao || !formData.categoria) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const url = editingSeller 
        ? `/api/admin/marketplace/sellers/${editingSeller.id}`
        : '/api/admin/marketplace/sellers';
      
      const method = editingSeller ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar vendedor');
      }

      toast.success(editingSeller ? 'Vendedor atualizado!' : 'Vendedor criado!');
      setIsEditDialogOpen(false);
      loadSellers();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar');
    }
  };

  const handleDelete = async () => {
    if (!sellerToDelete) return;

    try {
      const response = await fetch(`/api/admin/marketplace/sellers/${sellerToDelete.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao deletar');

      toast.success('Vendedor deletado!');
      setIsDeleteDialogOpen(false);
      setSellerToDelete(null);
      loadSellers();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      toast.error('Erro ao deletar');
    }
  };

  const handleToggle = async (seller: MarketplaceSeller, field: 'ativo' | 'destaque' | 'verificado', value: boolean) => {
    try {
      const response = await fetch(`/api/admin/marketplace/sellers/${seller.id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ field, value })
      });

      if (!response.ok) throw new Error('Erro ao alternar status');

      toast.success(`${field} atualizado!`);
      loadSellers();
    } catch (error) {
      console.error('Erro ao alternar:', error);
      toast.error('Erro ao alternar status');
    }
  };

  const stats = {
    total: sellers.length,
    ativos: sellers.filter(s => s.ativo).length,
    destaques: sellers.filter(s => s.destaque).length,
    verificados: sellers.filter(s => s.verificado).length,
    totalVendas: sellers.reduce((acc, s) => acc + s.total_vendas, 0)
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8" />
            Marketplace - Vendedores
          </h1>
          <p className="text-muted-foreground">Gerencie os vendedores do marketplace</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadSellers} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Vendedor
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Store className="h-8 w-8 mx-auto mb-2 text-primary" />
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold">{stats.ativos}</div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold">{stats.destaques}</div>
              <div className="text-sm text-muted-foreground">Destaques</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold">{stats.verificados}</div>
              <div className="text-sm text-muted-foreground">Verificados</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold">{stats.totalVendas}</div>
              <div className="text-sm text-muted-foreground">Vendas Total</div>
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
                  placeholder="Buscar vendedores..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <div>
              <Label>Categoria</Label>
              <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {categorias.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Status</Label>
              <Select value={filterAtivo} onValueChange={setFilterAtivo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="true">Ativos</SelectItem>
                  <SelectItem value="false">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setFilterCategoria('todos');
                  setFilterAtivo('todos');
                }}
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vendedores */}
      <Card>
        <CardHeader>
          <CardTitle>Vendedores ({sellers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : sellers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum vendedor encontrado</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sellers.map((seller) => (
                <motion.div
                  key={seller.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-4">
                    {/* Imagem */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {seller.imagem_perfil ? (
                        <img
                          src={seller.imagem_perfil}
                          alt={seller.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Informações */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                            {seller.nome}
                            {seller.verificado && (
                              <Shield className="h-4 w-4 text-blue-600" />
                            )}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {seller.descricao}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          {seller.destaque && <Badge variant="default">Destaque</Badge>}
                          {seller.ativo ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Inativo</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          {seller.avaliacao.toFixed(1)}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {seller.total_vendas} vendas
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {seller.total_produtos} produtos
                        </div>
                        {seller.localizacao && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {seller.localizacao}
                          </div>
                        )}
                        <Badge variant="secondary">{seller.categoria}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Ativo:</Label>
                          <Switch
                            checked={seller.ativo}
                            onCheckedChange={(checked) => handleToggle(seller, 'ativo', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Destaque:</Label>
                          <Switch
                            checked={seller.destaque}
                            onCheckedChange={(checked) => handleToggle(seller, 'destaque', checked)}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Label className="text-xs">Verificado:</Label>
                          <Switch
                            checked={seller.verificado}
                            onCheckedChange={(checked) => handleToggle(seller, 'verificado', checked)}
                          />
                        </div>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(seller)}
                          className="ml-auto"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSellerToDelete(seller);
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
              {editingSeller ? 'Editar Vendedor' : 'Novo Vendedor'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basico">Básico</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="imagens">Imagens</TabsTrigger>
              <TabsTrigger value="extras">Extras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basico" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value, slug: generateSlug(e.target.value) }))}
                    placeholder="Nome do vendedor"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Slug</Label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="slug-do-vendedor"
                  />
                </div>
                
                <div>
                  <Label>Categoria *</Label>
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
                  <Label>Especialidade</Label>
                  <Input
                    value={formData.especialidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, especialidade: e.target.value }))}
                    placeholder="Ex: Hot Wheels Raros"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Descrição *</Label>
                  <Textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Descrição do vendedor..."
                    rows={4}
                  />
                </div>
                
                <div>
                  <Label>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                    placeholder="São Paulo"
                  />
                </div>
                
                <div>
                  <Label>Estado (UF)</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value.toUpperCase() }))}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
                
                <div>
                  <Label>Avaliação (0-5)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={formData.avaliacao}
                    onChange={(e) => setFormData(prev => ({ ...prev, avaliacao: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                
                <div>
                  <Label>Tempo de Resposta</Label>
                  <Input
                    value={formData.tempo_resposta}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempo_resposta: e.target.value }))}
                    placeholder="Ex: 2h, 24h"
                  />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                    />
                    <Label>Ativo</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.destaque}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, destaque: checked }))}
                    />
                    <Label>Destaque</Label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.verificado}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, verificado: checked }))}
                    />
                    <Label>Verificado</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="contato" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@vendedor.com"
                  />
                </div>
                
                <div>
                  <Label>Telefone</Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 98765-4321"
                  />
                </div>
                
                <div>
                  <Label>WhatsApp</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData(prev => ({ ...prev, whatsapp: e.target.value }))}
                    placeholder="11987654321"
                  />
                </div>
                
                <div>
                  <Label>Instagram</Label>
                  <Input
                    value={formData.instagram}
                    onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                    placeholder="@vendedor"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Website</Label>
                  <Input
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://vendedor.com.br"
                  />
                </div>
                
                <div className="col-span-2">
                  <Label>Horário de Atendimento</Label>
                  <Input
                    value={formData.horario_atendimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, horario_atendimento: e.target.value }))}
                    placeholder="Seg-Sex: 9h-18h"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="imagens" className="space-y-4">
              <div>
                <Label>Imagem de Perfil</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'imagem_perfil')}
                  disabled={uploading}
                />
                {formData.imagem_perfil && (
                  <div className="mt-2">
                    <img 
                      src={formData.imagem_perfil} 
                      alt="Preview" 
                      className="w-48 h-48 object-cover rounded border" 
                      onError={onImageError}
                    />
                  </div>
                )}
              </div>
              
              <div>
                <Label>Imagem de Capa</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'imagem_capa')}
                  disabled={uploading}
                />
                {formData.imagem_capa && (
                  <div className="mt-2">
                    <img 
                      src={formData.imagem_capa} 
                      alt="Preview" 
                      className="w-full h-48 object-cover rounded border" 
                      onError={onImageError}
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="extras" className="space-y-4">
              <div>
                <Label>Tags/Especialidades</Label>
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
              
              <div>
                <Label>Certificações</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newCertificacao}
                    onChange={(e) => setNewCertificacao(e.target.value)}
                    placeholder="Adicionar certificação"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCertificacao())}
                  />
                  <Button type="button" onClick={handleAddCertificacao}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.certificacoes.map((cert, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer" onClick={() => handleRemoveCertificacao(cert)}>
                      {cert}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Política de Troca</Label>
                <Textarea
                  value={formData.politica_troca}
                  onChange={(e) => setFormData(prev => ({ ...prev, politica_troca: e.target.value }))}
                  placeholder="Descreva a política de troca..."
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Política de Envio</Label>
                <Textarea
                  value={formData.politica_envio}
                  onChange={(e) => setFormData(prev => ({ ...prev, politica_envio: e.target.value }))}
                  placeholder="Descreva a política de envio..."
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={uploading}>
              <Save className="h-4 w-4 mr-2" />
              Salvar Vendedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "<strong>{sellerToDelete?.nome}</strong>"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir Vendedor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MarketplaceAdmin;

