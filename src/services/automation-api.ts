import { request } from './api-config';

// Tipos podem ser movidos para um arquivo de tipos compartilhado no futuro
// Por enquanto, o hook mantém as definições e o serviço é agnóstico ou usa 'any' onde os tipos não estão disponíveis globalmente

export const automationApi = {
    // Workflows
    getWorkflows: async () => request<any[]>('/automation/workflows'),
    createWorkflow: async (data: any) => request<any>('/automation/workflows', { method: 'POST', body: JSON.stringify(data) }),
    updateWorkflow: async (id: string, data: any) => request<any>(`/automation/workflows/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteWorkflow: async (id: string) => request<void>(`/automation/workflows/${id}`, { method: 'DELETE' }),

    // Executions
    getExecutions: async (workflowId?: string) => {
        const url = workflowId
            ? `/automation/executions?workflowId=${workflowId}`
            : '/automation/executions';
        return request<any[]>(url);
    },

    // Campaigns
    getCampaigns: async () => request<any[]>('/automation/campaigns'),
    createCampaign: async (data: any) => request<any>('/automation/campaigns', { method: 'POST', body: JSON.stringify(data) }),
    executeCampaign: async (id: string) => request<any>(`/automation/campaigns/${id}/execute`, { method: 'POST' }),

    // Rules
    getRules: async () => request<any[]>('/automation/rules'),
    createRule: async (data: any) => request<any>('/automation/rules', { method: 'POST', body: JSON.stringify(data) }),
    executeRules: async (eventData: any) => request<any>('/automation/rules/execute', { method: 'POST', body: JSON.stringify(eventData) }),
};
