import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  RotateCcw,
  Check,
  X,
  Download,
  Upload,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ArrowUpDown,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: number;
  data: string;
  descricao: string;
  categoria: string;
  tipo: string;
  valor: number;
  status: string;
  metodo_pagamento: string;
  origem: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

interface AdvancedTransactionManagerProps {
  transactions: Transaction[];
  onRefresh: () => void;
  onCreate: (data: any) => Promise<void>;
  onUpdate: (id: number, data: any) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export const AdvancedTransactionManager: React.FC<AdvancedTransactionManagerProps> = ({
  transactions,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete
}) => {
  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'data' | 'valor' | 'descricao'>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Modais
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReverseModal, setShowReverseModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    tipo: 'entrada',
    valor: '',
    status: 'Pago',
    metodo_pagamento: 'PIX',
    data: new Date().toISOString().split('T')[0],
    origem: '',
    observacoes: ''
  });

  const [reversalReason, setReversalReason] = useState('');

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.categoria));
    return Array.from(cats).filter(Boolean);
  }, [transactions]);

  // Filtrar e ordenar transações
  const filteredTransactions = useMemo(() => {
    let filtered = transactions.filter(t => {
      const matchesSearch = 
        t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.origem?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesType = filterType === 'all' || t.tipo === filterType;
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
      const matchesCategory = filterCategory === 'all' || t.categoria === filterCategory;
      
      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let comparison = 0;
      
      if (sortBy === 'data') {
        comparison = new Date(a.data).getTime() - new Date(b.data).getTime();
      } else if (sortBy === 'valor') {
        comparison = a.valor - b.valor;
      } else {
        comparison = a.descricao.localeCompare(b.descricao);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchTerm, filterType, filterStatus, filterCategory, sortBy, sortOrder]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = filteredTransactions.length;
    const entradas = filteredTransactions.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + t.valor, 0);
    const saidas = filteredTransactions.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + t.valor, 0);
    const saldo = entradas - saidas;
    
    return { total, entradas, saidas, saldo };
  }, [filteredTransactions]);

  // Handlers
  const handleSelectAll = () => {
    if (selectedIds.length === filteredTransactions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTransactions.map(t => t.id));
    }
  };

  const handleSelectOne = (id: number) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCreate = async () => {
    if (!formData.descricao || !formData.categoria || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setActionLoading(true);
    try {
      await onCreate({
        ...formData,
        valor: parseFloat(formData.valor)
      });
      toast.success('Transação criada com sucesso!');
      setShowCreateModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Erro ao criar transação');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!currentTransaction) return;

    setActionLoading(true);
    try {
      await onUpdate(currentTransaction.id, {
        ...formData,
        valor: parseFloat(formData.valor)
      });
      toast.success('Transação atualizada com sucesso!');
      setShowEditModal(false);
      resetForm();
      onRefresh();
    } catch (error) {
      toast.error('Erro ao atualizar transação');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTransaction) return;

    setActionLoading(true);
    try {
      await onDelete(currentTransaction.id);
      toast.success('Transação excluída com sucesso!');
      setShowDeleteConfirm(false);
      setCurrentTransaction(null);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir transação');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReverse = async () => {
    if (!currentTransaction) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/financial/transactions/${currentTransaction.id}/reverse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: reversalReason })
      });

      if (!response.ok) throw new Error('Erro ao estornar');

      toast.success('Transação estornada com sucesso!');
      setShowReverseModal(false);
      setReversalReason('');
      setCurrentTransaction(null);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao estornar transação');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/financial/transactions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds })
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast.success(`${selectedIds.length} transações excluídas com sucesso!`);
      setShowBulkDeleteConfirm(false);
      setSelectedIds([]);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao excluir transações em lote');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkUpdateStatus = async (status: string) => {
    if (selectedIds.length === 0) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/financial/transactions/bulk-update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status })
      });

      if (!response.ok) throw new Error('Erro ao atualizar');

      toast.success(`${selectedIds.length} transações atualizadas para ${status}!`);
      setSelectedIds([]);
      onRefresh();
    } catch (error) {
      toast.error('Erro ao atualizar status em lote');
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Método', 'Origem'],
      ...filteredTransactions.map(t => [
        t.data,
        t.descricao,
        t.categoria,
        t.tipo,
        t.valor.toString(),
        t.status,
        t.metodo_pagamento,
        t.origem || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transacoes_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Dados exportados com sucesso!');
  };

  const resetForm = () => {
    setFormData({
      descricao: '',
      categoria: '',
      tipo: 'entrada',
      valor: '',
      status: 'Pago',
      metodo_pagamento: 'PIX',
      data: new Date().toISOString().split('T')[0],
      origem: '',
      observacoes: ''
    });
  };

  const openEditModal = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setFormData({
      descricao: transaction.descricao,
      categoria: transaction.categoria,
      tipo: transaction.tipo,
      valor: transaction.valor.toString(),
      status: transaction.status,
      metodo_pagamento: transaction.metodo_pagamento,
      data: transaction.data,
      origem: transaction.origem || '',
      observacoes: transaction.observacoes || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setShowDeleteConfirm(true);
  };

  const openReverseModal = (transaction: Transaction) => {
    setCurrentTransaction(transaction);
    setShowReverseModal(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pago':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'Pendente':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'Atrasado':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pago':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendente':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Atrasado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Entradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {stats.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Saídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {stats.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Saldo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.saldo >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              R$ {stats.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Ferramentas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <CardTitle>Gerenciamento de Lançamentos</CardTitle>
              <CardDescription>Controle completo de todas as transações financeiras</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => { resetForm(); setShowCreateModal(true); }} className="bg-gradient-to-r from-green-500 to-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Nova Transação
              </Button>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar transações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pago">Pago</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Ações em lote */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm font-medium text-blue-900">
                {selectedIds.length} selecionada(s)
              </span>
              <div className="flex gap-2 ml-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus('Pago')}
                  disabled={actionLoading}
                >
                  Marcar como Pago
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkUpdateStatus('Pendente')}
                  disabled={actionLoading}
                >
                  Marcar como Pendente
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={actionLoading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Excluir
                </Button>
              </div>
            </div>
          )}

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="cursor-pointer" onClick={() => {
                      setSortBy('data');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>
                      <div className="flex items-center gap-1">
                        Data
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="cursor-pointer" onClick={() => {
                      setSortBy('valor');
                      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                    }}>
                      <div className="flex items-center gap-1">
                        Valor
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransactions.map((transaction) => (
                      <TableRow key={transaction.id} className="hover:bg-gray-50">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(transaction.id)}
                            onCheckedChange={() => handleSelectOne(transaction.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {format(new Date(transaction.data), 'dd/MM/yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs truncate" title={transaction.descricao}>
                            {transaction.descricao}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{transaction.categoria}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={transaction.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {transaction.tipo === 'entrada' ? '↑ Entrada' : '↓ Saída'}
                          </Badge>
                        </TableCell>
                        <TableCell className={`font-semibold ${transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {transaction.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(transaction.status)}
                            <Badge className={getStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{transaction.metodo_pagamento}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openEditModal(transaction)}
                              title="Editar"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openReverseModal(transaction)}
                              title="Estornar"
                              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openDeleteModal(transaction)}
                              title="Excluir"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
            <DialogDescription>Crie uma nova transação financeira</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="descricao">Descrição *</Label>
              <Input
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Venda de produtos"
              />
            </div>
            
            <div>
              <Label htmlFor="categoria">Categoria *</Label>
              <Input
                id="categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                placeholder="Ex: Vendas"
              />
            </div>
            
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
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
            
            <div>
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="metodo">Método de Pagamento</Label>
              <Select value={formData.metodo_pagamento} onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="origem">Origem</Label>
              <Input
                id="origem"
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                placeholder="Ex: Cliente, Fornecedor"
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Informações adicionais"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Criar Transação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
            <DialogDescription>Atualize os dados da transação</DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="edit-descricao">Descrição *</Label>
              <Input
                id="edit-descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-categoria">Categoria *</Label>
              <Input
                id="edit-categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-tipo">Tipo *</Label>
              <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-valor">Valor *</Label>
              <Input
                id="edit-valor"
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-data">Data</Label>
              <Input
                id="edit-data"
                type="date"
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-metodo">Método de Pagamento</Label>
              <Select value={formData.metodo_pagamento} onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-origem">Origem</Label>
              <Input
                id="edit-origem"
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              />
            </div>
            
            <div className="col-span-2">
              <Label htmlFor="edit-observacoes">Observações</Label>
              <Textarea
                id="edit-observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Estorno */}
      <Dialog open={showReverseModal} onOpenChange={setShowReverseModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estornar Transação</DialogTitle>
            <DialogDescription>
              Isso criará uma nova transação inversa para cancelar o efeito desta transação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="reversal-reason">Motivo do Estorno</Label>
              <Textarea
                id="reversal-reason"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                placeholder="Descreva o motivo do estorno..."
                rows={4}
              />
            </div>
            
            {currentTransaction && (
              <div className="p-3 bg-gray-50 rounded border space-y-1 text-sm">
                <div><strong>Transação:</strong> {currentTransaction.descricao}</div>
                <div><strong>Valor:</strong> R$ {currentTransaction.valor.toFixed(2)}</div>
                <div><strong>Tipo:</strong> {currentTransaction.tipo}</div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReverseModal(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleReverse} disabled={actionLoading} className="bg-orange-600 hover:bg-orange-700">
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Confirmar Estorno
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {currentTransaction && (
            <div className="p-3 bg-red-50 border border-red-200 rounded space-y-1 text-sm">
              <div><strong>Descrição:</strong> {currentTransaction.descricao}</div>
              <div><strong>Valor:</strong> R$ {currentTransaction.valor.toFixed(2)}</div>
              <div><strong>Data:</strong> {format(new Date(currentTransaction.data), 'dd/MM/yyyy')}</div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={actionLoading} variant="destructive">
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão em Lote */}
      <Dialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão em Lote</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir {selectedIds.length} transações? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm font-medium text-red-900">
              {selectedIds.length} transações serão excluídas permanentemente.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkDeleteConfirm(false)} disabled={actionLoading}>
              Cancelar
            </Button>
            <Button onClick={handleBulkDelete} disabled={actionLoading} variant="destructive">
              {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Excluir Todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

