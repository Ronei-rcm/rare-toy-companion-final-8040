import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Copy, 
  ExternalLink,
  Smartphone,
  Wallet,
  CreditCard
} from 'lucide-react';
import { paymentService, PaymentRequest, PaymentResponse } from '@/services/paymentService';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ModernPaymentProcessorProps {
  orderId: string;
  amount: number;
  method: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess: (response: PaymentResponse) => void;
  onError: (error: string) => void;
  className?: string;
}

const ModernPaymentProcessor: React.FC<ModernPaymentProcessorProps> = ({
  orderId,
  amount,
  method,
  customerEmail,
  customerName,
  onSuccess,
  onError,
  className
}) => {
  const { state } = useCart();
  const { toast } = useToast();
  const [paymentResponse, setPaymentResponse] = useState<PaymentResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'success' | 'failed'>('pending');

  const paymentRequest: PaymentRequest = {
    amount,
    currency: 'BRL',
    orderId,
    customerEmail,
    customerName,
    description: `Pedido #${orderId} - ${state.quantidadeTotal} item(s)`,
    items: state.itens.map(item => ({
      name: item.produto.nome,
      price: item.produto.preco,
      quantity: item.quantidade
    }))
  };

  const processPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      let response: PaymentResponse;

      switch (method) {
        case 'pix':
          response = await paymentService.processPixPayment(paymentRequest);
          break;
        case 'apple_pay':
          response = await paymentService.processApplePayPayment(paymentRequest);
          break;
        case 'google_pay':
          response = await paymentService.processGooglePayPayment(paymentRequest);
          break;
        default:
          throw new Error('Método de pagamento não suportado');
      }

      setPaymentResponse(response);

      if (response.success) {
        setPaymentStatus('success');
        onSuccess(response);
      } else {
        setPaymentStatus('failed');
        onError(response.error || 'Erro no processamento do pagamento');
      }
    } catch (error: any) {
      setPaymentStatus('failed');
      onError(error.message || 'Erro inesperado no pagamento');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para a área de transferência',
        duration: 2000
      });
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código',
        variant: 'destructive'
      });
    }
  };

  const getMethodIcon = () => {
    switch (method) {
      case 'pix':
        return <QrCode className="h-5 w-5" />;
      case 'apple_pay':
        return <Smartphone className="h-5 w-5" />;
      case 'google_pay':
        return <Wallet className="h-5 w-5" />;
      default:
        return <CreditCard className="h-5 w-5" />;
    }
  };

  const getMethodName = () => {
    switch (method) {
      case 'pix':
        return 'PIX';
      case 'apple_pay':
        return 'Apple Pay';
      case 'google_pay':
        return 'Google Pay';
      default:
        return 'Pagamento';
    }
  };

  if (paymentStatus === 'pending') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getMethodIcon()}
            {getMethodName()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-6">
            <div className="text-lg font-medium mb-2">Processar Pagamento</div>
            <div className="text-2xl font-bold text-primary mb-4">
              R$ {amount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Clique no botão abaixo para processar o pagamento via {getMethodName()}
            </p>
          </div>

          <Button 
            onClick={processPayment} 
            className="w-full" 
            size="lg"
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                {getMethodIcon()}
                <span className="ml-2">Pagar com {getMethodName()}</span>
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'processing') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <h3 className="text-lg font-medium mb-2">Processando pagamento...</h3>
            <p className="text-sm text-muted-foreground">
              Aguarde enquanto processamos seu pagamento via {getMethodName()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'success' && paymentResponse?.success) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Pagamento Aprovado! 🎉</h3>
            <p className="text-muted-foreground mb-4">
              Seu pagamento foi processado com sucesso via {getMethodName()}
            </p>
            
            {paymentResponse.transactionId && (
              <div className="bg-muted/30 rounded-lg p-3 mb-4">
                <div className="text-sm text-muted-foreground">ID da Transação:</div>
                <div className="font-mono text-sm">{paymentResponse.transactionId}</div>
              </div>
            )}

            {method === 'pix' && paymentResponse.qrCode && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <img 
                    src={paymentResponse.qrCode} 
                    alt="QR Code PIX" 
                    className="w-48 h-48 mx-auto border rounded-lg bg-white p-2"
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm font-medium">Código PIX (copie e cole no seu app):</p>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-100 p-3 rounded-lg font-mono text-xs break-all flex-1">
                      {paymentResponse.qrCode}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(paymentResponse.qrCode || '')}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">Valor: R$ {amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">
                    QR Code válido por 30 minutos
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (paymentStatus === 'failed') {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Erro no Pagamento</h3>
            <p className="text-muted-foreground mb-4">
              Não foi possível processar seu pagamento via {getMethodName()}
            </p>
            
            <div className="space-y-3">
              <Button onClick={processPayment} className="w-full">
                Tentar Novamente
              </Button>
              <Button variant="outline" onClick={() => setPaymentStatus('pending')} className="w-full">
                Escolher Outro Método
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default ModernPaymentProcessor;
