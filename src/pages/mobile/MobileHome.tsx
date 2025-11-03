import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  Zap,
  Gift,
  TrendingUp,
  Filter,
  Grid,
  List,
  ChevronRight,
  Play,
  Pause,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import MobileHeader from '@/components/mobile/MobileHeader';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import MobileBottomNav from '@/components/mobile/MobileBottomNav';
import PWAInstallPrompt from '@/components/mobile/PWAInstallPrompt';
import OfflineIndicator from '@/components/mobile/OfflineIndicator';
import { usePWA } from '@/hooks/usePWA';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

interface Product {
  id: string;
  nome: string;
  preco: number;
  preco_original?: number;
  imagem: string;
  categoria: string;
  marca: string;
  avaliacao: number;
  total_avaliacoes: number;
  estoque: number;
  is_favorito?: boolean;
  is_oferta?: boolean;
  desconto_percentual?: number;
  frete_gratis?: boolean;
  entrega_rapida?: boolean;
  garantia?: string;
}

interface Banner {
  id: string;
  titulo: string;
  subtitulo: string;
  imagem: string;
  link: string;
  cor_fundo: string;
  is_ativo: boolean;
}

const MobileHome: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isBannerAutoPlay, setIsBannerAutoPlay] = useState(true);

  const { isOnline, isInstallable, isInstalled } = usePWA();
  const { cartItems } = useCart();
  const { isAuthenticated, user } = useAuth();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Auto-play banners
    if (isBannerAutoPlay && banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [isBannerAutoPlay, banners.length]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carregar produtos
      const productsResponse = await fetch('/api/produtos?limit=20');
      const productsData = await productsResponse.json();
      if (productsData.success) {
        setProducts(productsData.data);
      }

      // Carregar banners
      const bannersResponse = await fetch('/api/banners');
      const bannersData = await bannersResponse.json();
      if (bannersData.success) {
        setBanners(bannersData.data);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Implementar busca
    window.location.href = `/buscar?q=${encodeURIComponent(query)}`;
  };

  const handleBannerClick = (banner: Banner) => {
    window.location.href = banner.link;
  };

  const nextBanner = () => {
    setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
  };

  const prevBanner = () => {
    setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const toggleBannerAutoPlay = () => {
    setIsBannerAutoPlay(!isBannerAutoPlay);
  };

  const categories = [
    { id: '1', nome: 'Brinquedos Raros', icone: '🎯', cor: 'bg-red-500' },
    { id: '2', nome: 'Colecionáveis', icone: '🏆', cor: 'bg-blue-500' },
    { id: '3', nome: 'Vintage', icone: '🕰️', cor: 'bg-green-500' },
    { id: '4', nome: 'Exclusivos', icone: '💎', cor: 'bg-purple-500' },
    { id: '5', nome: 'Promoções', icone: '🔥', cor: 'bg-orange-500' },
    { id: '6', nome: 'Novidades', icone: '✨', cor: 'bg-pink-500' }
  ];

  const features = [
    { icone: Truck, titulo: 'Frete Grátis', descricao: 'Acima de R$ 100' },
    { icone: Shield, titulo: 'Garantia', descricao: '30 dias' },
    { icone: Zap, titulo: 'Entrega Rápida', descricao: 'Até 24h' },
    { icone: Gift, titulo: 'Presente', descricao: 'Embalagem especial' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MobileHeader />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <OfflineIndicator />
      
      <MobileHeader 
        onSearch={handleSearch}
        showSearch={true}
        showCart={true}
        showUser={true}
        showWishlist={true}
        showNotifications={true}
      />

      <main className="pb-20">
        {/* Search Bar */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar brinquedos raros..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-base"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
            />
          </div>
        </div>

        {/* Banners Carousel */}
        {banners.length > 0 && (
          <div className="relative bg-white">
            <div className="relative h-48 overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
              >
                {banners.map((banner, index) => (
                  <div
                    key={banner.id}
                    className="w-full h-full flex-shrink-0 relative cursor-pointer"
                    onClick={() => handleBannerClick(banner)}
                  >
                    <img
                      src={banner.imagem}
                      alt={banner.titulo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-center text-white p-4">
                        <h2 className="text-xl font-bold mb-2">{banner.titulo}</h2>
                        <p className="text-sm opacity-90">{banner.subtitulo}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Banner Controls */}
            <div className="absolute top-2 right-2 flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={toggleBannerAutoPlay}
                className="w-8 h-8 p-0 rounded-full bg-white/90"
              >
                {isBannerAutoPlay ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Banner Navigation */}
            {banners.length > 1 && (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={prevBanner}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 rounded-full bg-white/90"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={nextBanner}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 rounded-full bg-white/90"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {/* Banner Dots */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBannerIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentBannerIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Categories */}
        <div className="p-4 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Categorias</h2>
            <Button variant="ghost" size="sm">
              Ver todas
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex flex-col items-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className={`w-12 h-12 ${category.cor} rounded-full flex items-center justify-center text-white text-xl mb-2`}>
                  {category.icone}
                </div>
                <span className="text-xs font-medium text-gray-700 text-center">
                  {category.nome}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <feature.icone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{feature.titulo}</p>
                  <p className="text-xs text-gray-600">{feature.descricao}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Products Section */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Produtos em Destaque</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : ''}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-blue-100 text-blue-600' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-4">
              {products.slice(0, 6).map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  variant="default"
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {products.slice(0, 6).map((product) => (
                <MobileProductCard
                  key={product.id}
                  product={product}
                  variant="compact"
                />
              ))}
            </div>
          )}

          <div className="mt-4 text-center">
            <Button variant="outline" className="w-full">
              Ver Mais Produtos
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Ofertas Especiais */}
        <div className="p-4 bg-gradient-to-r from-red-50 to-orange-50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">🔥 Ofertas Especiais</h2>
            <Badge className="bg-red-500 text-white">LIMITADO</Badge>
          </div>

          <div className="space-y-3">
            {products.filter(p => p.is_oferta).slice(0, 3).map((product) => (
              <MobileProductCard
                key={product.id}
                product={product}
                variant="featured"
              />
            ))}
          </div>
        </div>

        {/* Newsletter */}
        <div className="p-4 bg-blue-600 text-white">
          <div className="text-center">
            <h3 className="text-lg font-bold mb-2">📧 Receba Ofertas Exclusivas</h3>
            <p className="text-sm opacity-90 mb-4">
              Cadastre-se e receba as melhores ofertas em brinquedos raros
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Seu e-mail"
                className="flex-1 bg-white/20 border-white/30 text-white placeholder:text-white/70"
              />
              <Button className="bg-white text-blue-600 hover:bg-gray-100">
                Cadastrar
              </Button>
            </div>
          </div>
        </div>
      </main>

      <MobileBottomNav />

      {/* PWA Install Prompt */}
      {isInstallable && !isInstalled && (
        <PWAInstallPrompt showOnDelay={3000} />
      )}
    </div>
  );
};

export default MobileHome;
