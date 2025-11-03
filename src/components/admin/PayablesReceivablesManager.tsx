import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter,
  Plus,
  FileText,
  Bell,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Account {
  id: string | number;
  description: string;
  amount: number;
  due_date: string;
  status: 'paid' | 'pending' | 'overdue';
  category: string;
  type: 'receivable' | 'payable';
  payment_method?: string;
  supplier_customer?: string;
  notes?: string;
}

interface PayablesReceivablesManagerProps {
  transactions?: any[];
  onAddAccount?: (account: any) => void;
  onPayAccount?: (id: string | number) => void;
  onRefresh?: () => void;
}

export const PayablesReceivablesManager: React.FC<PayablesReceivablesManagerProps> = ({
  transactions = [],
  onAddAccount,
  onPayAccount,
  onRefresh
}) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  
  useEffect(() => {
    processAccounts();
  }, [transactions]);

  const processAccounts = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const processedAccounts = transactions.map(t => {
      const dueDate = new Date(t.data || t.date || t.due_date);
      dueDate.setHours(0, 0, 0, 0);
      
      let status: 'paid' | 'pending' | 'overdue' = 'pending';
      
      if (t.status === 'paid' || t.status === 'Pago') {
        status = 'paid';
      } else if (dueDate < today) {
        status = 'overdue';
      }

      return {
        id: t.id,
        description: t.descricao || t.description,
        amount: parseFloat(t.valor || t.amount) || 0,
        due_date: dueDate.toISOString().split('T')[0],
        status,
        category: t.categoria || t.category,
        type: (t.tipo === 'entrada' || t.type === 'income') ? 'receivable' : 'payable',
        payment_method: t.forma_pagamento || t.payment_method,
        supplier_customer: t.origem || t.supplier,
        notes: t.observacoes || t.notes
      };
    });

    setAccounts(processedAccounts);
  };

  const filteredAccounts = accounts.filter(acc => {
    if (filter === 'all') return true;
    return acc.status === filter;
  });

  const payables = filteredAccounts.filter(a => a.type === 'payable');
  const receivables = filteredAccounts.filter(a => a.type === 'receivable');

  const getStats = (type: 'payable' | 'receivable') => {
    const items = type === 'payable' ? payables : receivables;
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const pending = items.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
    const overdue = items.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);
    const paid = items.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);

    return { total, pending, overdue, paid, count: items.length };
  };

  const payablesStats = getStats('payable');
  const receivablesStats = getStats('receivable');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const getStatusBadge = (account: Account) => {
    const days = getDaysUntilDue(account.due_date);
    
    if (account.status === 'paid') {
      return <Badge className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" /> Pago</Badge>;
    }
    
    if (account.status === 'overdue') {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Vencido ({Math.abs(days)}d)</Badge>;
    }
    
    if (days === 0) {
      return <Badge className="bg-orange-500"><Bell className="h-3 w-3 mr-1" /> Vence Hoje</Badge>;
    }
    
    if (days <= 3) {
      return <Badge className="bg-yellow-500"><Clock className="h-3 w-3 mr-1" /> {days}d para vencer</Badge>;
    }
    
    return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" /> {days}d</Badge>;
  };

  const StatsCard = ({ title, value, count, icon: Icon, color }: any) => (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <div className={`p-2 bg-${color}-50 rounded-lg`}>
            <Icon className={`h-4 w-4 text-${color}-600`} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{count} contas</p>
      </CardContent>
    </Card>
  );

  const AccountsTable = ({ accounts, type }: { accounts: Account[], type: 'payable' | 'receivable' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Descrição</TableHead>
          <TableHead>{type === 'payable' ? 'Fornecedor' : 'Cliente'}</TableHead>
          <TableHead>Valor</TableHead>
          <TableHead>Vencimento</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
              Nenhuma conta encontrada
            </TableCell>
          </TableRow>
        ) : (
          accounts.map((account) => (
            <TableRow key={account.id}>
              <TableCell className="font-medium">{account.description}</TableCell>
              <TableCell>{account.supplier_customer || '-'}</TableCell>
              <TableCell className="font-semibold">
                {formatCurrency(account.amount)}
              </TableCell>
              <TableCell>
                {new Date(account.due_date).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>{getStatusBadge(account)}</TableCell>
              <TableCell>
                {account.status !== 'paid' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (onPayAccount) {
                        onPayAccount(account.id);
                        toast.success('Pagamento registrado!');
                      }
                    }}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Dar Baixa
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            Contas a Pagar e Receber
          </h2>
          <p className="text-muted-foreground">
            Gerencie vencimentos e organize seu fluxo de caixa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onRefresh}>
            Atualizar
          </Button>
          <Button onClick={() => setShowAddModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              <Clock className="h-3 w-3 mr-1" />
              Pendentes
            </Button>
            <Button
              variant={filter === 'overdue' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('overdue')}
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Vencidas
            </Button>
            <Button
              variant={filter === 'paid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('paid')}
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Pagas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Contas a Pagar / Contas a Receber */}
      <Tabs defaultValue="payables" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="payables" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="receivables" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Contas a Receber
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payables" className="space-y-4">
          {/* Stats - Contas a Pagar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total a Pagar"
              value={formatCurrency(payablesStats.total)}
              count={payablesStats.count}
              icon={DollarSign}
              color="red"
            />
            <StatsCard
              title="Pendentes"
              value={formatCurrency(payablesStats.pending)}
              count={payables.filter(p => p.status === 'pending').length}
              icon={Clock}
              color="yellow"
            />
            <StatsCard
              title="Vencidas"
              value={formatCurrency(payablesStats.overdue)}
              count={payables.filter(p => p.status === 'overdue').length}
              icon={AlertTriangle}
              color="red"
            />
            <StatsCard
              title="Pagas"
              value={formatCurrency(payablesStats.paid)}
              count={payables.filter(p => p.status === 'paid').length}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* Tabela de Contas a Pagar */}
          <Card>
            <CardHeader>
              <CardTitle>Contas a Pagar</CardTitle>
              <CardDescription>
                Gerencie suas obrigações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountsTable accounts={payables} type="payable" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receivables" className="space-y-4">
          {/* Stats - Contas a Receber */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Total a Receber"
              value={formatCurrency(receivablesStats.total)}
              count={receivablesStats.count}
              icon={DollarSign}
              color="green"
            />
            <StatsCard
              title="Pendentes"
              value={formatCurrency(receivablesStats.pending)}
              count={receivables.filter(r => r.status === 'pending').length}
              icon={Clock}
              color="yellow"
            />
            <StatsCard
              title="Atrasadas"
              value={formatCurrency(receivablesStats.overdue)}
              count={receivables.filter(r => r.status === 'overdue').length}
              icon={AlertTriangle}
              color="orange"
            />
            <StatsCard
              title="Recebidas"
              value={formatCurrency(receivablesStats.paid)}
              count={receivables.filter(r => r.status === 'paid').length}
              icon={CheckCircle}
              color="green"
            />
          </div>

          {/* Tabela de Contas a Receber */}
          <Card>
            <CardHeader>
              <CardTitle>Contas a Receber</CardTitle>
              <CardDescription>
                Acompanhe seus recebimentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccountsTable accounts={receivables} type="receivable" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Alertas de Vencimento */}
      {(payables.filter(p => p.status === 'overdue').length > 0 || 
        receivables.filter(r => r.status === 'overdue').length > 0) && (
        <Card className="border-red-200 bg-red-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <CardTitle className="text-lg text-red-900">Alertas de Vencimento</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {payables.filter(p => p.status === 'overdue').length > 0 && (
              <div className="flex items-center gap-2 text-red-700">
                <div className="w-2 h-2 bg-red-600 rounded-full" />
                <p>
                  Você tem {payables.filter(p => p.status === 'overdue').length} conta(s) a pagar vencida(s) 
                  totalizando {formatCurrency(payables.filter(p => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0))}
                </p>
              </div>
            )}
            {receivables.filter(r => r.status === 'overdue').length > 0 && (
              <div className="flex items-center gap-2 text-orange-700">
                <div className="w-2 h-2 bg-orange-600 rounded-full" />
                <p>
                  Você tem {receivables.filter(r => r.status === 'overdue').length} conta(s) a receber atrasada(s) 
                  totalizando {formatCurrency(receivables.filter(r => r.status === 'overdue').reduce((sum, r) => sum + r.amount, 0))}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PayablesReceivablesManager;

