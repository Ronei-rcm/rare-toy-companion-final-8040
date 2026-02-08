import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { financialApi } from '@/services/financial-api';

interface SupplierFinancialData {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  status: 'ativo' | 'inativo' | 'pendente';
  // Dados financeiros
  limiteCredito: number;
  saldoDevedor: number;
  totalCompras: number;
  ultimaCompra: string;
  prazoPagamento: number;
  descontoPadrao: number;
  // Histórico de transações
  transacoes: SupplierTransaction[];
  // Métricas
  scoreFinanceiro: number;
  riscoCredito: 'baixo' | 'medio' | 'alto';
  // Dados bancários
  banco?: string;
  agencia?: string;
  conta?: string;
  pix?: string;
}

interface SupplierTransaction {
  id: string;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'compra' | 'pagamento' | 'devolucao' | 'desconto';
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  formaPagamento?: string;
  observacoes?: string;
}

interface SupplierPayment {
  id: string;
  dataVencimento: string;
  dataPagamento?: string;
  valor: number;
  status: 'pendente' | 'pago' | 'atrasado';
  formaPagamento?: string;
  observacoes?: string;
}

export const useSupplierFinancial = () => {
  const [suppliers, setSuppliers] = useState<SupplierFinancialData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar fornecedores com dados financeiros
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Buscar fornecedores da API
      const data = await financialApi.getSuppliers();
      const suppliersList = data.suppliers || [];

      // Enriquecer com dados financeiros
      const enrichedSuppliers = await Promise.all(
        suppliersList.map(async (supplier: any) => {
          try {
            // Buscar transações financeiras do fornecedor
            const transactions = await financialApi.getSupplierTransactions(supplier.id);

            // Buscar pagamentos pendentes
            const payments = await financialApi.getSupplierPayments(supplier.id);

            return {
              id: supplier.id,
              nome: supplier.nome || supplier.name,
              email: supplier.email,
              telefone: supplier.telefone || supplier.phone,
              status: supplier.status || 'ativo',
              limiteCredito: supplier.limiteCredito || 10000,
              saldoDevedor: calculateSaldoDevedor(transactions || [], payments || []),
              totalCompras: calculateTotalCompras(transactions || []),
              ultimaCompra: getUltimaCompra(transactions || []),
              prazoPagamento: supplier.prazoPagamento || 30,
              descontoPadrao: supplier.descontoPadrao || 0,
              transacoes: transactions || [],
              scoreFinanceiro: calculateScoreFinanceiro(transactions || [], payments || []),
              riscoCredito: calculateRiscoCredito(transactions || [], payments || []),
              banco: supplier.banco,
              agencia: supplier.agencia,
              conta: supplier.conta,
              pix: supplier.pix
            };
          } catch (e) {
            console.error(`Erro ao enriquecer fornecedor ${supplier.id}:`, e);
            return {
              id: supplier.id,
              nome: supplier.nome || supplier.name,
              email: supplier.email,
              status: 'pendente',
              limiteCredito: 0,
              saldoDevedor: 0,
              totalCompras: 0,
              ultimaCompra: '',
              prazoPagamento: 0,
              descontoPadrao: 0,
              transacoes: [],
              scoreFinanceiro: 0,
              riscoCredito: 'alto' as const
            } as SupplierFinancialData;
          }
        })
      );

      setSuppliers(enrichedSuppliers);
    } catch (error: any) {
      console.error('Erro ao buscar fornecedores financeiros:', error);
      setError(error.message);

      // Fallback com dados simulados
      setSuppliers(getMockSupplierFinancialData());
    } finally {
      setLoading(false);
    }
  };

  // Criar transação financeira para fornecedor
  const createSupplierTransaction = async (
    supplierId: string,
    transactionData: Omit<SupplierTransaction, 'id'>
  ): Promise<boolean> => {
    try {
      await financialApi.updateSupplierTransaction(supplierId, transactionData);
      toast.success('Transação criada com sucesso!');
      await fetchSuppliers(); // Recarregar dados
      return true;
    } catch (error: any) {
      console.error('Erro ao criar transação:', error);
      toast.error(error.message || 'Erro ao criar transação');
      return false;
    }
  };

  // Registrar pagamento
  const recordPayment = async (
    supplierId: string,
    paymentData: Omit<SupplierPayment, 'id'>
  ): Promise<boolean> => {
    try {
      await financialApi.updateSupplierPayment(supplierId, paymentData);
      toast.success('Pagamento registrado com sucesso!');
      await fetchSuppliers(); // Recarregar dados
      return true;
    } catch (error: any) {
      console.error('Erro ao registrar pagamento:', error);
      toast.error(error.message || 'Erro ao registrar pagamento');
      return false;
    }
  };

  // Atualizar limite de crédito
  const updateCreditLimit = async (supplierId: string, newLimit: number): Promise<boolean> => {
    try {
      await financialApi.updateSupplierCreditLimit(supplierId, { limiteCredito: newLimit });
      toast.success('Limite de crédito atualizado!');
      await fetchSuppliers(); // Recarregar dados
      return true;
    } catch (error: any) {
      console.error('Erro ao atualizar limite:', error);
      toast.error(error.message || 'Erro ao atualizar limite de crédito');
      return false;
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return {
    suppliers,
    loading,
    error,
    fetchSuppliers,
    createSupplierTransaction,
    recordPayment,
    updateCreditLimit
  };
};

// Funções auxiliares
const calculateSaldoDevedor = (transactions: any[], payments: any[]): number => {
  const totalCompras = transactions
    .filter(t => t.tipo === 'compra')
    .reduce((sum, t) => sum + t.valor, 0);

  const totalPagamentos = payments
    .filter(p => p.status === 'pago')
    .reduce((sum, p) => sum + p.valor, 0);

  return totalCompras - totalPagamentos;
};

const calculateTotalCompras = (transactions: any[]): number => {
  return transactions
    .filter(t => t.tipo === 'compra')
    .reduce((sum, t) => sum + t.valor, 0);
};

const getUltimaCompra = (transactions: any[]): string => {
  const compras = transactions.filter(t => t.tipo === 'compra');
  if (compras.length === 0) return '';

  const ultima = compras.sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())[0];
  return ultima.data;
};

