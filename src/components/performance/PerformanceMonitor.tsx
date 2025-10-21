import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Gauge,
  Timer,
  HardDrive,
  Wifi,
  Cpu,
  MemoryStick,
  BarChart3,
  Settings,
  RefreshCw,
  Download,
  Upload,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useWebVitals } from '@/hooks/useWebVitals';
import { toast } from 'sonner';

interface PerformanceData {
  timestamp: number;
  metrics: any;
  userAgent: string;
  url: string;
}

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceData[]>([]);
  const [showDetails, setShowDetails] = useState(false);
  const [autoOptimize, setAutoOptimize] = useState(true);
  
  const {
    metrics,
    isSupported,
    getLCPScore,
    getFIDScore,
    getCLSScore,
    getFCPScore,
    getTTFBScore,
    getINPScore,
    getOverallScore,
    sendToAnalytics
  } = useWebVitals();

  const overallScore = getOverallScore();

  useEffect(() => {
    if (isMonitoring && Object.values(metrics).some(value => value !== null)) {
      const newData: PerformanceData = {
        timestamp: Date.now(),
        metrics: { ...metrics },
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      
      setPerformanceHistory(prev => [newData, ...prev.slice(0, 49)]); // Manter últimos 50 registros
      
      // Auto-otimização baseada em thresholds
      if (autoOptimize) {
        if (overallScore.rating === 'poor' && overallScore.score < 30) {
          toast.warning('Performance crítica detectada! Iniciando otimizações...');
          runAutoOptimizations();
        }
      }
    }
  }, [metrics, isMonitoring, autoOptimize, overallScore]);

  const runAutoOptimizations = async () => {
    const optimizations = [
      { name: 'Limpeza de cache', action: () => clearBrowserCache() },
      { name: 'Otimização de imagens', action: () => optimizeImages() },
      { name: 'Lazy loading', action: () => enableLazyLoading() },
      { name: 'Code splitting', action: () => enableCodeSplitting() }
    ];

    for (const optimization of optimizations) {
      try {
        await optimization.action();
        toast.success(`✅ ${optimization.name} concluída`);
      } catch (error) {
        toast.error(`❌ Erro em ${optimization.name}`);
      }
    }
  };

  const clearBrowserCache = async () => {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
  };

  const optimizeImages = () => {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const dataSrc = img.getAttribute('data-src');
      if (dataSrc && !img.src) {
        img.src = dataSrc;
        img.removeAttribute('data-src');
      }
    });
  };

  const enableLazyLoading = () => {
    const images = document.querySelectorAll('img:not([loading])');
    images.forEach(img => img.setAttribute('loading', 'lazy'));
  };

  const enableCodeSplitting = () => {
    // Implementar code splitting dinâmico
    const scripts = document.querySelectorAll('script[data-defer]');
    scripts.forEach(script => script.removeAttribute('data-defer'));
  };

  const formatMetricValue = (value: number | null, unit: string = 'ms') => {
    if (value === null) return 'N/A';
    return `${value.toFixed(2)} ${unit}`;
  };

  const getScoreColor = (rating: string) => {
    switch (rating) {
      case 'good': return 'text-green-600';
      case 'needs-improvement': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getScoreIcon = (rating: string) => {
    switch (rating) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'needs-improvement': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'poor': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (!isSupported) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Card className="w-80 bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Performance Monitor não suportado neste navegador
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.div
        className="fixed bottom-4 right-4 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <Button
          onClick={() => setIsVisible(!isVisible)}
          className={`rounded-full w-14 h-14 shadow-lg ${
            overallScore.rating === 'good' 
              ? 'bg-green-600 hover:bg-green-700' 
              : overallScore.rating === 'needs-improvement'
              ? 'bg-yellow-600 hover:bg-yellow-700'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isVisible ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
        </Button>
      </motion.div>

      {/* Performance Monitor Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-20 right-4 z-50 w-96 max-h-[80vh] overflow-hidden"
          >
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="w-5 h-5" />
                    Performance Monitor
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={isMonitoring}
                      onCheckedChange={setIsMonitoring}
                      className="scale-75"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetails(!showDetails)}
                    >
                      {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                
                {/* Overall Score */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getScoreIcon(overallScore.rating)}
                    <span className={`font-semibold ${getScoreColor(overallScore.rating)}`}>
                      {overallScore.score.toFixed(0)}/100
                    </span>
                  </div>
                  <Progress 
                    value={overallScore.score} 
                    className="flex-1 h-2"
                  />
                  <Badge variant={overallScore.rating === 'good' ? 'default' : 'destructive'}>
                    {overallScore.rating}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Tabs defaultValue="core-vitals" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="core-vitals">Core Vitals</TabsTrigger>
                    <TabsTrigger value="metrics">Métricas</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                  </TabsList>

                  <TabsContent value="core-vitals" className="space-y-3">
                    {/* LCP */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Timer className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">LCP</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMetricValue(metrics.LCP)}</div>
                        <div className={`text-xs ${getScoreColor(getLCPScore(metrics.LCP || 0).rating)}`}>
                          {getLCPScore(metrics.LCP || 0).rating}
                        </div>
                      </div>
                    </div>

                    {/* FID */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-green-600" />
                        <span className="font-medium">FID</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMetricValue(metrics.FID)}</div>
                        <div className={`text-xs ${getScoreColor(getFIDScore(metrics.FID || 0).rating)}`}>
                          {getFIDScore(metrics.FID || 0).rating}
                        </div>
                      </div>
                    </div>

                    {/* CLS */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">CLS</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMetricValue(metrics.CLS, '')}</div>
                        <div className={`text-xs ${getScoreColor(getCLSScore(metrics.CLS || 0).rating)}`}>
                          {getCLSScore(metrics.CLS || 0).rating}
                        </div>
                      </div>
                    </div>

                    {/* INP */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">INP</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{formatMetricValue(metrics.INP)}</div>
                        <div className={`text-xs ${getScoreColor(getINPScore(metrics.INP || 0).rating)}`}>
                          {getINPScore(metrics.INP || 0).rating}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="metrics" className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <HardDrive className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium">FCP</span>
                        </div>
                        <div className="font-semibold">{formatMetricValue(metrics.FCP)}</div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Wifi className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium">TTFB</span>
                        </div>
                        <div className="font-semibold">{formatMetricValue(metrics.TTFB)}</div>
                      </div>
                    </div>

                    {showDetails && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Auto-otimização:</span>
                          <Switch
                            checked={autoOptimize}
                            onCheckedChange={setAutoOptimize}
                            className="scale-75"
                          />
                        </div>
                        <Button
                          onClick={runAutoOptimizations}
                          className="w-full"
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Otimizar Agora
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="history" className="space-y-3">
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {performanceHistory.length === 0 ? (
                        <div className="text-center text-gray-500 py-4">
                          Nenhum dado coletado ainda
                        </div>
                      ) : (
                        performanceHistory.slice(0, 10).map((data, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded text-xs">
                            <div className="flex justify-between">
                              <span>{new Date(data.timestamp).toLocaleTimeString()}</span>
                              <span className="font-medium">
                                Score: {getOverallScore().score.toFixed(0)}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <Button
                      onClick={() => sendToAnalytics()}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar Dados
                    </Button>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
