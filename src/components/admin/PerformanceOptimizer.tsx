import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Zap, 
  Database, 
  Image, 
  Code, 
  Globe, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Info,
  Play,
  Pause,
  RotateCcw,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface OptimizationTask {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'images' | 'code' | 'network' | 'cache';
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: number;
  estimatedTime: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  autoRun: boolean;
  lastRun?: Date;
  result?: string;
}

interface PerformanceMetrics {
  pageLoad: number;
  apiResponse: number;
  imageLoad: number;
  databaseQuery: number;
  cacheHitRate: number;
  overallScore: number;
}

const PerformanceOptimizer: React.FC = () => {
  const [tasks, setTasks] = useState<OptimizationTask[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoOptimization, setAutoOptimization] = useState(true);

  // Tarefas de otimização disponíveis
  const initialTasks: OptimizationTask[] = [
    {
      id: 'db-indexes',
      name: 'Otimizar Índices do Banco',
      description: 'Analisa e otimiza índices das tabelas do banco de dados',
      category: 'database',
      status: 'pending',
      progress: 0,
      estimatedTime: '2-5 min',
      impact: 'high',
      autoRun: true
    },
    {
      id: 'image-compression',
      name: 'Comprimir Imagens',
      description: 'Comprime imagens não otimizadas mantendo qualidade',
      category: 'images',
      status: 'pending',
      progress: 0,
      estimatedTime: '5-10 min',
      impact: 'medium',
      autoRun: true
    },
    {
      id: 'cache-cleanup',
      name: 'Limpar Cache',
      description: 'Remove arquivos de cache desnecessários',
      category: 'cache',
      status: 'pending',
      progress: 0,
      estimatedTime: '1-2 min',
      impact: 'medium',
      autoRun: true
    },
    {
      id: 'bundle-analysis',
      name: 'Analisar Bundle',
      description: 'Identifica oportunidades de otimização do código',
      category: 'code',
      status: 'pending',
      progress: 0,
      estimatedTime: '3-5 min',
      impact: 'high',
      autoRun: false
    },
    {
      id: 'lazy-loading',
      name: 'Implementar Lazy Loading',
      description: 'Otimiza carregamento de imagens e componentes',
      category: 'images',
      status: 'pending',
      progress: 0,
      estimatedTime: '2-3 min',
      impact: 'medium',
      autoRun: true
    },
    {
      id: 'cdn-setup',
      name: 'Configurar CDN',
      description: 'Configura Content Delivery Network para assets',
      category: 'network',
      status: 'pending',
      progress: 0,
      estimatedTime: '10-15 min',
      impact: 'critical',
      autoRun: false
    },
    {
      id: 'database-vacuum',
      name: 'Limpeza do Banco',
      description: 'Remove dados desnecessários e otimiza tabelas',
      category: 'database',
      status: 'pending',
      progress: 0,
      estimatedTime: '5-8 min',
      impact: 'medium',
      autoRun: true
    },
    {
      id: 'minification',
      name: 'Minificar Assets',
      description: 'Minifica CSS, JS e HTML para reduzir tamanho',
      category: 'code',
      status: 'pending',
      progress: 0,
      estimatedTime: '2-4 min',
      impact: 'medium',
      autoRun: true
    }
  ];

  // Métricas de exemplo
  const sampleMetrics: PerformanceMetrics = {
    pageLoad: 2.3,
    apiResponse: 180,
    imageLoad: 1.8,
    databaseQuery: 45,
    cacheHitRate: 78.5,
    overallScore: 82
  };

  useEffect(() => {
    loadData();
    
    // Auto-otimização a cada 30 minutos
    if (autoOptimization) {
      const interval = setInterval(() => {
        runAutoOptimizations();
      }, 30 * 60 * 1000);
      
      return () => clearInterval(interval);
    }
  }, [autoOptimization]);

  const loadData = async () => {
    try {
      setLoading(true);
      // Simular carregamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      setTasks(initialTasks);
      setMetrics(sampleMetrics);
    } catch (error) {
      toast.error('Erro ao carregar dados de performance');
    } finally {
      setLoading(false);
    }
  };

  const runTask = async (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: 'running', progress: 0 }
        : task
    ));

    // Simular execução da tarefa
    for (let progress = 0; progress <= 100; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, progress }
          : task
      ));
    }

    // Marcar como concluída
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'completed', 
            progress: 100,
            lastRun: new Date(),
            result: 'Otimização concluída com sucesso'
          }
        : task
    ));

    toast.success(`Tarefa "${tasks.find(t => t.id === taskId)?.name}" concluída!`);
  };

  const runAllTasks = async () => {
    setLoading(true);
    
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    
    for (const task of pendingTasks) {
      await runTask(task.id);
    }
    
    setLoading(false);
    toast.success('Todas as otimizações foram concluídas!');
  };

  const runAutoOptimizations = async () => {
    const autoTasks = tasks.filter(task => task.autoRun && task.status === 'pending');
    
    for (const task of autoTasks) {
      await runTask(task.id);
    }
  };

  const resetTask = (taskId: string) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            status: 'pending', 
            progress: 0,
            lastRun: undefined,
            result: undefined
          }
        : task
    ));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'database': return <Database className="h-4 w-4" />;
      case 'images': return <Image className="h-4 w-4" />;
      case 'code': return <Code className="h-4 w-4" />;
      case 'network': return <Globe className="h-4 w-4" />;
      case 'cache': return <Zap className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'database': return 'bg-blue-100 text-blue-800';
      case 'images': return 'bg-green-100 text-green-800';
      case 'code': return 'bg-purple-100 text-purple-800';
      case 'network': return 'bg-orange-100 text-orange-800';
      case 'cache': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Play className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPerformanceScore = (score: number) => {
    if (score >= 90) return { color: 'text-green-600', label: 'Excelente' };
    if (score >= 80) return { color: 'text-blue-600', label: 'Bom' };
    if (score >= 70) return { color: 'text-yellow-600', label: 'Regular' };
    return { color: 'text-red-600', label: 'Ruim' };
  };

  if (loading && !tasks.length) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Zap className="h-6 w-6" />
            <span>Otimizador de Performance</span>
          </h2>
          <p className="text-muted-foreground">
            Otimize automaticamente a performance da aplicação
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={autoOptimization}
              onCheckedChange={setAutoOptimization}
            />
            <span className="text-sm">Auto-otimização</span>
          </div>
          <Button onClick={runAllTasks} disabled={loading}>
            <Zap className="h-4 w-4 mr-2" />
            Executar Todas
          </Button>
        </div>
      </div>

      {/* Métricas de Performance */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Score Geral</p>
                  <p className={`text-2xl font-bold ${getPerformanceScore(metrics.overallScore).color}`}>
                    {metrics.overallScore}/100
                  </p>
                </div>
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {getPerformanceScore(metrics.overallScore).label}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Carregamento</p>
                  <p className="text-2xl font-bold">{metrics.pageLoad}s</p>
                </div>
                <TrendingDown className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tempo de carregamento da página
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">API</p>
                  <p className="text-2xl font-bold">{metrics.apiResponse}ms</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Tempo de resposta da API
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cache Hit</p>
                  <p className="text-2xl font-bold">{metrics.cacheHitRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de acerto do cache
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tarefas de Otimização */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tarefas de Otimização</h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <CardTitle className="text-lg">{task.name}</CardTitle>
                      <CardDescription>{task.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge className={getCategoryColor(task.category)}>
                      {getCategoryIcon(task.category)}
                      <span className="ml-1 capitalize">{task.category}</span>
                    </Badge>
                    <Badge className={getImpactColor(task.impact)}>
                      {task.impact}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Tempo estimado: {task.estimatedTime}</span>
                  {task.lastRun && (
                    <span className="text-muted-foreground">
                      Última execução: {task.lastRun.toLocaleTimeString()}
                    </span>
                  )}
                </div>

                {task.status === 'running' && (
                  <div className="space-y-2">
                    <Progress value={task.progress} className="h-2" />
                    <p className="text-sm text-muted-foreground">
                      Progresso: {task.progress}%
                    </p>
                  </div>
                )}

                {task.result && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-800">{task.result}</p>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={task.autoRun}
                      onCheckedChange={(checked) => 
                        setTasks(prev => prev.map(t => 
                          t.id === task.id ? { ...t, autoRun: checked } : t
                        ))
                      }
                    />
                    <span className="text-sm">Auto-executar</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => resetTask(task.id)}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Refazer
                      </Button>
                    )}
                    
                    {task.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => runTask(task.id)}
                        disabled={loading}
                      >
                        <Play className="h-3 w-3 mr-1" />
                        Executar
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Informações Adicionais */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-medium text-blue-900">Sobre a Auto-otimização</h4>
              <p className="text-sm text-blue-700">
                Com a auto-otimização ativada, o sistema executará automaticamente tarefas 
                de otimização a cada 30 minutos, mantendo a performance sempre otimizada.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceOptimizer;
