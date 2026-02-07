

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import defaultLogo from '@/assets/muhlstore-mario-starwars-logo.png';
import { Menu, X, ShoppingCart, Settings, Heart, Shield } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import CarrinhoDrawer from '@/components/loja/CarrinhoDrawer';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useAdminDetection } from '@/hooks/useAdminDetection';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { state, toggleCart, setCartOpen } = useCart();
  const [badgeBump, setBadgeBump] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { config } = useHomeConfig();
  const { user, logout } = useCurrentUser();
  const { isAdmin, adminUser } = useAdminDetection();
  const navigate = useNavigate();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';


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
      } catch { }
    };
    load();
    const t = setInterval(load, 60000);
    return () => { active = false; clearInterval(t); };
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 px-6 py-4 transition-all duration-300',
        isScrolled ? 'glass-morphism shadow-md' : 'bg-transparent'
      )}
    >
      <div className="container max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <img
                src={(import.meta as any).env?.VITE_BRAND_LOGO_URL || config.theme.logoUrl || defaultLogo}
                alt="MuhlStore Logo"
                className="h-10 mr-2"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = defaultLogo;
                }}
              />
              <span className="font-bold text-xl tracking-tight text-primary">MuhlStore</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLinks className="text-sm" isAdmin={isAdmin} isLogged={Boolean(user)} />
          </nav>

          {/* Ações à direita: Minha Conta/Login e Carrinho */}
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold relative">
                      {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                      {isAdmin && (
                        <div className="absolute -top-1 -right-1 bg-orange-500 rounded-full p-0.5">
                          <Shield className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <span className="hidden sm:inline text-sm">
                      Minha Conta
                      {isAdmin && <span className="ml-1 text-xs text-orange-600 font-semibold">ADMIN</span>}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    {user?.nome || 'Minha Conta'}
                    {isAdmin && <div className="text-xs text-orange-600 font-semibold">Administrador</div>}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isAdmin && (
                    <>
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          Painel Admin
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
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
              <Link to="/auth/login" className="text-sm hover:underline">Entrar</Link>
            )}

            {/* Favoritos Button */}
            <Link to="/minha-conta?tab=favoritos" aria-label="Favoritos" className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-muted/50">
              <Heart className="h-5 w-5" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {favoritesCount > 99 ? '99+' : favoritesCount}
                </span>
              )}
            </Link>

            {/* Carrinho Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCart}
              className="relative"
              aria-label="Abrir carrinho"
            >
              <ShoppingCart className="h-5 w-5" />
              {state.quantidadeTotal > 0 && (
                <span className={`absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium ${badgeBump ? 'animate-bounce' : ''}`}>
                  {state.quantidadeTotal > 99 ? '99+' : state.quantidadeTotal}
                </span>
              )}
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden focus:outline-none"
            onClick={toggleMenu}
            aria-label="Alternar menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div
        className={cn(
          'fixed inset-0 top-16 glass-morphism md:hidden z-40 transform transition-transform duration-300 ease-in-out',
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <nav className="flex flex-col items-center justify-center h-full space-y-8 text-lg">
          <NavLinks onClick={() => setIsMenuOpen(false)} isAdmin={isAdmin} isLogged={Boolean(user)} />
        </nav>
      </div>

      {/* Carrinho Drawer */}
      <CarrinhoDrawer />
    </header>
  );
};

// Helper component for navigation links
const NavLinks = ({ className, onClick, isAdmin, isLogged }: { className?: string; onClick?: () => void; isAdmin?: boolean; isLogged?: boolean }) => (
  <>
    <Link
      to="/"
      className={cn("hover-lift font-medium text-foreground", className)}
      onClick={onClick}
    >
      Início
    </Link>
    <Link
      to="/colecao"
      className={cn("hover-lift font-medium text-foreground", className)}
      onClick={onClick}
    >
      Coleções
    </Link>
    <Link
      to="/marketplace"
      className={cn("hover-lift font-medium text-foreground", className)}
      onClick={onClick}
    >
      Mercado
    </Link>
    <Link
      to="/loja"
      className={cn("hover-lift font-medium text-foreground", className)}
      onClick={onClick}
    >
      Loja
    </Link>
    <Link
      to="/about"
      className={cn("hover-lift font-medium text-foreground", className)}
      onClick={onClick}
    >
      Sobre
    </Link>
    <Link
      to="/eventos"
      className={cn("hover-lift font-medium text-foreground", className)}
      onClick={onClick}
    >
      Eventos
    </Link>
    {isLogged && (
      <>
        <Link
          to="/minha-conta"
          className={cn("hover-lift font-medium text-foreground", className)}
          onClick={onClick}
        >
          Minha Conta
        </Link>
        <Link
          to="/minha-conta?tab=pedidos"
          className={cn("hover-lift font-medium text-foreground", className)}
          onClick={onClick}
        >
          Meus pedidos
        </Link>
        <Link
          to="/minha-conta?tab=enderecos"
          className={cn("hover-lift font-medium text-foreground", className)}
          onClick={onClick}
        >
          Endereços
        </Link>
      </>
    )}
    {/* Link para painel admin se o usuário for admin */}
    {isAdmin && (
      <Link
        to="/admin"
        className={cn("hover-lift font-medium text-orange-600 hover:text-orange-700 flex items-center gap-1", className)}
        onClick={onClick}
      >
        <Settings className="h-4 w-4" />
        Admin
      </Link>
    )}
    {/* Removido botão duplicado de carrinho para evitar duas entradas no header */}
  </>
);

export default Header;
