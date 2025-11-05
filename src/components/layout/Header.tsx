import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import defaultLogo from '@/assets/muhlstore-mario-starwars-logo.png';
import { 
  Menu, 
  X, 
  ShoppingCart, 
  Settings, 
  Heart,
  Home,
  Store,
  Layers,
  TrendingUp,
  Calendar,
  Info,
  Headphones,
  Clock,
  Gift,
  User,
  Shield
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CarrinhoDrawer from '@/components/loja/CarrinhoDrawer';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import EmailNotifications from './EmailNotifications';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showTopBar, setShowTopBar] = useState(() => {
    // Recuperar do localStorage ou mostrar por padrão
    const saved = localStorage.getItem('showTopBar');
    return saved !== null ? saved === 'true' : true;
  });
  const { state, toggleCart, setCartOpen } = useCart();
  const [badgeBump, setBadgeBump] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { config } = useHomeConfig();
  const { user, logout } = useCurrentUser();
  const navigate = useNavigate();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  
  // Verificar se o usuário é admin
  const isAdmin = user?.id === '1' || user?.email === 'admin@exemplo.com' || 
                  localStorage.getItem('admin_token') !== null;

  // Função para fechar a barra
  const handleCloseTopBar = () => {
    setShowTopBar(false);
    localStorage.setItem('showTopBar', 'false');
  };

  useEffect(() => {
    if (state.quantidadeTotal > 0) {
      setBadgeBump(true);
      const t = setTimeout(() => setBadgeBump(false), 300);
      return () => clearTimeout(t);
    }
  }, [state.quantidadeTotal]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
      toast.success('Você saiu da conta');
    } catch (error) {
      toast.error('Erro ao sair da conta');
    }
  };

  // Contagem de favoritos (atualização leve)
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/favorites`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setFavoritesCount(Array.isArray(data) ? data.length : 0);
      } catch {}
    };
    load();
    const t = setInterval(load, 60000);
    return () => { active = false; clearInterval(t); };
  }, []);

  // Ajustar padding-top do body baseado na visibilidade da barra
  useEffect(() => {
    const paddingTop = showTopBar ? '112px' : '72px'; // 40px barra + 72px header | só 72px header
    document.documentElement.style.setProperty('--header-height', paddingTop);
  }, [showTopBar]);

  return (
    <>
      {/* Barra de Anúncios Laranja no Topo - PODE FECHAR */}
      {showTopBar && (
        <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 text-white py-2 px-6 fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
          <div className="container max-w-7xl mx-auto flex items-center justify-between text-sm">
            {/* Conteúdo da barra */}
            <div className="flex items-center gap-6 flex-wrap justify-center flex-1">
              {state.quantidadeTotal > 0 && (
                <button 
                  onClick={() => setCartOpen(true)}
                  className="flex items-center gap-2 hover:text-orange-100 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="font-medium hidden sm:inline">Você esqueceu itens no carrinho!</span>
                  <span className="font-medium sm:hidden">Carrinho com itens!</span>
                </button>
              )}
              
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Há {new Date().getHours()}h</span>
              </div>
              
              <div className="flex items-center gap-2 font-semibold">
                <Gift className="w-4 h-4" />
                <span className="hidden sm:inline">Ganhe 10% OFF</span>
                <span className="sm:hidden">10% OFF</span>
              </div>
            </div>

            {/* Botão Fechar */}
            <button
              onClick={handleCloseTopBar}
              className="ml-4 p-1 hover:bg-orange-600/50 rounded transition-colors flex-shrink-0"
              aria-label="Fechar barra de anúncios"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header Principal */}
      <header 
        className={cn(
          'fixed left-0 right-0 z-40 px-3 sm:px-6 py-3 transition-all duration-300 bg-white border-b',
          showTopBar ? 'mt-10' : 'mt-0',
          isScrolled ? 'shadow-md' : ''
        )}
      >
        <div className="container max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-2">
            {/* Botão Menu Mobile - Primeiro (esquerda) */}
            <button 
              className="lg:hidden p-2 hover:bg-muted rounded-md flex-shrink-0 order-first"
              onClick={toggleMenu}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Logo - Centralizado no mobile, esquerda no desktop */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0 min-w-0 flex-1 lg:flex-none justify-center lg:justify-start">
              <div className="flex items-center gap-1 sm:gap-2">
                <img 
                  src={(import.meta as any).env?.VITE_BRAND_LOGO_URL || config.theme.logoUrl || defaultLogo} 
                  alt="MuhlStore Logo" 
                  className="h-8 sm:h-10 flex-shrink-0"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = defaultLogo;
                  }}
                />
                {/* Texto "MuhlStore" - oculto em telas muito pequenas para evitar sobreposição */}
                <span className="font-bold text-base sm:text-xl tracking-tight bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent hidden sm:inline-block">
                  MuhlStore
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1 flex-1">
              <NavLinks isAdmin={isAdmin} isLogged={Boolean(user)} />
            </nav>

            {/* Ações à direita: Conta, Favoritos, Carrinho */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">

              {/* Usuário/Login */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white hover:opacity-90 transition-opacity flex-shrink-0">
                      <User className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.nome || 'Minha Conta'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/minha-conta">Visão geral</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/minha-conta?tab=pedidos">Meus pedidos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/minha-conta?tab=favoritos">Favoritos</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Sair</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link 
                  to="/auth/login" 
                  className="relative inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-orange-500 text-orange-500 hover:bg-orange-50 transition-colors flex-shrink-0"
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              )}
            
              {/* Favoritos */}
              <Link 
                to="/minha-conta?tab=favoritos" 
                aria-label="Favoritos" 
                className="relative inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
              >
                <Heart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-lg text-[10px] sm:text-xs">
                    {favoritesCount > 9 ? '9+' : favoritesCount}
                  </span>
                )}
              </Link>

              {/* Acesso Admin - Ícone discreto */}
              <Link 
                to="/admin" 
                aria-label="Área Administrativa" 
                title="Acesso Admin"
                className="relative inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-md hover:bg-orange-50 transition-colors group flex-shrink-0"
              >
                <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
              </Link>

              {/* Notificações de E-mail (apenas para admins) */}
              {isAdmin && <EmailNotifications />}

              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Carrinho */}
              <button
                onClick={() => setCartOpen(true)}
                className="relative inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-md hover:bg-muted/50 transition-colors flex-shrink-0"
                aria-label="Carrinho de compras"
              >
                <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                {state.quantidadeTotal > 0 && (
                  <span 
                    className={cn(
                      "absolute -top-1 -right-1 bg-gradient-to-r from-orange-600 to-red-600 text-white text-xs rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center font-bold shadow-lg text-[10px] sm:text-xs",
                      badgeBump && "animate-bounce"
                    )}
                  >
                    {state.quantidadeTotal > 9 ? '9+' : state.quantidadeTotal}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t pt-4">
            <nav className="flex flex-col space-y-2">
              <NavLinks 
                className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors" 
                onClick={toggleMenu}
                isAdmin={isAdmin}
                isLogged={Boolean(user)}
              />
            </nav>
          </div>
        )}
      </header>

      {/* Carrinho Drawer */}
      <CarrinhoDrawer />
    </>
  );
};

// Helper component for navigation links - MENU COM ÍCONES
const NavLinks = ({ className, onClick, isAdmin, isLogged }: { className?: string; onClick?: () => void; isAdmin?: boolean; isLogged?: boolean }) => (
  <>
    {/* Links Principais do Site com Ícones */}
    <Link 
      to="/" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <Home className="w-4 h-4" />
      <span>Início</span>
    </Link>
    
    <Link 
      to="/loja" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <Store className="w-4 h-4" />
      <span>Loja</span>
    </Link>
    
    <Link 
      to="/colecao" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <Layers className="w-4 h-4" />
      <span>Coleções</span>
    </Link>
    
    <Link 
      to="/marketplace" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <TrendingUp className="w-4 h-4" />
      <span>Mercado</span>
    </Link>
    
    <Link 
      to="/eventos" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <Calendar className="w-4 h-4" />
      <span>Eventos</span>
    </Link>
    
    <Link 
      to="/about" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <Info className="w-4 h-4" />
      <span>Sobre</span>
    </Link>
    
    <Link 
      to="/suporte" 
      className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-foreground hover:bg-orange-50 hover:text-orange-600 transition-all", className)} 
      onClick={onClick}
    >
      <Headphones className="w-4 h-4" />
      <span>Suporte</span>
    </Link>
    
    {/* Link Admin - APENAS SE FOR ADMIN */}
    {isAdmin && (
      <Link 
        to="/admin" 
        className={cn("group flex items-center gap-2 px-3 py-2 rounded-md font-medium text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-all", className)} 
        onClick={onClick}
      >
        <Settings className="w-4 h-4" />
        <span className="font-semibold">Admin</span>
      </Link>
    )}
  </>
);

export default Header;
