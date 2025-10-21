import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Copy,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  TrendingUp,
  Users,
  Mail,
  MessageSquare,
  Bell,
  Globe,
  Database,
  Timer,
  Filter,
  Search,
  Calendar,
  Target,
  Workflow,
  Layers,
  GitBranch,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Upload,
  Save,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAutomationSystem } from '@/hooks/useAutomationSystem';
import { toast } from 'sonner';

export function AutomationDashboard() {
  const [activeTab, setActiveTab] = useState('workflows');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExecutionLogs, setShowExecutionLogs] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [expandedWorkflows, setExpandedWorkflows] = useState<Set<string>>(new Set());
  
  const {
    workflows,
    executions,
    campaigns,
    rules,
    isLoading,
    isExecuting,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    executeWorkflow,
    createCampaign,
    executeCampaign,
    getStatistics
  } = useAutomationSystem();

  const statistics = getStatistics();

  const handleCreateWorkflow = async () => {
    const newWorkflow = await createWorkflow({
      name: 'Novo Workflow',
      description: 'Workflow criado automaticamente',
      trigger: {
        id: `trigger_${Date.now()}`,
        name: 'Trigger Manual',
        type: 'event',
        config: { event: 'manual' },
        enabled: true,
        triggerCount: 0
      },
      actions: [],
      enabled: false,
      tags: [],
      priority: 'medium'
    });

    if (newWorkflow) {
      toast.success('Workflow criado com sucesso!');
      setShowCreateDialog(false);
    } else {
      toast.error('Erro ao criar workflow');
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    const result = await executeWorkflow(workflowId);
    if (result) {
      toast.success('Workflow executado com sucesso!');
    } else {
      toast.error('Erro ao executar workflow');
    }
  };

  const handleToggleWorkflow = async (workflowId: string, enabled: boolean) => {
    const result = await updateWorkflow(workflowId, { enabled });
    if (result) {
      toast.success(`Workflow ${enabled ? 'ativado' : 'desativado'} com sucesso!`);
    } else {
      toast.error('Erro ao atualizar workflow');
    }
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (confirm('Tem certeza que deseja deletar este workflow?')) {
      const result = await deleteWorkflow(workflowId);
      if (result) {
        toast.success('Workflow deletado com sucesso!');
      } else {
        toast.error('Erro ao deletar workflow');
      }
    }
  };

  const toggleWorkflowExpansion = (workflowId: string) => {
    setExpandedWorkflows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workflowId)) {
        newSet.delete(workflowId);
      } else {
        newSet.add(workflowId);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Automação Inteligente</h1>
          <p className="text-gray-600 mt-1">Gerencie workflows, campanhas e regras de automação</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowExecutionLogs(true)}
          >
            <Activity className="w-4 h-4 mr-2" />
            Logs
          </Button>
          
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Workflow
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Workflows</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalWorkflows}</p>
                <p className="text-xs text-green-600">{statistics.activeWorkflows} ativos</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Workflow className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Execuções</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalExecutions}</p>
                <p className="text-xs text-blue-600">{statistics.activeExecutions} em execução</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Activity className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Sucesso</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.successRate}%</p>
                <p className="text-xs text-green-600">{statistics.successfulExecutions} sucessos</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Campanhas</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
                <p className="text-xs text-orange-600">{campaigns.filter(c => c.status === 'running').length} ativas</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="rules">Regras</TabsTrigger>
          <TabsTrigger value="executions">Execuções</TabsTrigger>
        </TabsList>

        {/* Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Workflows de Automação</h3>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar workflows..." className="w-64" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                  <SelectItem value="critical">Críticos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Carregando workflows...</span>
              </div>
            ) : (
              workflows.map((workflow) => (
                <motion.div
                  key={workflow.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="text-lg font-semibold">{workflow.name}</h4>
                            <Badge className={getPriorityColor(workflow.priority)}>
                              {workflow.priority}
                            </Badge>
                            <Badge variant={workflow.enabled ? "default" : "secondary"}>
                              {workflow.enabled ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                          
                          <p className="text-gray-600 mb-4">{workflow.description}</p>
                          
                          <div className="flex items-center gap-6 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              <span>{workflow.executionCount} execuções</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span>{workflow.successCount} sucessos</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="w-4 h-4 text-red-500" />
                              <span>{workflow.failureCount} falhas</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Layers className="w-4 h-4" />
                              <span>{workflow.actions.length} ações</span>
                            </div>
                          </div>

                          {workflow.lastExecuted && (
                            <div className="mt-2 text-sm text-gray-500">
                              Última execução: {new Date(workflow.lastExecuted).toLocaleString('pt-BR')}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWorkflowExpansion(workflow.id)}
                          >
                            {expandedWorkflows.has(workflow.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                            disabled={isExecuting}
                          >
                            <Play className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleWorkflow(workflow.id, !workflow.enabled)}
                          >
                            {workflow.enabled ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteWorkflow(workflow.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Detalhes expandidos */}
                      <AnimatePresence>
                        {expandedWorkflows.has(workflow.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t"
                          >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Trigger */}
                              <div>
                                <h5 className="font-semibold mb-2 flex items-center gap-2">
                                  <Zap className="w-4 h-4" />
                                  Trigger
                                </h5>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{workflow.trigger.name}</span>
                                    <Badge variant="outline">{workflow.trigger.type}</Badge>
                                  </div>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {workflow.trigger.triggerCount} execuções
                                  </p>
                                </div>
                              </div>

                              {/* Actions */}
                              <div>
                                <h5 className="font-semibold mb-2 flex items-center gap-2">
                                  <GitBranch className="w-4 h-4" />
                                  Ações ({workflow.actions.length})
                                </h5>
                                <div className="space-y-2">
                                  {workflow.actions.map((action, index) => (
                                    <div key={action.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                      <span className="text-sm font-medium">{index + 1}.</span>
                                      <span className="text-sm">{action.name}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {action.type}
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Tags */}
                            {workflow.tags.length > 0 && (
                              <div className="mt-4">
                                <h5 className="font-semibold mb-2">Tags</h5>
                                <div className="flex flex-wrap gap-2">
                                  {workflow.tags.map((tag) => (
                                    <Badge key={tag} variant="secondary">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Campanhas */}
        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Campanhas de Marketing</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{campaign.name}</CardTitle>
                    <Badge variant={campaign.status === 'running' ? 'default' : 'secondary'}>
                      {campaign.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      {campaign.type === 'email' && <Mail className="w-4 h-4 text-blue-500" />}
                      {campaign.type === 'sms' && <MessageSquare className="w-4 h-4 text-green-500" />}
                      {campaign.type === 'push' && <Bell className="w-4 h-4 text-purple-500" />}
                      {campaign.type === 'social' && <Globe className="w-4 h-4 text-orange-500" />}
                      <span className="capitalize">{campaign.type}</span>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <p>Início: {new Date(campaign.schedule.startDate).toLocaleDateString('pt-BR')}</p>
                      <p>Público: {campaign.targetAudience.count || 'N/A'} usuários</p>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Taxa de Abertura</span>
                        <span>{campaign.metrics.sent > 0 ? Math.round((campaign.metrics.opened / campaign.metrics.sent) * 100) : 0}%</span>
                      </div>
                      <Progress 
                        value={campaign.metrics.sent > 0 ? (campaign.metrics.opened / campaign.metrics.sent) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button size="sm" className="flex-1">
                        <Play className="w-4 h-4 mr-1" />
                        Executar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Regras */}
        <TabsContent value="rules" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Regras de Automação</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="space-y-4">
            {rules.map((rule) => (
              <Card key={rule.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold">{rule.name}</h4>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "Ativo" : "Inativo"}
                        </Badge>
                        <Badge variant="outline">
                          Prioridade: {rule.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{rule.description}</p>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Activity className="w-4 h-4" />
                          <span>{rule.executionCount} execuções</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Layers className="w-4 h-4" />
                          <span>{rule.conditions.length} condições</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GitBranch className="w-4 h-4" />
                          <span>{rule.actions.length} ações</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Execuções */}
        <TabsContent value="executions" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Histórico de Execuções</h3>
            <div className="flex items-center gap-2">
              <Input placeholder="Buscar execuções..." className="w-64" />
              <Select>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="completed">Concluídas</SelectItem>
                  <SelectItem value="failed">Falharam</SelectItem>
                  <SelectItem value="running">Em execução</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            {executions.slice(0, 20).map((execution) => (
              <Card key={execution.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(execution.status)}
                      <div>
                        <h4 className="font-semibold">
                          Execução #{execution.id.slice(-8)}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Workflow: {workflows.find(w => w.id === execution.workflowId)?.name || 'N/A'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-gray-600">
                        <p>Início: {new Date(execution.startedAt).toLocaleString('pt-BR')}</p>
                        {execution.completedAt && (
                          <p>Duração: {Math.round((execution.completedAt.getTime() - execution.startedAt.getTime()) / 1000)}s</p>
                        )}
                      </div>
                      
                      <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}>
                        {execution.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress das ações */}
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progresso das Ações</span>
                      <span>
                        {execution.actionResults.filter(ar => ar.status === 'completed').length} / {execution.actionResults.length}
                      </span>
                    </div>
                    <Progress 
                      value={(execution.actionResults.filter(ar => ar.status === 'completed').length / execution.actionResults.length) * 100} 
                      className="h-2" 
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para criar workflow */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Workflow</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nome do Workflow</label>
              <Input placeholder="Ex: Recuperação de Carrinho Abandonado" />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Descrição</label>
              <Textarea placeholder="Descreva o que este workflow faz..." rows={3} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Prioridade</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="critical">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Trigger</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="schedule">Agendamento</SelectItem>
                    <SelectItem value="condition">Condição</SelectItem>
                    <SelectItem value="webhook">Webhook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateWorkflow}>
                <Plus className="w-4 h-4 mr-2" />
                Criar Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
