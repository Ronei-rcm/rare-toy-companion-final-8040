import { useState, useEffect, useCallback, useMemo } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  tags: string[];
  description: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  discount?: number;
  brand?: string;
}

interface UserProfile {
  userId: string;
  preferences: string[];
  purchaseHistory: Array<{
    productId: string;
    timestamp: number;
    rating?: number;
  }>;
  browsingHistory: Array<{
    productId: string;
    timestamp: number;
    duration: number;
  }>;
  cartItems: string[];
  wishlistItems: string[];
  demographics?: {
    age?: number;
    gender?: string;
    location?: string;
  };
}

interface Recommendation {
  product: Product;
  score: number;
  reason: string;
  confidence: number;
  type: 'collaborative' | 'content-based' | 'demographic' | 'trending' | 'similar';
}

interface RecommendationEngine {
  collaborative: boolean;
  contentBased: boolean;
  demographic: boolean;
  trending: boolean;
  similar: boolean;
}

export function useAIRecommendations() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [engineSettings, setEngineSettings] = useState<RecommendationEngine>({
    collaborative: true,
    contentBased: true,
    demographic: true,
    trending: true,
    similar: true
  });

  // Carregar perfil do usuário
  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/recommendations/user-profile/${userId}`);
      const profile = await response.json();
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      return null;
    }
  }, []);

  // Carregar produtos
  const loadProducts = useCallback(async () => {
    try {
      const response = await fetch('/api/products');
      const products = await response.json();
      setAllProducts(products);
      return products;
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      return [];
    }
  }, []);

  // Filtro colaborativo (usuários com comportamento similar)
  const collaborativeFiltering = useCallback((userId: string, products: Product[]): Recommendation[] => {
    if (!userProfile) return [];

    // Simular busca por usuários similares
    const similarUsers = findSimilarUsers(userProfile);
    
    // Produtos recomendados por usuários similares
    const recommendedProducts = similarUsers.flatMap(user => 
      user.purchaseHistory.map(purchase => purchase.productId)
    );

    // Contar frequência de produtos
    const productFrequency = recommendedProducts.reduce((acc, productId) => {
      acc[productId] = (acc[productId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(productFrequency)
      .map(([productId, frequency]) => {
        const product = products.find(p => p.id === productId);
        if (!product || userProfile.purchaseHistory.some(p => p.productId === productId)) {
          return null;
        }

        return {
          product,
          score: frequency / similarUsers.length,
          reason: 'Usuários com gostos similares compraram este produto',
          confidence: Math.min(frequency / similarUsers.length, 1),
          type: 'collaborative' as const
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10) as Recommendation[];
  }, [userProfile]);

  // Filtro baseado em conteúdo
  const contentBasedFiltering = useCallback((userId: string, products: Product[]): Recommendation[] => {
    if (!userProfile) return [];

    // Analisar preferências do usuário
    const userPreferences = analyzeUserPreferences(userProfile);
    
    return products
      .map(product => {
        const similarity = calculateContentSimilarity(userPreferences, product);
        if (similarity < 0.3) return null;

        return {
          product,
          score: similarity,
          reason: 'Similar aos produtos que você gosta',
          confidence: similarity,
          type: 'content-based' as const
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10) as Recommendation[];
  }, [userProfile]);

  // Filtro demográfico
  const demographicFiltering = useCallback((userId: string, products: Product[]): Recommendation[] => {
    if (!userProfile?.demographics) return [];

    const { age, gender, location } = userProfile.demographics;
    
    return products
      .map(product => {
        const demographicScore = calculateDemographicScore(product, { age, gender, location });
        if (demographicScore < 0.2) return null;

        return {
          product,
          score: demographicScore,
          reason: 'Popular entre pessoas do seu perfil',
          confidence: demographicScore,
          type: 'demographic' as const
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 5) as Recommendation[];
  }, [userProfile]);

  // Produtos em tendência
  const trendingFiltering = useCallback((userId: string, products: Product[]): Recommendation[] => {
    // Simular análise de tendências
    const trendingProducts = products
      .filter(product => product.rating && product.rating > 4.0)
      .filter(product => product.reviewCount && product.reviewCount > 10)
      .map(product => ({
        product,
        score: (product.rating! * 0.7) + (Math.log(product.reviewCount!) * 0.3),
        reason: 'Produto em alta no momento',
        confidence: Math.min(product.rating! / 5, 1),
        type: 'trending' as const
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return trendingProducts;
  }, []);

  // Produtos similares
  const similarProductFiltering = useCallback((userId: string, products: Product[], targetProductId?: string): Recommendation[] => {
    if (!targetProductId) return [];

    const targetProduct = products.find(p => p.id === targetProductId);
    if (!targetProduct) return [];

    return products
      .filter(product => product.id !== targetProductId)
      .map(product => {
        const similarity = calculateProductSimilarity(targetProduct, product);
        if (similarity < 0.4) return null;

        return {
          product,
          score: similarity,
          reason: 'Similar ao produto que você está vendo',
          confidence: similarity,
          type: 'similar' as const
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 8) as Recommendation[];
  }, []);

  // Gerar recomendações
  const generateRecommendations = useCallback(async (
    userId: string, 
    context?: {
      currentProductId?: string;
      limit?: number;
      excludeIds?: string[];
    }
  ) => {
    setIsLoading(true);
    
    try {
      const profile = await loadUserProfile(userId);
      if (!profile) return [];

      const products = await loadProducts();
      const filteredProducts = products.filter(p => 
        !context?.excludeIds?.includes(p.id) && p.inStock
      );

      const allRecommendations: Recommendation[] = [];

      // Aplicar filtros baseado nas configurações
      if (engineSettings.collaborative) {
        allRecommendations.push(...collaborativeFiltering(userId, filteredProducts));
      }
      
      if (engineSettings.contentBased) {
        allRecommendations.push(...contentBasedFiltering(userId, filteredProducts));
      }
      
      if (engineSettings.demographic) {
        allRecommendations.push(...demographicFiltering(userId, filteredProducts));
      }
      
      if (engineSettings.trending) {
        allRecommendations.push(...trendingFiltering(userId, filteredProducts));
      }
      
      if (context?.currentProductId && engineSettings.similar) {
        allRecommendations.push(...similarProductFiltering(userId, filteredProducts, context.currentProductId));
      }

      // Combinar e ranquear recomendações
      const combinedRecommendations = combineRecommendations(allRecommendations);
      
      // Aplicar diversificação
      const diversifiedRecommendations = diversifyRecommendations(combinedRecommendations);
      
      const finalRecommendations = diversifiedRecommendations.slice(0, context?.limit || 20);
      
      setRecommendations(finalRecommendations);
      return finalRecommendations;
      
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [
    engineSettings,
    loadUserProfile,
    loadProducts,
    collaborativeFiltering,
    contentBasedFiltering,
    demographicFiltering,
    trendingFiltering,
    similarProductFiltering
  ]);

  // Atualizar perfil do usuário
  const updateUserProfile = useCallback(async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await fetch(`/api/recommendations/user-profile/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      
      // Recarregar perfil
      await loadUserProfile(userId);
      
      // Regenerar recomendações se necessário
      if (userProfile) {
        generateRecommendations(userId);
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }, [loadUserProfile, generateRecommendations, userProfile]);

  // Rastrear interação do usuário
  const trackUserInteraction = useCallback(async (
    userId: string,
    interaction: {
      type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'rating';
      productId: string;
      metadata?: any;
    }
  ) => {
    try {
      await fetch('/api/recommendations/interaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ...interaction,
          timestamp: Date.now()
        })
      });

      // Atualizar perfil local
      if (userProfile) {
        const updatedProfile = { ...userProfile };
        
        switch (interaction.type) {
          case 'view':
            updatedProfile.browsingHistory.push({
              productId: interaction.productId,
              timestamp: Date.now(),
              duration: 0
            });
            break;
          case 'add_to_cart':
            if (!updatedProfile.cartItems.includes(interaction.productId)) {
              updatedProfile.cartItems.push(interaction.productId);
            }
            break;
          case 'purchase':
            updatedProfile.purchaseHistory.push({
              productId: interaction.productId,
              timestamp: Date.now()
            });
            break;
          case 'rating':
            const purchaseIndex = updatedProfile.purchaseHistory.findIndex(
              p => p.productId === interaction.productId
            );
            if (purchaseIndex !== -1) {
              updatedProfile.purchaseHistory[purchaseIndex].rating = interaction.metadata?.rating;
            }
            break;
        }
        
        setUserProfile(updatedProfile);
      }
    } catch (error) {
      console.error('Erro ao rastrear interação:', error);
    }
  }, [userProfile]);

  // Funções auxiliares
  const findSimilarUsers = (profile: UserProfile): UserProfile[] => {
    // Simular busca por usuários similares
    // Em produção, usar algoritmos como cosine similarity
    return []; // Placeholder
  };

  const analyzeUserPreferences = (profile: UserProfile): string[] => {
    const categoryCounts: Record<string, number> = {};
    
    // Analisar histórico de compras
    profile.purchaseHistory.forEach(purchase => {
      const product = allProducts.find(p => p.id === purchase.productId);
      if (product) {
        categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      }
    });
    
    // Retornar categorias mais frequentes
    return Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);
  };

  const calculateContentSimilarity = (preferences: string[], product: Product): number => {
    let score = 0;
    
    // Similaridade de categoria
    if (preferences.includes(product.category)) {
      score += 0.4;
    }
    
    // Similaridade de tags
    const matchingTags = product.tags.filter(tag => 
      preferences.some(pref => pref.toLowerCase().includes(tag.toLowerCase()))
    );
    score += (matchingTags.length / product.tags.length) * 0.3;
    
    // Similaridade de preço (baseado no histórico)
    if (userProfile) {
      const avgPrice = calculateAveragePurchasePrice(userProfile);
      const priceSimilarity = 1 - Math.abs(product.price - avgPrice) / avgPrice;
      score += Math.max(0, priceSimilarity) * 0.3;
    }
    
    return Math.min(score, 1);
  };

  const calculateDemographicScore = (
    product: Product, 
    demographics: { age?: number; gender?: string; location?: string }
  ): number => {
    // Simular cálculo de score demográfico
    // Em produção, usar dados reais de demografia
    return Math.random() * 0.8 + 0.2; // Placeholder
  };

  const calculateProductSimilarity = (product1: Product, product2: Product): number => {
    let similarity = 0;
    
    // Similaridade de categoria
    if (product1.category === product2.category) {
      similarity += 0.4;
    }
    
    // Similaridade de tags
    const commonTags = product1.tags.filter(tag => product2.tags.includes(tag));
    similarity += (commonTags.length / Math.max(product1.tags.length, product2.tags.length)) * 0.3;
    
    // Similaridade de preço
    const priceDiff = Math.abs(product1.price - product2.price) / Math.max(product1.price, product2.price);
    similarity += (1 - priceDiff) * 0.3;
    
    return Math.min(similarity, 1);
  };

  const calculateAveragePurchasePrice = (profile: UserProfile): number => {
    const purchasedProducts = profile.purchaseHistory
      .map(purchase => allProducts.find(p => p.id === purchase.productId))
      .filter(Boolean) as Product[];
    
    if (purchasedProducts.length === 0) return 100; // Preço padrão
    
    return purchasedProducts.reduce((sum, product) => sum + product.price, 0) / purchasedProducts.length;
  };

  const combineRecommendations = (recommendations: Recommendation[]): Recommendation[] => {
    const combined = new Map<string, Recommendation>();
    
    recommendations.forEach(rec => {
      const existing = combined.get(rec.product.id);
      if (existing) {
        // Combinar scores usando média ponderada
        const totalWeight = existing.confidence + rec.confidence;
        const combinedScore = (existing.score * existing.confidence + rec.score * rec.confidence) / totalWeight;
        
        combined.set(rec.product.id, {
          ...existing,
          score: combinedScore,
          confidence: Math.min(totalWeight / 2, 1),
          reason: `${existing.reason} e ${rec.reason}`
        });
      } else {
        combined.set(rec.product.id, rec);
      }
    });
    
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score);
  };

  const diversifyRecommendations = (recommendations: Recommendation[]): Recommendation[] => {
    const diversified: Recommendation[] = [];
    const usedCategories = new Set<string>();
    
    // Priorizar diversidade de categorias
    recommendations.forEach(rec => {
      if (diversified.length < 10 || !usedCategories.has(rec.product.category)) {
        diversified.push(rec);
        usedCategories.add(rec.product.category);
      }
    });
    
    return diversified;
  };

  return {
    recommendations,
    isLoading,
    userProfile,
    generateRecommendations,
    updateUserProfile,
    trackUserInteraction,
    setEngineSettings,
    engineSettings
  };
}
