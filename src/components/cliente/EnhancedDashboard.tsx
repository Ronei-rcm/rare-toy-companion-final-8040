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
  AlertCircle,
  Calendar,
  DollarSign,
  Activity,
  Target,
  Zap
} from 'lucide-react';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

interface DashboardStats {
  totalPedidos: number;
  pedidosPendentes: number;
  totalGasto: number;
  favoritos: number;
  enderecos: number;
  cupons: number;
  nivelUsuario: string;
  pontosFidelidade: number;
  ticketMedio: number;
  ultimoPedido: string;
  pedidosMesAtual: number;
  economiaTotal: number;
}

interface RecentActivity {
  id: string;
  type: 'order' | 'review' | 'favorite' | 'address';
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
}

const EnhancedDashboard: React.FC = () => {
  const { user } = useCurrentUser();
  const [stats, setStats] = useState<DashboardStats>({
    totalPedidos: 0,
    pedidosPendentes: 0,
    totalGasto: 0,
    favoritos: 0,
    enderecos: 0,
    cupons: 0,
    nivelUsuario: 'Bronze',
    pontosFidelidade: 0,
    ticketMedio: 0,
    ultimoPedido: '',
    pedidosMesAtual: 0,
    economiaTotal: 0
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas básicas
      const statsResponse = await fetch('/api/customers/current/stats', { credentials: 'include' });
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(prev => ({
          ...prev,
          ...statsData,
          ticketMedio: statsData.totalPedidos > 0 ? statsData.totalGasto / statsData.totalPedidos : 0,
          nivelUsuario: getNivelUsuario(statsData.totalGasto),
          pontosFidelidade: Math.floor(statsData.totalGasto / 10)
        }));
      }

      // Carregar atividades recentes (simulado por enquanto)
      setRecentActivity([
        {
          id: '1',
          type: 'order',
          title: 'Pedido realizado',
          description: 'Seu pedido #12345 foi confirmado',
          date: '2 horas atrás',
          icon: <Package className="h-4 w-4" />
        },
        {
          id: '2',
          type: 'favorite',
          title: 'Produto favoritado',
          description: 'Você adicionou "Boneco Action Figure" aos favoritos',
          date: '1 dia atrás',
          icon: <Heart className="h-4 w-4" />
        },
        {
          id: '3',
          type: 'address',
          title: 'Endereço adicionado',
          description: 'Novo endereço "Casa" foi cadastrado',
          date: '3 dias atrás',
          icon: <MapPin className="h-4 w-4" />
        }
      ]);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNivelUsuario = (totalGasto: number): string => {
    if (totalGasto >= 1000) return 'Diamante';
    if (totalGasto >= 500) return 'Ouro';
    if (totalGasto >= 200) return 'Prata';
    return 'Bronze';
  };

  const getNivelColor = (nivel: string): string => {
    switch (nivel) {
      case 'Diamante': return 'text-blue-600 bg-blue-100';
      case 'Ouro': return 'text-yellow-600 bg-yellow-100';
      case 'Prata': return 'text-gray-600 bg-gray-100';
      default: return 'text-orange-600 bg-orange-100';
    }
  };

  const getProgressValue = (nivel: string): number => {
    const progressMap = {
      'Bronze': 25,
      'Prata': 50,
      'Ouro': 75,
      'Diamante': 100
    };
    return progressMap[nivel as keyof typeof progressMap] || 25;
  };

  const getNextLevel = (nivel: string): string => {
    const levelMap = {
      'Bronze': 'Prata (R$ 200)',
      'Prata': 'Ouro (R$ 500)',
      'Ouro': 'Diamante (R$ 1000)',
      'Diamante': 'Máximo'
    };
    return levelMap[nivel as keyof typeof levelMap] || 'Prata (R$ 200)';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com boas-vindas e nível do usuário */}
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
              <Badge className={`px-3 py-1 ${getNivelColor(stats.nivelUsuario)}`}>
                <Award className="h-3 w-3 mr-1" />
                {stats.nivelUsuario}
              </Badge>
              <p className="text-sm text-blue-600 mt-2">
                {stats.pontosFidelidade} pontos de fidelidade
              </p>
            </div>
          </div>
          
          {/* Barra de progresso para próximo nível */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-700 mb-1">
              <span>Progresso para {getNextLevel(stats.nivelUsuario)}</span>
              <span>{getProgressValue(stats.nivelUsuario)}%</span>
            </div>
            <Progress value={getProgressValue(stats.nivelUsuario)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPedidos}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Gasto</p>
                <p className="text-2xl font-bold text-green-600">R$ {stats.totalGasto.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-yellow-600">R$ {stats.ticketMedio.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Favoritos</p>
                <p className="text-2xl font-bold text-purple-600">{stats.favoritos}</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de insights e métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insights de compra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Insights de Compra
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-blue-900">Pedidos este mês</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pedidosMesAtual}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div>
                <p className="font-medium text-green-900">Economia total</p>
                <p className="text-2xl font-bold text-green-600">R$ {stats.economiaTotal.toFixed(2)}</p>
              </div>
              <Zap className="h-8 w-8 text-green-500" />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div>
                <p className="font-medium text-yellow-900">Pedidos pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pedidosPendentes}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        {/* Atividade recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                    {activity.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Ações Rápidas
          </CardTitle>
          <CardDescription>
            Acesse rapidamente as principais funcionalidades
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Fazer Pedido</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Package className="h-6 w-6" />
              <span className="text-sm">Meus Pedidos</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Heart className="h-6 w-6" />
              <span className="text-sm">Favoritos</span>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
              <Settings className="h-6 w-6" />
              <span className="text-sm">Configurações</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedDashboard;
