import { request } from './api-config';

const normalize = <T>(data: any, context: string): T[] => {
    if (Array.isArray(data)) return data;
    if (data && data.data && Array.isArray(data.data)) return data.data;
    if (data && data.items && Array.isArray(data.items)) return data.items;
    if (data && data[context] && Array.isArray(data[context])) return data[context];
    console.warn(`⚠️ [backupApi] Resposta de ${context} não é um array:`, data);
    return [];
};

export const backupApi = {
    getProdutos: async () => {
        const data = await request<any>('/produtos');
        return normalize(data, 'produtos');
    },
    getPedidos: async () => {
        const data = await request<any>('/pedidos');
        return normalize(data, 'pedidos');
    },
    getClientes: async () => {
        const data = await request<any>('/clientes');
        return normalize(data, 'clientes');
    },
    getCategorias: async () => {
        const data = await request<any>('/categorias');
        return normalize(data, 'categorias');
    },
    getConfiguracoes: async () => request<any>('/configuracoes'),
    getProducts: async () => {
        const data = await request<any>('/produtos');
        return normalize(data, 'produtos');
    },
    getOrders: async () => {
        const data = await request<any>('/pedidos');
        return normalize(data, 'orders');
    },
    getCustomers: async () => {
        const data = await request<any>('/clientes');
        return normalize(data, 'customers');
    },
    getCategories: async () => {
        const data = await request<any>('/categorias');
        return normalize(data, 'categories');
    },
    getSettings: async () => request<any>('/configuracoes'),
    getUsers: async () => {
        const data = await request<any>('/usuarios');
        return normalize(data, 'users');
    },

    restoreProdutos: async (data: any) => request<any>('/produtos', { method: 'POST', body: JSON.stringify(data) }),
    restorePedidos: async (data: any) => request<any>('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
    restoreClientes: async (data: any) => request<any>('/clientes', { method: 'POST', body: JSON.stringify(data) }),
    restoreCategorias: async (data: any) => request<any>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    restoreConfiguracoes: async (data: any) => request<any>('/configuracoes', { method: 'POST', body: JSON.stringify(data) }),
    restore: async (data: any) => request<any>('/backup/restore', { method: 'POST', body: JSON.stringify(data) }),
    saveProduct: async (data: any) => request<any>('/produtos', { method: 'POST', body: JSON.stringify(data) }),
    saveOrder: async (data: any) => request<any>('/pedidos', { method: 'POST', body: JSON.stringify(data) }),
    saveCustomer: async (data: any) => request<any>('/clientes', { method: 'POST', body: JSON.stringify(data) }),
    saveCategory: async (data: any) => request<any>('/categorias', { method: 'POST', body: JSON.stringify(data) }),
    updateSettings: async (data: any) => request<any>('/configuracoes', { method: 'PUT', body: JSON.stringify(data) }),
};
