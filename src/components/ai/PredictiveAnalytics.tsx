import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Package,
  Calendar,
  RefreshCw,
  Download,
  Eye,
  Brain,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';

interface DemandPrediction {
  product_id: string;
  current_avg_daily: number;
  trend: number;
  predictions: Array<{
    day: number;
    predicted_quantity: number;
    confidence: number;
  }>;
  total_predicted_demand: number;
}

interface ChurnPrediction {
  user_id: string;
  churn_risk: number;
  risk_level: 'low' | 'medium' | 'high';
  risk_factors: string[];
  recommendations: string[];
}

interface PredictiveAnalyticsProps {
  userId?: string;
  productId?: string;
  showDemandPrediction?: boolean;
  showChurnPrediction?: boolean;
  onExportData?: (data: any) => void;
}

const PredictiveAnalytics: React.FC<PredictiveAnalyticsProps> = ({
  userId,
  productId,
  showDemandPrediction = true,
  showChurnPrediction = true,
  onExportData
}) => {
  const [demandPrediction, setDemandPrediction] = useState<DemandPrediction | null>(null);
  const [churnPrediction, setChurnPrediction] = useState<ChurnPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('demand');

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (showDemandPrediction && productId) {
      loadDemandPrediction();
    }
    if (showChurnPrediction && userId) {
      loadChurnPrediction();
    }
  }, [productId, userId]);

  const loadDemandPrediction = async () => {
    if (!productId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ml/predictions/demand/${productId}?days=30`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setDemandPrediction(data.data);
      } else {
        setError(data.error || 'Erro ao carregar previsão de demanda');
      }
    } catch (error) {
      console.error('Erro ao carregar previsão de demanda:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const loadChurnPrediction = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ml/predictions/churn/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setChurnPrediction(data.data);
      } else {
        setError(data.error || 'Erro ao carregar previsão de churn');
      }
    } catch (error) {
      console.error('Erro ao carregar previsão de churn:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'high':
        return <AlertTriangle className="w-4 h-4" />;
      case 'medium':
        return <Clock className="w-4 h-4" />;
      case 'low':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Target className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <BarChart3 className="w-4 h-4 text-gray-600" />;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="text-red-500 mb-2">❌</div>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => {
              if (selectedTab === 'demand') loadDemandPrediction();
              if (selectedTab === 'churn') loadChurnPrediction();
            }} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">Analytics Preditivos</CardTitle>
                <p className="text-sm text-gray-600">
                  Previsões baseadas em Machine Learning
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (selectedTab === 'demand') loadDemandPrediction();
                  if (selectedTab === 'churn') loadChurnPrediction();
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportData?.(selectedTab === 'demand' ? demandPrediction : churnPrediction)}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="demand" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Demanda
          </TabsTrigger>
          <TabsTrigger value="churn" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Churn
          </TabsTrigger>
        </TabsList>

        {/* Previsão de Demanda */}
        <TabsContent value="demand" className="space-y-4">
          {demandPrediction ? (
            <>
              {/* Resumo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Previsão de Demanda - 30 Dias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatNumber(demandPrediction.current_avg_daily)}
                      </div>
                      <div className="text-sm text-gray-600">Média Diária Atual</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold flex items-center justify-center gap-1 ${
                        getTrendColor(demandPrediction.trend)
                      }`}>
                        {getTrendIcon(demandPrediction.trend)}
                        {demandPrediction.trend > 0 ? '+' : ''}{demandPrediction.trend.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">Tendência Diária</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatNumber(demandPrediction.total_predicted_demand)}
                      </div>
                      <div className="text-sm text-gray-600">Demanda Total Prevista</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gráfico de Previsão */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Projeção de Demanda
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {demandPrediction.predictions.slice(0, 7).map((prediction, index) => (
                      <div key={prediction.day} className="flex items-center gap-4">
                        <div className="w-16 text-sm text-gray-600">
                          Dia {prediction.day}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">
                              {formatNumber(prediction.predicted_quantity)} unidades
                            </span>
                            <span className="text-xs text-gray-500">
                              {Math.round(prediction.confidence * 100)}% confiança
                            </span>
                          </div>
                          <Progress 
                            value={prediction.confidence * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma previsão de demanda
                </h3>
                <p className="text-gray-600">
                  Selecione um produto para ver a previsão de demanda
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Previsão de Churn */}
        <TabsContent value="churn" className="space-y-4">
          {churnPrediction ? (
            <>
              {/* Resumo do Churn */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Análise de Churn do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          getRiskLevelColor(churnPrediction.risk_level).split(' ')[1]
                        }`}>
                          {getRiskLevelIcon(churnPrediction.risk_level)}
                        </div>
                        <div>
                          <div className="font-semibold">Risco de Churn</div>
                          <Badge className={getRiskLevelColor(churnPrediction.risk_level)}>
                            {churnPrediction.risk_level.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="text-3xl font-bold text-gray-900 mb-2">
                        {Math.round(churnPrediction.churn_risk * 100)}%
                      </div>
                      <div className="text-sm text-gray-600">Probabilidade de churn</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Fatores de Risco:
                      </div>
                      <div className="space-y-1">
                        {churnPrediction.risk_factors.map((factor, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                            <AlertTriangle className="w-3 h-3 text-orange-500" />
                            <span>{factor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendações */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Recomendações de Retenção
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {churnPrediction.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{recommendation}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma análise de churn
                </h3>
                <p className="text-gray-600">
                  Selecione um cliente para ver a análise de churn
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;
