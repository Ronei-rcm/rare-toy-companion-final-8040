import React from 'react';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  Heart, 
  User,
  Package,
  Star,
  Gift,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  className?: string;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ className = '' }) => {
  const location = useLocation();
  const { cartItems } = useCart();
  const { isAuthenticated, user } = useAuth();

  const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0);

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
      id: 'categories',
      label: 'Categorias',
      icon: Package,
      href: '/categorias',
      isActive: location.pathname.startsWith('/categorias')
    },
    {
      id: 'offers',
      label: 'Ofertas',
      icon: Star,
      href: '/ofertas',
      isActive: location.pathname.startsWith('/ofertas'),
      badge: 'HOT'
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
      id: 'notifications',
      label: 'Notificações',
      icon: Bell,
      href: '/notificacoes',
      isActive: location.pathname.startsWith('/notificacoes'),
      badge: '3'
    },
    {
      id: 'profile',
      label: 'Perfil',
      icon: User,
      href: isAuthenticated ? '/minha-conta' : '/login',
      isActive: location.pathname.startsWith('/minha-conta') || location.pathname.startsWith('/login')
    }
  ];

  const handleNavClick = (href: string) => {
    window.location.href = href;
  };

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg ${className}`}>
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.href)}
              className={`flex flex-col items-center justify-center py-2 px-1 min-w-0 flex-1 relative transition-colors duration-200 ${
                isActive 
                  ? 'text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {/* Icon with badge */}
              <div className="relative">
                <Icon 
                  className={`w-5 h-5 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`} 
                />
                
                {/* Badge */}
                {item.badge && (
                  <Badge 
                    className={`absolute -top-2 -right-2 h-4 min-w-4 flex items-center justify-center text-xs px-1 ${
                      item.badge === 'HOT' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </div>
              
              {/* Label */}
              <span className={`text-xs mt-1 truncate max-w-full ${
                isActive ? 'text-blue-600 font-medium' : 'text-gray-500'
              }`}>
                {item.label}
              </span>
              
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Safe area for devices with home indicator */}
      <div className="h-1 bg-gray-100" />
    </nav>
  );
};

export default MobileBottomNav;
