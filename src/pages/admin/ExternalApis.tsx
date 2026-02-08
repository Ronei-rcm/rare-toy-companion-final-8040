import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Plug,
  CreditCard,
  Truck,
  Share2,
  Webhook,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Globe,
  Shield,
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  MessageSquare,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Github,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Copy,
  Key,
  Lock,
  Unlock,
  Send,
  Play,
  Pause,
  Stop
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { externalApi } from '@/services/external-api';

interface ExternalApi {
  id: string;
  name: string;
  description: string;
  api_type: 'payment' | 'shipping' | 'social' | 'email' | 'sms' | 'analytics' | 'crm' | 'inventory' | 'other';
  provider: string;
  base_url: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiRequest {
  id: string;
  api_id: string;
  api_name: string;
  provider: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  error_message: string | null;
  created_at: string;
}

interface Webhook {
  id: string;
  name: string;
  description: string;
  url: string;
  events: string[];
  is_active: boolean;
  retry_count: number;
  timeout_seconds: number;
  created_at: string;
}

interface WebhookDelivery {
  id: string;
  webhook_id: string;
  webhook_name: string;
  event_type: string;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  response_status: number | null;
  error_message: string | null;
  retry_count: number;
  delivered_at: string | null;
  created_at: string;
}

interface ApiStats {
  apiStats: Array<{
    api_id: string;
    api_name: string;
    provider: string;
    total_requests: number;
    avg_response_time: number;
    successful_requests: number;
    failed_requests: number;
  }>;
  webhookStats: Array<{
    webhook_id: string;
    webhook_name: string;
    total_deliveries: number;
    successful_deliveries: number;
    failed_deliveries: number;
  }>;
}

const ExternalApis: React.FC = () => {
  const [externalApis, setExternalApis] = useState<ExternalApi[]>([]);
  const [apiRequests, setApiRequests] = useState<ApiRequest[]>([]);
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDelivery[]>([]);
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateApi, setShowCreateApi] = useState(false);
  const [showCreateWebhook, setShowCreateWebhook] = useState(false);
  const [selectedApi, setSelectedApi] = useState<string | null>(null);

  // Formulários
  const [apiForm, setApiForm] = useState({
    name: '',
    description: '',
    api_type: 'payment',
    provider: '',
    base_url: '',
    api_key: '',
    api_secret: '',
    webhook_url: '',
    config: '{}'
  });

  const [webhookForm, setWebhookForm] = useState({
    name: '',
    description: '',
    url: '',
    events: '[]',
    headers: '{}',
    retry_count: 3,
    timeout_seconds: 30
  });

