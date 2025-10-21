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

  private constructor() {
    this.apiBaseUrl = (import.meta as any).env?.VITE_API_URL || '/api';
  }

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
      const response = await fetch(`${this.apiBaseUrl}/cart-recovery/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString(),
          source: 'frontend'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
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
      const response = await fetch(`${this.apiBaseUrl}/cart-recovery/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          timestamp: new Date().toISOString()
        })
      });

      return response.ok;
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
      const response = await fetch(`${this.apiBaseUrl}/cart-recovery/settings`, {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
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
      const response = await fetch(`${this.apiBaseUrl}/cart-recovery/${recoveryId}/recovered`, {
        method: 'POST',
        credentials: 'include'
      });

      return response.ok;
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
        ? `${this.apiBaseUrl}/cart-recovery/check?email=${encodeURIComponent(customerEmail)}`
        : `${this.apiBaseUrl}/cart-recovery/check`;
      
      const response = await fetch(url, {
        credentials: 'include'
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
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
      await fetch(`${this.apiBaseUrl}/cart-recovery/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
