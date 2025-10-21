import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useCollections } from '@/hooks/useCollections';
import { uploadCollectionImage, patchCollectionToggles, getCollectionProducts, addCollectionProduct, removeCollectionProduct, reorderCollectionProducts, CollectionLink } from '@/api/collections-api';
import resolveImage from '@/utils/resolveImage';
import { productsApi } from '@/services/products-api';
import { Collection, CreateCollectionData } from '@/types/collection';
import { Plus, Edit, Trash2, Eye, EyeOff, Star, GripVertical, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ImageUpload } from '@/components/ui/image-upload';
import { uploadApi } from '@/services/upload-api';

const CollectionManager = () => {
  const { collections, loading, error, createCollection, updateCollection, deleteCollection, reorderCollections, page, hasMore, setPage, setQuery } = useCollections() as any;
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState<CreateCollectionData>({
    nome: '',
    descricao: '',
    imagem: '',
    destaque: false,
    status: 'ativo',
    tags: [],
    ordem: 0
  });

  const [newTag, setNewTag] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Vínculos de produtos
  const [isLinksDialogOpen, setIsLinksDialogOpen] = useState(false);
  const [linksCollection, setLinksCollection] = useState<Collection | null>(null);
  const [links, setLinks] = useState<CollectionLink[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [isLinking, setIsLinking] = useState(false);

  // Filtrar coleções
  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || collection.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCollection = async () => {
    if (!formData.nome || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Nome e descrição são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      const created = await createCollection(formData);
      // aplicar toggles se necessário
      try {
        await patchCollectionToggles(created?.id || (editingCollection?.id as any), {
          ativo: formData.status === 'ativo',
          destaque: !!formData.destaque,
        });
      } catch {}
      setIsCreateDialogOpen(false);
      resetForm();
      
      // Emitir evento para atualizar outras páginas
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar coleção",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCollection = async () => {
    if (!editingCollection || !formData.nome || !formData.descricao) {
      toast({
        title: "Erro",
        description: "Nome e descrição são obrigatórios",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      await updateCollection(editingCollection.id, formData);
      // aplicar toggles ativo/destaque
      try {
        await patchCollectionToggles(editingCollection.id, {
          ativo: formData.status === 'ativo',
          destaque: !!formData.destaque,
        });
      } catch {}
      setIsEditDialogOpen(false);
      setEditingCollection(null);
      resetForm();
      
      // Emitir evento para atualizar outras páginas
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar coleção",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await deleteCollection(id);
      
      // Emitir evento para atualizar outras páginas
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar coleção",
        variant: "destructive"
      });
    }
  };

  const handleEditCollection = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      nome: collection.nome,
      descricao: collection.descricao,
      imagem: collection.imagem || '',
      destaque: collection.destaque,
      status: collection.status,
      tags: collection.tags,
      ordem: collection.ordem
    });
    setImageFile(null); // Reset image file when editing
    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      descricao: '',
      imagem: '',
      destaque: false,
      status: 'ativo',
      tags: [],
      ordem: 0
    });
    setNewTag('');
    setImageFile(null);
  };

  const handleImageUpload = async (file: File | null, previewUrl?: string) => {
    setImageFile(file);
    
    if (file) {
      try {
        setUploadingImage(true);
        if (editingCollection?.id) {
          const result = await uploadCollectionImage(editingCollection.id, file);
          setFormData(prev => ({
            ...prev,
            imagem: resolveImage(result?.imagem || result?.imagem_url || result?.imageUrl || result?.fullUrl)
          }));
        } else {
          // fallback para criação: mantém serviço antigo
          const result = await uploadApi.uploadImage(file);
          setFormData(prev => ({
            ...prev,
            imagem: resolveImage(result?.fullUrl || result?.imageUrl)
          }));
        }
        toast({
          title: "Imagem enviada!",
          description: "A imagem foi carregada com sucesso.",
          variant: "success",
        });
      } catch (error) {
        console.error('Erro no upload:', error);
        toast({
          title: "Erro no upload",
          description: "Não foi possível enviar a imagem. Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setUploadingImage(false);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        imagem: ''
      }));
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const items = Array.from(filteredCollections);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const newOrder = items.map((item, index) => ({
      ...item,
      ordem: index + 1
    }));

    try {
      await reorderCollections(newOrder.map(item => item.id));
      
      // Emitir evento para atualizar outras páginas
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao reordenar coleções",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando coleções...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Erro ao carregar coleções: {error}</p>
        <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gerenciar Coleções</h2>
          <p className="text-muted-foreground">Gerencie as coleções da loja</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Coleção
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar coleções..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setQuery(e.target.value); }}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="ativo">Ativas</SelectItem>
                <SelectItem value="inativo">Inativas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Coleções */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="collections">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              <AnimatePresence>
                {filteredCollections.map((collection, index) => (
                  <Draggable key={collection.id} draggableId={collection.id} index={index}>
                    {(provided, snapshot) => (
                      <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
                              >
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-semibold truncate">{collection.nome}</h3>
                                  {collection.destaque && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="h-3 w-3 mr-1" />
                                      Destaque
                                    </Badge>
                                  )}
                                  <Badge variant={collection.status === 'ativo' ? 'default' : 'secondary'}>
                                    {collection.status === 'ativo' ? (
                                      <><Eye className="h-3 w-3 mr-1" /> Ativo</>
                                    ) : (
                                      <><EyeOff className="h-3 w-3 mr-1" /> Inativo</>
                                    )}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                  {collection.descricao}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>{collection.produtos} produtos</span>
                                  <span>Ordem: {collection.ordem}</span>
                                  {collection.tags.length > 0 && (
                                    <div className="flex gap-1">
                                      {collection.tags.slice(0, 3).map(tag => (
                                        <Badge key={tag} variant="outline" className="text-xs">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {collection.tags.length > 3 && (
                                        <span>+{collection.tags.length - 3}</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCollection(collection)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    setLinksCollection(collection);
                                    setIsLinksDialogOpen(true);
                                    try {
                                      const [l, prods] = await Promise.all([
                                        getCollectionProducts(collection.id),
                                        productsApi.getProducts(),
                                      ]);
                                      setLinks(l);
                                      setAllProducts(prods);
                                    } catch (e) {
                                      toast({ title: 'Erro', description: 'Falha ao carregar vínculos/produtos', variant: 'destructive' });
                                    }
                                  }}
                                >
                                  Gerenciar Produtos
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Tem certeza que deseja deletar a coleção "{collection.nome}"? 
                                        Esta ação não pode ser desfeita.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDeleteCollection(collection.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Deletar
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </Draggable>
                ))}
              </AnimatePresence>
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {filteredCollections.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Nenhuma coleção encontrada com os filtros aplicados'
                : 'Nenhuma coleção cadastrada ainda'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira coleção
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Paginação */}
      <div className="flex items-center justify-between pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(Math.max(1, (page || 1) - 1))}
          disabled={(page || 1) <= 1}
        >
          Anterior
        </Button>
        <span className="text-sm text-muted-foreground">Página {page || 1}</span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage((page || 1) + 1)}
          disabled={!hasMore}
        >
          Próxima
        </Button>
      </div>

      {/* Dialog de Criação */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Coleção</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar uma nova coleção
            </DialogDescription>
          </DialogHeader>
          <CollectionForm
            formData={formData}
            setFormData={setFormData}
            newTag={newTag}
            setNewTag={setNewTag}
            addTag={addTag}
            removeTag={removeTag}
            onSubmit={handleCreateCollection}
            submitting={submitting}
            onCancel={() => {
              setIsCreateDialogOpen(false);
              resetForm();
            }}
            handleImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog de Vínculos de Produtos */}
      <Dialog open={isLinksDialogOpen} onOpenChange={(o) => { setIsLinksDialogOpen(o); if (!o) { setLinks([]); setLinksCollection(null); } }}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Produtos da coleção {linksCollection?.nome}</DialogTitle>
            <DialogDescription>
              Gerencie os produtos desta coleção
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecionar produto" />
                </SelectTrigger>
                <SelectContent>
                  {allProducts.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.nome} • R$ {p.preco}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={async () => {
                  if (!linksCollection?.id || !selectedProductId) return;
                  try {
                    setIsLinking(true);
                    await addCollectionProduct(linksCollection.id, selectedProductId, links.length);
                    const l = await getCollectionProducts(linksCollection.id);
                    setLinks(l);
                    setSelectedProductId('');
                    toast({ title: 'Vinculado', description: 'Produto adicionado à coleção.' });
                  } catch (e) {
                    toast({ title: 'Erro', description: 'Falha ao vincular produto', variant: 'destructive' });
                  } finally { setIsLinking(false); }
                }}
                disabled={!selectedProductId || isLinking}
              >
                Adicionar
              </Button>
            </div>

            <DragDropContext
              onDragEnd={async (result) => {
                if (!result.destination || !linksCollection?.id) return;
                const items = Array.from(links);
                const [moved] = items.splice(result.source.index, 1);
                items.splice(result.destination.index, 0, moved);
                setLinks(items);
                try {
                  await reorderCollectionProducts(linksCollection.id, items.map(i => i.product_id));
                } catch (e) {
                  toast({ title: 'Erro', description: 'Falha ao reordenar', variant: 'destructive' });
                }
              }}
            >
              <Droppable droppableId="links">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2 max-h-96 overflow-auto">
                    {links.map((l, idx) => (
                      <Draggable key={l.product_id} draggableId={String(l.product_id)} index={idx}>
                        {(p) => (
                          <div ref={p.innerRef} {...p.draggableProps} className="flex items-center gap-3 p-2 rounded border">
                            <div {...p.dragHandleProps} className="cursor-grab"><GripVertical className="h-4 w-4" /></div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{l?.product?.name || `Produto #${l.product_id}`}</div>
                              <div className="text-xs text-muted-foreground truncate">ID {l.product_id}</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                if (!linksCollection?.id) return;
                                try {
                                  await removeCollectionProduct(linksCollection.id, l.product_id);
                                  setLinks(prev => prev.filter(x => x.product_id !== l.product_id));
                                } catch (e) {
                                  toast({ title: 'Erro', description: 'Falha ao remover', variant: 'destructive' });
                                }
                              }}
                            >
                              Remover
                            </Button>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Coleção</DialogTitle>
            <DialogDescription>
              Edite as informações da coleção selecionada
            </DialogDescription>
          </DialogHeader>
          <CollectionForm
            formData={formData}
            setFormData={setFormData}
            newTag={newTag}
            setNewTag={setNewTag}
            addTag={addTag}
            removeTag={removeTag}
            onSubmit={handleUpdateCollection}
            submitting={submitting}
            onCancel={() => {
              setIsEditDialogOpen(false);
              setEditingCollection(null);
              resetForm();
            }}
            handleImageUpload={handleImageUpload}
            uploadingImage={uploadingImage}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Componente de Formulário
interface CollectionFormProps {
  formData: CreateCollectionData;
  setFormData: (data: CreateCollectionData) => void;
  newTag: string;
  setNewTag: (tag: string) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  onCancel: () => void;
  handleImageUpload: (file: File | null, previewUrl?: string) => void;
  uploadingImage: boolean;
}

const CollectionForm: React.FC<CollectionFormProps> = ({
  formData,
  setFormData,
  newTag,
  setNewTag,
  addTag,
  removeTag,
  onSubmit,
  submitting,
  onCancel,
  handleImageUpload,
  uploadingImage
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nome">Nome *</Label>
          <Input
            id="nome"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome da coleção"
          />
        </div>
        <div className="space-y-2">
          <Label>Imagem da Coleção</Label>
          <ImageUpload
            value={formData.imagem}
            onChange={handleImageUpload}
            disabled={uploadingImage || submitting}
            maxSize={5}
          />
          {uploadingImage && (
            <p className="text-sm text-muted-foreground">Enviando imagem...</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição *</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
          placeholder="Descrição da coleção"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: 'ativo' | 'inativo') => setFormData({ ...formData, status: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ordem">Ordem</Label>
          <Input
            id="ordem"
            type="number"
            value={formData.ordem}
            onChange={(e) => setFormData({ ...formData, ordem: parseInt(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="destaque"
          checked={formData.destaque}
          onCheckedChange={(checked) => setFormData({ ...formData, destaque: checked })}
        />
        <Label htmlFor="destaque">Coleção em destaque</Label>
      </div>

      <div className="space-y-2">
        <Label>Tags</Label>
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder="Adicionar tag"
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
          />
          <Button type="button" onClick={addTag} disabled={!newTag.trim()}>
            Adicionar
          </Button>
        </div>
        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
        <Button onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
};

export default CollectionManager;
