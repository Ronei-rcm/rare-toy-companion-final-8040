import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  UserCheck,
  TrendingUp,
  Shield,
  BookOpen,
  FolderTree,
  Search,
  Bell,
  Store,
  History,
  Zap,
  ChevronDown,
  ChevronRight,
  Headphones,
  FileText,
  Star,
  Video as VideoIcon,
  Database,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ClearCacheButton } from './ClearCacheButton';
import DashboardNotifications from './DashboardNotifications';

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  category?: 'vendas' | 'conteudo' | 'config' | 'analytics';
  badge?: number;
  shortcut?: string;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUser, setAdminUser] = useState<{ nome?: string; email?: string; avatar?: string; role?: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    vendas: true,
    conteudo: true,
    analytics: false,
    config: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Atalhos globais simples (ex.: ⌘D vai para Dashboard)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const combo = isMac ? e.metaKey : e.ctrlKey;
      if (!combo) return;
      const key = e.key.toLowerCase();
      const item = navigation.find((nav) => (nav.shortcut || '').toLowerCase().endsWith(key));
      if (item) {
        e.preventDefault();
        navigate(item.href);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [navigate]);

  // Carregar usuário admin (salvo no login)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('admin_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        setAdminUser({
          nome: parsed?.nome || parsed?.name || 'Admin',
          email: parsed?.email || 'admin@exemplo.com',
          avatar: parsed?.avatar || parsed?.avatar_url || '',
          role: parsed?.role || parsed?.cargo || undefined,
        });
      }
    } catch (_) {
      // ignora
    }
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || '').join('') || 'AD';
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  // Navegação agrupada por categoria - Organizada e sem duplicatas
  const navigation: NavigationItem[] = [
    // VENDAS - Gestão de Vendas e Pedidos
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard, category: 'vendas', shortcut: '⌘D' },
    { name: 'Pedidos', href: '/admin/pedidos', icon: ShoppingCart, category: 'vendas', badge: 3, shortcut: '⌘O' },
    { name: 'Automações', href: '/admin/automacoes', icon: Zap, category: 'vendas' },
    { name: 'Clientes', href: '/admin/clientes', icon: Users, category: 'vendas', shortcut: '⌘C' },
    { name: 'Marketplace', href: '/admin/marketplace', icon: Store, category: 'vendas' },
    
    // CONTEÚDO - Produtos e Conteúdo
    { name: 'Produtos', href: '/admin/produtos', icon: Package, category: 'conteudo', shortcut: '⌘P' },
    { name: 'Categorias', href: '/admin/categorias', icon: FolderTree, category: 'conteudo' },
    { name: 'Coleções', href: '/admin/colecoes', icon: Layers, category: 'conteudo' },
    { name: 'Blog & Notícias', href: '/admin/blog', icon: BookOpen, category: 'conteudo' },
    { name: 'Eventos', href: '/admin/eventos', icon: Calendar, category: 'conteudo' },
    { name: 'Reviews', href: '/admin/reviews', icon: Star, category: 'conteudo' },
    { name: 'Home Config', href: '/admin/home-config', icon: Settings, category: 'conteudo' },
    { name: 'Galeria de Vídeos', href: '/admin/video-gallery', icon: VideoIcon, category: 'conteudo' },
    { name: 'Página Sobre', href: '/admin/sobre', icon: Info, category: 'conteudo' },
    
    // ANALYTICS - Relatórios e Análises
    { name: 'Financeiro', href: '/admin/financeiro', icon: DollarSign, category: 'analytics', shortcut: '⌘F' },
    { name: 'Relatórios', href: '/admin/relatorios', icon: FileText, category: 'analytics', shortcut: '⌘R' },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart, category: 'analytics' },
    { name: 'Fornecedores', href: '/admin/fornecedores', icon: Truck, category: 'analytics' },
    { name: 'Funcionários', href: '/admin/funcionarios', icon: UserCheck, category: 'analytics' },
    { name: 'Usuários Admin', href: '/admin/usuarios', icon: Shield, category: 'analytics' },
    
    // CONFIGURAÇÕES - Sistema e Integrações
    { name: 'Configurações', href: '/admin/configuracoes', icon: Settings, category: 'config' },
    { name: 'Backup DB', href: '/admin/database-backup', icon: Database, category: 'config' },
    { name: 'Suporte', href: '/admin/suporte', icon: Headphones, category: 'config' },
    { name: 'Páginas', href: '/admin/paginas', icon: FileText, category: 'config' },
    { name: 'Recuperação', href: '/admin/recuperacao', icon: Mail, category: 'config' },
    { name: 'WhatsApp Grupos', href: '/admin/whatsapp-grupos', icon: MessageCircle, category: 'config' },
    { name: 'Instagram', href: '/admin/instagram', icon: Instagram, category: 'config' },
  ];

  // Agrupar itens por categoria
  const groupedNavigation = useMemo(() => {
    const categories = {
      vendas: { title: 'Vendas', icon: ShoppingCart },
      conteudo: { title: 'Conteúdo', icon: Package },
      analytics: { title: 'Analytics', icon: BarChart },
      config: { title: 'Configurações', icon: Settings },
    };

    const grouped = navigation.reduce((acc, item) => {
      const category = item.category || 'analytics';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, NavigationItem[]>);

    return { categories, grouped };
  }, []);

  // Filtrar itens por busca
  const filteredNavigation = useMemo(() => {
    if (!searchQuery.trim()) return navigation;
    
    const query = searchQuery.toLowerCase();
    return navigation.filter(item => 
      item.name.toLowerCase().includes(query) ||
      item.href.toLowerCase().includes(query)
    );
  }, [searchQuery, navigation]);

  const navigationToRender = searchQuery.trim() ? filteredNavigation : navigation;

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Botão do menu mobile */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-lg hover:bg-white hover:shadow-xl transition-all duration-200 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Sidebar Desktop */}
      <aside 
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-gradient-to-b from-sidebar to-sidebar/95 border-r border-sidebar-border shadow-2xl transition-all duration-300 md:left-0",
          sidebarOpen ? "w-64" : "w-20",
          "hidden md:flex h-screen"
        )}
      >
        {/* Header */}
        <div className="flex-shrink-0 p-4 flex items-center justify-between border-b border-sidebar-border">
          <div className={cn("overflow-hidden transition-all", !sidebarOpen && "invisible w-0")}>
            <h2 className="text-xl font-bold text-sidebar-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Admin Panel
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Gestão Completa</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-sidebar-accent"
          >
            <Menu className="h-5 w-5 text-sidebar-foreground" />
          </Button>
        </div>

        {/* Busca Rápida (apenas quando expandido) */}
        {sidebarOpen && (
          <div className="flex-shrink-0 p-3 border-b border-sidebar-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar menu..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-sm bg-background/50 border-sidebar-border focus:bg-background"
              />
            </div>
          </div>
        )}
        
        {/* Navegação - Container rolável */}
        <div 
          className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll"
          style={{ 
            minHeight: 0,
            maxHeight: '100%',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain'
          }}
        >
          {sidebarOpen ? (
            // Menu Expandido com Categorias
            <>
              <nav className="px-2 space-y-4 py-2">
                {!searchQuery.trim() ? (
                  // Agrupado por Categorias com Accordion
                  Object.entries(groupedNavigation.grouped).map(([category, items]) => {
                    const isExpanded = expandedSections[category];
                    const CategoryIcon = groupedNavigation.categories[category as keyof typeof groupedNavigation.categories]?.icon;
                    
                    return (
                      <div key={category} className="space-y-1">
                        <button
                          onClick={() => toggleSection(category)}
                          className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-sidebar-accent rounded-md transition-colors group"
                        >
                          <span className="flex items-center gap-2">
                            {CategoryIcon && <CategoryIcon className="h-4 w-4" />}
                            {groupedNavigation.categories[category as keyof typeof groupedNavigation.categories]?.title || category}
                          </span>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 transition-transform" />
                          ) : (
                            <ChevronRight className="h-4 w-4 transition-transform" />
                          )}
                        </button>
                        
                        {isExpanded && (
                          <div className="space-y-1 pl-1">
                            {items.map((item) => {
                              const Icon = item.icon;
                              const isActive = location.pathname === item.href;
                              return (
                                <Link
                                  key={item.name}
                                  to={item.href}
                                  className={cn(
                                    "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group",
                                    isActive
                                      ? "bg-primary text-primary-foreground shadow-md"
                                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                  )}
                                  title={item.shortcut}
                                >
                                  <div className="flex items-center gap-3">
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <span>{item.name}</span>
                                  </div>
                                  {item.badge && item.badge > 0 && (
                                    <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground">
                                      {item.badge}
                                    </Badge>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  // Busca - Lista Simples
                  navigationToRender.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={cn(
                          "flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-all",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 shrink-0" />
                          <span>{item.name}</span>
                        </div>
                        {item.badge && (
                          <Badge variant="secondary">{item.badge}</Badge>
                        )}
                      </Link>
                    );
                  })
                )}
              </nav>
            </>
          ) : (
            // Menu Colapsado - Apenas Ícones
            <nav className="px-2 space-y-1 py-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    title={item.name}
                    className={cn(
                      "flex items-center justify-center px-3 py-3 text-sm font-medium rounded-md transition-all relative",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.badge && item.badge > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-red-500 text-white text-[10px]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
        
        {/* Footer - Usuário */}
        <div className="flex-shrink-0 p-4 border-t border-sidebar-border bg-sidebar-accent/30">
          <div className={cn(
            "flex items-center gap-3",
            !sidebarOpen && "justify-center"
          )}>
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarImage src={adminUser?.avatar || ''} />
              <AvatarFallback className="bg-primary text-primary-foreground">{getInitials(adminUser?.nome)}</AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-sidebar-foreground truncate">{adminUser?.nome || 'Admin'}</p>
                <p className="text-xs text-muted-foreground truncate">{adminUser?.email || 'admin@exemplo.com'}</p>
              </div>
            )}
          </div>
          
          <div className="mt-3 space-y-2">
            {sidebarOpen && (
              <ClearCacheButton />
            )}
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className={cn(
                "w-full text-sm border-sidebar-border hover:bg-destructive hover:text-destructive-foreground",
                !sidebarOpen && "px-0 justify-center"
              )}
            >
              <LogOut className="h-4 w-4" />
              {sidebarOpen && <span className="ml-2">Sair</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <div className="md:hidden">
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-in" onClick={() => setMobileMenuOpen(false)}>
            <aside className="fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-background to-background/95 animate-in slide-in-from-left shadow-2xl max-w-sm flex flex-col h-screen">
              <div className="flex-shrink-0 p-4 flex items-center justify-between border-b bg-background">
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Admin Panel
                </h2>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              
              <div className="flex-shrink-0 p-3 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Buscar menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto overflow-x-hidden sidebar-scroll" style={{ minHeight: 0 }}>
                <nav className="px-2 py-4 space-y-1">
                  {Object.entries(groupedNavigation.grouped).map(([category, items]) => (
                    <div key={category} className="space-y-2 mb-4">
                      <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase">
                        {groupedNavigation.categories[category as keyof typeof groupedNavigation.categories]?.title || category}
                      </h3>
                      {items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className={cn(
                              "flex items-center justify-between px-3 py-3 text-sm font-medium rounded-lg transition-all",
                              isActive
                                ? "bg-primary text-primary-foreground shadow-md"
                                : "text-foreground hover:bg-muted"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="h-5 w-5" />
                              <span>{item.name}</span>
                            </div>
                            {item.badge && (
                              <Badge variant="secondary">{item.badge}</Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  ))}
                </nav>
              </div>
              
              <div className="flex-shrink-0 p-4 border-t bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                    <AvatarImage src={adminUser?.avatar || ''} />
                    <AvatarFallback>{getInitials(adminUser?.nome)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{adminUser?.nome || 'Admin'}</p>
                    <p className="text-xs text-muted-foreground">{adminUser?.email || 'admin@exemplo.com'}</p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleLogout}
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </aside>
          </div>
        )}
      </div>

      {/* Header com Notificações */}
      <header className={cn(
        "fixed top-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 transition-all duration-300",
        sidebarOpen ? "md:left-64" : "md:left-20",
        "left-0"
      )}>
        <div className="flex items-center justify-end gap-4 px-4 py-3">
          <DashboardNotifications />
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className={cn(
        "flex-1 transition-all duration-300 pt-16",
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
