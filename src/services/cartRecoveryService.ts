import { request } from './api-config';

interface CartRecoveryEmailData {
  email: string;
  customerName?: string;
  items: Array<{
    nome: string;
    preco: number;
    quantidade: number;
    imagemUrl?: string;
  }>;
  totalValue: number;
  itemCount: number;
  recoveryUrl: string;
  storeName: string;
}

interface CartRecoverySettings {
  enabled: boolean;
  bannerDelayMs: number;
  emailDelayMs: number;
  maxEmailsPerDay: number;
  emailTemplate: 'basic' | 'premium' | 'custom';
}

export class CartRecoveryService {
  private static instance: CartRecoveryService;
  private apiBaseUrl: string;

  private constructor() { }

  public static getInstance(): CartRecoveryService {
    if (!CartRecoveryService.instance) {
      CartRecoveryService.instance = new CartRecoveryService();
    }
    return CartRecoveryService.instance;
  }

  /**
   * Envia email de recuperação de carrinho
   */
  async sendCartRecoveryEmail(data: CartRecoveryEmailData): Promise<boolean> {
    try {
      const result = await request<any>('/cart-recovery/email', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: 'frontend'
        })
      });

      return result.success === true;
    } catch (error) {
      console.error('Erro ao enviar email de recuperação:', error);
      return false;
    }
  }

  /**
   * Salva dados de recuperação no servidor
   */
  async saveRecoveryData(data: {
    customerEmail?: string;
    items: any[];
    totalValue: number;
    lastActivity: number;
  }): Promise<boolean> {
    try {
      await request('/cart-recovery/save', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })
      });

      return true;
    } catch (error) {
      console.error('Erro ao salvar dados de recuperação:', error);
      return false;
    }
  }

  /**
   * Obtém configurações de recuperação de carrinho
   */
  async getRecoverySettings(): Promise<CartRecoverySettings | null> {
    try {
      const data = await request<any>('/cart-recovery/settings');
      return data.settings || null;
    } catch (error) {
      console.error('Erro ao obter configurações de recuperação:', error);
      return null;
    }
  }

  /**
   * Marca carrinho como recuperado
   */
  async markAsRecovered(recoveryId: string): Promise<boolean> {
    try {
      await request(`/cart-recovery/${recoveryId}/recovered`, {
        method: 'POST'
      });

      return true;
    } catch (error) {
      console.error('Erro ao marcar como recuperado:', error);
      return false;
    }
  }

  /**
   * Gera URL de recuperação personalizada
   */
  generateRecoveryUrl(recoveryToken: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/carrinho?recovery=${recoveryToken}`;
  }

  /**
   * Verifica se há carrinho abandonado para o usuário
   */
  async checkAbandonedCart(customerEmail?: string): Promise<any | null> {
    try {
      const url = customerEmail
        ? `/cart-recovery/check?email=${encodeURIComponent(customerEmail)}`
        : '/cart-recovery/check';

      const data = await request<any>(url);
      return data.cart || null;
    } catch (error) {
      console.error('Erro ao verificar carrinho abandonado:', error);
      return null;
    }
  }

  /**
   * Registra evento de recuperação de carrinho
   */
  async trackRecoveryEvent(eventType: 'banner_shown' | 'email_sent' | 'cart_restored' | 'email_clicked', data?: any): Promise<void> {
    try {
      await request('/cart-recovery/track', {
        method: 'POST',
        body: JSON.stringify({
          eventType,
          data,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (error) {
      console.error('Erro ao registrar evento de recuperação:', error);
    }
  }
}

// Instância singleton
export const cartRecoveryService = CartRecoveryService.getInstance();
