import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DollarSign,
  Calendar,
  Tag,
  User,
  Building,
  CreditCard,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface QuickTransactionEditorProps {
  transaction?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: any) => Promise<void>;
  mode: 'create' | 'edit';
}

export const QuickTransactionEditor: React.FC<QuickTransactionEditorProps> = ({
  transaction,
  isOpen,
  onClose,
  onSave,
  mode
}) => {
  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    tipo: 'Entrada',
    valor: '',
    status: 'Pago',
    metodo_pagamento: '',
    data: format(new Date(), 'yyyy-MM-dd'),
    origem: '',
    observacoes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Categorias disponíveis
  const categorias = [
    'Venda',
    'Evento',
    'Fornecedor',
    'Marketing',
    'Operacional',
    'Manutenção',
    'Aluguel',
    'Salários',
    'Outros'
  ];

  // Formas de pagamento
  const formasPagamento = [
    'Dinheiro',
    'PIX',
    'Cartão de Débito',
    'Cartão de Crédito',
    'Transferência',
    'Boleto',
    'Cheque'
  ];

  // Status disponíveis
  const statusOptions = [
    { value: 'Pago', label: 'Pago', color: 'bg-green-100 text-green-800' },
    { value: 'Pendente', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'Atrasado', label: 'Atrasado', color: 'bg-red-100 text-red-800' }
  ];

  // Preencher formulário quando editando
  useEffect(() => {
    if (transaction && mode === 'edit') {
      setFormData({
        descricao: transaction.descricao || '',
        categoria: transaction.categoria || '',
        tipo: transaction.tipo || 'Entrada',
        valor: transaction.valor?.toString() || '',
        status: transaction.status || 'Pago',
        metodo_pagamento: transaction.metodo_pagamento || '',
        data: transaction.data || format(new Date(), 'yyyy-MM-dd'),
        origem: transaction.origem || '',
        observacoes: transaction.observacoes || ''
      });
    } else if (mode === 'create') {
      setFormData({
        descricao: '',
        categoria: '',
        tipo: 'Entrada',
        valor: '',
        status: 'Pago',
        metodo_pagamento: '',
        data: format(new Date(), 'yyyy-MM-dd'),
        origem: '',
        observacoes: ''
      });
    }
  }, [transaction, mode, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    const processedValue = field === 'valor' ? value.replace(',', '.') : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));

    // Limpar erro do campo quando usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }

    if (!formData.categoria) {
      newErrors.categoria = 'Categoria é obrigatória';
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória';
    }

    if (!formData.metodo_pagamento) {
      newErrors.metodo_pagamento = 'Forma de pagamento é obrigatória';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const transactionData = {
        ...formData,
        valor: parseFloat(formData.valor),
        id: transaction?.id || undefined
      };

      await onSave(transactionData);
      toast.success(mode === 'create' ? 'Transação criada com sucesso!' : 'Transação atualizada com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    return (
      <Badge className={statusOption?.color || 'bg-gray-100 text-gray-800'}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            {mode === 'create' ? 'Nova Transação' : 'Editar Transação'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Preencha os dados da nova transação financeira'
              : 'Edite os dados da transação selecionada'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descrição *</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) => handleInputChange('descricao', e.target.value)}
                    placeholder="Ex: Venda de produtos, Pagamento fornecedor..."
                    className={errors.descricao ? 'border-red-500' : ''}
                  />
                  {errors.descricao && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.descricao}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={formData.categoria} onValueChange={(value) => handleInputChange('categoria', value)}>
                    <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione uma categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((categoria) => (
                        <SelectItem key={categoria} value={categoria}>
                          {categoria}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoria && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.categoria}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => handleInputChange('tipo', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada (Receita)</SelectItem>
                      <SelectItem value="Saída">Saída (Despesa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor">Valor *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valor}
                      onChange={(e) => handleInputChange('valor', e.target.value)}
                      placeholder="0,00"
                      className={`pl-10 ${errors.valor ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.valor && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.valor}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalhes de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detalhes de Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="data">Data *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="data"
                      type="date"
                      value={formData.data}
                      onChange={(e) => handleInputChange('data', e.target.value)}
                      className={`pl-10 ${errors.data ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.data && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.data}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Badge className={status.color}>{status.label}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="metodo_pagamento">Forma de Pagamento *</Label>
                  <Select value={formData.metodo_pagamento} onValueChange={(value) => handleInputChange('metodo_pagamento', value)}>
                    <SelectTrigger className={errors.metodo_pagamento ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Selecione a forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {formasPagamento.map((forma) => (
                        <SelectItem key={forma} value={forma}>
                          {forma}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.metodo_pagamento && (
                    <p className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.metodo_pagamento}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="origem">Origem</Label>
                  <Input
                    id="origem"
                    value={formData.origem}
                    onChange={(e) => handleInputChange('origem', e.target.value)}
                    placeholder="Ex: Cliente, Fornecedor, Evento..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações Adicionais</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  placeholder="Informações adicionais sobre a transação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumo da Transação */}
          <Card className="bg-gray-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Resumo da Transação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Descrição:</p>
                  <p className="font-medium">{formData.descricao || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Valor:</p>
                  <p className="font-bold text-lg">
                    {formData.valor ?
                      new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.valor)) :
                      'R$ 0,00'
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo:</p>
                  <div className="flex items-center gap-2">
                    {formData.tipo === 'Entrada' ?
                      <span className="text-green-600 font-medium">↗ Entrada</span> :
                      <span className="text-red-600 font-medium">↘ Saída</span>
                    }
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status:</p>
                  {getStatusBadge(formData.status)}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {mode === 'create' ? 'Criar Transação' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
