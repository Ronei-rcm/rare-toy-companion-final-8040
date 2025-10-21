import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Tag,
  Gift,
  Trophy,
  Star,
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
  Crown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface CouponsTabProps {
  userId: string;
}

const CouponsTab: React.FC<CouponsTabProps> = ({ userId }) => {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loyaltyInfo, setLoyaltyInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadCoupons();
    loadLoyaltyInfo();
  }, [userId]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/coupons`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCoupons(data.coupons || []);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    } finally {
      setLoading(false);
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

  const handleCopyCoupon = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: 'Cupom copiado!',
      description: 'Cole no campo de cupom ao finalizar a compra',
    });
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: 'Digite um código',
        description: 'Por favor, digite o código do cupom',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/coupons/redeem`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ code: couponCode }),
      });

      if (response.ok) {
        toast({
          title: 'Cupom resgatado!',
          description: 'O cupom foi adicionado à sua conta',
        });
        setCouponCode('');
        loadCoupons();
      } else {
        const data = await response.json();
        toast({
          title: 'Cupom inválido',
          description: data.error || 'Este cupom não é válido ou já expirou',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível resgatar o cupom',
        variant: 'destructive',
      });
    }
  };

  const getCouponIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-5 h-5" />;
      case 'fixed':
        return <DollarSign className="w-5 h-5" />;
      case 'freeShipping':
        return <Zap className="w-5 h-5" />;
      case 'loyalty':
        return <Crown className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const getCouponTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'from-blue-50 to-blue-100 border-blue-200';
      case 'fixed':
        return 'from-green-50 to-green-100 border-green-200';
      case 'freeShipping':
        return 'from-purple-50 to-purple-100 border-purple-200';
      case 'loyalty':
        return 'from-amber-50 to-amber-100 border-amber-200';
      default:
        return 'from-gray-50 to-gray-100 border-gray-200';
    }
  };

  const getFilteredCoupons = () => {
    if (filter === 'all') return coupons;
    if (filter === 'active') return coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date());
    if (filter === 'used') return coupons.filter(c => c.used);
    if (filter === 'expired') return coupons.filter(c => new Date(c.expiresAt) < new Date());
    return coupons.filter(c => c.type === filter);
  };

  const filteredCoupons = getFilteredCoupons();
  const activeCoupons = coupons.filter(c => !c.used && new Date(c.expiresAt) > new Date()).length;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-24 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="w-6 h-6" />
            Cupons e Promoções
            {activeCoupons > 0 && (
              <Badge className="bg-green-500">
                {activeCoupons} ativo{activeCoupons > 1 ? 's' : ''}
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            Economize em suas compras com cupons exclusivos
          </p>
        </div>
      </div>

      {/* Programa de Fidelidade */}
      {loyaltyInfo && (
        <Card className="bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 border-2 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-600" />
              Programa de Fidelidade
              <Badge className="bg-amber-500 ml-auto">
                Nível {loyaltyInfo.level}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Pontos Acumulados</span>
                <span className="text-muted-foreground">
                  {loyaltyInfo.points} / {loyaltyInfo.nextLevelPoints} pontos
                </span>
              </div>
              <Progress value={(loyaltyInfo.points / loyaltyInfo.nextLevelPoints) * 100} className="h-3" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/60 p-3 rounded-lg text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-600" />
                <p className="text-xs text-muted-foreground">Total de Pontos</p>
                <p className="text-lg font-bold text-amber-700">{loyaltyInfo.totalPoints}</p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg text-center">
                <Star className="w-5 h-5 mx-auto mb-1 text-orange-600" />
                <p className="text-xs text-muted-foreground">Cupons Resgatados</p>
                <p className="text-lg font-bold text-orange-700">{loyaltyInfo.couponsRedeemed}</p>
              </div>
              <div className="bg-white/60 p-3 rounded-lg text-center">
                <TrendingUp className="w-5 h-5 mx-auto mb-1 text-red-600" />
                <p className="text-xs text-muted-foreground">Economia Total</p>
                <p className="text-lg font-bold text-red-700">R$ {(loyaltyInfo.totalSavings || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="bg-white/60 p-4 rounded-lg">
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                Benefícios do Próximo Nível
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  Cupom de 20% de desconto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  Frete grátis em todas as compras
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-600" />
                  Acesso antecipado a promoções
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resgatar Cupom */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Resgatar Cupom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite o código do cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleRedeemCoupon()}
              className="flex-1"
            />
            <Button onClick={handleRedeemCoupon}>
              <Gift className="w-4 h-4 mr-2" />
              Resgatar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todos ({coupons.length})
            </Button>
            <Button
              variant={filter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('active')}
            >
              Ativos ({activeCoupons})
            </Button>
            <Button
              variant={filter === 'used' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('used')}
            >
              Usados
            </Button>
            <Button
              variant={filter === 'expired' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('expired')}
            >
              Expirados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Cupons */}
      {filteredCoupons.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum cupom disponível</h3>
            <p className="text-muted-foreground">
              {filter === 'all'
                ? 'Você não tem cupons no momento. Continue comprando para ganhar novos cupons!'
                : 'Nenhum cupom nesta categoria'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredCoupons.map((coupon, index) => {
              const isExpired = new Date(coupon.expiresAt) < new Date();
              const isUsed = coupon.used;
              const isActive = !isExpired && !isUsed;

              return (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className={`bg-gradient-to-br ${getCouponTypeColor(coupon.type)} ${
                    !isActive ? 'opacity-60' : 'hover:shadow-lg transition-shadow'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-xl ${
                            isActive ? 'bg-white shadow-md' : 'bg-gray-200'
                          }`}>
                            {getCouponIcon(coupon.type)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{coupon.title}</h3>
                            <p className="text-sm text-muted-foreground">{coupon.description}</p>
                          </div>
                        </div>
                        {isUsed && <Badge variant="secondary">Usado</Badge>}
                        {isExpired && <Badge variant="destructive">Expirado</Badge>}
                        {isActive && <Badge className="bg-green-500">Ativo</Badge>}
                      </div>

                      <div className="bg-white/60 p-4 rounded-lg mb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Código do Cupom</p>
                            <p className="text-2xl font-bold font-mono tracking-wider">
                              {coupon.code}
                            </p>
                          </div>
                          <Button
                            variant={copiedId === coupon.id ? 'default' : 'outline'}
                            size="icon"
                            onClick={() => handleCopyCoupon(coupon.code, coupon.id)}
                            disabled={!isActive}
                          >
                            {copiedId === coupon.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {coupon.type === 'percentage' && `${coupon.value}% de desconto`}
                            {coupon.type === 'fixed' && `R$ ${coupon.value} de desconto`}
                            {coupon.type === 'freeShipping' && 'Frete grátis'}
                          </span>
                        </div>
                        {coupon.minValue && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Target className="w-4 h-4" />
                            <span>Compra mínima: R$ {coupon.minValue}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>
                            Válido até {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
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

export default CouponsTab;

