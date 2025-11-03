# 📋 Módulo de Gestão de Funcionários (RH)

## Visão Geral

O módulo de Funcionários é um sistema completo de gestão de recursos humanos integrado ao sistema financeiro da Muhlstore. Oferece controle total sobre funcionários, folha de pagamento, benefícios e relatórios de RH.

## 🚀 Funcionalidades Principais

### 👥 **Gestão de Funcionários**

#### **Cadastro Completo**
- **Dados Pessoais**: Nome, email, telefone, CPF, RG, data de nascimento
- **Endereço**: Rua, número, bairro, cidade, CEP, estado
- **Dados Profissionais**: Cargo, departamento, salário, carga horária
- **Informações Contratuais**: Tipo de contrato (CLT, PJ, Estágio, Temporário)
- **Status**: Ativo, inativo, férias, licença
- **Data de Admissão**: Controle de tempo de empresa

#### **Interface de Cadastro**
- **Modal com 4 Abas**:
  1. **Dados Pessoais** - Informações básicas e contato
  2. **Endereço** - Endereço completo com validação de CEP
  3. **Profissional** - Cargo, departamento, salário e contrato
  4. **Benefícios** - Seleção de benefícios oferecidos

#### **Validações Automáticas**
- **CPF**: Formatação automática (000.000.000-00)
- **Telefone**: Formatação automática ((11) 99999-9999)
- **CEP**: Formatação automática (00000-000)
- **Campos Obrigatórios**: Validação em tempo real
- **Email**: Validação de formato

### 💰 **Sistema de Folha de Pagamento**

#### **Controle de Salários**
- **Salário Base**: Valor fixo mensal
- **Benefícios**: Valor adicional por benefício
- **Descontos**: Impostos e outros descontos
- **Horas Extras**: Cálculo adicional por horas trabalhadas
- **Salário Líquido**: Cálculo automático final

#### **Status de Pagamento**
- **Pago**: Pagamento realizado
- **Pendente**: Aguardando pagamento
- **Atrasado**: Pagamento em atraso

#### **Histórico Completo**
- **Por Funcionário**: Histórico individual de pagamentos
- **Por Mês**: Controle mensal da folha
- **Detalhamento**: Breakdown completo de valores

### 🎁 **Sistema de Benefícios**

#### **Benefícios Disponíveis**
1. **Vale Refeição** - R$ 600,00
2. **Vale Transporte** - R$ 200,00
3. **Plano de Saúde** - R$ 300,00
4. **Plano Odontológico** - R$ 150,00
5. **Gympass** - R$ 100,00
6. **Vale Alimentação** - R$ 400,00
7. **Seguro de Vida** - R$ 50,00
8. **Participação nos Lucros** - Variável
9. **Auxílio Creche** - R$ 300,00
10. **Vale Cultura** - R$ 100,00

#### **Configuração Individual**
- **Por Funcionário**: Cada funcionário pode ter benefícios diferentes
- **Cálculo Automático**: Valor total calculado automaticamente
- **Relatório de Custos**: Impacto financeiro dos benefícios

### 📊 **Dashboard e Estatísticas**

#### **Métricas em Tempo Real**
- **Total de Funcionários**: Contagem geral
- **Funcionários Ativos**: Em atividade
- **Funcionários em Férias**: Em período de férias
- **Folha Total**: Valor total da folha de pagamento

#### **Indicadores Avançados**
- **Média Salarial**: Cálculo automático
- **Departamento com Mais Funcionários**: Ranking
- **Funcionário com Maior Salário**: Identificação
- **Custo por Departamento**: Breakdown financeiro

### 🔍 **Filtros e Busca**

#### **Filtros Disponíveis**
- **Status**: Todos, Ativo, Inativo, Férias, Licença
- **Departamento**: Vendas, TI, Marketing, Financeiro, etc.
- **Busca**: Por nome, email, cargo

#### **Resultados**
- **Lista Filtrada**: Exibição dinâmica
- **Contadores**: Número de resultados
- **Ações Rápidas**: Editar/Excluir diretamente da lista

## 🔗 **Integração com Módulo Financeiro**

### **Exportação Automática**
- **Folha de Pagamento**: Dados exportados automaticamente
- **Benefícios**: Custos calculados e integrados
- **Relatórios**: Dados estruturados para análise

