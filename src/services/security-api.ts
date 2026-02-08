import { request } from './api-config';

export const securityApi = {
    getEvents: async (params?: string) => request<any>(`/security/events${params ? `?${params}` : ''}`),
    logEvent: async (event: any) => request<any>('/security/events', { method: 'POST', body: JSON.stringify(event) }),

    getAlerts: async () => request<any>('/security/alerts'),
    resolveAlert: async (alertId: string, resolution: any) =>
        request<any>(`/security/alerts/${alertId}/resolve`, { method: 'POST', body: JSON.stringify(resolution) }),

    getCompliance: async () => request<any>('/security/compliance'),
    runAudit: async (auditData: any) => request<any>('/security/compliance/audit', { method: 'POST', body: JSON.stringify(auditData) }),

    getSettings: async () => request<any>('/security/settings'),
    updateSettings: async (settings: any) => request<any>('/security/settings', { method: 'PATCH', body: JSON.stringify(settings) }),

    getMetrics: async () => request<any>('/security/metrics'),

    twoFactor: {
        setup: async (data: any) => request<any>('/security/2fa/setup', { method: 'POST', body: JSON.stringify(data) }),
        verify: async (data: any) => request<any>('/security/2fa/verify', { method: 'POST', body: JSON.stringify(data) }),
        getBackupCodes: async (data: any) => request<any>('/security/2fa/backup-codes', { method: 'POST', body: JSON.stringify(data) }),
    },

    ipManagement: {
        block: async (data: any) => request<any>('/security/block-ip', { method: 'POST', body: JSON.stringify(data) }),
        unblock: async (data: any) => request<any>('/security/unblock-ip', { method: 'POST', body: JSON.stringify(data) }),
    },

    exportData: async (params: string) => request<any>(`/security/export?${params}`)
};
