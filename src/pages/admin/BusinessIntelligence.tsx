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
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Plus,
  Settings,
  Eye,
  Edit,
  Trash2,
  Filter,
  Search,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface KPIMetric {
  id: string;
  name: string;
  description: string;
  metric_type: string;
  current_value: number;
  target_value: number;
  unit: string;
  trend_direction: 'up' | 'down' | 'stable';
  trend_percentage: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  created_at: string;
}

interface DashboardWidget {
  id: string;
  name: string;
  description: string;
  widget_type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface SystemStats {
  total_users: number;
  total_orders: number;
  total_products: number;
  total_revenue: number;
  orders_last_30_days: number;
  revenue_last_30_days: number;
}

const BusinessIntelligence: React.FC = () => {
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>([]);
  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showCreateWidget, setShowCreateWidget] = useState(false);
  const [showCreateKPI, setShowCreateKPI] = useState(false);

  // Formulários
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    category: 'sales',
    query_template: '',
    parameters: '[]',
    chart_config: '{}'
  });

  const [widgetForm, setWidgetForm] = useState({
    name: '',
    description: '',
    widget_type: 'chart',
    data_source: 'orders',
    query_template: '',
    chart_config: '{}',
    position_x: 0,
    position_y: 0,
    width: 4,
    height: 3
  });

  const [kpiForm, setKpiForm] = useState({
    name: '',
    description: '',
    metric_type: 'revenue',
    calculation_formula: '',
    target_value: 0,
    unit: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadKPIMetrics(),
        loadReportTemplates(),
        loadDashboardWidgets(),
        loadSystemStats()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadKPIMetrics = async () => {
    try {
      const response = await fetch('/api/bi/kpi-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setKpiMetrics(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas KPI:', error);
    }
  };

  const loadReportTemplates = async () => {
    try {
      const response = await fetch('/api/bi/report-templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setReportTemplates(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar templates de relatório:', error);
    }
  };

  const loadDashboardWidgets = async () => {
    try {
      const response = await fetch('/api/bi/widgets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setDashboardWidgets(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar widgets:', error);
    }
  };

  const loadSystemStats = async () => {
    try {
      const response = await fetch('/api/bi/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setSystemStats(data.data.overview);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const createReportTemplate = async () => {
    try {
      const response = await fetch('/api/bi/report-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...templateForm,
          parameters: JSON.parse(templateForm.parameters),
          chart_config: JSON.parse(templateForm.chart_config),
          created_by: 'admin'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateTemplate(false);
        setTemplateForm({
          name: '',
          description: '',
          category: 'sales',
          query_template: '',
          parameters: '[]',
          chart_config: '{}'
        });
        loadReportTemplates();
      }
    } catch (error) {
      console.error('Erro ao criar template:', error);
    }
  };

  const createDashboardWidget = async () => {
    try {
      const response = await fetch('/api/bi/widgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...widgetForm,
          chart_config: JSON.parse(widgetForm.chart_config),
          created_by: 'admin'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateWidget(false);
        setWidgetForm({
          name: '',
          description: '',
          widget_type: 'chart',
          data_source: 'orders',
          query_template: '',
          chart_config: '{}',
          position_x: 0,
          position_y: 0,
          width: 4,
          height: 3
        });
        loadDashboardWidgets();
      }
    } catch (error) {
      console.error('Erro ao criar widget:', error);
    }
  };

  const createKPIMetric = async () => {
    try {
      const response = await fetch('/api/bi/kpi-metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...kpiForm,
          created_by: 'admin'
        })
      });
      
      const data = await response.json();
      if (data.success) {
        setShowCreateKPI(false);
        setKpiForm({
          name: '',
          description: '',
          metric_type: 'revenue',
          calculation_formula: '',
          target_value: 0,
          unit: ''
        });
        loadKPIMetrics();
      }
    } catch (error) {
      console.error('Erro ao criar métrica KPI:', error);
    }
  };

  const updateKPIMetrics = async () => {
    try {
      const response = await fetch('/api/bi/kpi-metrics/update', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        loadKPIMetrics();
      }
    } catch (error) {
      console.error('Erro ao atualizar métricas:', error);
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="w-5 h-5 text-green-600" />;
      case 'orders':
        return <Package className="w-5 h-5 text-blue-600" />;
      case 'customers':
        return <Users className="w-5 h-5 text-purple-600" />;
      case 'products':
        return <Package className="w-5 h-5 text-orange-600" />;
      case 'conversion':
        return <Target className="w-5 h-5 text-pink-600" />;
      case 'retention':
        return <Zap className="w-5 h-5 text-yellow-600" />;
      default:
        return <BarChart3 className="w-5 h-5 text-gray-600" />;
    }
  };

  const getWidgetIcon = (type: string) => {
    switch (type) {
      case 'chart':
        return <BarChart3 className="w-4 h-4" />;
      case 'table':
        return <Package className="w-4 h-4" />;
      case 'metric':
        return <Target className="w-4 h-4" />;
      case 'kpi':
        return <TrendingUp className="w-4 h-4" />;
      case 'gauge':
        return <Activity className="w-4 h-4" />;
      case 'pie':
        return <PieChart className="w-4 h-4" />;
      case 'line':
        return <LineChart className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
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
        <h1 className="text-3xl font-bold text-gray-900">📊 Business Intelligence</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={updateKPIMetrics}>
            <Zap className="w-4 h-4 mr-2" />
            Atualizar KPIs
          </Button>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      {systemStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{formatNumber(systemStats.total_users)}</div>
              <div className="text-sm text-gray-600">Usuários</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{formatNumber(systemStats.total_orders)}</div>
              <div className="text-sm text-gray-600">Pedidos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{formatNumber(systemStats.total_products)}</div>
              <div className="text-sm text-gray-600">Produtos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <DollarSign className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(systemStats.total_revenue)}</div>
              <div className="text-sm text-gray-600">Receita Total</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{formatNumber(systemStats.orders_last_30_days)}</div>
              <div className="text-sm text-gray-600">Últimos 30 dias</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-8 h-8 text-pink-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-pink-600">{formatCurrency(systemStats.revenue_last_30_days)}</div>
              <div className="text-sm text-gray-600">Receita 30 dias</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="kpis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="kpis">KPIs</TabsTrigger>
          <TabsTrigger value="reports">Relatórios</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="kpis" className="space-y-6">
          {/* Métricas KPI */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Métricas KPI</h2>
            <Button onClick={() => setShowCreateKPI(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Métrica
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpiMetrics.map((metric) => (
              <Card key={metric.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getMetricIcon(metric.metric_type)}
                      <h3 className="font-semibold">{metric.name}</h3>
                    </div>
                    <Badge variant="outline">{metric.metric_type}</Badge>
                  </div>
                  
                  <div className="text-3xl font-bold mb-2">
                    {metric.unit === 'currency' ? formatCurrency(metric.current_value) : 
                     metric.unit === 'percentage' ? `${metric.current_value}%` :
                     formatNumber(metric.current_value)} {metric.unit}
                  </div>
                  
                  {metric.target_value && (
                    <div className="text-sm text-gray-600 mb-2">
                      Meta: {metric.unit === 'currency' ? formatCurrency(metric.target_value) : 
                             metric.unit === 'percentage' ? `${metric.target_value}%` :
                             formatNumber(metric.target_value)} {metric.unit}
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(metric.trend_direction)}
                    <span className={`text-sm ${getTrendColor(metric.trend_direction)}`}>
                      {metric.trend_percentage > 0 ? '+' : ''}{metric.trend_percentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-500 mt-2">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Templates de Relatório */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Templates de Relatório</h2>
            <Button onClick={() => setShowCreateTemplate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Template
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => (
              <Card key={template.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{template.name}</h3>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {format(parseISO(template.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Widgets do Dashboard */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Widgets do Dashboard</h2>
            <Button onClick={() => setShowCreateWidget(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Widget
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {dashboardWidgets.map((widget) => (
              <Card key={widget.id} className="col-span-1">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      {getWidgetIcon(widget.widget_type)}
                      <h3 className="font-semibold">{widget.name}</h3>
                    </div>
                    <Badge variant="outline">{widget.widget_type}</Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">{widget.description}</p>
                  
                  <div className="text-xs text-gray-500 mb-4">
                    Posição: {widget.position_x}, {widget.position_y} | 
                    Tamanho: {widget.width}x{widget.height}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Avançados */}
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Analytics Avançados</h2>
            <div className="flex gap-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 dias</SelectItem>
                  <SelectItem value="30">30 dias</SelectItem>
                  <SelectItem value="90">90 dias</SelectItem>
                  <SelectItem value="365">1 ano</SelectItem>
                </SelectContent>
              </Select>
              <Button>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendas por Período</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de vendas será implementado aqui
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Produtos Mais Vendidos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de produtos será implementado aqui
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Clientes por Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de segmentação será implementado aqui
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance de Estoque</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  Gráfico de estoque será implementado aqui
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Template */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Template de Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_name">Nome</Label>
                  <Input
                    id="template_name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    placeholder="Nome do template"
                  />
                </div>
                <div>
                  <Label htmlFor="template_category">Categoria</Label>
                  <Select value={templateForm.category} onValueChange={(value) => setTemplateForm({...templateForm, category: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Vendas</SelectItem>
                      <SelectItem value="customers">Clientes</SelectItem>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="inventory">Estoque</SelectItem>
                      <SelectItem value="financial">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="template_description">Descrição</Label>
                <Textarea
                  id="template_description"
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  placeholder="Descrição do template"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="template_query">Query SQL</Label>
                <Textarea
                  id="template_query"
                  value={templateForm.query_template}
                  onChange={(e) => setTemplateForm({...templateForm, query_template: e.target.value})}
                  placeholder="SELECT * FROM orders WHERE created_at >= {date_from}"
                  rows={6}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="template_parameters">Parâmetros (JSON)</Label>
                  <Textarea
                    id="template_parameters"
                    value={templateForm.parameters}
                    onChange={(e) => setTemplateForm({...templateForm, parameters: e.target.value})}
                    placeholder='[{"name": "date_from", "type": "date"}]'
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="template_chart">Configuração do Gráfico (JSON)</Label>
                  <Textarea
                    id="template_chart"
                    value={templateForm.chart_config}
                    onChange={(e) => setTemplateForm({...templateForm, chart_config: e.target.value})}
                    placeholder='{"type": "line", "x": "date", "y": "revenue"}'
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createReportTemplate} className="flex-1">
                  Criar Template
                </Button>
                <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Criação de Widget */}
      {showCreateWidget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Novo Widget de Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="widget_name">Nome</Label>
                  <Input
                    id="widget_name"
                    value={widgetForm.name}
                    onChange={(e) => setWidgetForm({...widgetForm, name: e.target.value})}
                    placeholder="Nome do widget"
                  />
                </div>
                <div>
                  <Label htmlFor="widget_type">Tipo</Label>
                  <Select value={widgetForm.widget_type} onValueChange={(value) => setWidgetForm({...widgetForm, widget_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chart">Gráfico</SelectItem>
                      <SelectItem value="table">Tabela</SelectItem>
                      <SelectItem value="metric">Métrica</SelectItem>
                      <SelectItem value="kpi">KPI</SelectItem>
                      <SelectItem value="gauge">Gauge</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="widget_description">Descrição</Label>
                <Textarea
                  id="widget_description"
                  value={widgetForm.description}
                  onChange={(e) => setWidgetForm({...widgetForm, description: e.target.value})}
                  placeholder="Descrição do widget"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="widget_query">Query SQL</Label>
                <Textarea
                  id="widget_query"
                  value={widgetForm.query_template}
                  onChange={(e) => setWidgetForm({...widgetForm, query_template: e.target.value})}
                  placeholder="SELECT * FROM orders WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="widget_x">Posição X</Label>
                  <Input
                    id="widget_x"
                    type="number"
                    value={widgetForm.position_x}
                    onChange={(e) => setWidgetForm({...widgetForm, position_x: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="widget_y">Posição Y</Label>
                  <Input
                    id="widget_y"
                    type="number"
                    value={widgetForm.position_y}
                    onChange={(e) => setWidgetForm({...widgetForm, position_y: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="widget_width">Largura</Label>
                  <Input
                    id="widget_width"
                    type="number"
                    value={widgetForm.width}
                    onChange={(e) => setWidgetForm({...widgetForm, width: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="widget_height">Altura</Label>
                  <Input
                    id="widget_height"
                    type="number"
                    value={widgetForm.height}
                    onChange={(e) => setWidgetForm({...widgetForm, height: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createDashboardWidget} className="flex-1">
                  Criar Widget
                </Button>
                <Button variant="outline" onClick={() => setShowCreateWidget(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Criação de KPI */}
      {showCreateKPI && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Métrica KPI</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="kpi_name">Nome</Label>
                <Input
                  id="kpi_name"
                  value={kpiForm.name}
                  onChange={(e) => setKpiForm({...kpiForm, name: e.target.value})}
                  placeholder="Nome da métrica"
                />
              </div>
              
              <div>
                <Label htmlFor="kpi_description">Descrição</Label>
                <Textarea
                  id="kpi_description"
                  value={kpiForm.description}
                  onChange={(e) => setKpiForm({...kpiForm, description: e.target.value})}
                  placeholder="Descrição da métrica"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kpi_type">Tipo</Label>
                  <Select value={kpiForm.metric_type} onValueChange={(value) => setKpiForm({...kpiForm, metric_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Receita</SelectItem>
                      <SelectItem value="orders">Pedidos</SelectItem>
                      <SelectItem value="customers">Clientes</SelectItem>
                      <SelectItem value="products">Produtos</SelectItem>
                      <SelectItem value="conversion">Conversão</SelectItem>
                      <SelectItem value="retention">Retenção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kpi_unit">Unidade</Label>
                  <Input
                    id="kpi_unit"
                    value={kpiForm.unit}
                    onChange={(e) => setKpiForm({...kpiForm, unit: e.target.value})}
                    placeholder="R$, %, unidade"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="kpi_formula">Fórmula de Cálculo</Label>
                <Textarea
                  id="kpi_formula"
                  value={kpiForm.calculation_formula}
                  onChange={(e) => setKpiForm({...kpiForm, calculation_formula: e.target.value})}
                  placeholder="SELECT SUM(total) FROM orders WHERE created_at >= {TODAY}"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="kpi_target">Valor Meta</Label>
                <Input
                  id="kpi_target"
                  type="number"
                  value={kpiForm.target_value}
                  onChange={(e) => setKpiForm({...kpiForm, target_value: parseFloat(e.target.value)})}
                  placeholder="0"
                />
              </div>
              
              <div className="flex gap-2">
                <Button onClick={createKPIMetric} className="flex-1">
                  Criar Métrica
                </Button>
                <Button variant="outline" onClick={() => setShowCreateKPI(false)}>
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

export default BusinessIntelligence;
