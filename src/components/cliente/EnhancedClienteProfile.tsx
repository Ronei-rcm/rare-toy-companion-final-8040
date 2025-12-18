import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  Bell, 
  Gift, 
  Star, 
  Settings, 
  LogOut,
  Crown,
  Award,
  TrendingUp,
  Zap,
  ChevronRight,
  Home,
  CreditCard,
  MessageSquare,
  Shield,
  Clock
} from 'lucide-react';

interface EnhancedClienteProfileProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleLogout: () => void;
  userStats?: {
    totalPedidos: number;
    pedidosPendentes: number;
    totalGasto: number;
    nivelUsuario: string;
    pontosFidelidade: number;
  };
}

const EnhancedClienteProfile: React.FC<EnhancedClienteProfileProps> = ({
  activeTab,
  setActiveTab,
  handleLogout,
  userStats = {
    totalPedidos: 0,
    pedidosPendentes: 0,
    totalGasto: 0,
    nivelUsuario: 'Bronze',
    pontosFidelidade: 0
  }
}) => {
  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Visão geral da conta',
      badge: null,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      id: 'pedidos',
      label: 'Meus Pedidos',
      icon: Package,
      description: 'Histórico de compras',
      badge: userStats.pedidosPendentes > 0 ? userStats.pedidosPendentes : null,
      gradient: 'from-green-500 to-green-600'
    },
    {
      id: 'enderecos',
      label: 'Endereços',
      icon: MapPin,
      description: 'Gerenciar endereços',
      badge: null,
      gradient: 'from-purple-500 to-purple-600'
    },
    {
      id: 'favoritos',
      label: 'Favoritos',
      icon: Heart,
      description: 'Produtos salvos',
      badge: null,
      gradient: 'from-pink-500 to-pink-600'
    },
    {
      id: 'cupons',
      label: 'Cupons',
      icon: Gift,
      description: 'Descontos disponíveis',
      badge: '2',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      id: 'avaliacoes',
      label: 'Avaliações',
      icon: Star,
      description: 'Minhas avaliações',
      badge: null,
      gradient: 'from-amber-500 to-yellow-600'
    },
    {
      id: 'notificacoes',
      label: 'Notificações',
      icon: Bell,
      description: 'Alertas e novidades',
      badge: '3',
      gradient: 'from-indigo-500 to-indigo-600'
    },
    {
      id: 'atividades',
      label: 'Atividades',
      icon: Clock,
      description: 'Histórico de ações',
      badge: null,
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
      description: 'Preferências da conta',
      badge: null,
      gradient: 'from-gray-500 to-gray-600'
    },
    {
      id: 'dados',
      label: 'Dados Pessoais',
      icon: User,
      description: 'Informações da conta',
      badge: null,
      gradient: 'from-cyan-500 to-cyan-600'
    }
  ];

  const quickActions = [
    {
      label: 'Suporte',
      icon: MessageSquare,
      action: () => window.open('/suporte', '_blank'),
      color: 'text-blue-600 hover:text-blue-700'
    },
    {
      label: 'Segurança',
      icon: Shield,
      action: () => setActiveTab('configuracoes'),
      color: 'text-green-600 hover:text-green-700'
    },
    {
      label: 'Pagamentos',
      icon: CreditCard,
      action: () => setActiveTab('dados'),
      color: 'text-purple-600 hover:text-purple-700'
    }
  ];

  const getNivelInfo = (nivel: string) => {
    switch (nivel) {
      case 'Bronze':
        return { color: 'text-amber-600', icon: '🥉', bg: 'bg-amber-50' };
      case 'Prata':
        return { color: 'text-gray-600', icon: '🥈', bg: 'bg-gray-50' };
      case 'Ouro':
        return { color: 'text-yellow-600', icon: '🥇', bg: 'bg-yellow-50' };
      case 'Diamante':
        return { color: 'text-cyan-600', icon: '💎', bg: 'bg-cyan-50' };
      default:
        return { color: 'text-amber-600', icon: '🥉', bg: 'bg-amber-50' };
    }
  };

  const nivelInfo = getNivelInfo(userStats.nivelUsuario);

  return (
    <div className="space-y-6">
      {/* Card de Nível do Usuário */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-slate-50">
          <CardContent className="p-6">
            <div className="text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${nivelInfo.bg} mb-4`}>
                <span className="text-2xl">{nivelInfo.icon}</span>
              </div>
              <h3 className={`font-bold text-lg ${nivelInfo.color} mb-1`}>
                {userStats.nivelUsuario}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {userStats.pontosFidelidade} pontos de fidelidade
              </p>
              
              {/* Barra de progresso */}
              <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                <div 
                  className={`h-2 rounded-full bg-gradient-to-r ${nivelInfo.color.replace('text-', 'from-').replace('-600', '-500')} to-${nivelInfo.color.replace('text-', '').replace('-600', '-400')}`}
                  style={{ width: '65%' }}
                ></div>
              </div>
              
              <p className="text-xs text-gray-500">
                135 pontos para o próximo nível
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Menu de Navegação */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Menu
            </h3>
            
            <div className="space-y-2">
              {menuItems.map((item, index) => {
                // Declarar todas as variáveis no início para evitar problemas de hoisting
                const itemId = item.id || '';
                const itemLabel = item.label || '';
                const itemDescription = item.description || '';
                const itemGradient = item.gradient || '';
                const itemBadge = item.badge || null;
                const IconComponent = item.icon;
                const isActive = activeTab === itemId;
                const iconClassName = isActive ? 'text-white' : 'text-gray-500';
                const buttonVariant = isActive ? "default" : "ghost";
                const buttonClassName = isActive 
                  ? `w-full justify-start h-auto p-3 bg-gradient-to-r ${itemGradient} text-white shadow-lg`
                  : 'w-full justify-start h-auto p-3 hover:bg-gray-50 text-gray-700';
                const descriptionClassName = isActive ? 'text-white/80' : 'text-gray-500';
                const badgeClassName = isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white';
                const badgeVariant = isActive ? "secondary" : "default";
                
                return (
                  <motion.div
                    key={itemId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                  >
                    <Button
                      variant={buttonVariant}
                      className={buttonClassName}
                      onClick={() => setActiveTab(itemId)}
                    >
                      <div className="flex items-center w-full gap-3">
                        <IconComponent className={`h-5 w-5 ${iconClassName}`} />
                        <div className="flex-1 text-left">
                          <div className="font-medium">{itemLabel}</div>
                          <div className={`text-xs ${descriptionClassName}`}>
                            {itemDescription}
                          </div>
                        </div>
                        {itemBadge && (
                          <Badge 
                            variant={badgeVariant}
                            className={`${badgeClassName} text-xs`}
                          >
                            {itemBadge}
                          </Badge>
                        )}
                        {isActive && <ChevronRight className="h-4 w-4 text-white" />}
                      </div>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Ações Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-500" />
              Ações Rápidas
            </h3>
            
            <div className="space-y-2">
              {quickActions.map((action, index) => {
                // Declarar todas as variáveis no início para evitar problemas de hoisting
                const actionLabel = action.label || '';
                const actionColor = action.color || '';
                const actionHandler = action.action || (() => {});
                const IconComponent = action.icon;
                
                return (
                  <motion.div
                    key={actionLabel}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.05 }}
                  >
                    <Button
                      variant="ghost"
                      className={`w-full justify-start h-auto p-3 ${actionColor}`}
                      onClick={actionHandler}
                    >
                      <IconComponent className="h-4 w-4 mr-3" />
                      <span className="font-medium">{actionLabel}</span>
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Estatísticas Rápidas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-4">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Resumo
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pedidos totais</span>
                <span className="font-semibold text-gray-900">{userStats.totalPedidos}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor gasto</span>
                <span className="font-semibold text-green-600">R$ {(userStats.totalGasto || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pontos</span>
                <span className="font-semibold text-purple-600">{userStats.pontosFidelidade}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Botão de Logout */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Button
          variant="outline"
          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sair da Conta
        </Button>
      </motion.div>
    </div>
  );
};

export default EnhancedClienteProfile;
