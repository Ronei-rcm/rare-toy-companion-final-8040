import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Gift, Clock, CheckCircle, Loader2 } from 'lucide-react';
import { useCartRecovery } from '@/hooks/useCartRecovery';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/contexts/SettingsContext';

const CartRecoveryEmailPrompt = () => {
  const { 
    showEmailPrompt, 
    recoveryData, 
    setShowEmailPrompt 
  } = useCartRecovery();
  const { toast } = useToast();
  const { settings } = useSettings();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email obrigatório',
        description: 'Por favor, insira seu email para receber o lembrete.',
        variant: 'destructive'
      });
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Email inválido',
        description: 'Por favor, insira um email válido.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Checa se SMTP está habilitado
      if (!settings.cart_recovery_enabled) {
        throw new Error('Recuperação desativada nas configurações.');
      }
      // Chama backend para envio real
      const res = await fetch(`${API_BASE_URL}/recovery/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const reason = data?.error || 'Falha ao enviar e-mail';
        throw new Error(reason);
      }
      
      setIsSubmitted(true);
      
      toast({
        title: 'Email enviado! 📧',
        description: 'Você receberá um lembrete sobre seus itens em breve.',
        duration: 5000
      });

      // Fechar o modal após 3 segundos
      setTimeout(() => {
        setShowEmailPrompt(false);
        setIsSubmitted(false);
        setEmail('');
      }, 3000);

    } catch (error) {
      toast({
        title: 'Erro ao enviar email',
        description: 'Tente novamente em alguns minutos.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setShowEmailPrompt(false);
    setIsSubmitted(false);
    setEmail('');
  };

  if (!showEmailPrompt || !recoveryData) {
    return null;
  }

  return (
    <Dialog open={showEmailPrompt} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Não perca seus itens!
          </DialogTitle>
          <DialogDescription>
            Receba um lembrete por email sobre os itens que você selecionou.
          </DialogDescription>
        </DialogHeader>

        {isSubmitted ? (
          <div className="text-center py-6">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Email enviado com sucesso!</h3>
            <p className="text-sm text-muted-foreground">
              Você receberá um lembrete sobre seus itens em breve.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Resumo do carrinho */}
            <Card className="bg-muted/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">Seus itens selecionados</h4>
                  <Badge variant="secondary" className="text-xs">
                    {recoveryData.itemCount} item{recoveryData.itemCount > 1 ? 's' : ''}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-sm">
                  {recoveryData.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="truncate flex-1">{item.produto.nome}</span>
                      <span className="ml-2 text-muted-foreground">
                        R$ {(item.produto.preco * item.quantidade).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  {recoveryData.items.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{recoveryData.items.length - 3} mais...
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>R$ {recoveryData.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulário de email */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Seu email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Receba um lembrete em 24h se não finalizar a compra</span>
              </div>

              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  Agora não
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Gift className="h-4 w-4 mr-2" />
                      Enviar Lembrete
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CartRecoveryEmailPrompt;
