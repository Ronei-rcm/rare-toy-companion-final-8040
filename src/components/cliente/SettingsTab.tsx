import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { motion } from 'framer-motion';

interface SettingsTabProps {
  userId: string;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ userId }) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { user, logout } = useCurrentUser() as any;
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  const [privacy, setPrivacy] = useState({
    showProfile: true,
    showPurchaseHistory: false,
    showWishlist: false,
    allowMarketing: true,
    allowAnalytics: true,
    allowCookies: true,
  });

  const [preferences, setPreferences] = useState({
    language: 'pt-BR',
    currency: 'BRL',
    theme: 'light',
    emailFrequency: 'weekly',
    twoFactorAuth: false,
  });

  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    loadSettings();
    loadSessions();
  }, [userId]);

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/settings`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.privacy) setPrivacy(data.privacy);
        if (data.preferences) setPreferences(data.preferences);
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

  const handleChangePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      toast({
        title: 'Senhas não coincidem',
        description: 'A nova senha e a confirmação devem ser iguais',
        variant: 'destructive',
      });
      return;
    }

    if (passwords.new.length < 6) {
      toast({
        title: 'Senha muito curta',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive',
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
        toast({
          title: 'Senha alterada!',
          description: 'Sua senha foi alterada com sucesso',
        });
        setPasswords({ current: '', new: '', confirm: '' });
      } else {
        const data = await response.json();
        toast({
          title: 'Erro ao alterar senha',
          description: data.error || 'Senha atual incorreta',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a senha',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrivacy = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/customers/${userId}/settings/privacy`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(privacy),
      });

      toast({
        title: 'Configurações salvas',
        description: 'Suas preferências de privacidade foram atualizadas',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setLoading(true);
      await fetch(`${API_BASE_URL}/customers/${userId}/settings/preferences`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(preferences),
      });

      toast({
        title: 'Preferências salvas',
        description: 'Suas preferências foram atualizadas',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as preferências',
        variant: 'destructive',
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
      toast({
        title: 'Sessão encerrada',
        description: 'A sessão foi encerrada com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível encerrar a sessão',
        variant: 'destructive',
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

        toast({
          title: 'Dados exportados',
          description: 'Seus dados foram baixados com sucesso',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar seus dados',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente removidos.'
    );

    if (!confirmed) return;

    const doubleConfirm = window.prompt(
      'Digite "EXCLUIR" para confirmar a exclusão da conta:'
    );

    if (doubleConfirm !== 'EXCLUIR') {
      toast({
        title: 'Cancelado',
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
        toast({
          title: 'Conta excluída',
          description: 'Sua conta foi excluída. Você será desconectado.',
        });
        setTimeout(() => {
          logout();
        }, 2000);
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a conta',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6" />
          Configurações
        </h2>
        <p className="text-muted-foreground">
          Gerencie suas preferências, privacidade e segurança
        </p>
      </div>

      {/* Segurança */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Segurança
          </CardTitle>
          <CardDescription>
            Altere sua senha e configure a autenticação de dois fatores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Alterar Senha */}
          <div className="space-y-4">
            <h3 className="font-semibold">Alterar Senha</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="current-password">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showPassword ? 'text' : 'password'}
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
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
                  onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.confirm}
                  onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                />
              </div>
              <Button onClick={handleChangePassword} disabled={loading}>
                <Key className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </div>
          </div>

          <Separator />

          {/* Autenticação de Dois Fatores */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Autenticação de Dois Fatores (2FA)
              </h3>
              <p className="text-sm text-muted-foreground">
                Adicione uma camada extra de segurança à sua conta
              </p>
            </div>
            <Switch
              checked={preferences.twoFactorAuth}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, twoFactorAuth: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacidade */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Privacidade
          </CardTitle>
          <CardDescription>
            Controle quem pode ver suas informações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-profile" className="cursor-pointer">
                Perfil público
              </Label>
              <Switch
                id="show-profile"
                checked={privacy.showProfile}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, showProfile: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-history" className="cursor-pointer">
                Mostrar histórico de compras
              </Label>
              <Switch
                id="show-history"
                checked={privacy.showPurchaseHistory}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, showPurchaseHistory: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-wishlist" className="cursor-pointer">
                Mostrar lista de desejos
              </Label>
              <Switch
                id="show-wishlist"
                checked={privacy.showWishlist}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, showWishlist: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-marketing" className="cursor-pointer">
                Permitir marketing personalizado
              </Label>
              <Switch
                id="allow-marketing"
                checked={privacy.allowMarketing}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, allowMarketing: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-analytics" className="cursor-pointer">
                Permitir analytics e melhorias
              </Label>
              <Switch
                id="allow-analytics"
                checked={privacy.allowAnalytics}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, allowAnalytics: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="allow-cookies" className="cursor-pointer flex items-center gap-2">
                <Cookie className="w-4 h-4" />
                Permitir cookies não essenciais
              </Label>
              <Switch
                id="allow-cookies"
                checked={privacy.allowCookies}
                onCheckedChange={(checked) =>
                  setPrivacy({ ...privacy, allowCookies: checked })
                }
              />
            </div>
          </div>
          <Button onClick={handleSavePrivacy} disabled={loading}>
            Salvar Configurações de Privacidade
          </Button>
        </CardContent>
      </Card>

      {/* Preferências */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Preferências
          </CardTitle>
          <CardDescription>
            Personalize sua experiência na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="language">Idioma</Label>
              <select
                id="language"
                value={preferences.language}
                onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">English (US)</option>
                <option value="es-ES">Español</option>
              </select>
            </div>
            <div>
              <Label htmlFor="currency">Moeda</Label>
              <select
                id="currency"
                value={preferences.currency}
                onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
            <div>
              <Label htmlFor="theme">Tema</Label>
              <select
                id="theme"
                value={preferences.theme}
                onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="auto">Automático</option>
              </select>
            </div>
            <div>
              <Label htmlFor="email-frequency">Frequência de E-mails</Label>
              <select
                id="email-frequency"
                value={preferences.emailFrequency}
                onChange={(e) => setPreferences({ ...preferences, emailFrequency: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="never">Nunca</option>
              </select>
            </div>
          </div>
          <Button onClick={handleSavePreferences} disabled={loading}>
            Salvar Preferências
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
            Gerencie os dispositivos conectados à sua conta
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma sessão ativa</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{session.device || 'Dispositivo desconhecido'}</p>
                      <p className="text-sm text-muted-foreground">
                        {session.location || 'Localização desconhecida'} •{' '}
                        {new Date(session.lastActive).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRevokeSession(session.id)}
                    >
                      Encerrar
                    </Button>
                  )}
                  {session.current && (
                    <Badge className="bg-green-500">Sessão Atual</Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dados e Conta */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Seus Dados
          </CardTitle>
          <CardDescription>
            Exporte ou exclua seus dados permanentemente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Button variant="outline" onClick={handleExportData} className="w-full">
              <Download className="w-4 h-4 mr-2" />
              Exportar Meus Dados (JSON)
            </Button>
            
            <div className="border-t pt-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-900">Zona de Perigo</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Excluir sua conta removerá permanentemente todos os seus dados, incluindo
                      pedidos, endereços, favoritos e histórico. Esta ação não pode ser desfeita.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                className="w-full"
              >
                <UserX className="w-4 h-4 mr-2" />
                Excluir Minha Conta Permanentemente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsTab;

