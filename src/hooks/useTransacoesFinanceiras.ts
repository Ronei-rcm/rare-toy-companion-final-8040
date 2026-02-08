import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { financialApi } from '@/services/financial-api';

export interface Transacao {
  id: number | string;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento: string;
  data: string;
  origem: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
}

export interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  totalTransacoes: number;
}

export interface UseTransacoesFinanceirasReturn {
  transacoes: Transacao[];
  resumo: ResumoFinanceiro;
  loading: boolean;
  error: string | null;
  carregarTransacoes: () => Promise<void>;
  criarTransacao: (dados: Omit<Transacao, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  atualizarTransacao: (id: number | string, dados: Partial<Transacao>) => Promise<boolean>;
  excluirTransacao: (id: number | string) => Promise<boolean>;
}

export const useTransacoesFinanceiras = (): UseTransacoesFinanceirasReturn => {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    totalEntradas: 0,
    totalSaidas: 0,
    saldoLiquido: 0,
    totalTransacoes: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const calcularResumo = useCallback((transacoesList: Transacao[]): ResumoFinanceiro => {
    const totalEntradas = transacoesList
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const totalSaidas = transacoesList
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido: totalEntradas - totalSaidas,
      totalTransacoes: transacoesList.length
    };
  }, []);

  const carregarTransacoes = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const data = await financialApi.getTransactions();
      const transacoesData = data.transactions || data || [];

      setTransacoes(transacoesData);
      setResumo(calcularResumo(transacoesData));
    } catch (error: any) {
      console.error('Erro ao carregar transações:', error);
      setError(error.message || 'Erro ao carregar transações');
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  const criarTransacao = async (dados: Omit<Transacao, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      await financialApi.createTransaction(dados);
      toast.success('Transação criada com sucesso!');
      await carregarTransacoes();
      return true;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
      return false;
    }
  };

  const atualizarTransacao = async (id: number | string, dados: Partial<Transacao>): Promise<boolean> => {
    try {
      await financialApi.updateTransaction(id.toString(), dados);
      toast.success('Transação atualizada com sucesso!');
      await carregarTransacoes();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
      return false;
    }
  };

  const excluirTransacao = async (id: number | string): Promise<boolean> => {
    try {
      await financialApi.deleteTransaction(id.toString());
      toast.success('Transação excluída com sucesso!');
      await carregarTransacoes();
      return true;
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
      return false;
    }
  };

  useEffect(() => {
    carregarTransacoes();
  }, []);

  return {
    transacoes,
    resumo,
    loading,
    error,
    carregarTransacoes,
    criarTransacao,
    atualizarTransacao,
    excluirTransacao
  };
};
