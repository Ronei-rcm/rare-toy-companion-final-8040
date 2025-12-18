import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  BarChart,
  Building,
  Users,
  CreditCard,
  Settings,
  Zap,
  TrendingUp,
  DollarSign,
  Copy,
  Search,
  Filter,
  Download,
  Calendar,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  FileSpreadsheet,
  Target,
  TrendingDown,
  Inbox,
  Wallet,
  Link2,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AdvancedFinancialDashboard from '@/components/admin/AdvancedFinancialDashboard';
import CategoryManager from '@/components/admin/CategoryManager';
import SupplierClientManager from '@/components/admin/SupplierClientManager';
import AccountCardManager from '@/components/admin/AccountCardManager';
import AutomationIntegrationManager from '@/components/admin/AutomationIntegrationManager';
import SimpleTransactionModal from '@/components/admin/SimpleTransactionModal';
import PayBillModal from '@/components/admin/PayBillModal';
import MetricCard from '@/components/admin/MetricCard';
import LoadingState from '@/components/admin/LoadingState';
import EmptyState from '@/components/admin/EmptyState';
import SkeletonLoader from '@/components/admin/SkeletonLoader';
const RecurringTransactionsManager = lazy(() => import('@/components/admin/RecurringTransactionsManager'));
const CashFlowProjection = lazy(() => import('@/components/admin/CashFlowProjection'));
const ExecutiveReports = lazy(() => import('@/components/admin/ExecutiveReports'));
const BudgetManager = lazy(() => import('@/components/admin/BudgetManager'));
const BankReconciliationManager = lazy(() => import('@/components/admin/BankReconciliationManager'));

interface Transacao {
  id: number;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento: string;
  data: string;
  hora?: string | null;
  origem: string;
  observacoes: string;
}

export default function FinanceiroCompleto() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [automacoes, setAutomacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('transacoes');
  
  // Estados para o modal evoluído
  const [showEvolvedModal, setShowEvolvedModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'duplicate'>('create');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  // Estados para o modal de pagamento
  const [showPayModal, setShowPayModal] = useState(false);
  const [transactionToPay, setTransactionToPay] = useState<any>(null);
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    tipo: 'entrada' as 'entrada' | 'saida',
    valor: '',
    status: 'Pago' as 'Pago' | 'Pendente' | 'Atrasado',
    metodo_pagamento: 'PIX',
    data: new Date().toISOString().split('T')[0],
    origem: '',
    observacoes: ''
  });

  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [periodo, setPeriodo] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [filtersCollapsed, setFiltersCollapsed] = useState<boolean>(false);
  const [filtersInitialized, setFiltersInitialized] = useState<boolean>(false);
  const hasCustomDate = useMemo(() => !!(dataInicio || dataFim), [dataInicio, dataFim]);
  const [sortField, setSortField] = useState<string>('data');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchForm, setBatchForm] = useState({
    status: '',
    categoria: '',
    metodo_pagamento: '',
    data: ''
  });
  const [batchSaving, setBatchSaving] = useState(false);

  const parseDateSafe = useCallback((value: string | null | undefined) => {
    if (!value) return null;
    let raw = value.trim();

    // yyyy-mm-dd ou yyyy-mm-dd HH:mm:ss
    const isoDateTimeMatch = raw.match(/^(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (isoDateTimeMatch) {
      const [, datePart, hh, mm, ss] = isoDateTimeMatch;
      const h = Number(hh || 0);
      const m = Number(mm || 0);
      const s = Number(ss || 0);
      return new Date(`${datePart}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }

    // dd/mm/yyyy ou dd/mm/yyyy HH:mm:ss
    const brDateMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/);
    if (brDateMatch) {
      const [, dd, mm, yyyy, hh, min, ss] = brDateMatch;
      return new Date(
        Number(yyyy),
        Number(mm) - 1,
        Number(dd),
        Number(hh || 0),
        Number(min || 0),
        Number(ss || 0)
      );
    }

    // Fallback
    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }, []);

  // Carregar transações
  const carregarTransacoes = async () => {
    try {
      setLoading(true);
      console.log('🔄 Carregando transações...');
      
      const response = await fetch('/api/financial/transactions');
      if (!response.ok) throw new Error('Erro ao carregar');
      
      const data = await response.json();
      const transacoesCarregadas = data.transactions || [];
      
      // Log para debug - verificar campos retornados
      if (transacoesCarregadas.length > 0) {
        console.log('📊 Primeira transação (exemplo):', {
          id: transacoesCarregadas[0].id,
          data: transacoesCarregadas[0].data,
          hora: transacoesCarregadas[0].hora,
          descricao: transacoesCarregadas[0].descricao,
          metodo_pagamento: transacoesCarregadas[0].metodo_pagamento,
          origem: transacoesCarregadas[0].origem,
          categoria: transacoesCarregadas[0].categoria,
          tipo: transacoesCarregadas[0].tipo,
          valor: transacoesCarregadas[0].valor
        });
      }
      
      setTransacoes(transacoesCarregadas);
      
      // Extrair categorias únicas
      const categoriasUnicas = Array.from(new Set(transacoesCarregadas.map((t: Transacao) => t.categoria).filter(Boolean)));
      setCategorias(categoriasUnicas.sort());
      
      console.log('✅ Transações carregadas:', transacoesCarregadas.length);
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  // Carregar filtros da URL (query params) uma única vez
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const tipoParam = params.get('tipo');
    const statusParam = params.get('status');
    const catParam = params.get('categoria');
    const periodoParam = params.get('periodo');
    const searchParam = params.get('search') || '';
    const dataInicioParam = params.get('dataInicio') || '';
    const dataFimParam = params.get('dataFim') || '';
    const pageParam = params.get('page');
    const pageSizeParam = params.get('pageSize');
    const sortFieldParam = params.get('sortField');
    const sortOrderParam = params.get('sortOrder');

    const tiposValidos = ['all', 'entrada', 'saida'];
    const statusValidos = ['all', 'Pago', 'Pendente', 'Atrasado'];
    const periodosValidos = ['all', 'hoje', 'semana', 'mes', 'trimestre', 'ano'];
    const sortFieldsValidos = ['data', 'valor', 'descricao', 'categoria'];
    const sortOrdersValidos = ['asc', 'desc'];

    if (tiposValidos.includes(tipoParam || '')) setFilterTipo(tipoParam as string);
    if (statusValidos.includes(statusParam || '')) setFilterStatus(statusParam as string);
    if (catParam) setFilterCategoria(catParam);
    if (periodosValidos.includes(periodoParam || '')) setPeriodo(periodoParam as string);
    if (searchParam) setSearchTerm(searchParam);
    if (dataInicioParam) setDataInicio(dataInicioParam);
    if (dataFimParam) setDataFim(dataFimParam);
    if (pageParam && !Number.isNaN(Number(pageParam))) setCurrentPage(Math.max(1, Number(pageParam)));
    if (pageSizeParam && !Number.isNaN(Number(pageSizeParam))) setItemsPerPage(Math.min(100, Math.max(5, Number(pageSizeParam))));
    if (sortFieldParam && sortFieldsValidos.includes(sortFieldParam)) setSortField(sortFieldParam);
    if (sortOrderParam && sortOrdersValidos.includes(sortOrderParam)) setSortOrder(sortOrderParam as 'asc' | 'desc');

    setFiltersInitialized(true);
  }, []);

  // Sincronizar filtros com a URL (sem recarregar a página)
  useEffect(() => {
    if (!filtersInitialized || typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);

    const setOrDelete = (key: string, value: string, isDefault: boolean) => {
      if (!value || isDefault) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    };

    setOrDelete('search', searchTerm, searchTerm === '');
    setOrDelete('tipo', filterTipo, filterTipo === 'all');
    setOrDelete('status', filterStatus, filterStatus === 'all');
    setOrDelete('categoria', filterCategoria, filterCategoria === 'all');
    setOrDelete('periodo', periodo, periodo === 'all' || hasCustomDate);
    setOrDelete('dataInicio', dataInicio, dataInicio === '');
    setOrDelete('dataFim', dataFim, dataFim === '');
    setOrDelete('page', String(currentPage), currentPage === 1);
    setOrDelete('pageSize', String(itemsPerPage), itemsPerPage === 20);
    setOrDelete('sortField', sortField, sortField === 'data');
    setOrDelete('sortOrder', sortOrder, sortOrder === 'desc');

    const newQuery = params.toString();
    const newUrl = newQuery ? `${window.location.pathname}?${newQuery}` : window.location.pathname;
    window.history.replaceState({}, '', newUrl);
  }, [
    searchTerm,
    filterTipo,
    filterStatus,
    filterCategoria,
    periodo,
    dataInicio,
    dataFim,
    hasCustomDate,
    currentPage,
    itemsPerPage,
    sortField,
    sortOrder,
    filtersInitialized
  ]);

  // Filtrar e ordenar transações
  const transacoesFiltradas = useMemo(() => {
    let filtered = [...transacoes];

    // Busca por termo
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.descricao.toLowerCase().includes(term) ||
        t.categoria.toLowerCase().includes(term) ||
        t.origem?.toLowerCase().includes(term) ||
        t.observacoes?.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    if (filterTipo !== 'all') {
      filtered = filtered.filter(t => t.tipo === filterTipo);
    }

    // Filtro por status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(t => t.status === filterStatus);
    }

    // Filtro por categoria
    if (filterCategoria !== 'all') {
      filtered = filtered.filter(t => t.categoria === filterCategoria);
    }

    // Filtro por período
    if (!hasCustomDate && periodo !== 'all') {
      const now = new Date();
      const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(t => {
        const dataTransacao = parseDateSafe(t.data);
        if (!dataTransacao) return false;
        
        switch (periodo) {
          case 'hoje':
            return dataTransacao >= hoje;
          case 'semana':
            const semanaAtras = new Date(hoje);
            semanaAtras.setDate(semanaAtras.getDate() - 7);
            return dataTransacao >= semanaAtras;
          case 'mes':
            const mesAtras = new Date(hoje);
            mesAtras.setMonth(mesAtras.getMonth() - 1);
            return dataTransacao >= mesAtras;
          case 'trimestre':
            const trimestreAtras = new Date(hoje);
            trimestreAtras.setMonth(trimestreAtras.getMonth() - 3);
            return dataTransacao >= trimestreAtras;
          case 'ano':
            const anoAtras = new Date(hoje);
            anoAtras.setFullYear(anoAtras.getFullYear() - 1);
            return dataTransacao >= anoAtras;
          default:
            return true;
        }
      });
    }

    // Filtro por intervalo de datas customizado
    if (dataInicio || dataFim) {
      const inicio = dataInicio ? parseDateSafe(dataInicio) : null;
      const fim = dataFim ? parseDateSafe(dataFim) : null;

      filtered = filtered.filter(t => {
        const dataTransacao = parseDateSafe(t.data);
        if (!dataTransacao) return false;
        if (inicio && dataTransacao < inicio) return false;
        if (fim) {
          const fimAjustado = new Date(fim);
          fimAjustado.setHours(23, 59, 59, 999);
          if (dataTransacao > fimAjustado) return false;
        }
        return true;
      });
    }

    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'data':
          aValue = parseDateSafe(a.data)?.getTime() ?? 0;
          bValue = parseDateSafe(b.data)?.getTime() ?? 0;
          break;
        case 'valor':
          aValue = Number(a.valor);
          bValue = Number(b.valor);
          break;
        case 'descricao':
          aValue = a.descricao.toLowerCase();
          bValue = b.descricao.toLowerCase();
          break;
        case 'categoria':
          aValue = a.categoria.toLowerCase();
          bValue = b.categoria.toLowerCase();
          break;
        default:
          aValue = a[sortField as keyof Transacao];
          bValue = b[sortField as keyof Transacao];
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    transacoes,
    searchTerm,
    filterTipo,
    filterStatus,
    filterCategoria,
    periodo,
    dataInicio,
    dataFim,
    hasCustomDate,
    sortField,
    sortOrder,
    parseDateSafe
  ]);

  // Paginação
  const totalPages = Math.ceil(transacoesFiltradas.length / itemsPerPage);
  const transacoesPaginadas = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return transacoesFiltradas.slice(start, start + itemsPerPage);
  }, [transacoesFiltradas, currentPage, itemsPerPage]);
  const selectedCount = selectedIds.length;
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };
  const toggleSelectAllPage = () => {
    const pageIds = transacoesPaginadas.map((t) => t.id);
    const allSelected = pageIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !pageIds.includes(id)) : Array.from(new Set([...prev, ...pageIds]))
    );
  };
  const isPageFullySelected = transacoesPaginadas.length > 0 && transacoesPaginadas.every((t) => selectedIds.includes(t.id));

  const aplicarEdicaoLote = async () => {
    if (selectedIds.length === 0) {
      toast.error('Selecione pelo menos uma transação');
      return;
    }
    const camposSelecionados = Object.values(batchForm).some((v) => v);
    if (!camposSelecionados) {
      toast.error('Escolha ao menos um campo para atualizar em lote');
      return;
    }
    try {
      setBatchSaving(true);
      for (const id of selectedIds) {
        const original = transacoes.find((t) => t.id === id);
        if (!original) continue;
        const payload = {
          ...original,
          status: batchForm.status || original.status,
          categoria: batchForm.categoria || original.categoria,
          metodo_pagamento: batchForm.metodo_pagamento || original.metodo_pagamento,
          data: batchForm.data || original.data
        };
        const response = await fetch('/api/financial/transactions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('Erro ao atualizar transação');
      }
      toast.success('Transações atualizadas em lote');
      setShowBatchModal(false);
      setBatchForm({ status: '', categoria: '', metodo_pagamento: '', data: '' });
      setSelectedIds([]);
      await carregarTransacoes();
    } catch (error) {
      console.error('❌ Erro no lote:', error);
      toast.error('Erro ao atualizar em lote');
    } finally {
      setBatchSaving(false);
    }
  };

  // Função para ordenar
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Exportar dados
  const exportarDados = (formato: 'csv' | 'json') => {
    const dados = transacoesFiltradas.map(t => ({
      Data: new Date(t.data).toLocaleDateString('pt-BR'),
      Hora: t.hora || 'N/A',
      Descrição: t.descricao,
      Categoria: t.categoria,
      Tipo: t.tipo === 'entrada' ? 'Entrada' : 'Saída',
      Valor: Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
      'Método Pagamento': t.metodo_pagamento || 'N/A',
      Origem: t.origem || 'N/A',
      Status: t.status,
      Observações: t.observacoes || 'N/A'
    }));

    if (formato === 'csv') {
      const headers = Object.keys(dados[0] || {});
      const csv = [
        headers.join(','),
        ...dados.map(row => headers.map(h => `"${row[h as keyof typeof row]}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      toast.success('Dados exportados em CSV!');
    } else {
      const json = JSON.stringify(dados, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `transacoes_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      toast.success('Dados exportados em JSON!');
    }
  };

  // Funções para o modal evoluído
  const abrirModalEvoluido = (mode: 'create' | 'edit' | 'duplicate', transaction?: any) => {
    setModalMode(mode);
    setSelectedTransaction(transaction);
    setShowEvolvedModal(true);
  };

  const fecharModalEvoluido = () => {
    setShowEvolvedModal(false);
    setSelectedTransaction(null);
  };

  const salvarTransacaoEvoluida = async (data: any) => {
    try {
      const isEdit = modalMode === 'edit' && data.id;
      const url = '/api/financial/transactions';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar transação');
      }

      const result = await response.json();
      console.log('✅ Transação salva:', result);

      // Recarregar transações
      await carregarTransacoes();

      return result;
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      throw error;
    }
  };

  const editarTransacao = (transacao: any) => {
    setSelectedTransaction(transacao);
    setModalMode('edit');
    setShowEvolvedModal(true);
  };

  const duplicarTransacao = (transacao: any) => {
    setSelectedTransaction(transacao);
    setModalMode('duplicate');
    setShowEvolvedModal(true);
  };

  // Salvar transação
  const salvarTransacao = async () => {
    try {
      if (!formData.descricao || !formData.categoria || !formData.valor) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }

      const dados = {
        descricao: formData.descricao,
        categoria: formData.categoria,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        status: formData.status,
        metodo_pagamento: formData.metodo_pagamento,
        data: formData.data,
        origem: formData.origem,
        observacoes: formData.observacoes
      };

      console.log('💾 Salvando:', dados);

      const response = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      const result = await response.json();
      console.log('✅ Salvo:', result);

      toast.success(`Transação criada! ID: ${result.id}`);
      setShowModal(false);
      resetForm();
      await carregarTransacoes();
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao salvar transação');
    }
  };

  // Excluir transação
  const excluirTransacao = async (id: number) => {
    if (!confirm('Excluir esta transação?')) return;

    try {
      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Erro ao excluir');

      toast.success('Transação excluída!');
      await carregarTransacoes();
    } catch (error) {
      console.error('❌ Erro:', error);
      toast.error('Erro ao excluir');
    }
  };

  // Abrir modal de pagamento
  const abrirModalPagamento = (transacao: Transacao) => {
    if (transacao.status === 'Pago') {
      toast.info('Esta transação já está paga');
      return;
    }
    setTransactionToPay(transacao);
    setShowPayModal(true);
  };

  // Fechar modal de pagamento
  const fecharModalPagamento = () => {
    setShowPayModal(false);
    setTransactionToPay(null);
  };

  // Callback após pagamento bem-sucedido
  const handlePagamentoSucesso = async () => {
    await carregarTransacoes();
    // Recarregar contas se necessário (pode adicionar callback do AccountCardManager se necessário)
  };

  // Resetar formulário
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

  // Calcular resumo (usando transações filtradas)
  const resumo = useMemo(() => {
    const entradas = transacoesFiltradas.filter(t => t.tipo === 'entrada').reduce((sum, t) => sum + Number(t.valor), 0);
    const saidas = transacoesFiltradas.filter(t => t.tipo === 'saida').reduce((sum, t) => sum + Number(t.valor), 0);
    return {
      totalEntradas: entradas,
      totalSaidas: saidas,
      saldoLiquido: entradas - saidas,
      totalTransacoes: transacoesFiltradas.length,
      pendentes: transacoesFiltradas.filter(t => t.status === 'Pendente').length,
      atrasados: transacoesFiltradas.filter(t => t.status === 'Atrasado').length
    };
  }, [transacoesFiltradas]);

  // Debug do resumo
  console.log('📊 Resumo calculado:', {
    totalEntradas: resumo.totalEntradas,
    totalSaidas: resumo.totalSaidas,
    saldoLiquido: resumo.saldoLiquido,
    totalTransacoes: resumo.totalTransacoes,
    transacoes: transacoes.map(t => ({ id: t.id, tipo: t.tipo, valor: t.valor }))
  });

  useEffect(() => {
    carregarTransacoes();
  }, []);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Evitar atalhos quando estiver digitando em inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      // Ctrl/Cmd + K para abrir busca
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('search');
        searchInput?.focus();
        searchInput?.select();
      }
      
      // Ctrl/Cmd + N para nova transação
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        abrirModalEvoluido('create');
      }
      
      // Escape para fechar modais
      if (e.key === 'Escape' && showEvolvedModal) {
        fecharModalEvoluido();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEvolvedModal, abrirModalEvoluido, fecharModalEvoluido]);

  return (
    <div className="p-6 pt-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-200">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">💰 Sistema Financeiro</h1>
          <p className="text-gray-600 text-sm">Gestão completa de transações financeiras</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={carregarTransacoes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => exportarDados('csv')} variant="outline" size="sm">
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => exportarDados('json')} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
          <Button onClick={() => abrirModalEvoluido('create')} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nova Transação
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 mb-6 gap-1">
          <TabsTrigger value="transacoes" className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden md:inline">Transações</span>
          </TabsTrigger>
          <TabsTrigger value="conciliacao" className="flex items-center space-x-2">
            <Link2 className="h-4 w-4" />
            <span className="hidden md:inline">Conciliação</span>
          </TabsTrigger>
          <TabsTrigger value="recorrencias" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden md:inline">Recorrências</span>
          </TabsTrigger>
          <TabsTrigger value="projecao" className="flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Projeção</span>
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span className="hidden md:inline">Relatórios</span>
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span className="hidden md:inline">Orçamentos</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Dashboard</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="flex items-center space-x-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Categorias</span>
          </TabsTrigger>
          <TabsTrigger value="fornecedores" className="flex items-center space-x-2">
            <Building className="h-4 w-4" />
            <span className="hidden md:inline">Fornecedores</span>
          </TabsTrigger>
          <TabsTrigger value="contas" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden md:inline">Contas</span>
          </TabsTrigger>
          <TabsTrigger value="automatizacoes" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span className="hidden md:inline">Automações</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="transacoes" className="space-y-8 mt-8 pt-4">
          {/* Resumo Financeiro */}
          {loading ? (
            <SkeletonLoader type="metric" count={4} />
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Total Entradas"
              value={resumo.totalEntradas}
              format="currency"
              color="green"
              icon={<TrendingUp className="h-5 w-5" />}
              subtitle="Receitas totais"
            />
            <MetricCard
              title="Total Saídas"
              value={resumo.totalSaidas}
              format="currency"
              color="red"
              icon={<TrendingDown className="h-5 w-5" />}
              subtitle="Despesas totais"
            />
            <MetricCard
              title="Saldo Líquido"
              value={resumo.saldoLiquido}
              format="currency"
              color={resumo.saldoLiquido >= 0 ? 'green' : 'red'}
              icon={<DollarSign className="h-5 w-5" />}
              subtitle="Resultado líquido"
            />
            <MetricCard
              title="Total Transações"
              value={resumo.totalTransacoes}
              format="number"
              color="blue"
              icon={<FileText className="h-5 w-5" />}
              subtitle={`${resumo.pendentes} pendentes, ${resumo.atrasados} atrasadas`}
            />
          </div>
          )}

          {/* Filtros e Busca */}
          <Card className="shadow-sm bg-gradient-to-r from-gray-50 to-white border-gray-200">
            <CardHeader className="pb-4 flex flex-col gap-3 md:gap-2 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2 md:space-y-1 w-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Filter className="h-5 w-5 text-blue-600" />
                    </div>
                    Filtros e Busca
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiltersCollapsed((prev) => !prev)}
                    aria-expanded={!filtersCollapsed}
                    className="gap-2 text-gray-600 hover:text-gray-900 self-end sm:self-auto"
                  >
                    {filtersCollapsed ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Expandir filtros
                      </>
                    ) : (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Recolher filtros
                      </>
                    )}
                  </Button>
                </div>
                <CardDescription className="text-sm text-gray-500">
                  Busque e filtre transações por descrição, categoria, tipo, status e período
                </CardDescription>
                <div className="flex flex-wrap gap-2 pt-1 overflow-x-auto no-scrollbar pr-1">
                  {searchTerm && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      Busca: “{searchTerm}”
                      <button aria-label="Limpar busca" onClick={() => { setSearchTerm(''); setCurrentPage(1); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterTipo !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      Tipo: {filterTipo === 'entrada' ? 'Entrada' : 'Saída'}
                      <button aria-label="Limpar tipo" onClick={() => { setFilterTipo('all'); setCurrentPage(1); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterStatus !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      Status: {filterStatus}
                      <button aria-label="Limpar status" onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {filterCategoria !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      Categoria: {filterCategoria}
                      <button aria-label="Limpar categoria" onClick={() => { setFilterCategoria('all'); setCurrentPage(1); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {!hasCustomDate && periodo !== 'all' && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      Período: {periodo}
                      <button aria-label="Limpar período" onClick={() => { setPeriodo('all'); setCurrentPage(1); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {hasCustomDate && (
                    <Badge variant="secondary" className="flex items-center gap-2">
                      Datas: {dataInicio || '...'} {dataFim ? `→ ${dataFim}` : ''}
                      <button aria-label="Limpar datas" onClick={() => { setDataInicio(''); setDataFim(''); setCurrentPage(1); }}>
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            {!filtersCollapsed && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 md:gap-4">
                  <div className="sm:col-span-2 lg:col-span-2">
                    <Label htmlFor="search" className="text-sm font-medium text-gray-700 mb-2 block">
                      Buscar
                    </Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                      <Input
                        id="search"
                        placeholder="Buscar por descrição, categoria..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-10 h-10 w-full transition-all focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tipo" className="text-sm font-medium text-gray-700 mb-2 block">
                      Tipo
                    </Label>
                    <Select value={filterTipo} onValueChange={(value) => { setFilterTipo(value); setCurrentPage(1); }}>
                      <SelectTrigger id="tipo" className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="entrada">💰 Entrada</SelectItem>
                        <SelectItem value="saida">💸 Saída</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status" className="text-sm font-medium text-gray-700 mb-2 block">
                      Status
                    </Label>
                    <Select value={filterStatus} onValueChange={(value) => { setFilterStatus(value); setCurrentPage(1); }}>
                      <SelectTrigger id="status" className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="Pago">✅ Pago</SelectItem>
                        <SelectItem value="Pendente">⏳ Pendente</SelectItem>
                        <SelectItem value="Atrasado">⚠️ Atrasado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="categoria" className="text-sm font-medium text-gray-700 mb-2 block">
                      Categoria
                    </Label>
                    <Select value={filterCategoria} onValueChange={(value) => { setFilterCategoria(value); setCurrentPage(1); }}>
                      <SelectTrigger id="categoria" className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {categorias.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="lg:col-span-2">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">
                      Data específica ou intervalo
                    </Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => {
                          setDataInicio(e.target.value);
                          setPeriodo('all');
                          setCurrentPage(1);
                        }}
                        className="h-10"
                        placeholder="Início"
                      />
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => {
                          setDataFim(e.target.value);
                          setPeriodo('all');
                          setCurrentPage(1);
                        }}
                        className="h-10"
                        placeholder="Fim"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Preencha início e/ou fim para filtrar por datas exatas. Esse intervalo sobrepõe o período rápido.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-2 border-t border-gray-100">
                  <div>
                    <Label htmlFor="periodo" className="text-sm font-medium text-gray-700 mb-2 block">
                      Período rápido
                    </Label>
                    <Select value={hasCustomDate ? 'all' : periodo} onValueChange={(value) => { setPeriodo(value); setCurrentPage(1); }}>
                      <SelectTrigger id="periodo" className="h-10" disabled={hasCustomDate}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os períodos</SelectItem>
                        <SelectItem value="hoje">Hoje</SelectItem>
                        <SelectItem value="semana">Últimos 7 dias</SelectItem>
                        <SelectItem value="mes">Último mês</SelectItem>
                        <SelectItem value="trimestre">Último trimestre</SelectItem>
                        <SelectItem value="ano">Último ano</SelectItem>
                      </SelectContent>
                    </Select>
                    {hasCustomDate && (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-amber-600">
                        <span>Período rápido desabilitado pois há intervalo customizado.</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-amber-700 hover:text-amber-800"
                          onClick={() => {
                            setDataInicio('');
                            setDataFim('');
                            setPeriodo('all');
                            setCurrentPage(1);
                          }}
                        >
                          Usar período rápido
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-end sm:col-span-2 lg:col-span-2">
                    <div className="flex flex-wrap gap-2 w-full">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm('');
                          setFilterTipo('all');
                          setFilterStatus('all');
                          setFilterCategoria('all');
                          setPeriodo('all');
                          setDataInicio('');
                          setDataFim('');
                          setCurrentPage(1);
                        }}
                        className="h-10"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Limpar Filtros
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Tabela de Transações */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">Transações ({resumo.totalTransacoes})</h2>
            <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex justify-between items-center">
              <CardTitle className="text-base font-semibold">📋 Lista de Transações</CardTitle>
                <div className="flex items-center gap-2">
                  <Label htmlFor="itemsPerPage" className="text-sm">Itens por página:</Label>
                  <Select value={itemsPerPage.toString()} onValueChange={(value) => { setItemsPerPage(Number(value)); setCurrentPage(1); }}>
                    <SelectTrigger id="itemsPerPage" className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                <div className="text-sm text-gray-700">
                  {selectedCount > 0 ? `${selectedCount} transações selecionadas` : 'Selecione transações para ações em lote'}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selectedCount === 0}
                    onClick={() => setShowBatchModal(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar em lote
                  </Button>
                  {selectedCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedIds([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar seleção
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <SkeletonLoader type="table" count={1} />
              ) : transacoesPaginadas.length === 0 && transacoes.length === 0 ? (
                <EmptyState
                  icon={Inbox}
                  title="Nenhuma transação encontrada"
                  description="Comece criando sua primeira transação financeira"
                  actionLabel="+ Nova Transação"
                  onAction={() => abrirModalEvoluido('create')}
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50">
                        <TableHead className="w-12">
                          <Checkbox
                            aria-label="Selecionar todas da página"
                            checked={isPageFullySelected}
                            onCheckedChange={toggleSelectAllPage}
                          />
                        </TableHead>
                        <TableHead className="font-semibold">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('data')} 
                            className="hover:bg-transparent font-semibold focus:ring-2 focus:ring-blue-500"
                            aria-label={`Ordenar por data ${sortField === 'data' && sortOrder === 'asc' ? '(descendente)' : '(ascendente)'}`}
                          >
                            Data
                            <ArrowUpDown className="h-4 w-4 ml-2" aria-hidden="true" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('descricao')} 
                            className="hover:bg-transparent font-semibold focus:ring-2 focus:ring-blue-500"
                            aria-label={`Ordenar por descrição ${sortField === 'descricao' && sortOrder === 'asc' ? '(descendente)' : '(ascendente)'}`}
                          >
                            Descrição
                            <ArrowUpDown className="h-4 w-4 ml-2" aria-hidden="true" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('categoria')} 
                            className="hover:bg-transparent font-semibold focus:ring-2 focus:ring-blue-500"
                            aria-label={`Ordenar por categoria ${sortField === 'categoria' && sortOrder === 'asc' ? '(descendente)' : '(ascendente)'}`}
                          >
                            Categoria
                            <ArrowUpDown className="h-4 w-4 ml-2" aria-hidden="true" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <span className="sr-only">Tipo</span>
                          Tipo
                        </TableHead>
                        <TableHead className="font-semibold">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleSort('valor')} 
                            className="hover:bg-transparent font-semibold focus:ring-2 focus:ring-blue-500"
                            aria-label={`Ordenar por valor ${sortField === 'valor' && sortOrder === 'asc' ? '(descendente)' : '(ascendente)'}`}
                          >
                            Valor
                            <ArrowUpDown className="h-4 w-4 ml-2" aria-hidden="true" />
                          </Button>
                        </TableHead>
                        <TableHead className="font-semibold">
                          <span className="sr-only">Método</span>
                          Método
                        </TableHead>
                        <TableHead className="font-semibold">
                          <span className="sr-only">Origem</span>
                          Origem
                        </TableHead>
                        <TableHead className="font-semibold">
                          <span className="sr-only">Status</span>
                          Status
                        </TableHead>
                        <TableHead className="font-semibold">
                          <span className="sr-only">Ações</span>
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transacoesPaginadas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="p-0">
                            <EmptyState
                              icon={Inbox}
                              title="Nenhuma transação corresponde aos filtros"
                              description="Tente ajustar os filtros ou limpar para ver todas as transações"
                              actionLabel="Limpar Filtros"
                              onAction={() => {
                                setSearchTerm('');
                                setFilterTipo('all');
                                setFilterStatus('all');
                                setFilterCategoria('all');
                                setPeriodo('all');
                                setCurrentPage(1);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      ) : (
                        transacoesPaginadas.map((transacao, index) => (
                          <TableRow 
                            key={transacao.id}
                            className={`
                              ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                              hover:bg-blue-50/50
                              transition-all duration-200
                              cursor-pointer
                              group
                              hover:shadow-sm
                            `}
                          >
                            <TableCell>
                              <Checkbox
                                aria-label={`Selecionar transação ${transacao.id}`}
                                checked={selectedIds.includes(transacao.id)}
                                onCheckedChange={() => toggleSelect(transacao.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">
                              <div>
                                {new Date(transacao.data).toLocaleDateString('pt-BR')}
                                {transacao.hora && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    {transacao.hora}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={transacao.descricao}>
                                {transacao.descricao}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="transition-all hover:scale-105 cursor-default">
                                {transacao.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={`transition-all hover:scale-105 cursor-default ${
                                transacao.tipo === 'entrada' 
                                  ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                  : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                              }`}>
                                {transacao.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                              </Badge>
                            </TableCell>
                            <TableCell className={`font-semibold ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                              {transacao.tipo === 'entrada' ? '+' : '-'}R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {transacao.metodo_pagamento || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs truncate" title={transacao.origem || 'N/A'}>
                                {transacao.origem || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {transacao.status === 'Pago' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                {transacao.status === 'Pendente' && <Clock className="h-4 w-4 text-yellow-600" />}
                                {transacao.status === 'Atrasado' && <AlertCircle className="h-4 w-4 text-red-600" />}
                                <Badge className={`transition-all hover:scale-105 cursor-default ${
                                  transacao.status === 'Pago' 
                                    ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200' 
                                    : transacao.status === 'Pendente'
                                    ? 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
                                    : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200'
                                }`}>
                                  {transacao.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {(transacao.status === 'Pendente' || transacao.status === 'Atrasado') && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => abrirModalPagamento(transacao)}
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    title="Pagar conta"
                                  >
                                    <Wallet className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => editarTransacao(transacao)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  title="Editar transação"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => duplicarTransacao(transacao)}
                                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                                  title="Duplicar transação"
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => excluirTransacao(transacao.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Excluir transação"
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
                  
                  {/* Paginação */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, transacoesFiltradas.length)} de {transacoesFiltradas.length} transações
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Anterior
                        </Button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else if (currentPage <= 3) {
                              pageNum = i + 1;
                            } else if (currentPage >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
                            } else {
                              pageNum = currentPage - 2 + i;
                            }
                            return (
                              <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? "default" : "outline"}
                                size="sm"
                                onClick={() => setCurrentPage(pageNum)}
                                className="w-10"
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          </div>

          <Dialog open={showBatchModal} onOpenChange={setShowBatchModal}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Edição em lote</DialogTitle>
                <DialogDescription>
                  Atualize campos selecionados para {selectedCount} transações ao mesmo tempo. Deixe um campo em "Não alterar" para preservar o valor atual.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={batchForm.status || 'manter'}
                    onValueChange={(value) => setBatchForm((prev) => ({ ...prev, status: value === 'manter' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não alterar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manter">Não alterar</SelectItem>
                      <SelectItem value="Pago">Pago</SelectItem>
                      <SelectItem value="Pendente">Pendente</SelectItem>
                      <SelectItem value="Atrasado">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={batchForm.categoria || 'manter'}
                    onValueChange={(value) => setBatchForm((prev) => ({ ...prev, categoria: value === 'manter' ? '' : value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Não alterar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manter">Não alterar</SelectItem>
                      {categorias.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Input
                    placeholder="PIX, Cartão, Boleto..."
                    value={batchForm.metodo_pagamento}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, metodo_pagamento: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Deixe em branco para não alterar.</p>
                </div>

                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={batchForm.data}
                    onChange={(e) => setBatchForm((prev) => ({ ...prev, data: e.target.value }))}
                  />
                  <p className="text-xs text-gray-500">Opcional; mantém data original se vazio.</p>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowBatchModal(false)}>
                  Cancelar
                </Button>
                <Button onClick={aplicarEdicaoLote} disabled={batchSaving}>
                  {batchSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Aplicar em lote
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="conciliacao" className="mt-8 pt-4">
          <Suspense fallback={
            <LoadingState message="Carregando Conciliação Bancária..." fullHeight />
          }>
            <BankReconciliationManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="recorrencias" className="mt-8 pt-4">
          <Suspense fallback={
            <LoadingState message="Carregando Transações Recorrentes..." fullHeight />
          }>
            <RecurringTransactionsManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="projecao" className="mt-8 pt-4">
          <Suspense fallback={
            <LoadingState message="Carregando Projeção de Fluxo de Caixa..." fullHeight />
          }>
            <CashFlowProjection />
          </Suspense>
        </TabsContent>

        <TabsContent value="relatorios" className="mt-8 pt-4">
          <Suspense fallback={
            <LoadingState message="Carregando Relatórios Executivos..." fullHeight />
          }>
            <ExecutiveReports />
          </Suspense>
        </TabsContent>

        <TabsContent value="orcamentos" className="mt-8 pt-4">
          <Suspense fallback={
            <LoadingState message="Carregando Orçamentos..." fullHeight />
          }>
            <BudgetManager />
          </Suspense>
        </TabsContent>

        <TabsContent value="dashboard" className="mt-8 pt-4">
          <AdvancedFinancialDashboard />
        </TabsContent>

        <TabsContent value="categorias" className="mt-8 pt-4">
          <CategoryManager />
        </TabsContent>

        <TabsContent value="fornecedores" className="mt-8 pt-4">
          <SupplierClientManager />
        </TabsContent>

        <TabsContent value="contas" className="mt-8 pt-4">
          <AccountCardManager />
        </TabsContent>

        <TabsContent value="automatizacoes" className="mt-8 pt-4">
          <AutomationIntegrationManager />
        </TabsContent>
      </Tabs>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>➕ Nova Transação</CardTitle>
              <CardDescription>Preencha os dados da nova transação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Venda de produtos"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Select value={formData.tipo} onValueChange={(value: 'entrada' | 'saida') => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">💰 Entrada</SelectItem>
                      <SelectItem value="saida">💸 Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="origem">Origem</Label>
                <Input
                  id="origem"
                  value={formData.origem}
                  onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                  placeholder="Ex: Cliente, Fornecedor"
                />
              </div>

              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Informações adicionais"
                />
              </div>
            </CardContent>
            <div className="flex justify-end gap-2 p-6 pt-0">
              <Button variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </Button>
              <Button onClick={salvarTransacao} className="bg-green-600 hover:bg-green-700">
                💾 Salvar Transação
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Evoluído */}
      <SimpleTransactionModal
        isOpen={showEvolvedModal}
        onClose={fecharModalEvoluido}
        onSave={salvarTransacaoEvoluida}
        mode={modalMode}
        transaction={selectedTransaction}
      />

      {/* Modal de Pagamento */}
      <PayBillModal
        isOpen={showPayModal}
        onClose={fecharModalPagamento}
        transaction={transactionToPay}
        onSuccess={handlePagamentoSucesso}
      />
    </div>
  );
}
