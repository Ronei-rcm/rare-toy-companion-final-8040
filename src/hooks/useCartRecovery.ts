import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';
import { emailMarketingApi } from '@/services/email-marketing-api';

interface CartRecoveryData {
  email: string;
  customerName: string;
  cartItems: any[];
  totalValue: number;
  discountCode?: string;
}

interface CartRecoveryState {
  isAbandoned: boolean;
  timeSinceAbandonment: number;
  recoveryEmailSent: boolean;
  discountCode: string | null;
}

export const useCartRecovery = () => {
  const { items, total } = useCart();
  const [recoveryState, setRecoveryState] = useState<CartRecoveryState>({
    isAbandoned: false,
    timeSinceAbandonment: 0,
    recoveryEmailSent: false,
    discountCode: null
  });

  // Verificar se o carrinho foi abandonado
  useEffect(() => {
    if (!items || !Array.isArray(items) || items.length === 0) return;
    const lastActivity = localStorage.getItem('cartLastActivity');
    const now = Date.now();
    if (lastActivity) {
      const hoursDiff = (now - parseInt(lastActivity)) / (1000 * 60 * 60);
      if (hoursDiff >= 1 && !recoveryState.recoveryEmailSent) {
        setRecoveryState(prev => ({ ...prev, isAbandoned: true, timeSinceAbandonment: hoursDiff }));
      }
    }
  }, [items, recoveryState.recoveryEmailSent]);

  const updateLastActivity = useCallback(() => {
    localStorage.setItem('cartLastActivity', Date.now().toString());
  }, []);

  const generateDiscountCode = useCallback(() => {
    const code = 'RECUPERA' + Math.random().toString(36).substr(2, 4).toUpperCase();
    setRecoveryState(prev => ({ ...prev, discountCode: code }));
    return code;
  }, []);

  const sendRecoveryEmail = useCallback(async (email: string, customerName: string) => {
    try {
      if (!items || !Array.isArray(items) || items.length === 0) return { success: false, message: 'Carrinho vazio' };
      const discountCode = generateDiscountCode();
      const recoveryData: CartRecoveryData = {
        email, customerName, totalValue: total, discountCode,
        cartItems: items.map(item => ({
          id: item.id, nome: item.nome, preco: item.preco, quantidade: item.quantidade, imagemUrl: item.imagemUrl
        }))
      };

      const result = await emailMarketingApi.sendCartRecovery(recoveryData);
      if (result.success) {
        setRecoveryState(prev => ({ ...prev, recoveryEmailSent: true, isAbandoned: false }));
        localStorage.setItem('cartRecoverySent', 'true');
        return { success: true, message: 'E-mail enviado!' };
      }
      return { success: false, message: result.message || 'Erro no envio' };
    } catch (error) {
      console.error('Erro de recuperação:', error);
      return { success: false, message: 'Erro de conexão' };
    }
  }, [items, total, generateDiscountCode]);

  useEffect(() => {
    if (localStorage.getItem('cartRecoverySent') === 'true') {
      setRecoveryState(prev => ({ ...prev, recoveryEmailSent: true }));
    }
  }, []);

  useEffect(() => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      setRecoveryState({ isAbandoned: false, timeSinceAbandonment: 0, recoveryEmailSent: false, discountCode: null });
      localStorage.removeItem('cartRecoverySent');
      localStorage.removeItem('cartLastActivity');
    }
  }, [items]);

  return { recoveryState, shouldShowRecoveryBanner: recoveryState.isAbandoned && !recoveryState.recoveryEmailSent, updateLastActivity, sendRecoveryEmail, generateDiscountCode };
};