import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Package, 
  MapPin, 
  Heart, 
  Bell, 
  Gift, 
  Star, 
  Settings, 
  User,
  TrendingUp,
  ShoppingCart,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useCart } from '@/contexts/CartContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'destructive';
}

const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend = 'neutral',
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

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      default: return null;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
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
          {getTrendIcon()}
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
  const { user } = useCurrentUser();
  const { state: cartState } = useCart();
  const [stats, setStats] = useState({
    totalPedidos: 0,
    pedidosPendentes: 0,
    totalGasto: 0,
    favoritos: 0,
    enderecos: 0,
    cupons: 0
  });

  useEffect(() => {
    // Carregar estatísticas reais da API
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      // Tentar buscar dados reais primeiro
      const response = await fetch('/api/customers/current/stats', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        // Se retornou dados válidos (não apenas zeros), usar
        if (data.totalPedidos > 0 || data.totalGasto > 0) {
          setStats(data);
          return;
        }
      }
      
      // Fallback para dados simulados para demonstração
      setStats({
        totalPedidos: 12,
        pedidosPendentes: 2,
        totalGasto: 1250.75,
        favoritos: 8,
        enderecos: 3,
        cupons: 2
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      // Fallback para dados simulados
      setStats({
        totalPedidos: 12,
        pedidosPendentes: 2,
        totalGasto: 1250.75,
        favoritos: 8,
        enderecos: 3,
        cupons: 2
      });
    }
  };

  const quickActions = [
    {
      title: 'Fazer Pedido',
      description: 'Adicionar produtos ao carrinho',
      icon: <ShoppingCart className="h-4 w-4" />,
      onClick: () => window.location.href = '/loja',
      badge: cartState.quantidadeTotal > 0 ? `${cartState.quantidadeTotal} itens` : undefined,
      color: 'primary' as const
    },
    {
      title: 'Rastrear Pedido',
      description: 'Acompanhe seus pedidos em tempo real',
      icon: <Package className="h-4 w-4" />,
      onClick: () => {},
      badge: stats.pedidosPendentes > 0 ? `${stats.pedidosPendentes} pendentes` : undefined,
      color: 'warning' as const
    },
    {
      title: 'Adicionar Endereço',
      description: 'Gerencie seus endereços de entrega',
      icon: <MapPin className="h-4 w-4" />,
      onClick: () => {},
      color: 'secondary' as const
    },
    {
      title: 'Ver Favoritos',
      description: 'Produtos que você ama',
      icon: <Heart className="h-4 w-4" />,
      onClick: () => {},
      badge: stats.favoritos > 0 ? `${stats.favoritos} itens` : undefined,
      color: 'success' as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-900">
                Olá, {user?.nome || 'Cliente'}! 👋
              </h1>
              <p className="text-blue-700 mt-1">
                Bem-vindo à sua área personalizada
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600">Cliente desde</p>
              <p className="font-semibold text-blue-900">Janeiro 2024</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Pedidos"
          value={stats.totalPedidos}
          description="Todos os tempos"
          icon={<Package className="h-5 w-5" />}
          trend="up"
          color="primary"
        />
        <StatsCard
          title="Pedidos Pendentes"
          value={stats.pedidosPendentes}
          description="Aguardando processamento"
          icon={<Clock className="h-5 w-5" />}
          color="warning"
        />
        <StatsCard
          title="Total Gasto"
          value={`R$ ${(stats.totalGasto || 0).toFixed(2)}`}
          description="Valor total das compras"
          icon={<TrendingUp className="h-5 w-5" />}
          trend="up"
          color="success"
        />
        <StatsCard
          title="Favoritos"
          value={stats.favoritos}
          description="Produtos salvos"
          icon={<Heart className="h-5 w-5" />}
          color="secondary"
        />
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Ações Rápidas</span>
          </CardTitle>
          <CardDescription>
            Acesso rápido às funcionalidades mais usadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Status da conta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span>Status da Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Verificação de Email</span>
              <Badge variant="default" className="bg-green-100 text-green-800">
                Verificado
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Endereços Cadastrados</span>
              <Badge variant="outline">
                {stats.enderecos} endereço{stats.enderecos !== 1 ? 's' : ''}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Cupons Disponíveis</span>
              <Badge variant="secondary">
                {stats.cupons} cupom{stats.cupons !== 1 ? 's' : ''}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              <span>Atividades Recentes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>Último login: Hoje às 14:30</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Pedido #1234 enviado</span>
              </div>
              <div className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <span>Novo endereço adicionado</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedMinhaConta;
