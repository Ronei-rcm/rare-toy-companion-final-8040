import { request, ApiError } from './api-config';
import { MOCK_SOCIAL_STATS, MOCK_RECENT_PURCHASES } from './fallback-data';

export const socialApi = {
    // User Social Data
    getUser: async (userId: string) => request<any>(`/social/user/${userId}`),
    followUser: async (userId: string) => request<void>(`/social/follow/${userId}`, { method: 'POST' }),
    getStats: async (userId: string) => request<any>(`/social/stats/${userId}`),

    // Loyalty & Referral
    getLoyaltyProgram: async () => request<any>('/social/loyalty-program'),
    getReferralProgram: async (userId: string) => request<any>(`/social/referral-program/${userId}`),
    generateReferral: async (data: any) => request<any>('/social/referral/generate', { method: 'POST', body: JSON.stringify(data) }),
    useReferral: async (data: any) => request<any>('/social/referral/use', { method: 'POST', body: JSON.stringify(data) }),
    addPoints: async (data: { userId: string, points: number, reason: string }) => request<any>('/social/points', { method: 'POST', body: JSON.stringify(data) }),
    levelUp: async (data: any) => request<any>('/social/level-up', { method: 'POST', body: JSON.stringify(data) }),

    // Social Feed & Posts
    share: async (data: any) => request<any>('/social/share', { method: 'POST', body: JSON.stringify(data) }),
    createPost: async (data: any) => request<any>('/social/posts', { method: 'POST', body: JSON.stringify(data) }),
    getFeed: async (page = 1, limit = 20) => request<any>(`/social/feed?page=${page}&limit=${limit}`),

    // Reviews
    getProductReviews: async (productId: string) => request<any>(`/social/reviews/product/${productId}`),
    createReview: async (data: any) => request<any>('/social/reviews', { method: 'POST', body: JSON.stringify(data) }),
    voteReview: async (reviewId: string, isHelpful: boolean) => request<void>(`/social/reviews/${reviewId}/vote`, { method: 'POST', body: JSON.stringify({ isHelpful }) }),

    // Social Proof (Real-time notifications)
    getSocialProofStats: async () => {
        try {
            const data = await request<any>('/stats');
            return data || MOCK_SOCIAL_STATS;
        } catch (error) {
            console.error('Error fetching social proof stats:', error);

            // Se for erro de CORS, usar dados mockados
            if (error instanceof ApiError && error.data?.corsError) {
                console.warn('📦 Usando dados mockados de social stats (CORS bloqueado)');
                return MOCK_SOCIAL_STATS;
            }

            return null;
        }
    },
    getRecentPurchases: async () => {
        try {
            const data = await request<any>('/compras-recentes');
            if (Array.isArray(data)) return data;
            if (data && data.compras && Array.isArray(data.compras)) return data.compras;
            if (data && data.data && Array.isArray(data.data)) return data.data;
            return [];
        } catch (error) {
            console.error('Error fetching recent purchases:', error);

            // Se for erro de CORS, usar dados mockados
            if (error instanceof ApiError && error.data?.corsError) {
                console.warn('📦 Usando dados mockados de compras recentes (CORS bloqueado)');
                return MOCK_RECENT_PURCHASES;
            }

            return [];
        }
    }
};
