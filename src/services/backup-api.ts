import { request } from './api-config';

export const backupApi = {
    getProdutos: async () => request<any>('/produtos'),
    getPedidos: async () => request<any>('/pedidos'),
    getClientes: async () => request<any>('/clientes'),
    getCategorias: async () => request<any>('/categorias'),
    getConfiguracoes: async () => request<any>('/configuracoes'),
    getProducts: async () => request<any[]>('/produtos'),
    getOrders: async () => request<any[]>('/pedidos'),
    getCustomers: async () => request<any[]>('/clientes'),
    getCategories: async () => request<any[]>('/categorias'),
    getSettings: async () => request<any>('/configuracoes'),
    getUsers: async () => request<any[]>('/usuarios'),

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
