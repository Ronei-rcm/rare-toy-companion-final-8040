import { useState, useEffect, useCallback } from 'react';
import { socialApi } from '@/services/social-api';
import { productsApi } from '@/services/products-api';

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

  const loadUserData = useCallback(async (userId: string) => {
    try {
      setIsLoading(true);
      const userData = await socialApi.getUser(userId);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadLoyaltyProgram = useCallback(async () => {
    try {
      const program = await socialApi.getLoyaltyProgram();
      setLoyaltyProgram(program);
      return program;
    } catch (error) {
      console.error('Erro ao carregar programa de fidelidade:', error);
      return null;
    }
  }, []);

  const loadReferralProgram = useCallback(async (userId: string) => {
    try {
      const program = await socialApi.getReferralProgram(userId);
      setReferralProgram(program);
      return program;
    } catch (error) {
      console.error('Erro ao carregar programa de referência:', error);
      return null;
    }
  }, []);

  const addPoints = useCallback(async (points: number, reason: string) => {
    if (!user) return;
    try {
      await socialApi.addPoints({ userId: user.id, points, reason });
      setUser(prev => prev ? { ...prev, points: prev.points + points } : null);
      await checkLevelUp();
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
    }
  }, [user]);

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
      await socialApi.levelUp({
        userId: user.id,
        newLevel,
        oldLevel: currentLevel
      });
    }
  }, [user, loyaltyProgram]);

  const shareProduct = useCallback(async (
    productId: string,
    platform: 'facebook' | 'twitter' | 'instagram' | 'whatsapp' | 'link',
    customMessage?: string
  ) => {
    try {
      const product = await productsApi.getProduct(productId);
      const shareUrl = `${window.location.origin}/produto/${productId}`;

      const shareData = {
        title: product.nome || (product as any).name,
        text: customMessage || `Confira este produto incrível: ${product.nome || (product as any).name}`,
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
        case 'link':
          await navigator.clipboard.writeText(shareUrl);
          return { success: true, message: platform === 'instagram' ? 'Link copiado para o Instagram!' : 'Link copiado!' };
      }

      await socialApi.share({ productId, platform, userId: user?.id });

      if (user && loyaltyProgram) {
        await addPoints(loyaltyProgram.pointRules.socialShare, 'social_share');
      }

      return { success: true, message: 'Produto compartilhado com sucesso!' };
    } catch (error) {
      console.error('Erro ao compartilhar produto:', error);
      return { success: false, message: 'Erro ao compartilhar' };
    }
  }, [user, loyaltyProgram, addPoints]);

  const toggleReviewLike = useCallback(async (reviewId: string, isHelpful: boolean) => {
    try {
      await socialApi.voteReview(reviewId, isHelpful);
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
    } catch (error) {
      console.error('Erro ao votar na review:', error);
    }
  }, []);

  const toggleFollow = useCallback(async (userId: string) => {
    try {
      await socialApi.followUser(userId);
      setUser(prev => prev ? { ...prev, following: prev.following + 1 } : null);
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
    }
  }, []);

  const createSocialPost = useCallback(async (
    type: SocialPost['type'],
    content: string,
    images: string[] = [],
    productId?: string
  ) => {
    try {
      const newPost = await socialApi.createPost({ type, content, images, productId });
      setSocialFeed(prev => [newPost, ...prev]);

      if (loyaltyProgram) {
        await addPoints(10, 'social_post');
      }
      return newPost;
    } catch (error) {
      console.error('Erro ao criar post:', error);
      return null;
    }
  }, [loyaltyProgram, addPoints]);

  const generateReferralCode = useCallback(async () => {
    try {
      const referralCode = await socialApi.generateReferral({
        userId: user?.id,
        discountPercent: 10,
        referralReward: 100
      });
      setReferralProgram(referralCode);
      return referralCode;
    } catch (error) {
      console.error('Erro ao gerar código de referência:', error);
      return null;
    }
  }, [user]);

  const useReferralCode = useCallback(async (code: string) => {
    try {
      const response = await socialApi.useReferral({ code, userId: user?.id });
      if (response && !response.error) {
        await addPoints(100, 'referral_bonus');
        return { success: true, message: 'Código aplicado com sucesso!' };
      }
      return { success: false, message: response?.message || 'Erro ao aplicar código' };
    } catch (error: any) {
      console.error('Erro ao usar código de referência:', error);
      return { success: false, message: error.message || 'Erro ao aplicar código' };
    }
  }, [user, addPoints]);

  const loadSocialFeed = useCallback(async (page = 1, limit = 20) => {
    try {
      const feed = await socialApi.getFeed(page, limit);
      if (page === 1) setSocialFeed(feed);
      else setSocialFeed(prev => [...prev, ...feed]);
      return feed;
    } catch (error) {
      console.error('Erro ao carregar feed social:', error);
      return [];
    }
  }, []);

  const loadProductReviews = useCallback(async (productId: string) => {
    try {
      const reviewsData = await socialApi.getProductReviews(productId);
      setReviews(reviewsData);
      return reviewsData;
    } catch (error) {
      console.error('Erro ao carregar reviews:', error);
      return [];
    }
  }, []);

  const createReview = useCallback(async (
    productId: string,
    rating: number,
    title: string,
    content: string,
    images: string[] = []
  ) => {
    try {
      const newReview = await socialApi.createReview({ productId, rating, title, content, images });
      setReviews(prev => [newReview, ...prev]);

      if (loyaltyProgram) {
        await addPoints(loyaltyProgram.pointRules.review, 'review');
      }

      await createSocialPost('review', `Acabei de avaliar este produto! ⭐ ${rating}/5`, images, productId);
      return newReview;
    } catch (error) {
      console.error('Erro ao criar review:', error);
      return null;
    }
  }, [loyaltyProgram, addPoints, createSocialPost]);

  const getSocialStats = useCallback(async (userId: string) => {
    try {
      return await socialApi.getStats(userId);
    } catch (error) {
      console.error('Erro ao carregar estatísticas sociais:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      loadLoyaltyProgram();
      loadReferralProgram(user.id);
      loadSocialFeed();
    }
  }, [user?.id, loadLoyaltyProgram, loadReferralProgram, loadSocialFeed]);

  return {
    user,
    reviews,
    socialFeed,
    loyaltyProgram,
    referralProgram,
    isLoading,
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
