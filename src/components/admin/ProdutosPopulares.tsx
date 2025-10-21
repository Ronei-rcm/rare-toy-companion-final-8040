
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Dados simulados de produtos populares
const produtosPopulares = [
  {
    id: '1',
    nome: 'Boneco Woody Toy Story',
    preco: 189.90,
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    vendasTotal: 152,
    tendencia: 'crescente',
    estoque: 43,
  },
  {
    id: '2',
    nome: 'Coleção Hot Wheels Vintage',
    preco: 249.90,
    imagemUrl: '/lovable-uploads/5f25d86c-7dd5-4ee8-a882-240f06f77054.png',
    vendasTotal: 125,
    tendencia: 'crescente',
    estoque: 21,
  },
  {
    id: '3',
    nome: 'Boneco Buzz Lightyear',
    preco: 179.90,
    imagemUrl: '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png',
    vendasTotal: 98,
    tendencia: 'estável',
    estoque: 65,
  },
  {
    id: '4',
    nome: 'Barbie Vintage Anos 80',
    preco: 299.90,
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    vendasTotal: 87,
    tendencia: 'decrescente',
    estoque: 12,
  },
  {
    id: '5',
    nome: 'Coleção Toy Story Completa',
    preco: 459.90,
    imagemUrl: '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png',
    vendasTotal: 65,
    tendencia: 'estável',
    estoque: 38,
  },
];

const ProdutosPopulares = () => {
  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'crescente':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'decrescente':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEstoqueBadge = (estoque: number) => {
    if (estoque <= 15) {
      return <Badge variant="destructive">Baixo</Badge>;
    }
    if (estoque <= 50) {
      return <Badge variant="outline">Médio</Badge>;
    }
    return <Badge variant="default">Alto</Badge>;
  };

  if (produtosPopulares.length === 0) {
    return (
      <ScrollArea className="h-[300px]">
        <div className="text-muted-foreground text-center p-6">
          Nenhum produto cadastrado
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-[300px]">
      <div className="space-y-2">
        {produtosPopulares.map((produto) => (
          <Card key={produto.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-md overflow-hidden flex-shrink-0">
                  <img
                    src={produto.imagemUrl}
                    alt={produto.nome}
                    className="h-full w-full object-cover"
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-sm line-clamp-1">{produto.nome}</h3>
                      <p className="text-sm text-muted-foreground">
                        R$ {produto.preco.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {getTendenciaIcon(produto.tendencia)}
                      <span className="ml-1 text-sm font-medium">{produto.vendasTotal}</span>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-1">
                    <div className="text-xs text-muted-foreground">
                      Estoque: {produto.estoque} unid.
                    </div>
                    {getEstoqueBadge(produto.estoque)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ProdutosPopulares;
