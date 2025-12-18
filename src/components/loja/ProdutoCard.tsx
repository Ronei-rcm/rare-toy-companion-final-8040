
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Eye, Scale } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { Produto } from '@/types/produto';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import ProductQuickView from './ProductQuickView';
import { useProductComparison } from '@/hooks/useProductComparison';
import { cn } from '@/lib/utils';

interface ProdutoCardProps {
  produto: Produto;
}

const ProdutoCard: React.FC<ProdutoCardProps> = ({ produto }) => {
  const { toast } = useToast();
  const { addItem, state } = useCart();
  const [isAdding, setIsAdding] = React.useState(false);
  const [isFav, setIsFav] = React.useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const { addToComparison, isInComparison, canAddMore } = useProductComparison();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  React.useEffect(() => {
    // opcional: poderíamos carregar favoritos globais e marcar
  }, []);

  const adicionarAoCarrinho = async () => {
    setIsAdding(true);
    try {
      await addItem(produto);
    } finally {
      setIsAdding(false);
    }
  };

  const adicionarAosFavoritos = () => {
    // Toggle persistente
    (async () => {
      try {
        if (!isFav) {
          const res = await fetch(`${API_BASE_URL}/favorites`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ product_id: produto.id })
          });
          if (!res.ok) throw new Error('Falha ao favoritar');
          setIsFav(true);
          toast({ title: 'Favorito adicionado', description: produto.nome });
        } else {
          const res = await fetch(`${API_BASE_URL}/favorites/${produto.id}`, { method: 'DELETE', credentials: 'include' });
          if (!res.ok) throw new Error('Falha ao desfavoritar');
          setIsFav(false);
          toast({ title: 'Favorito removido', description: produto.nome });
        }
      } catch (e: any) {
        toast({ variant: 'destructive', title: 'Erro', description: e?.message || 'Não foi possível atualizar favorito' });
      }
    })();
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

    if (isInComparison(produto.id)) {
      toast({
        title: 'Já está na comparação',
        description: 'Este produto já está na sua lista de comparação'
      });
      return;
    }

    addToComparison({
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      preco_original: produto.promocao ? produto.preco * 1.2 : undefined,
      descricao: produto.descricao,
      imagem_url: produto.imagemUrl,
      estoque: produto.estoque,
      categoria: produto.categoria,
      avaliacao: produto.avaliacao,
      total_avaliacoes: produto.totalAvaliacoes,
      promocao: produto.promocao,
      destaque: produto.destaque,
      lancamento: produto.lancamento
    });

    toast({
      title: 'Adicionado à comparação',
      description: `${produto.nome} foi adicionado à comparação`
    });
  };

  const precoOriginal = produto.precoOriginal ?? (produto.promocao ? produto.preco * 1.15 : undefined);
  const imagemPrincipal = produto.imagemUrl || '/placeholder.svg';

  const produtoForQuickView = {
    id: produto.id,
    nome: produto.nome,
    preco: produto.preco,
    preco_original: precoOriginal,
    descricao: produto.descricao,
    imagem_url: imagemPrincipal,
    estoque: produto.estoque,
    categoria: produto.categoria,
    avaliacao: produto.avaliacao,
    total_avaliacoes: produto.totalAvaliacoes,
    promocao: produto.promocao,
    destaque: produto.destaque,
    lancamento: produto.lancamento
  };

  // Verificar se o produto está em estoque
  const emEstoque = produto.emEstoque !== undefined ? produto.emEstoque : produto.estoque > 0;

  return (
    <Card key={produto.id} className="overflow-hidden flex flex-col transition-shadow hover:shadow-lg h-full border border-orange-50/60 bg-white">
      <CardHeader className="p-0">
        <Dialog>
          <div className="relative p-3 bg-gradient-to-b from-muted/40 to-transparent">
            <AspectRatio ratio={4 / 5} className="rounded-xl bg-white border border-orange-50/60">
              <DialogTrigger asChild>
                <button className="group block w-full h-full focus:outline-none" aria-label={`Ver imagem de ${produto.nome}`}>
                  <img
                    src={imagemPrincipal}
                    alt={produto.nome}
                    loading="lazy"
                    decoding="async"
                    fetchpriority="low"
                    className="object-contain w-full h-full transition-transform duration-300 group-hover:scale-[1.03] rounded-xl bg-white"
                    sizes="(min-width: 1280px) 300px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                </button>
              </DialogTrigger>

              {produto.promocao && (
                <Badge className="absolute top-2 right-2 bg-red-500 shadow-sm">-{Math.min(30, Math.round((produto.descontoPercentual || 10)))}%</Badge>
              )}
              {produto.lancamento && (
                <Badge className="absolute top-2 right-2 bg-blue-500 shadow-sm">Lançamento</Badge>
              )}
              {produto.destaque && !produto.promocao && !produto.lancamento && (
                <Badge className="absolute top-2 right-2 bg-amber-500 shadow-sm">Destaque</Badge>
              )}
            </AspectRatio>
          </div>

          <DialogContent className="max-w-lg">
            <div className="w-full">
              <img
                src={produto.imagemUrl}
                alt={produto.nome}
                className="w-full h-auto max-h-[70vh] rounded-md object-contain bg-black/5"
                loading="eager"
                decoding="async"
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-lg line-clamp-2 pr-2">{produto.nome}</h3>
          {produto.categoria && (
            <Badge variant="outline" className="ml-2 whitespace-nowrap">
              {produto.categoria}
            </Badge>
          )}
        </div>
        <div className="space-y-1 mb-2">
          <p className="text-xl font-bold text-primary leading-tight">
            R$ {produto.preco.toFixed(2)}
          </p>
          {produto.promocao && precoOriginal && (
            <p className="text-xs text-muted-foreground line-through">R$ {precoOriginal.toFixed(2)}</p>
          )}
        </div>
        {produto.descricao && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
            {produto.descricao}
          </p>
        )}
        <div className="flex items-center">
          <Badge 
            variant={emEstoque ? "default" : "destructive"}
            className="text-xs"
          >
            {emEstoque ? 'Em estoque' : 'Fora de estoque'}
          </Badge>
        </div>
        <div className="mt-2 text-xs text-muted-foreground">
          {produto.preco >= 200 ? 'Frete grátis para este item' : 'Ganhe 5% de cashback no PIX'}
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 gap-2 flex flex-col">
        <div className="flex gap-2 w-full">
          <Button 
            onClick={adicionarAoCarrinho} 
            className="flex-1"
            disabled={!emEstoque || isAdding || state.isLoading}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {isAdding ? 'Adicionando...' : 'Adicionar'}
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={adicionarAosFavoritos}
            title="Favoritar"
          >
            <Heart className={`h-4 w-4 ${isFav ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
        </div>
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 text-xs"
            onClick={() => setShowQuickView(true)}
          >
            <Eye className="h-3 w-3 mr-1" />
            Ver Rápido
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "flex-1 text-xs",
              isInComparison(produto.id) && "bg-orange-50 border-orange-200 text-orange-700"
            )}
            onClick={handleAddToComparison}
            disabled={!canAddMore && !isInComparison(produto.id)}
            title={isInComparison(produto.id) ? 'Já está na comparação' : 'Adicionar à comparação'}
          >
            <Scale className="h-3 w-3 mr-1" />
            {isInComparison(produto.id) ? 'Na Lista' : 'Comparar'}
          </Button>
        </div>
      </CardFooter>

      {/* Quick View Modal */}
      <ProductQuickView
        product={showQuickView ? produtoForQuickView : null}
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        onAddToCart={() => {
          setShowQuickView(false);
          adicionarAoCarrinho();
        }}
      />
    </Card>
  );
};

export default ProdutoCard;
