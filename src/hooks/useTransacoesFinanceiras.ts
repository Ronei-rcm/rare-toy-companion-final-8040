import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface Transacao {
  id: number;
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
  atualizarTransacao: (id: number, dados: Partial<Transacao>) => Promise<boolean>;
  excluirTransacao: (id: number) => Promise<boolean>;
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

  // Função para calcular resumo financeiro
  const calcularResumo = (transacoes: Transacao[]): ResumoFinanceiro => {
    const totalEntradas = transacoes
      .filter(t => t.tipo === 'entrada')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const totalSaidas = transacoes
      .filter(t => t.tipo === 'saida')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    return {
      totalEntradas,
      totalSaidas,
      saldoLiquido: totalEntradas - totalSaidas,
      totalTransacoes: transacoes.length
    };
  };

  // Função para carregar transações
  const carregarTransacoes = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Carregando transações...');
      
      const response = await fetch('/api/financial/transactions');
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      const transacoesData = data.transactions || [];
      
      console.log('✅ Transações carregadas:', transacoesData.length);
      setTransacoes(transacoesData);
      
      // Calcular resumo
      const resumoCalculado = calcularResumo(transacoesData);
      setResumo(resumoCalculado);
      
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
      toast.error('Erro ao carregar transações');
    } finally {
      setLoading(false);
    }
  };

  // Função para criar transação
  const criarTransacao = async (dados: Omit<Transacao, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      console.log('💾 Criando transação:', dados);

      const response = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Transação criada:', result);

      toast.success(`Transação criada com sucesso! ID: ${result.id}`);
      
      // Recarregar dados
      await carregarTransacoes();
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao criar transação:', error);
      toast.error('Erro ao criar transação');
      return false;
    }
  };

  // Função para atualizar transação
  const atualizarTransacao = async (id: number, dados: Partial<Transacao>): Promise<boolean> => {
    try {
      console.log('✏️ Atualizando transação:', id, dados);

      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Transação atualizada:', result);

      toast.success('Transação atualizada com sucesso!');
      
      // Recarregar dados
      await carregarTransacoes();
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao atualizar transação:', error);
      toast.error('Erro ao atualizar transação');
      return false;
    }
  };

  // Função para excluir transação
  const excluirTransacao = async (id: number): Promise<boolean> => {
    try {
      console.log('🗑️ Excluindo transação:', id);

      const response = await fetch(`/api/financial/transactions/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Transação excluída:', result);

      toast.success('Transação excluída com sucesso!');
      
      // Recarregar dados
      await carregarTransacoes();
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao excluir transação:', error);
      toast.error('Erro ao excluir transação');
      return false;
    }
  };

  // Carregar dados na inicialização
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
