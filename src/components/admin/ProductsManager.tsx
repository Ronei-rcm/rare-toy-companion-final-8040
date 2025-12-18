import React, { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Package, Star, Tag, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const ProductsManager = () => {
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [formErrors, setFormErrors] = useState<{ nome?: string; preco?: string; categoria?: string; imagemUrl?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [galleryImages, setGalleryImages] = useState<{ id: string; url: string; isMain?: boolean; order: number }[]>([]);
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

  const ProductForm = ({ isEdit = false }: { isEdit?: boolean }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
            placeholder="Nome do produto"
            className={formErrors.nome ? 'border-red-500' : undefined}
          />
          {formErrors.nome && <p className="text-xs text-red-600">{formErrors.nome}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria *</Label>
          <Select value={formData.categoria} onValueChange={(value) => setFormData(prev => ({ ...prev, categoria: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              {categorias.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.categoria && <p className="text-xs text-red-600">{formErrors.categoria}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Descrição do produto"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="preco">Preço *</Label>
          <Input
            id="preco"
            type="number"
            step="0.01"
            value={formData.preco}
            onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
            placeholder="0.00"
            className={formErrors.preco ? 'border-red-500' : undefined}
          />
          {formErrors.preco && <p className="text-xs text-red-600">{formErrors.preco}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="estoque">Estoque</Label>
          <Input
            id="estoque"
            type="number"
            value={formData.estoque}
            onChange={(e) => setFormData(prev => ({ ...prev, estoque: parseInt(e.target.value) || 0 }))}
            placeholder="0"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
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

      <EnhancedImageUpload
        label="Imagem do Produto"
        value={formData.imagemUrl}
        onChange={(url) => setFormData(prev => ({ ...prev, imagemUrl: url }))}
        placeholder="Cole uma URL ou faça upload de uma imagem"
        showPreview={true}
        maxSize={10}
      />
      {formErrors.imagemUrl && <p className="text-xs text-red-600">{formErrors.imagemUrl}</p>}

      <div className="space-y-2">
        <Label>Galeria de imagens (capa + extras)</Label>
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
        <p className="text-xs text-gray-500">Escolha a capa marcando “Principal”; demais entram como galeria.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="marca">Marca</Label>
          <Input
            id="marca"
            value={formData.marca}
            onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
            placeholder="Marca do produto"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="material">Material</Label>
          <Input
            id="material"
            value={formData.material}
            onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
            placeholder="Material do produto"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="destaque"
              checked={formData.destaque}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, destaque: checked }))}
            />
            <Label htmlFor="destaque">Destaque</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="promocao"
              checked={formData.promocao}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, promocao: checked }))}
            />
            <Label htmlFor="promocao">Promoção</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="lancamento"
              checked={formData.lancamento}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, lancamento: checked }))}
            />
            <Label htmlFor="lancamento">Lançamento</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            if (isEdit) {
              setIsEditDialogOpen(false);
              setEditingProduct(null);
            } else {
              setIsCreateDialogOpen(false);
            }
            resetForm();
          }}
        >
          Cancelar
        </Button>
        <Button
          onClick={isEdit ? handleUpdateProduct : handleCreateProduct}
          disabled={submitting || !formData.nome || !formData.categoria || !!Object.keys(formErrors).length}
        >
          {submitting ? (isEdit ? 'Atualizando...' : 'Criando...') : (isEdit ? 'Atualizar' : 'Criar')} Produto
        </Button>
      </div>
    </div>
  );

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
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[500px] max-h-[70vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produto para adicioná-lo ao catálogo.
                </DialogDescription>
              </DialogHeader>
              <ProductForm />
            </DialogContent>
          </Dialog>
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
                </div>
              </div>
              
              <div className="flex-1 p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg mb-1">{product.nome}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{product.categoria}</p>
                    
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Produto</DialogTitle>
            <DialogDescription>
              Atualize os dados do produto {editingProduct?.nome}.
            </DialogDescription>
          </DialogHeader>
          <ProductForm isEdit />
        </DialogContent>
      </Dialog>
    </div>
  );
};
