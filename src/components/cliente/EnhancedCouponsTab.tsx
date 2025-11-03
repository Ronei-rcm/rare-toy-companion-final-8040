import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tag,
  Gift,
  Crown,
  Clock,
  Copy,
  Check,
  Sparkles,
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Target,
  Award,
  Zap,
  Truck,
  AlertCircle,
  ShoppingCart,
  Star,
  TrendingDown,
  Filter,
  Search,
  X,
  PartyPopper,
  Flame,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Coupon {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'percentage' | 'fixed' | 'freeShipping';
  value: number;
  minValue?: number;
  expiresAt: string;
  category?: string;
  used: boolean;
  isExpired: boolean;
}

interface LoyaltyInfo {
  level: string;
  points: number;
  totalPoints: number;
  nextLevelPoints: number;
  couponsRedeemed: number;
  totalSavings: string;
  totalOrders: number;
  totalSpent: string;
}

interface EnhancedCouponsTabProps {
  userId: string;
}

const EnhancedCouponsTab: React.FC<EnhancedCouponsTabProps> = ({ userId }) => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [filteredCoupons, setFilteredCoupons] = useState<Coupon[]>([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState<LoyaltyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExpiringSoon, setShowExpiringSoon] = useState(true);
  
  const API_BASE_URL = '/api';

  useEffect(() => {
    loadData();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [coupons, activeFilter, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadCoupons(), loadLoyaltyInfo()]);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoading(false);
    }
  };

  const loadCoupons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/coupons`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    }
  };

  const loadLoyaltyInfo = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/loyalty`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyInfo(data);
      }
    } catch (error) {
      console.error('Erro ao carregar informações de fidelidade:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...coupons];

    // Aplicar filtro de status
    switch (activeFilter) {
      case 'available':
        filtered = filtered.filter(c => !c.used && !c.isExpired);
        break;
      case 'used':
        filtered = filtered.filter(c => c.used);
        break;
      case 'expired':
        filtered = filtered.filter(c => c.isExpired && !c.used);
        break;
      case 'percentage':
        filtered = filtered.filter(c => c.type === 'percentage' && !c.used && !c.isExpired);
        break;
      case 'fixed':
        filtered = filtered.filter(c => c.type === 'fixed' && !c.used && !c.isExpired);
        break;
      case 'freeShipping':
        filtered = filtered.filter(c => c.type === 'freeShipping' && !c.used && !c.isExpired);
        break;
    }

    // Aplicar busca
    if (searchQuery) {
      filtered = filtered.filter(c =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCoupons(filtered);
  };

  const handleCopyCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Cupom copiado!', {
      description: 'Cole no campo de cupom ao finalizar a compra',
    });
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Digite um código', {
        description: 'Por favor, digite o código do cupom',
      });
      return;
    }

    try {
      setRedeeming(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/coupons/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: couponCode.toUpperCase() }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('🎉 Cupom resgatado!', {
          description: data.message || 'O cupom foi adicionado à sua conta',
        });
        setCouponCode('');
        await loadData();
      } else {
        toast.error('Cupom inválido', {
          description: data.error || 'Este cupom não é válido ou já expirou',
        });
      }
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível resgatar o cupom',
      });
    } finally {
      setRedeeming(false);
    }
  };

  const getCouponIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-5 h-5" />;
      case 'fixed':
        return <DollarSign className="w-5 h-5" />;
      case 'freeShipping':
        return <Truck className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getCouponTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'from-blue-50 via-blue-100 to-blue-50 border-blue-300';
      case 'fixed':
        return 'from-green-50 via-green-100 to-green-50 border-green-300';
      case 'freeShipping':
        return 'from-purple-50 via-purple-100 to-purple-50 border-purple-300';
      default:
        return 'from-gray-50 via-gray-100 to-gray-50 border-gray-300';
    }
  };

  const getCouponTypeLabel = (type: string, value: number) => {
    switch (type) {
      case 'percentage':
        return `${value}% OFF`;
      case 'fixed':
        return `R$ ${value.toFixed(2)} OFF`;
      case 'freeShipping':
        return 'FRETE GRÁTIS';
      default:
        return 'Desconto';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronze':
        return 'from-amber-600 to-amber-700';
      case 'Prata':
        return 'from-gray-400 to-gray-500';
      case 'Ouro':
        return 'from-yellow-500 to-yellow-600';
      case 'Diamante':
        return 'from-cyan-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'Bronze':
        return '🥉';
      case 'Prata':
        return '🥈';
      case 'Ouro':
        return '🥇';
      case 'Diamante':
        return '💎';
      default:
        return '🏆';
    }
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const days = getDaysUntilExpiry(expiresAt);
    return days > 0 && days <= 7;
  };

  // Estatísticas
  const stats = {
    total: coupons.length,
    available: coupons.filter(c => !c.used && !c.isExpired).length,
    used: coupons.filter(c => c.used).length,
    expired: coupons.filter(c => c.isExpired && !c.used).length,
    expiringSoon: coupons.filter(c => !c.used && !c.isExpired && isExpiringSoon(c.expiresAt)).length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
              <Gift className="w-7 h-7 text-white" />
            </div>
            Meus Cupons
            {stats.available > 0 && (
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-lg px-3 py-1">
                {stats.available} {stats.available === 1 ? 'disponível' : 'disponíveis'}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground mt-1">
            Economize em suas compras com cupons exclusivos
          </p>
        </div>

        {loyaltyInfo && (
          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Economia Total</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {loyaltyInfo.totalSavings}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Alerta de cupons expirando */}
      {stats.expiringSoon > 0 && showExpiringSoon && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Alert className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300">
            <Flame className="h-5 w-5 text-orange-600" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-orange-900">
                  ⚠️ {stats.expiringSoon} {stats.expiringSoon === 1 ? 'cupom expira' : 'cupons expiram'} em breve!
                </span>
                <span className="text-orange-700 ml-2">
                  Use antes que {stats.expiringSoon === 1 ? 'ele expire' : 'eles expirem'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowExpiringSoon(false)}
                className="text-orange-700 hover:text-orange-900"
              >
                <X className="w-4 h-4" />
              </Button>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Programa de Fidelidade */}
      {loyaltyInfo && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-300 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/20 to-transparent rounded-full blur-3xl"></div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="w-6 h-6 text-amber-600" />
                  Programa de Fidelidade
                </div>
                <Badge className={`bg-gradient-to-r ${getLevelColor(loyaltyInfo.level)} text-white border-0 text-lg px-4 py-1`}>
                  {getLevelIcon(loyaltyInfo.level)} {loyaltyInfo.level}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 relative z-10">
              {/* Barra de progresso */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-700">Pontos Acumulados</span>
                  <span className="text-muted-foreground font-medium">
                    {loyaltyInfo.points} / {loyaltyInfo.nextLevelPoints} pontos
                  </span>
                </div>
                <Progress 
                  value={(loyaltyInfo.points / loyaltyInfo.nextLevelPoints) * 100} 
                  className="h-4 bg-white/60"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Faltam {loyaltyInfo.nextLevelPoints - loyaltyInfo.points} pontos para o próximo nível
                </p>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-amber-200 hover:shadow-md transition-shadow">
                  <Trophy className="w-5 h-5 mx-auto mb-2 text-amber-600" />
                  <p className="text-xs text-muted-foreground text-center">Total de Pontos</p>
                  <p className="text-xl font-bold text-amber-700 text-center">{loyaltyInfo.totalPoints}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-orange-200 hover:shadow-md transition-shadow">
                  <Star className="w-5 h-5 mx-auto mb-2 text-orange-600" />
                  <p className="text-xs text-muted-foreground text-center">Cupons Usados</p>
                  <p className="text-xl font-bold text-orange-700 text-center">{loyaltyInfo.couponsRedeemed}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-green-200 hover:shadow-md transition-shadow">
                  <TrendingUp className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <p className="text-xs text-muted-foreground text-center">Total Gasto</p>
                  <p className="text-xl font-bold text-green-700 text-center">R$ {loyaltyInfo.totalSpent}</p>
                </div>
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-red-200 hover:shadow-md transition-shadow">
                  <TrendingDown className="w-5 h-5 mx-auto mb-2 text-red-600" />
                  <p className="text-xs text-muted-foreground text-center">Economia Total</p>
                  <p className="text-xl font-bold text-red-700 text-center">R$ {loyaltyInfo.totalSavings}</p>
                </div>
              </div>

              {/* Benefícios do próximo nível */}
              {loyaltyInfo.level !== 'Diamante' && (
                <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-amber-200">
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    Benefícios do Próximo Nível
                  </h4>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Cupom de desconto exclusivo
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Frete grátis em compras selecionadas
                    </li>
                    <li className="flex items-center gap-2 text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      Acesso antecipado a promoções
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Resgatar Cupom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-2 border-dashed border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <PartyPopper className="w-5 h-5 text-blue-600" />
              Resgatar Cupom
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Digite o código do cupom (ex: BEMVINDO10)"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleRedeemCoupon()}
                className="flex-1 border-2 border-blue-200 focus:border-blue-400"
                disabled={redeeming}
              />
              <Button 
                onClick={handleRedeemCoupon}
                disabled={redeeming}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              >
                {redeeming ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Resgatando...
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4 mr-2" />
                    Resgatar
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Tem um cupom? Digite o código acima para adicioná-lo à sua conta
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Barra de busca e filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar cupons por código, título ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 border-2"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 transform -translate-y-1/2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Tabs de filtros */}
        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto gap-2">
            <TabsTrigger value="all" className="flex items-center gap-1">
              <Filter className="w-4 h-4" />
              Todos ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="available" className="flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Disponíveis ({stats.available})
            </TabsTrigger>
            <TabsTrigger value="used" className="flex items-center gap-1">
              <Check className="w-4 h-4" />
              Usados ({stats.used})
            </TabsTrigger>
            <TabsTrigger value="expired" className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Expirados ({stats.expired})
            </TabsTrigger>
            <TabsTrigger value="percentage" className="flex items-center gap-1">
              <Percent className="w-4 h-4" />
              Percentual
            </TabsTrigger>
            <TabsTrigger value="freeShipping" className="flex items-center gap-1">
              <Truck className="w-4 h-4" />
              Frete Grátis
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* Lista de Cupons */}
      {filteredCoupons.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card className="border-2 border-dashed">
            <CardContent className="p-12 text-center">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-4">
                <Gift className="w-16 h-16 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {searchQuery ? 'Nenhum cupom encontrado' : 'Nenhum cupom nesta categoria'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery 
                  ? 'Tente buscar com outros termos'
                  : activeFilter === 'all'
                    ? 'Você não tem cupons no momento. Continue comprando para ganhar novos cupons!'
                    : 'Você não possui cupons nesta categoria'}
              </p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Limpar busca
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredCoupons.map((coupon, index) => {
              const isExpired = coupon.isExpired;
              const isUsed = coupon.used;
              const isActive = !isExpired && !isUsed;
              const expiringSoon = isActive && isExpiringSoon(coupon.expiresAt);
              const daysLeft = getDaysUntilExpiry(coupon.expiresAt);

              return (
                <motion.div
                  key={coupon.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`relative overflow-hidden bg-gradient-to-br ${getCouponTypeColor(coupon.type)} border-2 ${
                    !isActive ? 'opacity-60 grayscale' : expiringSoon ? 'ring-2 ring-orange-400 ring-offset-2' : 'hover:shadow-xl transition-all hover:-translate-y-1'
                  }`}>
                    {/* Elemento decorativo */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl"></div>
                    
                    {expiringSoon && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 animate-pulse">
                          <Flame className="w-3 h-3 mr-1" />
                          Expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-6 relative z-10">
                      {/* Header do cupom */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className={`p-3 rounded-xl ${
                            isActive ? 'bg-white shadow-lg' : 'bg-gray-200'
                          }`}>
                            {getCouponIcon(coupon.type)}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg leading-tight">{coupon.title}</h3>
                            <p className="text-sm text-muted-foreground">{coupon.description}</p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 ml-2">
                          {isUsed && <Badge variant="secondary" className="whitespace-nowrap">✓ Usado</Badge>}
                          {isExpired && <Badge variant="destructive" className="whitespace-nowrap">⏰ Expirado</Badge>}
                          {isActive && !expiringSoon && <Badge className="bg-green-500 whitespace-nowrap">✨ Ativo</Badge>}
                        </div>
                      </div>

                      {/* Valor do desconto */}
                      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-lg mb-4 border-2 border-dashed border-gray-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Código do Cupom</p>
                            <p className="text-3xl font-black font-mono tracking-wider text-gray-800">
                              {coupon.code}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground mb-1">Desconto</p>
                            <p className="text-2xl font-bold text-green-600">
                              {getCouponTypeLabel(coupon.type, coupon.value)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Detalhes */}
                      <div className="space-y-2 mb-4">
                        {coupon.minValue && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Target className="w-4 h-4 flex-shrink-0" />
                            <span>Compra mínima: <span className="font-semibold text-gray-700">R$ {coupon.minValue.toFixed(2)}</span></span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span>
                            Válido até <span className="font-semibold text-gray-700">{new Date(coupon.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          </span>
                        </div>
                        {coupon.category && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Award className="w-4 h-4 flex-shrink-0" />
                            <span className="capitalize">{coupon.category.replace('_', ' ')}</span>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCoupon(coupon.code, coupon.id)}
                          disabled={!isActive}
                          className="flex-1 border-2"
                        >
                          {copiedId === coupon.id ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copiado!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copiar Código
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          disabled={!isActive}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Usar Agora
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default EnhancedCouponsTab;

