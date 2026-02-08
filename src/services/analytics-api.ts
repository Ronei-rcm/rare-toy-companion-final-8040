import { request } from './api-config';

export const analyticsApi = {
    logWebVitals: async (metric: any) => request<void>('/analytics/web-vitals', {
        method: 'POST',
        body: JSON.stringify(metric),
        keepalive: true
    }),

    getPerformanceMetrics: async (params?: string) =>
        request<any>(`/analytics/performance${params ? `?${params}` : ''}`),

    // Admin Analytics
    getDashboard: async (params?: string) => request<any>(`/admin/analytics/dashboard${params ? `?${params}` : ''}`),
    getSalesStats: async (params?: string) => request<any>(`/admin/analytics/vendas${params ? `?${params}` : ''}`),
    getPopularProducts: async (params?: string) => request<any>(`/admin/analytics/produtos-populares${params ? `?${params}` : ''}`),
    getRecentOrders: async (params?: string) => request<any>(`/admin/analytics/pedidos-recentes${params ? `?${params}` : ''}`),
    getGeneralStats: async () => request<any>('/admin/analytics/estatisticas-gerais')
};
