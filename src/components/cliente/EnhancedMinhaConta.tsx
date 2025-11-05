import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Package, 
  MapPin, 
  Heart, 
  TrendingUp,
  ShoppingCart,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useCart } from '@/contexts/CartContext';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { useNavigate } from 'react-router-dom';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  color = 'primary'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success': return 'bg-green-50 border-green-200 text-green-700';
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'destructive': return 'bg-red-50 border-red-200 text-red-700';
      case 'secondary': return 'bg-gray-50 border-gray-200 text-gray-700';
      default: return 'bg-blue-50 border-blue-200 text-blue-700';
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${getColorClasses()}`}>
            {icon}
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  onClick: () => void;
  badge?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning';
}

const QuickAction: React.FC<QuickActionProps> = ({ 
  title, 
  description, 
  icon, 
  onClick, 
  badge,
  color = 'primary'
}) => {
  const getColorClasses = () => {
    switch (color) {
      case 'success': return 'bg-green-50 hover:bg-green-100 border-green-200 text-green-700';
      case 'warning': return 'bg-yellow-50 hover:bg-yellow-100 border-yellow-200 text-yellow-700';
      case 'secondary': return 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700';
      default: return 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700';
    }
  };

  return (
    <Button
      variant="ghost"
      className={`w-full h-auto p-4 justify-start ${getColorClasses()}`}
      onClick={onClick}
    >
      <div className="flex items-center space-x-3">
        <div className="p-2 rounded-lg bg-white/50">
          {icon}
        </div>
        <div className="flex-1 text-left">
          <div className="flex items-center space-x-2">
            <p className="font-medium">{title}</p>
            {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          </div>
          <p className="text-sm opacity-80">{description}</p>
        </div>
      </div>
    </Button>
  );
};

const EnhancedMinhaConta: React.FC = () => {
  const { state: cartState } = useCart();
  const navigate = useNavigate();
  const { stats, loading, error, refetch } = useCustomerStats();

  const quickActions = [
    {
      title: 'Fazer Pedido',
      description: 'Adicionar produtos ao carrinho',
      icon: <ShoppingCart className="h-4 w-4" />,
      onClick: () => navigate('/loja'),
      badge: cartState.quantidadeTotal > 0 ? `${cartState.quantidadeTotal} itens` : undefined,
      color: 'primary' as const
    },
    {
      title: 'Rastrear Pedido',
      description: 'Acompanhe seus pedidos em tempo real',
      icon: <Package className="h-4 w-4" />,
      onClick: () => navigate('/minha-conta?tab=pedidos'),
      badge: (stats?.pedidosPendentes || 0) > 0 ? `${stats.pedidosPendentes} pendentes` : undefined,
      color: 'warning' as const
    },
    {
      title: 'Adicionar Endereço',
      description: 'Gerencie seus endereços de entrega',
      icon: <MapPin className="h-4 w-4" />,
      onClick: () => navigate('/minha-conta?tab=enderecos'),
      color: 'secondary' as const
    },
    {
      title: 'Ver Favoritos',
      description: 'Produtos que você ama',
      icon: <Heart className="h-4 w-4" />,
      onClick: () => navigate('/minha-conta?tab=favoritos'),
      badge: (stats?.favoritos || 0) > 0 ? `${stats.favoritos} itens` : undefined,
      color: 'success' as const
    }
  ];

  if (loading && !stats.lastUpdated) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-12">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/2" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="grid grid-cols-4 gap-4 mt-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-muted rounded" />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Erro ao carregar - apenas se houver erro real */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Pedidos"
          value={stats?.totalPedidos || 0}
          description="Todos os tempos"
          icon={<Package className="h-5 w-5" />}
          color="primary"
        />
        <StatsCard
          title="Pedidos Pendentes"
          value={stats?.pedidosPendentes || 0}
          description="Aguardando processamento"
          icon={<Clock className="h-5 w-5" />}
          color="warning"
        />
        <StatsCard
          title="Total Gasto"
          value={`R$ ${Number(stats?.totalGasto || 0).toFixed(2)}`}
          description="Valor total das compras"
          icon={<TrendingUp className="h-5 w-5" />}
          color="success"
        />
        <StatsCard
          title="Favoritos"
          value={stats?.favoritos || 0}
          description="Produtos salvos"
          icon={<Heart className="h-5 w-5" />}
          color="secondary"
        />
      </div>

      {/* Ações rápidas - simplificado */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedMinhaConta;
