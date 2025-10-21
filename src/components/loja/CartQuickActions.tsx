import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Share2, Save, Heart, Gift } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/contexts/CartContext';

/**
 * Ações Rápidas do Carrinho
 */
const CartQuickActions: React.FC = () => {
  const { state } = useCart();
  const { toast } = useToast();

  const handleCopyCart = () => {
    const cartText = state.itens
      .map((item) => `${item.produto.nome} (${item.quantidade}x) - R$ ${(item.produto.preco * item.quantidade).toFixed(2)}`)
      .join('\n');
    
    const fullText = `🛒 Meu Carrinho - MuhlStore\n\n${cartText}\n\nTotal: R$ ${state.total.toFixed(2)}`;

    navigator.clipboard.writeText(fullText);
    toast({
      title: 'Carrinho copiado! 📋',
      description: 'Lista de produtos copiada para a área de transferência',
    });
  };

  const handleShareCart = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Carrinho - MuhlStore',
          text: `Confira os produtos que escolhi na MuhlStore! Total: R$ ${state.total.toFixed(2)}`,
          url: window.location.href,
        });
      } catch (error) {
        // Usuário cancelou ou erro
      }
    } else {
      handleCopyCart();
    }
  };

  const handleSaveCart = () => {
    // Salvar carrinho como lista de desejos
    localStorage.setItem('muhlstore-saved-cart', JSON.stringify(state.itens));
    toast({
      title: 'Carrinho salvo! 💾',
      description: 'Você pode recuperar este carrinho depois',
    });
  };

  const handleMoveToWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('muhlstore-wishlist') || '[]');
    const productIds = state.itens.map(item => item.produto.id);
    
    const newWishlist = [...wishlist, ...productIds.filter(id => !wishlist.includes(id))];
    localStorage.setItem('muhlstore-wishlist', JSON.stringify(newWishlist));
    
    toast({
      title: 'Adicionado aos favoritos! ❤️',
      description: `${state.itens.length} produtos adicionados à lista de desejos`,
    });
  };

  const handleGiftMode = () => {
    toast({
      title: '🎁 Modo Presente Ativado',
      description: 'Opções de embrulho e cartão serão adicionadas no checkout',
    });
  };

  if (state.itens.length === 0) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <p className="text-sm font-medium mb-3">Ações Rápidas</p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyCart}
            className="flex-1 min-w-[120px]"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Lista
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShareCart}
            className="flex-1 min-w-[120px]"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveCart}
            className="flex-1 min-w-[120px]"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMoveToWishlist}
            className="flex-1 min-w-[120px]"
          >
            <Heart className="w-4 h-4 mr-2" />
            Favoritar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGiftMode}
            className="flex-1 min-w-[120px]"
          >
            <Gift className="w-4 h-4 mr-2" />
            É Presente
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CartQuickActions;
