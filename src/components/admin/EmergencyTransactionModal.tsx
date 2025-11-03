import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface EmergencyTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyTransactionModal: React.FC<EmergencyTransactionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
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

  const handleSave = async () => {
    if (!formData.descricao || !formData.categoria || !formData.valor) {
      toast.error('Preencha todos os campos obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      console.log('🚨 EMERGÊNCIA - Salvando transação:', formData);
      
      const response = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          descricao: formData.descricao,
          categoria: formData.categoria,
          tipo: formData.tipo,
          valor: parseFloat(formData.valor),
          status: formData.status,
          metodo_pagamento: formData.metodo_pagamento,
          data: formData.data,
          origem: formData.origem,
          observacoes: formData.observacoes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar transação');
      }

      const result = await response.json();
      console.log('✅ EMERGÊNCIA - Transação criada:', result);
      
      toast.success('✅ Transação criada com sucesso! ID: ' + result.id);
      
      // Limpar formulário
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
      
      // Fechar modal
      onClose();
      
      // Recarregar página após 1 segundo
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('❌ EMERGÊNCIA - Erro:', error);
      toast.error('❌ Erro ao criar transação: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-600">🚨 CRIAR LANÇAMENTO - MODO EMERGÊNCIA</CardTitle>
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
            <select
              id="tipo"
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
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
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Atrasado">Atrasado</option>
            </select>
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
            <Label htmlFor="origem">Origem</Label>
            <Input
              id="origem"
              value={formData.origem}
              onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
              placeholder="Ex: Cliente X"
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

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Salvando...' : '✅ Criar Lançamento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
