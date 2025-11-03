import { useEffect, useCallback, useRef } from 'react';
import { useCart } from '@/contexts/CartContext';

/**
 * Hook para garantir sincronização perfeita do carrinho
 * entre drawer, página, header e backend
 */
export const useCartSync = () => {
  const { state, dispatch } = useCart();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  const syncInProgressRef = useRef(false);
  const lastSyncRef = useRef<number>(0);

  // Sincronização com backend (com debounce)
  const syncWithBackend = useCallback(async () => {
    // Evitar múltiplas sincronizações simultâneas
    if (syncInProgressRef.current) return;
    
    // Debounce: não sincronizar mais de 1x por segundo
    const now = Date.now();
    if (now - lastSyncRef.current < 1000) return;
    
    try {
      syncInProgressRef.current = true;
      lastSyncRef.current = now;

      const res = await fetch(`${API_BASE_URL}/cart`, { 
        credentials: 'include',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!res.ok) throw new Error('Falha ao sincronizar');
      
      const data = await res.json();
      const serverItems = Array.isArray(data.items) ? data.items : [];
      
      // Só atualizar se houver diferença real
      const serverIds = serverItems.map((item: any) => String(item.id)).sort();
      const localIds = state.itens.map(item => item.id).sort();
      
      if (JSON.stringify(serverIds) !== JSON.stringify(localIds)) {
        // Disparar evento de atualização
        window.dispatchEvent(new CustomEvent('cart-sync-update', {
          detail: { items: serverItems, source: 'backend' }
        }));
      }
    } catch (error) {
      console.error('[CartSync] Erro ao sincronizar com backend:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [state.itens, API_BASE_URL]);

  // Escutar mudanças entre abas (localStorage)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'muhlstore-cart' && e.newValue) {
        try {
          const newItems = JSON.parse(e.newValue);
          window.dispatchEvent(new CustomEvent('cart-sync-update', {
            detail: { items: newItems, source: 'storage' }
          }));
        } catch (error) {
          console.error('[CartSync] Erro ao processar mudança de localStorage:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Sincronização periódica (a cada 15 segundos em vez de 30)
  useEffect(() => {
    syncWithBackend(); // Sincronizar imediatamente
    
    const interval = setInterval(syncWithBackend, 15000);
    return () => clearInterval(interval);
  }, [syncWithBackend]);

  // Sincronizar quando a janela ganha foco
  useEffect(() => {
    const handleFocus = () => {
      syncWithBackend();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [syncWithBackend]);

  // Sincronizar quando o carrinho é aberto
  useEffect(() => {
    if (state.isOpen) {
      syncWithBackend();
    }
  }, [state.isOpen, syncWithBackend]);

  return {
    syncNow: syncWithBackend,
    isSyncing: syncInProgressRef.current,
    lastSync: lastSyncRef.current
  };
};
