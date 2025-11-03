import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/contexts/CartContext';

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
      const timeDiff = now - parseInt(lastActivity);
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Considerar abandonado após 1 hora sem atividade
      if (hoursDiff >= 1 && !recoveryState.recoveryEmailSent) {
        setRecoveryState(prev => ({
          ...prev,
          isAbandoned: true,
          timeSinceAbandonment: hoursDiff
        }));
      }
    }
  }, [items, recoveryState.recoveryEmailSent]);

  // Atualizar timestamp da última atividade
  const updateLastActivity = useCallback(() => {
    localStorage.setItem('cartLastActivity', Date.now().toString());
  }, []);

  // Gerar código de desconto
  const generateDiscountCode = useCallback(() => {
    const code = 'RECUPERA' + Math.random().toString(36).substr(2, 4).toUpperCase();
    setRecoveryState(prev => ({
      ...prev,
      discountCode: code
    }));
    return code;
  }, []);

  // Enviar e-mail de recuperação
  const sendRecoveryEmail = useCallback(async (email: string, customerName: string) => {
    try {
      // Proteção contra items undefined ou não array
      if (!items || !Array.isArray(items) || items.length === 0) {
        return { success: false, message: 'Carrinho vazio' };
      }
      
      const discountCode = generateDiscountCode();
      
      const recoveryData: CartRecoveryData = {
        email,
        customerName,
        cartItems: items.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: item.preco,
          quantidade: item.quantidade,
          imagemUrl: item.imagemUrl
        })),
        totalValue: total,
        discountCode
      };

      const response = await fetch('/api/email-marketing/cart-recovery/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recoveryData)
      });

      const result = await response.json();
      
      if (result.success) {
        setRecoveryState(prev => ({
          ...prev,
          recoveryEmailSent: true,
          isAbandoned: false
        }));
        
        // Salvar no localStorage que o e-mail foi enviado
        localStorage.setItem('cartRecoverySent', 'true');
        
        return { success: true, message: 'E-mail de recuperação enviado com sucesso!' };
      } else {
        return { success: false, message: result.message || 'Erro ao enviar e-mail de recuperação' };
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail de recuperação:', error);
      return { success: false, message: 'Erro de conexão. Tente novamente.' };
    }
  }, [items, total, generateDiscountCode]);

  // Verificar se já foi enviado e-mail de recuperação
  useEffect(() => {
    const recoverySent = localStorage.getItem('cartRecoverySent');
    if (recoverySent === 'true') {
      setRecoveryState(prev => ({
        ...prev,
        recoveryEmailSent: true
      }));
    }
  }, []);

  // Reset do estado quando o carrinho for limpo
  useEffect(() => {
    if (!items || !Array.isArray(items) || items.length === 0) {
      setRecoveryState({
        isAbandoned: false,
        timeSinceAbandonment: 0,
        recoveryEmailSent: false,
        discountCode: null
      });
      localStorage.removeItem('cartRecoverySent');
      localStorage.removeItem('cartLastActivity');
    }
  }, [items]);

  // Verificar se deve mostrar banner de recuperação
  const shouldShowRecoveryBanner = recoveryState.isAbandoned && !recoveryState.recoveryEmailSent;

  return {
    recoveryState,
    shouldShowRecoveryBanner,
    updateLastActivity,
    sendRecoveryEmail,
    generateDiscountCode
  };
};