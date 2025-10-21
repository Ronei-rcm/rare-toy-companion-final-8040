import React, { useEffect, useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles, TrendingUp, Heart, Zap, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Produto } from '@/types/produto';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';
import { Badge } from '@/components/ui/badge';

interface SmartProductSuggestionsProps {
  cartItems: any[];
  maxSuggestions?: number;
}

type SuggestionReason = 'complementary' | 'popular' | 'trending' | 'favorite' | 'premium';

interface SmartSuggestion {
  produto: Produto;
  reason: SuggestionReason;
  score: number;
  description: string;
}

const SmartProductSuggestions: React.FC<SmartProductSuggestionsProps> = ({
  cartItems,
  maxSuggestions = 4,
}) => {
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  // Extrair categorias dos itens do carrinho
  const cartCategories = useMemo(() => {
    const categories = new Set<string>();
    cartItems.forEach(item => {
      if (item.produto?.categoria) {
        categories.add(item.produto.categoria);
      }
    });
    return Array.from(categories);
  }, [cartItems]);

  // IDs dos produtos já no carrinho
  const cartProductIds = useMemo(() => {
    return new Set(cartItems.map(item => item.produto?.id).filter(Boolean));
  }, [cartItems]);

  useEffect(() => {
    loadSmartSuggestions();
  }, [cartItems, cartCategories]);

  const loadSmartSuggestions = async () => {
    try {
      setLoading(true);

      // Buscar produtos de várias fontes
      const [categoriaProducts, popularProducts, trendingProducts] = await Promise.all([
        fetchCategoryProducts(),
        fetchPopularProducts(),
        fetchTrendingProducts(),
      ]);

      // Combinar e pontuar sugestões
      const scoredSuggestions: SmartSuggestion[] = [];

      // Produtos da mesma categoria (complementares)
      categoriaProducts.forEach(produto => {
        if (!cartProductIds.has(produto.id)) {
          scoredSuggestions.push({
            produto,
            reason: 'complementary',
            score: calculateComplementaryScore(produto),
            description: 'Combina perfeitamente com seus itens',
          });
        }
      });

      // Produtos populares
      popularProducts.forEach(produto => {
        if (!cartProductIds.has(produto.id)) {
          scoredSuggestions.push({
            produto,
            reason: 'popular',
            score: 80 + (produto.totalAvaliacoes || 0) / 10,
            description: 'Mais vendido da categoria',
          });
        }
      });

      // Produtos em alta
      trendingProducts.forEach(produto => {
        if (!cartProductIds.has(produto.id)) {
          scoredSuggestions.push({
            produto,
            reason: 'trending',
            score: 85,
            description: 'Em alta nesta semana',
          });
        }
      });

      // Produtos premium (preço alto)
      const premiumProducts = [...categoriaProducts, ...popularProducts].filter(
        p => p.preco > 200 && !cartProductIds.has(p.id)
      );
      premiumProducts.slice(0, 2).forEach(produto => {
        scoredSuggestions.push({
          produto,
          reason: 'premium',
          score: 75,
          description: 'Qualidade premium',
        });
      });

      // Ordenar por score e pegar os melhores
      const bestSuggestions = scoredSuggestions
        .sort((a, b) => b.score - a.score)
        .filter((item, index, self) => 
          index === self.findIndex(t => t.produto.id === item.produto.id)
        )
        .slice(0, maxSuggestions);

      setSuggestions(bestSuggestions);
    } catch (error) {
      console.error('[SmartSuggestions] Erro ao carregar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryProducts = async () => {
    if (cartCategories.length === 0) return [];
    try {
      const res = await fetch(
        `${API_BASE_URL}/produtos?categoria=${cartCategories[0]}&limit=20`
      );
      const data = await res.json();
      return data.produtos || data || [];
    } catch {
      return [];
    }
  };

  const fetchPopularProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/produtos?destaque=true&limit=10`);
      const data = await res.json();
      return data.produtos || data || [];
    } catch {
      return [];
    }
  };

  const fetchTrendingProducts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/produtos?lancamento=true&limit=10`);
      const data = await res.json();
      return data.produtos || data || [];
    } catch {
      return [];
    }
  };

  const calculateComplementaryScore = (produto: Produto): number => {
    let score = 90; // Score base alto para produtos complementares

    // Aumentar score se for da mesma categoria
    if (cartCategories.includes(produto.categoria || '')) {
      score += 10;
    }

    // Aumentar score baseado em avaliações
    if (produto.avaliacao && produto.avaliacao >= 4) {
      score += 5;
    }

    // Aumentar score se estiver em promoção
    if (produto.promocao) {
      score += 5;
    }

    return score;
  };

  const handleAddToCart = async (produto: Produto) => {
    await addItem(produto, 1);
  };

  const getReasonIcon = (reason: SuggestionReason) => {
    switch (reason) {
      case 'complementary':
        return <Sparkles className="w-4 h-4" />;
      case 'popular':
        return <Heart className="w-4 h-4" />;
      case 'trending':
        return <TrendingUp className="w-4 h-4" />;
      case 'favorite':
        return <Zap className="w-4 h-4" />;
      case 'premium':
        return <Crown className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getReasonBadge = (reason: SuggestionReason) => {
    const configs = {
      complementary: { label: 'Complementar', variant: 'default' as const },
      popular: { label: 'Popular', variant: 'secondary' as const },
      trending: { label: 'Em alta', variant: 'destructive' as const },
      favorite: { label: 'Favorito', variant: 'default' as const },
      premium: { label: 'Premium', variant: 'outline' as const },
    };

    const config = configs[reason];
    return (
      <Badge variant={config.variant} className="text-xs">
        <span className="mr-1">{getReasonIcon(reason)}</span>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-semibold">Buscando sugestões inteligentes...</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[...Array(maxSuggestions)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-md mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="p-4 bg-gradient-to-br from-muted/30 via-transparent to-primary/5 border-2 border-dashed border-primary/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 rounded-full bg-primary/10">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Sugestões Inteligentes</h3>
            <p className="text-xs text-muted-foreground">
              Selecionadas especialmente para você
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <AnimatePresence mode="popLayout">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.produto.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
                className="group relative"
              >
                <Card className="overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 border-2 hover:border-primary/50">
                  {/* Badge de razão */}
                  <div className="absolute top-2 left-2 z-10">
                    {getReasonBadge(suggestion.reason)}
                  </div>

                  {/* Imagem */}
                  <div className="aspect-square relative overflow-hidden">
                    <OptimizedProductImage
                      produto={suggestion.produto}
                      alt={suggestion.produto.nome}
                      className="group-hover:scale-110 transition-transform duration-500"
                      aspectRatio={1}
                      showSkeleton={true}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-3 space-y-2">
                    <h4 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">
                      {suggestion.produto.nome}
                    </h4>

                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {suggestion.description}
                    </p>

                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-primary text-base">
                          R$ {suggestion.produto.preco.toFixed(2)}
                        </span>
                        {suggestion.produto.promocao && (
                          <div className="text-xs text-red-500 font-medium">
                            OFERTA!
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="h-8 w-8 p-0 rounded-full"
                        onClick={() => handleAddToCart(suggestion.produto)}
                        title="Adicionar ao carrinho"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Avaliação */}
                    {suggestion.produto.avaliacao && suggestion.produto.avaliacao > 0 && (
                      <div className="flex items-center gap-1 text-xs text-amber-600">
                        {'⭐'.repeat(Math.round(suggestion.produto.avaliacao))}
                        <span className="text-muted-foreground ml-1">
                          ({suggestion.produto.totalAvaliacoes || 0})
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
};

export default SmartProductSuggestions;

