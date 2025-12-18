import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Calendar, DollarSign, RefreshCw, BarChart } from 'lucide-react';
import { toast } from 'sonner';
import LoadingState from '@/components/admin/LoadingState';
import EmptyState from '@/components/admin/EmptyState';
import MetricCard from '@/components/admin/MetricCard';

interface RecurringTransaction {
  id: string;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  frequency: string;
  next_occurrence: string;
  end_date?: string;
  max_occurrences?: number;
  occurrences_count: number;
  is_active: boolean;
}

interface ProjectedTransaction {
  date: string;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  recurring_id: string;
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

function calculateNextOccurrence(lastDate: string, frequency: string, dayOfMonth?: number, dayOfWeek?: number): string {
  const date = new Date(lastDate);
  const next = new Date(date);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      if (dayOfWeek !== null && dayOfWeek !== undefined) {
        const diff = dayOfWeek - next.getDay();
        if (diff !== 0) {
          next.setDate(next.getDate() + (diff > 0 ? diff : 7 + diff));
        }
      }
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
      }
      break;
    case 'semiannual':
      next.setMonth(next.getMonth() + 6);
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
      }
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      if (dayOfMonth !== null && dayOfMonth !== undefined) {
        next.setDate(dayOfMonth);
      }
      break;
  }

  return next.toISOString().split('T')[0];
}

function generateProjections(recurring: RecurringTransaction[], months: number): ProjectedTransaction[] {
  const projections: ProjectedTransaction[] = [];
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);
  const endDateStr = endDate.toISOString().split('T')[0];

  for (const rec of recurring) {
    if (!rec.is_active) continue;

    let currentDate = rec.next_occurrence;
    let occurrenceCount = rec.occurrences_count;
    const maxOccurrences = rec.max_occurrences || Infinity;

    while (currentDate <= endDateStr) {
      // Verificar se excedeu máximo de ocorrências
      if (occurrenceCount >= maxOccurrences) break;

      // Verificar se passou da data de término
      if (rec.end_date && currentDate > rec.end_date) break;

      projections.push({
        date: currentDate,
        descricao: rec.descricao,
        categoria: rec.categoria,
        tipo: rec.tipo,
        valor: rec.valor,
        recurring_id: rec.id
      });

      // Calcular próxima ocorrência
      currentDate = calculateNextOccurrence(
        currentDate,
        rec.frequency,
        (rec as any).day_of_month,
        (rec as any).day_of_week
      );
      occurrenceCount++;
    }
  }

  return projections.sort((a, b) => a.date.localeCompare(b.date));
}

