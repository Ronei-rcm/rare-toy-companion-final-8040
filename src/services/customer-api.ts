import { request } from './api-config';

export const customerApi = {
    getCustomerById: async (id: string, forceRefresh = false) =>
        request<any>(`/customers/${id}`, {
            headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
        }),
    getCustomerByEmail: async (email: string, forceRefresh = false) =>
        request<any>(`/customers/by-email/${encodeURIComponent(email)}`, {
            headers: forceRefresh ? { 'Cache-Control': 'no-cache' } : {}
        }),
    updateCustomer: async (id: string, data: any) =>
        request<any>(`/customers/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
};
