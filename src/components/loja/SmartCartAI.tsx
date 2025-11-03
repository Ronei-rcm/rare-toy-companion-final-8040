import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  Zap, 
  Gift,
  Star,
  AlertTriangle,
  CheckCircle,
  ShoppingBag,
  DollarSign,
  Clock,
  Heart,
  Share2,
  Download
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface AIInsight {
  id: string;
  type: 'savings' | 'recommendation' | 'alert' | 'tip' | 'trend';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action?: string;
  icon: React.ReactNode;
  color: string;
  impact: number; // 1-10
}

interface SmartRecommendation {
  id: string;
  productId: string;
  reason: string;
  confidence: number; // 0-100
  discount?: number;
  urgency?: 'low' | 'medium' | 'high';
}

const SmartCartAI: React.FC = () => {
  const { state } = useCart();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [userPreferences, setUserPreferences] = useState({
    budgetConscious: true,
    qualityFocused: false,
    dealHunter: true,
    quickBuyer: false
  });

  // Simular análise de IA em tempo real
  useEffect(() => {
    if (state.itens.length === 0) {
      setInsights([]);
      setRecommendations([]);
      return;
    }

    analyzeCartWithAI();
  }, [state.itens, state.total, userPreferences]);

  const analyzeCartWithAI = async () => {
    setAiLoading(true);
    
    // Simular processamento de IA
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newInsights = generateAIInsights();
    const newRecommendations = generateRecommendations();
    
    setInsights(newInsights);
    setRecommendations(newRecommendations);
    setAiLoading(false);
  };

  const generateAIInsights = (): AIInsight[] => {
    const insights: AIInsight[] = [];
    const total = state.total;
    const itemCount = state.quantidadeTotal;
    const avgPrice = total / itemCount;

    // Insight de economia com PIX
    if (total > 50) {
      insights.push({
        id: 'pix-savings',
        type: 'savings',
        priority: 'high',
        title: '💰 Economize com PIX',
        description: `Pague com PIX e economize R$ ${(total * 0.05).toFixed(2)} (5% de desconto)`,
        action: 'Trocar para PIX',
        icon: <Zap className="h-4 w-4" />,
        color: 'bg-green-100 text-green-800 border-green-200',
        impact: 8
      });
    }

    // Insight de frete grátis
    const freeShippingThreshold = 200;
    if (total < freeShippingThreshold) {
      const remaining = freeShippingThreshold - total;
      insights.push({
        id: 'free-shipping',
        type: 'tip',
        priority: 'high',
        title: '🚚 Frete Grátis',
        description: `Adicione mais R$ ${remaining.toFixed(2)} e ganhe frete grátis!`,
        action: 'Ver produtos',
        icon: <Gift className="h-4 w-4" />,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        impact: 9
      });
    }

    // Insight de produto mais caro
    const mostExpensive = state.itens.reduce((max, item) => 
      (item.produto.preco * item.quantidade) > (max.produto.preco * max.quantidade) ? item : max
    );
    
    if (mostExpensive && (mostExpensive.produto.preco * mostExpensive.quantidade) > (total * 0.4)) {
      insights.push({
        id: 'expensive-item',
        type: 'alert',
        priority: 'medium',
        title: '⚠️ Item Dominante',
        description: `${mostExpensive.produto.nome} representa ${((mostExpensive.produto.preco * mostExpensive.quantidade / total) * 100).toFixed(0)}% do seu carrinho`,
        icon: <AlertTriangle className="h-4 w-4" />,
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        impact: 6
      });
    }

    // Insight de tendência de compra
    if (avgPrice > 100) {
      insights.push({
        id: 'premium-cart',
        type: 'trend',
        priority: 'low',
        title: '⭐ Carrinho Premium',
        description: 'Você está comprando produtos de alta qualidade!',
        icon: <Star className="h-4 w-4" />,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        impact: 5
      });
    }

    // Insight de economia de tempo
    if (userPreferences.quickBuyer && itemCount > 3) {
      insights.push({
        id: 'quick-checkout',
        type: 'tip',
        priority: 'medium',
        title: '⚡ Checkout Rápido',
        description: 'Use o checkout expresso para finalizar em 30 segundos',
        action: 'Checkout Expresso',
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        impact: 7
      });
    }

    return insights.sort((a, b) => b.impact - a.impact);
  };

  const generateRecommendations = (): SmartRecommendation[] => {
    const recommendations: SmartRecommendation[] = [];
    
    // Simular recomendações baseadas no carrinho atual
    const cartCategories = state.itens.map(item => item.produto.categoria);
    const mostCommonCategory = cartCategories.sort((a,b) =>
      cartCategories.filter(v => v === a).length - cartCategories.filter(v => v === b).length
    ).pop();

    if (mostCommonCategory) {
      recommendations.push({
        id: 'category-match',
        productId: 'rec-1',
        reason: `Outros produtos de ${mostCommonCategory} que você pode gostar`,
        confidence: 85,
        urgency: 'medium'
      });
    }

    // Recomendação de complemento
    if (state.itens.some(item => item.produto.categoria.toLowerCase().includes('boneco'))) {
      recommendations.push({
        id: 'accessory-match',
        productId: 'rec-2',
        reason: 'Acessórios que combinam com seus brinquedos',
        confidence: 78,
        discount: 15,
        urgency: 'low'
      });
    }

    return recommendations;
  };

  const handleInsightAction = (insight: AIInsight) => {
    switch (insight.id) {
      case 'pix-savings':
        toast.success('💳 Alterando método de pagamento para PIX...');
        break;
      case 'free-shipping':
        toast.info('🛍️ Redirecionando para produtos...');
        break;
      case 'quick-checkout':
        toast.success('⚡ Iniciando checkout expresso...');
        break;
      default:
        toast.info('🤖 Ação executada pela IA!');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (state.itens.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="p-6 text-center">
          <Brain className="h-12 w-12 mx-auto text-purple-500 mb-4" />
          <h3 className="text-lg font-semibold text-purple-900 mb-2">
            IA do Carrinho Aguardando
          </h3>
          <p className="text-purple-700">
            Adicione produtos para ativar a inteligência artificial e receber insights personalizados!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header da IA */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Carrinho Inteligente</CardTitle>
                <p className="text-purple-100 text-sm">
                  IA analisando seu carrinho em tempo real
                </p>
              </div>
            </div>
            {aiLoading && (
              <div className="animate-spin">
                <Brain className="h-5 w-5" />
              </div>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Insights da IA */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Insights Inteligentes</span>
        </h3>
        
        {insights.map((insight) => (
          <Card key={insight.id} className={`${insight.color} border-2`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  {insight.icon}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold">{insight.title}</h4>
                      <Badge className={getPriorityColor(insight.priority)}>
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-sm mb-2">{insight.description}</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={insight.impact * 10} className="h-2 w-20" />
                      <span className="text-xs text-muted-foreground">
                        Impacto: {insight.impact}/10
                      </span>
                    </div>
                  </div>
                </div>
                
                {insight.action && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleInsightAction(insight)}
                  >
                    {insight.action}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recomendações Inteligentes */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Target className="h-5 w-5 text-blue-500" />
            <span>Recomendações Personalizadas</span>
          </h3>
          
          {recommendations.map((rec) => (
            <Card key={rec.id} className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-blue-900">{rec.reason}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {rec.confidence}% confiança
                        </Badge>
                        {rec.discount && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            -{rec.discount}% OFF
                          </Badge>
                        )}
                        <span className={`text-xs ${getUrgencyColor(rec.urgency || 'low')}`}>
                          {rec.urgency} urgência
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <Button size="sm" variant="outline">
                    Ver Produtos
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Ações Rápidas da IA */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-3 flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-600" />
            <span>Ações Inteligentes</span>
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" className="h-auto p-3">
              <Heart className="h-4 w-4 mr-1" />
              <span className="text-xs">Salvar Lista</span>
            </Button>
            
            <Button variant="outline" size="sm" className="h-auto p-3">
              <Share2 className="h-4 w-4 mr-1" />
              <span className="text-xs">Compartilhar</span>
            </Button>
            
            <Button variant="outline" size="sm" className="h-auto p-3">
              <Download className="h-4 w-4 mr-1" />
              <span className="text-xs">Exportar</span>
            </Button>
            
            <Button variant="outline" size="sm" className="h-auto p-3">
              <Brain className="h-4 w-4 mr-1" />
              <span className="text-xs">Mais IA</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmartCartAI;
