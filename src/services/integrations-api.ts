import { request } from './api-config';

export const integrationsApi = {
    // Marketplaces
    marketplaces: {
        list: async () => request<any>('/integrations/marketplaces'),
        connect: async (data: any) => request<any>('/integrations/marketplaces/connect', { method: 'POST', body: JSON.stringify(data) }),
        disconnect: async (id: string) => request<void>(`/integrations/marketplace/${id}/disconnect`, { method: 'DELETE' }),
        sync: async (id: string, syncType: string = 'incremental') => request<any>(`/integrations/marketplace/${id}/sync`, { method: 'POST', body: JSON.stringify({ syncType }) }),
        updateSettings: async (id: string, settings: any) => request<any>(`/integrations/marketplace/${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) }),
        test: async (id: string) => request<any>(`/integrations/marketplace/${id}/test`, { method: 'POST' }),
        logs: async (id: string, params: string) => request<any>(`/integrations/marketplace/${id}/logs?${params}`)
    },

    // ERP
    erp: {
        list: async () => request<any>('/integrations/erp'),
        connect: async (data: any) => request<any>('/integrations/erp/connect', { method: 'POST', body: JSON.stringify(data) }),
        disconnect: async (id: string) => request<void>(`/integrations/erp/${id}/disconnect`, { method: 'DELETE' }),
        sync: async (id: string, syncType: string = 'incremental') => request<any>(`/integrations/erp/${id}/sync`, { method: 'POST', body: JSON.stringify({ syncType }) }),
        updateSettings: async (id: string, settings: any) => request<any>(`/integrations/erp/${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) }),
        test: async (id: string) => request<any>(`/integrations/erp/${id}/test`, { method: 'POST' }),
        logs: async (id: string, params: string) => request<any>(`/integrations/erp/${id}/logs?${params}`)
    },

    // Marketing
    marketing: {
        list: async () => request<any>('/integrations/marketing'),
        connect: async (data: any) => request<any>('/integrations/marketing/connect', { method: 'POST', body: JSON.stringify(data) }),
        disconnect: async (id: string) => request<void>(`/integrations/marketing/${id}/disconnect`, { method: 'DELETE' }),
        sync: async (id: string, syncType: string = 'incremental') => request<any>(`/integrations/marketing/${id}/sync`, { method: 'POST', body: JSON.stringify({ syncType }) }),
        updateSettings: async (id: string, settings: any) => request<any>(`/integrations/marketing/${id}/settings`, { method: 'PATCH', body: JSON.stringify(settings) }),
        test: async (id: string) => request<any>(`/integrations/marketing/${id}/test`, { method: 'POST' }),
        logs: async (id: string, params: string) => request<any>(`/integrations/marketing/${id}/logs?${params}`)
    },

    // General
    getSyncHistory: async () => request<any>('/integrations/sync-history'),
    getMetrics: async () => request<any>('/integrations/metrics'),
    bulkSync: async (data: any) => request<any>('/integrations/bulk-sync', { method: 'POST', body: JSON.stringify(data) })
};
