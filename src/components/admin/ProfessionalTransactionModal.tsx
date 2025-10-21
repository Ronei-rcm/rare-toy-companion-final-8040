import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  X,
  Save,
  Upload,
  File,
  Trash2,
  Download,
  Eye,
  Calendar,
  DollarSign,
  FileText,
  Tag,
  Building,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Paperclip,
  Image as ImageIcon,
  FileImage,
  FileText,
  Loader2,
  History,
  User,
  MessageSquare,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploaded_at: string;
}

interface HistoryEntry {
  id: string;
  action: string;
  user: string;
  date: string;
  details: string;
}

interface Transaction {
  id?: string | number;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  amount: number;
  status: 'paid' | 'pending' | 'overdue';
  payment_method?: string;
  supplier?: string;
  notes?: string;
  attachments?: Attachment[];
  history?: HistoryEntry[];
  installments?: number;
  installment_number?: number;
  due_date?: string;
  paid_date?: string;
  tags?: string[];
}

interface ProfessionalTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transaction?: Transaction | null;
  mode?: 'create' | 'edit' | 'view';
}

const ProfessionalTransactionModal: React.FC<ProfessionalTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  mode = 'create'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState<Transaction>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    category: '',
    type: 'expense',
    amount: 0,
    status: 'pending',
    payment_method: '',
    supplier: '',
    notes: '',
    attachments: [],
    tags: [],
    installments: 1
  });

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dados');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPaymentConfirm, setShowPaymentConfirm] = useState(false);

  // Carregar dados da transação se estiver editando
  useEffect(() => {
    if (transaction && mode !== 'create') {
      setFormData({
        ...transaction,
        attachments: transaction.attachments || [],
        tags: transaction.tags || []
      });
      setAttachments(transaction.attachments || []);
    } else {
      // Reset para novo lançamento
      setFormData({
        date: new Date().toISOString().split('T')[0],
        description: '',
        category: '',
        type: 'expense',
        amount: 0,
        status: 'pending',
        payment_method: '',
        supplier: '',
        notes: '',
        attachments: [],
        tags: [],
        installments: 1
      });
      setAttachments([]);
    }
  }, [transaction, mode]);

  // Categorias
  const categories = {
    income: ['Vendas', 'Eventos', 'Serviços', 'Outros'],
    expense: ['Fornecedor', 'Funcionário', 'Aluguel', 'Energia', 'Internet', 'Marketing', 'Transporte', 'Outros']
  };

  const paymentMethods = ['Dinheiro', 'PIX', 'Crédito', 'Débito', 'Boleto', 'Transferência'];

  // Handlers
  const handleChange = (field: keyof Transaction, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      // Simular upload (implementar upload real para o servidor)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validar tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Arquivo ${file.name} é muito grande (máx 5MB)`);
          continue;
        }

        // Criar objeto de anexo
        const attachment: Attachment = {
          id: `${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          type: file.type,
          url: URL.createObjectURL(file), // Temporário - implementar upload real
          uploaded_at: new Date().toISOString()
        };

        setAttachments(prev => [...prev, attachment]);
      }

      toast.success(`${files.length} arquivo(s) anexado(s) com sucesso`);
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao fazer upload dos arquivos');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
    toast.success('Anexo removido');
  };

  const handleDownloadAttachment = (attachment: Attachment) => {
    // Implementar download real
    const link = document.createElement('a');
    link.href = attachment.url;
    link.download = attachment.name;
    link.click();
    toast.success('Download iniciado');
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    console.log('🔍 Validando formulário:', formData);

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.category) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (formData.amount <= 0) {
      newErrors.amount = 'Valor deve ser maior que zero';
    }

    if (!formData.date) {
      newErrors.date = 'Data é obrigatória';
    }

    console.log('❌ Erros encontrados:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    console.log('💾 handleSave chamado no modal');
    if (!validateForm()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);

    try {
      const transactionData: Transaction = {
        ...formData,
        attachments,
        history: [
          ...(formData.history || []),
          {
            id: Date.now().toString(),
            action: mode === 'create' ? 'Criado' : 'Atualizado',
            user: 'Admin', // Pegar do contexto de autenticação
            date: new Date().toISOString(),
            details: mode === 'create' ? 'Lançamento criado' : 'Lançamento atualizado'
          }
        ]
      };

      console.log('📤 Modal enviando dados:', transactionData);
      await onSave(transactionData);
      
      toast.success(
        mode === 'create' ? 'Lançamento criado com sucesso!' : 'Lançamento atualizado com sucesso!',
        { icon: '✅' }
      );
      
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar lançamento');
    } finally {
      setSaving(false);
    }
  };

  const handlePaymentConfirmation = async () => {
    if (formData.status === 'paid') {
      toast.warning('Este lançamento já está pago');
      return;
    }

    setShowPaymentConfirm(true);
  };

  const confirmPayment = async () => {
    setSaving(true);

    try {
      const updatedTransaction: Transaction = {
        ...formData,
        status: 'paid',
        paid_date: new Date().toISOString().split('T')[0],
        history: [
          ...(formData.history || []),
          {
            id: Date.now().toString(),
            action: 'Baixa Realizada',
            user: 'Admin',
            date: new Date().toISOString(),
            details: 'Pagamento confirmado'
          }
        ]
      };

      await onSave(updatedTransaction);
      
      toast.success('Baixa realizada com sucesso!', { icon: '✅' });
      setShowPaymentConfirm(false);
      onClose();
    } catch (error) {
      console.error('Erro ao dar baixa:', error);
      toast.error('Erro ao confirmar pagamento');
    } finally {
      setSaving(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <FileImage className="w-8 h-8 text-blue-500" />;
    if (type === 'application/pdf') return <FilePdf className="w-8 h-8 text-red-500" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const isCreateMode = mode === 'create';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  formData.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                } text-white`}>
                  {formData.type === 'income' ? (
                    <TrendingUp className="w-6 h-6" />
                  ) : (
                    <TrendingDown className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {isCreateMode && 'Novo Lançamento Financeiro'}
                    {isEditMode && 'Editar Lançamento'}
                    {isViewMode && 'Visualizar Lançamento'}
                  </CardTitle>
                  <CardDescription>
                    {isCreateMode && 'Preencha os dados do novo lançamento'}
                    {isEditMode && 'Atualize as informações do lançamento'}
                    {isViewMode && 'Detalhes completos do lançamento'}
                  </CardDescription>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="dados">
                  <FileText className="w-4 h-4 mr-2" />
                  Dados
                </TabsTrigger>
                <TabsTrigger value="anexos">
                  <Paperclip className="w-4 h-4 mr-2" />
                  Anexos ({attachments.length})
                </TabsTrigger>
                <TabsTrigger value="historico">
                  <History className="w-4 h-4 mr-2" />
                  Histórico
                </TabsTrigger>
                <TabsTrigger value="pagamento">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pagamento
                </TabsTrigger>
              </TabsList>

              {/* ABA: DADOS */}
              <TabsContent value="dados" className="space-y-6">
                {/* Tipo */}
                <div className="space-y-2">
                  <Label>Tipo de Lançamento *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      disabled={isViewMode}
                      onClick={() => handleChange('type', 'income')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.type === 'income'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-green-300'
                      } ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <TrendingUp className="w-6 h-6 mb-2 mx-auto text-green-600" />
                      <p className="font-medium">Entrada</p>
                      <p className="text-xs text-muted-foreground">Recebimento</p>
                    </button>
                    <button
                      type="button"
                      disabled={isViewMode}
                      onClick={() => handleChange('type', 'expense')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.type === 'expense'
                          ? 'border-red-600 bg-red-50'
                          : 'border-gray-200 hover:border-red-300'
                      } ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <TrendingDown className="w-6 h-6 mb-2 mx-auto text-red-600" />
                      <p className="font-medium">Saída</p>
                      <p className="text-xs text-muted-foreground">Pagamento</p>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Valor */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Valor *
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                      disabled={isViewMode}
                      className={`text-lg font-bold ${errors.amount ? 'border-red-500' : ''}`}
                      placeholder="0,00"
                    />
                    {errors.amount && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Data */}
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data *
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange('date', e.target.value)}
                      disabled={isViewMode}
                      className={errors.date ? 'border-red-500' : ''}
                    />
                  </div>

                  {/* Categoria */}
                  <div className="space-y-2">
                    <Label htmlFor="category" className="flex items-center gap-2">
                      <Tag className="w-4 h-4" />
                      Categoria *
                    </Label>
                    <select
                      id="category"
                      value={formData.category}
                      onChange={(e) => handleChange('category', e.target.value)}
                      disabled={isViewMode}
                      className={`w-full p-2 border rounded-md ${errors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Selecione...</option>
                      {categories[formData.type].map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Método de Pagamento */}
                  <div className="space-y-2">
                    <Label htmlFor="payment_method" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Método de Pagamento
                    </Label>
                    <select
                      id="payment_method"
                      value={formData.payment_method}
                      onChange={(e) => handleChange('payment_method', e.target.value)}
                      disabled={isViewMode}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Selecione...</option>
                      {paymentMethods.map(method => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Descrição *
                  </Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    disabled={isViewMode}
                    className={errors.description ? 'border-red-500' : ''}
                    placeholder="Ex: Pagamento de fornecedor"
                  />
                </div>

                {/* Fornecedor/Cliente */}
                <div className="space-y-2">
                  <Label htmlFor="supplier" className="flex items-center gap-2">
                    <Building className="w-4 h-4" />
                    {formData.type === 'income' ? 'Cliente' : 'Fornecedor/Beneficiário'}
                  </Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleChange('supplier', e.target.value)}
                    disabled={isViewMode}
                    placeholder="Nome da empresa ou pessoa"
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="notes" className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Observações
                  </Label>
                  <textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    disabled={isViewMode}
                    className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
                    placeholder="Informações adicionais sobre o lançamento..."
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Status
                  </Label>
                  <div className="flex gap-2">
                    {[
                      { value: 'paid', label: 'Pago', color: 'bg-green-500' },
                      { value: 'pending', label: 'Pendente', color: 'bg-yellow-500' },
                      { value: 'overdue', label: 'Atrasado', color: 'bg-red-500' }
                    ].map((status) => (
                      <button
                        key={status.value}
                        type="button"
                        disabled={isViewMode}
                        onClick={() => handleChange('status', status.value)}
                        className={`flex-1 p-3 rounded-lg border-2 transition-all ${
                          formData.status === status.value
                            ? 'border-purple-600 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300'
                        } ${isViewMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <div className={`${status.color} w-3 h-3 rounded-full mb-1 mx-auto`} />
                        <p className="text-sm font-medium">{status.label}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* ABA: ANEXOS */}
              <TabsContent value="anexos" className="space-y-6">
                {!isViewMode && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-semibold mb-2">Upload de Comprovantes</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Arraste arquivos ou clique para selecionar
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Formatos: PDF, Imagens, Word, Excel (máx 5MB por arquivo)
                    </p>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" />
                          Selecionar Arquivos
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* Lista de Anexos */}
                {attachments.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((attachment) => (
                      <motion.div
                        key={attachment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-3">
                          {getFileIcon(attachment.type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{attachment.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(attachment.size)} • {new Date(attachment.uploaded_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDownloadAttachment(attachment)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {!isViewMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveAttachment(attachment.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Paperclip className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">Nenhum anexo</p>
                    <p className="text-sm">Adicione comprovantes, notas fiscais ou recibos</p>
                  </div>
                )}
              </TabsContent>

              {/* ABA: HISTÓRICO */}
              <TabsContent value="historico" className="space-y-4">
                {formData.history && formData.history.length > 0 ? (
                  <div className="space-y-3">
                    {formData.history.map((entry) => (
                      <div key={entry.id} className="border-l-4 border-purple-500 pl-4 py-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold">{entry.action}</p>
                            <p className="text-sm text-muted-foreground">{entry.details}</p>
                          </div>
                          <Badge variant="outline">{new Date(entry.date).toLocaleString('pt-BR')}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="text-lg font-medium mb-1">Sem histórico</p>
                    <p className="text-sm">As alterações serão registradas aqui</p>
                  </div>
                )}
              </TabsContent>

              {/* ABA: PAGAMENTO */}
              <TabsContent value="pagamento" className="space-y-6">
                <div className="border rounded-lg p-6 bg-gradient-to-br from-purple-50 to-blue-50">
                  <div className="text-center mb-6">
                    <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      formData.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                      {formData.status === 'paid' ? (
                        <CheckCircle className="w-10 h-10 text-white" />
                      ) : (
                        <Clock className="w-10 h-10 text-white" />
                      )}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">
                      {formData.status === 'paid' ? 'Pago' : 'Pendente'}
                    </h3>
                    <p className="text-muted-foreground">
                      {formData.status === 'paid' 
                        ? 'Este lançamento já foi pago'
                        : 'Este lançamento ainda não foi pago'}
                    </p>
                  </div>

                  {formData.status !== 'paid' && !isViewMode && (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg border">
                        <p className="text-sm text-muted-foreground mb-2">Valor a pagar</p>
                        <p className="text-3xl font-bold text-purple-600">
                          R$ {formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>

                      <Button
                        onClick={handlePaymentConfirmation}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-6 text-lg"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Dar Baixa neste Lançamento
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        Ao confirmar, o status será alterado para "Pago" e a data de pagamento será registrada
                      </p>
                    </div>
                  )}

                  {formData.status === 'paid' && formData.paid_date && (
                    <div className="p-4 bg-white rounded-lg border">
                      <p className="text-sm text-muted-foreground mb-1">Data do Pagamento</p>
                      <p className="text-lg font-semibold">
                        {new Date(formData.paid_date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          {/* Footer com Ações */}
          <div className="border-t p-6 bg-gray-50 flex justify-between items-center">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancelar
            </Button>
            
            <div className="flex gap-3">
              {!isViewMode && (
                <Button
                  onClick={() => {
                    console.log('🖱️ Botão salvar clicado!');
                    handleSave();
                  }}
                  disabled={saving}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Lançamento
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Modal de Confirmação de Baixa */}
      <AnimatePresence>
        {showPaymentConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Confirmar Baixa</h3>
                <p className="text-muted-foreground">
                  Tem certeza que deseja dar baixa neste lançamento?
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg mb-6">
                <p className="text-sm text-muted-foreground mb-1">Valor</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {formData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-muted-foreground mt-2">{formData.description}</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentConfirm(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  onClick={confirmPayment}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Confirmando...
                    </>
                  ) : (
                    'Confirmar Baixa'
                  )}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProfessionalTransactionModal;
