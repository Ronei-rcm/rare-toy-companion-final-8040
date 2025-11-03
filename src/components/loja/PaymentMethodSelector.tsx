import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  QrCode, 
  Smartphone, 
  Wallet, 
  CheckCircle, 
  Loader2,
  Percent,
  Zap
} from 'lucide-react';
import { paymentService, PaymentMethod } from '@/services/paymentService';
import { useSettings } from '@/contexts/SettingsContext';
import { cn } from '@/lib/utils';

interface PaymentMethodSelectorProps {
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  amount: number;
  className?: string;
}

const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selectedMethod,
  onMethodChange,
  amount,
  className
}) => {
  const { settings } = useSettings();
  const [availableMethods, setAvailableMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    try {
      const methods = await paymentService.getAvailablePaymentMethods();
      setAvailableMethods(methods);
      
      // Auto-selecionar PIX se disponível
      if (methods.find(m => m.id === 'pix' && m.enabled)) {
        onMethodChange('pix');
      }
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method.type) {
      case 'pix':
        return <QrCode className="h-4 w-4" />;
      case 'apple_pay':
        return <Smartphone className="h-4 w-4" />;
      case 'google_pay':
        return <Wallet className="h-4 w-4" />;
      case 'credit_card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getMethodDescription = (method: PaymentMethod) => {
    switch (method.type) {
      case 'pix':
        return 'Aprovação instantânea';
      case 'apple_pay':
        return 'Touch ID / Face ID';
      case 'google_pay':
        return 'Pagamento rápido';
      case 'credit_card':
        return 'Visa, Mastercard, Elo';
      default:
        return 'Pagamento seguro';
    }
  };

  const calculateDiscount = (method: PaymentMethod) => {
    if (!method.discount) return 0;
    
    if (method.discount.type === 'percentage') {
      return (amount * method.discount.value) / 100;
    } else {
      return method.discount.value;
    }
  };

  const getDiscountedAmount = (method: PaymentMethod) => {
    const discount = calculateDiscount(method);
    return amount - discount;
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando métodos de pagamento...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Forma de Pagamento</h3>
            <Badge variant="secondary" className="text-xs">
              {availableMethods.filter(m => m.enabled).length} opções
            </Badge>
          </div>

          <RadioGroup value={selectedMethod} onValueChange={onMethodChange} className="space-y-3">
            {availableMethods.map((method) => {
              if (!method.enabled) return null;

              const discount = calculateDiscount(method);
              const discountedAmount = getDiscountedAmount(method);
              const hasDiscount = discount > 0;

              return (
                <div
                  key={method.id}
                  className={cn(
                    "flex items-center space-x-3 p-4 border rounded-lg transition-all duration-200",
                    "hover:bg-muted/50 cursor-pointer",
                    selectedMethod === method.id 
                      ? "border-primary bg-primary/5 ring-2 ring-primary/20" 
                      : "border-muted"
                  )}
                >
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-md">
                          {getMethodIcon(method)}
                        </div>
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {getMethodDescription(method)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        {hasDiscount ? (
                          <div className="space-y-1">
                            <div className="text-lg font-semibold text-green-600">
                              R$ {discountedAmount.toFixed(2)}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <Percent className="h-3 w-3" />
                              <span>{method.discount?.value}% OFF</span>
                            </div>
                            <div className="text-xs text-muted-foreground line-through">
                              R$ {amount.toFixed(2)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-lg font-semibold">
                            R$ {amount.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>

          {/* Informações adicionais sobre pagamentos */}
          <div className="mt-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>PIX: Aprovação instantânea + {settings.pix_discount_percent}% de desconto</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Apple Pay / Google Pay: Pagamento seguro e rápido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Cartão: Parcelamento em até 12x sem juros</span>
              </div>
            </div>
          </div>

          {/* Método recomendado */}
          {selectedMethod === 'pix' && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Zap className="h-4 w-4 text-green-600" />
              <div className="text-sm">
                <span className="font-medium text-green-800">Método recomendado!</span>
                <p className="text-green-700">Mais rápido, seguro e com desconto.</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentMethodSelector;
