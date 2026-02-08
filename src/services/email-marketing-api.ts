import { request } from './api-config';

export const emailMarketingApi = {
    sendCartRecovery: async (data: any) =>
        request<any>('/email-marketing/cart-recovery/send', { method: 'POST', body: JSON.stringify(data) })
};
