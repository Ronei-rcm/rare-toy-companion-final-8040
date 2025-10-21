import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin, 
  User, 
  FileText, 
  Package, 
  DollarSign,
  Clock,
  AlertCircle,
  CheckCircle,
  Plus,
  X,
  Save,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Fornecedor {
  id?: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  cnpj: string;
  contato: string;
  status: 'ativo' | 'inativo' | 'pendente';
  avaliacao: number;
  totalProdutos: number;
  vendasMes: number;
  ultimaAtualizacao: string;
  dataCadastro: string;
  observacoes?: string;
  categorias: string[];
  prazoEntrega: number;
  condicoesPagamento: string;
  website?: string;
  instagram?: string;
  whatsapp?: string;
  limiteCredito?: number;
  descontoPadrao?: number;
  responsavelComercial?: string;
  responsavelFinanceiro?: string;
  banco?: string;
  agencia?: string;
  conta?: string;
}

interface FornecedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fornecedor?: Fornecedor | null;
  onSave: (fornecedor: Fornecedor) => void;
}

const FornecedorModal: React.FC<FornecedorModalProps> = ({
  isOpen,
  onClose,
  fornecedor,
  onSave
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Fornecedor>({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    cnpj: '',
    contato: '',
    status: 'pendente',
    avaliacao: 0,
    totalProdutos: 0,
    vendasMes: 0,
    ultimaAtualizacao: new Date().toISOString().split('T')[0],
    dataCadastro: new Date().toISOString().split('T')[0],
    observacoes: '',
    categorias: [],
    prazoEntrega: 7,
    condicoesPagamento: '30 dias',
    website: '',
    instagram: '',
    whatsapp: '',
    limiteCredito: 0,
    descontoPadrao: 0,
    responsavelComercial: '',
    responsavelFinanceiro: '',
    banco: '',
    agencia: '',
    conta: ''
  });

  const [newCategory, setNewCategory] = useState('');

  const categoriasDisponiveis = [
    'Brinquedos Educativos',
    'Jogos',
    'Brinquedos de Bebê',
    'Roupas',
    'Importados',
    'Eletrônicos',
    'Livros',
    'Esportes',
    'Arte e Criatividade',
    'Outros'
  ];

  useEffect(() => {
    if (fornecedor) {
      setFormData(fornecedor);
    } else {
      // Reset form for new fornecedor
      setFormData({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        cidade: '',
        estado: '',
        cep: '',
        cnpj: '',
        contato: '',
        status: 'pendente',
        avaliacao: 0,
        totalProdutos: 0,
        vendasMes: 0,
        ultimaAtualizacao: new Date().toISOString().split('T')[0],
        dataCadastro: new Date().toISOString().split('T')[0],
        observacoes: '',
        categorias: [],
        prazoEntrega: 7,
        condicoesPagamento: '30 dias',
        website: '',
        instagram: '',
        whatsapp: '',
        limiteCredito: 0,
        descontoPadrao: 0,
        responsavelComercial: '',
        responsavelFinanceiro: '',
        banco: '',
        agencia: '',
        conta: ''
      });
    }
  }, [fornecedor, isOpen]);

  const handleInputChange = (field: keyof Fornecedor, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddCategory = () => {
    if (newCategory && !formData.categorias.includes(newCategory)) {
      setFormData(prev => ({
        ...prev,
        categorias: [...prev.categorias, newCategory]
      }));
      setNewCategory('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categorias: prev.categorias.filter(c => c !== category)
    }));
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCEP = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
      return numbers.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
    } else {
      return numbers.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const fornecedorToSave = {
        ...formData,
        ultimaAtualizacao: new Date().toISOString().split('T')[0]
      };

      onSave(fornecedorToSave);
      
      toast({
        title: fornecedor ? 'Fornecedor atualizado' : 'Fornecedor criado',
        description: `${formData.nome} foi ${fornecedor ? 'atualizado' : 'cadastrado'} com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o fornecedor',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </DialogTitle>
          <DialogDescription>
            {fornecedor 
              ? 'Atualize as informações do fornecedor' 
              : 'Cadastre um novo fornecedor no sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="dados-basicos" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados-basicos">Dados Básicos</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="comercial">Comercial</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            </TabsList>

            {/* Dados Básicos */}
            <TabsContent value="dados-basicos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome da Empresa *</Label>
                      <Input
                        id="nome"
                        value={formData.nome}
                        onChange={(e) => handleInputChange('nome', e.target.value)}
                        placeholder="Nome da empresa"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input
                        id="cnpj"
                        value={formData.cnpj}
                        onChange={(e) => handleInputChange('cnpj', formatCNPJ(e.target.value))}
                        placeholder="00.000.000/0000-00"
                        maxLength={18}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Ativo
                            </div>
                          </SelectItem>
                          <SelectItem value="inativo">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-gray-600" />
                              Inativo
                            </div>
                          </SelectItem>
                          <SelectItem value="pendente">
                            <div className="flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-yellow-600" />
                              Pendente
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prazoEntrega">Prazo de Entrega (dias)</Label>
                      <Input
                        id="prazoEntrega"
                        type="number"
                        value={formData.prazoEntrega}
                        onChange={(e) => handleInputChange('prazoEntrega', parseInt(e.target.value) || 0)}
                        min="1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="condicoesPagamento">Condições de Pagamento</Label>
                      <Select value={formData.condicoesPagamento} onValueChange={(value) => handleInputChange('condicoesPagamento', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="À vista">À vista</SelectItem>
                          <SelectItem value="7 dias">7 dias</SelectItem>
                          <SelectItem value="15 dias">15 dias</SelectItem>
                          <SelectItem value="30 dias">30 dias</SelectItem>
                          <SelectItem value="45 dias">45 dias</SelectItem>
                          <SelectItem value="60 dias">60 dias</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Categorias</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {formData.categorias.map((category) => (
                        <Badge key={category} variant="secondary" className="flex items-center gap-1">
                          {category}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveCategory(category)}
                          />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Selecionar categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriasDisponiveis.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" variant="outline" onClick={handleAddCategory}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacoes">Observações</Label>
                    <Textarea
                      id="observacoes"
                      value={formData.observacoes}
                      onChange={(e) => handleInputChange('observacoes', e.target.value)}
                      placeholder="Observações sobre o fornecedor..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contato */}
            <TabsContent value="contato" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="email@empresa.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone *</Label>
                      <Input
                        id="telefone"
                        value={formData.telefone}
                        onChange={(e) => handleInputChange('telefone', formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="contato">Nome do Contato</Label>
                      <Input
                        id="contato"
                        value={formData.contato}
                        onChange={(e) => handleInputChange('contato', e.target.value)}
                        placeholder="Nome da pessoa de contato"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={formData.whatsapp}
                        onChange={(e) => handleInputChange('whatsapp', formatPhone(e.target.value))}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={formData.website}
                        onChange={(e) => handleInputChange('website', e.target.value)}
                        placeholder="https://www.empresa.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram">Instagram</Label>
                      <Input
                        id="instagram"
                        value={formData.instagram}
                        onChange={(e) => handleInputChange('instagram', e.target.value)}
                        placeholder="@empresa"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endereco">Endereço *</Label>
                    <Input
                      id="endereco"
                      value={formData.endereco}
                      onChange={(e) => handleInputChange('endereco', e.target.value)}
                      placeholder="Rua, número, bairro"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cep">CEP *</Label>
                      <Input
                        id="cep"
                        value={formData.cep}
                        onChange={(e) => handleInputChange('cep', formatCEP(e.target.value))}
                        placeholder="00000-000"
                        maxLength={9}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cidade">Cidade *</Label>
                      <Input
                        id="cidade"
                        value={formData.cidade}
                        onChange={(e) => handleInputChange('cidade', e.target.value)}
                        placeholder="Cidade"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="estado">Estado *</Label>
                      <Select value={formData.estado} onValueChange={(value) => handleInputChange('estado', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map((estado) => (
                            <SelectItem key={estado} value={estado}>
                              {estado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Comercial */}
            <TabsContent value="comercial" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Comerciais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="responsavelComercial">Responsável Comercial</Label>
                      <Input
                        id="responsavelComercial"
                        value={formData.responsavelComercial}
                        onChange={(e) => handleInputChange('responsavelComercial', e.target.value)}
                        placeholder="Nome do responsável comercial"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descontoPadrao">Desconto Padrão (%)</Label>
                      <Input
                        id="descontoPadrao"
                        type="number"
                        value={formData.descontoPadrao}
                        onChange={(e) => handleInputChange('descontoPadrao', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="100"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="limiteCredito">Limite de Crédito (R$)</Label>
                    <Input
                      id="limiteCredito"
                      type="number"
                      value={formData.limiteCredito}
                      onChange={(e) => handleInputChange('limiteCredito', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Financeiro */}
            <TabsContent value="financeiro" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Financeiras</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="responsavelFinanceiro">Responsável Financeiro</Label>
                    <Input
                      id="responsavelFinanceiro"
                      value={formData.responsavelFinanceiro}
                      onChange={(e) => handleInputChange('responsavelFinanceiro', e.target.value)}
                      placeholder="Nome do responsável financeiro"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="banco">Banco</Label>
                      <Input
                        id="banco"
                        value={formData.banco}
                        onChange={(e) => handleInputChange('banco', e.target.value)}
                        placeholder="Nome do banco"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="agencia">Agência</Label>
                      <Input
                        id="agencia"
                        value={formData.agencia}
                        onChange={(e) => handleInputChange('agencia', e.target.value)}
                        placeholder="Número da agência"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conta">Conta</Label>
                      <Input
                        id="conta"
                        value={formData.conta}
                        onChange={(e) => handleInputChange('conta', e.target.value)}
                        placeholder="Número da conta"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FornecedorModal;