const calculateScoreFinanceiro = (transactions: any[], payments: any[]): number => {
  // Score baseado em pagamentos em dia, volume de compras, etc.
  let score = 100;

  const pagamentosAtrasados = payments.filter(p => p.status === 'atrasado').length;
  const totalPagamentos = payments.length;

  if (totalPagamentos > 0) {
    const taxaAtraso = pagamentosAtrasados / totalPagamentos;
    score -= taxaAtraso * 50; // Penalizar atrasos
  }

  const volumeCompras = calculateTotalCompras(transactions);
  if (volumeCompras > 50000) score += 10; // Bonus por volume

  return Math.max(0, Math.min(100, score));
};

const calculateRiscoCredito = (transactions: any[], payments: any[]): 'baixo' | 'medio' | 'alto' => {
  const score = calculateScoreFinanceiro(transactions, payments);

  if (score >= 80) return 'baixo';
  if (score >= 60) return 'medio';
  return 'alto';
};

// Dados simulados para fallback
const getMockSupplierFinancialData = (): SupplierFinancialData[] => [
  {
    id: '1',
    nome: 'Brinquedos & Cia Ltda',
    email: 'contato@brinquedosecia.com.br',
    telefone: '(11) 3456-7890',
    status: 'ativo',
    limiteCredito: 50000,
    saldoDevedor: 12500,
    totalCompras: 87500,
    ultimaCompra: '2024-01-15',
    prazoPagamento: 30,
    descontoPadrao: 5,
    transacoes: [
      {
        id: '1',
        data: '2024-01-15',
        descricao: 'Compra de brinquedos educativos',
        valor: 8500,
        tipo: 'compra',
        status: 'pago',
        formaPagamento: 'Transferência'
      },
      {
        id: '2',
        data: '2024-01-10',
        descricao: 'Compra de jogos',
        valor: 4000,
        tipo: 'compra',
        status: 'pendente'
      }
    ],
    scoreFinanceiro: 85,
    riscoCredito: 'baixo',
    banco: 'Banco do Brasil',
    agencia: '1234',
    conta: '56789-0',
    pix: 'contato@brinquedosecia.com.br'
  },
  {
    id: '2',
    nome: 'Distribuidora Kids',
    email: 'vendas@distribuidorakids.com',
    telefone: '(21) 9876-5432',
    status: 'ativo',
    limiteCredito: 30000,
    saldoDevedor: 8900,
    totalCompras: 45600,
    ultimaCompra: '2024-01-12',
    prazoPagamento: 15,
    descontoPadrao: 3,
    transacoes: [
      {
        id: '3',
        data: '2024-01-12',
        descricao: 'Compra de brinquedos de bebê',
        valor: 3200,
        tipo: 'compra',
        status: 'pago',
        formaPagamento: 'PIX'
      }
    ],
    scoreFinanceiro: 72,
    riscoCredito: 'medio',
    banco: 'Itaú',
    agencia: '5678',
    conta: '12345-6',
    pix: 'vendas@distribuidorakids.com'
  },
  {
    id: '3',
    nome: 'Importadora Toys',
    email: 'import@importadoratoys.com',
    telefone: '(31) 1234-5678',
    status: 'pendente',
    limiteCredito: 10000,
    saldoDevedor: 0,
    totalCompras: 0,
    ultimaCompra: '',
    prazoPagamento: 7,
    descontoPadrao: 0,
    transacoes: [],
    scoreFinanceiro: 50,
    riscoCredito: 'alto'
  }
];
