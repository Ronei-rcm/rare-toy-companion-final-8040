import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ShoppingCart, 
  Heart, 
  Share2, 
  Star, 
  Package, 
  Truck, 
  Shield,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getProductImage } from '@/utils/imageUtils';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  nome: string;
  preco: number;
  preco_original?: number;
  descricao?: string;
  imagem_url?: string;
  estoque: number;
  categoria?: string;
  avaliacao?: number;
  total_avaliacoes?: number;
  promocao?: boolean;
  destaque?: boolean;
  lancamento?: boolean;
}

interface ProductQuickViewProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart?: (product: Product) => void;
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);

  if (!product) return null;

  const discount = product.preco_original 
    ? Math.round(((product.preco_original - product.preco) / product.preco_original) * 100)
    : 0;

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        nome: product.nome,
        preco: product.preco,
        imagem_url: product.imagem_url,
        quantidade: 1
      });
    }

    toast({
      title: 'Adicionado ao carrinho! 🛒',
      description: `${quantity}x ${product.nome} adicionado${quantity > 1 ? 's' : ''} ao carrinho`,
    });

    if (onAddToCart) {
      onAddToCart(product);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/produto/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.nome,
          text: product.descricao || '',
          url: url
        });
      } catch (error) {
        // Usuário cancelou ou erro
      }
    } else {
      navigator.clipboard.writeText(url);
      toast({
        title: 'Link copiado!',
        description: 'Link do produto copiado para a área de transferência'
      });
    }
  };

  const handleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
      description: isFavorite 
        ? `${product.nome} foi removido dos seus favoritos`
        : `${product.nome} foi adicionado aos seus favoritos`
    });
  };

  const imageUrl = getProductImage(product.imagem_url);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{product.nome}</DialogTitle>
          <DialogDescription>
            Visualização rápida do produto
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Imagem */}
          <div className="relative">
            {!imageError ? (
              <img
                src={imageUrl}
                alt={product.nome}
                className="w-full h-96 object-cover rounded-lg"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
                <Package className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.promocao && (
                <Badge className="bg-red-500 text-white">
                  -{discount}%
                </Badge>
              )}
              {product.destaque && (
                <Badge className="bg-yellow-500 text-white">
                  Destaque
                </Badge>
              )}
              {product.lancamento && (
                <Badge className="bg-green-500 text-white">
                  Novo
                </Badge>
              )}
            </div>

            {/* Ações rápidas */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={handleFavorite}
              >
                <Heart className={cn(
                  "h-4 w-4",
                  isFavorite && "fill-red-500 text-red-500"
                )} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="bg-white/90 backdrop-blur-sm hover:bg-white"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Informações */}
          <div className="space-y-4">
            {/* Preço */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                  R$ {Number(product.preco).toFixed(2)}
                </span>
                {product.preco_original && (
                  <span className="text-lg text-gray-400 line-through">
                    R$ {Number(product.preco_original).toFixed(2)}
                  </span>
                )}
              </div>
              {product.preco_original && (
                <p className="text-sm text-green-600 font-medium mt-1">
                  Economize R$ {Number(product.preco_original - product.preco).toFixed(2)}
                </p>
              )}
            </div>

            {/* Avaliação */}
            {product.avaliacao && (
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-4 w-4",
                        i < Math.round(product.avaliacao!) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-gray-300"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.avaliacao.toFixed(1)} ({product.total_avaliacoes || 0} avaliações)
                </span>
              </div>
            )}

            <Separator />

            {/* Descrição */}
            {product.descricao && (
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-gray-600 line-clamp-4">
                  {product.descricao}
                </p>
              </div>
            )}

            {/* Informações adicionais */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Package className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Estoque</p>
                  <p className="text-sm font-medium">
                    {product.estoque > 0 ? `${product.estoque} disponíveis` : 'Indisponível'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Truck className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Entrega</p>
                  <p className="text-sm font-medium">5-7 dias úteis</p>
                </div>
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <label className="text-sm font-medium mb-2 block">Quantidade</label>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() => setQuantity(Math.min(product.estoque, quantity + 1))}
                  disabled={quantity >= product.estoque}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex gap-3 pt-4">
              <Button
                onClick={handleAddToCart}
                disabled={product.estoque === 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Adicionar ao Carrinho
              </Button>
              <Button
                variant="outline"
                onClick={onClose}
                size="lg"
              >
                Ver Detalhes Completos
              </Button>
            </div>

            {/* Garantia */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
              <Shield className="h-5 w-5 text-blue-600" />
              <p className="text-sm text-blue-800">
                Compra 100% segura com garantia de satisfação
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickView;

