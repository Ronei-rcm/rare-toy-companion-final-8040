import { request } from './api-config';

export const financialApi = {
    // Pedidos (Visualização Financeira)
    getOrders: async () => request<any>('/orders'),

    // Fornecedores
    getSuppliers: async () => request<any>('/suppliers'),
    getSupplierTransactions: async (supplierId: string) => request<any>(`/financial/suppliers/${supplierId}/transactions`),
    getSupplierPayments: async (supplierId: string) => request<any>(`/financial/suppliers/${supplierId}/payments`),

    updateSupplierTransaction: async (supplierId: string, data: any) =>
        request<any>(`/financial/suppliers/${supplierId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),

    updateSupplierPayment: async (supplierId: string, data: any) =>
        request<any>(`/financial/suppliers/${supplierId}/payments`, { method: 'POST', body: JSON.stringify(data) }),

    updateSupplierCreditLimit: async (supplierId: string, data: any) =>
        request<any>(`/financial/suppliers/${supplierId}/credit-limit`, { method: 'POST', body: JSON.stringify(data) }),

    // Transações
    getTransactions: async () => request<any>('/financial/transactions'),

    // Dashboard Unificado
    getDashboardSummary: async () => request<any>('/financial/dashboard'),

    // Transações Detalhadas
    createTransaction: async (data: any) =>
        request<any>('/financial/transactions', { method: 'POST', body: JSON.stringify(data) }),
    updateTransaction: async (id: string, data: any) =>
        request<any>(`/financial/transactions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteTransaction: async (id: string) =>
        request<any>(`/financial/transactions/${id}`, { method: 'DELETE' })
};
