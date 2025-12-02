import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Tag, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Percent,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minPurchase?: number;
  description?: string;
}

interface CartCouponCodeProps {
  onCouponApplied?: (coupon: Coupon) => void;
  onCouponRemoved?: () => void;
}

// Cupons disponíveis (em produção, viriam da API)
const AVAILABLE_COUPONS: Coupon[] = [
  {
    code: 'BEMVINDO10',
    type: 'percentage',
    value: 10,
    minPurchase: 50,
    description: '10% de desconto na primeira compra'
  },
  {
    code: 'FRETE20',
    type: 'fixed',
    value: 20,
    minPurchase: 100,
    description: 'R$ 20 de desconto em compras acima de R$ 100'
  },
  {
    code: 'PIX5',
    type: 'percentage',
    value: 5,
    description: '5% de desconto no PIX'
  }
];

export default function CartCouponCode({ onCouponApplied, onCouponRemoved }: CartCouponCodeProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCoupon = async (couponCode: string): Promise<Coupon | null> => {
    // Simular validação (em produção, seria uma chamada à API)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const coupon = AVAILABLE_COUPONS.find(
      c => c.code.toUpperCase() === couponCode.toUpperCase()
    );
    
    return coupon || null;
  };

  const handleApplyCoupon = async () => {
    if (!code.trim()) {
      setError('Digite um código de cupom');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const coupon = await validateCoupon(code);
      
      if (!coupon) {
        setError('Cupom inválido ou expirado');
        toast({
          title: 'Cupom inválido',
          description: 'O código do cupom não foi encontrado',
          variant: 'destructive'
        });
        return;
      }

      setAppliedCoupon(coupon);
      setCode('');
      
      toast({
        title: 'Cupom aplicado! 🎉',
        description: coupon.description || `Desconto de ${coupon.value}${coupon.type === 'percentage' ? '%' : ' reais'} aplicado`
      });

      if (onCouponApplied) {
        onCouponApplied(coupon);
      }
    } catch (error) {
      setError('Erro ao validar cupom');
      toast({
        title: 'Erro',
        description: 'Não foi possível validar o cupom',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setError(null);
    
    toast({
      title: 'Cupom removido',
      description: 'O cupom foi removido do seu pedido'
    });

    if (onCouponRemoved) {
      onCouponRemoved();
    }
  };

  const calculateDiscount = (subtotal: number): number => {
    if (!appliedCoupon) return 0;
    
    if (appliedCoupon.type === 'percentage') {
      return (subtotal * appliedCoupon.value) / 100;
    } else {
      return appliedCoupon.value;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-orange-600" />
          Cupom de Desconto
        </CardTitle>
        <CardDescription>
          Digite seu código de cupom para obter descontos exclusivos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AnimatePresence mode="wait">
          {!appliedCoupon ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="flex gap-2">
                <Input
                  placeholder="Digite o código do cupom"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyCoupon();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={isLoading || !code.trim()}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {isLoading ? 'Aplicando...' : 'Aplicar'}
                </Button>
              </div>
              
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded"
                >
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </motion.div>
              )}

              <div className="text-xs text-gray-500 space-y-1">
                <p className="font-medium">Cupons disponíveis:</p>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_COUPONS.map((coupon) => (
                    <Badge
                      key={coupon.code}
                      variant="outline"
                      className="cursor-pointer hover:bg-orange-50"
                      onClick={() => setCode(coupon.code)}
                    >
                      {coupon.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="applied"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-3"
            >
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-900">
                      Cupom {appliedCoupon.code} aplicado
                    </p>
                    <p className="text-sm text-green-700">
                      {appliedCoupon.description || 
                        `Desconto de ${appliedCoupon.value}${appliedCoupon.type === 'percentage' ? '%' : ' reais'}`
                      }
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

// Hook para usar o cupom aplicado
export function useAppliedCoupon() {
  const [coupon, setCoupon] = useState<Coupon | null>(null);

  const applyCoupon = (newCoupon: Coupon) => {
    setCoupon(newCoupon);
  };

  const removeCoupon = () => {
    setCoupon(null);
  };

  const calculateDiscount = (subtotal: number): number => {
    if (!coupon) return 0;
    
    if (coupon.type === 'percentage') {
      return (subtotal * coupon.value) / 100;
    } else {
      return coupon.value;
    }
  };

  return {
    coupon,
    applyCoupon,
    removeCoupon,
    calculateDiscount
  };
}

