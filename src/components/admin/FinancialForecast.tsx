import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Zap,
  Brain,
  LineChart,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface ForecastData {
  period: string;
  actual: number;
  predicted: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
}

interface FinancialForecastProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
}

const FinancialForecast: React.FC<FinancialForecastProps> = ({
  orders = [],
  suppliers = [],
  events = [],
  transactions = [],
  summary = {}
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState('3months');
  const [selectedMetric, setSelectedMetric] = useState('revenue');
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  // Dados simulados para previsões
  useEffect(() => {
    const generateForecastData = () => {
      const data: ForecastData[] = [];
      const periods = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set'];
      
      periods.forEach((period, index) => {
        const baseValue = selectedMetric === 'revenue' ? 8000 : 
                         selectedMetric === 'expenses' ? 3000 : 5000;
        
        const actual = baseValue + (Math.random() - 0.5) * 2000;
        const predicted = actual * (0.9 + Math.random() * 0.2);
        const confidence = 75 + Math.random() * 20;
        
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (index > 0) {
          const prevValue = data[index - 1].actual;
          if (actual > prevValue * 1.05) trend = 'up';
          else if (actual < prevValue * 0.95) trend = 'down';
        }
        
        data.push({
          period,
          actual: Math.round(actual),
          predicted: Math.round(predicted),
          confidence: Math.round(confidence),
          trend
        });
      });
      
      setForecastData(data);
    };

    generateForecastData();
  }, [selectedPeriod, selectedMetric]);

  // Gerar insights automáticos
  useEffect(() => {
    const generateInsights = () => {
      const newInsights = [
        {
          id: 1,
          type: 'trend',
          title: 'Tendência de Crescimento Positiva',
          description: 'O faturamento está crescendo 12% ao mês em média',
          impact: 'high',
          confidence: 85,
          icon: TrendingUp,
          color: 'text-green-600 bg-green-100'
        },
        {
          id: 2,
          type: 'prediction',
          title: 'Meta de Faturamento Alcançável',
          description: 'Baseado nas tendências atuais, você deve atingir 105% da meta mensal',
          impact: 'medium',
          confidence: 78,
          icon: Target,
          color: 'text-blue-600 bg-blue-100'
        },
        {
          id: 3,
          type: 'warning',
          title: 'Atenção aos Custos',
          description: 'Os custos operacionais estão crescendo mais rápido que as receitas',
          impact: 'high',
          confidence: 92,
          icon: AlertTriangle,
          color: 'text-orange-600 bg-orange-100'
        },
        {
          id: 4,
          type: 'opportunity',
          title: 'Oportunidade de Crescimento',
          description: 'A sazonalidade indica um pico de vendas nos próximos 2 meses',
          impact: 'high',
          confidence: 88,
          icon: Zap,
          color: 'text-purple-600 bg-purple-100'
        }
      ];
      
      setInsights(newInsights);
    };

    generateInsights();
  }, [selectedPeriod, selectedMetric]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'down':
        return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-100';
      case 'down':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const MetricSelector = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Configurações de Análise
        </CardTitle>
        <CardDescription>Selecione o período e métrica para análise</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Período de Análise</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
              <SelectItem value="2years">Últimos 2 anos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Métrica</label>
          <Select value={selectedMetric} onValueChange={setSelectedMetric}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Selecione a métrica" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="revenue">Faturamento</SelectItem>
              <SelectItem value="expenses">Despesas</SelectItem>
              <SelectItem value="profit">Lucro Líquido</SelectItem>
              <SelectItem value="customers">Novos Clientes</SelectItem>
              <SelectItem value="orders">Pedidos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  const ForecastChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChart className="h-5 w-5" />
          Previsões vs Realizado
        </CardTitle>
        <CardDescription>Comparativo entre valores previstos e realizados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {forecastData.map((data, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{data.period}</span>
                <div className="flex items-center gap-2">
                  {getTrendIcon(data.trend)}
                  <Badge className={getTrendColor(data.trend)}>
                    {data.trend === 'up' ? 'Crescimento' : 
                     data.trend === 'down' ? 'Queda' : 'Estável'}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Realizado</p>
                  <p className="font-bold text-blue-600">
                    R$ {data.actual.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-600">Previsto</p>
                  <p className="font-bold text-green-600">
                    R$ {data.predicted.toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <p className="text-xs text-gray-600">Precisão</p>
                  <p className={`font-bold ${getConfidenceColor(data.confidence)}`}>
                    {data.confidence}%
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Realizado</span>
                  <span>{data.actual.toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={(data.actual / Math.max(data.actual, data.predicted)) * 100} className="h-2" />
                
                <div className="flex justify-between text-sm">
                  <span>Previsto</span>
                  <span>{data.predicted.toLocaleString('pt-BR')}</span>
                </div>
                <Progress value={(data.predicted / Math.max(data.actual, data.predicted)) * 100} className="h-2" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const InsightsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Insights Inteligentes
        </CardTitle>
        <CardDescription>Análises automáticas baseadas nos seus dados</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="p-4 border rounded-lg">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-full ${insight.color}`}>
                  <insight.icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{insight.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {insight.confidence}% confiança
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      Impacto: 
                    </span>
                    <Badge 
                      variant="outline" 
                      className={
                        insight.impact === 'high' ? 'text-red-600 border-red-200' :
                        insight.impact === 'medium' ? 'text-yellow-600 border-yellow-200' :
                        'text-green-600 border-green-200'
                      }
                    >
                      {insight.impact === 'high' ? 'Alto' :
                       insight.impact === 'medium' ? 'Médio' : 'Baixo'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const PredictionsSummary = () => {
    const nextMonth = forecastData[forecastData.length - 1];
    const avgGrowth = forecastData.length > 1 ? 
      ((forecastData[forecastData.length - 1].actual - forecastData[0].actual) / forecastData[0].actual) * 100 : 0;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Previsão Próximo Mês</p>
                <p className="text-xl font-bold text-green-600">
                  R$ {nextMonth?.predicted.toLocaleString('pt-BR') || '0'}
                </p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Crescimento</p>
                <p className={`text-xl font-bold ${avgGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {avgGrowth > 0 ? '+' : ''}{avgGrowth.toFixed(1)}%
                </p>
              </div>
              {avgGrowth > 0 ? 
                <TrendingUp className="h-8 w-8 text-green-500" /> :
                <TrendingDown className="h-8 w-8 text-red-500" />
              }
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precisão Média</p>
                <p className="text-xl font-bold text-blue-600">
                  {Math.round(forecastData.reduce((sum, d) => sum + d.confidence, 0) / forecastData.length)}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Análise de Tendências e Previsões</h2>
        <p className="text-gray-600">IA analisa seus dados para prever tendências futuras</p>
      </div>

      {/* Resumo das Previsões */}
      <PredictionsSummary />

      {/* Abas de Análise */}
      <Tabs defaultValue="forecast" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="forecast">Previsões</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ForecastChart />
            </div>
            <div>
              <InsightsPanel />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsPanel />
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendências Positivas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Crescimento consistente de 12% ao mês</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Aumento na base de clientes</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Eficiência operacional melhorando</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Pontos de Atenção
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Custos crescendo mais rápido que receitas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Sazonalidade pode impactar vendas</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Dependência de poucos fornecedores</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <MetricSelector />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialForecast;
