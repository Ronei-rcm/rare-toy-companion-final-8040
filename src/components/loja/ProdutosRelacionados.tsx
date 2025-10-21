
import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart } from 'lucide-react';
import { useRelatedProducts, useProductsByCollection } from '@/hooks/useProducts';
import { Produto } from '@/types/produto';

interface ProdutosRelacionadosProps {
  produtoId?: string;
  colecaoId?: string;
}

const ProdutosRelacionados = ({ produtoId, colecaoId }: ProdutosRelacionadosProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Use appropriate hook based on what we have
  const relatedByProduct = useRelatedProducts(produtoId || '', 6);
  const relatedByCollection = useProductsByCollection(colecaoId || '');
  
  // Choose the right data source
  const { products: produtosRelacionados, loading, error } = produtoId 
    ? relatedByProduct
    : colecaoId 
    ? { ...relatedByCollection, products: relatedByCollection.products.slice(0, 6) }
    : { products: [], loading: false, error: null };
  
  const adicionarAoCarrinho = (produto: Produto) => {
    toast({
      title: 'Produto adicionado!',
      description: `${produto.nome} foi adicionado ao carrinho.`,
    });
  };
  
  const verProduto = (id: string) => {
    navigate(`/produto/${id}`);
  };

  if (loading) {
    return (
      <ScrollArea>
        <div className="flex space-x-4 pb-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="flex-shrink-0 w-[260px] overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
              <CardFooter className="p-3 pt-0">
                <Skeleton className="h-8 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    );
  }

  if (error) {
    return (
      <Card className="p-4">
        <div className="text-muted-foreground text-center">
          {error}
        </div>
      </Card>
    );
  }

  return (
    <ScrollArea>
      <div className="flex space-x-4 pb-4">
        {produtosRelacionados.length > 0 ? (
          produtosRelacionados.map((produto) => (
            <Card key={produto.id} className="flex-shrink-0 w-[260px] overflow-hidden">
              <div className="cursor-pointer" onClick={() => verProduto(produto.id)}>
                <AspectRatio ratio={4/3}>
                  <div className="relative h-full">
                    <img 
                      src={produto.imagemUrl} 
                      alt={produto.nome}
                      className="object-cover w-full h-full"
                    />
                    {produto.promocao && (
                      <Badge className="absolute top-2 right-2 bg-red-500">Promoção</Badge>
                    )}
                  </div>
                </AspectRatio>
              </div>
              
              <CardContent className="p-3">
                <h3 
                  className="font-medium text-sm line-clamp-2 cursor-pointer hover:text-orange-700"
                  onClick={() => verProduto(produto.id)}
                >
                  {produto.nome}
                </h3>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-lg font-bold text-orange-600">
                    R$ {produto.preco.toFixed(2)}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {produto.categoria}
                  </Badge>
                </div>
              </CardContent>
              
              <CardFooter className="p-3 pt-0">
                <Button 
                  size="sm"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-xs"
                  disabled={!(produto.emEstoque || produto.estoque > 0)}
                  onClick={() => adicionarAoCarrinho(produto)}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  {(produto.emEstoque || produto.estoque > 0) ? 'Adicionar' : 'Indisponível'}
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card className="flex-shrink-0 w-[260px] p-4">
            <div className="text-muted-foreground text-center">
              Nenhum produto relacionado encontrado.
            </div>
          </Card>
        )}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

export default ProdutosRelacionados;
