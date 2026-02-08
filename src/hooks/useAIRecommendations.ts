import { useState, useCallback } from 'react';
import { recommendationsApi } from '@/services/recommendations-api';
import { productsApi } from '@/services/products-api';

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
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [engineSettings, setEngineSettings] = useState<RecommendationEngine>({
    collaborative: true,
    contentBased: true,
    demographic: true,
    trending: true,
    similar: true
  });

  const loadUserProfile = useCallback(async (userId: string) => {
    try {
      const profile = await recommendationsApi.getUserProfile(userId);
      setUserProfile(profile);
      return profile;
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
      return null;
    }
  }, []);

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
      await loadUserProfile(userId);
      const finalRecommendations = await recommendationsApi.getRecommendations(userId);

      // Filtragem local baseada no contexto se a API não filtrar tudo
      let filtered = finalRecommendations || [];
      if (context?.excludeIds) {
        filtered = filtered.filter((r: Recommendation) => !context.excludeIds?.includes(r.product.id));
      }

      setRecommendations(filtered.slice(0, context?.limit || 20));
      return filtered;
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [loadUserProfile]);

  const updateUserProfile = useCallback(async (userId: string, updates: Partial<UserProfile>) => {
    try {
      await recommendationsApi.updateProfile(userId, updates);
      await loadUserProfile(userId);
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
  }, [loadUserProfile]);

  const trackUserInteraction = useCallback(async (
    userId: string,
    interaction: {
      type: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'rating';
      productId: string;
      metadata?: any;
    }
  ) => {
    try {
      await recommendationsApi.logInteraction({
        userId,
        ...interaction,
        timestamp: Date.now()
      });

      // Atualizar perfil local opcionalmente...
    } catch (error) {
      console.error('Erro ao rastrear interação:', error);
    }
  }, []);

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
