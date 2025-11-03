import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Lock,
  Eye,
  EyeOff,
  Shield,
  Bell,
  Mail,
  Smartphone,
  Globe,
  Database,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle,
  Key,
  UserX,
  History,
  Cookie,
  Palette,
  Zap,
  Moon,
  Sun,
  Monitor,
  CreditCard,
  MapPin,
  Package,
  Heart,
  Star,
  Gift,
  MessageSquare,
  FileText,
  Share2,
  Link,
  Chrome,
  Fingerprint,
  Wifi,
  Volume2,
  VolumeX,
  Image,
  Video,
  Music,
  Type,
  Languages,
  DollarSign,
  TrendingUp,
  Activity,
  Filter,
  SortAsc,
  List,
  Grid,
  Clock,
  Calendar,
  BarChart3,
  PieChart,
  Save,
  RefreshCw,
  LogOut,
  Laptop,
  Tablet,
  Watch,
  Navigation,
  ShoppingBag,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedSettingsTabProps {
  userId: string;
}

const EnhancedSettingsTab: React.FC<EnhancedSettingsTabProps> = ({ userId }) => {
  const [activeSection, setActiveSection] = useState('security');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const { user, logout } = useCurrentUser() as any;
  
  const API_BASE_URL = '/api';

  // Estados
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [security, setSecurity] = useState({
    twoFactorAuth: false,
    biometric: false,
    sessionTimeout: 30,
    loginAlerts: true,
    suspiciousActivityAlerts: true,
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showPurchaseHistory: false,
    showWishlist: false,
    showFavorites: false,
    showReviews: true,
    allowMarketing: true,
    allowAnalytics: true,
    allowCookies: true,
    allowPersonalization: true,
    shareDataWithPartners: false,
  });

  const [notifications, setNotifications] = useState({
    email: {
      orders: true,
      promotions: true,
      newsletter: false,
      recommendations: true,
      security: true,
      newProducts: false,
      priceDrops: true,
      backInStock: true,
    },
    push: {
      orders: true,
      promotions: false,
      chat: true,
      security: true,
    },
    sms: {
      orders: true,
      promotions: false,
      security: true,
    },
  });

  const [display, setDisplay] = useState({
    theme: 'light',
    colorScheme: 'blue',
    fontSize: 'medium',
    compactMode: false,
    animations: true,
    reducedMotion: false,
    highContrast: false,
    productView: 'grid',
    itemsPerPage: 12,
    showPrices: true,
    showImages: true,
    autoplayVideos: false,
  });

  const [preferences, setPreferences] = useState({
    language: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    emailFrequency: 'weekly',
    defaultPayment: 'pix',
    defaultShipping: 'standard',
    autoFillForms: true,
    rememberFilters: true,
    showRecommendations: true,
  });

  const [accessibility, setAccessibility] = useState({
    screenReader: false,
    keyboardNavigation: true,
    captions: false,
    largeText: false,
    highContrast: false,
    reducedMotion: false,
    focusIndicator: true,
    skipLinks: true,
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [connectedApps, setConnectedApps] = useState<any[]>([]);

  useEffect(() => {
    loadAllSettings();
  }, [userId]);

  const loadAllSettings = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSettings(),
        loadSessions(),
        loadConnectedApps(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/settings`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.security) setSecurity(data.security);
        if (data.privacy) setPrivacy(data.privacy);
        if (data.notifications) setNotifications(data.notifications);
        if (data.display) setDisplay(data.display);
        if (data.preferences) setPreferences(data.preferences);
        if (data.accessibility) setAccessibility(data.accessibility);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/sessions`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
    }
  };

  const loadConnectedApps = async () => {
    // Simular apps conectados
    setConnectedApps([
      { id: '1', name: 'Google', icon: Chrome, connected: true, permissions: ['Email', 'Perfil'] },
      { id: '2', name: 'Facebook', icon: Share2, connected: false, permissions: [] },
    ]);
  };

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('Senhas não coincidem', {
        description: 'A nova senha e a confirmação devem ser iguais',
      });
      return;
    }

    if (passwords.new.length < 8) {
      toast.error('Senha muito curta', {
        description: 'A senha deve ter pelo menos 8 caracteres',
      });
      return;
    }

    // Verificar força da senha
    const strength = calculatePasswordStrength(passwords.new);
    if (strength < 3) {
      toast.error('Senha fraca', {
        description: 'Use uma combinação de letras, números e símbolos',
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/change-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwords.current,
          newPassword: passwords.new,
        }),
      });

      if (response.ok) {
        toast.success('✅ Senha alterada!', {
          description: 'Sua senha foi alterada com sucesso',
        });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        toast.error('Erro ao alterar senha', {
          description: data.error || 'Senha atual incorreta',
        });
      }
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível alterar a senha',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    return Math.min(strength, 5);
  };

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength <= 1) return 'bg-red-500';
    if (strength <= 2) return 'bg-orange-500';
    if (strength <= 3) return 'bg-yellow-500';
    if (strength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength <= 1) return 'Muito Fraca';
    if (strength <= 2) return 'Fraca';
    if (strength <= 3) return 'Média';
    if (strength <= 4) return 'Forte';
    return 'Muito Forte';
  };

  const handleSaveSection = async (section: string, data: any) => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/customers/${userId}/settings/${section}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      toast.success('✅ Salvo!', {
        description: 'Configurações atualizadas com sucesso',
      });
      setUnsavedChanges(false);
    } catch (error) {
      toast.error('Erro ao salvar', {
        description: 'Não foi possível salvar as configurações',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      setSessions(sessions.filter(s => s.id !== sessionId));
      toast.success('Sessão encerrada', {
        description: 'A sessão foi encerrada com sucesso',
      });
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível encerrar a sessão',
      });
    }
  };

  const handleExportData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/export-data`, {
        credentials: 'include',
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meus-dados-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        window.URL.revokeObjectURL(url);

        toast.success('📥 Dados exportados!', {
          description: 'Seus dados foram baixados com sucesso',
        });
      }
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível exportar seus dados',
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '⚠️ TEM CERTEZA?\n\nExcluir sua conta removerá PERMANENTEMENTE todos os seus dados:\n\n• Pedidos e histórico\n• Endereços salvos\n• Favoritos e lista de desejos\n• Avaliações\n• Cupons\n• Pontos de fidelidade\n\nEsta ação NÃO pode ser desfeita!'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Para confirmar, digite "EXCLUIR" (em maiúsculas):'
    );

    if (doubleConfirm !== 'EXCLUIR') {
      toast.info('Cancelado', {
        description: 'A exclusão da conta foi cancelada',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/delete-account`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Conta excluída', {
          description: 'Sua conta foi excluída. Redirecionando...',
        });
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (error) {
      toast.error('Erro', {
        description: 'Não foi possível excluir a conta',
      });
    }
  };

  const handleResetAllSettings = () => {
    const confirmed = window.confirm(
      'Deseja restaurar todas as configurações para os valores padrão?'
    );
    
    if (confirmed) {
      // Reset para valores padrão
      setDisplay({
        theme: 'light',
        colorScheme: 'blue',
        fontSize: 'medium',
        compactMode: false,
        animations: true,
        reducedMotion: false,
        highContrast: false,
        productView: 'grid',
        itemsPerPage: 12,
        showPrices: true,
        showImages: true,
        autoplayVideos: false,
      });
      
      toast.success('✅ Restaurado!', {
        description: 'Configurações restauradas para os valores padrão',
      });
    }
  };

  const passwordStrength = calculatePasswordStrength(passwords.new);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                <Settings className="w-7 h-7 text-white" />
              </div>
              Configurações Avançadas
            </h2>
            <p className="text-muted-foreground mt-1">
              Personalize sua experiência e gerencie sua conta
            </p>
          </div>
          
          {unsavedChanges && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" />
              Alterações não salvas
            </Badge>
          )}
        </div>
      </motion.div>

      {/* Tabs Principais */}
      <Tabs value={activeSection} onValueChange={setActiveSection} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 h-auto gap-2">
          <TabsTrigger value="security" className="flex-col h-auto py-3">
            <Shield className="w-5 h-5 mb-1" />
            <span className="text-xs">Segurança</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex-col h-auto py-3">
            <Eye className="w-5 h-5 mb-1" />
            <span className="text-xs">Privacidade</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-col h-auto py-3">
            <Bell className="w-5 h-5 mb-1" />
            <span className="text-xs">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="display" className="flex-col h-auto py-3">
            <Palette className="w-5 h-5 mb-1" />
            <span className="text-xs">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex-col h-auto py-3">
            <Globe className="w-5 h-5 mb-1" />
            <span className="text-xs">Preferências</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="flex-col h-auto py-3">
            <Database className="w-5 h-5 mb-1" />
            <span className="text-xs">Conta</span>
          </TabsTrigger>
        </TabsList>

        {/* Segurança */}
        <TabsContent value="security" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            {/* Alterar Senha */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura com uma senha forte
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="current-password">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="current-password"
                        type={showPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        placeholder="••••••••"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.new}
                      onChange={(e) => {
                        setPasswords({ ...passwords, new: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      placeholder="••••••••"
                    />
                    {passwords.new && (
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all ${getPasswordStrengthColor(passwordStrength)}`}
                              style={{ width: `${(passwordStrength / 5) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium">
                            {getPasswordStrengthLabel(passwordStrength)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Use pelo menos 8 caracteres com letras, números e símbolos
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      placeholder="••••••••"
                    />
                    {passwords.confirm && passwords.new !== passwords.confirm && (
                      <p className="text-xs text-red-600 mt-1">
                        As senhas não coincidem
                      </p>
                    )}
                  </div>
                  
                  <Button 
                    onClick={handleChangePassword} 
                    disabled={loading || !passwords.current || !passwords.new || passwords.new !== passwords.confirm}
                    className="w-full"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    Alterar Senha
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Autenticação Avançada */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Autenticação Avançada
                </CardTitle>
                <CardDescription>
                  Adicione camadas extras de segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Smartphone className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Autenticação de Dois Fatores (2FA)</h4>
                        <p className="text-sm text-muted-foreground">
                          Código enviado por SMS ou app autenticador
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={security.twoFactorAuth}
                      onCheckedChange={(checked) => {
                        setSecurity({ ...security, twoFactorAuth: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Fingerprint className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Login Biométrico</h4>
                        <p className="text-sm text-muted-foreground">
                          Use impressão digital ou reconhecimento facial
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={security.biometric}
                      onCheckedChange={(checked) => {
                        setSecurity({ ...security, biometric: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Bell className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Alertas de Login</h4>
                        <p className="text-sm text-muted-foreground">
                          Notificação quando alguém acessar sua conta
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={security.loginAlerts}
                      onCheckedChange={(checked) => {
                        setSecurity({ ...security, loginAlerts: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">Atividade Suspeita</h4>
                        <p className="text-sm text-muted-foreground">
                          Alerta para tentativas de acesso suspeitas
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={security.suspiciousActivityAlerts}
                      onCheckedChange={(checked) => {
                        setSecurity({ ...security, suspiciousActivityAlerts: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="p-4 border rounded-lg">
                    <Label htmlFor="session-timeout" className="mb-2 block">
                      Tempo de Sessão (minutos)
                    </Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="session-timeout"
                        type="number"
                        min="5"
                        max="120"
                        value={security.sessionTimeout}
                        onChange={(e) => {
                          setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) });
                          setUnsavedChanges(true);
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        Logout automático após {security.sessionTimeout} minutos de inatividade
                      </span>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSection('security', security)}
                  disabled={loading || !unsavedChanges}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações de Segurança
                </Button>
              </CardContent>
            </Card>

            {/* Sessões Ativas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Sessões Ativas
                </CardTitle>
                <CardDescription>
                  Dispositivos conectados à sua conta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length === 0 ? (
                  <div className="text-center py-8">
                    <Smartphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Nenhuma sessão ativa no momento</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {session.device?.includes('Mobile') ? (
                            <Smartphone className="w-8 h-8 text-muted-foreground" />
                          ) : session.device?.includes('Tablet') ? (
                            <Tablet className="w-8 h-8 text-muted-foreground" />
                          ) : (
                            <Laptop className="w-8 h-8 text-muted-foreground" />
                          )}
                          <div>
                            <p className="font-semibold">{session.device || 'Dispositivo Desconhecido'}</p>
                            <p className="text-sm text-muted-foreground">
                              {session.location || 'Localização Desconhecida'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Último acesso: {new Date(session.lastActive).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {session.current ? (
                          <Badge className="bg-green-500">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Sessão Atual
                          </Badge>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeSession(session.id)}
                          >
                            Encerrar
                          </Button>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Privacidade */}
        <TabsContent value="privacy" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Controle de Privacidade
                </CardTitle>
                <CardDescription>
                  Defina quem pode ver suas informações
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Estas configurações controlam a visibilidade dos seus dados para outros usuários da plataforma.
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  {[
                    { key: 'showProfile', icon: User, label: 'Perfil Público', desc: 'Permitir que outros vejam seu perfil' },
                    { key: 'showPurchaseHistory', icon: Package, label: 'Histórico de Compras', desc: 'Mostrar produtos que você comprou' },
                    { key: 'showWishlist', icon: Heart, label: 'Lista de Desejos', desc: 'Compartilhar sua lista de desejos' },
                    { key: 'showFavorites', icon: Star, label: 'Favoritos', desc: 'Mostrar seus produtos favoritos' },
                    { key: 'showReviews', icon: MessageSquare, label: 'Avaliações', desc: 'Exibir suas avaliações públicas' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <Label className="font-semibold cursor-pointer">{item.label}</Label>
                          <p className="text-xs text-muted-foreground">{item.desc}</p>
                        </div>
                      </div>
                      <Switch
                        checked={privacy[item.key as keyof typeof privacy] as boolean}
                        onCheckedChange={(checked) => {
                          setPrivacy({ ...privacy, [item.key]: checked });
                          setUnsavedChanges(true);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="font-semibold mb-4">Compartilhamento de Dados</h3>
                  <div className="space-y-3">
                    {[
                      { key: 'allowMarketing', icon: Mail, label: 'Marketing Personalizado', desc: 'Receber ofertas baseadas no seu interesse' },
                      { key: 'allowAnalytics', icon: BarChart3, label: 'Analytics e Melhorias', desc: 'Ajudar a melhorar a plataforma' },
                      { key: 'allowCookies', icon: Cookie, label: 'Cookies Não Essenciais', desc: 'Cookies para personalização' },
                      { key: 'allowPersonalization', icon: Zap, label: 'Personalização', desc: 'Recomendações personalizadas' },
                      { key: 'shareDataWithPartners', icon: Share2, label: 'Parceiros', desc: 'Compartilhar dados com parceiros selecionados' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <Label className="font-semibold cursor-pointer">{item.label}</Label>
                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                        <Switch
                          checked={privacy[item.key as keyof typeof privacy] as boolean}
                          onCheckedChange={(checked) => {
                            setPrivacy({ ...privacy, [item.key]: checked });
                            setUnsavedChanges(true);
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSection('privacy', privacy)}
                  disabled={loading || !unsavedChanges}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações de Privacidade
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notificações - Continua... */}
        <TabsContent value="notifications" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Alert>
              <Bell className="w-4 h-4" />
              <AlertDescription>
                Escolha como e quando deseja receber notificações
              </AlertDescription>
            </Alert>

            {/* Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Notificações por E-mail
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries({
                  orders: 'Pedidos e Entregas',
                  promotions: 'Promoções e Ofertas',
                  newsletter: 'Newsletter Semanal',
                  recommendations: 'Recomendações Personalizadas',
                  security: 'Alertas de Segurança',
                  newProducts: 'Novos Produtos',
                  priceDrops: 'Quedas de Preço',
                  backInStock: 'Produtos de Volta',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">{label}</Label>
                    <Switch
                      checked={notifications.email[key as keyof typeof notifications.email]}
                      onCheckedChange={(checked) => {
                        setNotifications({
                          ...notifications,
                          email: { ...notifications.email, [key]: checked }
                        });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Push */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Notificações Push
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries({
                  orders: 'Atualizações de Pedidos',
                  promotions: 'Ofertas Relâmpago',
                  chat: 'Mensagens do Chat',
                  security: 'Alertas de Segurança',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">{label}</Label>
                    <Switch
                      checked={notifications.push[key as keyof typeof notifications.push]}
                      onCheckedChange={(checked) => {
                        setNotifications({
                          ...notifications,
                          push: { ...notifications.push, [key]: checked }
                        });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* SMS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Notificações por SMS
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries({
                  orders: 'Confirmação de Pedidos',
                  promotions: 'Cupons Exclusivos',
                  security: 'Códigos de Verificação',
                }).map(([key, label]) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <Label className="cursor-pointer">{label}</Label>
                    <Switch
                      checked={notifications.sms[key as keyof typeof notifications.sms]}
                      onCheckedChange={(checked) => {
                        setNotifications({
                          ...notifications,
                          sms: { ...notifications.sms, [key]: checked }
                        });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Button 
              onClick={() => handleSaveSection('notifications', notifications)}
              disabled={loading || !unsavedChanges}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Preferências de Notificação
            </Button>
          </motion.div>
        </TabsContent>

        {/* Aparência */}
        <TabsContent value="display" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Tema e Cores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-3 block">Tema</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'light', icon: Sun, label: 'Claro' },
                      { value: 'dark', icon: Moon, label: 'Escuro' },
                      { value: 'auto', icon: Monitor, label: 'Automático' },
                    ].map((theme) => (
                      <button
                        key={theme.value}
                        onClick={() => {
                          setDisplay({ ...display, theme: theme.value });
                          setUnsavedChanges(true);
                        }}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all hover:bg-muted ${
                          display.theme === theme.value ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <theme.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{theme.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Esquema de Cores</Label>
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { value: 'blue', color: 'bg-blue-500' },
                      { value: 'purple', color: 'bg-purple-500' },
                      { value: 'green', color: 'bg-green-500' },
                      { value: 'orange', color: 'bg-orange-500' },
                    ].map((scheme) => (
                      <button
                        key={scheme.value}
                        onClick={() => {
                          setDisplay({ ...display, colorScheme: scheme.value });
                          setUnsavedChanges(true);
                        }}
                        className={`h-12 rounded-lg ${scheme.color} ${
                          display.colorScheme === scheme.value ? 'ring-4 ring-offset-2 ring-primary' : ''
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-3 block">Tamanho da Fonte</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'small', label: 'Pequeno', size: 'text-sm' },
                      { value: 'medium', label: 'Médio', size: 'text-base' },
                      { value: 'large', label: 'Grande', size: 'text-lg' },
                    ].map((size) => (
                      <button
                        key={size.value}
                        onClick={() => {
                          setDisplay({ ...display, fontSize: size.value });
                          setUnsavedChanges(true);
                        }}
                        className={`p-4 border-2 rounded-lg ${size.size} transition-all hover:bg-muted ${
                          display.fontSize === size.value ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        {size.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {[
                    { key: 'compactMode', label: 'Modo Compacto', desc: 'Interface mais densa' },
                    { key: 'animations', label: 'Animações', desc: 'Transições e efeitos' },
                    { key: 'reducedMotion', label: 'Movimento Reduzido', desc: 'Menos animações' },
                    { key: 'highContrast', label: 'Alto Contraste', desc: 'Melhor legibilidade' },
                    { key: 'autoplayVideos', label: 'Auto-play Vídeos', desc: 'Reproduzir automaticamente' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label className="cursor-pointer font-semibold">{item.label}</Label>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch
                        checked={display[item.key as keyof typeof display] as boolean}
                        onCheckedChange={(checked) => {
                          setDisplay({ ...display, [item.key]: checked });
                          setUnsavedChanges(true);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => handleSaveSection('display', display)}
                    disabled={loading || !unsavedChanges}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Aparência
                  </Button>
                  <Button 
                    onClick={handleResetAllSettings}
                    variant="outline"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restaurar Padrão
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Grid className="w-5 h-5" />
                  Visualização de Produtos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="mb-3 block">Modo de Visualização</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'grid', icon: Grid, label: 'Grade' },
                      { value: 'list', icon: List, label: 'Lista' },
                    ].map((view) => (
                      <button
                        key={view.value}
                        onClick={() => {
                          setDisplay({ ...display, productView: view.value });
                          setUnsavedChanges(true);
                        }}
                        className={`p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all hover:bg-muted ${
                          display.productView === view.value ? 'border-primary bg-primary/10' : 'border-border'
                        }`}
                      >
                        <view.icon className="w-6 h-6" />
                        <span className="text-sm font-medium">{view.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="items-per-page">Itens por Página</Label>
                  <select
                    id="items-per-page"
                    value={display.itemsPerPage}
                    onChange={(e) => {
                      setDisplay({ ...display, itemsPerPage: parseInt(e.target.value) });
                      setUnsavedChanges(true);
                    }}
                    className="w-full p-2 border rounded-md mt-2"
                  >
                    <option value="8">8 itens</option>
                    <option value="12">12 itens</option>
                    <option value="24">24 itens</option>
                    <option value="48">48 itens</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Preferências */}
        <TabsContent value="preferences" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Preferências Regionais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="language">
                      <Languages className="w-4 h-4 inline mr-2" />
                      Idioma
                    </Label>
                    <select
                      id="language"
                      value={preferences.language}
                      onChange={(e) => {
                        setPreferences({ ...preferences, language: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full p-2 border rounded-md mt-2"
                    >
                      <option value="pt-BR">🇧🇷 Português (Brasil)</option>
                      <option value="en-US">🇺🇸 English (US)</option>
                      <option value="es-ES">🇪🇸 Español</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="currency">
                      <DollarSign className="w-4 h-4 inline mr-2" />
                      Moeda
                    </Label>
                    <select
                      id="currency"
                      value={preferences.currency}
                      onChange={(e) => {
                        setPreferences({ ...preferences, currency: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full p-2 border rounded-md mt-2"
                    >
                      <option value="BRL">Real (R$)</option>
                      <option value="USD">Dólar ($)</option>
                      <option value="EUR">Euro (€)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="timezone">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Fuso Horário
                    </Label>
                    <select
                      id="timezone"
                      value={preferences.timezone}
                      onChange={(e) => {
                        setPreferences({ ...preferences, timezone: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full p-2 border rounded-md mt-2"
                    >
                      <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                      <option value="America/Manaus">Manaus (GMT-4)</option>
                      <option value="America/Rio_Branco">Rio Branco (GMT-5)</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="date-format">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Formato de Data
                    </Label>
                    <select
                      id="date-format"
                      value={preferences.dateFormat}
                      onChange={(e) => {
                        setPreferences({ ...preferences, dateFormat: e.target.value });
                        setUnsavedChanges(true);
                      }}
                      className="w-full p-2 border rounded-md mt-2"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <Button 
                  onClick={() => handleSaveSection('preferences', preferences)}
                  disabled={loading || !unsavedChanges}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Preferências
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Padrões de Checkout
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="default-payment">Método de Pagamento Padrão</Label>
                  <select
                    id="default-payment"
                    value={preferences.defaultPayment}
                    onChange={(e) => {
                      setPreferences({ ...preferences, defaultPayment: e.target.value });
                      setUnsavedChanges(true);
                    }}
                    className="w-full p-2 border rounded-md mt-2"
                  >
                    <option value="pix">PIX</option>
                    <option value="credit">Cartão de Crédito</option>
                    <option value="boleto">Boleto</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="default-shipping">Método de Envio Padrão</Label>
                  <select
                    id="default-shipping"
                    value={preferences.defaultShipping}
                    onChange={(e) => {
                      setPreferences({ ...preferences, defaultShipping: e.target.value });
                      setUnsavedChanges(true);
                    }}
                    className="w-full p-2 border rounded-md mt-2"
                  >
                    <option value="standard">Padrão</option>
                    <option value="express">Expresso</option>
                    <option value="pickup">Retirada</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label className="cursor-pointer">Preencher Formulários Automaticamente</Label>
                    <Switch
                      checked={preferences.autoFillForms}
                      onCheckedChange={(checked) => {
                        setPreferences({ ...preferences, autoFillForms: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label className="cursor-pointer">Lembrar Filtros de Pesquisa</Label>
                    <Switch
                      checked={preferences.rememberFilters}
                      onCheckedChange={(checked) => {
                        setPreferences({ ...preferences, rememberFilters: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <Label className="cursor-pointer">Mostrar Recomendações Personalizadas</Label>
                    <Switch
                      checked={preferences.showRecommendations}
                      onCheckedChange={(checked) => {
                        setPreferences({ ...preferences, showRecommendations: checked });
                        setUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Conta */}
        <TabsContent value="account" className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Gerenciar Dados
                </CardTitle>
                <CardDescription>
                  Controle total sobre seus dados pessoais
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={handleExportData} 
                  className="w-full justify-start"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exportar Todos os Meus Dados (JSON)
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Baixar Política de Privacidade (PDF)
                </Button>

                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Baixar Termos de Uso (PDF)
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertCircle className="w-5 h-5" />
                  Zona de Perigo
                </CardTitle>
                <CardDescription className="text-red-700">
                  Ações irreversíveis que afetam permanentemente sua conta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    <strong>ATENÇÃO:</strong> Excluir sua conta removerá PERMANENTEMENTE:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Todos os pedidos e histórico de compras</li>
                      <li>Endereços salvos e cartões de pagamento</li>
                      <li>Favoritos, lista de desejos e avaliações</li>
                      <li>Cupons ativos e pontos de fidelidade</li>
                      <li>Configurações e preferências</li>
                    </ul>
                    <p className="mt-2 font-semibold">Esta ação NÃO pode ser desfeita!</p>
                  </AlertDescription>
                </Alert>

                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="w-full"
                  size="lg"
                >
                  <UserX className="w-5 h-5 mr-2" />
                  Excluir Minha Conta Permanentemente
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedSettingsTab;

