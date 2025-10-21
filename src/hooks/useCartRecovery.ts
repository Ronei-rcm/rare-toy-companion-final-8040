import { useEffect, useState, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';

interface CartRecoveryState {
  hasAbandonedCart: boolean;
  lastSavedAt: Date | null;
  itemCount: number;
  totalValue: number;
}

/**
 * Hook para gerenciar recuperação de carrinho abandonado
 * - Salva carrinho automaticamente
 * - Detecta carrinho abandonado
 * - Oferece opções de recuperação
 */
export const useCartRecovery = () => {
  const { state } = useCart();
  const [recoveryState, setRecoveryState] = useState<CartRecoveryState>({
    hasAbandonedCart: false,
    lastSavedAt: null,
    itemCount: 0,
    totalValue: 0,
  });

  const STORAGE_KEY = 'muhlstore-cart-recovery';
  const ABANDONED_THRESHOLD = 30 * 60 * 1000; // 30 minutos

  // Salvar estado do carrinho
  const saveCartState = useCallback(() => {
    if (state.itens.length === 0) return;

    const recoveryData = {
      savedAt: new Date().toISOString(),
      itemCount: state.quantidadeTotal,
      totalValue: state.total,
      items: state.itens,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recoveryData));
      setRecoveryState({
        hasAbandonedCart: false,
        lastSavedAt: new Date(),
        itemCount: state.quantidadeTotal,
        totalValue: state.total,
      });
    } catch (error) {
      console.error('[CartRecovery] Erro ao salvar carrinho:', error);
    }
  }, [state.itens, state.quantidadeTotal, state.total]);

  // Verificar se há carrinho abandonado
  const checkAbandonedCart = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const data = JSON.parse(saved);
      const timeSinceLastSave = Date.now() - data.timestamp;

      // Se passou mais de 30 min e o carrinho atual está vazio
      if (timeSinceLastSave > ABANDONED_THRESHOLD && state.itens.length === 0 && data.itemCount > 0) {
        setRecoveryState({
          hasAbandonedCart: true,
          lastSavedAt: new Date(data.savedAt),
          itemCount: data.itemCount,
          totalValue: data.totalValue,
        });
      }
    } catch (error) {
      console.error('[CartRecovery] Erro ao verificar carrinho abandonado:', error);
    }
  }, [state.itens.length]);

  // Limpar dados de recuperação
  const clearRecoveryData = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setRecoveryState({
        hasAbandonedCart: false,
        lastSavedAt: null,
        itemCount: 0,
        totalValue: 0,
      });
    } catch (error) {
      console.error('[CartRecovery] Erro ao limpar dados:', error);
    }
  }, []);

  // Recuperar carrinho
  const recoverCart = useCallback(async () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return false;

      const data = JSON.parse(saved);
      
      // Recarregar itens do carrinho (a lógica de restauração seria implementada no CartContext)
      // Por agora, apenas limpamos o estado de abandono
      clearRecoveryData();
      
      return true;
    } catch (error) {
      console.error('[CartRecovery] Erro ao recuperar carrinho:', error);
      return false;
    }
  }, [clearRecoveryData]);

  // Auto-save a cada mudança no carrinho
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveCartState();
    }, 2000); // Debounce de 2 segundos

    return () => clearTimeout(timeoutId);
  }, [saveCartState]);

  // Verificar carrinho abandonado na inicialização
  useEffect(() => {
    checkAbandonedCart();
  }, [checkAbandonedCart]);

  // Salvar antes de fechar a página
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.itens.length > 0) {
        saveCartState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveCartState, state.itens.length]);

  // Verificar periodicamente
  useEffect(() => {
    const intervalId = setInterval(checkAbandonedCart, 60000); // A cada 1 minuto
    return () => clearInterval(intervalId);
  }, [checkAbandonedCart]);

  return {
    ...recoveryState,
    saveCartState,
    recoverCart,
    clearRecoveryData,
  };
};

export default useCartRecovery;
