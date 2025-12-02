
import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import ClienteProfile from '@/components/cliente/ClienteProfile';
import EnhancedClienteProfile from '@/components/cliente/EnhancedClienteProfile';
import PedidosTab from '@/components/cliente/PedidosTab';
import PedidosTabEvolved from '@/components/cliente/PedidosTabEvolved';
import EnderecosTab from '@/components/cliente/EnderecosTab';
import FavoritosTab from '@/components/cliente/FavoritosTab';
import DadosTab from '@/components/cliente/DadosTab';
import CustomerDashboard from '@/components/cliente/CustomerDashboard';
import Wishlist from '@/components/cliente/Wishlist';
import AddressManager from '@/components/cliente/AddressManager';
import CustomerProfile from '@/components/cliente/CustomerProfile';
import NotificationsTab from '@/components/cliente/NotificationsTab';
import CouponsTab from '@/components/cliente/CouponsTab';
import EnhancedCouponsTab from '@/components/cliente/EnhancedCouponsTab';
import SettingsTab from '@/components/cliente/SettingsTab';
import EnhancedSettingsTab from '@/components/cliente/EnhancedSettingsTab';
import ReviewsTab from '@/components/cliente/ReviewsTab';
import EnhancedMinhaConta from '@/components/cliente/EnhancedMinhaConta';
import DashboardSuperEvolved from '@/components/cliente/DashboardSuperEvolved';
import EnhancedAddressManager from '@/components/cliente/EnhancedAddressManager';
import EnhancedPedidosTab from '@/components/cliente/EnhancedPedidosTab';
import OrdersUnified from '@/components/cliente/OrdersUnified';
import ActivityHistory from '@/components/cliente/ActivityHistory';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useUserStats, useRefreshUserData, formatCurrency, getFidelityColor, getFidelityIcon } from '@/hooks/useUserStats';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { useCart } from '@/contexts/CartContext';
// Cache busting import - v5.1
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Package, 
  MapPin, 
  Heart, 
  Bell, 
  Gift, 
  Star, 
  Settings, 
  Shield,
  Crown,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Zap,
  RefreshCw,
  ShoppingCart,
  ShoppingBag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MinhaConta = () => {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useCurrentUser() as any;
  const [activeTab, setActiveTab] = useState('pedidos');
  // Removido showWelcome - banner desnecessário
  const [cacheVersion] = useState('v8.0.0-' + Date.now());
  const [buildTimestamp] = useState(Date.now());
  
  // Buscar dados reais do usuário
  const { data: userStats, isLoading: statsLoading, error: statsError } = useUserStats(user?.id || '');
  const { refreshAll } = useRefreshUserData();
  const { stats: customerStats, loading: customerStatsLoading } = useCustomerStats();
  const { state: cartState } = useCart();
  
  // Sincronizar aba via querystring (?tab=enderecos) - v8 - DADOS REAIS
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    const stored = localStorage.getItem('minha_conta_tab');
    if (tab) setActiveTab(tab);
    else if (stored) setActiveTab(stored);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState({}, '', url);
    try { localStorage.setItem('minha_conta_tab', activeTab); } catch {}
  }, [activeTab]);

  // Função para atualizar dados
  const handleRefreshData = () => {
    if (user?.id) {
      refreshAll(user.id);
    }
  };
   
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso');
      navigate('/');
    } catch (error) {
      toast.error('Erro ao sair da conta');
    }
  };

  // Dados do usuário (fallback para dados mockados se não houver dados reais)
  const displayStats = userStats || {
    pedidos: { total: 0, pendentes: 0, total_gasto: 0 },
    carrinho: { itens: 0, valor: 0 },
    favoritos: { total: 0 },
    fidelidade: { nivel: 'Bronze', pontos: 0, proximo_nivel: 200, progresso: 0 }
  };
  
  const nivelInfo = {
    color: displayStats.fidelidade?.nivel === 'Bronze' ? 'bg-amber-600' : 
           displayStats.fidelidade?.nivel === 'Prata' ? 'bg-gray-400' :
           displayStats.fidelidade?.nivel === 'Ouro' ? 'bg-yellow-500' : 'bg-cyan-500',
    icon: getFidelityIcon(displayStats.fidelidade?.nivel || 'Bronze'),
    gradient: getFidelityColor(displayStats.fidelidade?.nivel || 'Bronze')
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return user ? <DashboardSuperEvolved /> : null;
      case 'pedidos':
        return user ? <OrdersUnified /> : <PedidosTab />;
      case 'enderecos':
        return user ? <EnhancedAddressManager /> : <EnderecosTab />;
      case 'favoritos':
        return user ? <Wishlist userId={user.id} /> : <FavoritosTab />;
      case 'notificacoes':
        return user ? <NotificationsTab userId={user.id} /> : null;
      case 'cupons':
        return user ? <EnhancedCouponsTab userId={user.id} /> : null;
      case 'avaliacoes':
        return user ? <ReviewsTab userId={user.id} /> : null;
      case 'configuracoes':
        return user ? <EnhancedSettingsTab userId={user.id} /> : <EnhancedSettingsTab userId="cliente@exemplo.com" />;
      case 'dados':
        return user ? <CustomerProfile userId={user.id} /> : <DadosTab />;
      case 'atividades':
        return user ? <ActivityHistory userId={user.id} /> : null;
      default:
        return user ? <EnhancedMinhaConta /> : null;
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        {/* Header com gradiente moderno */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 opacity-90"></div>
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative container mx-auto px-4 py-12">
            {!isLoading && !user ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-white"
              >
                <div className="max-w-md mx-auto p-8 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
                  <Shield className="h-16 w-16 mx-auto mb-4 text-white/80" />
                  <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
                  <p className="text-white/80 mb-6">Faça login para acessar sua área personalizada</p>
                  <Link to="/auth/login">
                    <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90">
                      <User className="h-5 w-5 mr-2" />
                      Fazer Login
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-white"
              >
                {(isLoading || statsLoading) ? (
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-20 w-20 rounded-full bg-white/20" />
                    <div className="space-y-3">
                      <Skeleton className="h-6 w-48 bg-white/20" />
                      <Skeleton className="h-4 w-64 bg-white/20" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                    {/* Avatar e informações básicas */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20 border-4 border-white/30 shadow-xl">
                          <AvatarImage src={user?.avatar_url} alt={user?.nome} />
                          <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                            {user?.nome ? user.nome.charAt(0).toUpperCase() : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-1 border-2 border-white">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      </div>
                      <div>
                        <h1 className="text-3xl font-bold mb-1">{user?.nome || 'Visitante'}</h1>
                        <p className="text-white/80 text-lg">{user?.email || 'Sem e-mail cadastrado'}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`bg-gradient-to-r ${nivelInfo.gradient} text-white border-0`}>
                            <Crown className="h-3 w-3 mr-1" />
                            {nivelInfo.icon} {displayStats.fidelidade?.nivel || 'Bronze'}
                          </Badge>
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            <Award className="h-3 w-3 mr-1" />
                            {displayStats.fidelidade?.pontos || 0} pontos
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-white/80 hover:text-white hover:bg-white/10"
                            onClick={handleRefreshData}
                          >
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Estatísticas rápidas - Sincronizadas com dados reais */}
                    <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 lg:mt-0">
                      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                        <CardContent className="p-4 text-center">
                          <Package className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                          <div className="text-2xl font-bold">
                            {customerStatsLoading ? '...' : (customerStats?.totalPedidos || 0)}
                          </div>
                          <div className="text-sm text-white/80">Pedidos</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                        <CardContent className="p-4 text-center">
                          <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-300" />
                          <div className="text-2xl font-bold">
                            {customerStatsLoading ? '...' : (customerStats?.pedidosPendentes || 0)}
                          </div>
                          <div className="text-sm text-white/80">Pendentes</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                        <CardContent className="p-4 text-center">
                          <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-300" />
                          <div className="text-2xl font-bold">
                            {customerStatsLoading ? '...' : formatCurrency(customerStats?.totalGasto || 0)}
                          </div>
                          <div className="text-sm text-white/80">Total Gasto</div>
                        </CardContent>
                      </Card>
                      <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
                        <CardContent className="p-4 text-center">
                          <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-purple-300" />
                          <div className="text-2xl font-bold">{cartState.quantidadeTotal || 0}</div>
                          <div className="text-sm text-white/80">Carrinho</div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </div>

        {/* Conteúdo principal */}
        {user && (
          <div className="container mx-auto px-4 -mt-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar de navegação */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <EnhancedClienteProfile 
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    handleLogout={handleLogout}
                    userStats={userStats}
                  />
                </motion.div>
              </div>

              {/* Conteúdo da aba ativa */}
              <div className="lg:col-span-3">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <AnimatePresence mode="wait">
                    {renderTabContent()}
                  </AnimatePresence>
                </motion.div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
};

export default MinhaConta;
