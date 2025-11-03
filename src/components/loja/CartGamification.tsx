import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Trophy, 
  Star, 
  Target, 
  Zap, 
  Gift, 
  Crown,
  Medal,
  Award,
  Flame,
  Sparkles,
  CheckCircle,
  Lock,
  Unlock,
  Rocket,
  Diamond
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: 'spending' | 'items' | 'category' | 'streak' | 'special';
  requirement: number;
  current: number;
  completed: boolean;
  unlockedAt?: Date;
  reward: {
    type: 'points' | 'discount' | 'badge' | 'title';
    value: number | string;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserLevel {
  level: number;
  title: string;
  points: number;
  nextLevelPoints: number;
  progress: number;
  benefits: string[];
  icon: React.ReactNode;
}

interface StreakData {
  days: number;
  lastPurchase: Date;
  longestStreak: number;
  currentStreak: number;
}

const CartGamification: React.FC = () => {
  const { state } = useCart();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  // Dados de exemplo para demonstração
  const sampleAchievements: Achievement[] = [
    {
      id: 'first-purchase',
      title: 'Primeira Compra',
      description: 'Faça sua primeira compra',
      icon: <Star className="h-5 w-5" />,
      type: 'spending',
      requirement: 1,
      current: 1,
      completed: true,
      unlockedAt: new Date(Date.now() - 86400000),
      reward: { type: 'points', value: 100 },
      rarity: 'common'
    },
    {
      id: 'big-spender',
      title: 'Gastador',
      description: 'Gaste mais de R$ 500 em uma compra',
      icon: <Diamond className="h-5 w-5" />,
      type: 'spending',
      requirement: 500,
      current: Math.min(state.total, 500),
      completed: state.total >= 500,
      reward: { type: 'discount', value: 50 },
      rarity: 'rare'
    },
    {
      id: 'collector',
      title: 'Colecionador',
      description: 'Adicione 10 itens ao carrinho',
      icon: <Target className="h-5 w-5" />,
      type: 'items',
      requirement: 10,
      current: Math.min(state.quantidadeTotal, 10),
      completed: state.quantidadeTotal >= 10,
      reward: { type: 'badge', value: 'Collector' },
      rarity: 'epic'
    },
    {
      id: 'speed-shopper',
      title: 'Comprador Rápido',
      description: 'Finalize uma compra em menos de 2 minutos',
      icon: <Zap className="h-5 w-5" />,
      type: 'special',
      requirement: 120,
      current: 0,
      completed: false,
      reward: { type: 'points', value: 250 },
      rarity: 'legendary'
    },
    {
      id: 'toy-master',
      title: 'Mestre dos Brinquedos',
      description: 'Compre produtos de 5 categorias diferentes',
      icon: <Crown className="h-5 w-5" />,
      type: 'category',
      requirement: 5,
      current: new Set(state.itens.map(item => item.produto.categoria)).size,
      completed: new Set(state.itens.map(item => item.produto.categoria)).size >= 5,
      reward: { type: 'title', value: 'Toy Master' },
      rarity: 'legendary'
    }
  ];

  const sampleUserLevel: UserLevel = {
    level: 3,
    title: 'Comprador Experiente',
    points: 1250,
    nextLevelPoints: 2000,
    progress: 62.5,
    benefits: [
      'Frete grátis em compras acima de R$ 150',
      'Desconto de 5% em todas as compras',
      'Acesso antecipado a novos produtos'
    ],
    icon: <Medal className="h-6 w-6" />
  };

  const sampleStreakData: StreakData = {
    days: 7,
    lastPurchase: new Date(Date.now() - 86400000),
    longestStreak: 15,
    currentStreak: 7
  };

  useEffect(() => {
    setAchievements(sampleAchievements);
    setUserLevel(sampleUserLevel);
    setStreakData(sampleStreakData);

    // Verificar conquistas recém-desbloqueadas
    checkNewAchievements();
  }, [state.itens, state.total]);

  const checkNewAchievements = () => {
    const newAchievements = sampleAchievements.filter(achievement => {
      if (achievement.completed) return false;
      
      let shouldUnlock = false;
      switch (achievement.type) {
        case 'spending':
          shouldUnlock = state.total >= achievement.requirement;
          break;
        case 'items':
          shouldUnlock = state.quantidadeTotal >= achievement.requirement;
          break;
        case 'category':
          shouldUnlock = new Set(state.itens.map(item => item.produto.categoria)).size >= achievement.requirement;
          break;
        default:
          shouldUnlock = false;
      }

      if (shouldUnlock) {
        setRecentUnlock(achievement);
        setShowCelebration(true);
        toast.success(`🏆 Conquista Desbloqueada: ${achievement.title}!`, {
          description: achievement.description
        });
        
        // Auto-hide celebration after 5 seconds
        setTimeout(() => setShowCelebration(false), 5000);
      }

      return shouldUnlock;
    });
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rare': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'epic': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'legendary': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="h-4 w-4" />;
      case 'rare': return <Diamond className="h-4 w-4" />;
      case 'epic': return <Crown className="h-4 w-4" />;
      case 'legendary': return <Trophy className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getRewardText = (reward: Achievement['reward']) => {
    switch (reward.type) {
      case 'points': return `+${reward.value} pontos`;
      case 'discount': return `${reward.value}% de desconto`;
      case 'badge': return `Badge: ${reward.value}`;
      case 'title': return `Título: ${reward.value}`;
      default: return 'Recompensa especial';
    }
  };

  if (state.itens.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Sistema de Gamificação
          </h3>
          <p className="text-yellow-700">
            Adicione produtos ao carrinho para desbloquear conquistas e ganhar recompensas!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Celebration Modal */}
      {showCelebration && recentUnlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white border-0 max-w-md mx-4">
            <CardContent className="p-6 text-center">
              <div className="animate-bounce mb-4">
                <Trophy className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-2xl font-bold mb-2">🏆 Conquista Desbloqueada!</h3>
              <h4 className="text-xl font-semibold mb-2">{recentUnlock.title}</h4>
              <p className="text-yellow-100 mb-4">{recentUnlock.description}</p>
              <div className="bg-white/20 rounded-lg p-3 mb-4">
                <p className="font-semibold">Recompensa: {getRewardText(recentUnlock.reward)}</p>
              </div>
              <Button 
                onClick={() => setShowCelebration(false)}
                className="bg-white text-yellow-600 hover:bg-yellow-50"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Continuar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Nível do Usuário */}
      {userLevel && (
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {userLevel.icon}
                <div>
                  <CardTitle className="text-white">Nível {userLevel.level}</CardTitle>
                  <p className="text-purple-100">{userLevel.title}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{userLevel.points}</p>
                <p className="text-purple-100 text-sm">pontos</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso para próximo nível</span>
                <span>{userLevel.progress.toFixed(1)}%</span>
              </div>
              <Progress value={userLevel.progress} className="h-2" />
              <p className="text-purple-100 text-xs">
                {userLevel.nextLevelPoints - userLevel.points} pontos para o próximo nível
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Streak de Compras */}
      {streakData && (
        <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Flame className="h-6 w-6" />
                <div>
                  <h3 className="font-semibold">Sequência de Compras</h3>
                  <p className="text-orange-100 text-sm">
                    {streakData.currentStreak} dias consecutivos
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{streakData.currentStreak}</p>
                <p className="text-orange-100 text-xs">
                  Recorde: {streakData.longestStreak} dias
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conquistas */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <span>Conquistas</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {achievements.map((achievement) => (
            <Card 
              key={achievement.id} 
              className={`${getRarityColor(achievement.rarity)} border-2 ${
                achievement.completed ? 'ring-2 ring-green-500' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {achievement.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {achievement.icon}
                      <h4 className="font-semibold truncate">{achievement.title}</h4>
                      <Badge className="text-xs">
                        {getRarityIcon(achievement.rarity)}
                      </Badge>
                    </div>
                    
                    <p className="text-sm mb-2">{achievement.description}</p>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>Progresso</span>
                        <span>{achievement.current}/{achievement.requirement}</span>
                      </div>
                      <Progress 
                        value={(achievement.current / achievement.requirement) * 100} 
                        className="h-1.5"
                      />
                      
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-medium">
                          {getRewardText(achievement.reward)}
                        </span>
                        {achievement.completed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            <Unlock className="h-3 w-3 mr-1" />
                            Conquistada
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Benefícios do Nível */}
      {userLevel && userLevel.benefits.length > 0 && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-900 flex items-center space-x-2">
              <Rocket className="h-5 w-5" />
              <span>Benefícios do Nível {userLevel.level}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {userLevel.benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="text-green-800 text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ação de Gamificação */}
      <Card className="bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Sparkles className="h-6 w-6 text-pink-600" />
              <div>
                <h3 className="font-semibold text-pink-900">Multiplicador Ativo</h3>
                <p className="text-pink-700 text-sm">
                  Ganhe pontos extras com esta compra!
                </p>
              </div>
            </div>
            <Badge className="bg-pink-100 text-pink-800">
              2x Pontos
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CartGamification;
