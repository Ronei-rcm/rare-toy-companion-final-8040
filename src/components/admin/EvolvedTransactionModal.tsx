import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Minus, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  User, 
  Building, 
  FileText, 
  Zap,
  Calculator,
  Clock,
  CheckCircle,
  AlertTriangle,
  Save,
  X,
  Eye,
  Copy,
  Upload,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
// import { format } from 'date-fns';
// import { ptBR } from 'date-fns/locale';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  total_pedidos: number;
  total_gasto: number;
  status: string;
}

interface Categoria {
  id: number;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
}

interface Fornecedor {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  status: string;
}

interface EvolvedTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  mode?: 'create' | 'edit' | 'duplicate';
  transaction?: any;
}

const EvolvedTransactionModal: React.FC<EvolvedTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode = 'create',
  transaction
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basico');
  
  // Estados dos dados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    // Dados básicos
    descricao: '',
    categoria: '',
    tipo: 'entrada',
    valor: '',
    status: 'Pago',
    data: new Date().toISOString().split('T')[0],
    
    // Cliente/Fornecedor
    cliente_id: '',
    cliente_nome: '',
    fornecedor_id: '',
    fornecedor_nome: '',
    
    // Pagamento
    metodo_pagamento: 'PIX',
    forma_pagamento: 'dinheiro',
    parcelas: 1,
    valor_parcela: '',
    
    // Detalhes
    origem: '',
    observacoes: '',
    tags: '',
    
    // Recorrência
    recorrente: false,
    frequencia: 'mensal',
    data_fim: '',
    
    // Anexos
    anexos: [] as File[]
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCalculadora, setShowCalculadora] = useState(false);
  const [calculadoraValue, setCalculadoraValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Carregar dados iniciais
  useEffect(() => {
    if (isOpen) {
      carregarDados();
      if (mode === 'edit' && transaction) {
        preencherFormulario(transaction);
      } else if (mode === 'duplicate' && transaction) {
        preencherFormulario(transaction, true);
      }
    }
  }, [isOpen, mode, transaction]);

  const carregarDados = async () => {
    try {
      // Carregar clientes
      const clientesResponse = await fetch('/api/financial/clientes');
      if (clientesResponse.ok) {
        const clientesData = await clientesResponse.json();
        setClientes(clientesData.clientes || []);
      }

      // Carregar categorias
      const categoriasResponse = await fetch('/api/financial/categorias');
      if (categoriasResponse.ok) {
        const categoriasData = await categoriasResponse.json();
        setCategorias(categoriasData.categorias || []);
      }

      // Carregar fornecedores
      const fornecedoresResponse = await fetch('/api/financial/fornecedores');
      if (fornecedoresResponse.ok) {
        const fornecedoresData = await fornecedoresResponse.json();
        setFornecedores(fornecedoresData.fornecedores || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const preencherFormulario = (transacao: any, isDuplicate = false) => {
    setFormData({
      descricao: transacao.descricao || '',
      categoria: transacao.categoria || '',
      tipo: transacao.tipo === 'Entrada' ? 'entrada' : 'saida',
      valor: transacao.valor?.toString() || '',
      status: transacao.status || 'Pago',
      data: transacao.data || new Date().toISOString().split('T')[0],
      cliente_id: transacao.cliente_id || '',
      cliente_nome: transacao.cliente_nome || '',
      fornecedor_id: transacao.fornecedor_id || '',
      fornecedor_nome: transacao.fornecedor_nome || '',
      metodo_pagamento: transacao.metodo_pagamento || 'PIX',
      forma_pagamento: transacao.forma_pagamento || 'dinheiro',
      parcelas: transacao.parcelas || 1,
      valor_parcela: transacao.valor_parcela || '',
      origem: transacao.origem || '',
      observacoes: transacao.observacoes || '',
      tags: transacao.tags || '',
      recorrente: transacao.recorrente || false,
      frequencia: transacao.frequencia || 'mensal',
      data_fim: transacao.data_fim || '',
      anexos: []
    });
  };

  const validarFormulario = (): boolean => {
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

    if (formData.parcelas > 1 && !formData.valor_parcela) {
      newErrors.valor_parcela = 'Valor da parcela é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calcularValorParcela = () => {
    if (formData.valor && formData.parcelas > 1) {
      const valorTotal = parseFloat(formData.valor);
      const valorParcela = valorTotal / formData.parcelas;
      setFormData({ ...formData, valor_parcela: valorParcela.toFixed(2) });
    }
  };

  const selecionarCliente = (cliente: Cliente) => {
    setFormData({
      ...formData,
      cliente_id: cliente.id,
      cliente_nome: cliente.nome
    });
  };

  const selecionarFornecedor = (fornecedor: Fornecedor) => {
    setFormData({
      ...formData,
      fornecedor_id: fornecedor.id.toString(),
      fornecedor_nome: fornecedor.nome
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData({ ...formData, anexos: [...formData.anexos, ...files] });
  };

  const removerAnexo = (index: number) => {
    const novosAnexos = formData.anexos.filter((_, i) => i !== index);
    setFormData({ ...formData, anexos: novosAnexos });
  };

  const handleSave = async () => {
    if (!validarFormulario()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      const transactionData = {
        descricao: formData.descricao,
        categoria: formData.categoria,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        status: formData.status,
        metodo_pagamento: formData.metodo_pagamento,
        forma_pagamento: formData.forma_pagamento,
        data: formData.data,
        cliente_id: formData.cliente_id || null,
        cliente_nome: formData.cliente_nome || null,
        fornecedor_id: formData.fornecedor_id || null,
        fornecedor_nome: formData.fornecedor_nome || null,
        parcelas: formData.parcelas,
        valor_parcela: formData.valor_parcela ? parseFloat(formData.valor_parcela) : null,
        origem: formData.origem,
        observacoes: formData.observacoes,
        tags: formData.tags,
        recorrente: formData.recorrente,
        frequencia: formData.recorrente ? formData.frequencia : null,
        data_fim: formData.recorrente ? formData.data_fim : null
      };

      await onSave(transactionData);
      
      toast.success('Transação salva com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      toast.error('Erro ao salvar transação');
    } finally {
      setSaving(false);
    }
  };

  const limparFormulario = () => {
    setFormData({
      descricao: '',
      categoria: '',
      tipo: 'entrada',
      valor: '',
      status: 'Pago',
      data: new Date().toISOString().split('T')[0],
      cliente_id: '',
      cliente_nome: '',
      fornecedor_id: '',
      fornecedor_nome: '',
      metodo_pagamento: 'PIX',
      forma_pagamento: 'dinheiro',
      parcelas: 1,
      valor_parcela: '',
      origem: '',
      observacoes: '',
      tags: '',
      recorrente: false,
      frequencia: 'mensal',
      data_fim: '',
      anexos: []
    });
    setErrors({});
  };

  const metodosPagamento = [
    { value: 'PIX', label: 'PIX', icon: '💳' },
    { value: 'Cartão de Crédito', label: 'Cartão de Crédito', icon: '💳' },
    { value: 'Cartão de Débito', label: 'Cartão de Débito', icon: '💳' },
    { value: 'Dinheiro', label: 'Dinheiro', icon: '💰' },
    { value: 'Transferência', label: 'Transferência', icon: '🏦' },
    { value: 'Boleto', label: 'Boleto', icon: '📄' },
    { value: 'Cheque', label: 'Cheque', icon: '📝' }
  ];

  const formasPagamento = [
    { value: 'dinheiro', label: 'À vista' },
    { value: 'parcelado', label: 'Parcelado' },
    { value: 'recorrente', label: 'Recorrente' }
  ];

  const statusOptions = [
    { value: 'Pago', label: 'Pago', color: 'bg-green-500' },
    { value: 'Pendente', label: 'Pendente', color: 'bg-yellow-500' },
    { value: 'Atrasado', label: 'Atrasado', color: 'bg-red-500' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col p-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !m-0"
        style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', margin: 0, maxHeight: '90vh' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {mode === 'edit' ? 'Editar Transação' : mode === 'duplicate' ? 'Duplicar Transação' : 'Nova Transação'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Edite os dados da transação' : mode === 'duplicate' ? 'Duplique esta transação' : 'Crie uma nova transação financeira'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Básico
            </TabsTrigger>
            <TabsTrigger value="pagamento" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Pagamento
            </TabsTrigger>
            <TabsTrigger value="relacionamento" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Cliente/Fornecedor
            </TabsTrigger>
            <TabsTrigger value="avancado" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Avançado
            </TabsTrigger>
          </TabsList>

          {/* Tab Básico */}
          <TabsContent value="basico" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Venda de produtos, Pagamento de fornecedor"
                  className={errors.descricao ? 'border-red-500' : ''}
                />
                {errors.descricao && <p className="text-sm text-red-500 mt-1">{errors.descricao}</p>}
              </div>

              <div>
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={formData.categoria} onValueChange={(value) => setFormData({ ...formData, categoria: value })}>
                  <SelectTrigger className={errors.categoria ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((cat) => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        <div className="flex items-center gap-2">
                          <span>{cat.icone}</span>
                          <span>{cat.nome}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.categoria && <p className="text-sm text-red-500 mt-1">{errors.categoria}</p>}
              </div>

              <div>
                <Label htmlFor="tipo">Tipo *</Label>
                <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4 text-green-500" />
                        <span>Entrada</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="saida">
                      <div className="flex items-center gap-2">
                        <Minus className="h-4 w-4 text-red-500" />
                        <span>Saída</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="valor">Valor *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                    placeholder="0,00"
                    className={`pl-10 ${errors.valor ? 'border-red-500' : ''}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-1 h-6 w-6 p-0"
                    onClick={() => setShowCalculadora(!showCalculadora)}
                  >
                    <Calculator className="h-3 w-3" />
                  </Button>
                </div>
                {errors.valor && <p className="text-sm text-red-500 mt-1">{errors.valor}</p>}
              </div>

              <div>
                <Label htmlFor="data">Data *</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className={`pl-10 ${errors.data ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors.data && <p className="text-sm text-red-500 mt-1">{errors.data}</p>}
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${status.color}`} />
                          <span>{status.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="origem">Origem</Label>
              <Input
                id="origem"
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                placeholder="Ex: Loja física, E-commerce, Evento"
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais sobre a transação"
                rows={3}
              />
            </div>

            {/* Calculadora */}
            {showCalculadora && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Calculadora</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', '=', '+'].map((btn) => (
                      <Button
                        key={btn}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (btn === '=') {
                            try {
                              const result = eval(calculadoraValue);
                              setCalculadoraValue(result.toString());
                              setFormData({ ...formData, valor: result.toString() });
                            } catch (e) {
                              toast.error('Erro na calculadora');
                            }
                          } else if (btn === 'C') {
                            setCalculadoraValue('');
                          } else {
                            setCalculadoraValue(calculadoraValue + btn);
                          }
                        }}
                      >
                        {btn}
                      </Button>
                    ))}
                  </div>
                  <Input
                    value={calculadoraValue}
                    onChange={(e) => setCalculadoraValue(e.target.value)}
                    placeholder="0"
                    className="mt-2"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab Pagamento */}
          <TabsContent value="pagamento" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="metodo_pagamento">Método de Pagamento</Label>
                <Select value={formData.metodo_pagamento} onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {metodosPagamento.map((metodo) => (
                      <SelectItem key={metodo.value} value={metodo.value}>
                        <div className="flex items-center gap-2">
                          <span>{metodo.icon}</span>
                          <span>{metodo.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="forma_pagamento">Forma de Pagamento</Label>
                <Select value={formData.forma_pagamento} onValueChange={(value) => setFormData({ ...formData, forma_pagamento: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {formasPagamento.map((forma) => (
                      <SelectItem key={forma.value} value={forma.value}>
                        {forma.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.forma_pagamento === 'parcelado' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="parcelas">Número de Parcelas</Label>
                  <Input
                    id="parcelas"
                    type="number"
                    min="1"
                    max="24"
                    value={formData.parcelas}
                    onChange={(e) => {
                      const parcelas = parseInt(e.target.value) || 1;
                      setFormData({ ...formData, parcelas });
                      if (formData.valor) {
                        const valorParcela = parseFloat(formData.valor) / parcelas;
                        setFormData(prev => ({ ...prev, valor_parcela: valorParcela.toFixed(2) }));
                      }
                    }}
                  />
                </div>

                <div>
                  <Label htmlFor="valor_parcela">Valor da Parcela</Label>
                  <Input
                    id="valor_parcela"
                    type="number"
                    step="0.01"
                    value={formData.valor_parcela}
                    onChange={(e) => setFormData({ ...formData, valor_parcela: e.target.value })}
                    placeholder="0,00"
                  />
                </div>
              </div>
            )}

            {formData.forma_pagamento === 'recorrente' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="frequencia">Frequência</Label>
                  <Select value={formData.frequencia} onValueChange={(value) => setFormData({ ...formData, frequencia: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensal">Mensal</SelectItem>
                      <SelectItem value="trimestral">Trimestral</SelectItem>
                      <SelectItem value="anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="data_fim">Data de Fim (opcional)</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                id="recorrente"
                checked={formData.recorrente}
                onCheckedChange={(checked) => setFormData({ ...formData, recorrente: checked })}
              />
              <Label htmlFor="recorrente">Transação recorrente</Label>
            </div>
          </TabsContent>

          {/* Tab Cliente/Fornecedor */}
          <TabsContent value="relacionamento" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cliente</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar cliente..."
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      // Implementar busca de clientes
                    }}
                  />
                  {formData.cliente_nome && (
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                      <span className="text-sm font-medium">{formData.cliente_nome}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, cliente_id: '', cliente_nome: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {clientes.filter(cliente => 
                      !formData.cliente_id || cliente.id === formData.cliente_id
                    ).slice(0, 5).map((cliente) => (
                      <div
                        key={cliente.id}
                        className="p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => selecionarCliente(cliente)}
                      >
                        <div className="font-medium text-sm">{cliente.nome}</div>
                        <div className="text-xs text-gray-500">
                          {cliente.email} • {cliente.total_pedidos} pedidos • R$ {cliente.total_gasto.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label>Fornecedor</Label>
                <div className="space-y-2">
                  <Input
                    placeholder="Buscar fornecedor..."
                    onChange={(e) => {
                      const query = e.target.value.toLowerCase();
                      // Implementar busca de fornecedores
                    }}
                  />
                  {formData.fornecedor_nome && (
                    <div className="flex items-center justify-between p-2 bg-blue-50 rounded-md">
                      <span className="text-sm font-medium">{formData.fornecedor_nome}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, fornecedor_id: '', fornecedor_nome: '' })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {fornecedores.filter(fornecedor => 
                      !formData.fornecedor_id || fornecedor.id.toString() === formData.fornecedor_id
                    ).slice(0, 5).map((fornecedor) => (
                      <div
                        key={fornecedor.id}
                        className="p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                        onClick={() => selecionarFornecedor(fornecedor)}
                      >
                        <div className="font-medium text-sm">{fornecedor.nome}</div>
                        <div className="text-xs text-gray-500">{fornecedor.email}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab Avançado */}
          <TabsContent value="avancado" className="space-y-4">
            <div>
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Ex: urgente, importante, revisar"
              />
              <p className="text-xs text-gray-500 mt-1">Separe as tags por vírgula</p>
            </div>

            <div>
              <Label htmlFor="anexos">Anexos</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Adicionar Anexos
                </Button>
                
                {formData.anexos.length > 0 && (
                  <div className="space-y-1">
                    {formData.anexos.map((anexo, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span className="text-sm">{anexo.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerAnexo(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium">Resumo da Transação</h4>
              <div className="p-4 bg-gray-50 rounded-md space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Descrição:</span>
                  <span className="font-medium">{formData.descricao || 'Não informado'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Valor:</span>
                  <span className="font-medium">
                    R$ {formData.valor ? parseFloat(formData.valor).toFixed(2) : '0,00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Parcelas:</span>
                  <span className="font-medium">{formData.parcelas}x</span>
                </div>
                {formData.cliente_nome && (
                  <div className="flex justify-between">
                    <span>Cliente:</span>
                    <span className="font-medium">{formData.cliente_nome}</span>
                  </div>
                )}
                {formData.fornecedor_nome && (
                  <div className="flex justify-between">
                    <span>Fornecedor:</span>
                    <span className="font-medium">{formData.fornecedor_nome}</span>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 pt-4 border-t bg-background">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Atualizar' : 'Salvar'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EvolvedTransactionModal;
