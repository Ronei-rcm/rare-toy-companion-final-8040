import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Smartphone, CreditCard, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useInfiniteTap } from '@/hooks/useInfiniteTap';
import { useToast } from '@/hooks/use-toast';

interface InfiniteTapPaymentProps {
  amount: number;
  orderId: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  handle?: string; // InfinitePay handle do comerciante (opcional)
  docNumber?: string; // CNPJ/CPF do comerciante (opcional)
}

const InfiniteTapPayment: React.FC<InfiniteTapPaymentProps> = ({
  amount,
  orderId,
  onSuccess,
  onError,
  handle,
  docNumber
}) => {
  const { initiateTapTransaction, isProcessing } = useInfiniteTap();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<'credit' | 'debit'>('credit');
  const [installments, setInstallments] = useState<number>(1);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateInstallmentValue = (total: number, installments: number) => {
    return total / installments;
  };

  const handlePayment = async () => {
    try {
      // Validar se o app InfinitePay está instalado
      // Nota: Não há forma 100% confiável de verificar, então tentamos abrir e verificamos timeout
      
      toast({
        title: 'Abrindo InfinitePay...',
        description: 'Certifique-se de ter o app InfinitePay instalado e fazer login',
        duration: 3000
      });

      await initiateTapTransaction(
        amount,
        paymentMethod,
        orderId,
        paymentMethod === 'credit' ? installments : undefined,
        handle,
        docNumber
      );

      // O hook já tenta abrir o app
      // Se o app não estiver instalado, o hook mostrará um erro após 2 segundos
      
    } catch (error: any) {
      const errorMessage = error.message || 'Erro ao iniciar pagamento';
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-blue-600" />
          InfiniteTap - Pagamento por Aproximação
        </CardTitle>
        <CardDescription>
          Transforme seu celular em maquininha de cartão. Aproxime o cartão do celular para pagar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Valor */}
        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-900">Valor Total:</span>
            <span className="text-2xl font-bold text-blue-600">{formatCurrency(amount)}</span>
          </div>
        </div>

        {/* Método de Pagamento */}
        <div className="space-y-2">
          <Label>Método de Pagamento</Label>
          <Select value={paymentMethod} onValueChange={(value: 'credit' | 'debit') => setPaymentMethod(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="credit">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Crédito
                </div>
              </SelectItem>
              <SelectItem value="debit">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Débito
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Parcelas (apenas crédito) */}
        {paymentMethod === 'credit' && (
          <div className="space-y-2">
            <Label>Parcelas</Label>
            <Select 
              value={String(installments)} 
              onValueChange={(value) => setInstallments(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num}x de {formatCurrency(calculateInstallmentValue(amount, num))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {installments > 1 && (
              <p className="text-xs text-muted-foreground">
                Total: {formatCurrency(amount)} em {installments}x
              </p>
            )}
          </div>
        )}

        {/* Informações */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-yellow-600 mt-0.5 shrink-0" />
            <div className="text-xs text-yellow-800 space-y-1">
              <p className="font-medium">Como funciona:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Certifique-se de ter o app InfinitePay instalado</li>
                <li>Abra o app e faça login na sua conta</li>
                <li>Toque no botão abaixo para iniciar o pagamento</li>
                <li>Aproxime o cartão do celular quando solicitado</li>
                <li>O pagamento será processado automaticamente</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Botão de Pagamento */}
        <Button
          onClick={handlePayment}
          disabled={isProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </>
          ) : (
            <>
              <Smartphone className="h-4 w-4 mr-2" />
              Pagar com InfiniteTap
            </>
          )}
        </Button>

        {/* Badges de Segurança */}
        <div className="flex flex-wrap gap-2 justify-center pt-2">
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Seguro
          </Badge>
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            NFC
          </Badge>
          <Badge variant="outline" className="text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Recebimento na hora
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default InfiniteTapPayment;

