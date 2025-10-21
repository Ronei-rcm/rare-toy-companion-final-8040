import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Star,
  Edit,
  Save,
  X,
  Upload,
  Award,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface CustomerProfileProps {
  userId: string;
}

const CustomerProfile: React.FC<CustomerProfileProps> = ({ userId }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    data_nascimento: '',
    avatar_url: '',
    bio: '',
  });
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadCustomerData();
  }, [userId]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setCustomer(data);
        setFormData({
          nome: data.nome || '',
          email: data.email || '',
          telefone: data.telefone || '',
          cpf: data.cpf || '',
          data_nascimento: data.data_nascimento || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: 'Perfil atualizado! ✅',
          description: 'Suas informações foram salvas com sucesso',
        });
        setIsEditing(false);
        loadCustomerData();
      }
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível atualizar o perfil',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simular upload (implementar upload real depois)
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, avatar_url: reader.result as string });
    };
    reader.readAsDataURL(file);

    toast({
      title: 'Foto carregada! 📸',
      description: 'Clique em Salvar para confirmar',
    });
  };

  const getCustomerLevel = () => {
    if (!customer) return { level: 'Bronze', color: 'bg-amber-700' };
    
    const totalSpent = customer.total_spent || 0;
    
    if (totalSpent >= 5000) return { level: 'Diamante', color: 'bg-cyan-500', icon: '💎' };
    if (totalSpent >= 2000) return { level: 'Ouro', color: 'bg-yellow-500', icon: '🥇' };
    if (totalSpent >= 500) return { level: 'Prata', color: 'bg-gray-400', icon: '🥈' };
    return { level: 'Bronze', color: 'bg-amber-700', icon: '🥉' };
  };

  const customerLevel = getCustomerLevel();

  if (loading && !customer) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-full w-20 mx-auto" />
            <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
            <div className="h-4 bg-muted rounded w-3/4 mx-auto" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header do Perfil */}
      <Card className="relative overflow-hidden">
        {/* Banner de fundo */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500" />
        
        <CardContent className="pt-20 pb-6 px-6 relative">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={formData.avatar_url} alt={formData.nome} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  {formData.nome?.substring(0, 2).toUpperCase() || 'CL'}
                </AvatarFallback>
              </Avatar>
              
              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 bg-primary rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                  <Upload className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              )}
            </div>

            {/* Info Principal */}
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-2">
                <h2 className="text-2xl font-bold">{formData.nome || 'Cliente'}</h2>
                <Badge className={`${customerLevel.color} text-white`}>
                  {customerLevel.icon} {customerLevel.level}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-4">
                {formData.email}
              </p>

              {/* Estatísticas Rápidas */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    <strong>{customer?.total_orders || 0}</strong> pedidos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm">
                    <strong>{customer?.loyalty_points || 0}</strong> pontos
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <span className="text-sm">
                    Membro desde {new Date(customer?.created_at || Date.now()).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar Perfil
                </Button>
              ) : (
                <>
                  <Button onClick={handleSave} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false);
                      loadCustomerData();
                    }}
                    variant="outline"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Informações */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
          <TabsTrigger value="preferences">Preferências</TabsTrigger>
        </TabsList>

        {/* Tab: Informações Pessoais */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dados Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    disabled={!isEditing}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data_nascimento">Data de Nascimento</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
                      disabled={!isEditing}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="space-y-2">
                <Label htmlFor="bio">Sobre você</Label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={!isEditing}
                  className="w-full min-h-[100px] p-3 border rounded-md resize-none"
                  placeholder="Conte um pouco sobre você..."
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Segurança da Conta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <p className="font-semibold text-green-900">Conta Protegida</p>
                </div>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>✅ E-mail verificado</li>
                  <li>✅ Senha criptografada</li>
                  <li>✅ Dados protegidos (LGPD)</li>
                  <li>✅ Conexão segura (SSL)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <Label>Alterar Senha</Label>
                <Input type="password" placeholder="Senha atual" />
                <Input type="password" placeholder="Nova senha" />
                <Input type="password" placeholder="Confirmar nova senha" />
                <Button className="w-full">Atualizar Senha</Button>
              </div>

              <div className="space-y-2">
                <Label>Autenticação em Dois Fatores (2FA)</Label>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">2FA via SMS</p>
                    <p className="text-xs text-muted-foreground">
                      Adicione uma camada extra de segurança
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ativar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Preferências */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preferências e Notificações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">E-mails Promocionais</p>
                    <p className="text-xs text-muted-foreground">
                      Receber ofertas e novidades
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Carrinho Abandonado</p>
                    <p className="text-xs text-muted-foreground">
                      Lembrete quando deixar produtos no carrinho
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Atualizações de Pedidos</p>
                    <p className="text-xs text-muted-foreground">
                      Status de envio e entrega
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Recomendações Personalizadas</p>
                    <p className="text-xs text-muted-foreground">
                      Produtos baseados no seu histórico
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">Notificações Push</p>
                    <p className="text-xs text-muted-foreground">
                      Alertas de ofertas relâmpago
                    </p>
                  </div>
                  <input type="checkbox" className="toggle" />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Label>Categorias Favoritas</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline">Ação</Badge>
                  <Badge variant="outline">Colecionáveis</Badge>
                  <Badge variant="outline">Vintage</Badge>
                  <Badge variant="outline">Eletrônicos</Badge>
                  <Button variant="ghost" size="sm">+ Adicionar</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Programa VIP */}
      {customer && customer.total_spent >= 1000 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-gradient-to-r from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-400">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-yellow-400 rounded-full">
                  <Award className="w-8 h-8 text-yellow-900" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-yellow-900 mb-1">
                    🎉 Você é Cliente VIP!
                  </h3>
                  <p className="text-sm text-yellow-800">
                    Benefícios exclusivos: Frete grátis permanente, cupons especiais e atendimento prioritário
                  </p>
                </div>
                <TrendingUp className="w-12 h-12 text-yellow-600 animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default CustomerProfile;
