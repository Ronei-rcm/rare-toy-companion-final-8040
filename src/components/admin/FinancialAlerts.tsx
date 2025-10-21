import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertTriangle, 
  Bell, 
  BellOff, 
  DollarSign, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  Settings
} from 'lucide-react';

interface FinancialAlertsProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
}

interface AlertRule {
  id: string;
  name: string;
  type: 'threshold' | 'deadline' | 'trend' | 'custom';
  condition: string;
  value: number;
  enabled: boolean;
  lastTriggered?: Date;
  frequency: 'realtime' | 'daily' | 'weekly' | 'monthly';
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

const FinancialAlerts: React.FC<FinancialAlertsProps> = ({
  orders,
  suppliers,
  events,
  transactions,
  summary
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'Baixo Faturamento',
      type: 'threshold',
      condition: 'below',
      value: 5000,
      enabled: true,
      frequency: 'daily'
    },
    {
      id: '2',
      name: 'Alto Gasto com Fornecedores',
      type: 'threshold',
      condition: 'above',
      value: 3000,
      enabled: true,
      frequency: 'daily'
    },
    {
      id: '3',
      name: 'Transações Atrasadas',
      type: 'deadline',
      condition: 'overdue',
      value: 0,
      enabled: true,
      frequency: 'realtime'
    },
    {
      id: '4',
      name: 'Meta de Lucro',
      type: 'threshold',
      condition: 'below',
      value: 2000,
      enabled: true,
      frequency: 'weekly'
    }
  ]);
  const [showSettings, setShowSettings] = useState(false);

  // Função para verificar alertas
  const checkAlerts = () => {
    const newAlerts: Alert[] = [];

    alertRules.forEach(rule => {
      if (!rule.enabled) return;

      switch (rule.type) {
        case 'threshold':
          if (rule.name === 'Baixo Faturamento') {
            const revenue = summary?.totalRevenue || 0;
            if (rule.condition === 'below' && revenue < rule.value) {
              newAlerts.push({
                id: `alert-${Date.now()}-${rule.id}`,
                type: 'warning',
                title: 'Faturamento Baixo',
                message: `Faturamento atual (R$ ${revenue.toLocaleString('pt-BR')}) está abaixo da meta de R$ ${rule.value.toLocaleString('pt-BR')}`,
                timestamp: new Date(),
                acknowledged: false,
                priority: 'medium'
              });
            }
          }
          
          if (rule.name === 'Alto Gasto com Fornecedores') {
            const expenses = summary?.totalExpenses || 0;
            if (rule.condition === 'above' && expenses > rule.value) {
              newAlerts.push({
                id: `alert-${Date.now()}-${rule.id}`,
                type: 'error',
                title: 'Gastos Elevados',
                message: `Gastos com fornecedores (R$ ${expenses.toLocaleString('pt-BR')}) estão acima do limite de R$ ${rule.value.toLocaleString('pt-BR')}`,
                timestamp: new Date(),
                acknowledged: false,
                priority: 'high'
              });
            }
          }

          if (rule.name === 'Meta de Lucro') {
            const profit = summary?.netProfit || 0;
            if (rule.condition === 'below' && profit < rule.value) {
              newAlerts.push({
                id: `alert-${Date.now()}-${rule.id}`,
                type: 'warning',
                title: 'Meta de Lucro Não Atingida',
                message: `Lucro atual (R$ ${profit.toLocaleString('pt-BR')}) está abaixo da meta de R$ ${rule.value.toLocaleString('pt-BR')}`,
                timestamp: new Date(),
                acknowledged: false,
                priority: 'medium'
              });
            }
          }
          break;

        case 'deadline':
          if (rule.name === 'Transações Atrasadas') {
            const overdueTransactions = transactions.filter(t => 
              t.status === 'Atrasado' || 
              (t.status === 'Pendente' && new Date(t.data) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            );
            
            if (overdueTransactions.length > 0) {
              newAlerts.push({
                id: `alert-${Date.now()}-${rule.id}`,
                type: 'error',
                title: 'Transações Atrasadas',
                message: `${overdueTransactions.length} transação(ões) estão atrasadas ou pendentes há mais de 7 dias`,
                timestamp: new Date(),
                acknowledged: false,
                priority: 'high'
              });
            }
          }
          break;
      }
    });

    // Adicionar alertas de tendências
    const recentTransactions = transactions.filter(t => 
      new Date(t.data) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    const revenueTrend = recentTransactions
      .filter(t => t.tipo === 'Entrada')
      .reduce((sum, t) => sum + t.valor, 0);
    
    const expenseTrend = recentTransactions
      .filter(t => t.tipo === 'Saída')
      .reduce((sum, t) => sum + t.valor, 0);

    if (expenseTrend > revenueTrend * 0.8) {
      newAlerts.push({
        id: `alert-trend-${Date.now()}`,
        type: 'warning',
        title: 'Alto Gasto Recente',
        message: `Gastos dos últimos 7 dias (R$ ${expenseTrend.toLocaleString('pt-BR')}) representam ${((expenseTrend / revenueTrend) * 100).toFixed(1)}% das receitas`,
        timestamp: new Date(),
        acknowledged: false,
        priority: 'medium'
      });
    }

    setAlerts(prev => [...newAlerts, ...prev]);
  };

  // Verificar alertas periodicamente
  useEffect(() => {
    checkAlerts();
    const interval = setInterval(checkAlerts, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [orders, suppliers, events, transactions, summary, alertRules]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  };

  const dismissAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const toggleAlertRule = (ruleId: string) => {
    setAlertRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, enabled: !rule.enabled }
          : rule
      )
    );
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = unacknowledgedAlerts.filter(alert => alert.priority === 'critical');

  return (
    <div className="space-y-6">
      {/* Resumo de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Alertas</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <Bell className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Visualizados</p>
                <p className="text-2xl font-bold">{unacknowledgedAlerts.length}</p>
              </div>
              <BellOff className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticos</p>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Alertas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Alertas Financeiros
              </CardTitle>
              <CardDescription>
                Notificações e alertas sobre a saúde financeira da empresa
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showSettings && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-semibold mb-4">Regras de Alertas</h3>
              <div className="space-y-3">
                {alertRules.map(rule => (
                  <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={rule.id} className="font-medium">
                          {rule.name}
                        </Label>
                        <Badge variant="outline" className="text-xs">
                          {rule.frequency}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {rule.condition === 'below' ? 'Abaixo de' : 'Acima de'} R$ {rule.value.toLocaleString('pt-BR')}
                      </p>
                    </div>
                    <Switch
                      id={rule.id}
                      checked={rule.enabled}
                      onCheckedChange={() => toggleAlertRule(rule.id)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            {alerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Nenhum alerta ativo</p>
                <p className="text-sm">Tudo está funcionando normalmente</p>
              </div>
            ) : (
              alerts.map(alert => (
                <Alert 
                  key={alert.id} 
                  className={`${alert.acknowledged ? 'opacity-60' : ''} ${getPriorityColor(alert.priority)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{alert.title}</h4>
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPriorityColor(alert.priority)}`}
                          >
                            {alert.priority}
                          </Badge>
                        </div>
                        <AlertDescription className="text-sm">
                          {alert.message}
                        </AlertDescription>
                        <p className="text-xs text-gray-500 mt-1">
                          {alert.timestamp.toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {!alert.acknowledged && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => acknowledgeAlert(alert.id)}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Visualizar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <XCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialAlerts;
