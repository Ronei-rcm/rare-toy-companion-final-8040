interface PaymentMethod {
  id: string;
  name: string;
  type: 'pix' | 'apple_pay' | 'google_pay' | 'credit_card' | 'debit_card';
  enabled: boolean;
  icon?: string;
  discount?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail?: string;
  customerName?: string;
  description: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  qrCode?: string;
  error?: string;
  method: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private apiBaseUrl: string;

  private constructor() {
    this.apiBaseUrl = (import.meta as any).env?.VITE_API_URL || '/api';
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  /**
   * Verifica se Apple Pay está disponível
   */
  isApplePayAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      return (
        'ApplePaySession' in window &&
        ApplePaySession.canMakePayments()
      );
    } catch (error) {
      console.error('Erro ao verificar Apple Pay:', error);
      return false;
    }
  }

  /**
   * Verifica se Google Pay está disponível
   */
  isGooglePayAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    try {
      return 'google' in window && 'payments' in (window as any).google;
    } catch (error) {
      console.error('Erro ao verificar Google Pay:', error);
      return false;
    }
  }

  /**
   * Obtém métodos de pagamento disponíveis
   */
  async getAvailablePaymentMethods(): Promise<PaymentMethod[]> {
    const methods: PaymentMethod[] = [
      {
        id: 'pix',
        name: 'PIX',
        type: 'pix',
        enabled: true,
        icon: 'qr-code',
        discount: {
          type: 'percentage',
          value: 5
        }
      },
      {
        id: 'apple_pay',
        name: 'Apple Pay',
        type: 'apple_pay',
        enabled: this.isApplePayAvailable(),
        icon: 'smartphone'
      },
      {
        id: 'google_pay',
        name: 'Google Pay',
        type: 'google_pay',
        enabled: this.isGooglePayAvailable(),
        icon: 'wallet'
      },
      {
        id: 'credit_card',
        name: 'Cartão de Crédito',
        type: 'credit_card',
        enabled: true,
        icon: 'credit-card'
      }
    ];

    // Verificar configurações do servidor
    try {
      const response = await fetch(`${this.apiBaseUrl}/payment-methods`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const serverMethods = await response.json();
        // Mesclar com configurações do servidor
        return methods.map(method => {
          const serverMethod = serverMethods.find((sm: any) => sm.id === method.id);
          return serverMethod ? { ...method, ...serverMethod } : method;
        });
      }
    } catch (error) {
      console.error('Erro ao obter métodos de pagamento do servidor:', error);
    }

    return methods;
  }

  /**
   * Processa pagamento via PIX
   */
  async processPixPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/pix`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pagamento PIX');
      }

      const data = await response.json();
      return {
        success: true,
        transactionId: data.transactionId,
        qrCode: data.qrCode,
        paymentUrl: data.paymentUrl,
        method: 'pix'
      };
    } catch (error: any) {
      console.error('Erro no pagamento PIX:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento PIX',
        method: 'pix'
      };
    }
  }

  /**
   * Processa pagamento via Apple Pay
   */
  async processApplePayPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isApplePayAvailable()) {
      return {
        success: false,
        error: 'Apple Pay não está disponível',
        method: 'apple_pay'
      };
    }

    try {
      const paymentRequest = {
        countryCode: 'BR',
        currencyCode: 'BRL',
        supportedNetworks: ['visa', 'mastercard', 'amex'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: request.description,
          amount: request.amount.toString()
        },
        lineItems: request.items.map(item => ({
          label: item.name,
          amount: (item.price * item.quantity).toString()
        }))
      };

      const session = new ApplePaySession(3, paymentRequest);
      
      return new Promise((resolve) => {
        session.onvalidatemerchant = async (event) => {
          try {
            const validationURL = event.validationURL;
            const response = await fetch(`${this.apiBaseUrl}/apple-pay/validate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                validationURL,
                domainName: window.location.hostname
              })
            });

            if (response.ok) {
              const validationData = await response.json();
              session.completeMerchantValidation(validationData);
            } else {
              session.abort();
              resolve({
                success: false,
                error: 'Erro na validação do merchant',
                method: 'apple_pay'
              });
            }
          } catch (error) {
            session.abort();
            resolve({
              success: false,
              error: 'Erro na validação do merchant',
              method: 'apple_pay'
            });
          }
        };

        session.onpaymentauthorized = async (event) => {
          try {
            const response = await fetch(`${this.apiBaseUrl}/payments/apple-pay`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                ...request,
                applePayData: event.payment
              })
            });

            if (response.ok) {
              const data = await response.json();
              session.completePayment(ApplePaySession.STATUS_SUCCESS);
              resolve({
                success: true,
                transactionId: data.transactionId,
                method: 'apple_pay'
              });
            } else {
              session.completePayment(ApplePaySession.STATUS_FAILURE);
              resolve({
                success: false,
                error: 'Erro ao processar pagamento',
                method: 'apple_pay'
              });
            }
          } catch (error) {
            session.completePayment(ApplePaySession.STATUS_FAILURE);
            resolve({
              success: false,
              error: 'Erro ao processar pagamento',
              method: 'apple_pay'
            });
          }
        };

        session.oncancel = () => {
          resolve({
            success: false,
            error: 'Pagamento cancelado pelo usuário',
            method: 'apple_pay'
          });
        };

        session.begin();
      });
    } catch (error: any) {
      console.error('Erro no Apple Pay:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento Apple Pay',
        method: 'apple_pay'
      };
    }
  }

  /**
   * Processa pagamento via Google Pay
   */
  async processGooglePayPayment(request: PaymentRequest): Promise<PaymentResponse> {
    if (!this.isGooglePayAvailable()) {
      return {
        success: false,
        error: 'Google Pay não está disponível',
        method: 'google_pay'
      };
    }

    try {
      const paymentsClient = new (window as any).google.payments.api.PaymentsClient({
        environment: 'TEST' // ou 'PRODUCTION' em produção
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['AMEX', 'DISCOVER', 'JCB', 'MASTERCARD', 'VISA']
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'example',
                gatewayMerchantId: 'exampleGatewayMerchantId'
              }
            }
          }
        ],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: request.amount.toString(),
          currencyCode: 'BRL'
        },
        merchantInfo: {
          merchantName: 'MuhlStore',
          merchantId: '12345678901234567890'
        }
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      const response = await fetch(`${this.apiBaseUrl}/payments/google-pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...request,
          googlePayData: paymentData
        })
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          transactionId: data.transactionId,
          method: 'google_pay'
        };
      } else {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.message || 'Erro ao processar pagamento',
          method: 'google_pay'
        };
      }
    } catch (error: any) {
      console.error('Erro no Google Pay:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento Google Pay',
        method: 'google_pay'
      };
    }
  }

  /**
   * Processa pagamento via cartão de crédito
   */
  async processCreditCardPayment(request: PaymentRequest, cardData: any): Promise<PaymentResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/credit-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...request,
          cardData
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao processar pagamento');
      }

      const data = await response.json();
      return {
        success: true,
        transactionId: data.transactionId,
        method: 'credit_card'
      };
    } catch (error: any) {
      console.error('Erro no pagamento com cartão:', error);
      return {
        success: false,
        error: error.message || 'Erro ao processar pagamento com cartão',
        method: 'credit_card'
      };
    }
  }

  /**
   * Verifica status de um pagamento
   */
  async checkPaymentStatus(transactionId: string): Promise<{
    status: 'pending' | 'approved' | 'failed' | 'cancelled';
    amount?: number;
    method?: string;
  }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/payments/${transactionId}/status`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erro ao verificar status do pagamento');
      }

      const data = await response.json();
      return {
        status: data.status,
        amount: data.amount,
        method: data.method
      };
    } catch (error: any) {
      console.error('Erro ao verificar status:', error);
      return {
        status: 'failed'
      };
    }
  }
}

// Instância singleton
export const paymentService = PaymentService.getInstance();
