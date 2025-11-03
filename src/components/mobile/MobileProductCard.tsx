import React, { useState } from 'react';
import { 
  Heart, 
  ShoppingCart, 
  Eye, 
  Star, 
  Truck, 
  Shield, 
  Clock,
  Zap,
  Tag,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  nome: string;
  preco: number;
  preco_original?: number;
  imagem: string;
  categoria: string;
  marca: string;
  avaliacao: number;
  total_avaliacoes: number;
  estoque: number;
  is_favorito?: boolean;
  is_oferta?: boolean;
  desconto_percentual?: number;
  frete_gratis?: boolean;
  entrega_rapida?: boolean;
  garantia?: string;
}

interface MobileProductCardProps {
  product: Product;
  onViewDetails?: (product: Product) => void;
  onToggleFavorite?: (productId: string) => void;
  variant?: 'default' | 'compact' | 'featured';
  showQuickActions?: boolean;
}

const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  onViewDetails,
  onToggleFavorite,
  variant = 'default',
  showQuickActions = true
}) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  const {
    id,
    nome,
    preco,
    preco_original,
    imagem,
    categoria,
    marca,
    avaliacao,
    total_avaliacoes,
    estoque,
    is_favorito = false,
    is_oferta = false,
    desconto_percentual = 0,
    frete_gratis = false,
    entrega_rapida = false,
    garantia
  } = product;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      // Redirecionar para login
      window.location.href = '/login';
      return;
    }

    setIsAddingToCart(true);
    try {
      await addToCart(id, 1);
      // Mostrar feedback visual
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleFavorite = () => {
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  const handleViewDetails = () => {
    if (onViewDetails) {
      onViewDetails(product);
    } else {
      window.location.href = `/produto/${id}`;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`w-3 h-3 ${
          index < Math.floor(rating)
            ? 'text-yellow-400 fill-current'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const getStockStatus = () => {
    if (estoque === 0) return { text: 'Esgotado', color: 'bg-red-100 text-red-800' };
    if (estoque <= 5) return { text: 'Últimas unidades', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Em estoque', color: 'bg-green-100 text-green-800' };
  };

  const stockStatus = getStockStatus();

  if (variant === 'compact') {
    return (
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <div className="flex gap-3 p-3">
          {/* Image */}
          <div className="relative w-20 h-20 flex-shrink-0">
            <img
              src={imagem}
              alt={nome}
              className="w-full h-full object-cover rounded-lg"
              onLoad={() => setIsImageLoaded(true)}
            />
            {is_oferta && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs">
                -{desconto_percentual}%
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-gray-900 truncate">
              {nome}
            </h3>
            <p className="text-xs text-gray-500 truncate">{marca}</p>
            
            <div className="flex items-center gap-1 mt-1">
              {renderStars(avaliacao)}
              <span className="text-xs text-gray-500">({total_avaliacoes})</span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">
                  {formatPrice(preco)}
                </span>
                {preco_original && preco_original > preco && (
                  <span className="text-xs text-gray-500 line-through">
                    {formatPrice(preco_original)}
                  </span>
                )}
              </div>
              
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isAddingToCart || estoque === 0}
                className="h-8 px-3 text-xs"
              >
                <ShoppingCart className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <div className="relative">
          {/* Image */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={imagem}
              alt={nome}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              onLoad={() => setIsImageLoaded(true)}
            />
            
            {/* Overlay badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {is_oferta && (
                <Badge className="bg-red-500 text-white">
                  -{desconto_percentual}%
                </Badge>
              )}
              {frete_gratis && (
                <Badge className="bg-green-500 text-white">
                  <Truck className="w-3 h-3 mr-1" />
                  Frete Grátis
                </Badge>
              )}
            </div>

            {/* Quick actions */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0 rounded-full bg-white/90 hover:bg-white"
                onClick={handleToggleFavorite}
              >
                <Heart className={`w-4 h-4 ${is_favorito ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
              </Button>
            </div>
          </div>

          {/* Content */}
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                  {nome}
                </h3>
                <p className="text-sm text-gray-600 mb-2">{marca}</p>
              </div>
            </div>

            <div className="flex items-center gap-1 mb-3">
              {renderStars(avaliacao)}
              <span className="text-sm text-gray-500">({total_avaliacoes})</span>
            </div>

            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-gray-900">
                  {formatPrice(preco)}
                </span>
                {preco_original && preco_original > preco && (
                  <span className="text-sm text-gray-500 line-through">
                    {formatPrice(preco_original)}
                  </span>
                )}
              </div>
              <Badge className={stockStatus.color}>
                {stockStatus.text}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleAddToCart}
                disabled={isAddingToCart || estoque === 0}
                className="flex-1"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isAddingToCart ? 'Adicionando...' : 'Adicionar'}
              </Button>
              <Button
                variant="outline"
                onClick={handleViewDetails}
                className="px-3"
              >
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {/* Image */}
        <div className="relative h-40 overflow-hidden">
          <img
            src={imagem}
            alt={nome}
            className="w-full h-full object-cover"
            onLoad={() => setIsImageLoaded(true)}
          />
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {is_oferta && (
              <Badge className="bg-red-500 text-white text-xs">
                -{desconto_percentual}%
              </Badge>
            )}
            {frete_gratis && (
              <Badge className="bg-green-500 text-white text-xs">
                <Truck className="w-3 h-3 mr-1" />
                Frete Grátis
              </Badge>
            )}
          </div>

          {/* Quick actions */}
          {showQuickActions && (
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <Button
                size="sm"
                variant="secondary"
                className="w-8 h-8 p-0 rounded-full bg-white/90 hover:bg-white"
                onClick={handleToggleFavorite}
              >
                <Heart className={`w-4 h-4 ${is_favorito ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
              </Button>
            </div>
          )}
        </div>

        {/* Content */}
        <CardContent className="p-3">
          <div className="mb-2">
            <h3 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
              {nome}
            </h3>
            <p className="text-xs text-gray-500">{marca}</p>
          </div>

          <div className="flex items-center gap-1 mb-2">
            {renderStars(avaliacao)}
            <span className="text-xs text-gray-500">({total_avaliacoes})</span>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm text-gray-900">
                {formatPrice(preco)}
              </span>
              {preco_original && preco_original > preco && (
                <span className="text-xs text-gray-500 line-through">
                  {formatPrice(preco_original)}
                </span>
              )}
            </div>
            <Badge className={`text-xs ${stockStatus.color}`}>
              {stockStatus.text}
            </Badge>
          </div>

          {/* Features */}
          <div className="flex items-center gap-2 mb-3 text-xs text-gray-600">
            {entrega_rapida && (
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span>Entrega Rápida</span>
              </div>
            )}
            {garantia && (
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span>{garantia}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleAddToCart}
              disabled={isAddingToCart || estoque === 0}
              className="flex-1 text-xs"
            >
              <ShoppingCart className="w-3 h-3 mr-1" />
              {isAddingToCart ? 'Adicionando...' : 'Adicionar'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewDetails}
              className="px-3"
            >
              <Eye className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
};

export default MobileProductCard;
