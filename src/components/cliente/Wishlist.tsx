import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, ShoppingCart, Trash2, Share2, Eye, 
  Filter, SortAsc, Grid, List, Star, 
  TrendingUp, Zap, Target, Bookmark, 
  BarChart3, ArrowLeftRight, Gift, Bell,
  Tag, Clock, Award, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getProductImage } from '@/utils/imageUtils';

interface WishlistProps {
  userId: string;
}

const Wishlist: React.FC<WishlistProps> = ({ userId }) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const { addItem } = useCart();
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadFavorites();
    loadRecommendations();
  }, [userId]);

  useEffect(() => {
    // Extrair categorias únicas dos favoritos
    const uniqueCategories = [...new Set(favorites.map(f => f.categoria || 'Outros'))];
    setCategories(uniqueCategories);
  }, [favorites]);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/favorites`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/recommendations`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
    }
  };

  const toggleItemSelection = (productId: string) => {
    setSelectedItems(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCompare = () => {
    if (selectedItems.length < 2) {
      toast({
        title: 'Selecione pelo menos 2 produtos',
        description: 'Escolha 2 ou mais produtos para comparar',
        variant: 'destructive',
      });
      return;
    }
    setShowCompare(true);
  };

  const getFilteredAndSortedFavorites = () => {
    let filtered = favorites;

    // Filtrar por categoria
    if (filterCategory !== 'all') {
      filtered = filtered.filter(f => f.categoria === filterCategory);
    }

    // Ordenar
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.preco - b.preco);
      case 'price-high':
        return filtered.sort((a, b) => b.preco - a.preco);
      case 'name':
        return filtered.sort((a, b) => a.nome.localeCompare(b.nome));
      case 'rating':
        return filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: // recent
        return filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/customers/${userId}/favorites/${productId}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      if (response.ok) {
        setFavorites(favorites.filter((f) => f.id !== productId));
        toast({
          title: 'Removido dos favoritos',
          description: 'Produto removido da sua lista de desejos',
        });
      }
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
    }
  };

  const handleAddToCart = async (product: any) => {
    await addItem(product, 1);
  };

  const handleAddAllToCart = async () => {
    for (const product of favorites) {
      await addItem(product, 1);
    }
    toast({
      title: 'Todos adicionados! 🛒',
      description: `${favorites.length} produtos adicionados ao carrinho`,
    });
  };

  const handleShareWishlist = async () => {
    const text = `🎁 Minha Lista de Desejos - MuhlStore\n\n${favorites
      .map((p) => `• ${p.nome} - R$ ${p.preco.toFixed(2)}`)
      .join('\n')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Minha Lista de Desejos',
          text,
        });
      } catch (error) {
        // Usuário cancelou
      }
    } else {
      navigator.clipboard.writeText(text);
      toast({
        title: 'Lista copiada! 📋',
        description: 'Compartilhe com amigos e família',
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="aspect-square bg-muted rounded-lg mb-3" />
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h3>
          <p className="text-muted-foreground mb-4">
            Adicione produtos aos favoritos para vê-los aqui
          </p>
          <Button asChild>
            <a href="/loja">Explorar Produtos</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredFavorites = getFilteredAndSortedFavorites();

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meus Favoritos</h2>
          <p className="text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? 'produto' : 'produtos'} salvos
            {selectedItems.length > 0 && ` • ${selectedItems.length} selecionados`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleShareWishlist} variant="outline">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          {selectedItems.length > 0 && (
            <Button onClick={handleCompare} variant="outline">
              <ArrowLeftRight className="w-4 h-4 mr-2" />
              Comparar ({selectedItems.length})
            </Button>
          )}
          <Button onClick={handleAddAllToCart}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Adicionar Todos
          </Button>
        </div>
      </div>

      {/* Filtros e Ordenação */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Categorias */}
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                >
                  Todas ({favorites.length})
                </Button>
                {categories.map(category => {
                  const count = favorites.filter(f => f.categoria === category).length;
                  return (
                    <Button
                      key={category}
                      variant={filterCategory === category ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilterCategory(category)}
                    >
                      {category} ({count})
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Ordenação */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="recent">Mais recentes</option>
                <option value="price-low">Menor preço</option>
                <option value="price-high">Maior preço</option>
                <option value="name">Nome A-Z</option>
                <option value="rating">Melhor avaliados</option>
              </select>

              {/* Modo de visualização */}
              <div className="flex border border-gray-300 rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid className="w-4 h-4" />
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      {recommendations.length > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Recomendados para você</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {recommendations.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-3 border border-purple-200 hover:shadow-md transition-shadow"
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.nome}
                    className="w-full h-20 object-cover rounded mb-2"
                  />
                  <h4 className="font-medium text-sm line-clamp-2 mb-1">{product.nome}</h4>
                  <p className="text-sm font-bold text-purple-600">R$ {product.preco.toFixed(2)}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid de Produtos */}
      <div className={viewMode === 'grid' 
        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" 
        : "space-y-4"
      }>
        <AnimatePresence>
          {filteredFavorites.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`group relative overflow-hidden hover:shadow-lg transition-all duration-300 ${
                selectedItems.includes(product.id) ? 'ring-2 ring-primary' : ''
              }`}>
                {/* Checkbox de seleção */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(product.id)}
                    onChange={() => toggleItemSelection(product.id)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                </div>

                {/* Badge de favorito */}
                <div className="absolute top-2 right-2 z-10">
                  <button
                    onClick={() => handleRemoveFavorite(product.id)}
                    className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-md"
                    aria-label="Remover dos favoritos"
                  >
                    <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                  </button>
                </div>

                {viewMode === 'grid' ? (
                  <>
                    {/* Imagem */}
                    <div className="aspect-square relative overflow-hidden bg-muted">
                      <img
                        src={getProductImage(product)}
                        alt={product.nome}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.promocao && (
                          <Badge className="bg-red-500">PROMO</Badge>
                        )}
                        {product.lancamento && (
                          <Badge className="bg-blue-500">NOVO</Badge>
                        )}
                      </div>

                      {/* Overlay com ações */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => (window.location.href = `/produto/${product.id}`)}
                          variant="secondary"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Ver
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAddToCart(product)}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Comprar
                        </Button>
                      </div>
                    </div>

                    {/* Info do Produto */}
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 min-h-[2.5rem]">
                        {product.nome}
                      </h3>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-bold text-primary">
                            R$ {product.preco.toFixed(2)}
                          </p>
                          {product.preco > 50 && (
                            <p className="text-xs text-muted-foreground">
                              ou 3x de R$ {(product.preco / 3).toFixed(2)}
                            </p>
                          )}
                        </div>

                        <Button
                          size="icon"
                          onClick={() => handleAddToCart(product)}
                          className="rounded-full"
                        >
                          <ShoppingCart className="w-4 h-4" />
                        </Button>
                      </div>

                      {/* Estoque baixo */}
                      {product.estoque && product.estoque <= 5 && product.estoque > 0 && (
                        <Badge variant="outline" className="mt-2 w-full justify-center bg-amber-50 text-amber-700 border-amber-300">
                          Apenas {product.estoque} em estoque
                        </Badge>
                      )}
                    </CardContent>
                  </>
                ) : (
                  /* Modo Lista */
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <img
                        src={getProductImage(product)}
                        alt={product.nome}
                        className="w-20 h-20 object-cover rounded-lg"
                        loading="lazy"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg mb-1">{product.nome}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{product.categoria}</p>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-sm font-medium">{product.rating || 4.5}</span>
                              </div>
                              {product.promocao && (
                                <Badge className="bg-red-500 text-xs">PROMO</Badge>
                              )}
                              {product.lancamento && (
                                <Badge className="bg-blue-500 text-xs">NOVO</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-bold text-primary">
                              R$ {product.preco.toFixed(2)}
                            </p>
                            {product.preco > 50 && (
                              <p className="text-sm text-muted-foreground">
                                ou 3x de R$ {(product.preco / 3).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            onClick={() => (window.location.href = `/produto/${product.id}`)}
                            variant="outline"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(product)}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Adicionar ao Carrinho
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Wishlist;
