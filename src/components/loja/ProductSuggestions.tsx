import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '@/contexts/CartContext';
import { Produto } from '@/types/produto';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';

interface ProductSuggestionsProps {
  cartItems: any[];
  maxSuggestions?: number;
}

const ProductSuggestions: React.FC<ProductSuggestionsProps> = ({
  cartItems,
  maxSuggestions = 4,
}) => {
  const [suggestions, setSuggestions] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadSuggestions();
  }, [cartItems]);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      
      // Extrair categorias dos itens no carrinho
      const categories = cartItems
        .map(item => item.produto?.categoria)
        .filter(Boolean);

      // Se não houver itens, buscar produtos em destaque
      if (categories.length === 0) {
        const res = await fetch(`${API_BASE_URL}/produtos?destaque=true&limit=${maxSuggestions}`);
        const data = await res.json();
        setSuggestions(data.produtos || data || []);
        return;
      }

      // Buscar produtos da mesma categoria que não estejam no carrinho
      const cartProductIds = cartItems.map(item => item.produto?.id);
      const res = await fetch(`${API_BASE_URL}/produtos?categoria=${categories[0]}&limit=20`);
      const data = await res.json();
      
      const filtered = (data.produtos || data || [])
        .filter((p: Produto) => !cartProductIds.includes(p.id))
        .slice(0, maxSuggestions);

      setSuggestions(filtered);
    } catch (error) {
      console.error('[ProductSuggestions] Erro ao carregar sugestões:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (produto: Produto) => {
    await addItem(produto, 1);
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Carregando sugestões...</h3>
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
      transition={{ duration: 0.3 }}
    >
      <Card className="p-4 bg-gradient-to-br from-muted/30 to-transparent border-2 border-dashed">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="font-semibold text-lg">Você também pode gostar</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {suggestions.map((produto, index) => (
            <motion.div
              key={produto.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <Card className="overflow-hidden hover:shadow-md transition-shadow">
                {/* Imagem */}
                <div className="aspect-square relative overflow-hidden">
                  <OptimizedProductImage
                    produto={produto}
                    alt={produto.nome}
                    className="group-hover:scale-110 transition-transform duration-300"
                    aspectRatio={1}
                    showSkeleton={true}
                  />
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-medium text-sm line-clamp-2 mb-1 min-h-[2.5rem]">
                    {produto.nome}
                  </h4>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-primary">
                      R$ {produto.preco.toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={() => handleAddToCart(produto)}
                      title="Adicionar ao carrinho"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
};

export default ProductSuggestions;
