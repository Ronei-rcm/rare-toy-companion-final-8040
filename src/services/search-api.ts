import { request } from './api-config';

export const searchApi = {
    getPopular: async () => request<any>('/search/popular'),
    getSuggestions: async (query: string) => request<any>(`/search/suggestions?q=${encodeURIComponent(query)}`),
    search: async (params: string) => request<any>(`/search?${params}`),
    searchByImage: async (formData: FormData) =>
        request<any>('/search/image', { method: 'POST', body: formData, headers: {} }), // Bloquear Content-Type JSON
    getFacets: async (params: string) => request<any>(`/search/facets?${params}`),
    semanticSearch: async (params: string) => request<any>(`/search/semantic?${params}`)
};
