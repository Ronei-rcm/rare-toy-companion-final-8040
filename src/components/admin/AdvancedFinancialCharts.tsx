import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown,
  Activity,
  DollarSign,
  Calendar,
  Filter,
  Download,
  Eye,
  Settings,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    fill?: boolean;
    tension?: number;
  }[];
}

interface AdvancedFinancialChartsProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
}

const AdvancedFinancialCharts: React.FC<AdvancedFinancialChartsProps> = ({
  orders,
  suppliers,
  events,
  transactions,
  summary
}) => {
  const [activeChart, setActiveChart] = useState('revenue');
  const [timeRange, setTimeRange] = useState('30d');
  const [chartMode, setChartMode] = useState('interactive');
  const [isAnimating, setIsAnimating] = useState(false);

  // Simular dados de gráfico avançados
  const generateRevenueChartData = (): ChartData => {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const labels = [];
    const revenueData = [];
    const expenseData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
      
      // Simular dados realistas
      const baseRevenue = 800 + Math.random() * 400;
      const baseExpense = 300 + Math.random() * 200;
      
      revenueData.push(Math.round(baseRevenue));
      expenseData.push(Math.round(baseExpense));
    }

    return {
      labels,
      datasets: [
        {
          label: 'Receita',
          data: revenueData,
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          borderColor: 'rgb(34, 197, 94)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Despesas',
          data: expenseData,
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgb(239, 68, 68)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const generateProfitChartData = (): ChartData => {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const profitData = [1200, 1450, 1680, 1920, 2100, 2350, 2580, 2800, 3050, 3200, 3450, 3800];
    
    return {
      labels: months,
      datasets: [
        {
          label: 'Lucro Líquido',
          data: profitData,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgb(59, 130, 246)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  const generateCategoryChartData = (): ChartData => {
    const categories = ['Vendas', 'Eventos', 'Serviços', 'Marketing', 'Operacional'];
    const revenueData = [4500, 2800, 1200, 800, 600];
    const colors = [
      'rgba(34, 197, 94, 0.8)',
      'rgba(59, 130, 246, 0.8)',
      'rgba(168, 85, 247, 0.8)',
      'rgba(245, 158, 11, 0.8)',
      'rgba(239, 68, 68, 0.8)'
    ];

    return {
      labels: categories,
      datasets: [
        {
          label: 'Receita por Categoria',
          data: revenueData,
          backgroundColor: colors,
          borderColor: colors.map(color => color.replace('0.8', '1')),
          borderWidth: 2
        }
      ]
    };
  };

  const generateCashFlowChartData = (): ChartData => {
    const days = 30;
    const labels = [];
    const cashFlowData = [];
    let runningBalance = 50000; // Saldo inicial
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - 1 - i));
      labels.push(date.toLocaleDateString('pt-BR', { day: '2-digit' }));
      
      // Simular fluxo de caixa
      const dailyChange = (Math.random() - 0.3) * 5000; // Tendência positiva
      runningBalance += dailyChange;
      cashFlowData.push(Math.round(runningBalance));
    }

    return {
      labels,
      datasets: [
        {
          label: 'Saldo em Caixa',
          data: cashFlowData,
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgb(16, 185, 129)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  };

  // Componente de gráfico simulado (substitua por uma biblioteca real como Chart.js)
  const SimulatedChart: React.FC<{ data: ChartData; type: 'line' | 'bar' | 'pie' }> = ({ data, type }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Limpar canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Configurações do gráfico
      const padding = 40;
      const chartWidth = canvas.width - padding * 2;
      const chartHeight = canvas.height - padding * 2;

      // Encontrar valores máximo e mínimo
      const allValues = data.datasets.flatMap(dataset => dataset.data);
      const maxValue = Math.max(...allValues);
      const minValue = Math.min(...allValues);
      const valueRange = maxValue - minValue;

      // Desenhar eixos
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;

      // Eixo Y
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.stroke();

      // Eixo X
      ctx.beginPath();
      ctx.moveTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();

      // Desenhar linhas de grade
      for (let i = 1; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
      }

      if (type === 'line' && data.datasets.length > 0) {
        const dataset = data.datasets[0];
        const stepX = chartWidth / (data.labels.length - 1);

        ctx.strokeStyle = dataset.borderColor || '#3b82f6';
        ctx.lineWidth = 3;
        ctx.beginPath();

        data.labels.forEach((label, index) => {
          const x = padding + index * stepX;
          const y = canvas.height - padding - ((dataset.data[index] - minValue) / valueRange) * chartHeight;

          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Desenhar pontos
        ctx.fillStyle = dataset.borderColor || '#3b82f6';
        data.labels.forEach((label, index) => {
          const x = padding + index * stepX;
          const y = canvas.height - padding - ((dataset.data[index] - minValue) / valueRange) * chartHeight;

          ctx.beginPath();
          ctx.arc(x, y, 4, 0, 2 * Math.PI);
          ctx.fill();
        });
      }

      // Desenhar labels no eixo X
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      
      data.labels.forEach((label, index) => {
        const x = padding + index * (chartWidth / (data.labels.length - 1));
        ctx.fillText(label, x, canvas.height - padding + 20);
      });

      // Desenhar valores no eixo Y
      ctx.textAlign = 'right';
      for (let i = 0; i <= 5; i++) {
        const value = minValue + (valueRange / 5) * i;
        const y = canvas.height - padding - (chartHeight / 5) * i;
        ctx.fillText(value.toLocaleString('pt-BR'), padding - 10, y + 4);
      }
    }, [data, type]);

    return (
      <canvas
        ref={canvasRef}
        width={600}
        height={300}
        className="w-full h-full max-w-full"
      />
    );
  };

  const chartData = {
    revenue: generateRevenueChartData(),
    profit: generateProfitChartData(),
    category: generateCategoryChartData(),
    cashflow: generateCashFlowChartData()
  };

  const chartConfigs = {
    revenue: {
      title: 'Receita vs Despesas',
      description: 'Comparação diária entre receita e despesas',
      type: 'line' as const,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    profit: {
      title: 'Evolução do Lucro',
      description: 'Crescimento mensal do lucro líquido',
      type: 'line' as const,
      icon: DollarSign,
      color: 'text-blue-600'
    },
    category: {
      title: 'Receita por Categoria',
      description: 'Distribuição da receita por tipo de atividade',
      type: 'bar' as const,
      icon: PieChart,
      color: 'text-purple-600'
    },
    cashflow: {
      title: 'Fluxo de Caixa',
      description: 'Evolução do saldo em caixa',
      type: 'line' as const,
      icon: Activity,
      color: 'text-emerald-600'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Gráficos Avançados
          </h2>
          <p className="text-muted-foreground">
            Visualizações interativas e análises detalhadas
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button
              variant={timeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('7d')}
            >
              7 dias
            </Button>
            <Button
              variant={timeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('30d')}
            >
              30 dias
            </Button>
            <Button
              variant={timeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('90d')}
            >
              90 dias
            </Button>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Seleção de Gráficos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(chartConfigs).map(([key, config]) => (
          <motion.div
            key={key}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`cursor-pointer transition-all ${
                activeChart === key 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setActiveChart(key)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <config.icon className={`h-6 w-6 ${config.color}`} />
                  <div>
                    <h3 className="font-semibold text-sm">{config.title}</h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Gráfico Principal */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeChart}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {React.createElement(chartConfigs[activeChart as keyof typeof chartConfigs].icon, {
                    className: `h-5 w-5 ${chartConfigs[activeChart as keyof typeof chartConfigs].color}`
                  })}
                  <div>
                    <CardTitle>{chartConfigs[activeChart as keyof typeof chartConfigs].title}</CardTitle>
                    <CardDescription>
                      {chartConfigs[activeChart as keyof typeof chartConfigs].description}
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {timeRange === '7d' ? '7 dias' : timeRange === '30d' ? '30 dias' : '90 dias'}
                  </Badge>
                  
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                {isAnimating && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
                    <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                )}
                
                <div className="h-80 w-full">
                  <SimulatedChart 
                    data={chartData[activeChart as keyof typeof chartData]} 
                    type={chartConfigs[activeChart as keyof typeof chartConfigs].type}
                  />
                </div>
              </div>
              
              {/* Estatísticas do Gráfico */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {activeChart === 'revenue' && 'R$ 12.450'}
                    {activeChart === 'profit' && 'R$ 3.800'}
                    {activeChart === 'category' && 'R$ 9.900'}
                    {activeChart === 'cashflow' && 'R$ 85.200'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activeChart === 'revenue' && 'Receita Total'}
                    {activeChart === 'profit' && 'Lucro Atual'}
                    {activeChart === 'category' && 'Receita Total'}
                    {activeChart === 'cashflow' && 'Saldo Atual'}
                  </div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 text-lg font-semibold text-green-600">
                    <ArrowUpRight className="h-4 w-4" />
                    +18.5%
                  </div>
                  <div className="text-sm text-muted-foreground">Crescimento</div>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">95%</div>
                  <div className="text-sm text-muted-foreground">Meta Alcançada</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Gráficos Secundários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Metas vs Realizado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Receita Mensal</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  105%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '105%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Novos Clientes</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  78%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '78%' }}></div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Eventos Realizados</span>
                <Badge variant="default" className="bg-purple-100 text-purple-800">
                  90%
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '90%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Performance Rápida
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Vendas Hoje</span>
                </div>
                <span className="text-lg font-bold text-green-600">R$ 850</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Esta Semana</span>
                </div>
                <span className="text-lg font-bold text-blue-600">R$ 4.200</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Este Mês</span>
                </div>
                <span className="text-lg font-bold text-purple-600">R$ 18.500</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedFinancialCharts;
