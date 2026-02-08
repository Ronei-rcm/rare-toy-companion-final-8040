import { request } from './api-config';

export const categoriesApi = {
    list: async () => request<any[]>('/categorias'),
    getById: async (id: string) => request<any>(`/categorias/${id}`),
    create: async (data: any) => request<any>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => request<any>(`/categorias/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    remove: async (id: string) => request<void>(`/categorias/${id}`, { method: 'DELETE' })
};
