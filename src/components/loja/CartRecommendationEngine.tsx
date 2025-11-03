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
  Star, 
  Heart, 
  Zap, 
  Gift,
  Users,
  Clock,
  DollarSign,
  Package,
  Sparkles,
  ThumbsUp,
  Eye,
  ShoppingBag,
  ArrowRight,
  Filter,
  SortAsc,
  Grid3X3,
  List
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface Recommendation {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category: string;
  reason: string;
  confidence: number; // 0-100
  algorithm: 'collaborative' | 'content' | 'hybrid' | 'trending' | 'personal';
  tags: string[];
  urgency: 'low' | 'medium' | 'high';
  discount?: number;
  stock: number;
  rating: number;
  reviewCount: number;
  addedBy: number; // quantas pessoas adicionaram
  viewedBy: number; // quantas pessoas visualizaram
}

interface UserBehavior {
  browsingHistory: string[];
  purchaseHistory: string[];
  wishlist: string[];
  preferences: {
    categories: string[];
    priceRange: [number, number];
    brands: string[];
    features: string[];
  };
  demographics: {
    age: number;
    location: string;
    interests: string[];
  };
}

const CartRecommendationEngine: React.FC = () => {
  const { state } = useCart();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [filteredRecommendations, setFilteredRecommendations] = useState<Recommendation[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    algorithm: 'all' as 'all' | 'collaborative' | 'content' | 'hybrid' | 'trending' | 'personal',
    category: 'all',
    priceRange: [0, 1000] as [number, number],
    sortBy: 'confidence' as 'confidence' | 'price' | 'rating' | 'discount',
    viewMode: 'grid' as 'grid' | 'list'
  });

  // Simular dados do usuário baseado no carrinho atual
  useEffect(() => {
    const generateUserBehavior = () => {
      const cartCategories = state.itens.map(item => item.produto.categoria);
      const avgPrice = state.itens.length > 0 ? state.total / state.quantidadeTotal : 0;
      
      return {
        browsingHistory: state.itens.map(item => item.produto.id),
        purchaseHistory: state.itens.slice(0, 3).map(item => item.produto.id),
        wishlist: [],
        preferences: {
          categories: [...new Set(cartCategories)],
          priceRange: [avgPrice * 0.5, avgPrice * 2] as [number, number],
          brands: ['Mattel', 'Hasbro', 'LEGO', 'Nintendo'],
          features: ['Educativo', 'Interativo', 'Colecionável', 'Eletrônico']
        },
        demographics: {
          age: 25,
          location: 'São Paulo, SP',
          interests: ['Tecnologia', 'Jogos', 'Colecionáveis']
        }
      };
    };

    setUserBehavior(generateUserBehavior());
  }, [state.itens]);

  // Gerar recomendações baseadas no comportamento do usuário
  useEffect(() => {
    if (state.itens.length === 0) {
      setRecommendations([]);
      return;
    }

    generateRecommendations();
  }, [state.itens, userBehavior]);

  // Filtrar recomendações
  useEffect(() => {
    let filtered = [...recommendations];

    // Filtro por algoritmo
    if (filters.algorithm !== 'all') {
      filtered = filtered.filter(rec => rec.algorithm === filters.algorithm);
    }

    // Filtro por categoria
    if (filters.category !== 'all') {
      filtered = filtered.filter(rec => rec.category === filters.category);
    }

    // Filtro por faixa de preço
    filtered = filtered.filter(rec => 
      rec.price >= filters.priceRange[0] && rec.price <= filters.priceRange[1]
    );

    // Ordenação
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'price':
          return a.price - b.price;
        case 'rating':
          return b.rating - a.rating;
        case 'discount':
          return (b.discount || 0) - (a.discount || 0);
        default:
          return 0;
      }
    });

    setFilteredRecommendations(filtered);
  }, [recommendations, filters]);

  const generateRecommendations = async () => {
    setLoading(true);

    // Simular processamento de IA
    await new Promise(resolve => setTimeout(resolve, 1000));

    const sampleRecommendations: Recommendation[] = [
      {
        id: 'rec-1',
        productId: 'prod-101',
        name: 'Action Figure Batman Premium',
        price: 89.90,
        originalPrice: 129.90,
        imageUrl: '/placeholder-batman.jpg',
        category: 'Action Figures',
        reason: 'Outros compradores que compraram produtos similares também compraram este',
        confidence: 92,
        algorithm: 'collaborative',
        tags: ['Super-herói', 'Colecionável', 'Premium'],
        urgency: 'high',
        discount: 31,
        stock: 5,
        rating: 4.8,
        reviewCount: 156,
        addedBy: 342,
        viewedBy: 1205
      },
      {
        id: 'rec-2',
        productId: 'prod-102',
        name: 'LEGO Creator Set Casa',
        price: 149.90,
        imageUrl: '/placeholder-lego.jpg',
        category: 'Construção',
        reason: 'Baseado no seu interesse em produtos educativos',
        confidence: 85,
        algorithm: 'content',
        tags: ['Educativo', 'Criativo', 'Montagem'],
        urgency: 'medium',
        stock: 12,
        rating: 4.9,
        reviewCount: 89,
        addedBy: 234,
        viewedBy: 856
      },
      {
        id: 'rec-3',
        productId: 'prod-103',
        name: 'Nintendo Switch Mario Kart',
        price: 299.90,
        originalPrice: 349.90,
        imageUrl: '/placeholder-mario.jpg',
        category: 'Eletrônicos',
        reason: 'Tendência alta na sua região',
        confidence: 78,
        algorithm: 'trending',
        tags: ['Eletrônico', 'Jogo', 'Nintendo'],
        urgency: 'high',
        discount: 14,
        stock: 3,
        rating: 4.7,
        reviewCount: 423,
        addedBy: 567,
        viewedBy: 2103
      },
      {
        id: 'rec-4',
        productId: 'prod-104',
        name: 'Barbie Dreamhouse',
        price: 199.90,
        imageUrl: '/placeholder-barbie.jpg',
        category: 'Bonecas',
        reason: 'Combinando com seu perfil demográfico',
        confidence: 71,
        algorithm: 'personal',
        tags: ['Boneca', 'Casa', 'Acessórios'],
        urgency: 'low',
        stock: 8,
        rating: 4.6,
        reviewCount: 234,
        addedBy: 189,
        viewedBy: 678
      },
      {
        id: 'rec-5',
        productId: 'prod-105',
        name: 'Robô Programável',
        price: 179.90,
        imageUrl: '/placeholder-robot.jpg',
        category: 'Educativo',
        reason: 'Algoritmo híbrido: conteúdo + colaborativo',
        confidence: 88,
        algorithm: 'hybrid',
        tags: ['Educativo', 'Programação', 'Robótica'],
        urgency: 'medium',
        stock: 6,
        rating: 4.8,
        reviewCount: 167,
        addedBy: 298,
        viewedBy: 945
      }
    ];

    setRecommendations(sampleRecommendations);
    setLoading(false);
  };

  const handleAddToCart = (recommendation: Recommendation) => {
    toast.success(`🎯 ${recommendation.name} adicionado ao carrinho!`, {
      description: `Recomendado por: ${recommendation.reason}`
    });
  };

  const handleLike = (recommendation: Recommendation) => {
    toast.success('❤️ Produto adicionado aos favoritos!');
  };

  const getAlgorithmIcon = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative': return <Users className="h-4 w-4" />;
      case 'content': return <Brain className="h-4 w-4" />;
      case 'hybrid': return <Zap className="h-4 w-4" />;
      case 'trending': return <TrendingUp className="h-4 w-4" />;
      case 'personal': return <Target className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const getAlgorithmColor = (algorithm: string) => {
    switch (algorithm) {
      case 'collaborative': return 'bg-blue-100 text-blue-800';
      case 'content': return 'bg-purple-100 text-purple-800';
      case 'hybrid': return 'bg-green-100 text-green-800';
      case 'trending': return 'bg-orange-100 text-orange-800';
      case 'personal': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
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
            Motor de Recomendações
          </h3>
          <p className="text-purple-700">
            Adicione produtos ao carrinho para receber recomendações personalizadas!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header do Motor */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-6 w-6" />
              <div>
                <CardTitle className="text-white">Motor de Recomendações</CardTitle>
                <p className="text-purple-100 text-sm">
                  IA analisando seu comportamento para sugerir produtos perfeitos
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{recommendations.length}</p>
              <p className="text-purple-100 text-sm">recomendações</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filtros e Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros e Ordenação</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Algoritmo</label>
              <select
                value={filters.algorithm}
                onChange={(e) => setFilters(prev => ({ ...prev, algorithm: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todos</option>
                <option value="collaborative">Colaborativo</option>
                <option value="content">Conteúdo</option>
                <option value="hybrid">Híbrido</option>
                <option value="trending">Tendências</option>
                <option value="personal">Pessoal</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">Todas</option>
                <option value="Action Figures">Action Figures</option>
                <option value="Construção">Construção</option>
                <option value="Eletrônicos">Eletrônicos</option>
                <option value="Bonecas">Bonecas</option>
                <option value="Educativo">Educativo</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Ordenar por</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="confidence">Confiança</option>
                <option value="price">Preço</option>
                <option value="rating">Avaliação</option>
                <option value="discount">Desconto</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Visualização</label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={filters.viewMode === 'grid' ? 'default' : 'outline'}
                  onClick={() => setFilters(prev => ({ ...prev, viewMode: 'grid' }))}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={filters.viewMode === 'list' ? 'default' : 'outline'}
                  onClick={() => setFilters(prev => ({ ...prev, viewMode: 'list' }))}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas das Recomendações */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Brain className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{recommendations.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {recommendations.reduce((acc, rec) => acc + rec.confidence, 0) / recommendations.length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Confiança Média</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {(recommendations.reduce((acc, rec) => acc + rec.price, 0) / recommendations.length || 0).toFixed(0)}
                </p>
                <p className="text-sm text-muted-foreground">Preço Médio</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {(recommendations.reduce((acc, rec) => acc + rec.rating, 0) / recommendations.length || 0).toFixed(1)}
                </p>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Recomendações */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            <span>Recomendações Personalizadas</span>
          </h3>
          {loading && (
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <div className="animate-spin h-4 w-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
              <span>Analisando...</span>
            </div>
          )}
        </div>

        {filters.viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRecommendations.map((rec) => (
              <Card key={rec.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Imagem do produto */}
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={rec.imageUrl}
                        alt={rec.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Informações do produto */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2 flex-1">
                          {rec.name}
                        </h4>
                        <Badge className={`ml-2 ${getAlgorithmColor(rec.algorithm)}`}>
                          {getAlgorithmIcon(rec.algorithm)}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold">
                          R$ {rec.price.toFixed(2)}
                        </span>
                        {rec.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            R$ {rec.originalPrice.toFixed(2)}
                          </span>
                        )}
                        {rec.discount && (
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            -{rec.discount}%
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm ml-1">{rec.rating}</span>
                          <span className="text-xs text-muted-foreground ml-1">
                            ({rec.reviewCount})
                          </span>
                        </div>
                      </div>

                      {/* Barra de confiança */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Confiança da IA</span>
                          <span>{rec.confidence}%</span>
                        </div>
                        <Progress value={rec.confidence} className="h-1.5" />
                      </div>

                      {/* Razão da recomendação */}
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {rec.reason}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {rec.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      {/* Ações */}
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleAddToCart(rec)}
                        >
                          <ShoppingBag className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleLike(rec)}
                        >
                          <Heart className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Informações adicionais */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>{rec.viewedBy} visualizações</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Package className="h-3 w-3" />
                          <span>{rec.stock} em estoque</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRecommendations.map((rec) => (
              <Card key={rec.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      <img
                        src={rec.imageUrl}
                        alt={rec.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{rec.name}</h4>
                          <p className="text-sm text-muted-foreground">{rec.category}</p>
                        </div>
                        <Badge className={`${getAlgorithmColor(rec.algorithm)}`}>
                          {getAlgorithmIcon(rec.algorithm)}
                        </Badge>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-bold">
                            R$ {rec.price.toFixed(2)}
                          </span>
                          {rec.discount && (
                            <Badge className="bg-red-100 text-red-800 text-xs">
                              -{rec.discount}%
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{rec.rating}</span>
                          <span className="text-xs text-muted-foreground">
                            ({rec.reviewCount})
                          </span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <span className="text-sm text-muted-foreground">Confiança:</span>
                          <span className="font-medium">{rec.confidence}%</span>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground">{rec.reason}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          {rec.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddToCart(rec)}
                          >
                            <ShoppingBag className="h-4 w-4 mr-1" />
                            Adicionar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleLike(rec)}
                          >
                            <Heart className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Informações sobre os algoritmos */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Como funcionam as recomendações?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-blue-600 mb-2" />
              <h4 className="font-medium text-sm">Colaborativo</h4>
              <p className="text-xs text-muted-foreground">Baseado em outros usuários</p>
            </div>
            <div className="text-center">
              <Brain className="h-8 w-8 mx-auto text-purple-600 mb-2" />
              <h4 className="font-medium text-sm">Conteúdo</h4>
              <p className="text-xs text-muted-foreground">Baseado no produto</p>
            </div>
            <div className="text-center">
              <Zap className="h-8 w-8 mx-auto text-green-600 mb-2" />
              <h4 className="font-medium text-sm">Híbrido</h4>
              <p className="text-xs text-muted-foreground">Combinação de métodos</p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto text-orange-600 mb-2" />
              <h4 className="font-medium text-sm">Tendências</h4>
              <p className="text-xs text-muted-foreground">Produtos populares</p>
            </div>
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto text-pink-600 mb-2" />
              <h4 className="font-medium text-sm">Pessoal</h4>
              <p className="text-xs text-muted-foreground">Baseado no seu perfil</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CartRecommendationEngine;
