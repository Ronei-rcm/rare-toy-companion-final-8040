import { request } from './api-config';

export const externalApi = {
    lookupCep: async (cep: string) => {
        const cleanCep = cep.replace(/\D/g, '');
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        if (!response.ok) throw new Error('Falha na consulta de CEP');
        return response.json();
    },
    getApis: async () => request<any>('/external/apis'),
    getRequests: async (limit = 50) => request<any>(`/external/requests?limit=${limit}`),
    getWebhooks: async () => request<any>('/external/webhooks'),
    getWebhookDeliveries: async (limit = 50) => request<any>(`/external/webhook-deliveries?limit=${limit}`),
    getStats: async () => request<any>('/external/stats'),
    saveApi: async (data: any) => request<any>('/external/apis', { method: 'POST', body: JSON.stringify(data) }),
    saveWebhook: async (data: any) => request<any>('/external/webhooks', { method: 'POST', body: JSON.stringify(data) }),
    testApi: async (apiId: string) => request<any>(`/external/apis/${apiId}/test`, { method: 'POST' }),
    sendRequest: async (apiId: string, data: any) => request<any>(`/external/apis/${apiId}/request`, { method: 'POST', body: JSON.stringify(data) }),
};
