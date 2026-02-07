import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, X, Search, Check, Edit, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAutoCategorization } from '@/services/AutoCategorizationService';

interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  cor: string;
  icone: string;
  tipo: string;
}

interface SimpleTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  mode?: 'create' | 'edit' | 'duplicate';
  transaction?: any;
}

const SimpleTransactionModal: React.FC<SimpleTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode = 'create',
  transaction
}) => {
  const [saving, setSaving] = useState(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<Categoria | null>(null);
  const [buscaCategoria, setBuscaCategoria] = useState('');
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const [contas, setContas] = useState<any[]>([]);
  const [categorySuggestion, setCategorySuggestion] = useState<{ categoria: string; confidence: number; reason: string } | null>(null);
  const [allTransactions, setAllTransactions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    descricao: '',
    categoria: '',
    tipo: 'entrada',
    valor: '',
    status: 'Pago',
    data: new Date().toISOString().split('T')[0],
    hora: '',
    metodo_pagamento: 'PIX',
    origem: '',
    detalhe: '', // Campo Detalhe (Recebido, Enviado, Devolvido, etc.)
    observacoes: '',
    conta_id: ''
  });

  // Carregar categorias quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      carregarCategorias();
      carregarContas();
      carregarTransacoes();
    }
  }, [isOpen]);

  // Carregar transações para o serviço de categorização
  const carregarTransacoes = async () => {
    try {
      const response = await fetch('/api/financial/transactions');
      if (response.ok) {
        const data = await response.json();
        setAllTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    }
  };

  // Inicializar serviço de categorização
  const { suggestCategory } = useAutoCategorization(allTransactions);

  // Sugerir categoria ao digitar descrição
  useEffect(() => {
    if (formData.descricao.trim().length > 3 && !formData.categoria && allTransactions.length > 0) {
      const suggestion = suggestCategory(formData.descricao, formData.tipo as 'entrada' | 'saida');
      setCategorySuggestion(suggestion);
    } else {
      setCategorySuggestion(null);
    }
  }, [formData.descricao, allTransactions]);

  // Carregar dados da transação para edição/duplicação
  useEffect(() => {
    if (isOpen && transaction && (mode === 'edit' || mode === 'duplicate')) {
      // Converter hora do formato MySQL (HH:MM:SS) para formato do input (HH:MM)
      let horaFormatada = '';
      if (transaction.hora) {
        // Se vier como "HH:MM:SS", pegar apenas "HH:MM"
        if (transaction.hora.includes(':')) {
          const partes = transaction.hora.split(':');
          horaFormatada = `${partes[0]}:${partes[1]}`;
        } else {
          horaFormatada = transaction.hora;
        }
      }

      // Extrair detalhe das observações se não estiver direto
      let detalheExtraido = '';
      if (transaction.detalhe) {
        detalheExtraido = transaction.detalhe;
      } else if (transaction.observacoes) {
        // Tentar extrair de observações: "Detalhe: Recebido | ..."
        const match = transaction.observacoes.match(/Detalhe:\s*([^|]+)/);
        if (match) {
          detalheExtraido = match[1].trim();
        }
      }

      console.log('🔍 Carregando transação para edição:', {
        id: transaction.id,
        hora_original: transaction.hora,
        hora_formatada: horaFormatada,
        data: transaction.data,
        metodo_pagamento: transaction.metodo_pagamento,
        origem: transaction.origem,
        detalhe: detalheExtraido
      });

      setFormData({
        descricao: transaction.descricao || '',
        categoria: transaction.categoria || '',
        tipo: transaction.tipo || 'entrada',
        valor: transaction.valor ? transaction.valor.toString() : '',
        status: transaction.status || 'Pago',
        data: transaction.data ? transaction.data.split('T')[0] : new Date().toISOString().split('T')[0],
        hora: horaFormatada,
        metodo_pagamento: transaction.metodo_pagamento || 'PIX',
        origem: transaction.origem || '',
        detalhe: detalheExtraido,
        observacoes: transaction.observacoes || '',
        conta_id: transaction.conta_id ? transaction.conta_id.toString() : ''
      });

      // Se for duplicação, limpar ID e alterar descrição
      if (mode === 'duplicate') {
        setFormData(prev => ({
          ...prev,
          descricao: prev.descricao ? `${prev.descricao} (Cópia)` : '',
          data: new Date().toISOString().split('T')[0]
        }));
      }
    }
  }, [isOpen, transaction, mode]);

  // Fechar lista de categorias quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.categoria-search-container')) {
        setMostrarCategorias(false);
      }
    };

    if (mostrarCategorias) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [mostrarCategorias]);

  const carregarCategorias = async () => {
    try {
      const response = await fetch('/api/financial/categorias');
      if (response.ok) {
        const data = await response.json();
        setCategorias(data.categorias || []);
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const carregarContas = async () => {
    try {
      const response = await fetch('/api/financial/contas');
      if (response.ok) {
        const data = await response.json();
        setContas(data.contas || []);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
    }
  };

  const selecionarCategoria = (categoria: Categoria) => {
    setCategoriaSelecionada(categoria);
    setFormData({ ...formData, categoria: categoria.nome });
    setBuscaCategoria('');
    setMostrarCategorias(false);
  };

  const filtrarCategorias = () => {
    if (!buscaCategoria) return categorias;
    return categorias.filter(categoria =>
      categoria.nome.toLowerCase().includes(buscaCategoria.toLowerCase()) ||
      categoria.descricao.toLowerCase().includes(buscaCategoria.toLowerCase())
    );
  };

  const handleSave = async () => {
    // Validação mais específica
    if (!formData.descricao || formData.descricao.trim() === '') {
      toast.error('Preencha a descrição');
      return;
    }

    if (!formData.categoria || formData.categoria.trim() === '') {
      toast.error('Selecione uma categoria');
      return;
    }

    if (!formData.valor || formData.valor.trim() === '' || parseFloat(formData.valor) <= 0) {
      toast.error('Preencha um valor válido');
      return;
    }

    console.log('✅ Validação passou:', { descricao: formData.descricao, categoria: formData.categoria, valor: formData.valor });

    setSaving(true);
    try {
      // Incluir detalhe nas observações se fornecido
      let observacoesFinal = formData.observacoes || '';
      if (formData.detalhe) {
        if (observacoesFinal) {
          observacoesFinal = `Detalhe: ${formData.detalhe} | ${observacoesFinal}`;
        } else {
          observacoesFinal = `Detalhe: ${formData.detalhe}`;
        }
      }

      const transactionData = {
        ...formData,
        valor: parseFloat(formData.valor),
        // Garantir que hora seja enviada (mesmo que vazia, será null no backend)
        hora: formData.hora || null,
        // Incluir detalhe no objeto (será salvo nas observações)
        detalhe: formData.detalhe || null,
        // Observações com detalhe incluído
        observacoes: observacoesFinal,
        // Incluir conta_id se selecionado
        conta_id: formData.conta_id && formData.conta_id !== 'none' ? parseInt(formData.conta_id) : null,
        // Incluir ID apenas para edição
        ...(mode === 'edit' && transaction?.id && { id: transaction.id })
      };

      console.log('💾 Salvando transação:', transactionData);
      console.log('🔍 Modo:', mode);
      console.log('🔍 FormData completo:', formData);
      console.log('🔍 Campo hora:', formData.hora || 'vazio');
      console.log('🔍 Tipo selecionado:', formData.tipo);

      await onSave(transactionData);

      const message = mode === 'edit' ? 'Transação atualizada com sucesso!' :
        mode === 'duplicate' ? 'Transação duplicada com sucesso!' :
          'Transação salva com sucesso!';

      toast.success(message);
      onClose();
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      const errorMessage = mode === 'edit' ? 'Erro ao atualizar transação' :
        mode === 'duplicate' ? 'Erro ao duplicar transação' :
          'Erro ao salvar transação';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl w-[95vw] max-h-[90vh] flex flex-col p-6 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 !m-0"
        style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', margin: 0, maxHeight: '90vh' }}
      >
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            {mode === 'edit' ? (
              <>
                <Edit className="h-5 w-5 text-blue-600" />
                <span className="text-blue-600">Editar Transação</span>
              </>
            ) : mode === 'duplicate' ? (
              <>
                <Copy className="h-5 w-5 text-green-600" />
                <span className="text-green-600">Duplicar Transação</span>
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-blue-600" />
                <span className="text-blue-600">Nova Transação</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Edite os dados da transação selecionada' :
              mode === 'duplicate' ? 'Crie uma cópia desta transação com os dados preenchidos' :
                'Crie uma nova transação financeira'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  placeholder="Ex: Venda de produtos"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <div className="relative categoria-search-container">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="categoria"
                        value={buscaCategoria}
                        onChange={(e) => {
                          setBuscaCategoria(e.target.value);
                          setMostrarCategorias(true);
                        }}
                        onFocus={() => setMostrarCategorias(true)}
                        placeholder="Buscar categoria..."
                        className="pl-10"
                      />
                    </div>
                    {categoriaSelecionada && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCategoriaSelecionada(null);
                          setFormData({ ...formData, categoria: '' });
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Categoria Selecionada */}
                  {categoriaSelecionada && (
                    <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: categoriaSelecionada.cor }}
                        />
                        <span className="text-lg">{categoriaSelecionada.icone}</span>
                        <div>
                          <div className="font-medium text-blue-900">{categoriaSelecionada.nome}</div>
                          <div className="text-sm text-blue-600">{categoriaSelecionada.descricao}</div>
                        </div>
                        <Check className="h-5 w-5 text-green-600 ml-auto" />
                      </div>
                    </div>
                  )}

                  {/* Sugestão Automática de Categoria */}
                  {categorySuggestion && !categoriaSelecionada && (
                    <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-md animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-purple-100 rounded-full">
                            <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-purple-900">
                              Sugestão: <span className="font-bold">{categorySuggestion.categoria}</span>
                            </div>
                            <div className="text-xs text-purple-600">
                              {categorySuggestion.reason} • {Math.round(categorySuggestion.confidence * 100)}% de confiança
                            </div>
                          </div>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            setFormData({ ...formData, categoria: categorySuggestion.categoria });
                            const cat = categorias.find(c => c.nome === categorySuggestion.categoria);
                            if (cat) setCategoriaSelecionada(cat);
                            setCategorySuggestion(null);
                            toast.success('Categoria aplicada!');
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Aplicar
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Lista de Categorias */}
                  {mostrarCategorias && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filtrarCategorias().length > 0 ? (
                        filtrarCategorias().map((categoria) => (
                          <div
                            key={categoria.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selecionarCategoria(categoria)}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className="w-4 h-4 rounded-full"
                                style={{ backgroundColor: categoria.cor }}
                              />
                              <span className="text-lg">{categoria.icone}</span>
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{categoria.nome}</div>
                                <div className="text-sm text-gray-500">{categoria.descricao}</div>
                                <div className="text-xs text-gray-400">
                                  Tipo: {categoria.tipo === 'entrada' ? 'Entrada' : categoria.tipo === 'saida' ? 'Saída' : 'Ambos'}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          {buscaCategoria ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria cadastrada'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="valor">Valor *</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: e.target.value.replace(',', '.') })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <div>
                  <Label htmlFor="data">Data *</Label>
                  <Input
                    id="data"
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="hora">Hora (Opcional)</Label>
                  <Input
                    id="hora"
                    type="time"
                    value={formData.hora}
                    onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                    step="1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pago">Pago</SelectItem>
                    <SelectItem value="Pendente">Pendente</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="conta_id">Conta Bancária</Label>
                <Select value={formData.conta_id} onValueChange={(value) => setFormData({ ...formData, conta_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {contas.map(conta => (
                      <SelectItem key={conta.id} value={conta.id.toString()}>
                        {conta.nome} {conta.banco ? `(${conta.banco})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="metodo_pagamento">Tipo de Transação</Label>
              <Select value={formData.metodo_pagamento} onValueChange={(value) => setFormData({ ...formData, metodo_pagamento: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Depósito de vendas">Depósito de vendas</SelectItem>
                  <SelectItem value="Depósito">Depósito</SelectItem>
                  <SelectItem value="Transferência">Transferência</SelectItem>
                  <SelectItem value="Cartão de Crédito">Cartão de Crédito</SelectItem>
                  <SelectItem value="Cartão de Débito">Cartão de Débito</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="TED">TED</SelectItem>
                  <SelectItem value="DOC">DOC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="origem">Nome</Label>
              <Input
                id="origem"
                value={formData.origem}
                onChange={(e) => setFormData({ ...formData, origem: e.target.value })}
                placeholder="Ex: Pix Beatriz da Silva, Depósito de vendas, etc."
              />
            </div>

            <div>
              <Label htmlFor="detalhe">Detalhe</Label>
              <Select value={formData.detalhe} onValueChange={(value) => setFormData({ ...formData, detalhe: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o detalhe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recebido">Recebido</SelectItem>
                  <SelectItem value="Enviado">Enviado</SelectItem>
                  <SelectItem value="Devolvido">Devolvido</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Input
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-shrink-0 justify-end gap-2 pt-4 border-t bg-background">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Atualizando...' : mode === 'duplicate' ? 'Duplicando...' : 'Salvando...'}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {mode === 'edit' ? 'Atualizar' : mode === 'duplicate' ? 'Duplicar' : 'Salvar'}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SimpleTransactionModal;
