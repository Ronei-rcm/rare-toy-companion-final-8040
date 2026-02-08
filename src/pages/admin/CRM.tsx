import React, { useState, useEffect } from 'react';
import { request } from '@/services/api-config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Edit,
  Star,
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Settings,
  Crown,
  Tag,
  Plus,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CustomerProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'blocked' | 'vip';
  source: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  created_at: string;
  tags: string[];
  loyalty?: any;
}

interface CustomerSegment {
  id: string;
  name: string;
  description: string;
  color: string;
  customer_count: number;
  criteria: any;
}

interface CustomerInteraction {
  id: string;
  interaction_type: 'email' | 'phone' | 'chat' | 'meeting' | 'support' | 'purchase' | 'review' | 'complaint' | 'compliment' | 'other';
  subject: string;
  description: string;
  outcome: 'resolved' | 'pending' | 'escalated' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
}

interface CustomerTask {
  id: string;
  title: string;
  description: string;
  task_type: 'follow_up' | 'call' | 'email' | 'meeting' | 'proposal' | 'contract' | 'payment' | 'delivery' | 'support' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  due_date: string;
  created_at: string;
}

const CRM: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);
  const [interactions, setInteractions] = useState<CustomerInteraction[]>([]);
  const [tasks, setTasks] = useState<CustomerTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSegment, setFilterSegment] = useState('all');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Formulário de nova tarefa
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    task_type: 'follow_up' as const,
    priority: 'medium' as const,
    due_date: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadCustomers(),
        loadSegments()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await request<any>('/crm/customers');
      if (data.success) {
        setCustomers(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadSegments = async () => {
    try {
      const data = await request<any>('/crm/segments');
      if (data.success) {
        setSegments(data.data);
      }
    } catch (error) {
      console.error('Erro ao carregar segmentos:', error);
    }
  };

  const loadCustomerDetails = async (customerId: string) => {
    try {
      const [profileData, interactionsData, tasksData] = await Promise.all([
        request<any>(`/crm/customers/${customerId}`),
        request<any>(`/crm/customers/${customerId}/interactions`),
        request<any>(`/crm/customers/${customerId}/tasks`)
      ]);

      if (profileData.success) {
        setSelectedCustomer(profileData.data);
      }
      if (interactionsData.success) {
        setInteractions(interactionsData.data);
      }
      if (tasksData.success) {
        setTasks(tasksData.data);
      }
    } catch (error) {
      console.error('Erro ao carregar detalhes do cliente:', error);
    }
  };

  const createTask = async () => {
    if (!selectedCustomer) return;

    try {
      const data = await request<any>('/crm/tasks', {
        method: 'POST',
        body: JSON.stringify({
          customer_id: selectedCustomer.id,
          ...newTask
        })
      });

      if (data.success) {
        setShowTaskModal(false);
        setNewTask({
          title: '',
          description: '',
          task_type: 'follow_up',
          priority: 'medium',
          due_date: ''
        });
        loadCustomerDetails(selectedCustomer.id);
      }
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      await request(`/crm/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      loadCustomerDetails(selectedCustomer!.id);
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
    }
  };

  const markAsVIP = async (customerId: string) => {
    try {
      await request(`/crm/customers/${customerId}/vip`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Cliente de alto valor' })
      });

      loadCustomers();
      if (selectedCustomer?.id === customerId) {
        loadCustomerDetails(customerId);
      }
    } catch (error) {
      console.error('Erro ao marcar como VIP:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'vip':
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case 'inactive':
        return <Clock className="w-4 h-4 text-gray-600" />;
      case 'blocked':
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <Users className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'vip':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'blocked':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'vip':
        return 'VIP';
      case 'inactive':
        return 'Inativo';
      case 'blocked':
        return 'Bloqueado';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(parseISO(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch =
      customer.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || customer.status === filterStatus;
    const matchesSegment = filterSegment === 'all' || customer.tags.includes(filterSegment);

    return matchesSearch && matchesStatus && matchesSegment;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">👥 CRM - Gestão de Clientes</h1>
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Clientes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="search">Buscar</Label>
                  <Input
                    id="search"
                    placeholder="Nome ou email"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="blocked">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="segment">Segmento</Label>
                  <Select value={filterSegment} onValueChange={setFilterSegment}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {segments.map(segment => (
                        <SelectItem key={segment.id} value={segment.name}>
                          {segment.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Clientes */}
          <div className="space-y-4">
            {filteredCustomers.map((customer) => (
              <Card
                key={customer.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${selectedCustomer?.id === customer.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                onClick={() => {
                  setSelectedCustomer(customer);
                  loadCustomerDetails(customer.id);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">
                          {customer.first_name} {customer.last_name}
                        </h3>
                        <p className="text-gray-600">{customer.email}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>{customer.total_orders} pedidos</span>
                          <span>{formatCurrency(customer.total_spent)}</span>
                          <span>Desde {formatDate(customer.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(customer.status)}>
                        {getStatusIcon(customer.status)}
                        <span className="ml-1">{getStatusLabel(customer.status)}</span>
                      </Badge>

                      {customer.tags.map(tag => (
                        <Badge key={tag} variant="outline">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}

                      {customer.status !== 'vip' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsVIP(customer.id);
                          }}
                        >
                          <Crown className="w-4 h-4 mr-1" />
                          VIP
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detalhes do Cliente */}
        <div className="space-y-6">
          {selectedCustomer ? (
            <>
              {/* Perfil do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="w-5 h-5 mr-2" />
                    {selectedCustomer.first_name} {selectedCustomer.last_name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedCustomer.email}</p>
                  </div>

                  {selectedCustomer.phone && (
                    <div>
                      <p className="text-sm text-gray-600">Telefone</p>
                      <p className="font-medium">{selectedCustomer.phone}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Pedidos</p>
                      <p className="font-medium text-lg">{selectedCustomer.total_orders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Gasto</p>
                      <p className="font-medium text-lg">{formatCurrency(selectedCustomer.total_spent)}</p>
                    </div>
                  </div>

                  {selectedCustomer.loyalty && (
                    <div>
                      <p className="text-sm text-gray-600">Programa de Fidelidade</p>
                      <div className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium">{selectedCustomer.loyalty.tier}</span>
                        <span className="text-sm text-gray-500">
                          ({selectedCustomer.loyalty.current_points} pontos)
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tarefas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Tarefas
                    </CardTitle>
                    <Button size="sm" onClick={() => setShowTaskModal(true)}>
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{task.title}</p>
                          <p className="text-xs text-gray-500">{task.task_type}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getTaskStatusColor(task.status)}>
                            {task.status}
                          </Badge>
                          {task.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateTaskStatus(task.id, 'completed')}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Interações Recentes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Interações Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {interactions.slice(0, 3).map((interaction) => (
                      <div key={interaction.id} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium text-sm">{interaction.subject}</p>
                          <Badge className={getPriorityColor(interaction.priority)}>
                            {interaction.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">{interaction.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(interaction.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecione um cliente para ver os detalhes</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal de Nova Tarefa */}
      {showTaskModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Tarefa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Título da tarefa"
                />
              </div>

              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Descrição da tarefa"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Tipo</Label>
                  <Select value={newTask.task_type} onValueChange={(value: any) => setNewTask({ ...newTask, task_type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="follow_up">Follow-up</SelectItem>
                      <SelectItem value="call">Ligação</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="support">Suporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select value={newTask.priority} onValueChange={(value: any) => setNewTask({ ...newTask, priority: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input
                  id="due_date"
                  type="datetime-local"
                  value={newTask.due_date}
                  onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={createTask} className="flex-1">
                  Criar Tarefa
                </Button>
                <Button variant="outline" onClick={() => setShowTaskModal(false)}>
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default CRM;
