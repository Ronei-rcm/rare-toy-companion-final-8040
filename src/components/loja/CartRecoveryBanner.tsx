import React, { useState } from 'react';
import { X, Mail, Clock, Gift, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartRecovery } from '@/hooks/useCartRecovery';

interface CartRecoveryBannerProps {
  onClose?: () => void;
}

const CartRecoveryBanner: React.FC<CartRecoveryBannerProps> = ({ onClose }) => {
  const { sendRecoveryEmail, recoveryState } = useCartRecovery();
  const [email, setEmail] = useState('');
  const [customerName, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !customerName) {
      setMessage('Por favor, preencha todos os campos');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await sendRecoveryEmail(email, customerName);
      setMessage(result.message);
      
      if (result.success) {
        setTimeout(() => {
          onClose?.();
        }, 2000);
      }
    } catch (error) {
      setMessage('Erro inesperado. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (recoveryState.recoveryEmailSent) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-5 h-5" />
              <span className="font-semibold">Você esqueceu itens no carrinho!</span>
            </div>
            
            <div className="hidden md:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>Há {Math.floor(recoveryState.timeSinceAbandonment)}h</span>
              </div>
              <div className="flex items-center space-x-1">
                <Gift className="w-4 h-4" />
                <span>Ganhe 10% OFF</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <form onSubmit={handleSubmit} className="hidden md:flex items-center space-x-2">
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-40 h-8 text-gray-900"
                required
              />
              <Input
                type="text"
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setName(e.target.value)}
                className="w-32 h-8 text-gray-900"
                required
              />
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-8 bg-white text-orange-600 hover:bg-gray-100"
              >
                <Mail className="w-4 h-4 mr-1" />
                {isSubmitting ? 'Enviando...' : 'Recuperar'}
              </Button>
            </form>

            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile form */}
        <div className="md:hidden mt-3">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="flex space-x-2">
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 h-8 text-gray-900"
                required
              />
              <Input
                type="text"
                placeholder="Seu nome"
                value={customerName}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 h-8 text-gray-900"
                required
              />
            </div>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="w-full h-8 bg-white text-orange-600 hover:bg-gray-100"
            >
              <Mail className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Enviando...' : 'Recuperar Carrinho com 10% OFF'}
            </Button>
          </form>
        </div>

        {message && (
          <div className={`mt-2 text-sm text-center ${
            message.includes('sucesso') ? 'text-green-200' : 'text-red-200'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartRecoveryBanner;