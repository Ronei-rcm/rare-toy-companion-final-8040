import { useState, useEffect, useCallback, useRef } from 'react';

interface Trigger {
  id: string;
  name: string;
  type: 'event' | 'schedule' | 'condition' | 'webhook' | 'api';
  config: {
    event?: string;
    schedule?: {
      frequency: 'once' | 'daily' | 'weekly' | 'monthly';
      time?: string;
      days?: number[];
      date?: string;
    };
    condition?: {
      field: string;
      operator: 'equals' | 'greater' | 'less' | 'contains' | 'exists';
      value: any;
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
    };
    api?: {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    };
  };
  enabled: boolean;
  lastTriggered?: Date;
  triggerCount: number;
}

interface Action {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'webhook' | 'api' | 'update' | 'create' | 'delete' | 'wait' | 'condition';
  config: {
    email?: {
      template: string;
      to: string[];
      subject: string;
      variables?: Record<string, any>;
    };
    sms?: {
      template: string;
      to: string[];
      variables?: Record<string, any>;
    };
    push?: {
      title: string;
      body: string;
      icon?: string;
      badge?: number;
      data?: Record<string, any>;
      users?: string[];
    };
    webhook?: {
      url: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    };
    api?: {
      endpoint: string;
      method: 'GET' | 'POST' | 'PUT' | 'DELETE';
      headers?: Record<string, string>;
      body?: any;
    };
    update?: {
      entity: string;
      id: string;
      fields: Record<string, any>;
    };
    create?: {
      entity: string;
      data: Record<string, any>;
    };
    delete?: {
      entity: string;
      id: string;
    };
    wait?: {
      duration: number; // em segundos
    };
    condition?: {
      field: string;
      operator: 'equals' | 'greater' | 'less' | 'contains' | 'exists';
      value: any;
      trueActions: string[];
      falseActions: string[];
    };
  };
  enabled: boolean;
  executionOrder: number;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: Trigger;
  actions: Action[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastExecuted?: Date;
  executionCount: number;
  successCount: number;
  failureCount: number;
  tags: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  variables?: Record<string, any>;
}

interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  triggerData?: any;
  actionResults: Array<{
    actionId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startedAt: Date;
    completedAt?: Date;
    result?: any;
    error?: string;
    retryCount: number;
  }>;
  variables: Record<string, any>;
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error' | 'debug';
    message: string;
    data?: any;
  }>;
}

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'push' | 'inapp' | 'social';
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  targetAudience: {
    segment: string;
    filters?: Record<string, any>;
    count?: number;
  };
  content: {
    subject?: string;
    title?: string;
    body: string;
    images?: string[];
    links?: Array<{
      url: string;
      text: string;
      tracking?: boolean;
    }>;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    timezone: string;
    frequency?: 'once' | 'daily' | 'weekly' | 'monthly';
  };
  metrics: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    converted: number;
    unsubscribed: number;
    bounced: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'greater' | 'less' | 'contains' | 'exists' | 'not_exists';
    value: any;
    logic?: 'AND' | 'OR';
  }>;
  actions: Action[];
  enabled: boolean;
  priority: number;
  executionCount: number;
  lastExecuted?: Date;
}

