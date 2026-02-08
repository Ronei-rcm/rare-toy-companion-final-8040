import { request } from './api-config';

export const adminOrdersApi = {
    getOrders: async (params?: string) => request<any>(`/admin/orders${params ? `?${params}` : ''}`),
    getOrderById: async (orderId: string | number) => request<any>(`/admin/orders/${orderId}`),
    updateStatus: async (orderId: string | number, status: string, notes?: string) =>
        request<any>(`/admin/orders/${orderId}/status`, { method: 'PATCH', body: JSON.stringify({ status, notes }) }),
    associateCustomer: async (orderId: string | number, customerId: string | number) =>
        request<any>(`/admin/orders/${orderId}/associate-customer`, { method: 'PATCH', body: JSON.stringify({ customer_id: customerId }) }),
    bulkAction: async (data: { orderIds: (string | number)[], action: string, value?: string }) =>
        request<any>('/admin/orders/bulk-action', { method: 'POST', body: JSON.stringify(data) }),
    getStats: async () => request<any>('/admin/orders-stats-evolved-simple'),
    getOrdersEvolved: async () => request<any>('/admin/orders-evolved-simple'),
    deleteOrder: async (orderId: string | number) => request<void>(`/admin/orders/${orderId}`, { method: 'DELETE' }),
    exportOrders: async (params?: string) => request<Blob>(`/admin/orders/export${params ? `?${params}` : ''}`, {
        headers: { 'Accept': 'text/csv' }
    })
};
