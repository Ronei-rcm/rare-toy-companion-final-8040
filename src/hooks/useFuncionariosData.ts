import { useState, useEffect } from 'react';

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
  funcionarioNome: string;
  mes: string;
  salario: number;
  beneficios: number;
  descontos: number;
  horasExtras: number;
  salarioLiquido: number;
  status: 'pendente' | 'pago' | 'atrasado';
  dataVencimento: Date;
  dataPagamento?: Date;
}

interface FuncionarioSummary {
  totalFuncionarios: number;
  funcionariosAtivos: number;
  funcionariosFerias: number;
  funcionariosLicenca: number;
  totalSalarios: number;
  folhaPagamento: number;
  mediaSalarial: number;
  departamentoComMaisFuncionarios: string;
  funcionarioComMaiorSalario: string;
}

interface BeneficioData {
  nome: string;
  valor: number;
  tipo: 'monetario' | 'nao_monetario';
  funcionarios: number;
}

export const useFuncionariosData = () => {
  const [loading, setLoading] = useState(true);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [summary, setSummary] = useState<FuncionarioSummary | null>(null);
  const [beneficios, setBeneficios] = useState<BeneficioData[]>([]);

  // Dados simulados para demonstração
  const generateMockData = () => {
    const mockFuncionarios: Funcionario[] = [
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
        observacoes: 'Funcionário exemplar'
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
        observacoes: 'Especialista em React'
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
        observacoes: 'Em período de férias'
      },
      {
        id: '4',
        nome: 'Ana Oliveira',
        email: 'ana.oliveira@muhlstore.com',
        telefone: '(11) 66666-6666',
        cpf: '789.123.456-00',
        rg: '78.912.345-6',
        endereco: {
          rua: 'Rua Oscar Freire',
          numero: '321',
          bairro: 'Jardins',
          cidade: 'São Paulo',
          cep: '01426-001',
          estado: 'SP'
        },
        cargo: 'Designer',
        departamento: 'Marketing',
        salario: 4500,
        dataAdmissao: new Date('2023-08-20'),
        dataNascimento: new Date('1988-03-12'),
        status: 'ativo',
        tipoContrato: 'clt',
        cargaHoraria: 40,
        beneficios: ['Vale Refeição', 'Vale Transporte', 'Plano de Saúde'],
        observacoes: 'Especialista em UI/UX'
      },
      {
        id: '5',
        nome: 'Carlos Pereira',
        email: 'carlos.pereira@muhlstore.com',
        telefone: '(11) 55555-5555',
        cpf: '321.654.987-00',
        rg: '32.165.498-7',
        endereco: {
          rua: 'Rua Consolação',
          numero: '654',
          bairro: 'Consolação',
          cidade: 'São Paulo',
          cep: '01302-000',
          estado: 'SP'
        },
        cargo: 'Contador',
        departamento: 'Financeiro',
        salario: 5500,
        dataAdmissao: new Date('2023-02-01'),
        dataNascimento: new Date('1982-11-25'),
        status: 'ativo',
        tipoContrato: 'clt',
        cargaHoraria: 40,
        beneficios: ['Vale Refeição', 'Vale Transporte', 'Plano de Saúde', 'Plano Odontológico'],
        observacoes: 'Responsável pela contabilidade'
      }
    ];

    const mockPayrollData: PayrollData[] = [
      {
        funcionarioId: '1',
        funcionarioNome: 'João Silva',
        mes: '2024-05',
        salario: 5000,
        beneficios: 800,
        descontos: 1200,
        horasExtras: 300,
        salarioLiquido: 4900,
        status: 'pago',
        dataVencimento: new Date('2024-05-05'),
        dataPagamento: new Date('2024-05-05')
      },
      {
        funcionarioId: '2',
        funcionarioNome: 'Maria Santos',
        mes: '2024-05',
        salario: 6000,
        beneficios: 1000,
        descontos: 1500,
        horasExtras: 400,
        salarioLiquido: 5900,
        status: 'pago',
        dataVencimento: new Date('2024-05-05'),
        dataPagamento: new Date('2024-05-05')
      },
      {
        funcionarioId: '3',
        funcionarioNome: 'Pedro Costa',
        mes: '2024-05',
        salario: 3000,
        beneficios: 400,
        descontos: 600,
        horasExtras: 0,
        salarioLiquido: 2800,
        status: 'pago',
        dataVencimento: new Date('2024-05-05'),
        dataPagamento: new Date('2024-05-05')
      },
      {
        funcionarioId: '4',
        funcionarioNome: 'Ana Oliveira',
        mes: '2024-05',
        salario: 4500,
        beneficios: 600,
        descontos: 900,
        horasExtras: 200,
        salarioLiquido: 4400,
        status: 'pago',
        dataVencimento: new Date('2024-05-05'),
        dataPagamento: new Date('2024-05-05')
      },
      {
        funcionarioId: '5',
        funcionarioNome: 'Carlos Pereira',
        mes: '2024-05',
        salario: 5500,
        beneficios: 800,
        descontos: 1100,
        horasExtras: 250,
        salarioLiquido: 5450,
        status: 'pago',
        dataVencimento: new Date('2024-05-05'),
        dataPagamento: new Date('2024-05-05')
      }
    ];

    // Calcular resumo
    const totalFuncionarios = mockFuncionarios.length;
    const funcionariosAtivos = mockFuncionarios.filter(f => f.status === 'ativo').length;
    const funcionariosFerias = mockFuncionarios.filter(f => f.status === 'ferias').length;
    const funcionariosLicenca = mockFuncionarios.filter(f => f.status === 'licenca').length;
    const totalSalarios = mockFuncionarios.reduce((sum, f) => sum + f.salario, 0);
    const folhaPagamento = mockPayrollData.reduce((sum, p) => sum + p.salarioLiquido, 0);
    const mediaSalarial = totalSalarios / totalFuncionarios;

    // Departamento com mais funcionários
    const departamentos = mockFuncionarios.reduce((acc, f) => {
      acc[f.departamento] = (acc[f.departamento] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const departamentoComMaisFuncionarios = Object.keys(departamentos).reduce((a, b) => 
      departamentos[a] > departamentos[b] ? a : b
    );

    // Funcionário com maior salário
    const funcionarioComMaiorSalario = mockFuncionarios.reduce((max, f) => 
      f.salario > max.salario ? f : max
    ).nome;

    const mockSummary: FuncionarioSummary = {
      totalFuncionarios,
      funcionariosAtivos,
      funcionariosFerias,
      funcionariosLicenca,
      totalSalarios,
      folhaPagamento,
      mediaSalarial,
      departamentoComMaisFuncionarios,
      funcionarioComMaiorSalario
    };

    const mockBeneficios: BeneficioData[] = [
      {
        nome: 'Vale Refeição',
        valor: 600,
        tipo: 'monetario',
        funcionarios: mockFuncionarios.filter(f => f.beneficios.includes('Vale Refeição')).length
      },
      {
        nome: 'Vale Transporte',
        valor: 200,
        tipo: 'monetario',
        funcionarios: mockFuncionarios.filter(f => f.beneficios.includes('Vale Transporte')).length
      },
      {
        nome: 'Plano de Saúde',
        valor: 300,
        tipo: 'monetario',
        funcionarios: mockFuncionarios.filter(f => f.beneficios.includes('Plano de Saúde')).length
      },
      {
        nome: 'Gympass',
        valor: 100,
        tipo: 'monetario',
        funcionarios: mockFuncionarios.filter(f => f.beneficios.includes('Gympass')).length
      }
    ];

    return {
      mockFuncionarios,
      mockPayrollData,
      mockSummary,
      mockBeneficios
    };
  };

  const refreshData = () => {
    setLoading(true);
    setTimeout(() => {
      const { mockFuncionarios, mockPayrollData, mockSummary, mockBeneficios } = generateMockData();
      
      setFuncionarios(mockFuncionarios);
      setPayrollData(mockPayrollData);
      setSummary(mockSummary);
      setBeneficios(mockBeneficios);
      setLoading(false);
    }, 1000);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Funções para integração com módulo financeiro
  const getFolhaPagamentoParaFinanceiro = () => {
    return {
      tipo: 'despesa',
      categoria: 'folha_pagamento',
      descricao: 'Folha de Pagamento - Funcionários',
      valor: summary?.folhaPagamento || 0,
      data: new Date(),
      origem: 'funcionarios',
      detalhes: payrollData.map(p => ({
        funcionario: p.funcionarioNome,
        salario: p.salario,
        beneficios: p.beneficios,
        descontos: p.descontos,
        liquido: p.salarioLiquido
      }))
    };
  };

  const getBeneficiosParaFinanceiro = () => {
    return beneficios.map(beneficio => ({
      tipo: 'despesa',
      categoria: 'beneficios',
      descricao: `Benefício: ${beneficio.nome}`,
      valor: beneficio.valor * beneficio.funcionarios,
      data: new Date(),
      origem: 'funcionarios',
      detalhes: {
        beneficio: beneficio.nome,
        funcionarios: beneficio.funcionarios,
        valorUnitario: beneficio.valor
      }
    }));
  };

  const getRelatorioFinanceiro = () => {
    return {
      resumo: summary,
      folhaPagamento: getFolhaPagamentoParaFinanceiro(),
      beneficios: getBeneficiosParaFinanceiro(),
      funcionariosPorDepartamento: funcionarios.reduce((acc, f) => {
        acc[f.departamento] = (acc[f.departamento] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      custoPorDepartamento: funcionarios.reduce((acc, f) => {
        acc[f.departamento] = (acc[f.departamento] || 0) + f.salario;
        return acc;
      }, {} as Record<string, number>)
    };
  };

  return {
    loading,
    funcionarios,
    payrollData,
    summary,
    beneficios,
    refreshData,
    getFolhaPagamentoParaFinanceiro,
    getBeneficiosParaFinanceiro,
    getRelatorioFinanceiro
  };
};
