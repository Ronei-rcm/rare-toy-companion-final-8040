import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useFinancialTransactions } from '@/hooks/useFinancialTransactions';
import { 
  DollarSign, 
  Calendar, 
  User, 
  Building, 
  CreditCard, 
  Tag,
  Save,
  X,
  Zap,
  TrendingDown,
  Clock,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Plus,
  Copy,
  Receipt,
  Truck,
  Home,
  Wifi,
  Smartphone,
  ShoppingCart,
  Briefcase,
  Users,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickAddExpenseProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

// Categorias de despesas rápidas com ícones
const categoriasRapidas = [
  { id: 'fornecedor', nome: 'Fornecedor', icon: Package, cor: 'bg-blue-500', descricao: 'Compra de produtos' },
  { id: 'funcionario', nome: 'Funcionário', icon: Users, cor: 'bg-green-500', descricao: 'Salários e benefícios' },
  { id: 'aluguel', nome: 'Aluguel', icon: Home, cor: 'bg-purple-500', descricao: 'Aluguel do local' },
  { id: 'energia', nome: 'Energia', icon: Zap, cor: 'bg-yellow-500', descricao: 'Conta de luz' },
  { id: 'internet', nome: 'Internet', icon: Wifi, cor: 'bg-cyan-500', descricao: 'Serviços de internet' },
  { id: 'telefone', nome: 'Telefone', icon: Smartphone, cor: 'bg-pink-500', descricao: 'Contas de telefone' },
  { id: 'transporte', nome: 'Transporte', icon: Truck, cor: 'bg-orange-500', descricao: 'Frete e transporte' },
  { id: 'marketing', nome: 'Marketing', icon: TrendingDown, cor: 'bg-red-500', descricao: 'Publicidade e marketing' },
  { id: 'escritorio', nome: 'Escritório', icon: Briefcase, cor: 'bg-indigo-500', descricao: 'Material de escritório' },
  { id: 'outros', nome: 'Outros', icon: ShoppingCart, cor: 'bg-gray-500', descricao: 'Outras despesas' }
];

// Métodos de pagamento rápidos
const metodosRapidos = [
  { id: 'dinheiro', nome: 'Dinheiro', icon: DollarSign },
  { id: 'pix', nome: 'PIX', icon: Zap },
  { id: 'credito', nome: 'Crédito', icon: CreditCard },
  { id: 'debito', nome: 'Débito', icon: CreditCard },
  { id: 'boleto', nome: 'Boleto', icon: Receipt }
];

// Status de pagamento
const statusPagamento = [
  { id: 'pago', nome: 'Pago', cor: 'bg-green-500' },
  { id: 'pendente', nome: 'Pendente', cor: 'bg-yellow-500' },
  { id: 'atrasado', nome: 'Atrasado', cor: 'bg-red-500' }
];

const QuickAddExpense: React.FC<QuickAddExpenseProps> = ({ onSuccess, onClose }) => {
  const { createTransaction } = useFinancialTransactions();
  const [etapa, setEtapa] = useState<'categoria' | 'dados' | 'resumo'>('categoria');
  const [saving, setSaving] = useState(false);
  
  // Dados da despesa
  const [categoria, setCategoria] = useState('');
  const [valor, setValor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [fornecedor, setFornecedor] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [status, setStatus] = useState('pago');
  const [dataVencimento, setDataVencimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [parcelas, setParcelas] = useState('1');
  
  // Estado de validação
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pré-preencher data de vencimento com hoje
  useEffect(() => {
    const hoje = new Date().toISOString().split('T')[0];
    setDataVencimento(hoje);
  }, []);

  // Validar etapa de dados
  const validarDados = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!valor || parseFloat(valor) <= 0) {
      newErrors.valor = 'Valor deve ser maior que zero';
    }
    
    if (!descricao.trim()) {
      newErrors.descricao = 'Descrição é obrigatória';
    }
    
    if (!metodoPagamento) {
      newErrors.metodoPagamento = 'Selecione um método de pagamento';
    }
    
    if (!dataVencimento) {
      newErrors.dataVencimento = 'Data é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Avançar para próxima etapa
  const avancar = () => {
    if (etapa === 'categoria' && !categoria) {
      toast.error('Selecione uma categoria');
      return;
    }
    
    if (etapa === 'dados') {
      if (!validarDados()) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      setEtapa('resumo');
      return;
    }
  };

  // Salvar despesa
  const salvarDespesa = async () => {
    setSaving(true);
    
    try {
      const numParcelas = parseInt(parcelas) || 1;
      const valorParcela = parseFloat(valor) / numParcelas;
      
      // Criar lançamentos para cada parcela
      for (let i = 0; i < numParcelas; i++) {
        const dataParcel = new Date(dataVencimento);
        dataParcel.setMonth(dataParcel.getMonth() + i);
        
        const despesa = {
          type: 'expense',
          category: categoria,
          amount: valorParcela,
          description: numParcelas > 1 
            ? `${descricao} (${i + 1}/${numParcelas})`
            : descricao,
          date: dataParcel.toISOString().split('T')[0],
          payment_method: metodoPagamento,
          status: i === 0 && status === 'pago' ? 'paid' : 'pending',
          supplier: fornecedor || null,
          notes: observacoes || null,
          source_type: 'manual',
          source_id: null
        };

        console.log('💰 Salvando despesa:', despesa);
        
        // Usar o hook para criar a transação
        const transactionData = {
          data: despesa.date,
          descricao: despesa.description,
          categoria: despesa.category,
          tipo: 'Saída' as const,
          valor: despesa.amount,
          status: despesa.status === 'paid' ? 'Pago' as const : 'Pendente' as const,
          metodo_pagamento: despesa.payment_method,
          origem: despesa.supplier || despesa.category,
          observacoes: despesa.notes
        };

        const success = await createTransaction(transactionData);
        if (!success) {
          throw new Error('Erro ao salvar despesa');
        }
      }
      
      toast.success(
        numParcelas > 1 
          ? `${numParcelas} despesas cadastradas com sucesso!` 
          : 'Despesa cadastrada com sucesso!',
        {
          icon: '✅'
        }
      );
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Limpar formulário
      limparFormulario();
      setEtapa('categoria');
      
    } catch (error) {
      console.error('❌ Erro ao salvar despesa:', error);
      toast.error('Erro ao salvar despesa. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Limpar formulário
  const limparFormulario = () => {
    setCategoria('');
    setValor('');
    setDescricao('');
    setFornecedor('');
    setMetodoPagamento('');
    setStatus('pago');
    const hoje = new Date().toISOString().split('T')[0];
    setDataVencimento(hoje);
    setObservacoes('');
    setParcelas('1');
    setErrors({});
  };

  // Voltar etapa
  const voltar = () => {
    if (etapa === 'dados') {
      setEtapa('categoria');
    } else if (etapa === 'resumo') {
      setEtapa('dados');
    }
  };

  // Pegar informações da categoria selecionada
  const categoriaInfo = categoriasRapidas.find(c => c.id === categoria);
  const metodoInfo = metodosRapidos.find(m => m.id === metodoPagamento);
  const statusInfo = statusPagamento.find(s => s.id === status);

  // Calcular progresso
  const progresso = etapa === 'categoria' ? 33 : etapa === 'dados' ? 66 : 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="border-b bg-gradient-to-r from-red-50 to-orange-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 text-white rounded-lg">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Cadastro Rápido de Despesas</CardTitle>
              <CardDescription>
                {etapa === 'categoria' && 'Selecione a categoria da despesa'}
                {etapa === 'dados' && 'Preencha os dados da despesa'}
                {etapa === 'resumo' && 'Confira os dados antes de salvar'}
              </CardDescription>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
        
        {/* Barra de progresso */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progresso</span>
            <span>{progresso}%</span>
          </div>
          <Progress value={progresso} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className={etapa === 'categoria' ? 'font-bold text-red-600' : ''}>
              1. Categoria
            </span>
            <span className={etapa === 'dados' ? 'font-bold text-red-600' : ''}>
              2. Dados
            </span>
            <span className={etapa === 'resumo' ? 'font-bold text-red-600' : ''}>
              3. Resumo
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <AnimatePresence mode="wait">
          {/* ETAPA 1: CATEGORIA */}
          {etapa === 'categoria' && (
            <motion.div
              key="categoria"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold mb-2">
                  Qual tipo de despesa você quer cadastrar?
                </h3>
                <p className="text-sm text-muted-foreground">
                  Selecione a categoria que melhor descreve sua despesa
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {categoriasRapidas.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <motion.button
                      key={cat.id}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setCategoria(cat.id);
                        setTimeout(() => setEtapa('dados'), 300);
                      }}
                      className={`
                        p-4 rounded-xl border-2 transition-all
                        ${categoria === cat.id
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-red-300 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className={`${cat.cor} text-white p-3 rounded-lg mb-3 mx-auto w-fit`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <p className="font-medium text-sm mb-1">{cat.nome}</p>
                      <p className="text-xs text-muted-foreground">{cat.descricao}</p>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ETAPA 2: DADOS */}
          {etapa === 'dados' && (
            <motion.div
              key="dados"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              {/* Categoria selecionada */}
              {categoriaInfo && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                  <div className={`${categoriaInfo.cor} text-white p-3 rounded-lg`}>
                    {React.createElement(categoriaInfo.icon, { className: "w-6 h-6" })}
                  </div>
                  <div>
                    <p className="font-semibold">{categoriaInfo.nome}</p>
                    <p className="text-sm text-muted-foreground">{categoriaInfo.descricao}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEtapa('categoria')}
                    className="ml-auto"
                  >
                    Alterar
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Valor */}
                <div className="space-y-2">
                  <Label htmlFor="valor" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Valor Total *
                  </Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder="0,00"
                    className={`text-lg font-bold ${errors.valor ? 'border-red-500' : ''}`}
                  />
                  {errors.valor && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.valor}
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="descricao" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Descrição *
                  </Label>
                  <Input
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    placeholder="Ex: Compra de estoque"
                    className={errors.descricao ? 'border-red-500' : ''}
                  />
                  {errors.descricao && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.descricao}
                    </p>
                  )}
                </div>

                {/* Fornecedor/Beneficiário */}
                <div className="space-y-2">
                  <Label htmlFor="fornecedor" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    Fornecedor/Beneficiário
                  </Label>
                  <Input
                    id="fornecedor"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                    placeholder="Nome do fornecedor"
                  />
                </div>

                {/* Data de Vencimento */}
                <div className="space-y-2">
                  <Label htmlFor="data" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Data *
                  </Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataVencimento}
                    onChange={(e) => setDataVencimento(e.target.value)}
                    className={errors.dataVencimento ? 'border-red-500' : ''}
                  />
                  {errors.dataVencimento && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors.dataVencimento}
                    </p>
                  )}
                </div>
              </div>

              {/* Método de Pagamento */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Método de Pagamento *
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {metodosRapidos.map((metodo) => {
                    const Icon = metodo.icon;
                    return (
                      <button
                        key={metodo.id}
                        onClick={() => setMetodoPagamento(metodo.id)}
                        className={`
                          p-3 rounded-lg border-2 transition-all
                          ${metodoPagamento === metodo.id
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-200 hover:border-red-300'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 mb-2 mx-auto" />
                        <p className="text-sm font-medium">{metodo.nome}</p>
                      </button>
                    );
                  })}
                </div>
                {errors.metodoPagamento && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.metodoPagamento}
                  </p>
                )}
              </div>

              {/* Status e Parcelas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Status
                  </Label>
                  <div className="flex gap-2">
                    {statusPagamento.map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setStatus(st.id)}
                        className={`
                          flex-1 p-3 rounded-lg border-2 transition-all
                          ${status === st.id
                            ? 'border-red-600 bg-red-50'
                            : 'border-gray-200 hover:border-red-300'
                          }
                        `}
                      >
                        <div className={`${st.cor} text-white w-3 h-3 rounded-full mb-1 mx-auto`} />
                        <p className="text-sm font-medium">{st.nome}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Parcelas */}
                <div className="space-y-2">
                  <Label htmlFor="parcelas" className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    Número de Parcelas
                  </Label>
                  <Input
                    id="parcelas"
                    type="number"
                    min="1"
                    max="12"
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                  />
                  {parseInt(parcelas) > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {parseInt(parcelas)} parcelas de R$ {(parseFloat(valor) / parseInt(parcelas) || 0).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Observações (opcional)
                </Label>
                <textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Notas adicionais sobre a despesa..."
                  className="w-full min-h-[80px] p-3 border rounded-lg resize-none"
                />
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={voltar}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button
                  onClick={avancar}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Continuar
                </Button>
              </div>
            </motion.div>
          )}

          {/* ETAPA 3: RESUMO */}
          {etapa === 'resumo' && (
            <motion.div
              key="resumo"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Confirme os dados da despesa
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revise as informações antes de salvar
                </p>
              </div>

              {/* Resumo visual */}
              <div className="space-y-4">
                {/* Valor destaque */}
                <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-xl border-2 border-red-200">
                  <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                  <p className="text-4xl font-bold text-red-600">
                    R$ {parseFloat(valor).toFixed(2)}
                  </p>
                  {parseInt(parcelas) > 1 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {parcelas}x de R$ {(parseFloat(valor) / parseInt(parcelas)).toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Detalhes em cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      {categoriaInfo && React.createElement(categoriaInfo.icon, { 
                        className: "w-5 h-5 text-muted-foreground" 
                      })}
                      <p className="text-sm text-muted-foreground">Categoria</p>
                    </div>
                    <p className="font-semibold">{categoriaInfo?.nome}</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Descrição</p>
                    </div>
                    <p className="font-semibold">{descricao}</p>
                  </div>

                  {fornecedor && (
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Building className="w-5 h-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Fornecedor</p>
                      </div>
                      <p className="font-semibold">{fornecedor}</p>
                    </div>
                  )}

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Data</p>
                    </div>
                    <p className="font-semibold">
                      {new Date(dataVencimento).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      {metodoInfo && React.createElement(metodoInfo.icon, { 
                        className: "w-5 h-5 text-muted-foreground" 
                      })}
                      <p className="text-sm text-muted-foreground">Pagamento</p>
                    </div>
                    <p className="font-semibold">{metodoInfo?.nome}</p>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Status</p>
                    </div>
                    <Badge className={statusInfo?.cor}>
                      {statusInfo?.nome}
                    </Badge>
                  </div>
                </div>

                {observacoes && (
                  <div className="p-4 border rounded-lg bg-gray-50">
                    <p className="text-sm text-muted-foreground mb-2">Observações</p>
                    <p className="text-sm">{observacoes}</p>
                  </div>
                )}
              </div>

              {/* Botões de ação */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={voltar}
                  className="flex-1"
                  disabled={saving}
                >
                  Voltar
                </Button>
                <Button
                  onClick={salvarDespesa}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Confirmar e Salvar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};

export default QuickAddExpense;
