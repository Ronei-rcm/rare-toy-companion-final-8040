
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Package, User, MapPin, Heart, LogOut, Settings, LayoutDashboard, Award, Bell, Gift, Star
} from 'lucide-react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

interface ClienteProfileProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
}

const ClienteProfile = ({ activeTab, setActiveTab, handleLogout }: ClienteProfileProps) => {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  
  // Verificar se o usuário é admin
  const isAdmin = user?.id === '1' || user?.email === 'admin@exemplo.com' || 
                  localStorage.getItem('admin_token') !== null;

  return (
    <div className="w-full md:w-64 space-y-2">
      <div className="p-4 border rounded-lg bg-card shadow-sm">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user?.avatar_url} alt={user?.nome} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{user?.nome || 'Carregando...'}</h3>
            <p className="text-sm text-muted-foreground">{user?.email || 'email@exemplo.com'}</p>
          </div>
        </div>
        
        <nav className="space-y-1">
          <Button
            variant={activeTab === 'dashboard' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('dashboard')}
          >
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <Button
            variant={activeTab === 'pedidos' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('pedidos')}
          >
            <Package className="mr-2 h-4 w-4" />
            Meus pedidos
          </Button>
          <Button
            variant={activeTab === 'enderecos' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('enderecos')}
          >
            <MapPin className="mr-2 h-4 w-4" />
            Endereços
          </Button>
          <Button
            variant={activeTab === 'favoritos' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('favoritos')}
          >
            <Heart className="mr-2 h-4 w-4" />
            Favoritos
          </Button>
          <Button
            variant={activeTab === 'notificacoes' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('notificacoes')}
          >
            <Bell className="mr-2 h-4 w-4" />
            Notificações
          </Button>
          <Button
            variant={activeTab === 'cupons' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('cupons')}
          >
            <Gift className="mr-2 h-4 w-4" />
            Cupons
          </Button>
          <Button
            variant={activeTab === 'avaliacoes' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('avaliacoes')}
          >
            <Star className="mr-2 h-4 w-4" />
            Avaliações
          </Button>
          <Button
            variant={activeTab === 'configuracoes' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('configuracoes')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>
          <Button
            variant={activeTab === 'dados' ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => setActiveTab('dados')}
          >
            <User className="mr-2 h-4 w-4" />
            Meus dados
          </Button>
          
          {/* Link para painel admin se o usuário for admin */}
          {isAdmin && (
            <Button
              variant="ghost"
              className="w-full justify-start text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => navigate('/admin')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Painel Admin
            </Button>
          )}
          
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </nav>
      </div>
    </div>
  );
};

export default ClienteProfile;
