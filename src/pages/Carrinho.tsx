
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import CarrinhoItems from '@/components/loja/CarrinhoItems';
import CarrinhoResumo from '@/components/loja/CarrinhoResumo';
import CarrinhoEncouragement from '@/components/loja/CarrinhoEncouragement';
import CheckoutRapido from '@/components/loja/CheckoutRapido';
import SelosSeguranca from '@/components/loja/SelosSeguranca';
import EnhancedCartIncentives from '@/components/loja/EnhancedCartIncentives';
import CartRecoveryBanner from '@/components/loja/CartRecoveryBanner';
import SmartProductSuggestions from '@/components/loja/SmartProductSuggestions';
import CartAnalytics from '@/components/loja/CartAnalytics';
import CartQuickActions from '@/components/loja/CartQuickActions';
import CartPriceComparison from '@/components/loja/CartPriceComparison';
import CartSaveForLater from '@/components/loja/CartSaveForLater';
import CartCouponCode from '@/components/loja/CartCouponCode';
import CartDeliveryEstimate from '@/components/loja/CartDeliveryEstimate';
// Novas funcionalidades avançadas
import SmartCartAI from '@/components/loja/SmartCartAI';
import CartGamification from '@/components/loja/CartGamification';
import CartAugmentedReality from '@/components/loja/CartAugmentedReality';
import CartRecommendationEngine from '@/components/loja/CartRecommendationEngine';
import CartPerformanceOptimized from '@/components/loja/CartPerformanceOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShoppingBag, ArrowLeft, Loader2, Zap, Brain, Trophy, Camera, Target, Rocket } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useSettings } from '@/contexts/SettingsContext';

