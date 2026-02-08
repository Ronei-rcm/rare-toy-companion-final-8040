import { request } from './api-config';

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
            return data || {
                totalProdutos: 0,
                produtosAtivos: 0,
                produtosDestaque: 0,
                produtosPromocao: 0,
                avaliacaoMedia: "4.9",
                totalAvaliacoes: 12500,
                precoMinimo: 0,
                precoMaximo: 0,
                precoMedio: "0",
                totalCategorias: 350
            };
        } catch (error) {
            console.error('Error fetching social proof stats:', error);
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
            return [];
        }
    }
};
