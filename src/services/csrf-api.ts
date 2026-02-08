import { request } from './api-config';

export const csrfApi = {
    getToken: async () => request<any>('/csrf-token'),
};
