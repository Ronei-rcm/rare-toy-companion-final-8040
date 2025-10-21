import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, ShoppingBag, Clock, Gift, CheckCircle, ArrowRight, Percent } from 'lucide-react';
import { useCartRecovery } from '@/hooks/useCartRecovery';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';

interface CartRecoveryEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartRecoveryEmailModal: React.FC<CartRecoveryEmailModalProps> = ({ isOpen, onClose }) => {
  const { recoveryData, restoreCart, clearRecoveryData, setShowEmailPrompt } = useCartRecovery();
  const { setCartOpen } = useCart();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!recoveryData) return null;

  const timeAgo = Math.floor((Date.now() - recoveryData.lastActivity) / (1000 * 60));
  const isHighValue = recoveryData.totalValue > 100;

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simular envio do email
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Aqui você implementaria o envio real do email
      console.log('Email enviado para:', email);
      
      setIsSuccess(true);
      
      // Salvar email para futuras comunicações
      localStorage.setItem('muhlstore-customer-email', email);
      
    } catch (error) {
      toast({
        title: 'Erro ao enviar email',
        description: 'Tente novamente em alguns instantes',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestoreCart = () => {
    restoreCart();
    setCartOpen(true);
    onClose();
  };

  const handleClose = () => {
    setShowEmailPrompt(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Recuperar seu carrinho
          </DialogTitle>
          <DialogDescription>
            Não perca seus itens selecionados! Deixe seu email e enviaremos um lembrete.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!isSuccess ? (
            <>
              {/* Informações do carrinho */}
              <Card className="border-dashed border-2 border-primary/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-primary" />
                      <span className="font-medium">Seu carrinho</span>
                    </div>
                    <Badge variant="secondary">
                      {recoveryData.itemCount} item{recoveryData.itemCount !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Salvo há {timeAgo} minutos</span>
                    </div>
                    <span className="font-semibold text-primary">
                      R$ {recoveryData.totalValue.toFixed(2)}
                    </span>
                  </div>

                  {isHighValue && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-2 rounded-md">
                      <Percent className="h-3 w-3" />
                      <span>Você ganha 5% OFF no PIX!</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Formulário de email */}
              <form onSubmit={handleSubmitEmail} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Seu melhor email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    required
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Enviaremos um lembrete para você finalizar sua compra
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Lembrete
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRestoreCart}
                  >
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    Continuar Agora
                  </Button>
                </div>
              </form>

              {/* Benefícios */}
              <div className="bg-muted/30 rounded-md p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Benefícios:</span>
                </div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• Lembrete personalizado do seu carrinho</li>
                  <li>• Ofertas exclusivas por email</li>
                  <li>• Primeiro acesso a novos produtos</li>
                  <li>• Frete grátis em compras acima de R$ 200</li>
                </ul>
              </div>
            </>
          ) : (
            /* Tela de sucesso */
            <div className="text-center py-6">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Email enviado com sucesso!</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Enviamos um lembrete para <strong>{email}</strong> com seus itens selecionados.
              </p>
              
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRestoreCart}>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Continuar Comprando
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartRecoveryEmailModal;
