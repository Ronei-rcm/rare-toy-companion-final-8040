import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X, ShoppingCart, Plus, Minus, Trash } from 'lucide-react';
import { cn } from '@/lib/utils';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';

export interface ImprovedToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: 'add' | 'remove' | 'update' | 'clear';
  productName?: string;
  productImage?: string;
  quantity?: number;
  duration?: number;
  produto?: any; // Produto completo para exibição de imagem
}

interface ImprovedCartToastProps {
  toast: ImprovedToastData;
  onClose: (id: string) => void;
  className?: string;
}

const ImprovedCartToast: React.FC<ImprovedCartToastProps> = ({ toast, onClose, className }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!toast.duration) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
    }, 16);

    return () => clearInterval(interval);
  }, [toast.duration]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getActionIcon = () => {
    switch (toast.action) {
      case 'add':
        return <Plus className="w-3 h-3" />;
      case 'remove':
        return <Trash className="w-3 h-3" />;
      case 'update':
        return <Minus className="w-3 h-3" />;
      case 'clear':
        return <ShoppingCart className="w-3 h-3" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
      case 'error':
        return 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200';
      case 'warning':
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      case 'info':
      default:
        return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-900';
      case 'error':
        return 'text-red-900';
      case 'warning':
        return 'text-amber-900';
      case 'info':
      default:
        return 'text-blue-900';
    }
  };

  const getProgressColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'warning':
        return 'bg-amber-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={cn(
        'relative flex items-start gap-3 p-4 rounded-lg border-2 shadow-xl max-w-md w-full overflow-hidden',
        getBgColor(),
        className
      )}
    >
      {/* Barra de progresso */}
      {toast.duration && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
          <motion.div
            className={cn('h-full', getProgressColor())}
            initial={{ width: '100%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'linear' }}
          />
        </div>
      )}

      {/* Imagem do produto (se disponível) */}
      {toast.produto ? (
        <div className="flex-shrink-0">
          <div className="w-14 h-14 rounded-md overflow-hidden border-2 border-white shadow-md">
            <OptimizedProductImage
              produto={toast.produto}
              alt={toast.productName || ''}
              aspectRatio={1}
              showSkeleton={false}
            />
          </div>
        </div>
      ) : toast.productImage ? (
        <div className="flex-shrink-0">
          <img
            src={toast.productImage}
            alt={toast.productName || ''}
            className="w-14 h-14 object-cover rounded-md border-2 border-white shadow-md"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="flex-shrink-0 p-2 rounded-full bg-white shadow-sm">
          {getIcon()}
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className={cn('font-semibold text-sm leading-tight', getTextColor())}>
          {toast.title}
        </div>

        {toast.description && (
          <div className={cn('text-sm mt-1 leading-tight', getTextColor())}>
            {toast.description}
          </div>
        )}

        {toast.productName && toast.action && (
          <div className={cn('flex items-center gap-1.5 mt-2 text-xs font-medium', getTextColor())}>
            <div className="p-1 rounded-full bg-white/60">
              {getActionIcon()}
            </div>
            <span>
              {toast.action === 'add' && `Adicionado: ${toast.productName}`}
              {toast.action === 'remove' && `Removido: ${toast.productName}`}
              {toast.action === 'update' && `Atualizado: ${toast.productName}`}
              {toast.action === 'clear' && 'Carrinho limpo'}
            </span>
            {toast.quantity && toast.action === 'add' && (
              <span className="ml-auto px-2 py-0.5 rounded-full bg-white/80 font-bold">
                {toast.quantity}x
              </span>
            )}
          </div>
        )}
      </div>

      {/* Botão fechar */}
      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          'flex-shrink-0 p-1 rounded-full hover:bg-white/50 transition-colors',
          getTextColor()
        )}
        aria-label="Fechar notificação"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default ImprovedCartToast;

