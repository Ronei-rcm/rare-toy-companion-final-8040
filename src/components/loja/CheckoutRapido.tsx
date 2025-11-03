import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { CreditCard, QrCode, User, MapPin, Phone, Mail, Loader2, CheckCircle, Zap, Smartphone, Wallet, Tag, X, Percent, Gift } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SelosSeguranca from './SelosSeguranca';
import { useSettings } from '@/contexts/SettingsContext';
import SecurityBadges from './SecurityBadges';
import TrustIndicators from './TrustIndicators';

interface CheckoutRapidoProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'drawer' | 'page';
}

const CheckoutRapido = ({ isOpen, onClose, variant = 'page' }: CheckoutRapidoProps) => {
  const { state } = useCart();
  const { settings } = useSettings();
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'dados' | 'pagamento' | 'confirmacao'>('dados');
  const [dadosCliente, setDadosCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cep: '',
    cidade: '',
    estado: ''
  });
  const [metodoPagamento, setMetodoPagamento] = useState('pix');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<any>(null);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_url: string; expires_at: string; amount: number } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'waiting_payment' | 'paid' | 'failed'>('pending');
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [isCheckingPayment, setIsCheckingPayment] = useState(false);
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [enderecoSelecionado, setEnderecoSelecionado] = useState<string>('');
  const [salvarEndereco, setSalvarEndereco] = useState<boolean>(true);
  const [freteInfo, setFreteInfo] = useState<{ price: number; estimated_days: number; rule: string } | null>(null);
  const [isCotandoFrete, setIsCotandoFrete] = useState(false);
  const [retirarNaLoja, setRetirarNaLoja] = useState<boolean>(false);
  const [cupom, setCupom] = useState<string>('');
  const [cupomAplicado, setCupomAplicado] = useState<{ valid: boolean; type?: string; min_subtotal?: number; percent?: number; amount?: number } | null>(null);

  const carregarEnderecos = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, { credentials: 'include' });
      if (!res.ok) return setEnderecos([]);
      const data = await res.json();
      setEnderecos(Array.isArray(data) ? data : []);
    } catch {
      setEnderecos([]);
    }
  };

  // Auto-preencher CEP via ViaCEP quando atingir 8 dígitos
  useEffect(() => {
    const cep = (dadosCliente.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) return;
    let aborted = false;
    (async () => {
      try {
        const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await resp.json();
        if (aborted || data?.erro) return;
        setDadosCliente((prev) => ({
          ...prev,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
          endereco: prev.endereco || `${data.logradouro || ''}, ${data.bairro || ''}`.replace(/,\s*,/g, ',')
        }));
      } catch {}
    })();
    return () => { aborted = true; };
  }, [dadosCliente.cep]);

  // Preencher dados automaticamente se o usuário estiver logado
  useEffect(() => {
    if (user && isOpen) {
      setDadosCliente({
        nome: user.nome || '',
        email: user.email || '',
        telefone: user.telefone || '',
        endereco: user.endereco || '',
        cep: user.cep || '',
        cidade: user.cidade || '',
        estado: user.estado || ''
      });
      
      // Auto-selecionar PIX se disponível
      setMetodoPagamento('pix');
    }
    if (isOpen) {
      carregarEnderecos();
    }
  }, [user, isOpen]);

  useEffect(() => {
    if (!isOpen || enderecos.length === 0) return;
    const principal = enderecos.find((e) => e.shipping_default) || enderecos[0];
    if (principal) {
      setEnderecoSelecionado(principal.id);
      aplicarEndereco(principal);
    }
  }, [isOpen, enderecos]);

  const aplicarEndereco = (addr: any) => {
    setDadosCliente((prev) => ({
      ...prev,
      endereco: `${addr.endereco || ''}, ${addr.numero || ''}${addr.complemento ? ' - ' + addr.complemento : ''}, ${addr.bairro || ''}`.replace(/,\s*,/g, ','),
      cep: addr.cep || '',
      cidade: addr.cidade || '',
      estado: addr.estado || ''
    }));
  };

  // Cálculos
  const subtotal = state.total;
  const hasShippingFreeCoupon = Boolean(cupomAplicado?.valid && cupomAplicado?.type === 'shipping_free');
  const freeShippingMin = settings.free_shipping_min;
  const baseShipping = settings.shipping_base_price;
  const pixDiscountPct = settings.pix_discount_percent / 100;
  const digitalDiscountPct = settings.digital_pay_discount_percent / 100;
  const frete = retirarNaLoja ? 0 : (hasShippingFreeCoupon ? 0 : (freteInfo ? freteInfo.price : (subtotal > freeShippingMin ? 0 : baseShipping)));
  const descontoCupom = cupomAplicado?.valid
    ? (cupomAplicado.type === 'percent' ? (subtotal * ((cupomAplicado.percent || 0) / 100))
      : (cupomAplicado.type === 'amount' ? Math.min(subtotal, Number(cupomAplicado.amount || 0))
      : 0))
    : 0;
  const descontoPix = metodoPagamento === 'pix' ? subtotal * pixDiscountPct : 0;
  const descontoDigital = (metodoPagamento === 'apple_pay' || metodoPagamento === 'google_pay') ? subtotal * digitalDiscountPct : 0;
  const total = subtotal + frete - descontoCupom - descontoPix - descontoDigital;

  const cotarFrete = async () => {
    const cep = (dadosCliente.cep || '').replace(/\D/g, '');
    if (retirarNaLoja) { setFreteInfo({ price: 0, estimated_days: 0, rule: 'pickup' }); return; }
    if (cep.length < 8) { setFreteInfo(null); return; }
    try {
      setIsCotandoFrete(true);
      const res = await fetch(`${API_BASE_URL}/shipping/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ cep, subtotal })
      });
      if (!res.ok) throw new Error('Falha ao cotar frete');
      const data = await res.json();
      setFreteInfo({ price: Number(data.price || 0), estimated_days: Number(data.estimated_days || 5), rule: data.rule || 'region_base' });
    } catch (e) {
      setFreteInfo(null);
    } finally {
      setIsCotandoFrete(false);
    }
  };

  useEffect(() => {
    cotarFrete();
  }, [dadosCliente.cep, subtotal, retirarNaLoja]);

  const aplicarCupom = async () => {
    try {
      const code = cupom.trim();
      if (!code) return;
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code, subtotal })
      });
      const data = await res.json();
      setCupomAplicado(data);
      if (data.valid) {
        let desc = code.toUpperCase();
        if (data.type === 'percent') desc += ` (${Number(data.percent || 0)}%)`;
        if (data.type === 'amount') desc += ` (R$ ${Number(data.amount || 0).toFixed(2)})`;
        if (data.type === 'shipping_free') desc += ' (Frete grátis)';
        toast({ title: 'Cupom aplicado', description: desc });
      } else {
        toast({ variant: 'destructive', title: 'Cupom inválido', description: data.reason === 'min_subtotal' ? `Mínimo R$ ${Number(data.min_subtotal || 0).toFixed(2)}` : 'Verifique o código' });
      }
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao aplicar cupom', description: e?.message || '' });
    }
  };

  const validarDados = () => {
    console.log('🔍 [CHECKOUT] Validando dados...');
    console.log('📋 [CHECKOUT] dadosCliente atual:', dadosCliente);
    
    const camposObrigatorios = ['nome', 'email', 'telefone', 'endereco', 'cep', 'cidade', 'estado'];
    const camposVazios = camposObrigatorios.filter(campo => {
      const valor = dadosCliente[campo as keyof typeof dadosCliente];
      const vazio = !valor || (typeof valor === 'string' && valor.trim() === '');
      if (vazio) {
        console.log(`❌ [CHECKOUT] Campo vazio: ${campo}`);
      }
      return vazio;
    });
    
    if (camposVazios.length > 0) {
      console.error('❌ [CHECKOUT] Campos vazios:', camposVazios);
      toast({
        title: 'Dados incompletos',
        description: `Por favor, preencha: ${camposVazios.join(', ')}`,
        variant: 'destructive'
      });
      return false;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(dadosCliente.email)) {
      console.error('❌ [CHECKOUT] Email inválido:', dadosCliente.email);
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido',
        variant: 'destructive'
      });
      return false;
    }

    console.log('✅ [CHECKOUT] Validação passou!');
    return true;
  };

  const finalizarPedido = async () => {
    console.log('🛒 [CHECKOUT] Iniciando finalização de pedido...');
    console.log('📋 [CHECKOUT] Dados do cliente:', dadosCliente);
    console.log('💳 [CHECKOUT] Método de pagamento:', metodoPagamento);
    
    if (!validarDados()) {
      console.log('❌ [CHECKOUT] Validação falhou');
      return;
    }

    try {
      setIsSubmitting(true);
      setStep('pagamento');

      // Persistir endereço (criar/atualizar) se marcado
      if (salvarEndereco) {
        console.log('📍 [CHECKOUT] Salvando endereço...');
        const payloadAddr: any = {
          nome: 'Entrega',
          cep: dadosCliente.cep,
          endereco: dadosCliente.endereco,
          numero: '',
          complemento: '',
          bairro: '',
          cidade: dadosCliente.cidade,
          estado: dadosCliente.estado,
          shipping_default: 1,
          billing_default: 0,
        };
        try {
          if (enderecoSelecionado) {
            await fetch(`${API_BASE_URL}/addresses/${enderecoSelecionado}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payloadAddr)
            });
          } else {
            const resAddr = await fetch(`${API_BASE_URL}/addresses`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify(payloadAddr)
            });
            if (resAddr.ok) {
              const addr = await resAddr.json();
              setEnderecoSelecionado(addr.id);
            }
          }
        } catch {}
      }

      const orderPayload = {
        metodoPagamento,
        nome: dadosCliente.nome,
        email: dadosCliente.email,
        telefone: dadosCliente.telefone,
        endereco: `${dadosCliente.endereco}, ${dadosCliente.cidade} - ${dadosCliente.estado}, CEP: ${dadosCliente.cep}`,
        payment_status: 'pending',
        coupon_code: cupomAplicado?.valid ? cupom.trim().toUpperCase() : null,
        discount_amount: descontoCupom
      };
      
      console.log('📤 [CHECKOUT] Enviando pedido para API:', orderPayload);
      
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      console.log('📥 [CHECKOUT] Resposta da API:', res.status, res.statusText);

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('❌ [CHECKOUT] Erro na resposta:', errorData);
        throw new Error(errorData.message || 'Falha ao criar pedido');
      }

      const pedido = await res.json();
      console.log('✅ [CHECKOUT] Pedido criado:', pedido);
      setPedidoConfirmado(pedido);

      // Se for Pix, gerar QR Code
      if (metodoPagamento === 'pix') {
        await gerarPix(pedido.id, pedido.total);
      }

      toast({
        title: 'Pedido criado com sucesso! 🎉',
        description: `Código do pedido: ${pedido.id}`,
        duration: 5000
      });

    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      toast({
        title: 'Erro ao finalizar pedido',
        description: error?.message || 'Tente novamente',
        variant: 'destructive'
      });
      setStep('dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gerarPix = async (orderId: string, total: number) => {
    try {
      setIsGeneratingPix(true);
      
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/pix`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total })
      });

      if (!res.ok) {
        throw new Error('Falha ao gerar QR Code Pix');
      }

      const pixResponse = await res.json();
      setPixData(pixResponse);
      setPaymentStatus('waiting_payment');

      // Iniciar verificação de pagamento
      startPaymentCheck(orderId);

    } catch (error: any) {
      console.error('Erro ao gerar Pix:', error);
      toast({
        title: 'Erro ao gerar Pix',
        description: error?.message || 'Tente novamente',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPix(false);
    }
  };

  const startPaymentCheck = (orderId: string) => {
    const checkPayment = async () => {
      try {
        setIsCheckingPayment(true);
        const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
          credentials: 'include'
        });

        if (res.ok) {
          const statusData = await res.json();
          if (statusData.payment_status === 'paid') {
            setPaymentStatus('paid');
            setStep('confirmacao');
            toast({
              title: 'Pagamento confirmado! 🎉',
              description: 'Seu pedido foi processado com sucesso',
              duration: 5000
            });
            return true;
          }
        }
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error);
      } finally {
        setIsCheckingPayment(false);
      }
      return false;
    };

    // Verificar imediatamente
    checkPayment();

    // Verificar a cada 3 segundos por 5 minutos
    const interval = setInterval(async () => {
      const paid = await checkPayment();
      if (paid) {
        clearInterval(interval);
      }
    }, 3000);

    // Parar verificação após 5 minutos
    setTimeout(() => {
      clearInterval(interval);
    }, 300000);
  };

  const simularPagamento = async () => {
    if (!pedidoConfirmado) return;

    try {
      const res = await fetch(`${API_BASE_URL}/orders/${pedidoConfirmado.id}/confirm-payment`, {
        method: 'POST',
        credentials: 'include'
      });

      if (res.ok) {
        setPaymentStatus('paid');
        setStep('confirmacao');
        toast({
          title: 'Pagamento confirmado! 🎉',
          description: 'Seu pedido foi processado com sucesso',
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Erro ao simular pagamento:', error);
    }
  };

  const handleClose = () => {
    setStep('dados');
    setPedidoConfirmado(null);
    setPixData(null);
    setPaymentStatus('pending');
    setIsGeneratingPix(false);
    setIsCheckingPayment(false);
    onClose();
  };

  // Checkout em 1 clique para usuários com dados completos
  const checkoutUmClique = async () => {
    if (!user) {
      // Redirecionar para login com redirect de volta para checkout
      navigate('/auth/login?redirect=/carrinho&checkout=rapido');
      return;
    }
    
    // Verificar se o usuário tem todos os dados necessários
    const temDadosCompletos = user.nome && user.email && user.telefone && 
                             user.endereco && user.cep && user.cidade && user.estado;
    
    if (!temDadosCompletos) {
      toast({
        title: 'Dados incompletos',
        description: 'Complete seus dados de entrega antes de usar o checkout rápido',
        variant: 'destructive'
      });
      setStep('dados');
      return;
    }

    try {
      setIsSubmitting(true);
      setStep('pagamento');

      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metodoPagamento: 'pix',
          nome: user.nome,
          email: user.email,
          telefone: user.telefone,
          endereco: `${user.endereco}, ${user.cidade} - ${user.estado}, CEP: ${user.cep}`,
          payment_status: 'pending',
          user_id: user.id // Garantir que o user_id seja enviado
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Falha ao criar pedido');
      }

      const pedido = await res.json();
      setPedidoConfirmado(pedido);

      // Gerar PIX automaticamente
      await gerarPix(pedido.id, pedido.total);

      toast({
        title: 'Pedido criado com sucesso! 🎉',
        description: `Código do pedido: ${pedido.id}`,
        duration: 5000
      });

    } catch (error: any) {
      console.error('Erro no checkout rápido:', error);
      toast({
        title: 'Erro no checkout rápido',
        description: error?.message || 'Tente novamente',
        variant: 'destructive'
      });
      setStep('dados');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (state.itens.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" aria-hidden="true" />
            Checkout Rápido
          </DialogTitle>
          <DialogDescription>
            Finalize sua compra em poucos cliques. Preencha os dados de entrega e escolha a forma de pagamento.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!user && (
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="text-sm">Faça login para finalizar o pedido</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => { onClose(); (window.location.href = '/auth/login?redirect=/carrinho'); }}>Entrar</Button>
                  <Button onClick={() => { onClose(); (window.location.href = '/auth/cadastro'); }}>Cadastrar</Button>
                </div>
              </CardContent>
            </Card>
          )}
          {/* Resumo do pedido */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Resumo do Pedido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {state.itens.map((item, index) => (
                  <div key={item.id} className="flex justify-between items-center text-sm">
                    <span className="flex-1 truncate">{item.produto.nome}</span>
                    <span className="ml-2">R$ {(item.produto.preco * item.quantidade).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Frete {retirarNaLoja ? '(retirada)' : (isCotandoFrete ? '(cotando...)' : '')}</span>
                  <span>{frete === 0 ? 'Grátis' : `R$ ${frete.toFixed(2)}`}{(!retirarNaLoja && freteInfo) ? ` • ${freteInfo.estimated_days} dias` : ''}</span>
                </div>
                {descontoPix > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Desconto PIX (5%)</span>
                    <span>- R$ {descontoPix.toFixed(2)}</span>
                  </div>
                )}
                {descontoDigital > 0 && (
                  <div className="flex justify-between text-sm text-blue-600">
                    <span>Desconto Digital (2%)</span>
                    <span>- R$ {descontoDigital.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dados do cliente */}
          {step === 'dados' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input id="retirar" type="checkbox" checked={retirarNaLoja} onChange={(e) => setRetirarNaLoja(e.target.checked)} />
                  <Label htmlFor="retirar">Retirar na loja (frete R$ 0)</Label>
                </div>
                {enderecos.length > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="selecao-endereco" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Selecionar endereço salvo
                    </Label>
                    <Select value={enderecoSelecionado} onValueChange={(val) => {
                      setEnderecoSelecionado(val);
                      const addr = enderecos.find((e) => e.id === val);
                      if (addr) aplicarEndereco(addr);
                    }}>
                      <SelectTrigger id="selecao-endereco">
                        <SelectValue placeholder="Escolha um endereço" />
                      </SelectTrigger>
                      <SelectContent>
                        {enderecos.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {(e.nome || 'Endereço') + (e.shipping_default ? ' • Principal' : '')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome completo *</Label>
                    <Input
                      id="nome"
                      value={dadosCliente.nome}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Seu nome completo"
                      required
                      aria-describedby="nome-help"
                    />
                    <p id="nome-help" className="text-xs text-muted-foreground">
                      Digite seu nome completo como aparece no documento
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={dadosCliente.email}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="seu@email.com"
                      required
                      aria-describedby="email-help"
                    />
                    <p id="email-help" className="text-xs text-muted-foreground">
                      Usado para confirmação do pedido
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      value={dadosCliente.telefone}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP *</Label>
                    <Input
                      id="cep"
                      value={dadosCliente.cep}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                      disabled={retirarNaLoja}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço completo *</Label>
                  <Input
                    id="endereco"
                    value={dadosCliente.endereco}
                    onChange={(e) => setDadosCliente(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua, número, complemento"
                    disabled={retirarNaLoja}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input id="salvar-endereco" type="checkbox" checked={salvarEndereco} onChange={(e) => setSalvarEndereco(e.target.checked)} />
                  <Label htmlFor="salvar-endereco">Salvar este endereço para próximos pedidos</Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade *</Label>
                    <Input
                      id="cidade"
                      value={dadosCliente.cidade}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="Sua cidade"
                      disabled={retirarNaLoja}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado *</Label>
                    <Input
                      id="estado"
                      value={dadosCliente.estado}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, estado: e.target.value }))}
                      placeholder="SP"
                      disabled={retirarNaLoja}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Método de pagamento */}
          {step === 'dados' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Forma de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={metodoPagamento} onValueChange={setMetodoPagamento} className="space-y-3">
                  {/* PIX */}
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                    <RadioGroupItem value="pix" id="pix" />
                    <Label htmlFor="pix" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          <span>PIX</span>
                          <Badge variant="secondary" className="text-xs">5% OFF</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Aprovação instantânea
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Apple Pay */}
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                    <RadioGroupItem value="apple_pay" id="apple_pay" disabled={!settings.enable_apple_pay} />
                    <Label htmlFor="apple_pay" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Smartphone className="h-4 w-4" />
                          <span>Apple Pay</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Touch ID / Face ID
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Google Pay */}
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                    <RadioGroupItem value="google_pay" id="google_pay" disabled={!settings.enable_google_pay} />
                    <Label htmlFor="google_pay" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4" />
                          <span>Google Pay</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Pagamento rápido
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Cartão de Crédito */}
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-muted/50">
                    <RadioGroupItem value="cartao" id="cartao" />
                    <Label htmlFor="cartao" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Cartão de Crédito</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Visa, Mastercard, Elo
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Informações adicionais sobre pagamentos */}
                <div className="mt-4 p-3 bg-muted/30 rounded-md">
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>PIX: Aprovação instantânea + 5% de desconto</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Apple Pay / Google Pay: Pagamento seguro e rápido</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span>Cartão: Parcelamento em até 12x sem juros</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pagamento */}
          {step === 'pagamento' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  {metodoPagamento === 'pix' ? <QrCode className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
                  {metodoPagamento === 'pix' ? 'Pagamento via Pix' : 'Pagamento via Cartão'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {metodoPagamento === 'pix' && (
                  <div className="text-center space-y-4">
                    {isGeneratingPix ? (
                      <div className="py-8">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                        <p className="text-lg font-medium">Gerando QR Code Pix...</p>
                        <p className="text-sm text-muted-foreground">Aguarde um momento</p>
                      </div>
                    ) : pixData ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <img 
                            src={pixData.qr_code_url} 
                            alt="QR Code Pix" 
                            className="w-48 h-48 mx-auto border rounded-lg bg-white p-2"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm font-medium">Código Pix (copie e cole no seu app):</p>
                          <div className="bg-gray-100 p-3 rounded-lg font-mono text-xs break-all">
                            {pixData.qr_code}
                          </div>
                        </div>

                        <div className="text-center space-y-2">
                          <p className="text-lg font-semibold">Valor: R$ {pixData.amount.toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">
                            QR Code válido por 30 minutos
                          </p>
                        </div>

                        {paymentStatus === 'waiting_payment' && (
                          <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-orange-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Aguardando pagamento...</span>
                            </div>
                            
                            <Button 
                              onClick={simularPagamento}
                              variant="outline"
                              className="w-full"
                            >
                              Simular Pagamento (Teste)
                            </Button>
                          </div>
                        )}

                        {paymentStatus === 'paid' && (
                          <div className="text-center py-4">
                            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                            <p className="text-green-600 font-medium">Pagamento confirmado!</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8">
                        <p className="text-muted-foreground">Gerando QR Code Pix...</p>
                      </div>
                    )}
                  </div>
                )}

                {metodoPagamento === 'cartao' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card-number">Número do Cartão</Label>
                        <Input id="card-number" placeholder="1234 5678 9012 3456" />
                      </div>
                      <div>
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input id="card-cvv" placeholder="123" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="card-name">Nome no Cartão</Label>
                        <Input id="card-name" placeholder="João Silva" />
                      </div>
                      <div>
                        <Label htmlFor="card-expiry">Validade</Label>
                        <Input id="card-expiry" placeholder="12/25" />
                      </div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Modo de teste:</strong> Use qualquer número de cartão. O pagamento será simulado.
                      </p>
                    </div>

                    <Button 
                      onClick={simularPagamento}
                      className="w-full"
                    >
                      Confirmar Pagamento (Teste)
                    </Button>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setStep('dados')}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                  {paymentStatus === 'paid' && (
                    <Button 
                      onClick={() => setStep('confirmacao')}
                      className="flex-1"
                    >
                      Continuar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confirmação */}
          {step === 'confirmacao' && (
            <Card>
              <CardContent className="pt-6">
                {pedidoConfirmado ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Pedido Confirmado!</h3>
                    <p className="text-muted-foreground mb-4">
                      Código do pedido: <span className="font-mono font-semibold">{pedidoConfirmado.id}</span>
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      Você receberá um email de confirmação em breve.
                    </p>
                    <div className="flex gap-2 justify-center mb-6">
                      <Button onClick={() => navigate('/minha-conta')}>
                        Ver Meus Pedidos
                      </Button>
                      <Button variant="outline" onClick={handleClose}>
                        Continuar Comprando
                      </Button>
                    </div>

                    {/* Indicadores de Confiança */}
                    <div className="mb-6">
                      <TrustIndicators variant="compact" />
                    </div>

                    {/* Selos de Segurança */}
                    <SecurityBadges variant="compact" />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          {/* Selos de Segurança */}
          {step === 'dados' && (
            <SelosSeguranca variant="compact" showContact={false} />
          )}

          {step === 'dados' && (
            <Card className="border-2 border-dashed border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="w-5 h-5 text-purple-600" />
                  Cupom de Desconto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!cupomAplicado?.valid ? (
                  <div className="flex gap-2">
                    <Input 
                      value={cupom} 
                      onChange={(e) => setCupom(e.target.value.toUpperCase())} 
                      placeholder="Digite o código do cupom"
                      className="uppercase"
                      onKeyPress={(e) => e.key === 'Enter' && aplicarCupom()}
                    />
                    <Button type="button" variant="default" onClick={aplicarCupom} className="bg-purple-600 hover:bg-purple-700">
                      <Gift className="w-4 h-4 mr-2" />
                      Aplicar
                    </Button>
                  </div>
                ) : (
                  <div className="bg-green-100 border-2 border-green-300 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-green-600 rounded-full p-2">
                          <CheckCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 flex items-center gap-2">
                            {cupom.toUpperCase()}
                            {cupomAplicado.type === 'percent' && (
                              <Badge className="bg-green-600">
                                <Percent className="w-3 h-3 mr-1" />
                                {cupomAplicado.percent}% OFF
                              </Badge>
                            )}
                            {cupomAplicado.type === 'amount' && (
                              <Badge className="bg-green-600">
                                R$ {Number(cupomAplicado.amount).toFixed(2)} OFF
                              </Badge>
                            )}
                            {cupomAplicado.type === 'shipping_free' && (
                              <Badge className="bg-green-600">
                                FRETE GRÁTIS
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-green-700">
                            Economia: R$ {descontoCupom.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCupomAplicado(null);
                          setCupom('');
                          toast({ title: 'Cupom removido' });
                        }}
                        className="text-green-700 hover:text-green-900 hover:bg-green-200"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Botões de ação */}
          {step === 'dados' && (
            <div className="space-y-3">
              {/* Checkout em 1 clique para usuários com dados completos */}
              {user && user.nome && user.email && user.telefone && 
               user.endereco && user.cep && user.cidade && user.estado && (
                <Button 
                  onClick={checkoutUmClique} 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Checkout em 1 Clique (PIX)
                    </>
                  )}
                </Button>
              )}
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={finalizarPedido} className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Finalizar Pedido
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutRapido;