### **Funções de Integração**
```typescript
// Hook principal
useFuncionariosData()

// Funções de exportação
getFolhaPagamentoParaFinanceiro()
getBeneficiosParaFinanceiro()
getRelatorioFinanceiro()
```

### **Dados Exportados**
- **Folha Total**: Valor consolidado
- **Custos por Departamento**: Breakdown
- **Funcionários por Setor**: Distribuição
- **Benefícios**: Impacto financeiro

## 📋 **Estrutura de Dados**

### **Interface Funcionario**
```typescript
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
```

### **Interface PayrollData**
```typescript
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
```

## 🎯 **Como Usar**

### **1. Acessar o Módulo**
- Faça login no painel administrativo
- Clique em "Funcionários" no menu lateral

### **2. Cadastrar Novo Funcionário**
- Clique em "Novo Funcionário"
- Preencha as 4 abas do modal:
  - **Dados Pessoais**: Nome, email, telefone, CPF, RG
  - **Endereço**: Endereço completo
  - **Profissional**: Cargo, departamento, salário
  - **Benefícios**: Selecione os benefícios oferecidos
- Clique em "Salvar"

### **3. Gerenciar Funcionários**
- Use filtros para encontrar funcionários
- Clique em "Editar" para modificar dados
- Clique em "Excluir" para remover funcionário
- Visualize estatísticas no dashboard

### **4. Folha de Pagamento**
- Acesse a aba "Folha de Pagamento"
- Visualize salários e benefícios
- Acompanhe status de pagamento
- Veja histórico por funcionário

### **5. Benefícios**
- Acesse a aba "Benefícios"
- Configure benefícios por funcionário
- Visualize custos totais
- Gerencie ofertas de benefícios

## 📊 **Relatórios Disponíveis**

### **Relatórios de RH**
- **Funcionários por Departamento**: Distribuição
- **Custos por Setor**: Breakdown financeiro
- **Benefícios**: Impacto total
- **Tempo de Empresa**: Análise de retenção

### **Relatórios Financeiros**
- **Folha de Pagamento**: Exportação para financeiro
- **Custos de Benefícios**: Impacto no orçamento
- **Projeções**: Baseadas em dados históricos

## 🔧 **Configurações**

### **Departamentos Padrão**
- Vendas
- TI
- Marketing
- Recursos Humanos
- Financeiro
- Operacional
- Atendimento
- Administrativo

### **Cargos Disponíveis**
- Gerente
- Coordenador
- Supervisor
- Analista
- Assistente
- Vendedor
- Desenvolvedor
- Designer
- Contador
- Auxiliar

### **Estados Brasileiros**
- Todos os 27 estados e DF disponíveis
- Validação automática de CEP

## 🚀 **Próximas Funcionalidades**

### **Em Desenvolvimento**
- **Controle de Ponto**: Registro de entrada e saída
- **Sistema de Férias**: Solicitação e aprovação
- **Avaliação de Performance**: Sistema de metas
- **Treinamentos**: Gestão de capacitações
- **Documentos**: Upload e gestão de documentos

### **Integrações Futuras**
- **API de CEP**: Busca automática de endereço
- **API de CPF**: Validação automática
- **Sistema de Assinatura**: Documentos digitais
- **Notificações**: Alertas por email/SMS

## 📚 **Arquivos Principais**

### **Componentes**
- `src/pages/admin/Funcionarios.tsx` - Página principal
- `src/components/admin/FuncionarioModal.tsx` - Modal de cadastro
- `src/hooks/useFuncionariosData.ts` - Hook de dados

### **Tipos**
- Interfaces TypeScript para funcionários
- Interfaces para folha de pagamento
- Interfaces para benefícios

### **Integração**
- Hook `useFuncionariosData` para dados
- Funções de exportação para financeiro
- Relatórios estruturados

## 🔒 **Segurança**

### **Validações**
- **CPF**: Formato e validação
- **Email**: Formato válido
- **Telefone**: Formato brasileiro
- **CEP**: Formato e validação

### **Privacidade**
- **Dados Sensíveis**: Proteção de informações pessoais
- **Acesso Restrito**: Apenas administradores
- **Auditoria**: Log de alterações

## 📞 **Suporte**

Para dúvidas sobre o módulo de Funcionários:
- Consulte esta documentação
- Verifique os logs do sistema
- Entre em contato com o suporte técnico

---

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Status**: ✅ Produção
