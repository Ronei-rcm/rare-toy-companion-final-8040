import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, X, RotateCcw } from 'lucide-react';
import { useCartRecovery } from '@/hooks/useCartRecovery';

const CartRecoveryBanner: React.FC = () => {
  const { hasAbandonedCart, itemCount, totalValue, recoverCart, clearRecoveryData } = useCartRecovery();
  const [dismissed, setDismissed] = React.useState(false);

  const handleRecover = async () => {
    const success = await recoverCart();
    if (success) {
      setDismissed(true);
      window.location.href = '/carrinho'; // Redirecionar para o carrinho
    }
  };

  const handleDismiss = () => {
    clearRecoveryData();
    setDismissed(true);
  };

  if (!hasAbandonedCart || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4"
      >
        <Card className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-300 shadow-2xl">
          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Ícone */}
              <div className="flex-shrink-0">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-white animate-bounce" />
                </div>
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-lg text-blue-900 mb-1">
                  🎁 Você esqueceu algo!
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Você tem <span className="font-bold">{itemCount} {itemCount === 1 ? 'item' : 'itens'}</span> no
                  carrinho no valor de <span className="font-bold">R$ {totalValue.toFixed(2)}</span>.
                  Que tal finalizar sua compra?
                </p>

                {/* Botões */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleRecover}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                    size="sm"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Recuperar Carrinho
                  </Button>
                  <Button
                    onClick={handleDismiss}
                    variant="outline"
                    size="sm"
                  >
                    Dispensar
                  </Button>
                </div>
              </div>

              {/* Botão fechar */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 text-blue-600 hover:text-blue-800 transition-colors"
                aria-label="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default CartRecoveryBanner;
