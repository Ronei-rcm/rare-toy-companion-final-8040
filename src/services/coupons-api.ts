import { request } from './api-config';

export const couponsApi = {
    getCoupons: async () => request<any>('/coupons'),
    getLoyaltyStats: async () => request<any>('/coupons/loyalty/stats'),
    createCoupon: async (data: any) => request<any>('/coupons', { method: 'POST', body: JSON.stringify(data) }),
    updateCoupon: async (id: string | number, data: any) => request<any>(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCoupon: async (id: string | number) => request<any>(`/coupons/${id}`, { method: 'DELETE' }),
};
