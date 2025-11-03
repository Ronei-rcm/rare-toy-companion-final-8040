import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  UserCheck, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  Download,
  Upload,
  Eye,
  Clock,
  DollarSign,
  Calendar as CalendarIcon,
  Users,
  TrendingUp,
  Building,
  Mail,
  Phone,
  MapPin,
  IdCard,
  Banknote,
  BarChart,
  BarChart,
  FileText,
  AlertCircle,
  CheckCircle,
  UserPlus,
  UserMinus,
  Target,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import FuncionarioModal from '@/components/admin/FuncionarioModal';

// Interfaces
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

interface PayrollData {
  funcionarioId: string;
  mes: string;
  salario: number;
  beneficios: number;
  descontos: number;
  horasExtras: number;
  salarioLiquido: number;
  status: 'pendente' | 'pago' | 'atrasado';
}

const Funcionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([
    {
      id: '1',
      nome: 'João Silva',
      email: 'joao.silva@muhlstore.com',
      telefone: '(11) 99999-9999',
      cpf: '123.456.789-00',
      rg: '12.345.678-9',
      endereco: {
        rua: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'São Paulo',
        cep: '01234-567',
        estado: 'SP'
      },
      cargo: 'Gerente de Vendas',
      departamento: 'Vendas',
      salario: 5000,
      dataAdmissao: new Date('2023-01-15'),
      dataNascimento: new Date('1985-05-20'),
      status: 'ativo',
      tipoContrato: 'clt',
      cargaHoraria: 40,
      beneficios: ['Vale Refeição', 'Vale Transporte', 'Plano de Saúde'],
      observacoes: 'Funcionário exemplar',
      foto: ''
    },
    {
      id: '2',
      nome: 'Maria Santos',
      email: 'maria.santos@muhlstore.com',
      telefone: '(11) 88888-8888',
      cpf: '987.654.321-00',
      rg: '98.765.432-1',
      endereco: {
        rua: 'Av. Paulista',
        numero: '456',
        bairro: 'Bela Vista',
        cidade: 'São Paulo',
        cep: '01310-100',
        estado: 'SP'
      },
      cargo: 'Desenvolvedora',
      departamento: 'TI',
      salario: 6000,
      dataAdmissao: new Date('2023-03-10'),
      dataNascimento: new Date('1990-08-15'),
      status: 'ativo',
      tipoContrato: 'clt',
      cargaHoraria: 40,
      beneficios: ['Vale Refeição', 'Vale Transporte', 'Plano de Saúde', 'Gympass'],
      observacoes: 'Especialista em React',
      foto: ''
    },
    {
      id: '3',
      nome: 'Pedro Costa',
      email: 'pedro.costa@muhlstore.com',
      telefone: '(11) 77777-7777',
      cpf: '456.789.123-00',
      rg: '45.678.912-3',
      endereco: {
        rua: 'Rua Augusta',
        numero: '789',
        bairro: 'Consolação',
        cidade: 'São Paulo',
        cep: '01305-100',
        estado: 'SP'
      },
      cargo: 'Vendedor',
      departamento: 'Vendas',
      salario: 3000,
      dataAdmissao: new Date('2023-06-01'),
      dataNascimento: new Date('1995-12-03'),
      status: 'ferias',
      tipoContrato: 'clt',
      cargaHoraria: 40,
      beneficios: ['Vale Refeição', 'Vale Transporte'],
      observacoes: 'Em período de férias',
      foto: ''
    }
  ]);

  const [payrollData, setPayrollData] = useState<PayrollData[]>([
    {
      funcionarioId: '1',
      mes: '2024-05',
      salario: 5000,
      beneficios: 800,
      descontos: 1200,
      horasExtras: 300,
      salarioLiquido: 4900,
      status: 'pago'
    },
    {
      funcionarioId: '2',
      mes: '2024-05',
      salario: 6000,
      beneficios: 1000,
      descontos: 1500,
      horasExtras: 400,
      salarioLiquido: 5900,
      status: 'pago'
    },
    {
      funcionarioId: '3',
      mes: '2024-05',
      salario: 3000,
      beneficios: 400,
      descontos: 600,
      horasExtras: 0,
      salarioLiquido: 2800,
      status: 'pago'
    }
  ]);

  const [showFuncionarioModal, setShowFuncionarioModal] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [filterDepartamento, setFilterDepartamento] = useState('todos');
  const [activeTab, setActiveTab] = useState('funcionarios');

  // Estatísticas
  const totalFuncionarios = funcionarios.length;
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo').length;
  const funcionariosFerias = funcionarios.filter(f => f.status === 'ferias').length;
  const totalSalarios = funcionarios.reduce((sum, f) => sum + f.salario, 0);
  const folhaPagamento = payrollData.reduce((sum, p) => sum + p.salarioLiquido, 0);

  const departamentos = [...new Set(funcionarios.map(f => f.departamento))];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'text-green-600 bg-green-100';
      case 'inativo':
        return 'text-red-600 bg-red-100';
      case 'ferias':
        return 'text-blue-600 bg-blue-100';
      case 'licenca':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo':
        return 'Ativo';
      case 'inativo':
        return 'Inativo';
      case 'ferias':
        return 'Férias';
      case 'licenca':
        return 'Licença';
      default:
        return status;
    }
  };

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.cargo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'todos' || funcionario.status === filterStatus;
    const matchesDepartamento = filterDepartamento === 'todos' || funcionario.departamento === filterDepartamento;
    
    return matchesSearch && matchesStatus && matchesDepartamento;
  });

  const handleNewFuncionario = () => {
    setEditingFuncionario(null);
    setShowFuncionarioModal(true);
  };

  const handleEditFuncionario = (funcionario: Funcionario) => {
    setEditingFuncionario(funcionario);
    setShowFuncionarioModal(true);
  };

  const handleDeleteFuncionario = (id: string) => {
    setFuncionarios(prev => prev.filter(f => f.id !== id));
  };

  const handleSaveFuncionario = (funcionarioData: any) => {
    if (editingFuncionario) {
      // Editar funcionário existente
      setFuncionarios(prev => 
        prev.map(f => f.id === editingFuncionario.id ? funcionarioData : f)
      );
    } else {
      // Adicionar novo funcionário
      setFuncionarios(prev => [...prev, funcionarioData]);
    }
    setShowFuncionarioModal(false);
    setEditingFuncionario(null);
  };

  const FuncionarioCard = ({ funcionario }: { funcionario: Funcionario }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{funcionario.nome}</h3>
              <p className="text-sm text-gray-600">{funcionario.cargo}</p>
              <p className="text-xs text-gray-500">{funcionario.departamento}</p>
            </div>
          </div>
          <Badge className={getStatusColor(funcionario.status)}>
            {getStatusText(funcionario.status)}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400" />
            <span>{funcionario.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-gray-400" />
            <span>{funcionario.telefone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-gray-400" />
            <span>R$ {funcionario.salario.toLocaleString('pt-BR')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span>Admitido em {format(funcionario.dataAdmissao, 'MM/yyyy', { locale: ptBR })}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t mt-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{funcionario.cargaHoraria}h/semana</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEditFuncionario(funcionario)}
            >
              <Edit className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleDeleteFuncionario(funcionario.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const FuncionariosTable = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Lista de Funcionários
        </CardTitle>
        <CardDescription>
          Gerencie todos os funcionários da empresa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar funcionários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
              <SelectItem value="ferias">Férias</SelectItem>
              <SelectItem value="licenca">Licença</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterDepartamento} onValueChange={setFilterDepartamento}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Departamento" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {departamentos.map(dept => (
                <SelectItem key={dept} value={dept}>{dept}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Salário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredFuncionarios.map((funcionario) => (
              <TableRow key={funcionario.id}>
                <TableCell className="font-medium">{funcionario.nome}</TableCell>
                <TableCell>{funcionario.cargo}</TableCell>
                <TableCell>{funcionario.departamento}</TableCell>
                <TableCell>R$ {funcionario.salario.toLocaleString('pt-BR')}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(funcionario.status)}>
                    {getStatusText(funcionario.status)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {format(funcionario.dataAdmissao, 'dd/MM/yyyy', { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditFuncionario(funcionario)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteFuncionario(funcionario.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  const PayrollCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Folha de Pagamento
        </CardTitle>
        <CardDescription>
          Controle de salários e benefícios
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {payrollData.map((payroll) => {
            const funcionario = funcionarios.find(f => f.id === payroll.funcionarioId);
            return (
              <div key={payroll.funcionarioId} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium">{funcionario?.nome}</h4>
                    <p className="text-sm text-gray-600">{funcionario?.cargo}</p>
                  </div>
                  <Badge 
                    className={
                      payroll.status === 'pago' ? 'text-green-600 bg-green-100' :
                      payroll.status === 'pendente' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }
                  >
                    {payroll.status === 'pago' ? 'Pago' :
                     payroll.status === 'pendente' ? 'Pendente' : 'Atrasado'}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Salário Base</p>
                    <p className="font-medium">R$ {payroll.salario.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Benefícios</p>
                    <p className="font-medium text-green-600">+R$ {payroll.beneficios.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Descontos</p>
                    <p className="font-medium text-red-600">-R$ {payroll.descontos.toLocaleString('pt-BR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Líquido</p>
                    <p className="font-medium text-blue-600">R$ {payroll.salarioLiquido.toLocaleString('pt-BR')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  const StatsCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Funcionários</p>
              <p className="text-2xl font-bold">{totalFuncionarios}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-green-600">{funcionariosAtivos}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Férias</p>
              <p className="text-2xl font-bold text-blue-600">{funcionariosFerias}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Folha Total</p>
              <p className="text-2xl font-bold text-orange-600">
                R$ {folhaPagamento.toLocaleString('pt-BR')}
              </p>
            </div>
            <DollarSign className="h-8 w-8 text-orange-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-muted/30 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Funcionários</h1>
          <p className="text-gray-600 mt-2">Gestão completa de funcionários e folha de pagamento</p>
        </div>
        <Button 
          className="bg-orange-500 hover:bg-orange-600 text-white"
          onClick={handleNewFuncionario}
        >
          <Plus className="h-4 w-4 mr-2" />
          Novo Funcionário
        </Button>
      </div>

      {/* Estatísticas */}
      <StatsCards />

      {/* Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
          <TabsTrigger value="payroll">Folha de Pagamento</TabsTrigger>
          <TabsTrigger value="beneficios">Benefícios</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="funcionarios" className="space-y-6">
          <FuncionariosTable />
        </TabsContent>

        <TabsContent value="payroll" className="space-y-6">
          <PayrollCard />
        </TabsContent>

        <TabsContent value="beneficios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Benefícios e Descontos</CardTitle>
              <CardDescription>
                Gestão de benefícios oferecidos aos funcionários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Módulo de benefícios em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios de RH</CardTitle>
              <CardDescription>
                Relatórios e análises de recursos humanos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Módulo de relatórios em desenvolvimento</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Funcionário */}
      <FuncionarioModal
        isOpen={showFuncionarioModal}
        onClose={() => {
          setShowFuncionarioModal(false);
          setEditingFuncionario(null);
        }}
        onSave={handleSaveFuncionario}
        funcionario={editingFuncionario}
      />
    </div>
  );
};

export default Funcionarios;
