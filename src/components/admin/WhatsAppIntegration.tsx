
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  Smartphone, 
  Zap, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Link as LinkIcon,
  QrCode,
  MessageSquare,
  Users,
  BarChart,
  Loader2,
  Send,
  RefreshCw
} from 'lucide-react';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

interface WhatsAppIntegrationProps {
  onConnectionChange?: (connected: boolean) => void;
}

const WhatsAppIntegration = ({ onConnectionChange }: WhatsAppIntegrationProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [phoneId, setPhoneId] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');
  const [autoReply, setAutoReply] = useState(true);
  const [welcomeMessage, setWelcomeMessage] = useState('Olá! Como posso ajudá-lo hoje?');
  const [stats, setStats] = useState({
    total_messages: 0,
    incoming_messages: 0,
    outgoing_messages: 0,
    unique_contacts: 0,
    messages_today: 0
  });

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadWhatsAppConfig();
    loadStats();
  }, []);

  const loadWhatsAppConfig = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/whatsapp/config`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        const config = data.config;
        
        setWebhookUrl(config.webhook_url || '');
        setApiKey(config.token || '');
        setPhoneId(config.phone_id || '');
        setWebhookSecret(config.webhook_secret || '');
        setAutoReply(config.auto_reply || false);
        setWelcomeMessage(config.welcome_message || '');
        
        // Considerar conectado se tem token e phone_id
        const connected = !!(config.token && config.phone_id);
        setIsConnected(connected);
        onConnectionChange?.(connected);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações WhatsApp:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/stats`, {
        credentials: 'include'
      });
      
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      // Salvar configurações primeiro
      await saveWhatsAppConfig();
      
      // Simular conexão com WhatsApp Web API
      setTimeout(() => {
        setIsConnected(true);
        setIsConnecting(false);
        onConnectionChange?.(true);
        toast.success('WhatsApp conectado com sucesso!');
      }, 2000);
    } catch (error) {
      setIsConnecting(false);
      toast.error('Erro ao conectar WhatsApp');
    }
  };

  const handleDisconnect = async () => {
    try {
      // Limpar configurações
      await fetch(`${API_BASE_URL}/whatsapp/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token: '',
          phone_id: '',
          webhook_url: '',
          webhook_secret: ''
        })
      });
      
      setIsConnected(false);
      onConnectionChange?.(false);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      toast.error('Erro ao desconectar');
    }
  };

  const saveWhatsAppConfig = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          webhook_url: webhookUrl,
          token: apiKey,
          phone_id: phoneId,
          webhook_secret: webhookSecret,
          auto_reply: autoReply,
          welcome_message: welcomeMessage
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
      } else {
        throw new Error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const handleWebhookTest = async () => {
    if (!webhookUrl) {
      toast.error('Por favor, insira a URL do webhook');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/test-webhook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ webhook_url: webhookUrl })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message);
      } else {
        throw new Error('Erro ao testar webhook');
      }
    } catch (error) {
      console.error('Erro ao testar webhook:', error);
      toast.error('Erro ao testar webhook');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status da Conexão WhatsApp
          </CardTitle>
          <CardDescription>
            Gerencie a conexão com sua conta do WhatsApp Business
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Conectado</p>
                    <p className="text-sm text-muted-foreground">WhatsApp Business ativo</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="font-medium">Desconectado</p>
                    <p className="text-sm text-muted-foreground">Configure sua conexão</p>
                  </div>
                </>
              )}
            </div>
            
            {isConnected ? (
              <Button variant="outline" onClick={handleDisconnect}>
                Desconectar
              </Button>
            ) : (
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? 'Conectando...' : 'Conectar'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Integração */}
      <Tabs defaultValue="webhook" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="automation">Automação</TabsTrigger>
          <TabsTrigger value="qr">QR Code</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Configuração do Webhook
              </CardTitle>
              <CardDescription>
                Configure webhooks para receber mensagens automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="webhook-url">URL do Webhook</Label>
                  <Input
                    id="webhook-url"
                    placeholder="https://seu-webhook.com/whatsapp"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">Webhook Secret</Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    placeholder="Seu secret do webhook"
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">Token da API</Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder="Seu token do WhatsApp Business API"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone-id">Phone ID</Label>
                  <Input
                    id="phone-id"
                    placeholder="ID do número do WhatsApp Business"
                    value={phoneId}
                    onChange={(e) => setPhoneId(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleWebhookTest} variant="outline" disabled={!webhookUrl}>
                  Testar Webhook
                </Button>
                <Button onClick={saveWhatsAppConfig} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Automação de Mensagens
              </CardTitle>
              <CardDescription>
                Configure respostas automáticas e templates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resposta Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Enviar mensagem automática para novos contatos
                  </p>
                </div>
                <Switch
                  checked={autoReply}
                  onCheckedChange={setAutoReply}
                />
              </div>

              {autoReply && (
                <div className="space-y-2">
                  <Label htmlFor="welcome-message">Mensagem de Boas-vindas</Label>
                  <Textarea
                    id="welcome-message"
                    rows={4}
                    value={welcomeMessage}
                    onChange={(e) => setWelcomeMessage(e.target.value)}
                    placeholder="Digite sua mensagem automática..."
                  />
                  <p className="text-xs text-gray-500">
                    Esta mensagem será enviada automaticamente para novos contatos
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={saveWhatsAppConfig} variant="outline" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Salvar Configurações
                </Button>
              </div>

              <div className="space-y-3">
                <Label>Comandos Automáticos</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">!catalogo</p>
                      <p className="text-sm text-muted-foreground">Envia catálogo de produtos</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">!pedido</p>
                      <p className="text-sm text-muted-foreground">Inicia processo de pedido</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">!contato</p>
                      <p className="text-sm text-muted-foreground">Envia informações de contato</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="qr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Links e QR Codes
              </CardTitle>
              <CardDescription>
                Gere links e QR codes para facilitar o acesso aos grupos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-4">
                <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                  <QrCode className="h-24 w-24 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  QR Code para acesso rápido aos grupos de vendas
                </p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline">
                    <LinkIcon className="mr-2 h-4 w-4" />
                    Gerar Link
                  </Button>
                  <Button>
                    Baixar QR Code
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <Label>Links Personalizados</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Grupo Premium</p>
                      <p className="text-sm text-muted-foreground">wa.me/exemplo-premium</p>
                    </div>
                    <Button size="sm" variant="outline">Copiar</Button>
                  </div>
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">Grupo Promoções</p>
                      <p className="text-sm text-muted-foreground">wa.me/exemplo-promocoes</p>
                    </div>
                    <Button size="sm" variant="outline">Copiar</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estatísticas Rápidas */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Estatísticas WhatsApp
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadStats}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Contatos Únicos</p>
                </div>
                <p className="text-2xl font-bold">{stats.unique_contacts}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Mensagens Hoje</p>
                </div>
                <p className="text-2xl font-bold">{stats.messages_today}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Send className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Recebidas</p>
                </div>
                <p className="text-2xl font-bold">{stats.incoming_messages}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Enviadas</p>
                </div>
                <p className="text-2xl font-bold">{stats.outgoing_messages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WhatsAppIntegration;
