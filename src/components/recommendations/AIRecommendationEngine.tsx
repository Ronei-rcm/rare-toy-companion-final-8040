import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Brain, 
  TrendingUp, 
  Users, 
  Target,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  Filter,
  Settings,
  Zap,
  RefreshCw,
  ChevronRight,
  Info,
  ThumbsUp,
  ThumbsDown,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { OptimizedImage } from '@/components/performance/OptimizedImage';
import { toast } from 'sonner';

interface AIRecommendationEngineProps {
  userId: string;
  currentProductId?: string;
  context?: 'product' | 'cart' | 'home' | 'category';
  maxRecommendations?: number;
  showSettings?: boolean;
  compact?: boolean;
}

export function AIRecommendationEngine({
  userId,
  currentProductId,
  context = 'product',
  maxRecommendations = 8,
  showSettings = true,
  compact = false
}: AIRecommendationEngineProps) {
  const [isExpanded, setIsExpanded] = useState(!compact);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.5]);
  const [userFeedback, setUserFeedback] = useState<Record<string, 'like' | 'dislike'>>({});

  const {
    recommendations,
    isLoading,
    generateRecommendations,
    trackUserInteraction,
    engineSettings,
    setEngineSettings
  } = useAIRecommendations();

  // Filtrar recomendações por tipo e confiança
  const filteredRecommendations = recommendations
    .filter(rec => selectedType === 'all' || rec.type === selectedType)
    .filter(rec => rec.confidence >= confidenceThreshold[0])
    .slice(0, maxRecommendations);

  // Gerar recomendações quando o componente monta ou muda contexto
  useEffect(() => {
    generateRecommendations(userId, {
      currentProductId,
      limit: maxRecommendations * 2
    });
  }, [userId, currentProductId, context, generateRecommendations, maxRecommendations]);

  const handleProductInteraction = async (productId: string, action: 'view' | 'click' | 'add_to_cart') => {
    await trackUserInteraction(userId, {
      type: action,
      productId,
      metadata: { context, timestamp: Date.now() }
    });

    if (action === 'click') {
      toast.success('Produto adicionado aos seus interesses!');
    }
  };

  const handleFeedback = async (productId: string, feedback: 'like' | 'dislike') => {
    setUserFeedback(prev => ({ ...prev, [productId]: feedback }));
    
    await trackUserInteraction(userId, {
      type: 'rating',
      productId,
      metadata: { rating: feedback === 'like' ? 5 : 1, source: 'feedback' }
    });

    toast.success(feedback === 'like' ? 'Obrigado pelo feedback positivo!' : 'Vamos melhorar nossas recomendações!');
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'collaborative': return <Users className="w-4 h-4" />;
      case 'content-based': return <Target className="w-4 h-4" />;
      case 'demographic': return <TrendingUp className="w-4 h-4" />;
      case 'trending': return <Zap className="w-4 h-4" />;
      case 'similar': return <Brain className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'collaborative': return 'bg-blue-100 text-blue-800';
      case 'content-based': return 'bg-green-100 text-green-800';
      case 'demographic': return 'bg-purple-100 text-purple-800';
      case 'trending': return 'bg-orange-100 text-orange-800';
      case 'similar': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getContextTitle = () => {
    switch (context) {
      case 'product': return 'Você também pode gostar';
      case 'cart': return 'Complete sua compra';
      case 'home': return 'Recomendados para você';
      case 'category': return 'Produtos similares';
      default: return 'Recomendações personalizadas';
    }
  };

  if (compact && !isExpanded) {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setIsExpanded(true)}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-full">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">IA Personalizada</h3>
              <p className="text-sm text-gray-600">
                {isLoading ? 'Analisando seus gostos...' : `${filteredRecommendations.length} produtos recomendados`}
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <TooltipProvider>
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {getContextTitle()}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Alimentado por inteligência artificial
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {showSettings && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAdvancedSettings(true)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configurar recomendações</p>
                  </TooltipContent>
                </Tooltip>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateRecommendations(userId, { currentProductId, limit: maxRecommendations * 2 })}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              
              {compact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                >
                  <Minimize2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Filtros rápidos */}
          <Tabs value={selectedType} onValueChange={setSelectedType} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="collaborative">Similar</TabsTrigger>
              <TabsTrigger value="content-based">Conteúdo</TabsTrigger>
              <TabsTrigger value="trending">Tendência</TabsTrigger>
              <TabsTrigger value="demographic">Popular</TabsTrigger>
              <TabsTrigger value="similar">Relacionado</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Analisando seus gostos e preferências...</p>
                <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grid de recomendações */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <AnimatePresence>
                  {filteredRecommendations.map((recommendation, index) => (
                    <motion.div
                      key={recommendation.product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative group"
                    >
                      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-0 bg-white/50 backdrop-blur-sm">
                        <div className="relative">
                          <OptimizedImage
                            src={recommendation.product.image || '/placeholder-product.jpg'}
                            alt={recommendation.product.name}
                            className="w-full h-48 object-cover"
                            width={200}
                            height={192}
                            loading="lazy"
                          />
                          
                          {/* Badge de tipo de recomendação */}
                          <Badge 
                            className={`absolute top-2 left-2 ${getRecommendationColor(recommendation.type)}`}
                          >
                            {getRecommendationIcon(recommendation.type)}
                            <span className="ml-1 capitalize">
                              {recommendation.type.replace('-', ' ')}
                            </span>
                          </Badge>

                          {/* Score de confiança */}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1">
                            <span className="text-xs font-medium text-gray-700">
                              {Math.round(recommendation.confidence * 100)}%
                            </span>
                          </div>

                          {/* Botões de feedback */}
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleFeedback(recommendation.product.id, 'like')}
                                  >
                                    <ThumbsUp className={`w-3 h-3 ${
                                      userFeedback[recommendation.product.id] === 'like' ? 'text-green-600' : 'text-gray-400'
                                    }`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Curtir recomendação</p>
                                </TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                    onClick={() => handleFeedback(recommendation.product.id, 'dislike')}
                                  >
                                    <ThumbsDown className={`w-3 h-3 ${
                                      userFeedback[recommendation.product.id] === 'dislike' ? 'text-red-600' : 'text-gray-400'
                                    }`} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Não gostar</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">
                                {recommendation.product.name}
                              </h3>
                              <p className="text-sm text-gray-600 line-clamp-2">
                                {recommendation.reason}
                              </p>
                            </div>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-bold text-gray-900">
                                  R$ {recommendation.product.price.toFixed(2).replace('.', ',')}
                                </span>
                                {recommendation.product.discount && (
                                  <Badge variant="destructive" className="text-xs">
                                    -{recommendation.product.discount}%
                                  </Badge>
                                )}
                              </div>
                              
                              {recommendation.product.rating && (
                                <div className="flex items-center gap-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className="text-sm font-medium">
                                    {recommendation.product.rating.toFixed(1)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                className="flex-1"
                                onClick={() => handleProductInteraction(recommendation.product.id, 'view')}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProductInteraction(recommendation.product.id, 'add_to_cart')}
                              >
                                <ShoppingCart className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleProductInteraction(recommendation.product.id, 'click')}
                              >
                                <Heart className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Mensagem quando não há recomendações */}
              {filteredRecommendations.length === 0 && (
                <div className="text-center py-12">
                  <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Nenhuma recomendação encontrada
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Tente ajustar os filtros ou nos ajude a conhecer melhor seus gostos navegando pelos produtos.
                  </p>
                  <Button onClick={() => setConfidenceThreshold([0.1])}>
                    Reduzir filtros
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>

        {/* Dialog de configurações avançadas */}
        <Dialog open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Configurações de Recomendação
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Algoritmos ativos */}
              <div className="space-y-4">
                <h3 className="font-semibold">Algoritmos de Recomendação</h3>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(engineSettings).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <label className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) => 
                          setEngineSettings(prev => ({ ...prev, [key]: checked }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Threshold de confiança */}
              <div className="space-y-4">
                <h3 className="font-semibold">Confiança Mínima</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Baixa ({Math.round(confidenceThreshold[0] * 100)}%)</span>
                    <span>Alta (100%)</span>
                  </div>
                  <Slider
                    value={confidenceThreshold}
                    onValueChange={setConfidenceThreshold}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Informações sobre algoritmos */}
              <div className="space-y-4">
                <h3 className="font-semibold">Sobre os Algoritmos</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">Colaborativo</span>
                    </div>
                    <p className="text-gray-600">
                      Recomenda produtos baseado em usuários com gostos similares aos seus.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Baseado em Conteúdo</span>
                    </div>
                    <p className="text-gray-600">
                      Analisa suas preferências e encontra produtos similares.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-purple-600" />
                      <span className="font-medium">Demográfico</span>
                    </div>
                    <p className="text-gray-600">
                      Considera seu perfil demográfico para recomendações.
                    </p>
                  </div>
                  
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span className="font-medium">Tendência</span>
                    </div>
                    <p className="text-gray-600">
                      Mostra produtos populares e em alta no momento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </Card>
    </TooltipProvider>
  );
}
