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
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Star, 
  Search, 
  Filter,
  Package,
  Image as ImageIcon,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  imagemUrl: string;
  estoque: number;
  status: string;
}

interface CollectionProduct {
  id: number;
  collection_id: string;
  product_id: string;
  order_index: number;
  product: Product | null;
}

interface Collection {
  id: string;
  nome: string;
  descricao: string;
  imagem_url: string;
  status: string;
  destaque: boolean;
  produtos?: number;
}

const EnhancedCollectionManager = () => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [collectionProducts, setCollectionProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<CollectionProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Carregar coleções
  const loadCollections = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/collections');
      if (!response.ok) throw new Error('Erro ao carregar coleções');
      const data = await response.json();
      setCollections(data);
    } catch (error) {
      console.error('Erro ao carregar coleções:', error);
      toast.error('Erro ao carregar coleções');
    } finally {
      setLoading(false);
    }
  };

  // Carregar produtos
  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      // Backend usa rota /api/produtos (tabela "produtos")
      const response = await fetch('/api/produtos');
      if (!response.ok) throw new Error('Erro ao carregar produtos');
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setProductsLoading(false);
    }
  };

  // Carregar produtos da coleção
  const loadCollectionProducts = async (collectionId: string) => {
    try {
      const response = await fetch(`/api/collections/${collectionId}/products`);
      if (!response.ok) throw new Error('Erro ao carregar produtos da coleção');
      const data = await response.json();
      setCollectionProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos da coleção:', error);
      toast.error('Erro ao carregar produtos da coleção');
      setCollectionProducts([]);
    }
  };

  // Adicionar produto à coleção
  const handleAddProduct = async () => {
    if (!selectedCollection || !selectedProductId) {
      toast.error('Selecione um produto');
      return;
    }

    try {
      toast.loading('Adicionando produto...', { id: 'add-product' });
      
      const response = await fetch(`/api/collections/${selectedCollection.id}/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: selectedProductId,
          order_index: collectionProducts.length
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar produto');
      }

      // Recarregar produtos da coleção
      await loadCollectionProducts(selectedCollection.id);
      // Atualizar cards/estatísticas de coleções
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
      
      toast.success('✅ Produto adicionado com sucesso!', { id: 'add-product' });
      setIsAddProductDialogOpen(false);
      setSelectedProductId('');
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      toast.error(error.message || 'Erro ao adicionar produto', { id: 'add-product' });
    }
  };

  // Remover produto da coleção
  const handleRemoveProduct = async (product: CollectionProduct) => {
    if (!selectedCollection) return;

    setProductToDelete(product);
    setIsDeleteDialogOpen(true);
  };

  const confirmRemoveProduct = async () => {
    if (!selectedCollection || !productToDelete) return;

    try {
      toast.loading('Removendo produto...', { id: 'remove-product' });
      
      const response = await fetch(`/api/collections/${selectedCollection.id}/products/${productToDelete.product_id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover produto');
      }

      // Recarregar produtos da coleção
      await loadCollectionProducts(selectedCollection.id);
      // Atualizar cards/estatísticas de coleções
      window.dispatchEvent(new CustomEvent('collectionUpdated'));
      
      toast.success('✅ Produto removido com sucesso!', { id: 'remove-product' });
    } catch (error: any) {
      console.error('Erro ao remover produto:', error);
      toast.error(error.message || 'Erro ao remover produto', { id: 'remove-product' });
    } finally {
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // Filtrar produtos disponíveis (que não estão na coleção)
  const availableProducts = products.filter(product => 
    !collectionProducts.some(cp => cp.product_id === product.id) &&
    product.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    loadCollections();
    loadProducts();
  }, []);

  useEffect(() => {
    if (selectedCollection) {
      loadCollectionProducts(selectedCollection.id);
    }
  }, [selectedCollection]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Coleções</h1>
          <p className="text-muted-foreground">Gerencie suas coleções e produtos</p>
        </div>
        <Button onClick={loadCollections} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Seleção de Coleção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Selecionar Coleção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedCollection?.id || ''}
            onValueChange={(value) => {
              const collection = collections.find(c => c.id === value);
              setSelectedCollection(collection || null);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Escolha uma coleção para gerenciar" />
            </SelectTrigger>
            <SelectContent>
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  <div className="flex items-center gap-2">
                    <span>{collection.nome}</span>
                    <Badge variant="secondary">{collection.produtos || 0} produtos</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Gerenciamento de Produtos da Coleção */}
      {selectedCollection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Produtos da Coleção: {selectedCollection.nome}
              </div>
              <Button onClick={() => setIsAddProductDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Produto
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {collectionProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum produto nesta coleção</p>
                <p className="text-sm">Clique em "Adicionar Produto" para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {collectionProducts.map((collectionProduct) => (
                    <motion.div
                      key={collectionProduct.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">
                            {collectionProduct.product?.nome || `Produto ${collectionProduct.product_id}`}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {collectionProduct.product?.categoria || 'Sem categoria'}
                          </p>
                          {collectionProduct.product?.preco && (
                            <p className="text-sm font-medium text-green-600">
                              R$ {collectionProduct.product.preco.toFixed(2)}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(collectionProduct)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {collectionProduct.product?.imagemUrl && (
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={collectionProduct.product.imagemUrl}
                            alt={collectionProduct.product.nome}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder.svg';
                            }}
                          />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={collectionProduct.product?.status === 'ativo' ? 'default' : 'secondary'}>
                          {collectionProduct.product?.status || 'Desconhecido'}
                        </Badge>
                        {collectionProduct.product?.estoque !== undefined && (
                          <Badge variant="outline">
                            Estoque: {collectionProduct.product.estoque}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog para Adicionar Produto */}
      <Dialog open={isAddProductDialogOpen} onOpenChange={setIsAddProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Produto à Coleção</DialogTitle>
            <DialogDescription>
              Selecione um produto para adicionar à coleção "{selectedCollection?.nome}"
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="search">Buscar Produto</Label>
              <Input
                id="search"
                placeholder="Digite o nome do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div>
              <Label>Produtos Disponíveis</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um produto" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        <span>{product.nome}</span>
                        <Badge variant="outline">R$ {product.preco.toFixed(2)}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {availableProducts.length === 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Nenhum produto disponível</p>
                <p className="text-sm">Todos os produtos já estão nesta coleção</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddProductDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddProduct} 
              disabled={!selectedProductId || availableProducts.length === 0}
            >
              Adicionar Produto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação para Remover */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este produto da coleção?
              <br />
              <strong>{productToDelete?.product?.nome || `Produto ${productToDelete?.product_id}`}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveProduct}
              className="bg-red-600 hover:bg-red-700"
            >
              Remover Produto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnhancedCollectionManager;
