import React from 'react';
import { CheckCircle, XCircle, ShoppingBag, Plus, Minus, Trash2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CartToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  action?: 'add' | 'remove' | 'update' | 'clear';
  productName?: string;
  productImage?: string;
  quantity?: number;
  duration?: number;
}

interface CartToastProps {
  toast: CartToastData;
  onClose: (id: string) => void;
  className?: string;
}

const CartToast: React.FC<CartToastProps> = ({ toast, onClose, className }) => {
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <ShoppingBag className="h-5 w-5 text-blue-500" />;
    }
  };

  const getActionIcon = () => {
    switch (toast.action) {
      case 'add':
        return <Plus className="h-3 w-3" />;
      case 'remove':
        return <Trash2 className="h-3 w-3" />;
      case 'update':
        return <Minus className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextColor = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-sm w-full",
        "animate-in slide-in-from-right-full duration-300",
        getBgColor(),
        className
      )}
    >
      {/* Imagem do produto (se disponível) */}
      {toast.productImage ? (
        <div className="flex-shrink-0">
          <img
            src={toast.productImage}
            alt={toast.productName || ''}
            className="w-12 h-12 object-cover rounded-md border"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
      ) : (
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
      )}
      
      <div className="flex-1 min-w-0">
        <div className={cn("font-medium text-sm", getTextColor())}>
          {toast.title}
        </div>
        
        {toast.description && (
          <div className={cn("text-sm mt-1", getTextColor())}>
            {toast.description}
          </div>
        )}
        
        {toast.productName && toast.action && (
          <div className={cn("flex items-center gap-1 mt-2 text-xs", getTextColor())}>
            {getActionIcon()}
            <span>
              {toast.action === 'add' && `Adicionado: ${toast.productName}`}
              {toast.action === 'remove' && `Removido: ${toast.productName}`}
              {toast.action === 'update' && `Atualizado: ${toast.productName} (${toast.quantity})`}
            </span>
          </div>
        )}
      </div>
      
      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          "flex-shrink-0 p-1 rounded-full hover:bg-black/10 transition-colors",
          getTextColor()
        )}
        aria-label="Fechar notificação"
      >
        <XCircle className="h-4 w-4" />
      </button>
    </div>
  );
};

export default CartToast;
