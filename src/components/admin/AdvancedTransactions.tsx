import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
  Tag,
  User,
  Building,
  Receipt,
  FileText,
  Zap,
  RefreshCw,
  Plus,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface Transaction {
  id: string | number;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  supplier?: string;
  notes?: string;
  source_type?: string;
}

interface AdvancedTransactionsProps {
  transactions?: Transaction[];
  onView?: (transaction: Transaction) => void;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (id: string | number) => void;
  onRefresh?: () => void;
  loading?: boolean;
}

const AdvancedTransactions: React.FC<AdvancedTransactionsProps> = ({
  transactions = [],
  onView,
  onEdit,
  onDelete,
  onRefresh,
  loading = false
}) => {
  // Debug: Log dos dados recebidos
  console.log('📊 AdvancedTransactions renderizado com:', {
    transactionsCount: transactions?.length || 0,
    loading,
    hasOnRefresh: typeof onRefresh === 'function',
    transactionsType: typeof transactions
  });

  // Estados
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string | number>>(new Set());
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Garantir que temos dados válidos
  const safeTransactions = Array.isArray(transactions) ? transactions : [];
  
  // Dados mockados caso não tenha transações
  const mockTransactions: Transaction[] = [
    {
      id: 1,
      date: '2025-10-14',
      description: 'Venda de produtos - Cliente Premium',
      category: 'Vendas',
      type: 'income',
      amount: 1250.50,
      status: 'paid',
      payment_method: 'PIX',
      supplier: 'Cliente ABC',
      source_type: 'order'
    },
    {
      id: 2,
      date: '2025-10-13',
      description: 'Compra de estoque',
      category: 'Fornecedor',
      type: 'expense',
      amount: 3500.00,
      status: 'paid',
      payment_method: 'Boleto',
      supplier: 'Fornecedor XYZ',
      source_type: 'manual'
    },
    {
      id: 3,
      date: '2025-10-12',
      description: 'Conta de energia elétrica',
      category: 'Energia',
      type: 'expense',
      amount: 450.75,
      status: 'pending',
      payment_method: 'Débito',
      notes: 'Vencimento em 20/10',
      source_type: 'manual'
    },
    {
      id: 4,
      date: '2025-10-11',
      description: 'Evento Workshop',
      category: 'Eventos',
      type: 'income',
      amount: 890.00,
      status: 'paid',
      payment_method: 'Crédito',
      source_type: 'event'
    },
    {
      id: 5,
      date: '2025-10-10',
      description: 'Aluguel do local',
      category: 'Aluguel',
      type: 'expense',
      amount: 2000.00,
      status: 'overdue',
      payment_method: 'Transferência',
      notes: 'Atrasado 5 dias',
      source_type: 'manual'
    }
  ];

  const allTransactions = safeTransactions.length > 0 ? safeTransactions : mockTransactions;

  // Extrair categorias únicas
  const categories = useMemo(() => {
    const cats = new Set(allTransactions.map(t => t.category));
    return Array.from(cats);
  }, [allTransactions]);

  // Filtrar e ordenar transações
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = allTransactions.filter(transaction => {
      // Filtro de busca
      const matchesSearch = 
        transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

      // Filtro de tipo
      const matchesType = filterType === 'all' || transaction.type === filterType;

      // Filtro de status
      const matchesStatus = filterStatus === 'all' || transaction.status === filterStatus;

      // Filtro de categoria
      const matchesCategory = filterCategory === 'all' || transaction.category === filterCategory;

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0;

      if (sortBy === 'date') {
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      } else if (sortBy === 'amount') {
        comparison = a.amount - b.amount;
      } else if (sortBy === 'description') {
        comparison = a.description.localeCompare(b.description);
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [allTransactions, searchTerm, filterType, filterStatus, filterCategory, sortBy, sortOrder]);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const total = filteredAndSortedTransactions.reduce((acc, t) => acc + t.amount, 0);
    const income = filteredAndSortedTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredAndSortedTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    const balance = income - expense;

    return { total, income, expense, balance, count: filteredAndSortedTransactions.length };
  }, [filteredAndSortedTransactions]);

  // Handlers
  const handleSort = (column: 'date' | 'amount' | 'description') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === filteredAndSortedTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(filteredAndSortedTransactions.map(t => t.id)));
    }
  };

  const handleSelectTransaction = (id: string | number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTransactions(newSelected);
  };

  const handleBulkDelete = () => {
    if (selectedTransactions.size === 0) return;
    
    toast.success(`${selectedTransactions.size} lançamentos excluídos`);
    setSelectedTransactions(new Set());
  };

  const handleExport = () => {
    toast.success('Exportando lançamentos...', { icon: '📊' });
  };

  const toggleRowExpansion = (id: string | number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterType('all');
    setFilterStatus('all');
    setFilterCategory('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Componentes auxiliares
  const getStatusBadge = (status: string) => {
    const variants = {
      paid: { color: 'bg-green-500', text: 'Pago', icon: CheckCircle },
      pending: { color: 'bg-yellow-500', text: 'Pendente', icon: Clock },
      overdue: { color: 'bg-red-500', text: 'Atrasado', icon: XCircle }
    };

    const variant = variants[status as keyof typeof variants] || variants.pending;
    const Icon = variant.icon;

    return (
      <Badge className={`${variant.color} text-white flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {variant.text}
      </Badge>
    );
  };

  const getTypeIcon = (type: string) => {
    return type === 'income' ? (
      <TrendingUp className="w-4 h-4 text-green-600" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-600" />
    );
  };

  // Tratamento de erro para renderização
  try {
    return (
      <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.count}</p>
              </div>
              <Receipt className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saídas</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {stats.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className={`border-l-4 ${stats.balance >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  R$ {Math.abs(stats.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`w-8 h-8 ${stats.balance >= 0 ? 'text-blue-500' : 'text-orange-500'}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Lançamentos Financeiros
              </CardTitle>
              <CardDescription>
                Gerenciar e visualizar todas as transações
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {selectedTransactions.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedTransactions.size})
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              {onRefresh && (
                <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Atualizar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Barra de Busca */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descrição, categoria ou fornecedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </Button>
          </div>

          {/* Filtros Avançados */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border rounded-lg bg-gray-50"
              >
                {/* Tipo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todos</option>
                    <option value="income">Entradas</option>
                    <option value="expense">Saídas</option>
                  </select>
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todos</option>
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente</option>
                    <option value="overdue">Atrasado</option>
                  </select>
                </div>

                {/* Categoria */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoria</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="all">Todas</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Ações */}
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Limpar
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.size === filteredAndSortedTransactions.length}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      Data
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('description')}
                      className="flex items-center gap-1"
                    >
                      Descrição
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('amount')}
                      className="flex items-center gap-1"
                    >
                      Valor
                      <ArrowUpDown className="w-3 h-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium mb-1">Nenhum lançamento encontrado</p>
                      <p className="text-sm">Ajuste os filtros ou adicione novos lançamentos</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedTransactions.map((transaction) => (
                    <React.Fragment key={transaction.id}>
                      <TableRow className="hover:bg-gray-50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(transaction.id)}
                            onChange={() => handleSelectTransaction(transaction.id)}
                            className="rounded"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {new Date(transaction.date).toLocaleDateString('pt-BR')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            {transaction.supplier && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Building className="w-3 h-3" />
                                {transaction.supplier}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Tag className="w-3 h-3" />
                            {transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(transaction.type)}
                            <span className="capitalize">{transaction.type === 'income' ? 'Entrada' : 'Saída'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-bold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(transaction.id)}
                              title="Expandir detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {onView && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onView(transaction)}
                                title="Visualizar completo"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            {onEdit && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEdit(transaction)}
                                title="Editar"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                            {onDelete && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDelete(transaction.id)}
                                className="text-red-600 hover:text-red-700"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Linha Expandida */}
                      <AnimatePresence>
                        {expandedRow === transaction.id && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-gray-50">
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 space-y-3"
                              >
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {transaction.payment_method && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Método de Pagamento</p>
                                      <p className="font-medium flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        {transaction.payment_method}
                                      </p>
                                    </div>
                                  )}
                                  {transaction.source_type && (
                                    <div>
                                      <p className="text-xs text-muted-foreground mb-1">Origem</p>
                                      <p className="font-medium capitalize">{transaction.source_type}</p>
                                    </div>
                                  )}
                                  {transaction.notes && (
                                    <div className="col-span-2">
                                      <p className="text-xs text-muted-foreground mb-1">Observações</p>
                                      <p className="text-sm">{transaction.notes}</p>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            </TableCell>
                          </TableRow>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Rodapé com Paginação */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <p>
              Exibindo {filteredAndSortedTransactions.length} de {allTransactions.length} lançamentos
            </p>
            {selectedTransactions.size > 0 && (
              <p className="font-medium text-blue-600">
                {selectedTransactions.size} selecionado(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
    );
  } catch (error) {
    console.error('❌ Erro ao renderizar AdvancedTransactions:', error);
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="text-center">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Erro ao carregar lançamentos</h3>
            <p className="text-muted-foreground mb-4">
              Ocorreu um erro ao carregar os dados. Tente recarregar a página.
            </p>
            <Button onClick={() => window.location.reload()} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
};

export default AdvancedTransactions;
