import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, Copy, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

interface PixQRCodeProps {
  total: number;
  className?: string;
}

const PixQRCode: React.FC<PixQRCodeProps> = ({ total, className = '' }) => {
  const { toast } = useToast();
  const { state } = useCart();
  const [pixData, setPixData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const generatePixQR = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/cart/pix-qr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ total })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao gerar QR Code PIX');
      }

      const data = await res.json();
      setPixData(data);
    } catch (error: any) {
      console.error('Erro ao gerar PIX QR:', error);
      toast({
        title: 'Erro ao gerar QR Code PIX',
        description: error?.message || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyPixCode = async () => {
    if (!pixData?.qr_code) return;

    try {
      await navigator.clipboard.writeText(pixData.qr_code);
      setCopied(true);
      toast({
        title: 'Código PIX copiado!',
        description: 'Cole no seu app de pagamento',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Copie manualmente o código',
        variant: 'destructive'
      });
    }
  };

  // Gerar QR Code automaticamente quando o total mudar
  useEffect(() => {
    if (total > 0) {
      generatePixQR();
    }
  }, [total]);

  if (state.itens.length === 0) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <QrCode className="h-5 w-5 text-green-600" />
          Pagamento PIX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-sm text-gray-600">Gerando QR Code PIX...</p>
          </div>
        ) : pixData ? (
          <div className="space-y-4">
            {/* QR Code */}
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border-2 border-dashed border-gray-200 inline-block">
                <img 
                  src={pixData.qr_code_url} 
                  alt="QR Code PIX" 
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Escaneie com seu app de pagamento
              </p>
            </div>

            {/* Código PIX */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Código PIX (Copiar e Colar):</p>
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <code className="text-xs break-all flex-1 font-mono">
                    {pixData.qr_code}
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyPixCode}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Informações */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm space-y-1">
                <p><strong>Valor:</strong> R$ {pixData.amount.toFixed(2)}</p>
                <p><strong>Recebedor:</strong> {pixData.merchant_name}</p>
                <p><strong>Chave PIX:</strong> {pixData.pix_key}</p>
              </div>
            </div>

            {/* Instruções */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Como pagar:</strong>
              </p>
              <ol className="text-sm text-blue-700 mt-1 space-y-1">
                <li>1. Abra seu app bancário</li>
                <li>2. Escaneie o QR Code ou cole o código PIX</li>
                <li>3. Confirme o pagamento</li>
                <li>4. Volte aqui e clique em "Confirmar Pagamento"</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Button onClick={generatePixQR} variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              Gerar QR Code PIX
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PixQRCode;
