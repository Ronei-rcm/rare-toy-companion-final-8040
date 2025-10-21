import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart,
  Truck,
  Tag,
  Settings,
  LogOut,
  X,
  MessageCircle,
  Instagram,
  Calendar,
  Layers,
  Info,
  Mail,
  DollarSign,
  TestTube,
  UserCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminMobileMenu } from '@/hooks/useAdminMobileMenu';

export function AdminMobileMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isOpen, closeMenu } = useAdminMobileMenu();

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Produtos', href: '/admin/produtos', icon: Package },
    { name: 'Coleções', href: '/admin/colecoes', icon: Layers },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Eventos', href: '/admin/eventos', icon: Calendar },
    { name: 'Funcionários', href: '/admin/funcionarios', icon: UserCheck },
    { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign },
    { name: 'Página Sobre', href: '/admin/sobre', icon: Info },
    { name: 'Home Config', href: '/admin/home-config', icon: Settings },
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings },
    { name: 'WhatsApp Grupos', href: '/admin/whatsapp-grupos', icon: MessageCircle },
    { name: 'Instagram', href: '/admin/instagram', icon: Instagram },
    { name: 'Recuperação', href: '/admin/recuperacao', icon: Mail },
    { name: 'Análises', href: '/admin/analises', icon: BarChart },
    { name: 'Fornecedores', href: '/admin/fornecedores', icon: Truck },
    { name: 'Promoções', href: '/admin/promocoes', icon: Tag },
    { name: 'Teste', href: '/admin/teste', icon: TestTube },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/80" onClick={closeMenu} />
      
      {/* Menu */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white animate-in slide-in-from-left">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b">
          <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={closeMenu}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                location.pathname === item.href
                  ? "bg-blue-100 text-blue-900 border border-blue-200"
                  : "text-gray-700 hover:bg-gray-100"
              )}
              onClick={closeMenu}
            >
              <item.icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        
        {/* Footer com perfil e logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
          <div className="flex items-center mb-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src="" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Admin</p>
              <p className="text-xs text-gray-500">admin@exemplo.com</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full text-sm border-gray-300 hover:bg-gray-100"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </aside>
    </div>
  );
}
