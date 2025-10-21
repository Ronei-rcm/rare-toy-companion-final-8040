import { useState, useCallback } from 'react';

export interface CartToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  productName?: string;
  productImage?: string;
  quantity?: number;
  action?: 'add' | 'remove' | 'update' | 'clear';
  duration?: number;
}

export const useCartToast = () => {
  const [toasts, setToasts] = useState<CartToastData[]>([]);

  const addToast = useCallback((toast: Omit<CartToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: CartToastData = {
      ...toast,
      id,
      duration: toast.duration || 4000,
    };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    setTimeout(() => {
      removeToast(id);
    }, newToast.duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Toast helpers
  const showSuccess = useCallback((title: string, description?: string, options?: Partial<CartToastData>) => {
    addToast({
      type: 'success',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const showError = useCallback((title: string, description?: string, options?: Partial<CartToastData>) => {
    addToast({
      type: 'error',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const showWarning = useCallback((title: string, description?: string, options?: Partial<CartToastData>) => {
    addToast({
      type: 'warning',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  const showInfo = useCallback((title: string, description?: string, options?: Partial<CartToastData>) => {
    addToast({
      type: 'info',
      title,
      description,
      ...options,
    });
  }, [addToast]);

  // Cart specific toasts with image support
  const showAddToCart = useCallback((productName: string, quantity: number = 1, productImage?: string) => {
    addToast({
      type: 'success',
      title: 'Item adicionado! 🎉',
      description: `${productName} foi adicionado ao seu carrinho.`,
      action: 'add',
      productName,
      productImage,
      quantity,
      duration: 3000,
    });
  }, [addToast]);

  const showRemoveFromCart = useCallback((productName: string) => {
    addToast({
      type: 'info',
      title: 'Item removido',
      description: `${productName} foi removido do carrinho.`,
      action: 'remove',
      productName,
      duration: 2500,
    });
  }, [addToast]);

  const showUpdateQuantity = useCallback((productName: string, quantity: number, isIncrease: boolean) => {
    addToast({
      type: 'info',
      title: isIncrease ? 'Quantidade aumentada' : 'Quantidade reduzida',
      description: `${productName}: ${quantity} unidade(s)`,
      action: 'update',
      productName,
      quantity,
      duration: 2000,
    });
  }, [addToast]);

  const showCartCleared = useCallback(() => {
    addToast({
      type: 'info',
      title: 'Carrinho limpo',
      description: 'Todos os itens foram removidos do carrinho.',
      action: 'clear',
      duration: 3000,
    });
  }, [addToast]);

  const showStockWarning = useCallback((productName: string, stock: number) => {
    addToast({
      type: 'warning',
      title: 'Estoque baixo!',
      description: `Apenas ${stock} unidade(s) de ${productName} em estoque.`,
      productName,
      duration: 5000,
    });
  }, [addToast]);

  const showOutOfStock = useCallback((productName: string) => {
    addToast({
      type: 'error',
      title: 'Produto fora de estoque',
      description: `${productName} não está mais disponível.`,
      productName,
      duration: 4000,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAddToCart,
    showRemoveFromCart,
    showUpdateQuantity,
    showCartCleared,
    showStockWarning,
    showOutOfStock,
  };
};
