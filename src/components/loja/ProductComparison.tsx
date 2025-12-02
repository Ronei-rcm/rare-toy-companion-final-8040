import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  X, 
  ShoppingCart, 
  Heart, 
  Star, 
  Package, 
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { getProductImage } from '@/utils/imageUtils';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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
}

interface ProductComparisonProps {
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
}

const ProductComparison: React.FC<ProductComparisonProps> = ({
  products,
  onRemove,
  onClear
}) => {
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  if (products.length === 0) return null;

  const maxProducts = 4;
  const canAddMore = products.length < maxProducts;

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      nome: product.nome,
      preco: product.preco,
      imagem_url: product.imagem_url,
      quantidade: 1
    });

    toast({
      title: 'Adicionado ao carrinho!',
      description: `${product.nome} foi adicionado ao carrinho`
    });
  };

  const getComparisonValue = (product: Product, field: string): string | number => {
    switch (field) {
      case 'preco':
        return `R$ ${Number(product.preco).toFixed(2)}`;
      case 'estoque':
        return product.estoque > 0 ? 'Disponível' : 'Indisponível';
      case 'avaliacao':
        return product.avaliacao ? product.avaliacao.toFixed(1) : 'N/A';
      case 'promocao':
        return product.promocao ? 'Sim' : 'Não';
      default:
        return '-';
    }
  };

  const getBestValue = (field: string): { value: string | number; productId: string } | null => {
    if (products.length === 0) return null;

    switch (field) {
      case 'preco':
        const cheapest = products.reduce((prev, curr) => 
          curr.preco < prev.preco ? curr : prev
        );
        return { value: cheapest.preco, productId: cheapest.id };
      case 'avaliacao':
        const bestRated = products.reduce((prev, curr) => {
          const prevRating = prev.avaliacao || 0;
          const currRating = curr.avaliacao || 0;
          return currRating > prevRating ? curr : prev;
        });
        return bestRated.avaliacao 
          ? { value: bestRated.avaliacao, productId: bestRated.id }
          : null;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg"
        >
          <Package className="h-5 w-5 mr-2" />
          Comparar ({products.length})
        </Button>
      </motion.div>

      {/* Modal de comparação */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Comparação de Produtos</DialogTitle>
                <DialogDescription>
                  Compare até {maxProducts} produtos lado a lado
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {products.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onClear}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Tudo
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum produto para comparar
                </h3>
                <p className="text-gray-500">
                  Adicione produtos à comparação para ver as diferenças
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-4 text-left sticky left-0 bg-white z-10 min-w-[200px]">
                        Características
                      </th>
                      <AnimatePresence>
                        {products.map((product) => (
                          <motion.th
                            key={product.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="p-4 text-center border-l min-w-[250px] relative"
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute top-2 right-2 h-6 w-6"
                              onClick={() => onRemove(product.id)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            
                            <div className="mt-6">
                              <img
                                src={getProductImage(product.imagem_url)}
                                alt={product.nome}
                                className="w-32 h-32 object-cover rounded-lg mx-auto mb-3"
                              />
                              <h3 className="font-medium text-sm mb-2 line-clamp-2">
                                {product.nome}
                              </h3>
                              <div className="flex items-center justify-center gap-1 mb-3">
                                {product.avaliacao && (
                                  <>
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs">
                                      {product.avaliacao.toFixed(1)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </motion.th>
                        ))}
                      </AnimatePresence>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Preço */}
                    <tr className="border-b">
                      <td className="p-4 font-medium">Preço</td>
                      {products.map((product) => {
                        const best = getBestValue('preco');
                        const isBest = best && best.productId === product.id;
                        return (
                          <td
                            key={product.id}
                            className={cn(
                              "p-4 text-center border-l",
                              isBest && "bg-green-50"
                            )}
                          >
                            <div>
                              <p className={cn(
                                "font-bold",
                                isBest && "text-green-600"
                              )}>
                                R$ {Number(product.preco).toFixed(2)}
                              </p>
                              {isBest && (
                                <Badge variant="outline" className="mt-1 text-xs">
                                  Melhor Preço
                                </Badge>
                              )}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {/* Avaliação */}
                    <tr className="border-b">
                      <td className="p-4 font-medium">Avaliação</td>
                      {products.map((product) => {
                        const best = getBestValue('avaliacao');
                        const isBest = best && best.productId === product.id;
                        return (
                          <td
                            key={product.id}
                            className={cn(
                              "p-4 text-center border-l",
                              isBest && "bg-green-50"
                            )}
                          >
                            {product.avaliacao ? (
                              <div>
                                <div className="flex items-center justify-center gap-1 mb-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  <span className={cn(
                                    "font-medium",
                                    isBest && "text-green-600"
                                  )}>
                                    {product.avaliacao.toFixed(1)}
                                  </span>
                                </div>
                                {isBest && (
                                  <Badge variant="outline" className="text-xs">
                                    Melhor Avaliado
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>

                    {/* Estoque */}
                    <tr className="border-b">
                      <td className="p-4 font-medium">Disponibilidade</td>
                      {products.map((product) => (
                        <td key={product.id} className="p-4 text-center border-l">
                          <div className="flex items-center justify-center gap-2">
                            {product.estoque > 0 ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-green-600">Disponível</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 text-red-500" />
                                <span className="text-sm text-red-600">Indisponível</span>
                              </>
                            )}
                          </div>
                        </td>
                      ))}
                    </tr>

                    {/* Promoção */}
                    <tr className="border-b">
                      <td className="p-4 font-medium">Em Promoção</td>
                      {products.map((product) => (
                        <td key={product.id} className="p-4 text-center border-l">
                          {product.promocao ? (
                            <Badge className="bg-red-500">Sim</Badge>
                          ) : (
                            <span className="text-gray-400">Não</span>
                          )}
                        </td>
                      ))}
                    </tr>

                    {/* Ações */}
                    <tr>
                      <td className="p-4 font-medium">Ações</td>
                      {products.map((product) => (
                        <td key={product.id} className="p-4 text-center border-l">
                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(product)}
                              disabled={product.estoque === 0}
                              className="w-full"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Adicionar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full"
                              onClick={() => window.location.href = `/produto/${product.id}`}
                            >
                              Ver Detalhes
                            </Button>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductComparison;

