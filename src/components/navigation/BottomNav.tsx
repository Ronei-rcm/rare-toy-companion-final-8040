import { Home, Package, ShoppingCart, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

const BottomNav = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const navItems = [
        { icon: Home, label: 'Início', path: '/' },
        { icon: Package, label: 'Coleções', path: '/colecoes' },
        { icon: ShoppingCart, label: 'Carrinho', path: '/carrinho' },
        { icon: User, label: 'Conta', path: '/minha-conta' },
    ];

    const isActive = (path: string) => {
        if (path === '/') {
            return location.pathname === '/';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-50 md:hidden">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                                active ? "text-primary" : "text-gray-500"
                            )}
                        >
                            <Icon className={cn("w-6 h-6 mb-1", active && "fill-current")} />
                            <span className="text-xs font-medium">{item.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
