import { request } from './api-config';

export const suporteApi = {
    getConfig: async () => request<any>('/suporte/config'),
    createTicket: async (data: any) => request<any>('/suporte/tickets', { method: 'POST', body: JSON.stringify(data) }),
    getTickets: async () => request<any>('/suporte/tickets'),
};
