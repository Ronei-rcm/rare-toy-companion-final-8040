import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, ShoppingCart, Eye, Trash2, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/contexts/CartContext';

interface ProdutoFavorito {
  id: string;
  nome: string;
  preco: number;
  imagemUrl: string;
  categoria: string;
  emEstoque: boolean;
  destaque: boolean;
  promocao: boolean;
}

const FavoritosTab = () => {
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [favoritos, setFavoritos] = React.useState<ProdutoFavorito[]>([]);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const loadFavoritos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/favorites`, { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar favoritos');
      const data = await res.json();
      setFavoritos(Array.isArray(data) ? data : []);
    } catch {
      setFavoritos([]);
    }
  };

  React.useEffect(() => { loadFavoritos(); }, []);

  const handleAdicionarAoCarrinho = (produto: ProdutoFavorito) => {
    if (!produto.emEstoque) {
      toast.error('Produto fora de estoque');
      return;
    }

    // Simular produto para o carrinho
    const produtoCarrinho = {
      id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      imagemUrl: produto.imagemUrl,
      categoria: produto.categoria,
      estoque: produto.emEstoque ? 10 : 0,
      status: 'ativo' as const,
      destaque: produto.destaque,
      promocao: produto.promocao,
      lancamento: false,
      avaliacao: 4.5,
      totalAvaliacoes: 100,
    };

    addItem(produtoCarrinho);
    toast.success(`${produto.nome} adicionado ao carrinho!`);
  };

  const handleRemoverFavorito = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/favorites/${id}`, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao remover favorito');
      await loadFavoritos();
      toast.success('Produto removido dos favoritos');
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao remover favorito');
    }
  };

  const handleVerDetalhes = (id: string) => {
    navigate(`/produto/${id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Meus Favoritos</h2>
        <p className="text-muted-foreground">Produtos que você adicionou aos favoritos</p>
      </div>

      {favoritos.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favoritos.map((produto) => (
            <Card key={produto.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="relative">
                  <div className="aspect-square w-full overflow-hidden rounded-lg bg-muted">
                    <img
                      src={produto.imagemUrl}
                      alt={produto.nome}
                      className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zMiAyMEMyNi40NzcyIDIwIDIyIDI0LjQ3NzIgMjIgMzBTMjYuNDc3MiA0MCAzMiA0MEMzNy41MjI4IDQwIDQyIDM1LjUyMjggNDIgMzBTMzcuNTIyOCAyMCAzMiAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTMyIDI0QzI4LjY4NjMgMjQgMjYgMjYuNjg2MyAyNiAzMEMyNiAzMy4zMTM3IDI4LjY4NjMgMzYgMzIgMzZDMzUuMzEzNyAzNiAzOCAzMy4zMTM3IDM4IDMwQzM4IDI2LjY4NjMgMzUuMzEzNyAyNCAzMiAyNFoiIGZpbGw9IiM2Qjc0ODAiLz4KPC9zdmc+';
                      }}
                    />
                  </div>
                  
                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {produto.destaque && (
                      <Badge variant="secondary" className="text-xs">
                        Destaque
                      </Badge>
                    )}
                    {produto.promocao && (
                      <Badge variant="destructive" className="text-xs">
                        Promoção
                      </Badge>
                    )}
                    {!produto.emEstoque && (
                      <Badge variant="outline" className="text-xs bg-background">
                        Fora de Estoque
                      </Badge>
                    )}
                  </div>

                  {/* Botão remover favorito */}
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 bg-background/80 hover:bg-background"
                    onClick={() => handleRemoverFavorito(produto.id)}
                  >
                    <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <CardTitle className="text-lg line-clamp-2">{produto.nome}</CardTitle>
                  <div className="mt-1">
                    <Badge variant="outline" className="text-xs">
                      {produto.categoria}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-primary">
                      R$ {produto.preco.toFixed(2)}
                    </p>
                    {produto.promocao && (
                      <p className="text-sm text-muted-foreground line-through">
                        R$ {(produto.preco * 1.2).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleVerDetalhes(produto.id)}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Detalhes
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleAdicionarAoCarrinho(produto)}
                    disabled={!produto.emEstoque}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum favorito ainda</h3>
            <p className="text-muted-foreground text-center mb-6">
              Adicione produtos aos seus favoritos para encontrá-los facilmente
            </p>
            <Button onClick={() => navigate('/loja')}>
              <Package className="mr-2 h-4 w-4" />
              Explorar Produtos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FavoritosTab;