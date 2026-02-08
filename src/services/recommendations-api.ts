import { request } from './api-config';

export const recommendationsApi = {
    getUserProfile: async (userId: string) => request<any>(`/recommendations/user-profile/${userId}`),
    getRecommendations: async (userId: string) => request<any>(`/recommendations/${userId}`),
    updateProfile: async (userId: string, data: any) =>
        request<any>(`/recommendations/user-profile/${userId}`, { method: 'POST', body: JSON.stringify(data) }),
    logInteraction: async (data: any) =>
        request<any>('/recommendations/interaction', { method: 'POST', body: JSON.stringify(data) })
};
