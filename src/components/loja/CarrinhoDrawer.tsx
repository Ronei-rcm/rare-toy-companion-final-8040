import React, { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Loader2, Zap } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/hooks/use-toast';
import { Link, useNavigate } from 'react-router-dom';
import CheckoutRapido from './CheckoutRapido';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useSettings } from '@/contexts/SettingsContext';
import CartLoadingOverlay from './CartLoadingOverlay';
import OptimizedProductImage from '@/components/ui/OptimizedProductImage';

const CarrinhoDrawer = () => {
  const { state, removeItem, updateQuantity, toggleCart, setCartOpen } = useCart();
  const { user } = useCurrentUser();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showCheckoutRapido, setShowCheckoutRapido] = useState(false);

  const handleRemoveItem = (id: string) => {
    removeItem(id);
  };

  const handleUpdateQuantity = (id: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      handleRemoveItem(id);
      return;
    }
    updateQuantity(id, novaQuantidade);
  };

  const handleFinalizarCompra = () => {
    setCartOpen(false);
    toast({
      title: 'Redirecionando...',
      description: 'Você será direcionado para a página de checkout.',
    });
  };

  const handleCheckoutRapido = () => {
    if (!user) {
      toggleCart();
      navigate('/auth/login?redirect=/carrinho&checkout=rapido');
    } else {
      setShowCheckoutRapido(true);
    }
  };

  return (
    <Drawer open={state.isOpen} onOpenChange={setCartOpen}>
      <DrawerContent className="max-h-[85vh] sm:max-h-[80vh]">
        <DrawerHeader className="border-b bg-gradient-to-r from-muted/40 to-transparent">
          <DrawerTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" aria-hidden="true" />
            <span>Meu Carrinho</span>
            <span className="sr-only">com {state.quantidadeTotal} {state.quantidadeTotal === 1 ? 'item' : 'itens'}</span>
            <span aria-live="polite" className="text-sm font-normal text-muted-foreground">
              ({state.quantidadeTotal} {state.quantidadeTotal === 1 ? 'item' : 'itens'})
            </span>
          </DrawerTitle>
          <DrawerDescription className="flex justify-between items-center">
            <span>Resumo do pedido e itens adicionados.</span>
            <span className="hidden sm:inline text-xs text-muted-foreground">PIX 5% OFF • Frete grátis a partir de R$ 200</span>
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4 relative">
          <CartLoadingOverlay 
            isLoading={state.isLoading} 
            message="Atualizando carrinho..." 
          />
          {state.itens.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Seu carrinho está vazio</h3>
              <p className="text-muted-foreground mb-4">
                Que tal adicionar alguns brinquedos incríveis?
              </p>
              <Button onClick={toggleCart} asChild>
                <Link to="/loja">
                  Ver Produtos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Banner de benefícios */}
              <div className="rounded-md border p-3 bg-muted/40 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 border border-green-200">
                    Frete grátis acima de R$ {settings.free_shipping_min.toFixed(2)}
                  </span>
                  <span className="hidden sm:inline text-muted-foreground">Pague com PIX e ganhe {settings.pix_discount_percent}% OFF</span>
                </div>
                <div className="font-medium">Subtotal: R$ {state.total.toFixed(2)}</div>
              </div>
              {state.itens.map((item, index) => {
                const produto = item.produto;
                
                return (
                  <div key={item.id}>
                    <div className="flex gap-3">
                      {/* Imagem do produto */}
                      <div className="w-16 h-16 flex-shrink-0">
                        <OptimizedProductImage
                          produto={produto}
                          alt={produto.nome}
                          className="rounded-md border"
                          aspectRatio={1}
                          showSkeleton={true}
                        />
                      </div>

                      {/* Informações do produto */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{produto.nome}</h4>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {produto.categoria && (
                            <span className="text-[10px] bg-muted px-1 py-0.5 rounded text-muted-foreground">
                              {produto.categoria}
                            </span>
                          )}
                          {produto.cor && (
                            <span className="text-[10px] text-muted-foreground">• {produto.cor}</span>
                          )}
                        </div>
                      
                        <div className="flex items-center justify-between mt-2">
                          {/* Controles de quantidade */}
                          <div className="flex items-center gap-1" role="group" aria-label={`Controles de quantidade para ${produto.nome}`}>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleUpdateQuantity(item.id, item.quantidade - 1)}
                              disabled={state.isLoading || item.quantidade <= 1}
                              aria-label={`Diminuir quantidade de ${produto.nome}`}
                            >
                              <Minus className="h-3 w-3" aria-hidden="true" />
                            </Button>
                            <span 
                              className="text-sm w-6 text-center font-medium" 
                              aria-label={`Quantidade atual: ${item.quantidade}`}
                              role="status"
                            >
                              {item.quantidade}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleUpdateQuantity(item.id, item.quantidade + 1)}
                              disabled={state.isLoading}
                              aria-label={`Aumentar quantidade de ${produto.nome}`}
                            >
                              <Plus className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </div>

                          {/* Preço */}
                          <div className="text-right min-w-[80px]">
                            <div className="font-medium text-sm">
                              R$ {(produto.preco * item.quantidade).toFixed(2)}
                            </div>
                            {produto.estoque !== undefined && produto.estoque <= 5 && produto.estoque > 0 && (
                              <div className="text-[10px] text-amber-600">Estoque baixo</div>
                            )}
                            {produto.estoque === 0 && (
                              <div className="text-[10px] text-destructive">Sem estoque</div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Botão remover */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={state.isLoading}
                        aria-label={`Remover ${produto.nome} do carrinho`}
                        title="Remover item"
                      >
                        <Trash2 className="h-3 w-3" aria-hidden="true" />
                      </Button>
                    </div>
                    
                    {index < state.itens.length - 1 && <Separator className="my-3" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {state.itens.length > 0 && (
          <>
            <Separator />
            <DrawerFooter className="space-y-3 bg-muted/20">
              {/* Resumo do pedido */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-sm">
                  <span>Subtotal</span>
                  <span>R$ {state.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Frete</span>
                  <span>{state.total > settings.free_shipping_min ? 'Grátis' : `R$ ${settings.shipping_base_price.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total</span>
                  <span>
                    R$ {(state.total + (state.total > settings.free_shipping_min ? 0 : settings.shipping_base_price)).toFixed(2)}
                  </span>
                </div>
              </div>
              {!user && (
                <div className="p-3 rounded-md border bg-amber-50 text-amber-900 text-sm flex items-center justify-between">
                  <span>Faça login para finalizar a compra</span>
                  <div className="flex gap-2">
                    <Link to="/auth/login?redirect=/carrinho" onClick={toggleCart} className="underline">Entrar</Link>
                    <Link to="/auth/cadastro" onClick={toggleCart} className="underline">Cadastrar</Link>
                  </div>
                </div>
              )}
              {state.isLoading && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Atualizando carrinho...
                </div>
              )}

              {/* Botões de ação */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button variant="outline" onClick={toggleCart} className="flex-1" disabled={state.isLoading}>
                    Continuar Comprando
                  </Button>
                  <Button onClick={handleCheckoutRapido} className="flex-1" disabled={state.isLoading}>
                    <Zap className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span className="hidden sm:inline">Checkout Rápido</span>
                    <span className="sm:hidden">Rápido</span>
                  </Button>
                </div>
                <Button onClick={() => {
                  if (!user) {
                    toggleCart();
                    navigate('/auth/login?redirect=/carrinho');
                  } else {
                    handleFinalizarCompra();
                  }
                }} variant="secondary" className="w-full" disabled={state.isLoading}>
                  Finalizar Compra Completa
                </Button>
              </div>

              {state.total > 0 && (
                <div className="text-xs text-muted-foreground text-center">
                  Pagando com PIX: economize R$ {(state.total * (settings.pix_discount_percent/100)).toFixed(2)}
                </div>
              )}

              <Button variant="link" asChild className="text-sm">
                <Link to="/carrinho" onClick={toggleCart}>
                  Ver carrinho completo
                  <ArrowRight className="h-3 w-3 ml-1" />
                </Link>
              </Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
      
      {/* Checkout Rápido */}
      <CheckoutRapido 
        isOpen={showCheckoutRapido} 
        onClose={() => setShowCheckoutRapido(false)}
        variant="drawer"
      />
    </Drawer>
  );
};

export default CarrinhoDrawer;
