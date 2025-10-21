import { useState, useEffect, useCallback } from 'react';

interface User {
  id: string;
  name: string;
  avatar?: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  points: number;
  badges: Badge[];
  followers: number;
  following: number;
  reviews: number;
  helpfulVotes: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  unlockedAt: Date;
}

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  images: string[];
  helpful: number;
  notHelpful: number;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  type: 'review' | 'wishlist' | 'purchase' | 'achievement' | 'custom';
  content: string;
  images: string[];
  productId?: string;
  likes: number;
  comments: number;
  shares: number;
  createdAt: Date;
  isLiked?: boolean;
}

interface LoyaltyProgram {
  levels: {
    bronze: { minPoints: 0; benefits: string[]; discountPercent: 5 };
    silver: { minPoints: 1000; benefits: string[]; discountPercent: 10 };
    gold: { minPoints: 5000; benefits: string[]; discountPercent: 15 };
    platinum: { minPoints: 15000; benefits: string[]; discountPercent: 20 };
    diamond: { minPoints: 50000; benefits: string[]; discountPercent: 25 };
  };
  pointRules: {
    purchase: number;
    review: number;
    referral: number;
    socialShare: number;
    birthday: number;
    firstPurchase: number;
  };
}

interface ReferralProgram {
  code: string;
  discountPercent: number;
  referralReward: number;
  maxUses: number;
  currentUses: number;
  expiresAt?: Date;
}

