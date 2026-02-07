import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Save,
  TestTube,
  CheckCircle,
  XCircle,
  ExternalLink,
  RefreshCw,
  Key,
  Globe,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiConfig {
  id: number;
  google_client_id: string;
  google_client_secret: string;
  google_redirect_uri: string;
  frontend_url: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

interface ConfigStatus {
  isConfigured: boolean;
  isActive: boolean;
  hasRedirectUri: boolean;
  hasFrontendUrl: boolean;
  lastUpdated: string | null;
}

const ApiConfigPanel = () => {
  const [config, setConfig] = useState<ApiConfig>({
    id: 1,
    google_client_id: '',
    google_client_secret: '',
    google_redirect_uri: `${window.location.origin}/api/google/oauth/callback`,
    frontend_url: window.location.origin,
    is_active: false,
    created_at: null,
    updated_at: null
  });

  const [status, setStatus] = useState<ConfigStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Carregar configurações
  const loadConfig = async () => {
    try {
      const response = await fetch('/api/admin/config');
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Carregar status
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/admin/config/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  // Salvar configurações
  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Configurações salvas com sucesso!');
        loadStatus();
      } else {
        toast.error(data.message || 'Erro ao salvar configurações');
        if (data.errors) {
          data.errors.forEach((error: string) => toast.error(error));
        }
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  // Testar configurações
  const testConfig = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/config/test', {
        method: 'POST'
      });

      const data = await response.json();
      setTestResult(data);

      if (data.success) {
        toast.success('Configurações válidas!');
      } else {
        toast.error(data.message || 'Erro ao testar configurações');
      }
    } catch (error) {
      console.error('Erro ao testar:', error);
      toast.error('Erro ao testar configurações');
    } finally {
      setTesting(false);
    }
  };

  // Ativar/Desativar integração
  const toggleIntegration = async (active: boolean) => {
    try {
      const response = await fetch('/api/admin/config/toggle', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ active })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        setConfig(prev => ({ ...prev, is_active: active }));
        loadStatus();
      } else {
        toast.error(data.message || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da integração');
    }
  };

  useEffect(() => {
    loadConfig();
    loadStatus();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração da API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Carregando...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status da Integração */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Status da Integração
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${status?.isConfigured ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm">Configurado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${status?.isActive ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm">Ativo</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${status?.hasRedirectUri ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm">Redirect URI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className={`w-4 h-4 ${status?.hasFrontendUrl ? 'text-green-500' : 'text-gray-400'}`} />
              <span className="text-sm">Frontend URL</span>
            </div>
          </div>

          {status?.lastUpdated && (
            <div className="mt-4 text-sm text-muted-foreground">
              Última atualização: {new Date(status.lastUpdated).toLocaleString('pt-BR')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configurações do Google */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Configurações do Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID do Google</Label>
              <Input
                id="client_id"
                type="text"
                value={config.google_client_id}
                onChange={(e) => setConfig(prev => ({ ...prev, google_client_id: e.target.value }))}
                placeholder="Seu Client ID do Google Cloud Console"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret do Google</Label>
              <Input
                id="client_secret"
                type="password"
                value={config.google_client_secret}
                onChange={(e) => setConfig(prev => ({ ...prev, google_client_secret: e.target.value }))}
                placeholder="Seu Client Secret do Google Cloud Console"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="redirect_uri">Redirect URI</Label>
              <Input
                id="redirect_uri"
                type="text"
                value={config.google_redirect_uri}
                onChange={(e) => setConfig(prev => ({ ...prev, google_redirect_uri: e.target.value }))}
                placeholder={`${window.location.origin}/api/google/oauth/callback`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="frontend_url">Frontend URL</Label>
              <Input
                id="frontend_url"
                type="text"
                value={config.frontend_url}
                onChange={(e) => setConfig(prev => ({ ...prev, frontend_url: e.target.value }))}
                placeholder={`${window.location.origin}`}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Integração Ativa</p>
              <p className="text-sm text-muted-foreground">
                {config.is_active ? 'A integração está ativa e funcionando' : 'A integração está desativada'}
              </p>
            </div>
            <Switch
              checked={config.is_active}
              onCheckedChange={toggleIntegration}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={saveConfig} disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>

            <Button
              onClick={testConfig}
              disabled={testing || !config.google_client_id || !config.google_client_secret}
              variant="outline"
              className="flex items-center gap-2"
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <TestTube className="w-4 h-4" />
              )}
              {testing ? 'Testando...' : 'Testar Configurações'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultado do Teste */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5" />
              Resultado do Teste
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                {testResult.message}
              </AlertDescription>
            </Alert>

            {testResult.testUrl && (
              <div className="mt-4">
                <Button
                  onClick={() => window.open(testResult.testUrl, '_blank')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Testar Autorização no Google
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Como Configurar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Criar Projeto no Google Cloud Console</h4>
              <p className="text-muted-foreground">
                Acesse <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a> e crie um novo projeto.
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">2. Ativar Google Calendar API</h4>
              <p className="text-muted-foreground">
                Vá para "APIs & Services" → "Library" → Procure por "Google Calendar API" → Clique em "Enable".
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">3. Configurar OAuth 2.0</h4>
              <p className="text-muted-foreground">
                Vá para "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs".
                Configure o Redirect URI como: <code className="bg-gray-100 px-1 rounded">{config.google_redirect_uri}</code>
              </p>
            </div>

            <div>
              <h4 className="font-medium mb-2">4. Copiar Credenciais</h4>
              <p className="text-muted-foreground">
                Copie o Client ID e Client Secret e cole nos campos acima. Clique em "Testar Configurações" para verificar.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApiConfigPanel;



