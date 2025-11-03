import React from 'react';
import { Truck, Gift, Zap, TrendingUp, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

interface CartIncentiveMessagesProps {
  cartTotal: number;
  freeShippingMin?: number;
  pixDiscountPercent?: number;
}

const CartIncentiveMessages: React.FC<CartIncentiveMessagesProps> = ({
  cartTotal,
  freeShippingMin = 200,
  pixDiscountPercent = 5,
}) => {
  const remainingForFreeShipping = Math.max(0, freeShippingMin - cartTotal);
  const hasFreeShipping = remainingForFreeShipping === 0;
  const pixDiscount = cartTotal * (pixDiscountPercent / 100);

  return (
    <div className="space-y-2">
      {/* Mensagem de frete grátis */}
      {!hasFreeShipping && remainingForFreeShipping > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200"
        >
          <Truck className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-amber-900">
              Falta apenas <span className="font-bold">R$ {remainingForFreeShipping.toFixed(2)}</span> para ganhar frete grátis! 🚚
            </p>
            <div className="w-full bg-amber-200 rounded-full h-1.5 mt-2">
              <div
                className="bg-amber-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((cartTotal / freeShippingMin) * 100, 100)}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      {/* Frete grátis conquistado! */}
      {hasFreeShipping && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200"
        >
          <Gift className="w-5 h-5 text-green-600 flex-shrink-0 animate-bounce" />
          <p className="text-sm font-medium text-green-900">
            🎉 Parabéns! Você ganhou <span className="font-bold">frete grátis</span>!
          </p>
        </motion.div>
      )}

      {/* Desconto PIX */}
      {cartTotal > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200"
        >
          <Zap className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm font-medium text-blue-900">
            Pague com <span className="font-bold">PIX</span> e economize{' '}
            <span className="font-bold text-blue-700">R$ {pixDiscount.toFixed(2)}</span> ({pixDiscountPercent}% OFF)
          </p>
        </motion.div>
      )}

      {/* Incentivo extra para compras grandes */}
      {cartTotal >= freeShippingMin && cartTotal < 500 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200"
        >
          <TrendingUp className="w-5 h-5 text-purple-600 flex-shrink-0" />
          <p className="text-sm font-medium text-purple-900">
            Adicione mais R$ {(500 - cartTotal).toFixed(2)} e ganhe{' '}
            <span className="font-bold">cupom de 10% OFF</span> na próxima compra!
          </p>
        </motion.div>
      )}

      {/* Super compra! */}
      {cartTotal >= 500 && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-300"
        >
          <Percent className="w-5 h-5 text-yellow-600 flex-shrink-0 animate-pulse" />
          <p className="text-sm font-medium text-yellow-900">
            🏆 <span className="font-bold">Você é VIP!</span> Ganhe cupom de 10% OFF na próxima compra!
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default CartIncentiveMessages;
