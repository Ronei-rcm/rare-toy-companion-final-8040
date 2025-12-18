import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Building } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/currencyUtils';

interface ContaBancaria {
  id: number;
  nome: string;
  banco: string;
  agencia: string;
  conta: string;
  tipo: 'corrente' | 'poupanca' | 'investimento';
  saldo: number;
  limite: number;
  status: 'ativo' | 'inativo' | 'bloqueado';
}

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: number;
    descricao: string;
    categoria: string;
    tipo: 'entrada' | 'saida';
    valor: number;
    status: string;
    data: string;
  } | null;
  onSuccess: () => void;
}

export default function PayBillModal({ isOpen, onClose, transaction, onSuccess }: PayBillModalProps) {
  const [contas, setContas] = useState<ContaBancaria[]>([]);
  const [contaSelecionada, setContaSelecionada] = useState<string>('');
  const [dataPagamento, setDataPagamento] = useState<string>(new Date().toISOString().split('T')[0]);
  const [observacoes, setObservacoes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingContas, setLoadingContas] = useState(true);

  // Carregar contas bancárias disponíveis
  useEffect(() => {
    if (isOpen) {
      carregarContas();
      setDataPagamento(new Date().toISOString().split('T')[0]);
      setObservacoes('');
      setContaSelecionada('');
    }
  }, [isOpen]);

  const carregarContas = async () => {
    try {
      setLoadingContas(true);
      const response = await fetch('/api/financial/contas');
      if (response.ok) {
        const data = await response.json();
        const contasAtivas = (data.contas || []).filter((c: any) => c.status === 'ativo');
        setContas(contasAtivas);
        
        // Selecionar primeira conta automaticamente se houver apenas uma
        if (contasAtivas.length === 1) {
          setContaSelecionada(contasAtivas[0].id.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      toast.error('Erro ao carregar contas bancárias');
    } finally {
      setLoadingContas(false);
    }
  };

  const handlePay = async () => {
    if (!transaction) return;

    if (!contaSelecionada) {
      toast.error('Selecione uma conta bancária para realizar o pagamento');
      return;
    }

    const conta = contas.find(c => c.id.toString() === contaSelecionada);
    if (!conta) {
      toast.error('Conta selecionada não encontrada');
      return;
    }

    // Verificar saldo apenas para saídas
    if (transaction.tipo === 'saida' && conta.saldo < transaction.valor) {
      const saldoInsuficiente = conta.saldo + (conta.limite || 0) < transaction.valor;
      if (saldoInsuficiente) {
        toast.error(`Saldo insuficiente na conta ${conta.nome}. Saldo disponível: ${formatCurrency(conta.saldo + (conta.limite || 0))}`);
        return;
      }
    }

    try {
      setLoading(true);

      // Processar pagamento usando endpoint específico
      const response = await fetch(`/api/financial/transactions/${transaction.id}/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account_id: conta.id,
          data_pagamento: dataPagamento,
          observacoes: observacoes || null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao processar pagamento');
      }

      const result = await response.json();
      
      toast.success(`Conta paga com sucesso via ${conta.nome}! Saldo atualizado.`);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao pagar conta:', error);
      toast.error(error.message || 'Erro ao processar pagamento');
    } finally {
      setLoading(false);
    }
  };

  if (!transaction) return null;

  const contaSelecionadaObj = contas.find(c => c.id.toString() === contaSelecionada);
  const saldoDisponivel = contaSelecionadaObj ? contaSelecionadaObj.saldo + (contaSelecionadaObj.limite || 0) : 0;
  const podePagar = transaction.tipo === 'entrada' || (contaSelecionadaObj && saldoDisponivel >= transaction.valor);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-t-lg -mx-6 -mt-6 mb-4">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            Pagar Conta
          </DialogTitle>
          <DialogDescription className="text-green-100">
            Selecione a conta bancária e confirme o pagamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Informações da Transação */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Detalhes da Conta
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Descrição:</span>
                <p className="font-medium text-gray-900">{transaction.descricao}</p>
              </div>
              <div>
                <span className="text-gray-600">Categoria:</span>
                <p className="font-medium text-gray-900">{transaction.categoria}</p>
              </div>
              <div>
                <span className="text-gray-600">Tipo:</span>
                <Badge className={transaction.tipo === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {transaction.tipo === 'entrada' ? '💰 Entrada' : '💸 Saída'}
                </Badge>
              </div>
              <div>
                <span className="text-gray-600">Valor:</span>
                <p className={`font-bold text-lg ${transaction.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.tipo === 'entrada' ? '+' : '-'}{formatCurrency(transaction.valor)}
                </p>
              </div>
            </div>
          </div>

          {/* Seleção de Conta Bancária */}
          <div className="space-y-2">
            <Label htmlFor="conta" className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Building className="h-4 w-4" />
              Conta Bancária *
            </Label>
            {loadingContas ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <p className="text-sm text-gray-500">Carregando contas...</p>
              </div>
            ) : contas.length === 0 ? (
              <div className="flex items-center justify-center p-4 border border-yellow-200 bg-yellow-50 rounded-md">
                <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <p className="text-sm text-yellow-800">Nenhuma conta bancária ativa encontrada. Cadastre uma conta primeiro.</p>
              </div>
            ) : (
              <>
                <Select value={contaSelecionada} onValueChange={setContaSelecionada}>
                  <SelectTrigger id="conta" className="h-10">
                    <SelectValue placeholder="Selecione a conta bancária" />
                  </SelectTrigger>
                  <SelectContent>
                    {contas.map((conta) => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            <span>{conta.nome} - {conta.banco}</span>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {formatCurrency(conta.saldo)}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Informações da Conta Selecionada */}
                {contaSelecionadaObj && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Saldo Atual:</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(contaSelecionadaObj.saldo)}</span>
                    </div>
                    {contaSelecionadaObj.limite > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Limite:</span>
                        <span className="font-semibold text-gray-900">{formatCurrency(contaSelecionadaObj.limite)}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Saldo Disponível:</span>
                      <span className={`font-bold ${saldoDisponivel >= transaction.valor ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(saldoDisponivel)}
                      </span>
                    </div>
                    {transaction.tipo === 'saida' && !podePagar && (
                      <div className="flex items-center gap-2 text-red-600 text-xs mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <span>Saldo insuficiente para este pagamento</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Data do Pagamento */}
          <div className="space-y-2">
            <Label htmlFor="dataPagamento" className="text-sm font-medium text-gray-700">
              Data do Pagamento *
            </Label>
            <Input
              id="dataPagamento"
              type="date"
              value={dataPagamento}
              onChange={(e) => setDataPagamento(e.target.value)}
              className="h-10"
              required
            />
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observacoes" className="text-sm font-medium text-gray-700">
              Observações
            </Label>
            <Input
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações adicionais sobre o pagamento"
              className="h-10"
            />
          </div>

          {/* Resumo do Pagamento */}
          {contaSelecionadaObj && (
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 space-y-2 border border-gray-200">
              <h4 className="font-semibold text-gray-900">Resumo do Pagamento</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor:</span>
                  <span className="font-semibold">{formatCurrency(transaction.valor)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Conta:</span>
                  <span className="font-semibold">{contaSelecionadaObj.nome} ({contaSelecionadaObj.banco})</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Saldo após pagamento:</span>
                  <span className={`font-bold text-lg ${
                    transaction.tipo === 'saida' 
                      ? contaSelecionadaObj.saldo - transaction.valor >= 0 
                        ? 'text-green-600' 
                        : 'text-red-600'
                      : 'text-green-600'
                  }`}>
                    {formatCurrency(
                      transaction.tipo === 'saida' 
                        ? contaSelecionadaObj.saldo - transaction.valor
                        : contaSelecionadaObj.saldo + transaction.valor
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handlePay}
            disabled={loading || !contaSelecionada || loadingContas || contas.length === 0 || (transaction.tipo === 'saida' && !podePagar)}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirmar Pagamento
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