export default function CashFlowProjection() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);

  const loadRecurring = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/financial/recurring?active_only=true', {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Erro ao carregar');
      
      const data = await response.json();
      setRecurring(data.recurring_transactions || []);
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar projeção');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecurring();
  }, []);

  const projections = useMemo(() => {
    return generateProjections(recurring, months);
  }, [recurring, months]);

  const groupedByMonth = useMemo(() => {
    const grouped: Record<string, ProjectedTransaction[]> = {};
    
    projections.forEach(proj => {
      const date = new Date(proj.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(proj);
    });

    return grouped;
  }, [projections]);

  const monthlyTotals = useMemo(() => {
    const totals: Record<string, { entradas: number; saidas: number; saldo: number }> = {};
    
    Object.entries(groupedByMonth).forEach(([month, transactions]) => {
      const entradas = transactions
        .filter(t => t.tipo === 'entrada')
        .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0);
      
      const saidas = transactions
        .filter(t => t.tipo === 'saida')
        .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0);
      
      totals[month] = {
        entradas: Number(entradas.toFixed(2)),
        saidas: Number(saidas.toFixed(2)),
        saldo: Number((entradas - saidas).toFixed(2))
      };
    });

    return totals;
  }, [groupedByMonth]);

  const grandTotal = useMemo(() => {
    const entradas = projections
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0);
    
    const saidas = projections
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + (parseFloat(String(t.valor)) || 0), 0);
    
    return {
      entradas: Number(entradas.toFixed(2)),
      saidas: Number(saidas.toFixed(2)),
      saldo: Number((entradas - saidas).toFixed(2)),
      count: projections.length
    };
  }, [projections]);

  if (loading) {
    return <LoadingState message="Carregando projeção de fluxo de caixa..." />;
  }

  return (
    <div className="space-y-6 pt-4">
      <div className="flex justify-between items-center pt-4">
        <div>
          <h2 className="text-2xl font-bold">📊 Projeção de Fluxo de Caixa</h2>
          <p className="text-gray-600">Visualize as projeções baseadas em transações recorrentes</p>
        </div>
        <div className="flex gap-2">
          <Select value={months.toString()} onValueChange={(v) => setMonths(parseInt(v))}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 meses</SelectItem>
              <SelectItem value="6">6 meses</SelectItem>
              <SelectItem value="12">12 meses</SelectItem>
              <SelectItem value="24">24 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadRecurring} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Transações"
          value={grandTotal.count}
          format="number"
          color="blue"
          icon={<BarChart className="h-5 w-5" />}
          subtitle="Transações projetadas"
        />
        <MetricCard
          title="Total Entradas"
          value={grandTotal.entradas}
          format="currency"
          color="green"
          icon={<TrendingUp className="h-5 w-5" />}
          subtitle="Receitas projetadas"
        />
        <MetricCard
          title="Total Saídas"
          value={grandTotal.saidas}
          format="currency"
          color="red"
          icon={<TrendingDown className="h-5 w-5" />}
          subtitle="Despesas projetadas"
        />
        <MetricCard
          title="Saldo Líquido"
          value={grandTotal.saldo}
          format="currency"
          color={grandTotal.saldo >= 0 ? 'green' : 'red'}
          icon={<DollarSign className="h-5 w-5" />}
          subtitle="Resultado líquido"
        />
      </div>

      {/* Projeção Mensal */}
      <Card>
        <CardHeader>
          <CardTitle>Projeção por Mês</CardTitle>
          <CardDescription>Visão consolidada mensal das transações projetadas</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(monthlyTotals).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma projeção disponível para o período selecionado
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(monthlyTotals)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([month, totals]) => {
                  const [year, monthNum] = month.split('-');
                  const monthName = new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('pt-BR', {
                    month: 'long',
                    year: 'numeric'
                  });

                  return (
                    <Card key={month}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg capitalize">{monthName}</CardTitle>
                          <Badge variant={totals.saldo >= 0 ? 'default' : 'destructive'}>
                            Saldo: R$ {totals.saldo.toFixed(2)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Entradas</p>
                            <p className="text-lg font-semibold text-green-600">
                              R$ {totals.entradas.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Saídas</p>
                            <p className="text-lg font-semibold text-red-600">
                              R$ {totals.saidas.toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Transações</p>
                            <p className="text-lg font-semibold">
                              {groupedByMonth[month].length}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhamento */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento das Transações</CardTitle>
          <CardDescription>Todas as transações projetadas ordenadas por data</CardDescription>
        </CardHeader>
        <CardContent>
          {projections.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma transação projetada para o período selecionado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projections.map((proj, index) => (
                    <TableRow key={`${proj.date}-${proj.recurring_id}-${index}`}>
                      <TableCell>
                        {new Date(proj.date).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{proj.descricao}</TableCell>
                      <TableCell>{proj.categoria}</TableCell>
                      <TableCell>
                        <Badge variant={proj.tipo === 'entrada' ? 'default' : 'secondary'}>
                          {proj.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${
                        proj.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {proj.tipo === 'entrada' ? '+' : '-'} R$ {(parseFloat(String(proj.valor)) || 0).toFixed(2)}
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
  );
}

