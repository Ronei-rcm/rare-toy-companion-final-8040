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
  type: string;
  description: string;
  date: string;
  icon: React.ReactNode;
}

const DashboardMocked: React.FC = () => {
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
      
      // Simular dados para demonstração
      const mockStats = {
        totalPedidos: 12,
        pedidosPendentes: 2,
        totalGasto: 1250.75,
        favoritos: 8,
        enderecos: 3,
        cupons: 2,
        nivelUsuario: 'Prata',
        pontosFidelidade: 125,
        ticketMedio: 104.23,
        ultimoPedido: '2025-10-15',
        pedidosMesAtual: 3,
        economiaTotal: 89.50
      };

      const mockActivity = [
        {
          id: '1',
          type: 'order',
          description: 'Pedido #1234 entregue com sucesso',
          date: '2025-10-20',
          icon: <CheckCircle className="w-4 h-4 text-green-500" />
        },
        {
          id: '2',
          type: 'favorite',
          description: 'Produto adicionado aos favoritos',
          date: '2025-10-19',
          icon: <Heart className="w-4 h-4 text-red-500" />
        },
        {
          id: '3',
          type: 'coupon',
          description: 'Cupom de desconto disponível',
          date: '2025-10-18',
          icon: <Gift className="w-4 h-4 text-purple-500" />
        },
        {
          id: '4',
          type: 'address',
          description: 'Novo endereço adicionado',
          date: '2025-10-17',
          icon: <MapPin className="w-4 h-4 text-blue-500" />
        }
      ];

      setStats(mockStats);
      setRecentActivity(mockActivity);
      
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getNivelUsuario = (totalGasto: number) => {
    if (totalGasto >= 5000) return { level: 'Diamante', color: 'bg-cyan-500', icon: '💎' };
    if (totalGasto >= 2000) return { level: 'Ouro', color: 'bg-yellow-500', icon: '🥇' };
    if (totalGasto >= 500) return { level: 'Prata', color: 'bg-gray-400', icon: '🥈' };
    return { level: 'Bronze', color: 'bg-amber-700', icon: '🥉' };
  };

  const nivelInfo = getNivelUsuario(stats.totalGasto);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header de boas-vindas */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Olá, {user?.nome || 'Cliente'}! 👋
            </h1>
            <p className="text-purple-100 mt-1">
              Bem-vindo à sua área personalizada
            </p>
            <p className="text-sm text-purple-200 mt-1">
              Cliente desde Janeiro 2024
            </p>
          </div>
          <div className="text-right">
            <Badge className={`${nivelInfo.color} text-white px-3 py-1`}>
              {nivelInfo.icon} {nivelInfo.level}
            </Badge>
            <p className="text-sm text-purple-200 mt-1">
              {stats.pontosFidelidade} pontos de fidelidade
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Pedidos</p>
                <p className="text-2xl font-bold text-blue-600">{stats.totalPedidos}</p>
                <p className="text-xs text-gray-500">Todos os tempos</p>
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
                <p className="text-2xl font-bold text-green-600">R$ {Number(stats.totalGasto || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500">Valor total das compras</p>
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
                <p className="text-2xl font-bold text-yellow-600">R$ {Number(stats.ticketMedio || 0).toFixed(2)}</p>
                <p className="text-xs text-gray-500">Por pedido</p>
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
                <p className="text-xs text-gray-500">Produtos salvos</p>
              </div>
              <Heart className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
                <p className="text-xl font-bold text-orange-600">{stats.pedidosPendentes}</p>
                <p className="text-xs text-gray-500">Aguardando processamento</p>
              </div>
              <Clock className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Endereços</p>
                <p className="text-xl font-bold text-blue-600">{stats.enderecos}</p>
                <p className="text-xs text-gray-500">Endereços cadastrados</p>
              </div>
              <MapPin className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cupons</p>
                <p className="text-xl font-bold text-green-600">{stats.cupons}</p>
                <p className="text-xs text-gray-500">Descontos disponíveis</p>
              </div>
              <Gift className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso de fidelidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Programa de Fidelidade
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Pontos atuais: {stats.pontosFidelidade}</span>
              <span className="text-sm text-gray-500">Próximo nível: 200 pontos</span>
            </div>
            <Progress value={(stats.pontosFidelidade / 200) * 100} className="h-2" />
            <p className="text-sm text-gray-600">
              Faltam {200 - stats.pontosFidelidade} pontos para o próximo nível
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Atividades recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                {activity.icon}
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.description}</p>
                  <p className="text-xs text-gray-500">{activity.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ações rápidas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              <span className="text-sm">Fazer Pedido</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <MapPin className="h-6 w-6" />
              <span className="text-sm">Adicionar Endereço</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Package className="h-6 w-6" />
              <span className="text-sm">Rastrear Pedido</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
              <Heart className="h-6 w-6" />
              <span className="text-sm">Ver Favoritos</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardMocked;
