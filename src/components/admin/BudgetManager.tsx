import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  DollarSign,
  Calendar,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingState from '@/components/admin/LoadingState';
import EmptyState from '@/components/admin/EmptyState';

interface Budget {
  id: string;
  nome: string;
  descricao?: string;
  tipo: 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'customizado';
  categoria?: string;
  valor_orcado: number;
  valor_real: number;
  data_inicio: string;
  data_fim: string;
  alerta_percentual: number;
  is_active: boolean;
  percentual_atingido?: number;
  created_at: string;
  updated_at: string;
}

const TIPO_LABELS: Record<string, string> = {
  mensal: 'Mensal',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  customizado: 'Customizado'
};

export default function BudgetManager() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'mensal' as Budget['tipo'],
    categoria: '',
    valor_orcado: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim: '',
    alerta_percentual: 80
  });
  const [filterActive, setFilterActive] = useState('all');

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const activeOnly = filterActive === 'active' ? 'true' : filterActive === 'inactive' ? 'false' : 'false';
      const response = await fetch(`/api/financial/budgets?active_only=${activeOnly}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erro ao carregar');
      
      const data = await response.json();
      setBudgets(data.budgets || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [filterActive]);

  const handleSave = async () => {
    try {
      if (!formData.nome || !formData.valor_orcado || !formData.data_inicio || !formData.data_fim) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const payload = {
        ...formData,
        valor_orcado: parseFloat(formData.valor_orcado),
        alerta_percentual: parseInt(String(formData.alerta_percentual)),
        descricao: formData.descricao || null,
        categoria: formData.categoria || null
      };

      const url = editing
        ? `/api/financial/budgets/${editing.id}`
        : '/api/financial/budgets';
      
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao salvar');
      }

      toast.success(editing ? 'Orçamento atualizado!' : 'Orçamento criado!');
      setShowModal(false);
      resetForm();
      await loadBudgets();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao salvar orçamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      const response = await fetch(`/api/financial/budgets/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast.success('Orçamento excluído!');
      await loadBudgets();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir orçamento');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditing(budget);
    setFormData({
      nome: budget.nome,
      descricao: budget.descricao || '',
      tipo: budget.tipo,
      categoria: budget.categoria || '',
      valor_orcado: budget.valor_orcado.toString(),
      data_inicio: budget.data_inicio,
      data_fim: budget.data_fim,
      alerta_percentual: budget.alerta_percentual
    });
    setShowModal(true);
  };

  const handleToggleActive = async (budget: Budget) => {
    try {
      const response = await fetch(`/api/financial/budgets/${budget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !budget.is_active })
      });

      if (!response.ok) throw new Error('Erro ao atualizar');

      toast.success(`Orçamento ${!budget.is_active ? 'ativado' : 'desativado'}!`);
      await loadBudgets();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar orçamento');
    }
  };

  const handleProcessAlerts = async () => {
    try {
      const response = await fetch('/api/financial/budgets/process-alerts', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao processar alertas');

      const data = await response.json();
      toast.success(`${data.alerts_created} alerta(s) criado(s)!`);
      await loadBudgets();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar alertas');
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'mensal',
      categoria: '',
      valor_orcado: '',
      data_inicio: new Date().toISOString().split('T')[0],
      data_fim: '',
      alerta_percentual: 80
    });
  };

  const activeBudgets = useMemo(() => 
    budgets.filter(b => b.is_active),
    [budgets]
  );

  const budgetsWithAlerts = useMemo(() => 
    budgets.filter(b => {
      const percentual = parseFloat(String(b.percentual_atingido || 0));
      return b.is_active && percentual >= b.alerta_percentual;
    }),
    [budgets]
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const getStatusBadge = (budget: Budget) => {
    const percentual = parseFloat(String(budget.percentual_atingido || 0));
    
    if (percentual >= 100) {
      return (
        <Badge variant="destructive" className="bg-red-500 hover:bg-red-600">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Extrapolado
        </Badge>
      );
    } else if (percentual >= budget.alerta_percentual) {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Alerta
        </Badge>
      );
    } else if (percentual >= 80) {
      return (
        <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
          Próximo
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Normal
        </Badge>
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pt-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 pt-4"
      >
        <div className="space-y-1">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            💰 Orçamentos e Planejamento
          </h2>
          <p className="text-gray-600 text-sm">Gerencie orçamentos e acompanhe o desempenho financeiro</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button
            onClick={handleProcessAlerts}
            variant="outline"
            title="Processar alertas de orçamento"
            className="transition-all hover:scale-105 hover:shadow-md"
          >
            <Bell className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Processar Alertas</span>
            <span className="sm:hidden">Alertas</span>
            {budgetsWithAlerts.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 min-w-[20px]">
                {budgetsWithAlerts.length}
              </Badge>
            )}
          </Button>
          <Button 
            onClick={loadBudgets} 
            variant="outline"
            className="transition-all hover:scale-105 hover:shadow-md"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Orçamento
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Orçamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{budgets.length}</div>
              <div className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                {activeBudgets.length} ativos
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <Target className="h-4 w-4 mr-2 text-purple-500" />
                Total Orçado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {formatCurrency(budgets.reduce((sum, b) => sum + (parseFloat(String(b.valor_orcado)) || 0), 0))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                Total Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(budgets.reduce((sum, b) => sum + (parseFloat(String(b.valor_real)) || 0), 0))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-yellow-500" />
                Com Alerta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{budgetsWithAlerts.length}</div>
              <div className="text-sm text-gray-500 mt-2">Orçamentos com alerta</div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 shadow-sm">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1 w-full sm:w-auto">
                <Label className="text-sm font-medium text-gray-700 mb-2 block">Filtrar por Status</Label>
                <Select value={filterActive} onValueChange={setFilterActive}>
                  <SelectTrigger className="w-full sm:w-64 bg-white border-gray-300 hover:border-gray-400 transition-colors">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Orçamentos</SelectItem>
                    <SelectItem value="active">Apenas Ativos</SelectItem>
                    <SelectItem value="inactive">Apenas Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="outline"
                onClick={loadBudgets}
                className="bg-white hover:bg-gray-50 transition-all hover:scale-105 w-full sm:w-auto"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cards de Orçamentos */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Orçamentos ({budgets.length})</h3>
            <p className="text-sm text-gray-500 mt-1">Lista completa de orçamentos cadastrados</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <RefreshCw className="h-10 w-10 animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-600 font-medium">Carregando orçamentos...</p>
            </motion.div>
          ) : budgets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="Nenhum orçamento cadastrado"
              description="Comece criando seu primeiro orçamento para planejar suas finanças"
              actionLabel="Criar Primeiro Orçamento"
              onAction={() => {
                resetForm();
                setShowModal(true);
              }}
              fullHeight
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((budget, index) => {
              const percentual = parseFloat(String(budget.percentual_atingido || 0));
              const restante = parseFloat(String(budget.valor_orcado)) - parseFloat(String(budget.valor_real));
              const valorOrcado = parseFloat(String(budget.valor_orcado));
              const valorReal = parseFloat(String(budget.valor_real));
              
              const progressColor = percentual >= 100 
                ? 'bg-red-500' 
                : percentual >= budget.alerta_percentual 
                  ? 'bg-yellow-500' 
                  : 'bg-green-500';
              
              return (
                <motion.div
                  key={budget.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -4 }}
                >
                  <Card className="h-full border-gray-200 hover:border-gray-300 hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    {/* Barra de cor no topo baseada no status */}
                    <div className={`h-1 ${progressColor} transition-colors`} />
                    
                    <CardHeader className="pb-4 pt-5">
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold mb-2 text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors">
                            {budget.nome}
                          </CardTitle>
                          {budget.descricao && (
                            <CardDescription className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {budget.descricao}
                            </CardDescription>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            onClick={() => handleEdit(budget)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                            onClick={() => handleDelete(budget.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                  
                    <CardContent className="space-y-5">
                      {/* Status e Tipo */}
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          {budget.is_active ? (
                            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Inativo
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs border-gray-300">
                            {TIPO_LABELS[budget.tipo]}
                          </Badge>
                        </div>
                        {getStatusBadge(budget)}
                      </div>

                      {/* Categoria */}
                      {budget.categoria && (
                        <div className="px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                          <span className="text-xs text-gray-500 uppercase tracking-wide">Categoria</span>
                          <div className="text-sm font-semibold text-gray-800 mt-1">{budget.categoria}</div>
                        </div>
                      )}

                      {/* Período */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                        <Calendar className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <span className="text-sm text-gray-700 font-medium">
                          {formatDate(budget.data_inicio)} - {formatDate(budget.data_fim)}
                        </span>
                      </div>

                      {/* Valores */}
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm font-medium text-gray-600">Orçado:</span>
                          <span className="font-bold text-lg text-blue-600">
                            {formatCurrency(valorOrcado)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-sm font-medium text-gray-600">Real:</span>
                          <span className={`font-bold text-lg ${
                            percentual >= 100 ? 'text-red-600' :
                            percentual >= budget.alerta_percentual ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {formatCurrency(valorReal)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 px-3 py-2 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">Restante:</span>
                          <span className={`font-bold text-base ${
                            restante < 0 ? 'text-red-600' : 'text-gray-800'
                          }`}>
                            {formatCurrency(restante)}
                          </span>
                        </div>
                      </div>

                      {/* Progresso */}
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">Progresso</span>
                          <span className={`text-lg font-bold ${
                            percentual >= 100 ? 'text-red-600' :
                            percentual >= budget.alerta_percentual ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {percentual.toFixed(1)}%
                          </span>
                        </div>
                        <div className="relative">
                          <Progress 
                            value={Math.min(percentual, 100)} 
                            className="h-4 bg-gray-200"
                          />
                          <div 
                            className={`absolute top-0 left-0 h-4 rounded-full ${progressColor} transition-all duration-500 ease-out`}
                            style={{ width: `${Math.min(percentual, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 font-medium">
                          <span>R$ 0,00</span>
                          <span>{formatCurrency(valorOrcado)}</span>
                        </div>
                      </div>

                      {/* Alerta */}
                      <AnimatePresence>
                        {percentual >= budget.alerta_percentual && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className={`p-3 rounded-lg text-sm font-medium ${
                              percentual >= 100 
                                ? 'bg-red-50 text-red-700 border-2 border-red-200' 
                                : 'bg-yellow-50 text-yellow-700 border-2 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <AlertTriangle className={`h-4 w-4 ${percentual >= 100 ? 'text-red-600' : 'text-yellow-600'}`} />
                              <span>
                                {percentual >= 100 
                                  ? 'Orçamento extrapolado!' 
                                  : `Alerta: ${percentual.toFixed(1)}% do orçado utilizado`}
                              </span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modal de Criar/Editar */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Editar Orçamento' : 'Novo Orçamento'}
            </DialogTitle>
            <DialogDescription>
              {editing ? 'Atualize as informações do orçamento' : 'Preencha os dados para criar um novo orçamento'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="nome">Nome *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Marketing Mensal 2025"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descrição opcional do orçamento"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v as Budget['tipo'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                    <SelectItem value="customizado">Customizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Marketing, Operacional..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="valor_orcado">Valor Orçado (R$) *</Label>
              <Input
                id="valor_orcado"
                type="number"
                step="0.01"
                value={formData.valor_orcado}
                onChange={(e) => setFormData({ ...formData, valor_orcado: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="data_inicio">Data Início *</Label>
                <Input
                  id="data_inicio"
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="data_fim">Data Fim *</Label>
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="alerta_percentual">Alerta em (%)</Label>
              <Input
                id="alerta_percentual"
                type="number"
                min="0"
                max="100"
                value={formData.alerta_percentual}
                onChange={(e) => setFormData({ ...formData, alerta_percentual: parseInt(e.target.value) || 80 })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Receber alerta quando atingir este percentual do valor orçado
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                {editing ? 'Atualizar' : 'Criar'} Orçamento
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