  const [testRequest, setTestRequest] = useState({
    endpoint: '',
    method: 'GET',
    data: '{}',
    headers: '{}'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadExternalApis(),
        loadApiRequests(),
        loadWebhooks(),
        loadWebhookDeliveries(),
        loadApiStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadExternalApis = async () => {
    try {
      const data = await externalApi.getApis();
      if (data.success) {
        setExternalApis(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar APIs externas:', error);
    }
  };

  const loadApiRequests = async () => {
    try {
      const data = await externalApi.getRequests(50);
      if (data.success) {
        setApiRequests(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar requisições de API:', error);
    }
  };

  const loadWebhooks = async () => {
    try {
      const data = await externalApi.getWebhooks();
      if (data.success) {
        setWebhooks(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar webhooks:', error);
    }
  };

  const loadWebhookDeliveries = async () => {
    try {
      const data = await externalApi.getWebhookDeliveries(50);
      if (data.success) {
        setWebhookDeliveries(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar entregas de webhook:', error);
    }
  };

  const loadApiStats = async () => {
    try {
      const data = await externalApi.getStats();
      if (data.success) {
        setApiStats(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const createExternalApi = async () => {
    try {
      const data = await externalApi.saveApi({
        ...apiForm,
        config: JSON.parse(apiForm.config),
        created_by: 'admin'
      });

      if (data.success) {
        setShowCreateApi(false);
        setApiForm({
          name: '',
          description: '',
          api_type: 'payment',
          provider: '',
          base_url: '',
          api_key: '',
          api_secret: '',
          webhook_url: '',
          config: '{}'
        });
        loadExternalApis();
      }
    } catch (error) {
      console.error('Erro ao criar API externa:', error);
    }
  };

  const createWebhook = async () => {
    try {
      const data = await externalApi.saveWebhook({
        ...webhookForm,
        events: JSON.parse(webhookForm.events),
        headers: JSON.parse(webhookForm.headers),
        created_by: 'admin'
      });

      if (data.success) {
        setShowCreateWebhook(false);
        setWebhookForm({
          name: '',
          description: '',
          url: '',
          events: '[]',
          headers: '{}',
          retry_count: 3,
          timeout_seconds: 30
        });
        loadWebhooks();
      }
    } catch (error) {
      console.error('Erro ao criar webhook:', error);
    }
  };

  const testApiConnection = async (apiId: string) => {
    try {
      const data = await externalApi.testApi(apiId);

      if (data.success) {
        alert('Conexão testada com sucesso!');
      } else {
        alert(`Erro no teste: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      alert('Erro ao testar conexão');
    }
  };

  const makeTestRequest = async () => {
    if (!selectedApi) {
      alert('Selecione uma API primeiro');
      return;
    }

    try {
      const data = await externalApi.sendRequest(selectedApi, {
        endpoint: testRequest.endpoint,
        method: testRequest.method,
        data: JSON.parse(testRequest.data),
        headers: JSON.parse(testRequest.headers)
      });

      if (data.success) {
        alert('Requisição realizada com sucesso!');
        loadApiRequests();
      } else {
        alert(`Erro na requisição: ${data.error}`);
      }
    } catch (error) {
      console.error('Erro ao fazer requisição:', error);
      alert('Erro ao fazer requisição');
    }
  };

  const getApiTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'shipping':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'social':
        return <Share2 className="w-5 h-5 text-purple-600" />;
      case 'email':
        return <Mail className="w-5 h-5 text-orange-600" />;
      case 'sms':
        return <MessageSquare className="w-5 h-5 text-pink-600" />;
      case 'analytics':
        return <BarChart3 className="w-5 h-5 text-indigo-600" />;
      case 'crm':
        return <Users className="w-5 h-5 text-cyan-600" />;
      case 'inventory':
        return <Package className="w-5 h-5 text-yellow-600" />;
      default:
        return <Plug className="w-5 h-5 text-gray-600" />;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'stripe':
        return <CreditCard className="w-4 h-4 text-blue-600" />;
      case 'paypal':
        return <CreditCard className="w-4 h-4 text-yellow-600" />;
      case 'mercadopago':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'correios':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'facebook':
        return <Facebook className="w-4 h-4 text-blue-600" />;
      case 'instagram':
        return <Instagram className="w-4 h-4 text-pink-600" />;
      case 'twitter':
        return <Twitter className="w-4 h-4 text-blue-600" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-600" />;
      case 'linkedin':
        return <Linkedin className="w-4 h-4 text-blue-600" />;
      case 'github':
        return <Github className="w-4 h-4 text-gray-600" />;
      default:
        return <Globe className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'retrying':
        return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'retrying':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

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
        <h1 className="text-3xl font-bold text-gray-900">🔌 APIs Externas</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setShowCreateApi(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova API
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      {apiStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Plug className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{externalApis.length}</div>
              <div className="text-sm text-gray-600">APIs Configuradas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {apiStats.apiStats.reduce((sum, api) => sum + api.total_requests, 0)}
              </div>
              <div className="text-sm text-gray-600">Requisições (24h)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Webhook className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{webhooks.length}</div>
              <div className="text-sm text-gray-600">Webhooks Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {apiStats.webhookStats.reduce((sum, webhook) => sum + webhook.successful_deliveries, 0)}
              </div>
              <div className="text-sm text-gray-600">Webhooks Entregues</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="apis">APIs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="requests">Requisições</TabsTrigger>
          <TabsTrigger value="test">Teste</TabsTrigger>
        </TabsList>

        <TabsContent value="apis" className="space-y-6">
          {/* Lista de APIs */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">APIs Configuradas</h2>
            <Button onClick={() => setShowCreateApi(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova API
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {externalApis.map((api) => (
              <Card key={api.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getApiTypeIcon(api.api_type)}
                      <h3 className="font-semibold">{api.name}</h3>
                    </div>
                    <Badge variant="outline">{api.api_type}</Badge>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    {getProviderIcon(api.provider)}
                    <span className="text-sm text-gray-600">{api.provider}</span>
                    <Badge className={api.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {api.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{api.description}</p>

                  <div className="text-xs text-gray-500 mb-4">
                    {api.base_url}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => testApiConnection(api.id)}
                    >
                      <Zap className="w-4 h-4 mr-1" />
                      Testar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApi(api.id)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-6">
          {/* Lista de Webhooks */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Webhooks</h2>
            <Button onClick={() => setShowCreateWebhook(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Webhook
            </Button>
          </div>

          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Webhook className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">{webhook.name}</h3>
                    </div>
                    <Badge className={webhook.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {webhook.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">{webhook.description}</p>

                  <div className="text-xs text-gray-500 mb-4">
                    {webhook.url}
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Eventos: {JSON.parse(webhook.events).length}</span>
                    <span>Retry: {webhook.retry_count}</span>
                    <span>Timeout: {webhook.timeout_seconds}s</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-6">
          {/* Histórico de Requisições */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Histórico de Requisições</h2>
            <div className="flex gap-2">
              <Input placeholder="Filtrar por endpoint..." className="w-48" />
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filtrar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            {apiRequests.map((request) => (
              <Card key={request.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getProviderIcon(request.provider)}
                      <div>
                        <h4 className="font-medium">{request.api_name}</h4>
                        <p className="text-sm text-gray-500">
                          {request.method} {request.endpoint}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge variant={request.status_code >= 400 ? 'destructive' : 'default'}>
                        {request.status_code}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {formatResponseTime(request.response_time_ms)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {format(parseISO(request.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  {request.error_message && (
                    <div className="mt-2 p-2 bg-red-50 text-red-700 text-sm rounded">
                      {request.error_message}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test" className="space-y-6">
          {/* Teste de APIs */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Teste de APIs</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Teste</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="test_api">API</Label>
                  <Select value={selectedApi || ''} onValueChange={setSelectedApi}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma API" />
                    </SelectTrigger>
                    <SelectContent>
                      {externalApis.map((api) => (
                        <SelectItem key={api.id} value={api.id}>
                          {api.name} ({api.provider})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="test_endpoint">Endpoint</Label>
                  <Input
                    id="test_endpoint"
                    value={testRequest.endpoint}
                    onChange={(e) => setTestRequest({ ...testRequest, endpoint: e.target.value })}
                    placeholder="/v1/test"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="test_method">Método</Label>
                    <Select value={testRequest.method} onValueChange={(value) => setTestRequest({ ...testRequest, method: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GET">GET</SelectItem>
                        <SelectItem value="POST">POST</SelectItem>
                        <SelectItem value="PUT">PUT</SelectItem>
                        <SelectItem value="DELETE">DELETE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="test_data">Dados (JSON)</Label>
                    <Textarea
                      id="test_data"
                      value={testRequest.data}
                      onChange={(e) => setTestRequest({ ...testRequest, data: e.target.value })}
                      placeholder='{"key": "value"}'
                      rows={3}
                    />
                  </div>
                </div>

                <Button onClick={makeTestRequest} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Requisição
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resultado do Teste</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-gray-50 rounded p-4 text-sm font-mono overflow-auto">
                  <div className="text-gray-500">Aguardando requisição...</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de API */}
      {showCreateApi && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Nova API Externa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_name">Nome</Label>
                  <Input
                    id="api_name"
                    value={apiForm.name}
                    onChange={(e) => setApiForm({ ...apiForm, name: e.target.value })}
                    placeholder="Nome da API"
                  />
                </div>
                <div>
                  <Label htmlFor="api_type">Tipo</Label>
                  <Select value={apiForm.api_type} onValueChange={(value) => setApiForm({ ...apiForm, api_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="payment">Pagamento</SelectItem>
                      <SelectItem value="shipping">Frete</SelectItem>
                      <SelectItem value="social">Rede Social</SelectItem>
                      <SelectItem value="email">E-mail</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="analytics">Analytics</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="inventory">Estoque</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="api_description">Descrição</Label>
                <Textarea
                  id="api_description"
                  value={apiForm.description}
                  onChange={(e) => setApiForm({ ...apiForm, description: e.target.value })}
                  placeholder="Descrição da API"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_provider">Provedor</Label>
                  <Input
                    id="api_provider"
                    value={apiForm.provider}
                    onChange={(e) => setApiForm({ ...apiForm, provider: e.target.value })}
                    placeholder="Stripe, PayPal, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="api_base_url">URL Base</Label>
                  <Input
                    id="api_base_url"
                    value={apiForm.base_url}
                    onChange={(e) => setApiForm({ ...apiForm, base_url: e.target.value })}
                    placeholder="https://api.exemplo.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={apiForm.api_key}
                    onChange={(e) => setApiForm({ ...apiForm, api_key: e.target.value })}
                    placeholder="Chave da API"
                  />
                </div>
                <div>
                  <Label htmlFor="api_secret">API Secret</Label>
                  <Input
                    id="api_secret"
                    type="password"
                    value={apiForm.api_secret}
                    onChange={(e) => setApiForm({ ...apiForm, api_secret: e.target.value })}
                    placeholder="Segredo da API"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="api_config">Configuração (JSON)</Label>
                <Textarea
                  id="api_config"
                  value={apiForm.config}
                  onChange={(e) => setApiForm({ ...apiForm, config: e.target.value })}
                  placeholder='{"timeout": 30000, "retries": 3}'
                  rows={4}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={createExternalApi} className="flex-1">
                  Criar API
                </Button>
                <Button variant="outline" onClick={() => setShowCreateApi(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Criação de Webhook */}
      {showCreateWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Webhook</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhook_name">Nome</Label>
                  <Input
                    id="webhook_name"
                    value={webhookForm.name}
                    onChange={(e) => setWebhookForm({ ...webhookForm, name: e.target.value })}
                    placeholder="Nome do webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook_url">URL</Label>
                  <Input
                    id="webhook_url"
                    value={webhookForm.url}
                    onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
                    placeholder="https://exemplo.com/webhook"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="webhook_description">Descrição</Label>
                <Textarea
                  id="webhook_description"
                  value={webhookForm.description}
                  onChange={(e) => setWebhookForm({ ...webhookForm, description: e.target.value })}
                  placeholder="Descrição do webhook"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="webhook_events">Eventos (JSON)</Label>
                <Textarea
                  id="webhook_events"
                  value={webhookForm.events}
                  onChange={(e) => setWebhookForm({ ...webhookForm, events: e.target.value })}
                  placeholder='["payment.completed", "order.shipped"]'
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhook_retry">Tentativas</Label>
                  <Input
                    id="webhook_retry"
                    type="number"
                    value={webhookForm.retry_count}
                    onChange={(e) => setWebhookForm({ ...webhookForm, retry_count: parseInt(e.target.value) })}
                    placeholder="3"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook_timeout">Timeout (s)</Label>
                  <Input
                    id="webhook_timeout"
                    type="number"
                    value={webhookForm.timeout_seconds}
                    onChange={(e) => setWebhookForm({ ...webhookForm, timeout_seconds: parseInt(e.target.value) })}
                    placeholder="30"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createWebhook} className="flex-1">
                  Criar Webhook
                </Button>
                <Button variant="outline" onClick={() => setShowCreateWebhook(false)}>
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

export default ExternalApis;
