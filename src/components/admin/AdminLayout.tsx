import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  Menu,
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
  Clock,
  TrendingUp,
  Shield,
  BookOpen,
  FolderTree
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Limpar dados de admin do localStorage
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    // Redirecionar para a página de login admin
    navigate('/admin/login');
  };

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Produtos', href: '/admin/produtos', icon: Package },
    { name: 'Categorias', href: '/admin/categorias', icon: FolderTree },
    { name: 'Coleções', href: '/admin/colecoes', icon: Layers },
    { name: 'Blog & Notícias', href: '/admin/blog', icon: BookOpen },
    { name: 'Marketplace', href: '/admin/marketplace', icon: Users },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart },
    { name: 'Pedidos Evolved', href: '/admin/pedidos-evolved', icon: TrendingUp },
    { name: 'Clientes', href: '/admin/clientes', icon: Users },
    { name: 'Eventos', href: '/admin/eventos', icon: Calendar },
    { name: 'Funcionários', href: '/admin/funcionarios', icon: UserCheck },
    { name: 'Usuários Admin', href: '/admin/usuarios', icon: Shield },
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

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Botão do menu mobile - fixo no topo */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar para desktop */}
      <aside 
        className={cn(
          "fixed inset-y-0 z-50 flex flex-col bg-sidebar border-r border-sidebar-border shadow-md transition-all duration-300 md:left-0",
          sidebarOpen ? "w-64" : "w-20",
          "hidden md:flex"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          <div className={cn("overflow-hidden", !sidebarOpen && "invisible w-0")}>
            <h2 className="text-xl font-bold text-sidebar-foreground">Admin Panel</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-5 w-5 text-sidebar-foreground" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 py-2">
          <nav className="px-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === item.href
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  !sidebarOpen && "justify-center"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", sidebarOpen && "mr-3")} />
                {sidebarOpen && <span>{item.name}</span>}
              </Link>
            ))}
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn(
            "flex items-center",
            !sidebarOpen && "justify-center"
          )}>
            <Avatar className="h-9 w-9">
              <AvatarImage src="" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="ml-3">
                <p className="text-sm font-medium text-sidebar-foreground">Admin</p>
                <p className="text-xs text-muted-foreground">admin@exemplo.com</p>
              </div>
            )}
          </div>
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className={cn(
                "w-full text-sm border-sidebar-border hover:bg-sidebar-accent",
                !sidebarOpen && "px-0 justify-center"
              )}
            >
              <LogOut className="h-4 w-4 mr-2" />
              {sidebarOpen && "Sair"}
            </Button>
          </div>
        </div>
      </aside>

      {/* Sidebar para mobile */}
      <div className="md:hidden">
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80" onClick={() => setMobileMenuOpen(false)}>
            <aside className="fixed inset-y-0 left-0 w-64 bg-white animate-in slide-in-from-left">
              <div className="p-4 flex items-center justify-between border-b">
                <h2 className="text-xl font-bold text-gray-900">Admin Panel</h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <nav className="px-2 py-4 space-y-2">
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
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5 mr-3" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        )}
      </div>

      {/* Conteúdo principal */}
      <main className={cn(
        "flex-1 transition-all duration-300",
        sidebarOpen ? "md:ml-64" : "md:ml-20"
      )}>
        <div className="min-h-screen bg-background">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
