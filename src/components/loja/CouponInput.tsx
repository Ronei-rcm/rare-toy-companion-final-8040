import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Gift, 
  Check, 
  X, 
  Percent, 
  DollarSign, 
  Truck,
  Copy,
  Star
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface CouponData {
  code: string;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  discountAmount: number;
  finalAmount: number;
}

interface CouponInputProps {
  onCouponApplied?: (coupon: CouponData) => void;
  onCouponRemoved?: () => void;
}

const CouponInput: React.FC<CouponInputProps> = ({ onCouponApplied, onCouponRemoved }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { state } = useCart();

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Digite um código de cupom');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/coupons/code/${couponCode}?orderAmount=${state.total}`, {
        method: 'GET'
      });
      
      const data = await response.json();
      
      if (data.success) {
        const coupon: CouponData = {
          code: data.data.coupon.code,
          name: data.data.coupon.name,
          type: data.data.coupon.type,
          value: data.data.coupon.value,
          discountAmount: data.data.discountAmount,
          finalAmount: data.data.finalAmount
        };
        
        setAppliedCoupon(coupon);
        onCouponApplied?.(coupon);
        setCouponCode('');
      } else {
        setError(data.error || 'Cupom inválido');
      }
    } catch (error) {
      console.error('Erro ao aplicar cupom:', error);
      setError('Erro ao validar cupom');
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    onCouponRemoved?.();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed_amount':
        return <DollarSign className="w-4 h-4" />;
      case 'free_shipping':
        return <Truck className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Percentual';
      case 'fixed_amount':
        return 'Valor Fixo';
      case 'free_shipping':
        return 'Frete Grátis';
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {!appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
              className="flex-1"
            />
            <Button 
              onClick={applyCoupon} 
              disabled={loading || !couponCode.trim()}
              className="px-6"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Aplicar
                </>
              )}
            </Button>
          </div>
          
          {error && (
            <div className="text-red-600 text-sm flex items-center">
              <X className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                {getTypeIcon(appliedCoupon.type)}
                <span className="font-semibold text-green-800">{appliedCoupon.name}</span>
              </div>
              <Badge variant="outline" className="text-green-700 border-green-300">
                {getTypeLabel(appliedCoupon.type)}
              </Badge>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={removeCoupon}
              className="text-green-700 hover:text-green-800"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="mt-2 text-sm text-green-700">
            <div className="flex items-center justify-between">
              <span>Desconto aplicado:</span>
              <span className="font-semibold">
                {appliedCoupon.type === 'percentage' 
                  ? `${appliedCoupon.value}%` 
                  : appliedCoupon.type === 'free_shipping'
                  ? 'Frete Grátis'
                  : formatCurrency(appliedCoupon.value)
                }
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Valor do desconto:</span>
              <span className="font-semibold text-green-800">
                {formatCurrency(appliedCoupon.discountAmount)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-green-200 pt-2 mt-2">
              <span className="font-medium">Total com desconto:</span>
              <span className="font-bold text-green-800">
                {formatCurrency(appliedCoupon.finalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cupons Sugeridos */}
      {!appliedCoupon && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Cupons disponíveis:</p>
          <div className="flex flex-wrap gap-2">
            {[
              { code: 'BEMVINDO10', name: '10% de desconto' },
              { code: 'FRETE15', name: 'Frete grátis' },
              { code: 'R$20OFF', name: 'R$ 20 de desconto' }
            ].map((coupon) => (
              <Button
                key={coupon.code}
                variant="outline"
                size="sm"
                onClick={() => {
                  setCouponCode(coupon.code);
                  applyCoupon();
                }}
                className="text-xs"
              >
                <Copy className="w-3 h-3 mr-1" />
                {coupon.code}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Programa de Fidelidade */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Star className="w-5 h-5 text-blue-600" />
          <span className="font-semibold text-blue-800">Programa de Fidelidade</span>
        </div>
        <p className="text-sm text-blue-700 mb-2">
          Ganhe pontos a cada compra e resgate descontos exclusivos!
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs text-blue-600">
          <div>• 1 ponto por R$ 1 gasto</div>
          <div>• 100 pontos = R$ 10 desconto</div>
          <div>• Frete grátis a partir de Ouro</div>
          <div>• Descontos exclusivos VIP</div>
        </div>
      </div>
    </div>
  );
};

export default CouponInput;
