import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Package,
  Plus,
  Minus,
  Scale,
  Award,
  MapPin
} from 'lucide-react';
import ProductShareButtons from './ProductShareButtons';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useProductComparison } from '@/hooks/useProductComparison';
import { getProductImage } from '@/utils/imageUtils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
  faixa_etaria?: string;
  peso?: string;
  dimensoes?: string;
  material?: string;
  marca?: string;
  fornecedor?: string;
}

interface ProductDetailsEnhancedProps {
  product: Product | null;
  loading?: boolean;
}

const ProductDetailsEnhanced: React.FC<ProductDetailsEnhancedProps> = ({ 
  product, 
  loading = false 
}) => {
  const { toast } = useToast();
  const { addItem } = useCart();
  const { addToComparison, isInComparison, canAddMore } = useProductComparison();
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('descricao');

  useEffect(() => {
    if (product) {
      setQuantity(1);
    }
  }, [product]);

  if (loading || !product) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-32 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

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
  };

  const handleFavorite = async () => {
    try {
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
      const method = isFavorite ? 'DELETE' : 'POST';
      const url = isFavorite 
        ? `${API_BASE_URL}/favorites/${product.id}`
        : `${API_BASE_URL}/favorites`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        ...(method === 'POST' && { body: JSON.stringify({ product_id: product.id }) })
      });

      if (response.ok) {
        setIsFavorite(!isFavorite);
        toast({
          title: isFavorite ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
          description: `${product.nome} foi ${isFavorite ? 'removido' : 'adicionado'} aos seus favoritos`
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar favoritos',
        variant: 'destructive'
      });
    }
  };


  const handleAddToComparison = () => {
    if (!canAddMore) {
      toast({
        title: 'Limite atingido',
        description: 'Você pode comparar no máximo 4 produtos',
        variant: 'destructive'
      });
      return;
    }

    if (isInComparison(product.id)) {
      toast({
        title: 'Já está na comparação',
        description: 'Este produto já está na sua lista de comparação'
      });
      return;
    }

    addToComparison(product);
    toast({
      title: 'Adicionado à comparação',
      description: `${product.nome} foi adicionado à comparação`
    });
  };

  const emEstoque = product.estoque > 0;
  const imageUrl = getProductImage(product.imagem_url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
              {product.nome}
            </h1>
            <div className="flex items-center gap-3 flex-wrap">
              {product.avaliacao && (
                <div className="flex items-center gap-1">
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
                  <span className="ml-1 text-sm font-medium">
                    {product.avaliacao.toFixed(1)}
                  </span>
                  {product.total_avaliacoes && (
                    <span className="text-sm text-gray-500">
                      ({product.total_avaliacoes})
                    </span>
                  )}
                </div>
              )}
              {product.categoria && (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                  {product.categoria}
                </Badge>
              )}
            </div>
          </div>
          
          {/* Ações rápidas */}
          <div className="flex gap-2">
            <ProductShareButtons
              productName={product.nome}
              productId={product.id}
              productDescription={product.descricao}
              productImage={product.imagem_url}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={handleFavorite}
              title="Favoritar"
            >
              <Heart className={cn(
                "h-4 w-4",
                isFavorite && "fill-red-500 text-red-500"
              )} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleAddToComparison}
              disabled={!canAddMore && !isInComparison(product.id)}
              className={cn(
                isInComparison(product.id) && "bg-orange-50 border-orange-200"
              )}
              title={isInComparison(product.id) ? 'Já está na comparação' : 'Adicionar à comparação'}
            >
              <Scale className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Preço */}
      <div className="space-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-4xl font-bold text-orange-600">
            R$ {Number(product.preco).toFixed(2)}
          </span>
          {product.preco_original && (
            <>
              <span className="text-xl text-gray-400 line-through">
                R$ {Number(product.preco_original).toFixed(2)}
              </span>
              <Badge className="bg-red-500 text-white">
                -{discount}%
              </Badge>
            </>
          )}
        </div>
        {product.preco_original && (
          <p className="text-sm text-green-600 font-medium">
            Economize R$ {Number(product.preco_original - product.preco).toFixed(2)}
          </p>
        )}
      </div>

      <Separator />

      {/* Informações Rápidas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Package className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Estoque</p>
            <p className={cn(
              "text-sm font-medium",
              emEstoque ? "text-green-600" : "text-red-600"
            )}>
              {emEstoque ? `${product.estoque} disponíveis` : 'Indisponível'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Truck className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Entrega</p>
            <p className="text-sm font-medium">5-7 dias úteis</p>
          </div>
        </div>
        
        {product.faixa_etaria && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Award className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-500">Idade</p>
              <p className="text-sm font-medium">{product.faixa_etaria}</p>
            </div>
          </div>
        )}
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Shield className="h-5 w-5 text-gray-600" />
          <div>
            <p className="text-xs text-gray-500">Garantia</p>
            <p className="text-sm font-medium">30 dias</p>
          </div>
        </div>
      </div>

      {/* Quantidade e Ações */}
      <div className="space-y-4">
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
            <span className="w-16 text-center font-medium text-lg">{quantity}</span>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setQuantity(Math.min(product.estoque, quantity + 1))}
              disabled={quantity >= product.estoque}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-500 ml-2">
              {product.estoque} disponíveis
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleAddToCart}
            disabled={!emEstoque}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            size="lg"
          >
            <ShoppingCart className="h-5 w-5 mr-2" />
            Adicionar ao Carrinho
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => window.location.href = `/loja`}
          >
            Continuar Comprando
          </Button>
        </div>

        {/* Garantias */}
        <div className="flex items-center gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <Shield className="h-5 w-5 text-blue-600" />
          <p className="text-sm text-blue-800">
            Compra 100% segura com garantia de satisfação ou seu dinheiro de volta
          </p>
        </div>
      </div>

      <Separator />

      {/* Tabs de Informações */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="descricao">Descrição</TabsTrigger>
          <TabsTrigger value="especificacoes">Especificações</TabsTrigger>
          <TabsTrigger value="entrega">Entrega</TabsTrigger>
        </TabsList>
        
        <TabsContent value="descricao" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {product.descricao || 'Descrição não disponível para este produto.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="especificacoes" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {product.categoria && (
                  <div>
                    <p className="text-sm text-gray-500">Categoria</p>
                    <p className="font-medium">{product.categoria}</p>
                  </div>
                )}
                {product.marca && (
                  <div>
                    <p className="text-sm text-gray-500">Marca</p>
                    <p className="font-medium">{product.marca}</p>
                  </div>
                )}
                {product.faixa_etaria && (
                  <div>
                    <p className="text-sm text-gray-500">Faixa Etária</p>
                    <p className="font-medium">{product.faixa_etaria}</p>
                  </div>
                )}
                {product.material && (
                  <div>
                    <p className="text-sm text-gray-500">Material</p>
                    <p className="font-medium">{product.material}</p>
                  </div>
                )}
                {product.peso && (
                  <div>
                    <p className="text-sm text-gray-500">Peso</p>
                    <p className="font-medium">{product.peso}</p>
                  </div>
                )}
                {product.dimensoes && (
                  <div>
                    <p className="text-sm text-gray-500">Dimensões</p>
                    <p className="font-medium">{product.dimensoes}</p>
                  </div>
                )}
                {product.fornecedor && (
                  <div>
                    <p className="text-sm text-gray-500">Fornecedor</p>
                    <p className="font-medium">{product.fornecedor}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="entrega" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Prazo de Entrega</p>
                  <p className="text-sm text-gray-600">
                    Entrega em 5-7 dias úteis para todo o Brasil
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Frete Grátis</p>
                  <p className="text-sm text-gray-600">
                    Compras acima de R$ 200,00 têm frete grátis
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium mb-1">Garantia</p>
                  <p className="text-sm text-gray-600">
                    30 dias de garantia ou seu dinheiro de volta
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetailsEnhanced;

