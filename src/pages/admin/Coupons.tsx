import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Gift, 
  Star,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  Percent,
  Truck,
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping' | 'buy_x_get_y';
  value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  used_count: number;
  is_active: boolean;
  starts_at?: string;
  expires_at?: string;
  created_at: string;
}

interface LoyaltyStats {
  total_members: number;
  bronze_members: number;
  silver_members: number;
  gold_members: number;
  platinum_members: number;
  diamond_members: number;
  total_points: number;
  total_revenue: number;
}

const Coupons: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loyaltyStats, setLoyaltyStats] = useState<LoyaltyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Formulário de criação de cupom
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    name: '',
    description: '',
    type: 'percentage' as const,
    value: 0,
    min_order_amount: 0,
    max_discount_amount: null as number | null,
    usage_limit: null as number | null,
    starts_at: '',
    expires_at: '',
    is_active: true
  });

  useEffect(() => {
    loadCoupons();
    loadLoyaltyStats();
  }, []);

  const loadCoupons = async () => {
    try {
      const response = await fetch('/api/coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setCoupons(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar cupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLoyaltyStats = async () => {
    try {
      const response = await fetch('/api/coupons/loyalty/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setLoyaltyStats(data.data.overview);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas de fidelidade:', error);
    }
  };

  const createCoupon = async () => {
    try {
      const response = await fetch('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newCoupon)
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateForm(false);
        setNewCoupon({
          code: '',
          name: '',
          description: '',
          type: 'percentage',
          value: 0,
          min_order_amount: 0,
          max_discount_amount: null,
          usage_limit: null,
          starts_at: '',
          expires_at: '',
          is_active: true
        });
        loadCoupons();
      } else {
        alert('Erro ao criar cupom: ' + data.error);
      }
    } catch (error) {
      console.error('Erro ao criar cupom:', error);
      alert('Erro ao criar cupom');
    }
  };

  const toggleCouponStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !isActive })
      });
      
      const data = await response.json();
      if (data.success) {
        loadCoupons();
      }
    } catch (error) {
      console.error('Erro ao atualizar cupom:', error);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este cupom?')) return;
    
    try {
      const response = await fetch(`/api/coupons/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        loadCoupons();
      }
    } catch (error) {
      console.error('Erro ao deletar cupom:', error);
    }
  };

  const copyCouponCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Código copiado!');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
        return <Percent className="w-4 h-4" />;
      case 'fixed_amount':
        return <DollarSign className="w-4 h-4" />;
      case 'free_shipping':
        return <Truck className="w-4 h-4" />;
      default:
        return <Gift className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'Percentual';
      case 'fixed_amount':
        return 'Valor Fixo';
      case 'free_shipping':
        return 'Frete Grátis';
      case 'buy_x_get_y':
        return 'Compre X Leve Y';
      default:
        return type;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || coupon.type === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">🎟️ Cupons e Promoções</h1>
        <div className="flex gap-2">
          <Button onClick={loadCoupons} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Cupom
          </Button>
        </div>
      </div>

      {/* Estatísticas de Fidelidade */}
      {loyaltyStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-6 w-6 text-blue-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Total Membros</p>
                  <p className="text-xl font-bold text-gray-900">{loyaltyStats.total_members}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Star className="h-6 w-6 text-yellow-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Pontos Totais</p>
                  <p className="text-xl font-bold text-gray-900">{loyaltyStats.total_points.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(loyaltyStats.total_revenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Gift className="h-6 w-6 text-purple-600" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">VIPs</p>
                  <p className="text-xl font-bold text-gray-900">
                    {loyaltyStats.platinum_members + loyaltyStats.diamond_members}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="coupons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="coupons">Cupons</TabsTrigger>
          <TabsTrigger value="loyalty">Programa de Fidelidade</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
        </TabsList>

        <TabsContent value="coupons" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nome ou código do cupom"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="w-48">
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="percentage">Percentual</SelectItem>
                      <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                      <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Cupons */}
          <div className="grid gap-4">
            {filteredCoupons.map((coupon) => (
              <Card key={coupon.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="flex items-center space-x-2">
                          {getTypeIcon(coupon.type)}
                          <span className="font-semibold text-lg">{coupon.name}</span>
                        </div>
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                          {coupon.is_active ? 'Ativo' : 'Inativo'}
                        </Badge>
                        <Badge variant="outline">
                          {getTypeLabel(coupon.type)}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Código:</span> {coupon.code}
                        </div>
                        <div>
                          <span className="font-medium">Valor:</span> {
                            coupon.type === 'percentage' ? `${coupon.value}%` :
                            coupon.type === 'fixed_amount' ? formatCurrency(coupon.value) :
                            'Frete Grátis'
                          }
                        </div>
                        <div>
                          <span className="font-medium">Usado:</span> {coupon.used_count}/{coupon.usage_limit || '∞'}
                        </div>
                        <div>
                          <span className="font-medium">Valor Mín:</span> {formatCurrency(coupon.min_order_amount)}
                        </div>
                      </div>
                      
                      {coupon.description && (
                        <p className="text-sm text-gray-500 mt-2">{coupon.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500 mt-2">
                        <span>Criado: {formatDate(coupon.created_at)}</span>
                        {coupon.expires_at && (
                          <span>Expira: {formatDate(coupon.expires_at)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyCouponCode(coupon.code)}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                      >
                        <Switch className="w-4 h-4 mr-1" />
                        {coupon.is_active ? 'Desativar' : 'Ativar'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCoupon(coupon.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Programa de Fidelidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Star className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sistema de Pontos Ativo</h3>
                <p className="text-gray-600 mb-4">
                  Clientes ganham pontos a cada compra e podem resgatar descontos
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Bronze</p>
                    <p className="text-gray-600">0+ pontos</p>
                  </div>
                  <div>
                    <p className="font-medium">Prata</p>
                    <p className="text-gray-600">500+ pontos</p>
                  </div>
                  <div>
                    <p className="font-medium">Ouro</p>
                    <p className="text-gray-600">1.500+ pontos</p>
                  </div>
                  <div>
                    <p className="font-medium">Diamante</p>
                    <p className="text-gray-600">5.000+ pontos</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Campanhas Promocionais</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Sistema de campanhas em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Cupom */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Criar Novo Cupom</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                  placeholder="Ex: DESCONTO10"
                />
              </div>
              
              <div>
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={newCoupon.name}
                  onChange={(e) => setNewCoupon({...newCoupon, name: e.target.value})}
                  placeholder="Ex: Desconto de 10%"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select value={newCoupon.type} onValueChange={(value: any) => setNewCoupon({...newCoupon, type: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual</SelectItem>
                    <SelectItem value="fixed_amount">Valor Fixo</SelectItem>
                    <SelectItem value="free_shipping">Frete Grátis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="value">Valor</Label>
                <Input
                  id="value"
                  type="number"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({...newCoupon, value: parseFloat(e.target.value)})}
                  placeholder="10"
                />
              </div>
              
              <div>
                <Label htmlFor="min_order">Valor Mínimo do Pedido</Label>
                <Input
                  id="min_order"
                  type="number"
                  value={newCoupon.min_order_amount}
                  onChange={(e) => setNewCoupon({...newCoupon, min_order_amount: parseFloat(e.target.value)})}
                  placeholder="50"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createCoupon} className="flex-1">
                  Criar Cupom
                </Button>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Coupons;
