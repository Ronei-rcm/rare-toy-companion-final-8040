import React, { useState, useEffect } from 'react';
import { 
  Menu, 
  Search, 
  ShoppingCart, 
  User, 
  Heart, 
  Bell,
  ChevronLeft,
  ChevronRight,
  X,
  Home,
  Package,
  Star,
  Gift,
  Phone,
  Mail,
  Settings
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

interface MobileHeaderProps {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  showCart?: boolean;
  showUser?: boolean;
  showWishlist?: boolean;
  showNotifications?: boolean;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({
  title = "MuhlStore",
  showBack = false,
  onBack,
  showSearch = true,
  onSearch,
  showCart = true,
  showUser = true,
  showWishlist = true,
  showNotifications = true
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isPWA, setIsPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  const { cartItems } = useCart();
  const { user, isAuthenticated } = useAuth();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    // Detectar scroll
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Detectar se é PWA
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true;
    setIsPWA(isPWAMode);

    // Detectar prompt de instalação
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    });

    // Detectar se foi instalado
    window.addEventListener('appinstalled', () => {
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    });
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
    setIsSearchOpen(false);
  };

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA instalado');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const menuItems = [
    { icon: Home, label: 'Início', href: '/' },
    { icon: Package, label: 'Produtos', href: '/produtos' },
    { icon: Star, label: 'Ofertas', href: '/ofertas' },
    { icon: Gift, label: 'Cupons', href: '/cupons' },
    { icon: Heart, label: 'Favoritos', href: '/favoritos' },
    { icon: Phone, label: 'Contato', href: '/contato' },
    { icon: Mail, label: 'Suporte', href: '/suporte' },
    { icon: Settings, label: 'Admin', href: '/admin' }
  ];

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200' 
          : 'bg-white shadow-sm'
      }`}>
        <div className="flex items-center justify-between px-4 py-3 h-16">
          {/* Menu Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(true)}
            className="p-2"
          >
            <Menu className="w-6 h-6" />
          </Button>

          {/* Title */}
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-900 truncate">
              {showBack ? (
                <button
                  onClick={onBack}
                  className="flex items-center justify-center gap-2 hover:text-blue-600 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  {title}
                </button>
              ) : (
                title
              )}
            </h1>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1">
            {/* Search */}
            {showSearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(true)}
                className="p-2"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {/* Notifications */}
            {showNotifications && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 relative"
              >
                <Bell className="w-5 h-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                >
                  3
                </Badge>
              </Button>
            )}

            {/* Wishlist */}
            {showWishlist && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <Heart className="w-5 h-5" />
              </Button>
            )}

            {/* Cart */}
            {showCart && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2 relative"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartItemsCount > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs"
                  >
                    {cartItemsCount}
                  </Badge>
                )}
              </Button>
            )}

            {/* User */}
            {showUser && (
              <Button
                variant="ghost"
                size="sm"
                className="p-2"
              >
                <User className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>

        {/* Install PWA Prompt */}
        {showInstallPrompt && !isPWA && (
          <div className="bg-blue-600 text-white px-4 py-2 text-center">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                📱 Instale o app para uma melhor experiência
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleInstallPWA}
                  className="text-xs"
                >
                  Instalar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowInstallPrompt(false)}
                  className="text-white hover:bg-blue-700 text-xs p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white p-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar produtos..."
                className="flex-1"
                autoFocus
              />
              <Button type="submit" size="sm">
                <Search className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsSearchOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="bg-white h-full w-80 max-w-[85vw] shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Menu</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            <div className="p-4">
              {/* User Info */}
              {isAuthenticated && user && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Menu Items */}
              <nav className="space-y-2">
                {menuItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">{item.label}</span>
                  </a>
                ))}
              </nav>

              {/* PWA Install Button */}
              {showInstallPrompt && !isPWA && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-lg">📱</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Instalar App</p>
                      <p className="text-sm text-gray-600">Melhor experiência mobile</p>
                    </div>
                  </div>
                  <Button
                    onClick={handleInstallPWA}
                    className="w-full"
                    size="sm"
                  >
                    Instalar Agora
                  </Button>
                </div>
              )}

              {/* Offline Status */}
              <div className="mt-6 p-3 bg-gray-100 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    navigator.onLine ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm text-gray-600">
                    {navigator.onLine ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-16" />
    </>
  );
};

export default MobileHeader;
