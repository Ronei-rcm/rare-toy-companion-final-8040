import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FolderOpen,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  Search,
  Filter,
  BarChart3,
  Package,
  TrendingUp,
  Image as ImageIcon,
  Link2,
  Save,
  X,
  Grid3x3,
  List,
  ChevronDown,
  ArrowUpDown,
  Sparkles,
  Tag as TagIcon,
  Upload,
  Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCollections } from '@/hooks/useCollections';
import { productsApi } from '@/services/products-api';
import { getCollectionProducts, addCollectionProduct, removeCollectionProduct } from '@/api/collections-api';
import { uploadApi } from '@/services/upload-api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function AdvancedCollectionsView() {
  const { collections, loading, createCollection, updateCollection, deleteCollection } = useCollections() as any;
  
  // Estados
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'products-desc' | 'date-desc'>('name-asc');
  
  // Dialogs
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showProductsDialog, setShowProductsDialog] = useState(false);
  
  // Seleções
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [collectionToDelete, setCollectionToDelete] = useState<any>(null);
  
  // Produtos da coleção
  const [collectionProducts, setCollectionProducts] = useState<any[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    imagem: '',
    destaque: false,
    status: 'ativo' as 'ativo' | 'inativo',
    tags: [] as string[],
    ordem: 0
  });
  
  const [newTag, setNewTag] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = collections.length;
    const active = collections.filter((c: any) => c.status === 'ativo').length;
    const featured = collections.filter((c: any) => c.destaque).length;
    const withProducts = collections.filter((c: any) => (c.produtos?.length || 0) > 0).length;
    const totalProducts = collections.reduce((sum: number, c: any) => sum + (c.produtos?.length || 0), 0);
    const avgProducts = total > 0 ? Math.round(totalProducts / total) : 0;

    return {
      total,
      active,
      inactive: total - active,
      featured,
      withProducts,
      withoutProducts: total - withProducts,
      totalProducts,
      avgProducts
    };
  }, [collections]);

  // Filtrar e ordenar
  const filteredCollections = useMemo(() => {
    let filtered = collections.filter((collection: any) => {
      const matchesSearch = collection.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           collection.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || collection.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

    // Ordenar
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.nome || '').localeCompare(b.nome || '');
        case 'name-desc':
          return (b.nome || '').localeCompare(a.nome || '');
        case 'products-desc':
          return (b.produtos?.length || 0) - (a.produtos?.length || 0);
        case 'date-desc':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [collections, searchTerm, filterStatus, sortBy]);

  // Handlers
  const handleCreate = () => {
    setFormData({
      nome: '',
      descricao: '',
      imagem: '',
      destaque: false,
      status: 'ativo',
      tags: [],
      ordem: 0
    });
    setShowCreateDialog(true);
  };

  const handleEdit = (collection: any) => {
    setSelectedCollection(collection);
    setFormData({
      nome: collection.nome || '',
      descricao: collection.descricao || '',
      imagem: collection.imagem || '',
      destaque: collection.destaque || false,
      status: collection.status || 'ativo',
      tags: collection.tags || [],
      ordem: collection.ordem || 0
    });
    setShowEditDialog(true);
  };

  const handleSave = async (isEdit: boolean) => {
    if (!formData.nome || !formData.descricao) {
      toast.error('Nome e descrição são obrigatórios');
      return;
    }

    try {
      toast.loading(isEdit ? 'Atualizando coleção...' : 'Criando coleção...', { id: 'save-collection' });

      if (isEdit && selectedCollection) {
        await updateCollection(selectedCollection.id, formData);
        toast.success(`✅ Coleção "${formData.nome}" atualizada!`, { id: 'save-collection' });
      } else {
        await createCollection(formData);
        toast.success(`✅ Coleção "${formData.nome}" criada!`, { id: 'save-collection' });
      }

      setShowCreateDialog(false);
      setShowEditDialog(false);
      setSelectedCollection(null);

      // Emitir evento para atualizar outras páginas
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
    } catch (error) {
      console.error('Erro ao salvar coleção:', error);
      toast.error(`Erro ao ${isEdit ? 'atualizar' : 'criar'} coleção`, { id: 'save-collection' });
    }
  };

  const handleDelete = (collection: any) => {
    setCollectionToDelete(collection);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!collectionToDelete) return;

    try {
      toast.loading('Excluindo coleção...', { id: 'delete-collection' });
      await deleteCollection(collectionToDelete.id);
      toast.success(`✅ Coleção "${collectionToDelete.nome}" excluída!`, { id: 'delete-collection' });
      setShowDeleteDialog(false);
      setCollectionToDelete(null);

      window.dispatchEvent(new CustomEvent('collectionUpdated'));
    } catch (error) {
      console.error('Erro ao excluir coleção:', error);
      toast.error('Erro ao excluir coleção', { id: 'delete-collection' });
    }
  };

  const handleManageProducts = async (collection: any) => {
    setSelectedCollection(collection);
    setShowProductsDialog(true);

    try {
      // Carregar produtos da coleção
      const collectionProds = await getCollectionProducts(collection.id);
      console.log('🔍 Produtos da coleção recebidos:', collectionProds);
      
      // Mapear os dados para o formato esperado
      const mappedProducts = (collectionProds || []).map((link: any) => {
        const product = link.product || {};
        const productId = link.product_id || product.id || link.id;
        
        console.log('🔍 Mapeando produto:', {
          link_product_id: link.product_id,
          product_id: product.id,
          link_id: link.id,
          final_id: productId
        });
        
        return {
          id: productId,
          product_id: link.product_id, // Manter referência original
          nome: product.name || product.nome || product.title || 'Produto sem nome',
          preco: parseFloat(product.price || product.preco || 0),
          estoque: parseInt(product.estoque || product.stock || 0),
          imagemUrl: product.image_url || product.imagemUrl || product.imagem || '/placeholder.svg',
          categoria: product.categoria || product.category || 'Sem categoria'
        };
      });
      
      console.log('🔄 Produtos mapeados:', mappedProducts);
      setCollectionProducts(mappedProducts);

      // Carregar todos os produtos disponíveis
      const allProds = await productsApi.getProducts();
      setAvailableProducts(allProds || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const handleAddProduct = async () => {
    if (!selectedProductId || !selectedCollection) return;

    try {
      toast.loading('Adicionando produto...', { id: 'add-product' });
      await addCollectionProduct(selectedCollection.id, selectedProductId);
      
      // Recarregar produtos com mapeamento correto
      const collectionProds = await getCollectionProducts(selectedCollection.id);
      const mappedProducts = (collectionProds || []).map((link: any) => {
        const product = link.product || {};
        const productId = link.product_id || product.id || link.id;
        
        return {
          id: productId,
          product_id: link.product_id, // Manter referência original
          nome: product.name || product.nome || product.title || 'Produto sem nome',
          preco: parseFloat(product.price || product.preco || 0),
          estoque: parseInt(product.estoque || product.stock || 0),
          imagemUrl: product.image_url || product.imagemUrl || product.imagem || '/placeholder.svg',
          categoria: product.categoria || product.category || 'Sem categoria'
        };
      });
      setCollectionProducts(mappedProducts);
      
      setSelectedProductId('');
      toast.success('✅ Produto adicionado!', { id: 'add-product' });
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error('Erro ao adicionar produto', { id: 'add-product' });
    }
  };

  const handleRemoveProduct = async (productId: string | number) => {
    if (!selectedCollection) {
      toast.error('Nenhuma coleção selecionada');
      return;
    }

    // Confirmar antes de remover
    const confirmRemove = window.confirm('Tem certeza que deseja remover este produto da coleção?');
    if (!confirmRemove) return;

    try {
      // Validar o productId (pode ser UUID ou número)
      const finalProductId = String(productId).trim();
      
      if (!finalProductId || finalProductId === 'undefined' || finalProductId === 'null') {
        toast.error('ID do produto inválido');
        console.error('❌ ID inválido:', productId);
        return;
      }

      console.log('🗑️ Removendo produto:', {
        collectionId: selectedCollection.id,
        productId: finalProductId
      });

      toast.loading('Removendo produto...', { id: 'remove-product' });
      
      // Remover usando o productId como string (UUID)
      await removeCollectionProduct(selectedCollection.id, finalProductId);
      
      // Recarregar produtos com mapeamento correto
      const collectionProds = await getCollectionProducts(selectedCollection.id);
      const mappedProducts = (collectionProds || []).map((link: any) => {
        const product = link.product || {};
        const productId = link.product_id || product.id || link.id;
        
        return {
          id: productId,
          product_id: link.product_id, // Manter referência original
          nome: product.name || product.nome || product.title || 'Produto sem nome',
          preco: parseFloat(product.price || product.preco || 0),
          estoque: parseInt(product.estoque || product.stock || 0),
          imagemUrl: product.image_url || product.imagemUrl || product.imagem || '/placeholder.svg',
          categoria: product.categoria || product.category || 'Sem categoria'
        };
      });
      setCollectionProducts(mappedProducts);
      
      toast.success('✅ Produto removido com sucesso!', { id: 'remove-product' });
      
      console.log('✅ Produto removido. Produtos restantes:', mappedProducts.length);
    } catch (error: any) {
      console.error('❌ Erro ao remover produto:', error);
      toast.error(
        error?.message || 'Erro ao remover produto. Tente novamente.', 
        { id: 'remove-product' }
      );
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione um arquivo de imagem');
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande. Máximo: 5MB');
      return;
    }

    setImageFile(file);

    try {
      setUploadingImage(true);
      toast.loading('Fazendo upload da imagem...', { id: 'upload-image' });

      const response = await uploadApi.uploadImage(file);
      
      // O uploadApi retorna { imageUrl, fullUrl, filename }
      // Usar fullUrl para exibição pública
      const imageUrl = response.fullUrl || response.imageUrl || response;
      
      console.log('📤 Upload response:', response);
      console.log('🖼️ Image URL salva:', imageUrl);
      
      setFormData({ ...formData, imagem: imageUrl });
      toast.success(`✅ Imagem "${response.filename}" enviada com sucesso!`, { id: 'upload-image' });
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error(`Erro ao fazer upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: 'upload-image' });
      setImageFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, imagem: '' });
    setImageFile(null);
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Total</p>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Ativas</p>
              <p className="text-2xl font-bold text-green-900">{stats.active}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-600 rounded-lg">
              <Star className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-yellow-700">Destaque</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.featured}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700">Com Produtos</p>
              <p className="text-2xl font-bold text-purple-900">{stats.withProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700">Total Produtos</p>
              <p className="text-2xl font-bold text-orange-900">{stats.totalProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-pink-600 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-pink-700">Média/Coleção</p>
              <p className="text-2xl font-bold text-pink-900">{stats.avgProducts}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de Ferramentas */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex-1 flex flex-col md:flex-row gap-3 w-full">
            {/* Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar coleções..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtros */}
            <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativas</SelectItem>
                <SelectItem value="inativo">Inativas</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordenação */}
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="name-desc">Nome (Z-A)</SelectItem>
                <SelectItem value="products-desc">Mais Produtos</SelectItem>
                <SelectItem value="date-desc">Mais Recentes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {/* View Mode */}
            <div className="flex border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3x3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>

            {/* Criar */}
            <Button onClick={handleCreate} className="bg-gradient-to-r from-blue-600 to-purple-600">
              <Plus className="w-4 h-4 mr-2" />
              Nova Coleção
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="mt-3 text-sm text-gray-600">
          Mostrando {filteredCollections.length} de {stats.total} coleções
        </div>
      </Card>

      {/* Lista de Coleções */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando coleções...</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <Card className="p-12 text-center">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhuma coleção encontrada</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || filterStatus !== 'all'
              ? 'Tente ajustar os filtros de busca'
              : 'Crie sua primeira coleção para começar!'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeira Coleção
            </Button>
          )}
        </Card>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        )}>
          <AnimatePresence>
            {filteredCollections.map((collection: any, index: number) => (
              <motion.div
                key={collection.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className={cn(
                    "flex",
                    viewMode === 'grid' ? 'flex-col' : 'flex-row gap-4'
                  )}>
                    {/* Imagem */}
                    <div className={cn(
                      "relative overflow-hidden bg-gray-100",
                      viewMode === 'grid' ? 'h-48' : 'w-48 h-48'
                    )}>
                      {collection.imagem ? (
                        <img
                          src={collection.imagem}
                          alt={collection.nome}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-16 h-16 text-gray-300" />
                        </div>
                      )}

                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex gap-2">
                        {collection.destaque && (
                          <Badge className="bg-yellow-500 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        <Badge className={collection.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}>
                          {collection.status === 'ativo' ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Ativa
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inativa
                            </>
                          )}
                        </Badge>
                      </div>
                    </div>

                    {/* Conteúdo */}
                    <CardContent className="p-4 flex-1">
                      <h3 className="font-bold text-lg mb-2 line-clamp-2">{collection.nome}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{collection.descricao}</p>

                      {/* Tags */}
                      {collection.tags && collection.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {collection.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <TagIcon className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {collection.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{collection.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Produtos */}
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                        <Package className="w-4 h-4" />
                        <span>{collection.produtos?.length || 0} produtos</span>
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleManageProducts(collection)}
                          className="flex-1"
                        >
                          <Link2 className="w-4 h-4 mr-1" />
                          Produtos
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(collection)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(collection)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog Criar/Editar */}
      <Dialog open={showCreateDialog || showEditDialog} onOpenChange={(open) => {
        if (!open) {
          setShowCreateDialog(false);
          setShowEditDialog(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600">
              <FolderOpen className="w-5 h-5" />
              {showEditDialog ? 'Editar Coleção' : 'Nova Coleção'}
            </DialogTitle>
            <DialogDescription>
              {showEditDialog 
                ? 'Edite as informações da coleção e adicione/remova produtos'
                : 'Crie uma nova coleção para organizar seus produtos'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Nome */}
            <div>
              <Label>Nome da Coleção *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Heróis Marvel"
              />
            </div>

            {/* Descrição */}
            <div>
              <Label>Descrição *</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição da coleção..."
                rows={4}
              />
            </div>

            {/* Upload de Imagem */}
            <div className="space-y-3">
              <Label>Imagem da Coleção</Label>
              
              {!formData.imagem ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="collection-image-upload"
                    disabled={uploadingImage}
                  />
                  <label
                    htmlFor="collection-image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-3" />
                        <p className="text-sm text-blue-600 font-medium">Fazendo upload...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="w-12 h-12 text-gray-400 mb-3" />
                        <p className="text-sm font-medium text-gray-700">
                          Clique para fazer upload
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PNG, JPG, WEBP até 5MB
                        </p>
                      </>
                    )}
                  </label>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={formData.imagem}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remover
                  </Button>
                  <div className="mt-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="collection-image-change"
                      disabled={uploadingImage}
                    />
                    <label htmlFor="collection-image-change">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={uploadingImage}
                        asChild
                      >
                        <span>
                          {uploadingImage ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Alterar Imagem
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Adicionar tag..."
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status e Destaque */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-sm">Status</p>
                      <p className="text-xs text-gray-500">Visível na loja</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.status === 'ativo'}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked ? 'ativo' : 'inativo' })}
                  />
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-sm">Destaque</p>
                      <p className="text-xs text-gray-500">Exibir em destaque</p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.destaque}
                    onCheckedChange={(checked) => setFormData({ ...formData, destaque: checked })}
                  />
                </div>
              </Card>
            </div>

            {/* Preview Card Sincronizado */}
            <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-4">
                <p className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Preview da Coleção:
                </p>
                
                {/* Simulação do Card como vai aparecer */}
                <Card className="overflow-hidden border-2">
                  <div className="flex flex-col">
                    {/* Imagem Preview */}
                    <div className="relative h-32 bg-gray-100 overflow-hidden">
                      {formData.imagem ? (
                        <>
                          <img
                            src={formData.imagem}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          {/* Badges como vão aparecer */}
                          <div className="absolute top-2 right-2 flex gap-2">
                            {formData.destaque && (
                              <Badge className="bg-yellow-500 text-white">
                                <Star className="w-3 h-3 mr-1" />
                                Destaque
                              </Badge>
                            )}
                            <Badge className={formData.status === 'ativo' ? 'bg-green-500' : 'bg-gray-500'}>
                              {formData.status === 'ativo' ? (
                                <>
                                  <Eye className="w-3 h-3 mr-1" />
                                  Ativa
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3 h-3 mr-1" />
                                  Inativa
                                </>
                              )}
                            </Badge>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center">
                          <ImageIcon className="w-12 h-12 text-gray-300 mb-2" />
                          <p className="text-xs text-gray-400">Sem imagem</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo do Card */}
                    <div className="p-3">
                      <h3 className="font-bold text-base mb-1 line-clamp-2">
                        {formData.nome || 'Nome da Coleção'}
                      </h3>
                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {formData.descricao || 'Descrição da coleção...'}
                      </p>
                      
                      {/* Tags Preview */}
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {formData.tags.slice(0, 3).map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              <TagIcon className="w-2 h-2 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                          {formData.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{formData.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Package className="w-3 h-3" />
                        <span>0 produtos (será preenchido)</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateDialog(false);
              setShowEditDialog(false);
            }}>
              Cancelar
            </Button>
            <Button onClick={() => handleSave(showEditDialog)}>
              <Save className="w-4 h-4 mr-2" />
              {showEditDialog ? 'Salvar Alterações' : 'Criar Coleção'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-4">
                Tem certeza que deseja excluir a coleção{' '}
                <span className="font-semibold text-gray-900">"{collectionToDelete?.nome}"</span>?
              </p>
              {collectionToDelete && (
                <Card className="bg-red-50 border-red-200 p-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Produtos vinculados:</span>
                      <span className="font-medium">{collectionToDelete.produtos?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium">{collectionToDelete.status}</span>
                    </div>
                  </div>
                </Card>
              )}
              <p className="text-sm text-red-600 font-medium mt-4">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              <Trash2 className="w-4 h-4 mr-2" />
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog Gerenciar Produtos */}
      <Dialog open={showProductsDialog} onOpenChange={setShowProductsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <Link2 className="w-5 h-5" />
              Gerenciar Produtos - {selectedCollection?.nome}
            </DialogTitle>
            <DialogDescription>
              Adicione ou remova produtos desta coleção
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Adicionar Produto */}
            <Card className="p-4 bg-purple-50 border-purple-200">
              <Label>Adicionar Produto</Label>
              <div className="flex gap-2 mt-2">
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Selecione um produto..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProducts
                      .filter(p => !collectionProducts.find(cp => cp.id === p.id))
                      .map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddProduct} disabled={!selectedProductId}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar
                </Button>
              </div>
            </Card>

            {/* Lista de Produtos */}
            <div>
              <Label>Produtos na Coleção ({collectionProducts.length})</Label>
              <div className="space-y-2 mt-2 max-h-96 overflow-y-auto">
                {collectionProducts.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum produto adicionado ainda</p>
                  </Card>
                ) : (
                  collectionProducts.map(product => {
                    // Usar product_id se disponível, senão usar id
                    const productIdToRemove = product.product_id || product.id;
                    
                    return (
                      <Card key={product.id || product.product_id} className="p-4 flex items-center gap-4">
                        <img
                          src={product.imagemUrl || '/placeholder.svg'}
                          alt={product.nome}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1">
                          <p className="font-medium">{product.nome}</p>
                          <p className="text-sm text-gray-600">
                            R$ {(product.preco || 0).toFixed(2)} • Estoque: {product.estoque || 0}
                          </p>
                          <p className="text-xs text-gray-400">ID: {productIdToRemove}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            console.log('🗑️ Tentando remover produto:', {
                              productId: productIdToRemove,
                              product
                            });
                            handleRemoveProduct(productIdToRemove);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Card>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowProductsDialog(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

