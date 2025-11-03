import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Sparkles, 
  TrendingUp, 
  Users, 
  Package, 
  Star,
  ShoppingCart,
  Heart,
  Eye,
  ChevronRight,
  RefreshCw,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MobileProductCard from '@/components/mobile/MobileProductCard';
import { useAuth } from '@/hooks/useAuth';

interface Recommendation {
  id: string;
  nome: string;
  preco: number;
  preco_original?: number;
  imagem: string;
  categoria: string;
  marca: string;
  avaliacao: number;
  total_avaliacoes: number;
  estoque: number;
  score?: number;
  source?: string;
  confidence?: number;
}

interface RecommendationEngineProps {
  userId?: string;
  limit?: number;
  showAlgorithmInfo?: boolean;
  onProductClick?: (product: Recommendation) => void;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  userId,
  limit = 12,
  showAlgorithmInfo = true,
  onProductClick,
  onAddToCart,
  onToggleFavorite
}) => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState('smart');
  const [algorithmStats, setAlgorithmStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();

  const algorithms = [
    { id: 'smart', name: 'Inteligente', description: 'Escolhe o melhor algoritmo automaticamente', icon: Brain },
    { id: 'hybrid', name: 'Híbrido', description: 'Combina colaborativo + conteúdo', icon: Sparkles },
    { id: 'collaborative', name: 'Colaborativo', description: 'Baseado em usuários similares', icon: Users },
    { id: 'content-based', name: 'Conteúdo', description: 'Baseado em produtos similares', icon: Package },
    { id: 'popular', name: 'Popular', description: 'Produtos mais vendidos', icon: TrendingUp }
  ];

  useEffect(() => {
    loadRecommendations();
  }, [selectedAlgorithm, userId, limit]);

  const loadRecommendations = async () => {
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      
      switch (selectedAlgorithm) {
        case 'smart':
          endpoint = `/api/ml/recommendations/smart/${userId || 'anonymous'}`;
          break;
        case 'hybrid':
          endpoint = `/api/ml/recommendations/hybrid/${userId || 'anonymous'}`;
          break;
        case 'collaborative':
          endpoint = `/api/ml/recommendations/collaborative/${userId || 'anonymous'}`;
          break;
        case 'content-based':
          endpoint = `/api/ml/recommendations/content-based/${userId || 'anonymous'}`;
          break;
        case 'popular':
          endpoint = `/api/ml/recommendations/popular`;
          break;
        default:
          endpoint = `/api/ml/recommendations/smart/${userId || 'anonymous'}`;
      }

      const response = await fetch(`${endpoint}?limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setRecommendations(data.data || []);
        if (data.algorithm) {
          setAlgorithmStats({
            algorithm: data.algorithm,
            confidence: data.data?.[0]?.confidence || 0.8
          });
        }
      } else {
        setError(data.error || 'Erro ao carregar recomendações');
      }
    } catch (error) {
      console.error('Erro ao carregar recomendações:', error);
      setError('Erro de conexão');
    } finally {
      setLoading(false);
    }
  };

  const handleAlgorithmChange = (algorithm: string) => {
    setSelectedAlgorithm(algorithm);
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  const getAlgorithmIcon = (algorithmId: string) => {
    const algorithm = algorithms.find(a => a.id === algorithmId);
    return algorithm ? algorithm.icon : Brain;
  };

  const getAlgorithmName = (algorithmId: string) => {
    const algorithm = algorithms.find(a => a.id === algorithmId);
    return algorithm ? algorithm.name : 'Desconhecido';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-100';
    if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
            <Button onClick={handleRefresh} variant="outline">
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
      {/* Header com Algoritmos */}
      {showAlgorithmInfo && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Recomendações Inteligentes</CardTitle>
                  <p className="text-sm text-gray-600">
                    {algorithmStats ? `${getAlgorithmName(algorithmStats.algorithm)} • ` : ''}
                    {recommendations.length} produtos encontrados
                  </p>
                </div>
              </div>
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedAlgorithm} onValueChange={handleAlgorithmChange}>
              <TabsList className="grid w-full grid-cols-5">
                {algorithms.map((algorithm) => {
                  const Icon = algorithm.icon;
                  return (
                    <TabsTrigger key={algorithm.id} value={algorithm.id} className="flex flex-col gap-1 p-2">
                      <Icon className="w-4 h-4" />
                      <span className="text-xs">{algorithm.name}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              
              <TabsContent value={selectedAlgorithm} className="mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Target className="w-4 h-4" />
                  <span>{algorithms.find(a => a.id === selectedAlgorithm)?.description}</span>
                  {algorithmStats && (
                    <Badge className={getConfidenceColor(algorithmStats.confidence)}>
                      {Math.round(algorithmStats.confidence * 100)}% confiança
                    </Badge>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Lista de Recomendações */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {recommendations.map((product, index) => (
            <div key={product.id} className="relative">
              {/* Badge de Posição */}
              <div className="absolute top-2 left-2 z-10">
                <Badge className="bg-blue-600 text-white text-xs">
                  #{index + 1}
                </Badge>
              </div>

              {/* Badge de Algoritmo */}
              {product.source && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="outline" className="text-xs">
                    {getAlgorithmName(product.source)}
                  </Badge>
                </div>
              )}

              {/* Badge de Score */}
              {product.score && (
                <div className="absolute bottom-2 left-2 z-10">
                  <Badge className="bg-purple-600 text-white text-xs">
                    Score: {Math.round(product.score * 100) / 100}
                  </Badge>
                </div>
              )}

              <MobileProductCard
                product={{
                  id: product.id,
                  nome: product.nome,
                  preco: product.preco,
                  preco_original: product.preco_original,
                  imagem: product.imagem,
                  categoria: product.categoria,
                  marca: product.marca,
                  avaliacao: product.avaliacao,
                  total_avaliacoes: product.total_avaliacoes,
                  estoque: product.estoque,
                  is_favorito: false,
                  is_oferta: product.preco_original && product.preco < product.preco_original,
                  desconto_percentual: product.preco_original ? 
                    Math.round(((product.preco_original - product.preco) / product.preco_original) * 100) : 0,
                  frete_gratis: product.preco >= 100,
                  entrega_rapida: product.estoque > 10,
                  garantia: '30 dias'
                }}
                variant="default"
                onViewDetails={onProductClick}
                onToggleFavorite={onToggleFavorite}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-gray-400 mb-4">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma recomendação encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              Tente mudar o algoritmo ou aguarde mais dados de interação
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      {algorithmStats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-gray-600" />
                <span className="text-gray-600">Algoritmo ativo:</span>
                <Badge variant="outline">
                  {getAlgorithmName(algorithmStats.algorithm)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Confiança:</span>
                <Badge className={getConfidenceColor(algorithmStats.confidence)}>
                  {Math.round(algorithmStats.confidence * 100)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RecommendationEngine;