const Carrinho = () => {
  const { state } = useCart();
  const [showCheckoutRapido, setShowCheckoutRapido] = useState(false);
  const [activeTab, setActiveTab] = useState('classic');
  const { user } = useCurrentUser() as any;
  const { settings } = useSettings();
  const navigate = useNavigate();
  
  // Scroll para o topo ao carregar a página
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Detectar checkout rápido após login
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isCheckoutRapido = urlParams.get('checkout') === 'rapido';
    
    if (isCheckoutRapido && user && state.itens.length > 0) {
      setShowCheckoutRapido(true);
      // Limpar parâmetro da URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [user, state.itens.length]);

  return (
    <Layout>
      {/* Banner de recuperação de carrinho */}
      <CartRecoveryBanner />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Meu Carrinho</h1>
          <div className="flex gap-2">
            {state.itens.length > 0 && (
              <Button onClick={() => setShowCheckoutRapido(true)} className="flex items-center gap-2">
                <Zap size={16} /> Checkout Rápido
              </Button>
            )}
            <Link to="/loja">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft size={16} /> Continuar Comprando
              </Button>
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-md border p-4 bg-muted/30 flex items-center justify-between text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 px-2 py-0.5 border border-green-200 text-xs">Frete grátis acima de R$ 200</span>
            <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 border border-amber-200 text-xs">PIX 5% OFF</span>
          </div>
          <div className="font-medium">Subtotal: R$ {Number(state.total || 0).toFixed(2)}</div>
        </div>

        {!user && (
          <div className="mb-6 p-4 rounded-md border bg-blue-50 text-blue-900 flex items-center justify-between">
            <div>
              <div className="font-semibold">💡 Dica: Faça login para uma experiência mais rápida</div>
              <div className="text-sm opacity-80">Ou continue como convidado - você pode finalizar a compra sem cadastro!</div>
            </div>
            <div className="flex gap-2">
              <Link to="/auth/login?redirect=/carrinho" className="underline">Entrar</Link>
              <Link to="/auth/cadastro" className="underline">Cadastrar</Link>
            </div>
          </div>
        )}

        {/* Sistema de Abas para diferentes experiências */}
        {state.itens.length > 0 && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="classic" className="flex items-center space-x-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Clássico</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center space-x-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">IA</span>
              </TabsTrigger>
              <TabsTrigger value="gamification" className="flex items-center space-x-2">
                <Trophy className="h-4 w-4" />
                <span className="hidden sm:inline">Gamificação</span>
              </TabsTrigger>
              <TabsTrigger value="ar" className="flex items-center space-x-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">AR</span>
              </TabsTrigger>
              <TabsTrigger value="performance" className="flex items-center space-x-2">
                <Rocket className="h-4 w-4" />
                <span className="hidden sm:inline">Performance</span>
              </TabsTrigger>
            </TabsList>

            {/* Aba Clássica */}
            <TabsContent value="classic">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  {/* Mensagens de incentivo aprimoradas */}
                  <EnhancedCartIncentives
                    cartTotal={state.total}
                    itemCount={state.quantidadeTotal}
                    freeShippingMin={settings.free_shipping_min}
                    pixDiscountPercent={settings.pix_discount_percent}
                  />

                  {state.isLoading ? (
                    <div className="p-6 border rounded-lg bg-muted/30 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Atualizando carrinho...
                    </div>
                  ) : (
                    <CarrinhoItems />
                  )}
                  
                  <CarrinhoEncouragement />
                  
                  {/* Itens salvos para depois */}
                  <CartSaveForLater />
                  
                  {/* Sugestões inteligentes de produtos */}
                  <SmartProductSuggestions cartItems={state.itens} maxSuggestions={4} />
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                  <CarrinhoResumo />
                  
                  {/* Cupom de desconto */}
                  <CartCouponCode />
                  
                  {/* Cálculo de frete */}
                  <CartDeliveryEstimate subtotal={state.total} />
                  
                  {/* Comparação de preços */}
                  <CartPriceComparison
                    subtotal={state.total}
                    pixDiscountPercent={settings.pix_discount_percent}
                    freeShippingMin={settings.free_shipping_min}
                    shippingPrice={settings.shipping_base_price}
                  />
                  
                  {/* Analytics do carrinho */}
                  <CartAnalytics />
                  
                  {/* Ações rápidas */}
                  <CartQuickActions />
                  
                  <SelosSeguranca variant="full" showContact={true} />
                </div>
              </div>
            </TabsContent>

            {/* Aba IA */}
            <TabsContent value="ai">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <SmartCartAI />
                  {state.isLoading ? (
                    <div className="p-6 border rounded-lg bg-muted/30 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Atualizando carrinho...
                    </div>
                  ) : (
                    <CarrinhoItems />
                  )}
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                  <CarrinhoResumo />
                  <CartRecommendationEngine />
                  <CartQuickActions />
                  <SelosSeguranca variant="full" showContact={true} />
                </div>
              </div>
            </TabsContent>

            {/* Aba Gamificação */}
            <TabsContent value="gamification">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <CartGamification />
                  {state.isLoading ? (
                    <div className="p-6 border rounded-lg bg-muted/30 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Atualizando carrinho...
                    </div>
                  ) : (
                    <CarrinhoItems />
                  )}
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                  <CarrinhoResumo />
                  <CartAnalytics />
                  <CartQuickActions />
                  <SelosSeguranca variant="full" showContact={true} />
                </div>
              </div>
            </TabsContent>

            {/* Aba Realidade Aumentada */}
            <TabsContent value="ar">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <CartAugmentedReality />
                  {state.isLoading ? (
                    <div className="p-6 border rounded-lg bg-muted/30 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Atualizando carrinho...
                    </div>
                  ) : (
                    <CarrinhoItems />
                  )}
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                  <CarrinhoResumo />
                  <CartQuickActions />
                  <SelosSeguranca variant="full" showContact={true} />
                </div>
              </div>
            </TabsContent>

            {/* Aba Performance */}
            <TabsContent value="performance">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <CartPerformanceOptimized />
                  {state.isLoading ? (
                    <div className="p-6 border rounded-lg bg-muted/30 flex items-center gap-3">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Atualizando carrinho...
                    </div>
                  ) : (
                    <CarrinhoItems />
                  )}
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                  <CarrinhoResumo />
                  <CartAnalytics />
                  <CartQuickActions />
                  <SelosSeguranca variant="full" showContact={true} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Layout padrão quando carrinho está vazio */}
        {state.itens.length === 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 border rounded-lg bg-muted/30 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Seu carrinho está vazio</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione alguns produtos incríveis para começar sua compra!
                </p>
                <Link to="/loja">
                  <Button>Ver Catálogo</Button>
                </Link>
              </div>
            </div>
            
            <div className="lg:col-span-1 space-y-6">
              <CarrinhoResumo />
              <SelosSeguranca variant="full" showContact={true} />
            </div>
          </div>
        )}

        {/* Seção de destaque das funcionalidades avançadas */}
        {state.itens.length === 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-center mb-8">🚀 Funcionalidades Avançadas do Carrinho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                <Brain className="h-8 w-8 mx-auto text-purple-600 mb-2" />
                <h3 className="font-semibold mb-1">IA Inteligente</h3>
                <p className="text-sm text-muted-foreground">Insights personalizados</p>
              </Card>
              <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                <Trophy className="h-8 w-8 mx-auto text-yellow-600 mb-2" />
                <h3 className="font-semibold mb-1">Gamificação</h3>
                <p className="text-sm text-muted-foreground">Conquistas e níveis</p>
              </Card>
              <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                <Camera className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <h3 className="font-semibold mb-1">Realidade Aumentada</h3>
                <p className="text-sm text-muted-foreground">Visualize em AR</p>
              </Card>
              <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                <Target className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <h3 className="font-semibold mb-1">Recomendações</h3>
                <p className="text-sm text-muted-foreground">IA personalizada</p>
              </Card>
              <Card className="text-center p-4 hover:shadow-lg transition-shadow">
                <Rocket className="h-8 w-8 mx-auto text-red-600 mb-2" />
                <h3 className="font-semibold mb-1">Performance</h3>
                <p className="text-sm text-muted-foreground">Ultra otimizado</p>
              </Card>
            </div>
          </div>
        )}
      </div>
      
      {/* Checkout Rápido */}
      <CheckoutRapido 
        isOpen={showCheckoutRapido} 
        onClose={() => setShowCheckoutRapido(false)}
        variant="page"
      />
    </Layout>
  );
};

export default Carrinho;
