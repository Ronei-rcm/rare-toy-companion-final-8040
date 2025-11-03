import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Settings,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface GoogleCalendarStatus {
  isAuthenticated: boolean;
  hasOAuth2Client: boolean;
  hasCalendar: boolean;
}

interface SyncResult {
  eventId: string;
  eventTitle: string;
  success: boolean;
  googleEventId?: string;
  eventUrl?: string;
  error?: string;
}

const GoogleCalendarConfig = () => {
  const [status, setStatus] = useState<GoogleCalendarStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<SyncResult[]>([]);

  // Verificar status da integração
  const checkStatus = async () => {
    try {
      const response = await fetch('/api/google/status');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status da integração');
    } finally {
      setLoading(false);
    }
  };

  // Conectar com Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      // Verificar se as configurações estão ativas
      const statusResponse = await fetch('/api/admin/config/status');
      const statusData = await statusResponse.json();
      
      if (!statusData.isConfigured || !statusData.isActive) {
        toast.error('Configure e ative a integração primeiro na aba "Configuração da API"');
        return;
      }

      const response = await fetch('/api/google/auth');
      const data = await response.json();
      
      if (data.authUrl) {
        window.open(data.authUrl, '_blank');
        toast.info('Redirecionando para autorização do Google...');
      } else {
        toast.error('Erro ao gerar URL de autorização');
      }
    } catch (error) {
      console.error('Erro ao conectar:', error);
      toast.error('Erro ao conectar com Google Calendar');
    }
  };

  // Sincronizar todos os eventos
  const syncAllEvents = async () => {
    setSyncing(true);
    try {
      const response = await fetch('/api/google/sync-all', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        setSyncResults(data.results);
        toast.success(data.message);
        checkStatus(); // Atualizar status
      } else {
        toast.error(data.message || 'Erro ao sincronizar eventos');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar eventos');
    } finally {
      setSyncing(false);
    }
  };

  // Desconectar Google Calendar
  const disconnectGoogleCalendar = async () => {
    if (!confirm('Tem certeza que deseja desconectar o Google Calendar? Todos os eventos serão removidos da sua agenda.')) {
      return;
    }

    try {
      const response = await fetch('/api/google/disconnect', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Google Calendar desconectado com sucesso');
        checkStatus();
        setSyncResults([]);
      } else {
        toast.error('Erro ao desconectar');
      }
    } catch (error) {
      console.error('Erro ao desconectar:', error);
      toast.error('Erro ao desconectar');
    }
  };

  useEffect(() => {
    checkStatus();
    
    // Verificar se veio do callback de autorização
    const urlParams = new URLSearchParams(window.location.search);
    const googleAuth = urlParams.get('google_auth');
    
    if (googleAuth === 'success') {
      toast.success('Google Calendar conectado com sucesso!');
      checkStatus();
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (googleAuth === 'error') {
      toast.error('Erro ao conectar com Google Calendar');
      // Limpar URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração do Google Calendar
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configuração do Google Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status da Integração */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5" />
              <div>
                <p className="font-medium">Status da Integração</p>
                <p className="text-sm text-muted-foreground">
                  {status?.isAuthenticated ? 'Conectado' : 'Desconectado'}
                </p>
              </div>
            </div>
            <Badge variant={status?.isAuthenticated ? 'default' : 'secondary'}>
              {status?.isAuthenticated ? (
                <CheckCircle className="w-3 h-3 mr-1" />
              ) : (
                <XCircle className="w-3 h-3 mr-1" />
              )}
              {status?.isAuthenticated ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          {/* Ações */}
          <div className="flex gap-2">
            {!status?.isAuthenticated ? (
              <Button onClick={connectGoogleCalendar} className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Conectar Google Calendar
              </Button>
            ) : (
              <>
                <Button 
                  onClick={syncAllEvents} 
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  {syncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {syncing ? 'Sincronizando...' : 'Sincronizar Eventos'}
                </Button>
                <Button 
                  onClick={disconnectGoogleCalendar}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Desconectar
                </Button>
              </>
            )}
          </div>

          {/* Informações */}
          <Alert>
            <Calendar className="h-4 w-4" />
            <AlertDescription>
              {!status?.isAuthenticated ? (
                <>
                  Conecte sua conta do Google para sincronizar automaticamente os eventos da loja com sua agenda pessoal.
                  <br />
                  <strong>Funcionalidades:</strong> Criação, atualização e remoção automática de eventos no Google Calendar.
                </>
              ) : (
                <>
                  <strong>Integração ativa!</strong> Os eventos serão sincronizados automaticamente com sua agenda do Google Calendar.
                  <br />
                  <strong>Próximos passos:</strong> Clique em "Sincronizar Eventos" para enviar todos os eventos ativos para sua agenda.
                </>
              )}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Resultados da Sincronização */}
      {syncResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5" />
              Resultados da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncResults.map((result, index) => (
                <div 
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {result.success ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <p className="font-medium">{result.eventTitle}</p>
                      {result.error && (
                        <p className="text-sm text-red-500">{result.error}</p>
                      )}
                    </div>
                  </div>
                  {result.eventUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(result.eventUrl, '_blank')}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Ver no Google
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleCalendarConfig;
