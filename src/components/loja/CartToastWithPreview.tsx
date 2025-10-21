import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProductImage } from '@/utils/imageUtils';

export interface CartToastWithPreviewProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  onClose: () => void;
  duration?: number;
}

const CartToastWithPreview: React.FC<CartToastWithPreviewProps> = ({
  id,
  type,
  title,
  description,
  productName,
  productImage,
  quantity,
  onClose,
}) => {
  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-900',
    error: 'bg-red-50 border-red-200 text-red-900',
    warning: 'bg-amber-50 border-amber-200 text-amber-900',
    info: 'bg-blue-50 border-blue-200 text-blue-900',
  };

  const iconColors = {
    success: 'text-green-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
    info: 'text-blue-600',
  };

  const Icon = icons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={`flex items-center gap-3 p-4 rounded-lg border shadow-lg max-w-md ${colors[type]}`}
    >
      {/* Imagem do produto (se disponível) */}
      {productImage && (
        <div className="flex-shrink-0">
          <img
            src={productImage}
            alt={productName || ''}
            className="w-12 h-12 object-cover rounded-md border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/placeholder.svg';
            }}
          />
        </div>
      )}

      {/* Ícone (se não houver imagem) */}
      {!productImage && (
        <div className="flex-shrink-0">
          <Icon className={`w-6 h-6 ${iconColors[type]}`} />
        </div>
      )}

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="font-semibold text-sm">{title}</p>
            {description && (
              <p className="text-xs opacity-90 mt-0.5">{description}</p>
            )}
            {quantity && quantity > 1 && (
              <p className="text-xs opacity-75 mt-1">
                Quantidade: {quantity}
              </p>
            )}
          </div>
          
          {/* Botão fechar */}
          <button
            onClick={onClose}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Fechar notificação"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CartToastWithPreview;