export function useSocialFeatures() {
  const [user, setUser] = useState<User | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [socialFeed, setSocialFeed] = useState<SocialPost[]>([]);
  const [loyaltyProgram, setLoyaltyProgram] = useState<LoyaltyProgram | null>(null);
  const [referralProgram, setReferralProgram] = useState<ReferralProgram | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carregar dados do usuário
  const loadUserData = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/social/user/${userId}`);
      const userData = await response.json();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar programa de fidelidade
  const loadLoyaltyProgram = useCallback(async () => {
    try {
      const response = await fetch('/api/social/loyalty-program');
      const program = await response.json();
      setLoyaltyProgram(program);
      return program;
    } catch (error) {
      console.error('Erro ao carregar programa de fidelidade:', error);
      return null;
    }
  }, []);

  // Carregar programa de referência
  const loadReferralProgram = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/social/referral-program/${userId}`);
      const program = await response.json();
      setReferralProgram(program);
      return program;
    } catch (error) {
      console.error('Erro ao carregar programa de referência:', error);
      return null;
    }
  }, []);

  // Compartilhar produto
  const shareProduct = useCallback(async (
    productId: string,
    platform: 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'link',
    customMessage?: string
  ) => {
    try {
      const product = await fetch(`/api/products/${productId}`).then(r => r.json());
      const shareUrl = `${window.location.origin}/produto/${productId}`;
      
      const shareData = {
        title: product.name,
        text: customMessage || `Confira este produto incrível: ${product.name}`,
        url: shareUrl
      };

      switch (platform) {
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(shareData.text + ' ' + shareData.url)}`);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`);
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareData.text)}&url=${encodeURIComponent(shareUrl)}`);
          break;
        case 'instagram':
          // Para Instagram, copiar link para área de transferência
          await navigator.clipboard.writeText(shareUrl);
          return { success: true, message: 'Link copiado para o Instagram!' };
        case 'link':
          await navigator.clipboard.writeText(shareUrl);
          return { success: true, message: 'Link copiado!' };
      }

      // Registrar compartilhamento
      await fetch('/api/social/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          platform,
          userId: user?.id
        })
      });

      // Adicionar pontos por compartilhamento
      if (user && loyaltyProgram) {
        await addPoints(loyaltyProgram.pointRules.socialShare, 'social_share');
      }

      return { success: true, message: 'Produto compartilhado com sucesso!' };
    } catch (error) {
      console.error('Erro ao compartilhar produto:', error);
      return { success: false, message: 'Erro ao compartilhar' };
    }
  }, [user, loyaltyProgram]);

  // Adicionar pontos
  const addPoints = useCallback(async (points: number, reason: string) => {
    if (!user) return;

    try {
      await fetch('/api/social/points', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          points,
          reason
        })
      });

      // Atualizar pontos localmente
      setUser(prev => prev ? {
        ...prev,
        points: prev.points + points
      } : null);

      // Verificar se subiu de nível
      await checkLevelUp();
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
    }
  }, [user]);

  // Verificar se subiu de nível
  const checkLevelUp = useCallback(async () => {
    if (!user || !loyaltyProgram) return;

    const currentLevel = user.level;
    let newLevel = currentLevel;

    if (user.points >= loyaltyProgram.levels.diamond.minPoints) {
      newLevel = 'diamond';
    } else if (user.points >= loyaltyProgram.levels.platinum.minPoints) {
      newLevel = 'platinum';
    } else if (user.points >= loyaltyProgram.levels.gold.minPoints) {
      newLevel = 'gold';
    } else if (user.points >= loyaltyProgram.levels.silver.minPoints) {
      newLevel = 'silver';
    }

    if (newLevel !== currentLevel) {
      setUser(prev => prev ? { ...prev, level: newLevel } : null);
      
      // Notificar subida de nível
      await fetch('/api/social/level-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          newLevel,
          oldLevel: currentLevel
        })
      });
    }
  }, [user, loyaltyProgram]);

  // Curtir/descurtir review
  const toggleReviewLike = useCallback(async (reviewId: string, isHelpful: boolean) => {
    try {
      const response = await fetch(`/api/social/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHelpful })
      });

      if (response.ok) {
        setReviews(prev => prev.map(review => {
          if (review.id === reviewId) {
            return {
              ...review,
              helpful: isHelpful ? review.helpful + 1 : review.helpful,
              notHelpful: !isHelpful ? review.notHelpful + 1 : review.notHelpful
            };
          }
          return review;
        }));
      }
    } catch (error) {
      console.error('Erro ao votar na review:', error);
    }
  }, []);

  // Seguir/deixar de seguir usuário
  const toggleFollow = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/social/follow/${userId}`, {
        method: 'POST'
      });

      if (response.ok) {
        // Atualizar contadores localmente
        setUser(prev => prev ? {
          ...prev,
          following: prev.following + 1
        } : null);
      }
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    }
  }, []);

  // Criar post social
  const createSocialPost = useCallback(async (
    type: SocialPost['type'],
    content: string,
    images: string[] = [],
    productId?: string
  ) => {
    try {
      const response = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content,
          images,
          productId
        })
      });

      const newPost = await response.json();
      
      setSocialFeed(prev => [newPost, ...prev]);

      // Adicionar pontos por post
      if (loyaltyProgram) {
        await addPoints(10, 'social_post');
      }

      return newPost;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      return null;
    }
  }, [loyaltyProgram, addPoints]);

  // Gerar código de referência
  const generateReferralCode = useCallback(async () => {
    try {
      const response = await fetch('/api/social/referral/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          discountPercent: 10,
          referralReward: 100
        })
      });

      const referralCode = await response.json();
      setReferralProgram(referralCode);
      
      return referralCode;
    } catch (error) {
      console.error('Erro ao gerar código de referência:', error);
      return null;
    }
  }, [user]);

  // Usar código de referência
  const useReferralCode = useCallback(async (code: string) => {
    try {
      const response = await fetch('/api/social/referral/use', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          userId: user?.id
        })
      });

      if (response.ok) {
        // Adicionar pontos para quem indicou
        await addPoints(100, 'referral_bonus');
        return { success: true, message: 'Código aplicado com sucesso!' };
      } else {
        const error = await response.json();
        return { success: false, message: error.message };
      }
    } catch (error) {
      console.error('Erro ao usar código de referência:', error);
      return { success: false, message: 'Erro ao aplicar código' };
    }
  }, [user, addPoints]);

  // Carregar feed social
  const loadSocialFeed = useCallback(async (page = 1, limit = 20) => {
    try {
      const response = await fetch(`/api/social/feed?page=${page}&limit=${limit}`);
      const feed = await response.json();
      
      if (page === 1) {
        setSocialFeed(feed);
      } else {
        setSocialFeed(prev => [...prev, ...feed]);
      }
      
      return feed;
    } catch (error) {
      console.error('Erro ao carregar feed social:', error);
      return [];
    }
  }, []);

  // Carregar reviews de um produto
  const loadProductReviews = useCallback(async (productId: string) => {
    try {
      const response = await fetch(`/api/social/reviews/product/${productId}`);
      const reviews = await response.json();
      setReviews(reviews);
      return reviews;
    } catch (error) {
      console.error('Erro ao carregar reviews:', error);
      return [];
    }
  }, []);

  // Criar review
  const createReview = useCallback(async (
    productId: string,
    rating: number,
    title: string,
    content: string,
    images: string[] = []
  ) => {
    try {
      const response = await fetch('/api/social/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating,
          title,
          content,
          images
        })
      });

      const newReview = await response.json();
      
      setReviews(prev => [newReview, ...prev]);

      // Adicionar pontos por review
      if (loyaltyProgram) {
        await addPoints(loyaltyProgram.pointRules.review, 'review');
      }

      // Criar post social automático
      await createSocialPost('review', `Acabei de avaliar este produto! ⭐ ${rating}/5`, images, productId);

      return newReview;
    } catch (error) {
      console.error('Erro ao criar review:', error);
      return null;
    }
  }, [loyaltyProgram, addPoints, createSocialPost]);

  // Obter estatísticas sociais
  const getSocialStats = useCallback(async (userId: string) => {
    try {
      const response = await fetch(`/api/social/stats/${userId}`);
      const stats = await response.json();
      return stats;
    } catch (error) {
      console.error('Erro ao carregar estatísticas sociais:', error);
      return null;
    }
  }, []);

  // Inicializar dados
  useEffect(() => {
    const initializeData = async () => {
      if (user?.id) {
        await Promise.all([
          loadLoyaltyProgram(),
          loadReferralProgram(user.id),
          loadSocialFeed()
        ]);
      }
    };

    initializeData();
  }, [user?.id, loadLoyaltyProgram, loadReferralProgram, loadSocialFeed]);

  return {
    // Estado
    user,
    reviews,
    socialFeed,
    loyaltyProgram,
    referralProgram,
    isLoading,
    
    // Ações
    loadUserData,
    shareProduct,
    toggleReviewLike,
    toggleFollow,
    createSocialPost,
    generateReferralCode,
    useReferralCode,
    loadSocialFeed,
    loadProductReviews,
    createReview,
    getSocialStats,
    addPoints
  };
}
