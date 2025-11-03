import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Apple } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApplePayButtonProps {
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
    ApplePaySession?: any;
  }
}

const ApplePayButton: React.FC<ApplePayButtonProps> = ({
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
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se Apple Pay está disponível
    if (window.ApplePaySession) {
      const canMakePayments = window.ApplePaySession.canMakePayments();
      setIsAvailable(canMakePayments);
    }
  }, []);

  const handleApplePay = async () => {
    if (!window.ApplePaySession) {
      toast({
        title: 'Apple Pay não disponível',
        description: 'Este dispositivo não suporta Apple Pay',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsProcessing(true);

      const paymentRequest = {
        countryCode,
        currencyCode: currency,
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'MuhlStore',
          amount: amount.toFixed(2),
        },
      };

      const session = new window.ApplePaySession(3, paymentRequest);

      session.onvalidatemerchant = async (event: any) => {
        // Em produção, você precisa validar com seu backend
        // que se comunica com a Apple
        try {
          const response = await fetch('/api/payments/apple-pay/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              validationURL: event.validationURL,
            }),
          });

          const merchantSession = await response.json();
          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          console.error('Apple Pay validation failed:', error);
          session.abort();
          onError?.(error);
        }
      };

      session.onpaymentauthorized = async (event: any) => {
        try {
          // Processar pagamento com seu backend
          const response = await fetch('/api/payments/apple-pay/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentData: event.payment,
              amount,
            }),
          });

          const result = await response.json();

          if (result.success) {
            session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
            onSuccess?.(result);
            toast({
              title: 'Pagamento aprovado! ✅',
              description: 'Seu pedido foi confirmado com sucesso',
            });
          } else {
            session.completePayment(window.ApplePaySession.STATUS_FAILURE);
            onError?.(result.error);
            toast({
              title: 'Pagamento recusado',
              description: result.error || 'Tente outro método de pagamento',
              variant: 'destructive',
            });
          }
        } catch (error) {
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          onError?.(error);
        }
      };

      session.oncancel = () => {
        setIsProcessing(false);
        toast({
          title: 'Pagamento cancelado',
          description: 'Você cancelou o pagamento via Apple Pay',
        });
      };

      session.begin();
    } catch (error) {
      console.error('Apple Pay error:', error);
      setIsProcessing(false);
      onError?.(error);
    }
  };

  if (!isAvailable) {
    return null; // Não mostrar se não estiver disponível
  }

  return (
    <Button
      onClick={handleApplePay}
      disabled={disabled || isProcessing}
      className={`bg-black hover:bg-gray-900 text-white ${className}`}
      size="lg"
    >
      <Apple className="w-5 h-5 mr-2" />
      {isProcessing ? 'Processando...' : 'Apple Pay'}
    </Button>
  );
};

export default ApplePayButton;
