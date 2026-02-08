import { request } from './api-config';

export const adminCustomersApi = {
    getCustomers: async (params?: string) => request<any>(`/admin/customers${params ? `?${params}` : ''}`),
    getPublicUsers: async (params?: string) => request<any>(`/users${params ? `?${params}` : ''}`),
    getCustomerById: async (customerId: string | number) => request<any>(`/admin/customers/${customerId}`),
    getStats: async () => request<any>('/admin/customers/stats'),
    updateCustomer: async (customerId: string | number, data: any) =>
        request<any>(`/admin/customers/${customerId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCustomer: async (customerId: string | number) =>
        request<void>(`/admin/customers/${customerId}`, { method: 'DELETE' }),
    searchCustomers: async (query: string) =>
        request<any>(`/admin/customers/search?q=${encodeURIComponent(query)}`),
    syncUsers: async () => request<any>('/admin/customers/sync-users', { method: 'POST' }),
    bulkAction: async (data: { customerIds: (string | number)[], action: string, value?: string }) =>
        request<any>('/admin/customers/bulk-action', { method: 'POST', body: JSON.stringify(data) }),
    getCustomerOrders: async (customerId: string | number) =>
        request<any>(`/admin/customers/${customerId}/orders`),
    exportCustomers: async (params?: string) => request<any>(`/admin/customers/export${params ? `?${params}` : ''}`)
};
