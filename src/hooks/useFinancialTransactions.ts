import { useState, useEffect } from 'react';

interface FinancialTransaction {
  id: string;
  data: string;
  descricao: string;
  categoria: string;
  origem: string;
  tipo: 'Entrada' | 'Saída';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

interface UseFinancialTransactionsReturn {
  transactions: FinancialTransaction[];
  loading: boolean;
  error: string | null;
  createTransaction: (data: Partial<FinancialTransaction>) => Promise<boolean>;
  updateTransaction: (id: string, data: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  refreshTransactions: () => void;
}

export const useFinancialTransactions = (): UseFinancialTransactionsReturn => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Dados simulados para demonstração
  const mockTransactions: FinancialTransaction[] = [
    {
      id: '1',
      data: '2024-10-15',
      descricao: 'Venda de Brinquedos - Cliente João Silva',
      categoria: 'Venda',
      origem: 'João Silva',
      tipo: 'Entrada',
      valor: 245.80,
      status: 'Pago',
      metodo_pagamento: 'PIX',
      observacoes: 'Pagamento recebido com sucesso',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      data: '2024-10-14',
      descricao: 'Pagamento Fornecedor - Brinquedos ABC Ltda',
      categoria: 'Fornecedor',
      origem: 'Brinquedos ABC Ltda',
      tipo: 'Saída',
      valor: 1200.00,
      status: 'Pago',
      metodo_pagamento: 'Transferência',
      observacoes: 'Pagamento de produtos em estoque',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date(Date.now() - 86400000).toISOString()
    },
    {
      id: '3',
      data: '2024-10-13',
      descricao: 'Evento Workshop - Brinquedos Educativos',
      categoria: 'Evento',
      origem: 'Evento',
      tipo: 'Entrada',
      valor: 890.00,
      status: 'Pago',
      metodo_pagamento: 'Dinheiro',
      observacoes: 'Receita do workshop realizado',
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date(Date.now() - 172800000).toISOString()
    },
    {
      id: '4',
      data: '2024-10-12',
      descricao: 'Marketing Digital - Facebook Ads',
      categoria: 'Marketing',
      origem: 'Marketing',
      tipo: 'Saída',
      valor: 350.00,
      status: 'Pendente',
      metodo_pagamento: 'Cartão de Crédito',
      observacoes: 'Campanha promocional de outubro',
      created_at: new Date(Date.now() - 259200000).toISOString(),
      updated_at: new Date(Date.now() - 259200000).toISOString()
    },
    {
      id: '5',
      data: '2024-10-11',
      descricao: 'Venda de Produtos - Cliente Maria Santos',
      categoria: 'Venda',
      origem: 'Maria Santos',
      tipo: 'Entrada',
      valor: 180.50,
      status: 'Pago',
      metodo_pagamento: 'Débito',
      observacoes: 'Venda de brinquedos educativos',
      created_at: new Date(Date.now() - 345600000).toISOString(),
      updated_at: new Date(Date.now() - 345600000).toISOString()
    }
  ];

  const fetchTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Tentar buscar da API primeiro
      try {
        const response = await fetch('/api/financial/transactions');
        if (response.ok) {
          const data = await response.json();
          setTransactions(data.transactions || []);
          return;
        }
      } catch (apiError) {
        console.log('API não disponível, usando dados simulados');
      }

      // Fallback para dados simulados
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
      setError('Erro ao carregar transações');
      setTransactions(mockTransactions); // Usar dados simulados em caso de erro
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (data: Partial<FinancialTransaction>): Promise<boolean> => {
    try {
      // Tentar salvar na API primeiro
      try {
        const response = await fetch('/api/financial/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchTransactions(); // Recarregar dados
          return true;
        }
      } catch (apiError) {
        console.log('API não disponível, simulando criação');
      }

      // Simular criação local
      const newTransaction: FinancialTransaction = {
        id: Date.now().toString(),
        data: data.data || new Date().toISOString().split('T')[0],
        descricao: data.descricao || '',
        categoria: data.categoria || '',
        origem: data.origem || '',
        tipo: data.tipo || 'Saída',
        valor: data.valor || 0,
        status: data.status || 'Pendente',
        metodo_pagamento: data.metodo_pagamento,
        observacoes: data.observacoes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setTransactions(prev => [newTransaction, ...prev]);
      return true;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return false;
    }
  };

  const updateTransaction = async (id: string, data: Partial<FinancialTransaction>): Promise<boolean> => {
    try {
      // Tentar atualizar na API primeiro
      try {
        const response = await fetch(`/api/financial/transactions/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          await fetchTransactions(); // Recarregar dados
          return true;
        }
      } catch (apiError) {
        console.log('API não disponível, simulando atualização');
      }

      // Simular atualização local
      setTransactions(prev => 
        prev.map(transaction => 
          transaction.id === id 
            ? { ...transaction, ...data, updated_at: new Date().toISOString() }
            : transaction
        )
      );
      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      // Tentar deletar na API primeiro
      try {
        const response = await fetch(`/api/financial/transactions/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchTransactions(); // Recarregar dados
          return true;
        }
      } catch (apiError) {
        console.log('API não disponível, simulando exclusão');
      }

      // Simular exclusão local
      setTransactions(prev => prev.filter(transaction => transaction.id !== id));
      return true;
    } catch (error) {
      console.error('Erro ao deletar transação:', error);
      return false;
    }
  };

  const refreshTransactions = (): void => {
    fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return {
    transactions,
    loading,
    error,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    refreshTransactions
  };
};
