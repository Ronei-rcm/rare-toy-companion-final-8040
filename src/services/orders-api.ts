import { request } from './api-config';

export const ordersApi = {
    getOrders: async () => request<any>('/orders/me'),
    getOrderById: async (id: string | number) => request<any>(`/orders/${id}`),
    getTimeline: async (id: string | number) => request<any>(`/orders/${id}/timeline`),
    reorder: async (id: string | number) => request<any>(`/orders/${id}/reorder`, { method: 'POST' }),
    resendConfirmation: async (id: string | number) => request<any>(`/orders/${id}/resend`, { method: 'POST' }),
    getInfiniteTapResult: async (orderId: string | number) => request<any>(`/orders/${orderId}/infinitetap-result`, { method: 'POST' }),
};
