import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Target, 
  Trophy, 
  TrendingUp, 
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Award,
  BarChart,
  DollarSign,
  Users,
  ShoppingCart,
  Building,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  name: string;
  type: 'revenue' | 'expense' | 'profit' | 'customers' | 'orders' | 'custom';
  target: number;
  current: number;
  unit: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed' | 'paused';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface FinancialGoalsProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
}

const FinancialGoals: React.FC<FinancialGoalsProps> = ({
  orders = [],
  suppliers = [],
  events = [],
  transactions = [],
  summary = {}
}) => {
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      name: 'Meta de Faturamento Mensal',
      type: 'revenue',
      target: 15000,
      current: 12350,
      unit: 'R$',
      period: 'monthly',
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 4, 31),
      status: 'active',
      priority: 'high',
      description: 'Meta de faturamento para maio de 2024',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '2',
      name: 'Redução de Despesas',
      type: 'expense',
      target: 5000,
      current: 5280,
      unit: 'R$',
      period: 'monthly',
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 4, 31),
      status: 'active',
      priority: 'medium',
      description: 'Manter despesas abaixo de R$ 5.000',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '3',
      name: 'Novos Clientes',
      type: 'customers',
      target: 50,
      current: 32,
      unit: 'clientes',
      period: 'monthly',
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 4, 31),
      status: 'active',
      priority: 'high',
      description: 'Captar 50 novos clientes este mês',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '4',
      name: 'Lucro Líquido',
      type: 'profit',
      target: 8000,
      current: 7070,
      unit: 'R$',
      period: 'monthly',
      startDate: new Date(2024, 4, 1),
      endDate: new Date(2024, 4, 31),
      status: 'active',
      priority: 'critical',
      description: 'Meta de lucro líquido mensal',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]);

  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('all');

  // Atualizar progresso das metas
  useEffect(() => {
    setGoals(prevGoals => 
      prevGoals.map(goal => {
        let current = goal.current;
        
        switch (goal.type) {
          case 'revenue':
            current = summary?.totalRevenue || 0;
            break;
          case 'expense':
            current = summary?.totalExpenses || 0;
            break;
          case 'profit':
            current = summary?.netProfit || 0;
            break;
          case 'customers':
            current = orders.filter(order => 
              new Date(order.created_at) >= goal.startDate
            ).length;
            break;
          case 'orders':
            current = orders.length;
            break;
        }

        const percentage = (current / goal.target) * 100;
        let status = goal.status;
        
        if (goal.status === 'active') {
          if (percentage >= 100) {
            status = 'completed';
          } else if (new Date() > goal.endDate && percentage < 80) {
            status = 'failed';
          }
        }

        return {
          ...goal,
          current,
          status,
          updatedAt: new Date()
        };
      })
    );
  }, [summary, orders, suppliers, events, transactions]);

  const getGoalIcon = (type: string) => {
    switch (type) {
      case 'revenue':
        return <DollarSign className="h-4 w-4" />;
      case 'expense':
        return <TrendingDown className="h-4 w-4" />;
      case 'profit':
        return <Trophy className="h-4 w-4" />;
      case 'customers':
        return <Users className="h-4 w-4" />;
      case 'orders':
        return <ShoppingCart className="h-4 w-4" />;
      case 'custom':
        return <Target className="h-4 w-4" />;
      default:
        return <BarChart className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'paused':
        return 'text-yellow-600 bg-yellow-100';
      case 'active':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredGoals = goals.filter(goal => {
    if (selectedPeriod === 'all') return true;
    return goal.period === selectedPeriod;
  });

  const completedGoals = goals.filter(goal => goal.status === 'completed').length;
  const activeGoals = goals.filter(goal => goal.status === 'active').length;
  const failedGoals = goals.filter(goal => goal.status === 'failed').length;
  const totalGoals = goals.length;

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalModal(true);
  };

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setShowGoalModal(true);
  };

  const handleDeleteGoal = (goalId: string) => {
    setGoals(prev => prev.filter(goal => goal.id !== goalId));
  };

  const GoalCard = ({ goal }: { goal: Goal }) => {
    const percentage = Math.min((goal.current / goal.target) * 100, 100);
    const daysRemaining = Math.ceil((goal.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    return (
      <Card className="relative">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {getGoalIcon(goal.type)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{goal.name}</h3>
                <p className="text-sm text-gray-600">{goal.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(goal.status)}>
                {goal.status === 'completed' ? 'Concluída' :
                 goal.status === 'failed' ? 'Falhou' :
                 goal.status === 'paused' ? 'Pausada' : 'Ativa'}
              </Badge>
              <Badge variant="outline" className={getPriorityColor(goal.priority)}>
                {goal.priority === 'critical' ? 'Crítica' :
                 goal.priority === 'high' ? 'Alta' :
                 goal.priority === 'medium' ? 'Média' : 'Baixa'}
              </Badge>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Progresso</span>
              <span className="text-sm font-medium">
                {goal.current.toLocaleString('pt-BR')}{goal.unit} / {goal.target.toLocaleString('pt-BR')}{goal.unit}
              </span>
            </div>
            
            <Progress value={percentage} className="h-3" />
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">{percentage.toFixed(1)}% concluído</span>
              <span className="text-gray-600">{daysRemaining} dias restantes</span>
            </div>

            {goal.status === 'active' && percentage >= 90 && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700">
                  Meta quase atingida! Falta apenas {((goal.target - goal.current) / goal.target * 100).toFixed(1)}%
                </span>
              </div>
            )}

            {goal.status === 'failed' && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  Meta não foi atingida no prazo
                </span>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <CalendarIcon className="h-3 w-3" />
                <span>
                  {format(goal.startDate, 'dd/MM', { locale: ptBR })} - {format(goal.endDate, 'dd/MM', { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEditGoal(goal)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Metas e KPIs Financeiros</h2>
          <p className="text-gray-600">Defina e acompanhe suas metas financeiras</p>
        </div>
        <Button onClick={handleCreateGoal} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {/* Resumo das Metas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Metas</p>
                <p className="text-2xl font-bold">{totalGoals}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{activeGoals}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Falharam</p>
                <p className="text-2xl font-bold text-red-600">{failedGoals}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Label htmlFor="period-filter">Filtrar por período:</Label>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="daily">Diário</SelectItem>
            <SelectItem value="weekly">Semanal</SelectItem>
            <SelectItem value="monthly">Mensal</SelectItem>
            <SelectItem value="quarterly">Trimestral</SelectItem>
            <SelectItem value="yearly">Anual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Metas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGoals.map(goal => (
          <GoalCard key={goal.id} goal={goal} />
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma meta encontrada
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedPeriod === 'all' 
                ? 'Crie sua primeira meta financeira para começar a acompanhar seu progresso.'
                : `Nenhuma meta com período ${selectedPeriod} foi encontrada.`
              }
            </p>
            <Button onClick={handleCreateGoal} className="bg-orange-500 hover:bg-orange-600">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialGoals;
