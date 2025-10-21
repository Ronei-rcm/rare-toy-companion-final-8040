import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, X, Minus, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';
import { cn } from '@/lib/utils';

interface MobileOptimizedCartProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Versão otimizada do carrinho para mobile com gestos e animações suaves
 */
const MobileOptimizedCart: React.FC<MobileOptimizedCartProps> = ({ isOpen, onClose }) => {
  const { state, removeItem, updateQuantity } = useCart();
  const [dragY, setDragY] = React.useState(0);

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 100) {
      onClose();
    }
    setDragY(0);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] md:hidden"
        />
      )}

      {/* Drawer */}
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        onDrag={(_, info) => setDragY(info.offset.y)}
        initial={{ y: '100%' }}
        animate={{ y: isOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-background rounded-t-3xl shadow-2xl z-[100]',
          'max-h-[85vh] flex flex-col md:hidden'
        )}
        style={{
          transform: `translateY(${dragY}px)`,
        }}
      >
        {/* Handle de arrastar */}
        <div className="flex justify-center py-3 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-3 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">
              Carrinho ({state.quantidadeTotal})
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {state.itens.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          ) : (
            <div className="space-y-3">
              {state.itens.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {/* Imagem */}
                  <div className="w-20 h-20 flex-shrink-0">
                    <OptimizedProductImage
                      produto={item.produto}
                      alt={item.produto.nome}
                      className="rounded-md"
                      aspectRatio={1}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate">{item.produto.nome}</h3>
                    <p className="text-sm text-muted-foreground">
                      R$ {item.produto.preco.toFixed(2)}
                    </p>

                    {/* Controles */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center gap-1 bg-background rounded-md border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantidade - 1)}
                          disabled={item.quantidade <= 1}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">
                          {item.quantidade}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantidade + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Preço total */}
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {state.itens.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-muted/20">
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg">Total:</span>
              <span className="font-bold text-2xl text-primary">
                R$ {state.total.toFixed(2)}
              </span>
            </div>
            <Button className="w-full h-12 text-base font-semibold" size="lg">
              Finalizar Compra
            </Button>
          </div>
        )}
      </motion.div>
    </>
  );
};

export default MobileOptimizedCart;

