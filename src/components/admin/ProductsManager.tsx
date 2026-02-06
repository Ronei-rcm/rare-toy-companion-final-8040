import React, { useState, useRef } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { Produto } from '@/types/produto';
import { CreateProductData } from '@/services/products-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ImageUpload from '@/components/admin/ImageUpload';
import EnhancedImageUpload from '@/components/admin/EnhancedImageUpload';
import ImageGalleryUpload from '@/components/admin/ImageGalleryUpload';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, Edit, Plus, Package, Star, Tag, Zap, Info, DollarSign, Box, Image as ImageIcon, ShoppingBag, Settings, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BadgeSelector from '@/components/admin/BadgeSelector';

export const ProductsManager = () => {
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [formErrors, setFormErrors] = useState<{ nome?: string; preco?: string; categoria?: string; imagemUrl?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; isMain?: boolean; order: number }[]>([]);
  const [selectedCondicao, setSelectedCondicao] = useState<string>('novo');
  const [selectedBadges, setSelectedBadges] = useState<number[]>([]);
  const [formData, setFormData] = useState<CreateProductData>({
    nome: '',
    descricao: '',
    preco: 0,
    imagemUrl: '/placeholder.svg',
    imagens: [],
    categoria: '',
    estoque: 0,
    status: 'ativo',
    destaque: false,
    promocao: false,
    lancamento: false,
    novo: false,
    avaliacao: 0,
    totalAvaliacoes: 0,
    faixaEtaria: '',
    peso: '',
    dimensoes: '',
    material: '',
    marca: '',
    origem: '',
    fornecedor: '',
    codigoBarras: '',
    dataLancamento: '',
  });

  const categorias = [
    'Action Figures',
    'Bonecos',
    'Colecionáveis',
    'Jogos',
    'Livros',
    'Roupas',
    'Acessórios',
    'Outros'
  ];

  // Busca e paginação
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const filtered = products.filter(p => {
    const term = search.toLowerCase();
    return (
      p.nome.toLowerCase().includes(term) ||
      (p.categoria || '').toLowerCase().includes(term)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleCreateProduct = async () => {
    if (!validateForm()) {
      toast({ title: 'Revise os campos obrigatórios', description: 'Preencha os campos destacados.', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const validGallery = galleryImages.filter(img => img.url && !img.url.startsWith('blob:'));
      const mainImage = validGallery.find(img => img.isMain)?.url || validGallery[0]?.url || formData.imagemUrl;
      if (!mainImage || mainImage.startsWith('blob:')) {
        toast({ title: 'Imagem inválida', description: 'Use URLs hospedadas ou upload que retorne URL final (sem blob:).', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      const newProduct = await createProduct({
        ...formData,
        imagemUrl: mainImage || '/placeholder.svg',
        imagens: validGallery.map(img => img.url),
      });
      if (newProduct) {
        toast({
          title: "Produto criado!",
          description: `${newProduct.nome} foi adicionado com sucesso.`,
        });
        setIsCreateDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Erro ao criar produto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!editingProduct) return;
    if (!validateForm()) {
      toast({ title: 'Revise os campos obrigatórios', description: 'Preencha os campos destacados.', variant: 'destructive' });
      return;
    }
    try {
      setSubmitting(true);
      const validGallery = galleryImages.filter(img => img.url && !img.url.startsWith('blob:'));
      const mainImage = validGallery.find(img => img.isMain)?.url || validGallery[0]?.url || formData.imagemUrl;
      if (!mainImage || mainImage.startsWith('blob:')) {
        toast({ title: 'Imagem inválida', description: 'Use URLs hospedadas ou upload que retorne URL final (sem blob:).', variant: 'destructive' });
        setSubmitting(false);
        return;
      }
      const updatedProduct = await updateProduct(editingProduct.id, {
        ...formData,
        imagemUrl: mainImage || '/placeholder.svg',
        imagens: validGallery.map(img => img.url),
      });
      if (updatedProduct) {
        toast({
          title: "Produto atualizado!",
          description: `${updatedProduct.nome} foi atualizado com sucesso.`,
        });
        setIsEditDialogOpen(false);
        setEditingProduct(null);
        resetForm();
      }
    } catch (error) {
      toast({
        title: "Erro ao atualizar produto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: Produto) => {
    if (!confirm(`Tem certeza que deseja deletar "${product.nome}"?`)) return;
    
    try {
      const success = await deleteProduct(product.id);
      if (success) {
        toast({
          title: "Produto deletado!",
          description: `${product.nome} foi removido com sucesso.`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao deletar produto",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: Produto) => {
    setEditingProduct(product);
    setFormData({
      nome: product.nome,
      descricao: product.descricao || '',
      preco: product.preco,
      imagemUrl: product.imagemUrl || '/placeholder.svg',
      imagens: product.imagens || [],
      categoria: product.categoria,
      estoque: product.estoque,
      status: product.status as 'ativo' | 'inativo' | 'esgotado',
      destaque: product.destaque,
      promocao: product.promocao,
      lancamento: product.lancamento,
      novo: product.novo || false,
      avaliacao: product.avaliacao || 0,
      totalAvaliacoes: product.totalAvaliacoes || 0,
      faixaEtaria: product.faixaEtaria || '',
      peso: product.peso || '',
      dimensoes: product.dimensoes || '',
      material: product.material || '',
      marca: product.marca || '',
      origem: product.origem || '',
      fornecedor: product.fornecedor || '',
      codigoBarras: product.codigoBarras || '',
      dataLancamento: product.dataLancamento || '',
    });
    const existingGallery = (product.imagens && product.imagens.length > 0 ? product.imagens : [product.imagemUrl]).filter(Boolean).map((url, idx) => ({
      id: `img-${product.id}-${idx}`,
      url,
      isMain: idx === 0,
      order: idx,
    }));
    setGalleryImages(existingGallery);
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      preco: 0,
      imagemUrl: '/placeholder.svg',
      imagens: [],
      categoria: '',
      estoque: 0,
      status: 'ativo',
      destaque: false,
      promocao: false,
      lancamento: false,
      novo: false,
      avaliacao: 0,
      totalAvaliacoes: 0,
      faixaEtaria: '',
      peso: '',
      dimensoes: '',
      material: '',
      marca: '',
      origem: '',
      fornecedor: '',
      codigoBarras: '',
      dataLancamento: '',
    });
    setFormErrors({});
    setGalleryImages([]);
  };

  const validateForm = (): boolean => {
    const errors: { nome?: string; preco?: string; categoria?: string; imagemUrl?: string } = {};
    if (!formData.nome?.trim()) {
      errors.nome = 'Informe o nome do produto';
    }
    if (formData.preco === undefined || formData.preco === null || isNaN(formData.preco) || formData.preco <= 0) {
      errors.preco = 'Preço deve ser maior que 0';
    }
    if (!formData.categoria?.trim()) {
      errors.categoria = 'Selecione uma categoria';
    }
    const validGallery = galleryImages.filter(img => img.url && !img.url.startsWith('blob:'));
    const mainImage = validGallery.find(img => img.isMain)?.url || validGallery[0]?.url || formData.imagemUrl;
    const url = mainImage?.trim();
    const isValidUrl = !!url && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/'));
    if (!isValidUrl || url === '/placeholder.svg') {
      errors.imagemUrl = 'Informe ao menos uma imagem hospedada (sem blob:)';
    } else {
      if (url !== formData.imagemUrl) {
        setFormData(prev => ({ ...prev, imagemUrl: url }));
      }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => {
    const [activeTab, setActiveTab] = React.useState('basico');
    
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6 bg-white border border-gray-200 rounded-lg p-1">
          <TabsTrigger value="basico" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Básico</span>
          </TabsTrigger>
          <TabsTrigger value="preco" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Preço</span>
          </TabsTrigger>
          <TabsTrigger value="imagens" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Imagens</span>
          </TabsTrigger>
          <TabsTrigger value="extra" className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Extras</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basico" className="space-y-6 mt-0">
          {/* Informações Básicas */}
          <div className="space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Info className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Informações Básicas</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-sm font-medium">Nome do Produto *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  placeholder="Ex: Boneca Nini e seu Cavalo"
                  className={formErrors.nome ? 'border-red-500' : undefined}
                />
                {formErrors.nome && <p className="text-xs text-red-600 mt-1">{formErrors.nome}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria" className="text-sm font-medium">Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
                  <SelectTrigger className={formErrors.categoria ? 'border-red-500' : undefined}>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoria && <p className="text-xs text-red-600 mt-1">{formErrors.categoria}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descricao" className="text-sm font-medium">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                placeholder="Descreva o produto de forma atrativa..."
                rows={3}
                className="resize-none"
              />
            </div>
          </div>

          {/* Condição e Badges */}
          <div className="space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <Tag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Condição e Badges</h3>
            </div>
            <BadgeSelector
              selectedCondicao={selectedCondicao}
              selectedBadges={selectedBadges}
              onCondicaoChange={setSelectedCondicao}
              onBadgesChange={setSelectedBadges}
            />
          </div>
        </TabsContent>

        <TabsContent value="preco" className="space-y-6 mt-0">
          {/* Preço e Estoque */}
          <div className="space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <DollarSign className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Preço e Estoque</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="preco" className="text-sm font-medium">Preço (R$) *</Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={formData.preco}
              onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
              placeholder="0.00"
              className={formErrors.preco ? 'border-red-500' : undefined}
            />
            {formErrors.preco && <p className="text-xs text-red-600 mt-1">{formErrors.preco}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="estoque" className="text-sm font-medium">Estoque *</Label>
            <Input
              id="estoque"
              type="number"
              value={formData.estoque}
              onChange={(e) => setFormData(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
                <SelectItem value="esgotado">Esgotado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

        </TabsContent>

        <TabsContent value="imagens" className="space-y-6 mt-0">
          {/* Imagens do Produto */}
          <div className="space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <ImageIcon className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Imagens do Produto</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Imagem Principal *</Label>
            <EnhancedImageUpload
              label=""
              value={formData.imagemUrl}
              onChange={(url) => setFormData(prev => ({ ...prev, imagemUrl: url }))}
              placeholder="Cole uma URL ou faça upload de uma imagem"
              showPreview={true}
              maxSize={10}
            />
            {formErrors.imagemUrl && <p className="text-xs text-red-600 mt-1">{formErrors.imagemUrl}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Galeria de Imagens</Label>
            <ImageGalleryUpload
              images={galleryImages}
              onChange={(imgs) => {
                setGalleryImages(imgs);
                const sanitized = imgs.filter(i => i.url && !i.url.startsWith('blob:'));
                const main = sanitized.find(img => img.isMain)?.url || sanitized[0]?.url || formData.imagemUrl;
                setFormData(prev => ({ ...prev, imagemUrl: main || prev.imagemUrl, imagens: sanitized.map(i => i.url) }));
              }}
              maxImages={8}
              maxSizePerImage={8}
              allowMainImage
              allowReorder
            />
            <p className="text-xs text-muted-foreground mt-1">
              Escolha a capa marcando "Principal"; demais entram como galeria.
            </p>
          </div>
        </div>
      </div>

        </TabsContent>

        <TabsContent value="extra" className="space-y-6 mt-0">
          {/* Detalhes Adicionais */}
          <div className="space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <ShoppingBag className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Detalhes Adicionais</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="marca" className="text-sm font-medium">Marca</Label>
                <Input
                  id="marca"
                  value={formData.marca}
                  onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                  placeholder="Ex: Mattel, Hasbro..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="material" className="text-sm font-medium">Material</Label>
                <Input
                  id="material"
                  value={formData.material}
                  onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  placeholder="Ex: Plástico, Madeira, Tecido..."
                />
              </div>
            </div>
          </div>

          {/* Opções Especiais */}
          <div className="space-y-4 p-4 rounded-lg bg-white border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 pb-2 border-b border-border/50">
          <Settings className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Opções Especiais</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-md bg-background/50 border border-border/30">
            <Switch
              id="destaque"
              checked={formData.destaque}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, destaque: checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="destaque" className="text-sm font-medium cursor-pointer">Destaque</Label>
              <p className="text-xs text-muted-foreground">Destacar na home</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md bg-background/50 border border-border/30">
            <Switch
              id="promocao"
              checked={formData.promocao}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, promocao: checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="promocao" className="text-sm font-medium cursor-pointer">Promoção</Label>
              <p className="text-xs text-muted-foreground">Mostrar badge de promoção</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md bg-background/50 border border-border/30">
            <Switch
              id="lancamento"
              checked={formData.lancamento}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lancamento: checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="lancamento" className="text-sm font-medium cursor-pointer">Lançamento</Label>
              <p className="text-xs text-muted-foreground">Marcar como novo lançamento</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-md bg-green-50 border border-green-200">
            <Switch
              id="novo"
              checked={formData.novo}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, novo: checked }))}
            />
            <div className="flex-1">
              <Label htmlFor="novo" className="text-sm font-medium cursor-pointer text-green-700">✨ Novo</Label>
              <p className="text-xs text-green-600">Produto novo na loja</p>
            </div>
          </div>
        </div>
      </div>

          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/50 bg-white sticky bottom-0 pb-0 mt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                if (isEdit) {
                  setIsEditDialogOpen(false);
                  setEditingProduct(null);
                } else {
                  setIsCreateDialogOpen(false);
                }
                resetForm();
              }}
              className="min-w-[100px]"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={isEdit ? handleUpdateProduct : handleCreateProduct}
              disabled={submitting || !formData.nome || !formData.categoria || !!Object.keys(formErrors).length}
              className="min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              {submitting ? (
                <>
                  <Package className="h-4 w-4 mr-2 animate-spin" />
                  {isEdit ? 'Atualizando...' : 'Criando...'}
                </>
              ) : (
                <>
                  <Package className="h-4 w-4 mr-2" />
                  {isEdit ? 'Atualizar Produto' : 'Criar Produto'}
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Package className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p>Carregando produtos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Erro ao carregar produtos: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Produtos</h2>
          <p className="text-muted-foreground">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            placeholder="Buscar por nome ou categoria"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-64"
          />
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {visible.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="flex">
              {/* Miniatura da imagem */}
              <div className="w-24 h-24 flex-shrink-0 relative">
                <img
                  src={product.imagemUrl || '/placeholder.svg'}
                  alt={product.nome}
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcyIDIwIDIyIDI0LjQ3NzIgMjIgMzBTMjYuNDc3MiA0MCAzMiA0MEMzNy41MjI4IDQwIDQyIDM1LjUyMjggNDIgMzBTMzcuNTIyOCAyMCAzMiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTMyIDI0QzI4LjY4NjMgMjQgMjYgMjYuNjg2MyAyNiAzMEMyNiAzMy4zMTM3IDI4LjY4NjMgMzYgMzIgMzZDMzUuMzEzNyAzNiAzOCAzMy4zMTM3IDM4IDMwQzM4IDI2LjY4NjMgMzUuMzEzNyAyNCAzMiAyNFoiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
                  }}
                />
                <div className="absolute top-1 right-1 flex flex-col space-y-1">
                  {product.destaque && <Badge variant="secondary" className="text-xs px-1 py-0"><Star className="h-2 w-2" /></Badge>}
                  {product.promocao && <Badge variant="destructive" className="text-xs px-1 py-0"><Tag className="h-2 w-2" /></Badge>}
                  {product.lancamento && <Badge variant="default" className="text-xs px-1 py-0"><Zap className="h-2 w-2" /></Badge>}
                  {product.novo && <Badge className="text-xs px-1 py-0 bg-green-500 hover:bg-green-600">✨</Badge>}
                  {product.seminovo && <Badge className="text-xs px-1 py-0 bg-orange-500 hover:bg-orange-600"><Package className="h-2 w-2" /></Badge>}
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{product.nome}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.categoria}</p>
                    
                    {/* Badges Visíveis */}
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {product.destaque && (
                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700 bg-yellow-50">
                          <Star className="w-3 h-3 mr-1" />
                          Destaque
                        </Badge>
                      )}
                      {product.promocao && (
                        <Badge variant="outline" className="text-xs border-red-500 text-red-700 bg-red-50">
                          <Tag className="w-3 h-3 mr-1" />
                          Promoção
                        </Badge>
                      )}
                      {product.lancamento && (
                        <Badge variant="outline" className="text-xs border-blue-500 text-blue-700 bg-blue-50">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Lançamento
                        </Badge>
                      )}
                      {product.novo && (
                        <Badge variant="outline" className="text-xs border-green-500 text-green-700 bg-green-50">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Novo
                        </Badge>
                      )}
                      {product.seminovo && (
                        <Badge variant="outline" className="text-xs border-orange-500 text-orange-700 bg-orange-50">
                          <Package className="w-3 h-3 mr-1" />
                          Seminovo
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 mb-3">
                      <span className="text-xl font-bold text-green-600">R$ {product.preco.toFixed(2)}</span>
                      <Badge variant={product.estoque > 0 ? 'default' : 'destructive'} className="text-xs">
                        <Package className="w-3 h-3 mr-1" />
                        {product.estoque} em estoque
                      </Badge>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </span>
          <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
            Próxima
          </Button>
        </div>
      )}

      {products.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro produto.
          </p>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeiro Produto
          </Button>
        </div>
      )}

      {/* Create Modal - Modal Profissional com Componente Dedicado */}
      {/* Create Modal - Dialog do Shadcn/UI */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          resetForm();
        }
      }}>
        <DialogContent 
          className="!max-w-[96vw] !w-[96vw] !h-[96vh] !max-h-[96vh] overflow-y-auto p-6 !top-[2vh] !left-[2vw] !translate-x-0 !translate-y-0 !fixed !z-[9999]" 
          style={{ 
            position: 'fixed !important' as any,
            maxWidth: '96vw !important', 
            width: '96vw !important', 
            height: '96vh !important', 
            maxHeight: '96vh !important',
            top: '2vh !important',
            left: '2vw !important',
            right: 'auto !important',
            bottom: 'auto !important',
            transform: 'none !important',
            margin: '0 !important',
            zIndex: 9999
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Criar Novo Produto</DialogTitle>
            <DialogDescription className="text-base">
              Preencha os dados do produto para adicioná-lo ao catálogo
            </DialogDescription>
          </DialogHeader>
          <ProductForm isEdit={false} />
        </DialogContent>
      </Dialog>

      {/* Edit Modal - Dialog do Shadcn/UI - TOPO ESQUERDO FORÇADO */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsEditDialogOpen(false);
          setEditingProduct(null);
          resetForm();
        }
      }}>
        <DialogContent 
          className="!max-w-[96vw] !w-[96vw] !h-[96vh] !max-h-[96vh] overflow-y-auto p-6 !top-[2vh] !left-[2vw] !translate-x-0 !translate-y-0 !fixed !z-[9999]" 
          style={{ 
            position: 'fixed !important' as any,
            maxWidth: '96vw !important', 
            width: '96vw !important', 
            height: '96vh !important', 
            maxHeight: '96vh !important',
            top: '2vh !important',
            left: '2vw !important',
            right: 'auto !important',
            bottom: 'auto !important',
            transform: 'none !important',
            margin: '0 !important',
            zIndex: 9999
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">Editar Produto Completo</DialogTitle>
            <DialogDescription className="text-base">
              Edite todos os dados do produto: nome, categoria, preço, estoque, descrição e badges
            </DialogDescription>
          </DialogHeader>
          <ProductForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};
