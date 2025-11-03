import React from 'react';
import ApplePayButton from './ApplePayButton';
import GooglePayButton from './GooglePayButton';
import { Separator } from '@/components/ui/separator';

interface ModernPaymentMethodsProps {
  amount: number;
  onSuccess?: (paymentData: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
  showDivider?: boolean;
}

const ModernPaymentMethods: React.FC<ModernPaymentMethodsProps> = ({
  amount,
  onSuccess,
  onError,
  disabled = false,
  showDivider = true,
}) => {
  const [hasModernPayments, setHasModernPayments] = React.useState(false);

  React.useEffect(() => {
    // Verificar se pelo menos um método moderno está disponível
    const checkAvailability = () => {
      const hasApplePay = window.ApplePaySession && window.ApplePaySession.canMakePayments();
      const hasGooglePay = !!window.google;
      setHasModernPayments(hasApplePay || hasGooglePay);
    };

    // Aguardar um pouco para os scripts carregarem
    setTimeout(checkAvailability, 1000);
  }, []);

  if (!hasModernPayments) {
    return null; // Não mostrar nada se nenhum método estiver disponível
  }

  return (
    <div className="space-y-4">
      {showDivider && (
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou pague com
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <ApplePayButton
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          disabled={disabled}
          className="flex-1"
        />
        <GooglePayButton
          amount={amount}
          onSuccess={onSuccess}
          onError={onError}
          disabled={disabled}
          className="flex-1"
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Pagamento seguro e instantâneo
      </p>
    </div>
  );
};

export default ModernPaymentMethods;
