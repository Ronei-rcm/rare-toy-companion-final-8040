import { request } from './api-config';

export const pushApi = {
    getPublicKey: async () => request<{ publicKey: string }>('/push/vapid-public-key'),
    subscribe: async (subscription: PushSubscription) => request<void>('/push/subscribe', { method: 'POST', body: JSON.stringify({ subscription }) }),
    unsubscribe: async (endpoint: string) => request<void>('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) }),
    getNotifications: async () => request<any>('/notifications'),
    getStats: async () => request<any>('/notifications/stats'),
    sendBulk: async (data: any) => request<any>('/notifications', { method: 'POST', body: JSON.stringify(data) }),
    sendNow: async (id: string) => request<any>(`/notifications/${id}/send`, { method: 'POST' })
};