export function useAutomationSystem() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  const executionQueueRef = useRef<WorkflowExecution[]>([]);
  const activeExecutionsRef = useRef<Map<string, WorkflowExecution>>(new Map());

  // Carregar workflows
  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/automation/workflows');
      const data = await response.json();
      setWorkflows(data);
    } catch (error) {
      console.error('Erro ao carregar workflows:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Carregar execuções
  const loadExecutions = useCallback(async (workflowId?: string) => {
    try {
      const url = workflowId 
        ? `/api/automation/executions?workflowId=${workflowId}`
        : '/api/automation/executions';
      
      const response = await fetch(url);
      const data = await response.json();
      setExecutions(data);
    } catch (error) {
      console.error('Erro ao carregar execuções:', error);
    }
  }, []);

  // Carregar campanhas
  const loadCampaigns = useCallback(async () => {
    try {
      const response = await fetch('/api/automation/campaigns');
      const data = await response.json();
      setCampaigns(data);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    }
  }, []);

  // Carregar regras
  const loadRules = useCallback(async () => {
    try {
      const response = await fetch('/api/automation/rules');
      const data = await response.json();
      setRules(data);
    } catch (error) {
      console.error('Erro ao carregar regras:', error);
    }
  }, []);

  // Criar workflow
  const createWorkflow = useCallback(async (workflowData: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'executionCount' | 'successCount' | 'failureCount'>) => {
    try {
      const response = await fetch('/api/automation/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...workflowData,
          createdAt: new Date(),
          updatedAt: new Date(),
          executionCount: 0,
          successCount: 0,
          failureCount: 0
        })
      });

      const newWorkflow = await response.json();
      setWorkflows(prev => [newWorkflow, ...prev]);
      return newWorkflow;
    } catch (error) {
      console.error('Erro ao criar workflow:', error);
      return null;
    }
  }, []);

  // Atualizar workflow
  const updateWorkflow = useCallback(async (id: string, updates: Partial<Workflow>) => {
    try {
      const response = await fetch(`/api/automation/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          updatedAt: new Date()
        })
      });

      if (response.ok) {
        setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates, updatedAt: new Date() } : w));
        return true;
      }
    } catch (error) {
      console.error('Erro ao atualizar workflow:', error);
    }
    return false;
  }, []);

  // Deletar workflow
  const deleteWorkflow = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/automation/workflows/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setWorkflows(prev => prev.filter(w => w.id !== id));
        return true;
      }
    } catch (error) {
      console.error('Erro ao deletar workflow:', error);
    }
    return false;
  }, []);

  // Executar workflow
  const executeWorkflow = useCallback(async (workflowId: string, triggerData?: any) => {
    try {
      setIsExecuting(true);
      
      const workflow = workflows.find(w => w.id === workflowId);
      if (!workflow) {
        throw new Error('Workflow não encontrado');
      }

      // Criar execução
      const execution: WorkflowExecution = {
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        workflowId,
        status: 'pending',
        startedAt: new Date(),
        triggerData,
        actionResults: workflow.actions.map(action => ({
          actionId: action.id,
          status: 'pending',
          startedAt: new Date(),
          retryCount: 0
        })),
        variables: { ...workflow.variables },
        logs: []
      };

      setExecutions(prev => [execution, ...prev]);
      
      // Adicionar à fila de execução
      executionQueueRef.current.push(execution);
      
      // Processar execução
      await processExecution(execution);
      
      return execution;
    } catch (error) {
      console.error('Erro ao executar workflow:', error);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [workflows]);

  // Processar execução
  const processExecution = useCallback(async (execution: WorkflowExecution) => {
    const workflow = workflows.find(w => w.id === execution.workflowId);
    if (!workflow) return;

    activeExecutionsRef.current.set(execution.id, execution);
    execution.status = 'running';

    try {
      // Executar ações em ordem
      for (const action of workflow.actions.sort((a, b) => a.executionOrder - b.executionOrder)) {
        const actionResult = execution.actionResults.find(ar => ar.actionId === action.id);
        if (!actionResult) continue;

        actionResult.status = 'running';
        actionResult.startedAt = new Date();

        try {
          const result = await executeAction(action, execution.variables, execution.triggerData);
          
          actionResult.status = 'completed';
          actionResult.completedAt = new Date();
          actionResult.result = result;

          // Adicionar log
          execution.logs.push({
            timestamp: new Date(),
            level: 'info',
            message: `Ação ${action.name} executada com sucesso`,
            data: result
          });

        } catch (error) {
          actionResult.status = 'failed';
          actionResult.completedAt = new Date();
          actionResult.error = error instanceof Error ? error.message : 'Erro desconhecido';

          // Adicionar log de erro
          execution.logs.push({
            timestamp: new Date(),
            level: 'error',
            message: `Erro na ação ${action.name}: ${actionResult.error}`
          });

          // Retry se configurado
          if (actionResult.retryCount < (action.retryCount || 0)) {
            actionResult.retryCount++;
            actionResult.status = 'pending';
            
            // Aguardar antes de tentar novamente
            if (action.retryDelay) {
              await new Promise(resolve => setTimeout(resolve, action.retryDelay * 1000));
            }
          }
        }

        // Atualizar execução
        setExecutions(prev => prev.map(e => e.id === execution.id ? { ...execution } : e));
      }

      // Verificar se todas as ações foram concluídas
      const allCompleted = execution.actionResults.every(ar => ar.status === 'completed');
      const hasFailures = execution.actionResults.some(ar => ar.status === 'failed');

      execution.status = allCompleted ? 'completed' : hasFailures ? 'failed' : 'running';
      execution.completedAt = new Date();

      // Atualizar contadores do workflow
      if (execution.status === 'completed') {
        await updateWorkflow(workflow.id, {
          successCount: workflow.successCount + 1,
          lastExecuted: new Date()
        });
      } else if (execution.status === 'failed') {
        await updateWorkflow(workflow.id, {
          failureCount: workflow.failureCount + 1
        });
      }

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.logs.push({
        timestamp: new Date(),
        level: 'error',
        message: `Erro na execução: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      });
    } finally {
      activeExecutionsRef.current.delete(execution.id);
      setExecutions(prev => prev.map(e => e.id === execution.id ? execution : e));
    }
  }, [workflows, updateWorkflow]);

  // Executar ação individual
  const executeAction = useCallback(async (action: Action, variables: Record<string, any>, triggerData?: any): Promise<any> => {
    const config = action.config;

    switch (action.type) {
      case 'email':
        return await sendEmail(config.email!, variables, triggerData);
      
      case 'sms':
        return await sendSMS(config.sms!, variables, triggerData);
      
      case 'push':
        return await sendPushNotification(config.push!, variables, triggerData);
      
      case 'webhook':
        return await callWebhook(config.webhook!, variables, triggerData);
      
      case 'api':
        return await callAPI(config.api!, variables, triggerData);
      
      case 'update':
        return await updateEntity(config.update!, variables, triggerData);
      
      case 'create':
        return await createEntity(config.create!, variables, triggerData);
      
      case 'delete':
        return await deleteEntity(config.delete!, variables, triggerData);
      
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, config.wait!.duration * 1000));
        return { waited: config.wait!.duration };
      
      case 'condition':
        return await executeCondition(config.condition!, variables, triggerData);
      
      default:
        throw new Error(`Tipo de ação não suportado: ${action.type}`);
    }
  }, []);

  // Implementações das ações
  const sendEmail = async (emailConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar envio de email
    console.log('Enviando email:', emailConfig, variables, triggerData);
    return { sent: true, messageId: `msg_${Date.now()}` };
  };

  const sendSMS = async (smsConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar envio de SMS
    console.log('Enviando SMS:', smsConfig, variables, triggerData);
    return { sent: true, messageId: `sms_${Date.now()}` };
  };

  const sendPushNotification = async (pushConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar push notification
    console.log('Enviando push:', pushConfig, variables, triggerData);
    return { sent: true, messageId: `push_${Date.now()}` };
  };

  const callWebhook = async (webhookConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar chamada de webhook
    console.log('Chamando webhook:', webhookConfig, variables, triggerData);
    return { success: true, status: 200 };
  };

  const callAPI = async (apiConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar chamada de API
    console.log('Chamando API:', apiConfig, variables, triggerData);
    return { success: true, data: {} };
  };

  const updateEntity = async (updateConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar atualização de entidade
    console.log('Atualizando entidade:', updateConfig, variables, triggerData);
    return { updated: true, id: updateConfig.id };
  };

  const createEntity = async (createConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar criação de entidade
    console.log('Criando entidade:', createConfig, variables, triggerData);
    return { created: true, id: `new_${Date.now()}` };
  };

  const deleteEntity = async (deleteConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar exclusão de entidade
    console.log('Deletando entidade:', deleteConfig, variables, triggerData);
    return { deleted: true, id: deleteConfig.id };
  };

  const executeCondition = async (conditionConfig: any, variables: Record<string, any>, triggerData?: any) => {
    // Implementar lógica de condição
    console.log('Executando condição:', conditionConfig, variables, triggerData);
    return { condition: true, nextActions: conditionConfig.trueActions };
  };

  // Criar campanha
  const createCampaign = useCallback(async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
    try {
      const response = await fetch('/api/automation/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...campaignData,
          createdAt: new Date(),
          updatedAt: new Date(),
          metrics: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            converted: 0,
            unsubscribed: 0,
            bounced: 0
          }
        })
      });

      const newCampaign = await response.json();
      setCampaigns(prev => [newCampaign, ...prev]);
      return newCampaign;
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      return null;
    }
  }, []);

  // Executar campanha
  const executeCampaign = useCallback(async (campaignId: string) => {
    try {
      const response = await fetch(`/api/automation/campaigns/${campaignId}/execute`, {
        method: 'POST'
      });

      if (response.ok) {
        await loadCampaigns();
        return true;
      }
    } catch (error) {
      console.error('Erro ao executar campanha:', error);
    }
    return false;
  }, [loadCampaigns]);

  // Criar regra de automação
  const createRule = useCallback(async (ruleData: Omit<AutomationRule, 'id' | 'executionCount' | 'lastExecuted'>) => {
    try {
      const response = await fetch('/api/automation/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ruleData,
          executionCount: 0
        })
      });

      const newRule = await response.json();
      setRules(prev => [newRule, ...prev]);
      return newRule;
    } catch (error) {
      console.error('Erro ao criar regra:', error);
      return null;
    }
  }, []);

  // Executar regras
  const executeRules = useCallback(async (eventData: any) => {
    try {
      const response = await fetch('/api/automation/rules/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        await loadRules();
        return true;
      }
    } catch (error) {
      console.error('Erro ao executar regras:', error);
    }
    return false;
  }, [loadRules]);

  // Obter estatísticas
  const getStatistics = useCallback(() => {
    const totalWorkflows = workflows.length;
    const activeWorkflows = workflows.filter(w => w.enabled).length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'completed').length;
    const failedExecutions = executions.filter(e => e.status === 'failed').length;
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;

    return {
      totalWorkflows,
      activeWorkflows,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: Math.round(successRate * 100) / 100,
      activeExecutions: activeExecutionsRef.current.size,
      queuedExecutions: executionQueueRef.current.length
    };
  }, [workflows, executions]);

  // Inicializar dados
  useEffect(() => {
    loadWorkflows();
    loadExecutions();
    loadCampaigns();
    loadRules();
  }, [loadWorkflows, loadExecutions, loadCampaigns, loadRules]);

  return {
    // Estado
    workflows,
    executions,
    campaigns,
    rules,
    isLoading,
    isExecuting,
    
    // Ações
    loadWorkflows,
    loadExecutions,
    loadCampaigns,
    loadRules,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    createCampaign,
    executeCampaign,
    createRule,
    executeRules,
    
    // Utilitários
    getStatistics
  };
}
