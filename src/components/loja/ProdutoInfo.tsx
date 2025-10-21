
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Heart, Star, Share2, TruckIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// Dados simulados para um produto específico
const produtoMock = {
  id: '1',
  nome: 'Boneco Woody Toy Story',
  preco: 189.90,
  precoAntigo: 249.90,
  descricao: 'Boneco colecionável Woody em perfeito estado de conservação. Um item raro e com grande valor para colecionadores da franquia Toy Story.',
  categoria: 'Bonecos de Ação',
  emEstoque: true,
  avaliacao: 4.8,
  numAvaliacoes: 45,
  cores: ['Original', 'Edição Especial'],
  idadeRecomendada: '5+ anos',
  marca: 'MuhlStore',
  tempoEntrega: '2-4 dias úteis',
  promocao: true,
  imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
};

const ProdutoInfo = ({ produtoId }: { produtoId?: string }) => {
  const { toast } = useToast();
  const [quantidade, setQuantidade] = useState(1);
  const [corSelecionada, setCorSelecionada] = useState(produtoMock.cores[0]);
  
  // Normalmente buscaríamos o produto pelo ID
  const produto = produtoMock;

  const adicionarAoCarrinho = () => {
    toast({
      title: 'Produto adicionado ao carrinho!',
      description: `${quantidade}x ${produto.nome} (${corSelecionada}) adicionado com sucesso.`,
    });
  };

  const adicionarAosFavoritos = () => {
    toast({
      title: 'Adicionado aos favoritos!',
      description: `${produto.nome} foi adicionado à sua lista de desejos.`,
    });
  };

  const compartilhar = () => {
    toast({
      title: 'Link copiado!',
      description: 'O link do produto foi copiado para a área de transferência.',
    });
  };

  const aumentarQuantidade = () => setQuantidade(q => q + 1);
  const diminuirQuantidade = () => setQuantidade(q => Math.max(1, q - 1));

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-start">
          <h1 className="text-3xl font-bold text-orange-800">{produto.nome}</h1>
          <Button variant="ghost" size="icon" onClick={compartilhar}>
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${i < Math.floor(produto.avaliacao) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
              />
            ))}
          </div>
          <span className="text-sm font-medium">{produto.avaliacao}</span>
          <span className="text-sm text-muted-foreground">({produto.numAvaliacoes} avaliações)</span>
          <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">{produto.categoria}</Badge>
        </div>
      </div>
      
      <div className="flex items-baseline gap-2">
        {produto.promocao ? (
          <>
            <span className="text-3xl font-bold text-orange-600">R$ {produto.preco.toFixed(2)}</span>
            <span className="text-lg text-muted-foreground line-through">R$ {produto.precoAntigo?.toFixed(2)}</span>
            <Badge className="ml-2 bg-red-500">-{Math.round(((produto.precoAntigo! - produto.preco) / produto.precoAntigo!) * 100)}%</Badge>
          </>
        ) : (
          <span className="text-3xl font-bold text-orange-600">R$ {produto.preco.toFixed(2)}</span>
        )}
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">Descrição</h3>
          <p className="text-muted-foreground">{produto.descricao}</p>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Versão</h3>
          <RadioGroup defaultValue={corSelecionada} onValueChange={setCorSelecionada} className="flex gap-2">
            {produto.cores.map(cor => (
              <div key={cor} className="flex items-center space-x-2">
                <RadioGroupItem value={cor} id={`cor-${cor}`} />
                <Label htmlFor={`cor-${cor}`}>{cor}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">Quantidade</h3>
          <div className="flex items-center">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={diminuirQuantidade}
              disabled={quantidade === 1}
              className="border-orange-300 text-orange-600"
            >
              -
            </Button>
            <span className="mx-4 w-8 text-center">{quantidade}</span>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={aumentarQuantidade}
              className="border-orange-300 text-orange-600"
            >
              +
            </Button>
          </div>
        </div>
      </div>
      
      <Separator />
      
      <div className="space-y-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <TruckIcon className="h-4 w-4 mr-2" />
          <span>Entrega estimada: {produto.tempoEntrega}</span>
        </div>
        
        <div className="space-y-2">
          <p className="text-sm flex">
            <strong className="mr-2">Marca:</strong> 
            <span>{produto.marca}</span>
          </p>
          <p className="text-sm flex">
            <strong className="mr-2">Idade Recomendada:</strong> 
            <span>{produto.idadeRecomendada}</span>
          </p>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          className="flex-1 bg-orange-500 hover:bg-orange-600"
          onClick={adicionarAoCarrinho}
          disabled={!produto.emEstoque}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Adicionar ao Carrinho
        </Button>
        <Button
          variant="outline"
          onClick={adicionarAosFavoritos}
          className="border-orange-300 text-orange-600 hover:bg-orange-50"
        >
          <Heart className="mr-2 h-4 w-4" />
          Adicionar aos Favoritos
        </Button>
      </div>
    </div>
  );
};

export default ProdutoInfo;
