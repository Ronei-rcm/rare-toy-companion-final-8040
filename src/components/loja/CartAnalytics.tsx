import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Package, Clock } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

/**
 * Analytics do Carrinho - Insights para o usuário
 */
const CartAnalytics: React.FC = () => {
  const { state } = useCart();
  const [insights, setInsights] = useState({
    avgItemPrice: 0,
    totalItems: 0,
    mostExpensiveItem: null as any,
    potentialSavings: 0,
    estimatedDeliveryDays: 0,
  });

  useEffect(() => {
    if (state.itens.length === 0) return;

    // Calcular analytics
    const totalItems = state.quantidadeTotal;
    const avgPrice = state.total / totalItems;
    
    const mostExpensive = state.itens.reduce((max, item) => {
      const itemTotal = item.produto.preco * item.quantidade;
      const maxTotal = max ? max.produto.preco * max.quantidade : 0;
      return itemTotal > maxTotal ? item : max;
    }, state.itens[0]);

    // Economia potencial com PIX (5%)
    const pixSavings = state.total * 0.05;

    // Estimativa de entrega baseada no total
    const deliveryDays = state.total > 200 ? 3 : 5;

    setInsights({
      avgItemPrice: avgPrice,
      totalItems,
      mostExpensiveItem: mostExpensive,
      potentialSavings: pixSavings,
      estimatedDeliveryDays: deliveryDays,
    });
  }, [state.itens, state.total, state.quantidadeTotal]);

  if (state.itens.length === 0) return null;

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Insights do Seu Carrinho
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Preço médio */}
          <div className="bg-white/60 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Preço Médio</span>
            </div>
            <p className="text-lg font-bold text-green-700">
              R$ {insights.avgItemPrice.toFixed(2)}
            </p>
          </div>

          {/* Total de itens */}
          <div className="bg-white/60 p-3 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Produtos</span>
            </div>
            <p className="text-lg font-bold text-blue-700">
              {insights.totalItems} {insights.totalItems === 1 ? 'item' : 'itens'}
            </p>
          </div>
        </div>

        {/* Economia com PIX */}
        {insights.potentialSavings > 0 && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 p-3 rounded-lg border border-yellow-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-yellow-900 mb-1">💰 Economize com PIX</p>
                <p className="text-lg font-bold text-yellow-800">
                  R$ {insights.potentialSavings.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs bg-yellow-200 px-2 py-1 rounded-full font-medium text-yellow-900">
                  5% OFF
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Entrega estimada */}
        <div className="bg-white/60 p-3 rounded-lg border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-600" />
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Entrega Estimada</p>
              <p className="text-sm font-semibold text-purple-700">
                {insights.estimatedDeliveryDays} - {insights.estimatedDeliveryDays + 2} dias úteis
              </p>
            </div>
          </div>
        </div>

        {/* Item mais caro */}
        {insights.mostExpensiveItem && (
          <div className="text-xs text-muted-foreground">
            <p>
              🌟 Item destaque: <strong>{insights.mostExpensiveItem.produto.nome}</strong>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CartAnalytics;
