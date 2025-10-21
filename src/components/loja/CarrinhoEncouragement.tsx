import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Truck, Shield, Heart, Zap, Award, Sparkles } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useProducts } from '@/hooks/useProducts';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { useSettings } from '@/contexts/SettingsContext';

const CarrinhoEncouragement = () => {
  const { state } = useCart();
  const { settings } = useSettings();

  // Mensagens de incentivo baseadas no valor do carrinho
  const getEncouragementMessage = () => {
    const freeShippingMin = settings.free_shipping_min || 200;
    const valorRestanteFrete = freeShippingMin - state.total;
    const valorRestante200 = 200 - state.total;
    
    if (state.total === 0) {
      return {
        title: "🎁 Comece sua jornada de descobertas!",
        message: "Explore nossa coleção de brinquedos únicos e encontre o presente perfeito!",
        icon: <Gift className="h-6 w-6" />,
        color: "bg-gradient-to-r from-purple-500 to-pink-500",
        actionText: "Ver Produtos",
        progress: 0
      };
    } else if (state.total < freeShippingMin * 0.3) {
      return {
        title: "🌟 Ótimo começo!",
        message: `Você já tem R$ ${state.total.toFixed(2)} no carrinho. Adicione mais R$ ${valorRestanteFrete.toFixed(2)} e ganhe frete grátis!`,
        icon: <Truck className="h-6 w-6" />,
        color: "bg-gradient-to-r from-blue-500 to-cyan-500",
        actionText: "Continuar Comprando",
        progress: (state.total / freeShippingMin) * 100
      };
    } else if (state.total < freeShippingMin) {
      return {
        title: "🚀 Quase lá!",
        message: `Faltam apenas R$ ${valorRestanteFrete.toFixed(2)} para ganhar frete grátis! Você está ${((state.total / freeShippingMin) * 100).toFixed(0)}% do caminho!`,
        icon: <Truck className="h-6 w-6" />,
        color: "bg-gradient-to-r from-indigo-500 to-blue-500",
        actionText: "Completar Frete Grátis",
        progress: (state.total / freeShippingMin) * 100
      };
    } else if (state.total < freeShippingMin * 1.5) {
      return {
        title: "🎉 Frete grátis conquistado!",
        message: `Parabéns! Agora você ganha ${settings.pix_discount_percent}% de desconto no PIX! Que tal adicionar mais alguns brinquedos?`,
        icon: <Zap className="h-6 w-6" />,
        color: "bg-gradient-to-r from-green-500 to-emerald-500",
        actionText: "Ganhar Mais Descontos",
        progress: 75 + ((state.total - freeShippingMin) / (freeShippingMin * 0.5)) * 25
      };
    } else {
      return {
        title: "🏆 Você é incrível!",
        message: `Você ganhou ${settings.pix_discount_percent}% de desconto no PIX e frete grátis! Continue aproveitando nossos brinquedos incríveis!`,
        icon: <Award className="h-6 w-6" />,
        color: "bg-gradient-to-r from-yellow-500 to-orange-500",
        actionText: "Continuar Comprando",
        progress: 100
      };
    }
  };

  const { products, loading } = useProducts();

  // Sugestões de produtos complementares dinâmicas
  const encouragement = getEncouragementMessage();
  const carrinhoIds = new Set(state.itens.map(i => i.produto.id));
  const categoriasCarrinho = new Set(state.itens.map(i => i.produto.categoria).filter(Boolean));
  const faixasEtariasCarrinho = new Set(state.itens.map(i => i.produto.faixaEtaria).filter(Boolean));
  
  // Algoritmo de sugestão mais inteligente
  const candidatos = products
    .filter(p => !carrinhoIds.has(p.id))
    .filter(p => p.status === 'ativo')
    .map(p => {
      let score = 0;
      
      // Pontuação por categoria (mais alta se for da mesma categoria)
      if (categoriasCarrinho.has(p.categoria)) score += 3;
      
      // Pontuação por faixa etária (mais alta se for da mesma faixa)
      if (faixasEtariasCarrinho.has(p.faixaEtaria)) score += 2;
      
      // Pontuação por preço (produtos em faixa similar)
      const precoMedioCarrinho = state.itens.length > 0 
        ? state.itens.reduce((sum, item) => sum + item.produto.preco, 0) / state.itens.length 
        : 0;
      const diferencaPreco = Math.abs(p.preco - precoMedioCarrinho);
      if (diferencaPreco < 50) score += 2;
      else if (diferencaPreco < 100) score += 1;
      
      // Pontuação por destaque/promoção
      if (p.destaque) score += 1;
      if (p.promocao) score += 1;
      
      // Pontuação por avaliação
      if (p.avaliacao >= 4) score += 1;
      
      return { ...p, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Mensagem de incentivo */}
      <Card className={`${encouragement.color} text-white border-0`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            {encouragement.icon}
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{encouragement.title}</h3>
              <p className="text-sm opacity-90 mb-3">{encouragement.message}</p>
              
              {/* Barra de progresso */}
              {encouragement.progress > 0 && (
                <div className="w-full bg-white/20 rounded-full h-2 mb-3">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(encouragement.progress, 100)}%` }}
                  />
                </div>
              )}
              
              {/* Botão de ação */}
              <Button 
                variant="secondary" 
                size="sm" 
                className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                onClick={() => window.location.href = '/loja'}
              >
                {encouragement.actionText}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selos de segurança e benefícios */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="h-6 w-6 text-green-600" />
              <span className="text-xs font-medium">Compra Segura</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Truck className="h-6 w-6 text-blue-600" />
              <span className="text-xs font-medium">Entrega Rápida</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="h-6 w-6 text-red-600" />
              <span className="text-xs font-medium">Garantia</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Star className="h-6 w-6 text-yellow-600" />
              <span className="text-xs font-medium">Qualidade</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sugestões complementares com base no carrinho */}
      {state.total > 0 && candidatos.length > 0 && (
        <Card className="border-dashed border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">Você também pode gostar</h4>
              </div>
              <Badge variant="secondary" className="text-xs">
                {candidatos.length} sugestão{candidatos.length > 1 ? 'ões' : ''}
              </Badge>
            </div>
            
            {/* Dica personalizada baseada no carrinho */}
            {categoriasCarrinho.size > 0 && (
              <div className="mb-3 p-2 bg-primary/10 rounded-md">
                <p className="text-xs text-primary font-medium">
                  💡 Baseado nos seus itens de {Array.from(categoriasCarrinho).join(', ')}, selecionamos produtos perfeitos para você!
                </p>
              </div>
            )}
            {loading ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Carregando sugestões...
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {candidatos.map((p) => (
                  <div key={p.id} className="rounded-md border bg-card hover:shadow-md transition-shadow">
                    <AspectRatio ratio={1.2}>
                      <img
                        src={p.imagemUrl || '/placeholder.svg'}
                        alt={p.nome}
                        className="object-cover w-full h-full rounded-t-md"
                        onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                      />
                    </AspectRatio>
                    <div className="p-2 space-y-2">
                      <div className="text-xs font-medium line-clamp-2">{p.nome}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-primary font-semibold">R$ {p.preco.toFixed(2)}</div>
                        {p.promocao && (
                          <Badge variant="destructive" className="text-[9px] px-1 py-0">OFF</Badge>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{p.categoria}</Badge>
                        {p.avaliacao > 0 && (
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <Star className="h-2 w-2 fill-yellow-400 text-yellow-400" />
                            {p.avaliacao.toFixed(1)}
                          </div>
                        )}
                      </div>
                      <AddSuggestionButton produto={p} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mensagem motivacional baseada na quantidade */}
      {state.quantidadeTotal > 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Heart className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                {state.quantidadeTotal === 1 
                  ? "Ótima escolha!"
                  : state.quantidadeTotal < 3
                  ? "Excelente seleção!"
                  : state.quantidadeTotal < 5
                  ? "Fantástico!"
                  : "Você é incrível!"
                }
              </span>
            </div>
            <p className="text-sm text-purple-700">
              {state.quantidadeTotal === 1 
                ? "🎯 Que tal adicionar mais um brinquedo para completar a diversão?"
                : state.quantidadeTotal < 3
                ? `🎊 Você tem ${state.quantidadeTotal} itens no carrinho. Está preparado para muita diversão!`
                : state.quantidadeTotal < 5
                ? `🌟 ${state.quantidadeTotal} brinquedos incríveis! As crianças vão adorar!`
                : `🏆 ${state.quantidadeTotal} itens! Você é um verdadeiro especialista em diversão!`
              }
            </p>
            {state.quantidadeTotal >= 3 && (
              <div className="mt-2 text-xs text-purple-600">
                💡 Dica: Compras maiores têm frete grátis e descontos especiais!
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CarrinhoEncouragement;

// Botão para adicionar sugestão ao carrinho
import { Produto } from '@/types/produto';
import { useCart as useCartContext } from '@/contexts/CartContext';
import { Plus, Loader2 } from 'lucide-react';

const AddSuggestionButton = ({ produto }: { produto: Produto }) => {
  const { addItem, state } = useCartContext();
  const [adding, setAdding] = React.useState(false);

  const handleAdd = async () => {
    setAdding(true);
    try {
      await addItem(produto, 1);
    } finally {
      setAdding(false);
    }
  };

  return (
    <Button 
      size="sm" 
      variant="outline" 
      className="text-[10px] h-6 px-2 hover:bg-primary hover:text-primary-foreground transition-colors" 
      onClick={handleAdd} 
      disabled={adding || state.isLoading}
    >
      {adding ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <>
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </>
      )}
    </Button>
  );
};
