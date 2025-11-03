import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserCheck, 
  Calendar as CalendarIcon, 
  Mail, 
  Phone, 
  MapPin, 
  IdCard,
  DollarSign,
  Clock,
  Building,
  Briefcase,
  Award,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  rg: string;
  endereco: {
    rua: string;
    numero: string;
    bairro: string;
    cidade: string;
    cep: string;
    estado: string;
  };
  cargo: string;
  departamento: string;
  salario: number;
  dataAdmissao: Date;
  dataNascimento: Date;
  status: 'ativo' | 'inativo' | 'ferias' | 'licenca';
  tipoContrato: 'clt' | 'pj' | 'estagio' | 'temporario';
  cargaHoraria: number;
  beneficios: string[];
  observacoes?: string;
  foto?: string;
}

interface FuncionarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (funcionario: any) => void;
  funcionario?: Funcionario | null;
}

const FuncionarioModal: React.FC<FuncionarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  funcionario
}) => {
  const [formData, setFormData] = useState({
    nome: funcionario?.nome || '',
    email: funcionario?.email || '',
    telefone: funcionario?.telefone || '',
    cpf: funcionario?.cpf || '',
    rg: funcionario?.rg || '',
    endereco: {
      rua: funcionario?.endereco?.rua || '',
      numero: funcionario?.endereco?.numero || '',
      bairro: funcionario?.endereco?.bairro || '',
      cidade: funcionario?.endereco?.cidade || '',
      cep: funcionario?.endereco?.cep || '',
      estado: funcionario?.endereco?.estado || ''
    },
    cargo: funcionario?.cargo || '',
    departamento: funcionario?.departamento || '',
    salario: funcionario?.salario || 0,
    dataAdmissao: funcionario?.dataAdmissao || new Date(),
    dataNascimento: funcionario?.dataNascimento || new Date(),
    status: funcionario?.status || 'ativo',
    tipoContrato: funcionario?.tipoContrato || 'clt',
    cargaHoraria: funcionario?.cargaHoraria || 40,
    beneficios: funcionario?.beneficios || [],
    observacoes: funcionario?.observacoes || ''
  });

  const [activeTab, setActiveTab] = useState('dados-pessoais');

  const beneficiosDisponiveis = [
    'Vale Refeição',
    'Vale Transporte',
    'Plano de Saúde',
    'Plano Odontológico',
    'Gympass',
    'Vale Alimentação',
    'Seguro de Vida',
    'Participação nos Lucros',
    'Auxílio Creche',
    'Vale Cultura'
  ];

  const departamentos = [
    'Vendas',
    'TI',
    'Marketing',
    'Recursos Humanos',
    'Financeiro',
    'Operacional',
    'Atendimento',
    'Administrativo'
  ];

  const cargos = [
    'Gerente',
    'Coordenador',
    'Supervisor',
    'Analista',
    'Assistente',
    'Vendedor',
    'Desenvolvedor',
    'Designer',
    'Contador',
    'Auxiliar'
  ];

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('endereco.')) {
      const enderecoField = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          [enderecoField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleBeneficioChange = (beneficio: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      beneficios: checked 
        ? [...prev.beneficios, beneficio]
        : prev.beneficios.filter(b => b !== beneficio)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const funcionarioData = {
      ...formData,
      id: funcionario?.id || Date.now().toString()
    };

    onSave(funcionarioData);
    onClose();
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {funcionario ? 'Editar Funcionário' : 'Novo Funcionário'}
          </DialogTitle>
          <DialogDescription>
            {funcionario ? 'Edite as informações do funcionário' : 'Adicione um novo funcionário ao sistema'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="dados-pessoais">Dados Pessoais</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="profissional">Profissional</TabsTrigger>
              <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
            </TabsList>

            <TabsContent value="dados-pessoais" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', formatCPF(e.target.value))}
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg}
                    onChange={(e) => handleInputChange('rg', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Nascimento *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataNascimento && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataNascimento ? format(formData.dataNascimento, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dataNascimento}
                        onSelect={(date) => handleInputChange('dataNascimento', date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="endereco" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="rua">Rua *</Label>
                  <Input
                    id="rua"
                    value={formData.endereco.rua}
                    onChange={(e) => handleInputChange('endereco.rua', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero">Número *</Label>
                  <Input
                    id="numero"
                    value={formData.endereco.numero}
                    onChange={(e) => handleInputChange('endereco.numero', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bairro">Bairro *</Label>
                  <Input
                    id="bairro"
                    value={formData.endereco.bairro}
                    onChange={(e) => handleInputChange('endereco.bairro', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Input
                    id="cidade"
                    value={formData.endereco.cidade}
                    onChange={(e) => handleInputChange('endereco.cidade', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.endereco.cep}
                    onChange={(e) => handleInputChange('endereco.cep', formatCEP(e.target.value))}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.endereco.estado} onValueChange={(value) => handleInputChange('endereco.estado', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="profissional" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Select value={formData.cargo} onValueChange={(value) => handleInputChange('cargo', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o cargo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargos.map(cargo => (
                        <SelectItem key={cargo} value={cargo}>{cargo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="departamento">Departamento *</Label>
                  <Select value={formData.departamento} onValueChange={(value) => handleInputChange('departamento', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {departamentos.map(dept => (
                        <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salario">Salário *</Label>
                  <Input
                    id="salario"
                    type="number"
                    step="0.01"
                    value={formData.salario}
                    onChange={(e) => handleInputChange('salario', parseFloat(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargaHoraria">Carga Horária *</Label>
                  <Input
                    id="cargaHoraria"
                    type="number"
                    value={formData.cargaHoraria}
                    onChange={(e) => handleInputChange('cargaHoraria', parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                      <SelectItem value="ferias">Férias</SelectItem>
                      <SelectItem value="licenca">Licença</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipoContrato">Tipo de Contrato *</Label>
                  <Select value={formData.tipoContrato} onValueChange={(value) => handleInputChange('tipoContrato', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clt">CLT</SelectItem>
                      <SelectItem value="pj">PJ</SelectItem>
                      <SelectItem value="estagio">Estágio</SelectItem>
                      <SelectItem value="temporario">Temporário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Admissão *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.dataAdmissao && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dataAdmissao ? format(formData.dataAdmissao, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dataAdmissao}
                        onSelect={(date) => handleInputChange('dataAdmissao', date || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                  rows={3}
                  placeholder="Observações adicionais sobre o funcionário..."
                />
              </div>
            </TabsContent>

            <TabsContent value="beneficios" className="space-y-4">
              <div className="space-y-2">
                <Label>Benefícios Oferecidos</Label>
                <p className="text-sm text-gray-600">
                  Selecione os benefícios que este funcionário tem direito:
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {beneficiosDisponiveis.map((beneficio) => (
                  <div key={beneficio} className="flex items-center space-x-2">
                    <Checkbox
                      id={beneficio}
                      checked={formData.beneficios.includes(beneficio)}
                      onCheckedChange={(checked) => handleBeneficioChange(beneficio, checked as boolean)}
                    />
                    <Label htmlFor={beneficio} className="text-sm font-normal">
                      {beneficio}
                    </Label>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
              {funcionario ? 'Atualizar' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FuncionarioModal;
