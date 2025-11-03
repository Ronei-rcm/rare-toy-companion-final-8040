
import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { CreditCard, ArrowRight, Ticket, QrCode, User, MapPin, Loader2, Tag, X, Percent, Gift, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '@/contexts/SettingsContext';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import PixQRCode from './PixQRCode';

const CarrinhoResumo = () => {
  const { toast } = useToast();
  const { state } = useCart();
  const navigate = useNavigate();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  const { settings } = useSettings();
  const { user } = useCurrentUser();
  const [cupom, setCupom] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('cartao');
  const [cupomAplicado, setCupomAplicado] = useState<{ valid: boolean; type?: string; percent?: number; amount?: number } | null>(null);
  const [descontoValor, setDescontoValor] = useState<number>(0);
  const [freteGratis, setFreteGratis] = useState<boolean>(false);
  const [dadosCliente, setDadosCliente] = useState({
    nome: 'João Silva',
    email: 'joao@email.com',
    telefone: '(11) 99999-9999',
    endereco: 'Rua das Flores, 123 - São Paulo, SP'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Cálculos baseados no estado do carrinho
  const subtotal = state.total;
  const freteBaseConfig = settings?.shipping_base_price ?? 15;
  const freteGratisMin = settings?.free_shipping_min ?? 200;
  const pixDiscountPct = (settings?.pix_discount_percent ?? 5) / 100;
  const freteBase = subtotal > freteGratisMin ? 0 : Number(freteBaseConfig);
  const frete = freteGratis ? 0 : freteBase;
  const descontoPix = metodoPagamento === 'pix' ? subtotal * pixDiscountPct : 0;
  const total = subtotal + frete - descontoValor - descontoPix;
  
  const aplicarCupom = async () => {
    try {
      const code = cupom.trim();
      if (!code) {
        toast({ title: 'Erro', description: 'Digite um cupom.', variant: 'destructive' });
        return;
      }
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, subtotal })
      });
      if (!res.ok) throw new Error('Falha ao validar cupom');
      const data = await res.json();
      
      if (!data?.valid) {
        if (data?.reason === 'min_subtotal') {
          toast({ title: 'Cupom inválido', description: `Mínimo de R$ ${Number(data.min_subtotal || 0).toFixed(2)} para usar este cupom.`, variant: 'destructive' });
        } else {
          toast({ title: 'Cupom não encontrado', description: 'Verifique o código e tente novamente.', variant: 'destructive' });
        }
        setCupomAplicado(null);
        setDescontoValor(0);
        setFreteGratis(false);
        return;
      }
      
      // Aplicar cupom válido
      setCupomAplicado(data);
      
      if (data.type === 'shipping_free') {
        setFreteGratis(true);
        setDescontoValor(0);
        toast({ title: '✅ Cupom aplicado', description: 'Frete grátis ativado!' });
      } else if (data.type === 'percent') {
        const desconto = subtotal * (Number(data.percent || 0) / 100);
        setDescontoValor(desconto);
        setFreteGratis(false);
        toast({ title: '✅ Cupom aplicado', description: `${data.percent}% de desconto (R$ ${desconto.toFixed(2)})` });
      } else if (data.type === 'amount') {
        const desconto = Math.min(subtotal, Number(data.amount || 0));
        setDescontoValor(desconto);
        setFreteGratis(false);
        toast({ title: '✅ Cupom aplicado', description: `R$ ${desconto.toFixed(2)} de desconto` });
      }
    } catch (e: any) {
      toast({ title: 'Erro', description: e?.message || 'Não foi possível aplicar o cupom.', variant: 'destructive' });
    }
  };
  
  const finalizarCompra = async () => {
    if (state.itens.length === 0) {
      toast({ title: 'Carrinho vazio', description: 'Adicione itens antes de finalizar.' });
      return;
    }
    try {
      setIsSubmitting(true);
      
      // Usar user_id do hook useAuth (já chamado no topo do componente)
      const user_id = user?.id;
      
      console.log('🛒 [CARRINHO RESUMO] Finalizando compra...');
      console.log('👤 [CARRINHO RESUMO] User ID:', user_id);
      console.log('📦 [CARRINHO RESUMO] Dados:', dadosCliente);
      
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metodoPagamento,
          nome: dadosCliente.nome,
          email: dadosCliente.email,
          telefone: dadosCliente.telefone,
          endereco: dadosCliente.endereco,
          user_id, // Incluir user_id se disponível
          coupon_code: cupomAplicado?.valid ? cupom.trim().toUpperCase() : null,
          discount_amount: descontoValor
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao criar pedido');
      }
      
      const order = await res.json();
      toast({ 
        title: 'Pedido criado com sucesso! 🎉', 
        description: `Código: ${order.id}`,
        duration: 5000
      });
      
      try {
        // Limpar carrinho local
        if (typeof window !== 'undefined') {
          localStorage.removeItem('muhlstore-cart');
        }
        // Recarregar carrinho do backend
        window.location.reload();
      } catch {}
      
      navigate('/minha-conta?tab=pedidos');
    } catch (e: any) {
      console.error('Erro ao finalizar compra:', e);
      toast({ 
        title: 'Erro ao finalizar', 
        description: e?.message || 'Tente novamente', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle>MuhlStore - Resumo do Pedido</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dados do Cliente */}
        <div className="space-y-3">
          <h3 className="font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Dados de Entrega
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span>{dadosCliente.nome}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span>{dadosCliente.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Telefone:</span>
              <span>{dadosCliente.telefone}</span>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Endereço:
              </span>
              <span className="text-sm">{dadosCliente.endereco}</span>
            </div>
          </div>
        </div>

        <Separator />

        {/* Método de Pagamento */}
        <div className="space-y-3">
          <h3 className="font-medium">Forma de Pagamento</h3>
          <RadioGroup value={metodoPagamento} onValueChange={setMetodoPagamento} className="grid grid-cols-1 gap-2">
            <Label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
              <RadioGroupItem value="cartao" id="cartao" />
              <CreditCard className="h-4 w-4" /> Cartão de Crédito
            </Label>
            <Label className="flex items-center gap-2 p-2 border rounded-md cursor-pointer">
              <RadioGroupItem value="pix" id="pix" />
              <QrCode className="h-4 w-4" /> PIX (5% OFF)
            </Label>
          </RadioGroup>
        </div>
        
        <Separator />
        
        {/* Resumo de valores */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>R$ {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>Frete</span>
            <span>{frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2)}`}</span>
          </div>
          {descontoValor > 0 && (
            <div className="flex justify-between text-green-700">
              <span>Desconto</span>
              <span>- R$ {descontoValor.toFixed(2)}</span>
            </div>
          )}
          {metodoPagamento === 'pix' && (
            <div className="flex justify-between text-green-700">
              <span>Desconto PIX (5%)</span>
              <span>- R$ {descontoPix.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        <Separator />
        
        {/* Total */}
        <div className="flex justify-between font-bold text-lg">
          <span>Total</span>
          <span>R$ {total.toFixed(2)}</span>
        </div>
        
        {/* Cupom de desconto */}
        <div className="pt-4 border-t">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-semibold">Cupom de Desconto</p>
          </div>
          {!cupomAplicado?.valid ? (
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código"
                value={cupom}
                onChange={(e) => setCupom(e.target.value.toUpperCase())}
                className="flex-1 uppercase"
                onKeyPress={(e) => e.key === 'Enter' && aplicarCupom()}
                disabled={state.isLoading || isSubmitting}
              />
              <Button 
                variant="default" 
                onClick={aplicarCupom} 
                disabled={state.isLoading || isSubmitting || !cupom.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Gift className="h-4 w-4 mr-2" />
                Aplicar
              </Button>
            </div>
          ) : (
            <div className="bg-green-100 border-2 border-green-300 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-green-600 rounded-full p-1.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900 text-sm flex items-center gap-1">
                      {cupom.toUpperCase()}
                      {cupomAplicado.type === 'percent' && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          <Percent className="w-2.5 h-2.5 inline mr-0.5" />
                          {cupomAplicado.percent}%
                        </span>
                      )}
                      {cupomAplicado.type === 'amount' && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          R$ {Number(cupomAplicado.amount).toFixed(2)}
                        </span>
                      )}
                      {cupomAplicado.type === 'shipping_free' && (
                        <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">
                          FRETE GRÁTIS
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-green-700">
                      Economia: R$ {descontoValor.toFixed(2)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { 
                    setCupom(''); 
                    setCupomAplicado(null); 
                    setDescontoValor(0); 
                    setFreteGratis(false); 
                    toast({ title: 'Cupom removido' });
                  }}
                  disabled={state.isLoading || isSubmitting}
                  className="text-green-700 hover:text-green-900 hover:bg-green-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* QR Code PIX */}
        <PixQRCode total={total} />
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        {(state.isLoading || isSubmitting) && (
          <div className="text-sm text-muted-foreground flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {isSubmitting ? 'Finalizando pedido...' : 'Atualizando carrinho...'}
          </div>
        )}
        <Button className="w-full" onClick={finalizarCompra} disabled={state.isLoading || isSubmitting}>
          <CreditCard className="h-4 w-4 mr-2" />
          Finalizar Compra
        </Button>
        <div className="w-full text-center">
          <Button variant="link" className="text-sm" disabled={state.isLoading || isSubmitting}>
            Continuar Comprando
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CarrinhoResumo;
