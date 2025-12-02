import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Truck, 
  MapPin, 
  Clock,
  Package,
  CheckCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DeliveryEstimate {
  cep: string;
  prazo: string;
  valor: number;
  metodo: string;
}

interface CartDeliveryEstimateProps {
  subtotal: number;
  onEstimateCalculated?: (estimate: DeliveryEstimate) => void;
}

export default function CartDeliveryEstimate({ 
  subtotal, 
  onEstimateCalculated 
}: CartDeliveryEstimateProps) {
  const { toast } = useToast();
  const [cep, setCep] = useState('');
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculated, setIsCalculated] = useState(false);

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const calculateDelivery = async (cepValue: string) => {
    if (cepValue.replace(/\D/g, '').length !== 8) {
      toast({
        title: 'CEP inválido',
        description: 'Digite um CEP válido (8 dígitos)',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      // Simular cálculo de frete (em produção, seria uma chamada à API)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Lógica de cálculo simplificada
      const cepNumber = parseInt(cepValue.replace(/\D/g, ''));
      const isSP = cepNumber >= 1000000 && cepNumber <= 19999999;
      const isRJ = cepNumber >= 20000000 && cepNumber <= 28999999;
      const isMG = cepNumber >= 30000000 && cepNumber <= 39999999;

      let prazo = '7-10 dias úteis';
      let valor = 15;
      let metodo = 'PAC';

      if (isSP || isRJ || isMG) {
        prazo = '3-5 dias úteis';
        valor = 10;
        metodo = 'PAC';
      }

      // Frete grátis acima de R$ 200
      if (subtotal >= 200) {
        valor = 0;
        metodo = 'Frete Grátis';
        prazo = isSP || isRJ || isMG ? '3-5 dias úteis' : '5-7 dias úteis';
      } else if (subtotal >= 100) {
        valor = valor * 0.5; // 50% de desconto
      }

      const newEstimate: DeliveryEstimate = {
        cep: cepValue,
        prazo,
        valor,
        metodo
      };

      setEstimate(newEstimate);
      setIsCalculated(true);

      if (onEstimateCalculated) {
        onEstimateCalculated(newEstimate);
      }

      toast({
        title: 'Frete calculado!',
        description: valor === 0 
          ? 'Parabéns! Você ganhou frete grátis!' 
          : `Frete: R$ ${valor.toFixed(2)} - ${prazo}`
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível calcular o frete',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCEPChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCEP(e.target.value);
    setCep(formatted);
    if (formatted.replace(/\D/g, '').length === 8) {
      calculateDelivery(formatted);
    } else {
      setIsCalculated(false);
      setEstimate(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-orange-600" />
          Calcular Frete
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="00000-000"
            value={cep}
            onChange={handleCEPChange}
            maxLength={9}
            className="flex-1"
          />
          <Button
            onClick={() => calculateDelivery(cep)}
            disabled={isLoading || cep.replace(/\D/g, '').length !== 8}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isLoading ? 'Calculando...' : 'Calcular'}
          </Button>
        </div>

        {subtotal >= 200 && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <p className="text-sm text-green-800">
              <strong>Frete Grátis!</strong> Sua compra acima de R$ 200,00 tem frete grátis
            </p>
          </div>
        )}

        {estimate && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Método:</span>
              </div>
              <Badge variant="outline">{estimate.metodo}</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium">Prazo:</span>
              </div>
              <span className="text-sm">{estimate.prazo}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-600" />
                <span className="font-medium">Valor do Frete:</span>
              </div>
              <span className={`text-lg font-bold ${estimate.valor === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                {estimate.valor === 0 ? 'Grátis' : `R$ ${estimate.valor.toFixed(2)}`}
              </span>
            </div>

            {estimate.cep && (
              <div className="flex items-center gap-2 text-xs text-gray-500 pt-2 border-t">
                <MapPin className="h-3 w-3" />
                <span>CEP: {estimate.cep}</span>
              </div>
            )}
          </div>
        )}

        {!estimate && cep.replace(/\D/g, '').length === 8 && (
          <p className="text-xs text-gray-500">
            Digite seu CEP para calcular o frete e prazo de entrega
          </p>
        )}
      </CardContent>
    </Card>
  );
}

