import { request } from './api-config';

export const configApi = {
    // Configurações Globais
    getSettings: async () => request<any>('/settings'),
    updateSettings: async (settings: any) => request<any>('/settings', { method: 'PATCH', body: JSON.stringify(settings) }),

    // Configuração da Home
    getHomeConfig: async () => request<any>('/home-config'),
    saveHomeConfig: async (config: any) => request<any>('/home-config', { method: 'POST', body: JSON.stringify(config) }),

    // Utilitários
    getActiveVideos: async () => {
        const data = await request<any>('/videos/active');
        if (Array.isArray(data)) return data;
        if (data && data.videos && Array.isArray(data.videos)) return data.videos;
        if (data && data.data && Array.isArray(data.data)) return data.data;
        console.warn('⚠️ [configApi] Resposta de vídeos ativos não é um array:', data);
        return [];
    }
};
