import React, { useMemo } from 'react';
import { Truck, Gift, Zap, TrendingUp, Percent, Heart, Trophy, Star, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';

interface EnhancedCartIncentivesProps {
  cartTotal: number;
  itemCount: number;
  freeShippingMin?: number;
  pixDiscountPercent?: number;
}

interface IncentiveMessage {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  variant: 'success' | 'warning' | 'info' | 'premium';
  progress?: number;
  showProgressBar?: boolean;
  animate?: boolean;
}

const EnhancedCartIncentives: React.FC<EnhancedCartIncentivesProps> = ({
  cartTotal,
  itemCount,
  freeShippingMin = 200,
  pixDiscountPercent = 5,
}) => {
  const messages = useMemo<IncentiveMessage[]>(() => {
    const msgs: IncentiveMessage[] = [];
    
    const remainingForFreeShipping = Math.max(0, freeShippingMin - cartTotal);
    const hasFreeShipping = remainingForFreeShipping === 0;
    const pixDiscount = cartTotal * (pixDiscountPercent / 100);
    const shippingProgress = Math.min((cartTotal / freeShippingMin) * 100, 100);

    // 1. Frete grátis - em progresso
    if (!hasFreeShipping && remainingForFreeShipping > 0 && cartTotal > 0) {
      msgs.push({
        id: 'free-shipping-progress',
        icon: <Truck className="w-5 h-5" />,
        title: `Falta apenas R$ ${remainingForFreeShipping.toFixed(2)} para frete grátis!`,
        description: 'Adicione mais produtos e ganhe entrega sem custo.',
        variant: 'warning',
        progress: shippingProgress,
        showProgressBar: true,
      });
    }

    // 2. Frete grátis - conquistado
    if (hasFreeShipping) {
      msgs.push({
        id: 'free-shipping-achieved',
        icon: <Gift className="w-5 h-5" />,
        title: '🎉 Parabéns! Frete grátis garantido!',
        description: 'Você economizou no frete. Continue comprando!',
        variant: 'success',
        animate: true,
      });
    }

    // 3. Desconto PIX
    if (cartTotal > 0) {
      msgs.push({
        id: 'pix-discount',
        icon: <Zap className="w-5 h-5" />,
        title: `Economize R$ ${pixDiscount.toFixed(2)} pagando com PIX`,
        description: `${pixDiscountPercent}% de desconto instantâneo no pagamento.`,
        variant: 'info',
      });
    }

    // 4. Cupom de boas-vindas
    if (cartTotal >= 100 && cartTotal < 200) {
      msgs.push({
        id: 'welcome-bonus',
        icon: <Star className="w-5 h-5" />,
        title: 'Ganhe R$ 20 de desconto na próxima!',
        description: 'Finalize esta compra e receba cupom exclusivo.',
        variant: 'info',
      });
    }

    // 5. Meta para cupom premium
    if (cartTotal >= freeShippingMin && cartTotal < 500) {
      const remaining = 500 - cartTotal;
      msgs.push({
        id: 'premium-goal',
        icon: <Target className="w-5 h-5" />,
        title: `Adicione R$ ${remaining.toFixed(2)} e ganhe 10% OFF`,
        description: 'Cupom de 10% OFF na próxima compra. Válido por 30 dias!',
        variant: 'premium',
        progress: (cartTotal / 500) * 100,
        showProgressBar: true,
      });
    }

    // 6. Cliente VIP
    if (cartTotal >= 500) {
      msgs.push({
        id: 'vip-status',
        icon: <Trophy className="w-5 h-5" />,
        title: '🏆 Você é VIP! Benefícios exclusivos',
        description: 'Cupom de 10% OFF + Prioridade no atendimento + Brindes especiais',
        variant: 'premium',
        animate: true,
      });
    }

    // 7. Comprando em quantidade
    if (itemCount >= 3 && itemCount < 5) {
      msgs.push({
        id: 'bundle-discount',
        icon: <Heart className="w-5 h-5" />,
        title: 'Combo inteligente!',
        description: 'Adicione mais 2 itens e ganhe 5% OFF extra no total.',
        variant: 'info',
      });
    }

    // 8. Combo master
    if (itemCount >= 5) {
      msgs.push({
        id: 'bundle-master',
        icon: <TrendingUp className="w-5 h-5" />,
        title: '🎊 Combo Master Ativado!',
        description: '5% de desconto adicional aplicado ao seu pedido.',
        variant: 'success',
        animate: true,
      });
    }

    return msgs;
  }, [cartTotal, itemCount, freeShippingMin, pixDiscountPercent]);

  const getVariantStyles = (variant: IncentiveMessage['variant']) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-gradient-to-r from-green-50 to-emerald-50',
          border: 'border-green-200',
          text: 'text-green-900',
          icon: 'text-green-600',
          progressBg: 'bg-green-200',
          progressFill: 'bg-green-600',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
          border: 'border-amber-200',
          text: 'text-amber-900',
          icon: 'text-amber-600',
          progressBg: 'bg-amber-200',
          progressFill: 'bg-amber-600',
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          text: 'text-blue-900',
          icon: 'text-blue-600',
          progressBg: 'bg-blue-200',
          progressFill: 'bg-blue-600',
        };
      case 'premium':
        return {
          bg: 'bg-gradient-to-r from-purple-50 via-pink-50 to-purple-50',
          border: 'border-purple-300',
          text: 'text-purple-900',
          icon: 'text-purple-600',
          progressBg: 'bg-purple-200',
          progressFill: 'bg-gradient-to-r from-purple-600 to-pink-600',
        };
      default:
        return {
          bg: 'bg-muted/50',
          border: 'border-muted',
          text: 'text-foreground',
          icon: 'text-muted-foreground',
          progressBg: 'bg-muted',
          progressFill: 'bg-primary',
        };
    }
  };

  if (messages.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence mode="popLayout">
        {messages.map((msg, index) => {
          const styles = getVariantStyles(msg.variant);
          
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                scale: msg.animate ? [1, 1.02, 1] : 1,
              }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ 
                delay: index * 0.05,
                scale: { 
                  repeat: msg.animate ? Infinity : 0, 
                  duration: 2,
                  ease: "easeInOut" 
                }
              }}
            >
              <Card 
                className={`flex items-start gap-3 p-3 border ${styles.bg} ${styles.border}`}
              >
                <div className={`flex-shrink-0 ${styles.icon} ${msg.animate ? 'animate-bounce' : ''}`}>
                  {msg.icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${styles.text}`}>
                    {msg.title}
                  </p>
                  <p className={`text-xs mt-0.5 ${styles.text} opacity-80`}>
                    {msg.description}
                  </p>
                  
                  {/* Barra de progresso */}
                  {msg.showProgressBar && msg.progress !== undefined && (
                    <div className={`w-full ${styles.progressBg} rounded-full h-1.5 mt-2 overflow-hidden`}>
                      <motion.div
                        className={`${styles.progressFill} h-1.5 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${msg.progress}%` }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedCartIncentives;

