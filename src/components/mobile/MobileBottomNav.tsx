import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Heart, 
  User
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';

interface MobileBottomNavProps {
  className?: string;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ className = '' }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cartItems } = useCart();
  const { isAuthenticated, user } = useAuth();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Reduzido para 5 itens principais para melhor UX mobile
  const navItems = [
    {
      id: 'home',
      label: 'Início',
      icon: Home,
      href: '/',
      isActive: location.pathname === '/'
    },
    {
      id: 'search',
      label: 'Buscar',
      icon: Search,
      href: '/buscar',
      isActive: location.pathname.startsWith('/buscar')
    },
    {
      id: 'cart',
      label: 'Carrinho',
      icon: ShoppingCart,
      href: '/carrinho',
      isActive: location.pathname.startsWith('/carrinho'),
      badge: cartItemsCount > 0 ? cartItemsCount.toString() : null
    },
    {
      id: 'wishlist',
      label: 'Favoritos',
      icon: Heart,
      href: '/favoritos',
      isActive: location.pathname.startsWith('/favoritos')
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      href: isAuthenticated ? '/minha-conta' : '/auth/login',
      isActive: location.pathname.startsWith('/minha-conta') || location.pathname.startsWith('/auth/login')
    }
  ];

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(href);
  };

  return (
    <nav 
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg ${className}`}
      style={{ 
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))'
      }}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          
          return (
            <Link
              key={item.id}
              to={item.href}
              className={`flex flex-col items-center justify-center py-2 px-2 min-w-0 flex-1 relative transition-all duration-200 active:scale-95 ${
                isActive 
                  ? 'text-orange-600' 
                  : 'text-gray-500 hover:text-orange-600'
              }`}
            >
              {/* Icon with badge */}
              <div className="relative">
                <Icon 
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'text-orange-600 scale-110' : 'text-gray-500'
                  }`} 
                />
                
                {/* Badge */}
                {item.badge && (
                  <Badge 
                    className={`absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center text-xs px-1.5 font-bold shadow-lg ${
                      item.badge === 'HOT' 
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white' 
                        : 'bg-gradient-to-r from-orange-600 to-pink-600 text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-xs mt-1 truncate max-w-full font-medium ${
                isActive ? 'text-orange-600' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-10 h-1 bg-gradient-to-r from-orange-600 to-pink-600 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
