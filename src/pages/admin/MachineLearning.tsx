import React, { useState, useEffect } from 'react';
import { request } from '@/services/api-config';
import {
  Brain,
  Bot,
  TrendingUp,
  Users,
  Package,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Eye,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  Activity,
  MessageSquare,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import RecommendationEngine from '@/components/ai/RecommendationEngine';
import AIChatbot from '@/components/ai/AIChatbot';
import PredictiveAnalytics from '@/components/ai/PredictiveAnalytics';

interface MLMetrics {
  models: Array<{
    type: string;
    status: string;
    count: number;
    avg_accuracy: number;
  }>;
  recommendations: Array<{
    algorithm: string;
    total_recommendations: number;
    clicks: number;
    purchases: number;
    avg_confidence: number;
    click_rate: number;
    conversion_rate: number;
  }>;
  interactions: Array<{
    interaction_type: string;
    count: number;
  }>;
}

interface MLModel {
  id: string;
  name: string;
  type: string;
  status: string;
  version: string;
  accuracy: number;
  created_at: string;
  updated_at: string;
}

const MachineLearning: React.FC = () => {
  const [metrics, setMetrics] = useState<MLMetrics | null>(null);
  const [models, setModels] = useState<MLModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [testUserId, setTestUserId] = useState('test-user-123');
  const [testProductId, setTestProductId] = useState('test-product-456');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMetrics(),
        loadModels()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      const data = await request<any>('/ml/metrics');
      if (data.success) {
        setMetrics(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas ML:', error);
    }
  };

  const loadModels = async () => {
    try {
      const data = await request<any>('/ml/models');
      if (data.success) {
        setModels(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar modelos ML:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trained':
        return 'text-green-600 bg-green-100';
      case 'deployed':
        return 'text-blue-600 bg-blue-100';
      case 'training':
        return 'text-yellow-600 bg-yellow-100';
      case 'retired':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'recommendation':
        return <Target className="w-4 h-4" />;
      case 'prediction':
        return <TrendingUp className="w-4 h-4" />;
      case 'classification':
        return <BarChart3 className="w-4 h-4" />;
      case 'clustering':
        return <Users className="w-4 h-4" />;
      case 'nlp':
        return <MessageSquare className="w-4 h-4" />;
      case 'computer_vision':
        return <Eye className="w-4 h-4" />;
      default:
        return <Brain className="w-4 h-4" />;
    }
  };

  const getTypeName = (type: string) => {
    const names: { [key: string]: string } = {
      'recommendation': 'Recomendação',
      'prediction': 'Previsão',
      'classification': 'Classificação',
      'clustering': 'Agrupamento',
      'nlp': 'Processamento de Linguagem',
      'computer_vision': 'Visão Computacional'
    };
    return names[type] || type;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatPercentage = (num: number) => {
    return `${Math.round(num * 100) / 100}%`;
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
        <h1 className="text-3xl font-bold text-gray-900">🤖 Machine Learning & IA</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">
                {models.length}
              </div>
              <div className="text-sm text-gray-600">Modelos ML</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(metrics.recommendations.reduce((sum, r) => sum + r.total_recommendations, 0))}
              </div>
              <div className="text-sm text-gray-600">Recomendações (30d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(metrics.interactions.reduce((sum, i) => sum + i.count, 0))}
              </div>
              <div className="text-sm text-gray-600">Interações (7d)</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">
                {formatPercentage(metrics.recommendations.reduce((sum, r) => sum + r.conversion_rate, 0) / metrics.recommendations.length)}
              </div>
              <div className="text-sm text-gray-600">Taxa de Conversão</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="chatbot">Chatbot IA</TabsTrigger>
          <TabsTrigger value="predictions">Previsões</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Performance dos Algoritmos */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Performance dos Algoritmos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics.recommendations.map((rec, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{rec.algorithm}</Badge>
                          <span className="text-sm text-gray-600">
                            {formatNumber(rec.total_recommendations)} recomendações
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatPercentage(rec.avg_confidence)} confiança média
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatPercentage(rec.click_rate)}
                          </div>
                          <div className="text-gray-600">Taxa de Clique</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-green-600">
                            {formatPercentage(rec.conversion_rate)}
                          </div>
                          <div className="text-gray-600">Taxa de Conversão</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">
                            {formatNumber(rec.purchases)}
                          </div>
                          <div className="text-gray-600">Compras Geradas</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tipos de Interação */}
          {metrics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Tipos de Interação (7 dias)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.interactions.map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="capitalize">{interaction.interaction_type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{formatNumber(interaction.count)}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(interaction.count / Math.max(...metrics.interactions.map(i => i.count))) * 100}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recomendações */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Engine de Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Usuário para Teste
                </label>
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o ID do usuário"
                />
              </div>
              <RecommendationEngine
                userId={testUserId}
                limit={12}
                showAlgorithmInfo={true}
                onProductClick={(product) => console.log('Produto clicado:', product)}
                onAddToCart={(productId) => console.log('Adicionar ao carrinho:', productId)}
                onToggleFavorite={(productId) => console.log('Toggle favorito:', productId)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Chatbot IA */}
        <TabsContent value="chatbot" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                Chatbot com Inteligência Artificial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID do Usuário para Teste
                </label>
                <input
                  type="text"
                  value={testUserId}
                  onChange={(e) => setTestUserId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite o ID do usuário"
                />
              </div>
              <AIChatbot
                userId={testUserId}
                sessionId="admin-test-session"
                showHeader={true}
                maxHeight="500px"
                onMessageSent={(message) => console.log('Mensagem enviada:', message)}
                onMessageReceived={(message) => console.log('Mensagem recebida:', message)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Previsões */}
        <TabsContent value="predictions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Analytics Preditivos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID do Usuário para Análise de Churn
                  </label>
                  <input
                    type="text"
                    value={testUserId}
                    onChange={(e) => setTestUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o ID do usuário"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID do Produto para Previsão de Demanda
                  </label>
                  <input
                    type="text"
                    value={testProductId}
                    onChange={(e) => setTestProductId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Digite o ID do produto"
                  />
                </div>
              </div>
              <PredictiveAnalytics
                userId={testUserId}
                productId={testProductId}
                showDemandPrediction={true}
                showChurnPrediction={true}
                onExportData={(data) => console.log('Exportar dados:', data)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modelos */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  Modelos de Machine Learning
                </CardTitle>
                <Button>
                  <Settings className="w-4 h-4 mr-2" />
                  Novo Modelo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {models.map((model) => (
                  <div key={model.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(model.type)}
                        <div>
                          <h3 className="font-semibold">{model.name}</h3>
                          <p className="text-sm text-gray-600">
                            {getTypeName(model.type)} • v{model.version}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(model.status)}>
                          {model.status}
                        </Badge>
                        {model.accuracy && (
                          <Badge variant="outline">
                            {formatPercentage(model.accuracy)} precisão
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>Criado em {new Date(model.created_at).toLocaleDateString('pt-BR')}</span>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MachineLearning;
