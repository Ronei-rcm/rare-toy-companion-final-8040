import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Settings, 
  Bell, 
  Shield, 
  Target, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  Calendar,
  User,
  Building,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Eye,
  Edit,
  Trash2,
  Plus,
  Brain,
  Sparkles,
  Activity,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  Upload,
  RefreshCw,
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'alert' | 'action' | 'report' | 'sync';
  status: 'active' | 'inactive' | 'error';
  trigger: {
    condition: string;
    value: number | string;
    operator: 'greater' | 'less' | 'equal' | 'contains';
  };
  action: {
    type: string;
    target: string;
    message?: string;
  };
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
  lastExecuted?: string;
  executionCount: number;
  successRate: number;
}

interface SmartAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  category: 'revenue' | 'expense' | 'cashflow' | 'profit' | 'trend';
  timestamp: string;
  actionable: boolean;
  action?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  resolved: boolean;
}

interface FinancialAutomationProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
}

const FinancialAutomation: React.FC<FinancialAutomationProps> = ({
  orders,
  suppliers,
  events,
  transactions,
  summary
}) => {
  const [automationRules, setAutomationRules] = useState<AutomationRule[]>([]);
  const [smartAlerts, setSmartAlerts] = useState<SmartAlert[]>([]);
  const [activeTab, setActiveTab] = useState('rules');
  const [isCreatingRule, setIsCreatingRule] = useState(false);

  // Dados simulados para demonstração
  useEffect(() => {
    // Regras de automação pré-configuradas
    const defaultRules: AutomationRule[] = [
      {
        id: '1',
        name: 'Alerta de Margem Baixa',
        description: 'Notifica quando a margem de lucro cair abaixo de 15%',
        type: 'alert',
        status: 'active',
        trigger: {
          condition: 'profit_margin',
          value: 15,
          operator: 'less'
        },
        action: {
          type: 'notification',
          target: 'admin',
          message: 'Margem de lucro está abaixo do recomendado!'
        },
        frequency: 'realtime',
        lastExecuted: new Date().toISOString(),
        executionCount: 12,
        successRate: 100
      },
      {
        id: '2',
        name: 'Relatório Semanal Automático',
        description: 'Gera e envia relatório financeiro semanal por email',
        type: 'report',
        status: 'active',
        trigger: {
          condition: 'time',
          value: 'weekly',
          operator: 'equal'
        },
        action: {
          type: 'email_report',
          target: 'admin@muhlstore.com',
          message: 'Relatório semanal anexado'
        },
        frequency: 'weekly',
        lastExecuted: new Date(Date.now() - 86400000).toISOString(),
        executionCount: 8,
        successRate: 100
      },
      {
        id: '3',
        name: 'Backup Automático de Transações',
        description: 'Faz backup diário de todas as transações financeiras',
        type: 'sync',
        status: 'active',
        trigger: {
          condition: 'time',
          value: 'daily',
          operator: 'equal'
        },
        action: {
          type: 'backup',
          target: 'cloud_storage'
        },
        frequency: 'daily',
        lastExecuted: new Date().toISOString(),
        executionCount: 30,
        successRate: 100
      },
      {
        id: '4',
        name: 'Alerta de Receita Excepcional',
        description: 'Notifica quando a receita diária ultrapassar R$ 2.000',
        type: 'alert',
        status: 'inactive',
        trigger: {
          condition: 'daily_revenue',
          value: 2000,
          operator: 'greater'
        },
        action: {
          type: 'notification',
          target: 'admin',
          message: 'Receita excepcional hoje! Parabéns! 🎉'
        },
        frequency: 'realtime',
        lastExecuted: new Date(Date.now() - 172800000).toISOString(),
        executionCount: 3,
        successRate: 100
      }
    ];

    // Alertas inteligentes simulados
    const defaultAlerts: SmartAlert[] = [
      {
        id: '1',
        title: 'Crescimento de Receita Detectado',
        message: 'Sua receita cresceu 18.5% este mês comparado ao anterior. Excelente trabalho!',
        type: 'success',
        category: 'revenue',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        actionable: true,
        action: 'Considere aumentar o investimento em marketing para acelerar o crescimento.',
        priority: 'medium',
        resolved: false
      },
      {
        id: '2',
        title: 'Concentração de Fornecedores',
        message: '60% dos seus gastos estão concentrados em apenas 2 fornecedores. Isso pode representar um risco.',
        type: 'warning',
        category: 'expense',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        actionable: true,
        action: 'Diversifique seus fornecedores para reduzir dependência e riscos.',
        priority: 'high',
        resolved: false
      },
      {
        id: '3',
        title: 'Oportunidade de Economia',
        message: 'Identificamos que você pode economizar até R$ 500/mês otimizando contratos de fornecedores.',
        type: 'info',
        category: 'expense',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        actionable: true,
        action: 'Revisar contratos atuais e negociar melhores condições.',
        priority: 'medium',
        resolved: false
      },
      {
        id: '4',
        title: 'Meta Mensal Atingida',
        message: 'Parabéns! Você atingiu 105% da meta de receita para este mês.',
        type: 'success',
        category: 'revenue',
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        actionable: false,
        priority: 'low',
        resolved: true
      }
    ];

    setAutomationRules(defaultRules);
    setSmartAlerts(defaultAlerts);
  }, []);

  const toggleRuleStatus = (ruleId: string) => {
    setAutomationRules(rules => 
      rules.map(rule => 
        rule.id === ruleId 
          ? { ...rule, status: rule.status === 'active' ? 'inactive' : 'active' }
          : rule
      )
    );
  };

  const deleteRule = (ruleId: string) => {
    setAutomationRules(rules => rules.filter(rule => rule.id !== ruleId));
    toast.success('Regra de automação removida com sucesso');
  };

  const resolveAlert = (alertId: string) => {
    setSmartAlerts(alerts => 
      alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
    toast.success('Alerta resolvido');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-green-700 bg-green-100 border-green-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'critical': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'info': return <Info className="h-5 w-5 text-blue-600" />;
      default: return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-600" />
            Automações Financeiras IA
          </h2>
          <p className="text-muted-foreground">
            Regras inteligentes e alertas automatizados para otimizar sua gestão financeira
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => setIsCreatingRule(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{automationRules.length}</div>
                <div className="text-sm text-muted-foreground">Regras Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {automationRules.filter(r => r.status === 'active').length}
                </div>
                <div className="text-sm text-muted-foreground">Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {smartAlerts.filter(a => !a.resolved).length}
                </div>
                <div className="text-sm text-muted-foreground">Alertas Ativos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Activity className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">98%</div>
                <div className="text-sm text-muted-foreground">Taxa de Sucesso</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="rules">Regras de Automação</TabsTrigger>
          <TabsTrigger value="alerts">Alertas Inteligentes</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Regras de Automação */}
        <TabsContent value="rules" className="space-y-4">
          <div className="grid gap-4">
            {automationRules.map((rule, index) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 ${getStatusColor(rule.status)}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Settings className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{rule.name}</h3>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getStatusColor(rule.status)}>
                          {rule.status === 'active' ? 'Ativa' : 
                           rule.status === 'inactive' ? 'Inativa' : 'Erro'}
                        </Badge>
                        
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={() => toggleRuleStatus(rule.id)}
                        />
                        
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Trigger</Label>
                        <div className="text-sm font-medium">
                          {rule.trigger.condition === 'profit_margin' && 'Margem de Lucro'}
                          {rule.trigger.condition === 'daily_revenue' && 'Receita Diária'}
                          {rule.trigger.condition === 'time' && 'Tempo'}
                          {' '}
                          {rule.trigger.operator === 'less' && '<'}
                          {rule.trigger.operator === 'greater' && '>'}
                          {rule.trigger.operator === 'equal' && '='}
                          {' '}
                          {typeof rule.trigger.value === 'number' 
                            ? `R$ ${rule.trigger.value.toLocaleString('pt-BR')}`
                            : rule.trigger.value
                          }
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Ação</Label>
                        <div className="text-sm font-medium">
                          {rule.action.type === 'notification' && 'Notificação'}
                          {rule.action.type === 'email_report' && 'Relatório por Email'}
                          {rule.action.type === 'backup' && 'Backup Automático'}
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">Execuções</Label>
                        <div className="text-sm font-medium">
                          {rule.executionCount} vezes ({rule.successRate}% sucesso)
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Alertas Inteligentes */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid gap-4">
            {smartAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`border-2 ${getAlertTypeColor(alert.type)} ${
                  alert.resolved ? 'opacity-60' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getAlertIcon(alert.type)}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{alert.title}</h3>
                            <Badge variant="outline" className={getPriorityColor(alert.priority)}>
                              {alert.priority === 'urgent' ? 'Urgente' :
                               alert.priority === 'high' ? 'Alta' :
                               alert.priority === 'medium' ? 'Média' : 'Baixa'}
                            </Badge>
                            {alert.resolved && (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                Resolvido
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          {alert.actionable && alert.action && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-start gap-2">
                                <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div>
                                  <p className="text-sm font-medium text-blue-800">Recomendação:</p>
                                  <p className="text-sm text-blue-700">{alert.action}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {!alert.resolved && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolver
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>
                        {new Date(alert.timestamp).toLocaleString('pt-BR')}
                      </span>
                      <span>
                        Categoria: {alert.category}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Performance das Automações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de Sucesso Geral</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      98.5%
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.5%' }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Execuções Este Mês</span>
                    <span className="text-sm font-medium">1,247</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tempo Médio de Execução</span>
                    <span className="text-sm font-medium">2.3s</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Tipos de Alertas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Sucesso</span>
                    </div>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Avisos</span>
                    </div>
                    <span className="text-sm font-medium">30%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Informações</span>
                    </div>
                    <span className="text-sm font-medium">20%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-sm">Críticos</span>
                    </div>
                    <span className="text-sm font-medium">5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAutomation;
