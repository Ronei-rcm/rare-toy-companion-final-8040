import { request } from './api-config';

export const categoriesApi = {
    list: async () => {
        const data = await request<any>('/categorias');
        if (Array.isArray(data)) return data;
        if (data && data.data && Array.isArray(data.data)) return data.data;
        console.warn('⚠️ [categoriesApi] Resposta de categorias não é um array:', data);
        return [];
    },
    getById: async (id: string) => request<any>(`/categorias/${id}`),
    create: async (data: any) => request<any>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => request<any>(`/categorias/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: async (id: string) => request<void>(`/categorias/${id}`, { method: 'DELETE' })
};
