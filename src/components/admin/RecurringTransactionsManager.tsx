import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Repeat,
  Zap,
  Bell
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import MetricCard from '@/components/admin/MetricCard';
import LoadingState from '@/components/admin/LoadingState';
import EmptyState from '@/components/admin/EmptyState';
import { CheckCircle, XCircle, AlertCircle, Repeat, Inbox } from 'lucide-react';

interface RecurringTransaction {
  id: string;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento: string;
  origem?: string;
  observacoes?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  day_of_month?: number;
  day_of_week?: number;
  notify_days_before: number;
  notify_email?: string;
  is_active: boolean;
  auto_create: boolean;
  occurrences_count: number;
  max_occurrences?: number;
  created_at: string;
  updated_at: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: 'Diária',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  yearly: 'Anual'
};

const DAY_OF_WEEK_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado'
};

export default function RecurringTransactionsManager() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    tipo: 'saida' as 'entrada' | 'saida',
    valor: '',
    status: 'Pendente' as 'Pago' | 'Pendente' | 'Atrasado',
    metodo_pagamento: 'PIX',
    origem: '',
    observacoes: '',
    frequency: 'monthly' as RecurringTransaction['frequency'],
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    day_of_month: '',
    day_of_week: '',
    notify_days_before: 0,
    notify_email: '',
    auto_create: true,
    max_occurrences: ''
  });

  const loadRecurring = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial/recurring?active_only=false', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erro ao carregar');
      
      const data = await response.json();
      setRecurring(data.recurring_transactions || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar transações recorrentes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurring();
  }, []);

  const handleSave = async () => {
    try {
      if (!formData.descricao || !formData.categoria || !formData.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const payload = {
        ...formData,
        valor: parseFloat(formData.valor),
        end_date: formData.end_date || null,
        day_of_month: formData.day_of_month ? parseInt(formData.day_of_month) : null,
        day_of_week: formData.day_of_week ? parseInt(formData.day_of_week) : null,
        max_occurrences: formData.max_occurrences ? parseInt(formData.max_occurrences) : null,
        notify_email: formData.notify_email || null
      };

      const url = editing
        ? `/api/financial/recurring/${editing.id}`
        : '/api/financial/recurring';
      
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

      toast.success(editing ? 'Transação recorrente atualizada!' : 'Transação recorrente criada!');
      setShowModal(false);
      resetForm();
      await loadRecurring();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao salvar transação recorrente');
    }
  };

  const handleEdit = (item: RecurringTransaction) => {
    setEditing(item);
    setFormData({
      descricao: item.descricao,
      categoria: item.categoria,
      tipo: item.tipo,
      valor: item.valor.toString(),
      status: item.status,
      metodo_pagamento: item.metodo_pagamento,
      origem: item.origem || '',
      observacoes: item.observacoes || '',
      frequency: item.frequency,
      start_date: item.start_date,
      end_date: item.end_date || '',
      day_of_month: item.day_of_month?.toString() || '',
      day_of_week: item.day_of_week?.toString() || '',
      notify_days_before: item.notify_days_before,
      notify_email: item.notify_email || '',
      auto_create: item.auto_create,
      max_occurrences: item.max_occurrences?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação recorrente?')) return;

    try {
      const response = await fetch(`/api/financial/recurring/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast.success('Transação recorrente excluída!');
      await loadRecurring();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao excluir transação recorrente');
    }
  };

  const handleNotify = async () => {
    try {
      const response = await fetch('/api/financial/recurring/notify', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao processar notificações');
      }

      toast.success('Notificações processadas com sucesso!');
      await loadRecurring();
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error(error.message || 'Erro ao processar notificações');
    }
  };

  const handleProcess = async () => {
    try {
      const response = await fetch('/api/financial/recurring/process', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Erro ao processar');

      const data = await response.json();
      toast.success(`${data.processed} transação(ões) processada(s)!`);
      await loadRecurring();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao processar recorrências');
    }
  };

  const handleToggleActive = async (item: RecurringTransaction) => {
    try {
      const response = await fetch(`/api/financial/recurring/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_active: !item.is_active })
      });

      if (!response.ok) throw new Error('Erro ao atualizar');

      toast.success(`Transação recorrente ${!item.is_active ? 'ativada' : 'desativada'}!`);
      await loadRecurring();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar transação recorrente');
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      descricao: '',
      categoria: '',
      tipo: 'saida',
      valor: '',
      status: 'Pendente',
      metodo_pagamento: 'PIX',
      origem: '',
      observacoes: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      day_of_month: '',
      day_of_week: '',
      notify_days_before: 0,
      notify_email: '',
      auto_create: true,
      max_occurrences: ''
    });
  };

  const activeRecurring = useMemo(() => 
    recurring.filter(r => r.is_active),
    [recurring]
  );

  const nextOccurrences = useMemo(() => {
    const today = new Date();
    return recurring.filter(r => {
      if (!r.is_active) return false;
      const next = new Date(r.next_occurrence);
      return next <= today;
    });
  }, [recurring]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pt-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200 bg-gradient-to-r from-gray-50/50 to-transparent -mx-4 sm:-mx-6 px-4 sm:px-6 pt-4 rounded-lg"
      >
        <div className="space-y-2">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🔄 Transações Recorrentes
          </h2>
          <p className="text-gray-600 text-sm">Gerencie transações que se repetem automaticamente</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleNotify}
            variant="outline"
            title="Enviar notificações de recorrências próximas"
          >
            <Bell className="h-4 w-4 mr-2" />
            Enviar Notificações
          </Button>
          <Button
            onClick={handleProcess}
            variant="outline"
            disabled={nextOccurrences.length === 0}
            title="Processar transações pendentes"
          >
            <Zap className="h-4 w-4 mr-2" />
            Processar ({nextOccurrences.length})
          </Button>
          <Button onClick={loadRecurring} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Recorrência
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Resumo</h3>
          <p className="text-sm text-gray-500 mt-1">Estatísticas das transações recorrentes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total"
            value={recurring.length}
            format="number"
            color="blue"
            icon={<Repeat className="h-5 w-5" />}
            subtitle="Total de recorrências"
          />
          <MetricCard
            title="Ativas"
            value={activeRecurring.length}
            format="number"
            color="green"
            icon={<CheckCircle className="h-5 w-5" />}
            subtitle="Em execução"
          />
          <MetricCard
            title="Pendentes"
            value={nextOccurrences.length}
            format="number"
            color="yellow"
            icon={<AlertCircle className="h-5 w-5" />}
            subtitle="Aguardando processamento"
          />
          <MetricCard
            title="Ocorrências Criadas"
            value={recurring.reduce((sum, r) => sum + r.occurrences_count, 0)}
            format="number"
            color="purple"
            icon={<XCircle className="h-5 w-5" />}
            subtitle="Total processadas"
          />
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Lista de Transações Recorrentes</h3>
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Transações Recorrentes</CardTitle>
          </CardHeader>
        <CardContent>
          {loading ? (
            <LoadingState message="Carregando transações recorrentes..." />
          ) : recurring.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Nenhuma transação recorrente encontrada"
              description="Crie transações que se repetem automaticamente para facilitar o gerenciamento"
              actionLabel="+ Nova Recorrência"
              onAction={() => {
                resetForm();
                setShowModal(true);
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold">Descrição</TableHead>
                    <TableHead className="font-semibold">Categoria</TableHead>
                    <TableHead className="font-semibold">Tipo</TableHead>
                    <TableHead className="font-semibold">Valor</TableHead>
                    <TableHead className="font-semibold">Frequência</TableHead>
                    <TableHead className="font-semibold">Próxima Ocorrência</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recurring.map((item, index) => (
                    <TableRow 
                      key={item.id}
                      className={`
                        ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                        hover:bg-blue-50/50
                        transition-all duration-200
                        cursor-pointer
                        group
                        hover:shadow-sm
                      `}
                    >
                      <TableCell className="font-medium">{item.descricao}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.categoria}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={item.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {item.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{FREQUENCY_LABELS[item.frequency]}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(item.next_occurrence).toLocaleDateString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.is_active ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="outline">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inativa
                            </Badge>
                          )}
                          {item.auto_create && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              Auto
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleActive(item)}
                            title={item.is_active ? 'Desativar' : 'Ativar'}
                          >
                            {item.is_active ? (
                              <XCircle className="h-4 w-4 text-orange-600" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(item)}
                            title="Editar"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(item.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent
          className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !m-0"
          style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', margin: 0, maxHeight: '90vh' }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>
              {editing ? 'Editar Transação Recorrente' : 'Nova Transação Recorrente'}
            </DialogTitle>
            <DialogDescription>
              Configure uma transação que se repetirá automaticamente
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-4">
            {/* Dados básicos */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Aluguel"
                />
              </div>
              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Input
                  id="categoria"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                  placeholder="Ex: Despesas Fixas"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value: 'entrada' | 'saida') => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">💰 Entrada</SelectItem>
                    <SelectItem value="saida">💸 Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="valor">Valor *</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Recorrência */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-4">Configurações de Recorrência</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequency">Frequência *</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value: RecurringTransaction['frequency']) =>
                      setFormData({ ...formData, frequency: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diária</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="yearly">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="start_date">Data Inicial *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
              </div>

              {(formData.frequency === 'monthly' || formData.frequency === 'quarterly' ||
                formData.frequency === 'semiannual' || formData.frequency === 'yearly') && (
                <div className="mt-4">
                  <Label htmlFor="day_of_month">Dia do Mês (1-31)</Label>
                  <Input
                    id="day_of_month"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.day_of_month}
                    onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
                    placeholder="Ex: 5"
                  />
                </div>
              )}

              {formData.frequency === 'weekly' && (
                <div className="mt-4">
                  <Label htmlFor="day_of_week">Dia da Semana</Label>
                  <Select
                    value={formData.day_of_week}
                    onValueChange={(value) => setFormData({ ...formData, day_of_week: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="end_date">Data Final (opcional)</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="max_occurrences">Máx. Ocorrências (opcional)</Label>
                  <Input
                    id="max_occurrences"
                    type="number"
                    min="1"
                    value={formData.max_occurrences}
                    onChange={(e) => setFormData({ ...formData, max_occurrences: e.target.value })}
                    placeholder="Ex: 12"
                  />
                </div>
              </div>
            </div>

            {/* Outras configurações */}
            <div className="border-t pt-4 space-y-4">
              <div>
                <Label htmlFor="auto_create">
                  <input
                    type="checkbox"
                    id="auto_create"
                    checked={formData.auto_create}
                    onChange={(e) => setFormData({ ...formData, auto_create: e.target.checked })}
                    className="mr-2"
                  />
                  Criar transações automaticamente
                </Label>
              </div>
            </div>
          </div>
          </div>

          <div className="flex flex-shrink-0 justify-end gap-2 pt-4 border-t bg-background">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
                {editing ? 'Atualizar' : 'Criar'} Recorrência
              </Button>
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

