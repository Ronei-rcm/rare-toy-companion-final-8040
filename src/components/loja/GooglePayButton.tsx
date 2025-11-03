import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface GooglePayButtonProps {
  amount: number;
  currency?: string;
  countryCode?: string;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    google?: any;
  }
}

const GooglePayButton: React.FC<GooglePayButtonProps> = ({
  amount,
  currency = 'BRL',
  countryCode = 'BR',
  onSuccess,
  onError,
  disabled = false,
  className = '',
}) => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentsClient, setPaymentsClient] = useState<any>(null);
  const buttonRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Carregar Google Pay API
    const script = document.createElement('script');
    script.src = 'https://pay.google.com/gp/p/js/pay.js';
    script.async = true;
    script.onload = initializeGooglePay;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const initializeGooglePay = () => {
    if (!window.google) return;

    const baseRequest = {
      apiVersion: 2,
      apiVersionMinor: 0,
    };

    const allowedCardNetworks = ['MASTERCARD', 'VISA', 'AMEX'];
    const allowedCardAuthMethods = ['PAN_ONLY', 'CRYPTOGRAM_3DS'];

    const tokenizationSpecification = {
      type: 'PAYMENT_GATEWAY',
      parameters: {
        gateway: 'example', // Substituir pelo seu gateway (ex: 'mercadopago')
        gatewayMerchantId: 'exampleGatewayMerchantId',
      },
    };

    const baseCardPaymentMethod = {
      type: 'CARD',
      parameters: {
        allowedAuthMethods: allowedCardAuthMethods,
        allowedCardNetworks: allowedCardNetworks,
      },
    };

    const cardPaymentMethod = {
      ...baseCardPaymentMethod,
      tokenizationSpecification,
    };

    const client = new window.google.payments.api.PaymentsClient({
      environment: process.env.NODE_ENV === 'production' ? 'PRODUCTION' : 'TEST',
    });

    setPaymentsClient(client);

    // Verificar se o Google Pay está disponível
    const isReadyToPayRequest = {
      ...baseRequest,
      allowedPaymentMethods: [baseCardPaymentMethod],
    };

    client
      .isReadyToPay(isReadyToPayRequest)
      .then((response: any) => {
        if (response.result) {
          setIsAvailable(true);
        }
      })
      .catch((err: any) => {
        console.error('Google Pay not available:', err);
      });
  };

  const handleGooglePay = async () => {
    if (!paymentsClient) {
      toast({
        title: 'Google Pay não disponível',
        description: 'Aguarde o carregamento do Google Pay',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: [
          {
            type: 'CARD',
            parameters: {
              allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
              allowedCardNetworks: ['MASTERCARD', 'VISA', 'AMEX'],
            },
            tokenizationSpecification: {
              type: 'PAYMENT_GATEWAY',
              parameters: {
                gateway: 'example',
                gatewayMerchantId: 'exampleGatewayMerchantId',
              },
            },
          },
        ],
        merchantInfo: {
          merchantId: '12345678901234567890', // Seu Merchant ID do Google
          merchantName: 'MuhlStore',
        },
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: amount.toFixed(2),
          currencyCode: currency,
          countryCode,
        },
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      // Processar pagamento no backend
      const response = await fetch('/api/payments/google-pay/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentData,
          amount,
        }),
      });

      const result = await response.json();

      if (result.success) {
        onSuccess?.(result);
        toast({
          title: 'Pagamento aprovado! ✅',
          description: 'Seu pedido foi confirmado com sucesso',
        });
      } else {
        onError?.(result.error);
        toast({
          title: 'Pagamento recusado',
          description: result.error || 'Tente outro método de pagamento',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Google Pay error:', error);
      
      if (error.statusCode === 'CANCELED') {
        toast({
          title: 'Pagamento cancelado',
          description: 'Você cancelou o pagamento via Google Pay',
        });
      } else {
        onError?.(error);
        toast({
          title: 'Erro no pagamento',
          description: 'Não foi possível processar o pagamento',
          variant: 'destructive',
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isAvailable) {
    return null; // Não mostrar se não estiver disponível
  }

  return (
    <Button
      onClick={handleGooglePay}
      disabled={disabled || isProcessing}
      className={`bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 ${className}`}
      size="lg"
    >
      <svg className="w-12 h-5 mr-2" viewBox="0 0 41 17" xmlns="http://www.w3.org/2000/svg">
        <g fill="none" fillRule="evenodd">
          <text fontFamily="Roboto-Medium, Roboto" fontSize="11" fontWeight="400" letterSpacing="-.2" fill="#3C4043">
            <tspan x="12" y="11">Pay</tspan>
          </text>
          <path d="M 6.75 3.5 C 6.75 5.571 5.071 7.25 3 7.25 C 0.929 7.25 -0.75 5.571 -0.75 3.5 C -0.75 1.429 0.929 -0.25 3 -0.25 C 5.071 -0.25 6.75 1.429 6.75 3.5 Z" fill="#EA4335" transform="matrix(1, 0, 0, 1, 3, 5)"></path>
          <path d="M 6.75 3.5 C 6.75 5.571 5.071 7.25 3 7.25 C 0.929 7.25 -0.75 5.571 -0.75 3.5 C -0.75 1.429 0.929 -0.25 3 -0.25 C 5.071 -0.25 6.75 1.429 6.75 3.5 Z" fill="#FBBC04" transform="matrix(1, 0, 0, 1, 8, 5)"></path>
          <path d="M 6.75 3.5 C 6.75 5.571 5.071 7.25 3 7.25 C 0.929 7.25 -0.75 5.571 -0.75 3.5 C -0.75 1.429 0.929 -0.25 3 -0.25 C 5.071 -0.25 6.75 1.429 6.75 3.5 Z" fill="#34A853" transform="matrix(1, 0, 0, 1, 3, 10)"></path>
          <path d="M 6.75 3.5 C 6.75 5.571 5.071 7.25 3 7.25 C 0.929 7.25 -0.75 5.571 -0.75 3.5 C -0.75 1.429 0.929 -0.25 3 -0.25 C 5.071 -0.25 6.75 1.429 6.75 3.5 Z" fill="#4285F4" transform="matrix(1, 0, 0, 1, 8, 10)"></path>
        </g>
      </svg>
      {isProcessing ? 'Processando...' : ''}
    </Button>
  );
};

export default GooglePayButton;
