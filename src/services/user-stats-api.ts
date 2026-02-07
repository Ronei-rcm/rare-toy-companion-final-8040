import { request } from './api-config';
import { UserStats, Order, CartData, FavoriteData } from '@/hooks/useUserStats';

export const userStatsApi = {
    getStats: async (userId: string) => request<UserStats>(`/user-stats/stats/${userId}`),

    getOrders: async (userId: string, page: number = 1, limit: number = 10) =>
        request<Order[]>(`/user-stats/orders/${userId}?page=${page}&limit=${limit}`),

    getCart: async (userId: string) => request<CartData>(`/user-stats/cart/${userId}`),

    getFavorites: async (userId: string, page: number = 1, limit: number = 20) =>
        request<FavoriteData>(`/user-stats/favorites/${userId}?page=${page}&limit=${limit}`)
};
