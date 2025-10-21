import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Zap, CreditCard, Percent } from 'lucide-react';

interface CartPriceComparisonProps {
  subtotal: number;
  pixDiscountPercent?: number;
  freeShippingMin?: number;
  shippingPrice?: number;
}

const CartPriceComparison: React.FC<CartPriceComparisonProps> = ({
  subtotal,
  pixDiscountPercent = 5,
  freeShippingMin = 200,
  shippingPrice = 15,
}) => {
  const hasFreeShipping = subtotal >= freeShippingMin;
  const shipping = hasFreeShipping ? 0 : shippingPrice;

  // Cálculos para diferentes métodos de pagamento
  const pixDiscount = subtotal * (pixDiscountPercent / 100);
  const pixTotal = subtotal - pixDiscount + shipping;

  const creditCardTotal = subtotal + shipping;
  const creditCard3x = creditCardTotal / 3;
  const creditCard6x = creditCardTotal / 6;
  const creditCard12x = creditCardTotal / 12;

  const savings = creditCardTotal - pixTotal;

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Comparação de Pagamentos</h3>
        </div>

        {/* PIX - Melhor opção */}
        <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 relative overflow-hidden">
          <Badge className="absolute top-2 right-2 bg-green-600">
            Melhor Escolha
          </Badge>
          
          <div className="flex items-center gap-3 mb-2">
            <Zap className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">PIX</p>
              <p className="text-xs text-green-700">Pagamento instantâneo</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-700">
                R$ {pixTotal.toFixed(2)}
              </span>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                -{pixDiscountPercent}% OFF
              </Badge>
            </div>
            <p className="text-xs text-green-700 mt-1">
              Economize R$ {savings.toFixed(2)} com PIX
            </p>
          </div>
        </div>

        {/* Cartão de Crédito */}
        <div className="p-4 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-3 mb-3">
            <CreditCard className="w-6 h-6 text-muted-foreground" />
            <div>
              <p className="font-semibold">Cartão de Crédito</p>
              <p className="text-xs text-muted-foreground">Até 12x sem juros</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">À vista:</span>
              <span className="font-semibold">R$ {creditCardTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">3x sem juros:</span>
              <span className="font-semibold">3x R$ {creditCard3x.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">6x sem juros:</span>
              <span className="font-semibold">6x R$ {creditCard6x.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm border-t pt-2">
              <span className="text-muted-foreground">12x sem juros:</span>
              <span className="font-semibold text-primary">
                12x R$ {creditCard12x.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Resumo de economia */}
        <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center gap-2">
          <Percent className="w-5 h-5 text-amber-600" />
          <p className="text-sm font-medium text-amber-900">
            Pagando com <strong>PIX</strong>, você economiza{' '}
            <strong>R$ {savings.toFixed(2)}</strong>!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartPriceComparison;
