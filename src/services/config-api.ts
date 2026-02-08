import { request } from './api-config';

export const configApi = {
    // Configurações Globais
    getSettings: async () => request<any>('/settings'),
    updateSettings: async (settings: any) => request<any>('/settings', { method: 'PATCH', body: JSON.stringify(settings) }),

    // Configuração da Home
    getHomeConfig: async () => request<any>('/home-config'),
    saveHomeConfig: async (config: any) => request<any>('/home-config', { method: 'POST', body: JSON.stringify(config) }),

    // Utilitários
    getActiveVideos: async () => request<any>('/videos/active')
};
