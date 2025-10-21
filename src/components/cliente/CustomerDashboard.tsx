import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ShoppingBag, Heart, Clock, Award, TrendingUp, DollarSign, 
  Star, Calendar, Package, Truck, Bell, Gift, Target, 
  BarChart3, Zap, Crown, Sparkles, Eye, MessageSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';

interface CustomerDashboardProps {
  userId: string;
}

const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ userId }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteProducts: 0,
    lastOrderDate: null as Date | null,
    loyaltyPoints: 0,
    nextReward: 100,
    averageOrderValue: 0,
    monthlySpending: 0,
    orderFrequency: 0,
    customerLevel: 'Bronze',
    nextLevelPoints: 0,
    recentActivity: [] as any[],
    recommendations: [] as any[],
    notifications: 0,
    reviews: 0,
    wishlistItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeInsight, setActiveInsight] = useState(0);
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadCustomerStats();
  }, [userId]);

  const loadCustomerStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/stats`, {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const progressToNextReward = (stats.loyaltyPoints / stats.nextReward) * 100;
  const levelProgress = (stats.loyaltyPoints / stats.nextLevelPoints) * 100;

  const insights = [
    {
      icon: <TrendingUp className="w-5 h-5" />,
      title: "Você está economizando!",
      description: `Seu ticket médio de R$ ${(stats.averageOrderValue || 0).toFixed(2)} está ${(stats.averageOrderValue || 0) > 50 ? 'acima' : 'abaixo'} da média dos clientes.`,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      icon: <Target className="w-5 h-5" />,
      title: "Meta de fidelidade",
      description: `Faltam apenas ${stats.nextLevelPoints - stats.loyaltyPoints} pontos para o próximo nível!`,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    },
    {
      icon: <Calendar className="w-5 h-5" />,
      title: "Frequência de compras",
      description: `Você compra em média a cada ${stats.orderFrequency} dias. Que tal acelerar?`,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200"
    },
    {
      icon: <Gift className="w-5 h-5" />,
      title: "Ofertas personalizadas",
      description: "Temos 3 ofertas especiais baseadas no seu histórico de compras!",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200"
    }
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronze': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'Silver': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'Gold': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Platinum': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-amber-600 bg-amber-50 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Nível do Cliente */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold">Bem-vindo de volta!</h2>
          <p className="text-muted-foreground">Aqui está um resumo da sua conta</p>
        </div>
        <Badge className={`${getLevelColor(stats.customerLevel)} px-3 py-1`}>
          <Crown className="w-3 h-3 mr-1" />
          {stats.customerLevel}
        </Badge>
      </motion.div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-700">Pedidos</p>
                    <p className="text-2xl font-bold text-blue-900">{stats.totalOrders}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-blue-600">+12%</p>
                  <p className="text-xs text-blue-500">vs mês anterior</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-green-700">Total Gasto</p>
                    <p className="text-xl font-bold text-green-900">
                      R$ {(stats.totalSpent || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-green-600">R$ {(stats.monthlySpending || 0).toFixed(2)}</p>
                  <p className="text-xs text-green-500">este mês</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500 rounded-lg">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-pink-700">Favoritos</p>
                    <p className="text-2xl font-bold text-pink-900">{stats.favoriteProducts}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-pink-600">{stats.wishlistItems}</p>
                  <p className="text-xs text-pink-500">na lista</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500 rounded-lg">
                    <Award className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-700">Pontos</p>
                    <p className="text-2xl font-bold text-purple-900">{stats.loyaltyPoints}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-purple-600">{stats.nextLevelPoints - stats.loyaltyPoints}</p>
                  <p className="text-xs text-purple-500">próximo nível</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights Personalizados */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Insights Personalizados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-lg border ${insight.bgColor} ${insight.borderColor} cursor-pointer hover:shadow-md transition-all`}
                onClick={() => setActiveInsight(index)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${insight.bgColor}`}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${insight.color}`}>{insight.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{insight.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Programa de Fidelidade Evoluído */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Programa de Fidelidade
            </div>
            <Badge className={`${getLevelColor(stats.customerLevel)}`}>
              {stats.customerLevel}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="font-medium">Progresso para próximo nível</span>
              <span className="text-muted-foreground">
                {stats.loyaltyPoints} / {stats.nextLevelPoints} pontos
              </span>
            </div>
            <Progress value={levelProgress} className="h-3" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/60 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Faltam</p>
              <p className="text-lg font-bold text-amber-700">
                {stats.nextLevelPoints - stats.loyaltyPoints}
              </p>
              <p className="text-xs text-muted-foreground">pontos</p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Próximo benefício</p>
              <p className="text-sm font-bold text-amber-700">Cupom 15% OFF</p>
            </div>
            <div className="bg-white/60 p-3 rounded-lg text-center">
              <p className="text-xs text-muted-foreground">Ticket médio</p>
              <p className="text-sm font-bold text-amber-700">R$ {(stats.averageOrderValue || 0).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações Rápidas */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold">Notificações</p>
                <p className="text-sm text-muted-foreground">{stats.notifications} novas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Avaliações</p>
                <p className="text-sm text-muted-foreground">{stats.reviews} pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold">Cupons</p>
                <p className="text-sm text-muted-foreground">2 disponíveis</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Último pedido */}
      {stats.lastOrderDate && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm">
                  Último pedido há{' '}
                  <strong>
                    {Math.floor((Date.now() - new Date(stats.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))}
                  </strong>{' '}
                  dias
                </p>
              </div>
              <Button variant="outline" size="sm">
                Ver detalhes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerDashboard;
