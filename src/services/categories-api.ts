import { request, ApiError } from './api-config';
import { MOCK_CATEGORIES } from './fallback-data';

export const categoriesApi = {
    async list() {
        try {
            const response = await request<any>('/categorias');
            if (Array.isArray(response)) return response;
            if (response?.data && Array.isArray(response.data)) return response.data;
            if (response?.categorias && Array.isArray(response.categorias)) return response.categorias;
            console.warn('[categoriesApi] Resposta inesperada:', response);
            return [];
        } catch (error) {
            console.error('[categoriesApi] Erro ao buscar categorias:', error);

            // Se for erro de CORS, usar dados mockados
            if (error instanceof ApiError && error.data?.corsError) {
                console.warn('📦 Usando dados mockados de categorias (CORS bloqueado)');
                return MOCK_CATEGORIES;
            }

            return [];
        }
    },
    getById: async (id: string) => request<any>(`/categorias/${id}`),
    create: async (data: any) => request<any>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => request<any>(`/categorias/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: async (id: string) => request<void>(`/categorias/${id}`, { method: 'DELETE' })
};
