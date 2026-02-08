import { useState, useEffect } from 'react';
import { financialApi } from '@/services/financial-api';

interface FinancialTransaction {
  id: string | number;
  data: string;
  descricao: string;
  categoria: string;
  origem: string;
  tipo: 'Entrada' | 'Saída' | 'entrada' | 'saida';
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
  updateTransaction: (id: string | number, data: Partial<FinancialTransaction>) => Promise<boolean>;
  deleteTransaction: (id: string | number) => Promise<boolean>;
  refreshTransactions: () => void;
}

export const useFinancialTransactions = (): UseFinancialTransactionsReturn => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await financialApi.getTransactions();
      setTransactions(data.transactions || data || []);
    } catch (apiError: any) {
      console.error('Erro ao carregar transações:', apiError);
      setError(apiError.message || 'Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const createTransaction = async (data: Partial<FinancialTransaction>): Promise<boolean> => {
    try {
      await financialApi.createTransaction(data);
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      return false;
    }
  };

  const updateTransaction = async (id: string | number, data: Partial<FinancialTransaction>): Promise<boolean> => {
    try {
      await financialApi.updateTransaction(id.toString(), data);
      await fetchTransactions();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      return false;
    }
  };

  const deleteTransaction = async (id: string | number): Promise<boolean> => {
    try {
      await financialApi.deleteTransaction(id.toString());
      await fetchTransactions();
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
