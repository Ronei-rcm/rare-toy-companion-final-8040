# Sistema de Transações Recorrentes - Documentação

## 📋 Resumo da Implementação

Sistema completo de gestão de transações financeiras recorrentes, incluindo agendamento, processamento automático, notificações e projeção de fluxo de caixa.

## ✅ Funcionalidades Implementadas

### 1. Estrutura de Banco de Dados
- ✅ Tabela `recurring_transactions` - Armazena configurações de recorrências
- ✅ Tabela `recurring_transaction_occurrences` - Registra cada ocorrência processada
- ✅ Tabela `recurring_transaction_notifications` - Histórico de notificações enviadas

### 2. Backend API (REST)
Endpoints implementados:
- `GET /api/financial/recurring` - Listar todas as recorrências
- `GET /api/financial/recurring/:id` - Buscar recorrência específica
- `POST /api/financial/recurring` - Criar nova recorrência
- `PUT /api/financial/recurring/:id` - Atualizar recorrência
- `DELETE /api/financial/recurring/:id` - Excluir recorrência
- `POST /api/financial/recurring/process` - Processar recorrências pendentes manualmente
- `POST /api/financial/recurring/notify` - Enviar notificações de recorrências próximas
- `GET /api/financial/recurring/:id/occurrences` - Listar ocorrências de uma recorrência

### 3. Frontend - Componente de Gestão
**RecurringTransactionsManager.tsx**
- Interface completa para CRUD de recorrências
- Filtros por status (ativo/inativo)
- Cards de estatísticas (total, ativas, pendentes)
- Modal para criar/editar recorrências
- Processamento manual de recorrências pendentes
- Botão para enviar notificações

### 4. Processamento Automático
**Script: `scripts/process-recurring-transactions.cjs`**
- Processa recorrências automaticamente
- Cria transações financeiras quando a data de ocorrência chega
- Atualiza próxima ocorrência automaticamente
- Registra ocorrências e erros

**Como usar (cron):**
```bash
# Executar todo dia às 6h
0 6 * * * cd /caminho/do/projeto && node scripts/process-recurring-transactions.cjs
```

### 5. Sistema de Notificações
**Script: `scripts/notify-recurring-transactions.cjs`**
- Envia e-mails de lembrete antes do vencimento
- Configurável por recorrência (`notify_days_before`, `notify_email`)
- Evita duplicação de notificações
- Templates HTML profissionais

**Como usar (cron):**
```bash
# Executar todo dia às 8h
0 8 * * * cd /caminho/do/projeto && node scripts/notify-recurring-transactions.cjs
```

### 6. Projeção de Fluxo de Caixa
**Componente: `CashFlowProjection.tsx`**
- Visualização de projeções futuras (3, 6, 12 ou 24 meses)
- Agrupamento mensal com totais
- Resumo geral (entradas, saídas, saldo)
- Detalhamento completo de todas as transações projetadas
- Cálculo automático baseado em recorrências ativas

## 🎯 Tipos de Frequência Suportadas
- **Diária** - Repetição diária
- **Semanal** - Repetição semanal (configurável dia da semana)
- **Quinzenal** - A cada 15 dias
- **Mensal** - Mensal (configurável dia do mês)
- **Trimestral** - A cada 3 meses
- **Semestral** - A cada 6 meses
- **Anual** - Anualmente

## 📧 Sistema de Notificações

### Configuração
Ao criar/editar uma recorrência:
- `notify_email`: E-mail para receber notificações
- `notify_days_before`: Quantos dias antes do vencimento notificar

### Template de E-mail
- Design profissional e responsivo
- Informações completas da transação
- Indicador visual de tipo (entrada/saída)
- Data formatada em português

## 🚀 Como Usar

### Criar uma Recorrência
1. Acesse `/admin/financeiro`
2. Clique na aba "Recorrências"
3. Clique em "Nova Recorrência"
4. Preencha os dados:
   - Descrição, categoria, tipo (entrada/saída)
   - Valor, status, método de pagamento
   - Frequência e data de início
   - (Opcional) Configurar notificações
5. Salve

### Processar Manualmente
- Use o botão "Processar (X)" para criar transações pendentes imediatamente

### Enviar Notificações
- Use o botão "Enviar Notificações" para processar e enviar lembretes

### Ver Projeções
1. Acesse a aba "Projeção"
2. Selecione o período desejado (3, 6, 12 ou 24 meses)
3. Visualize resumos mensais e detalhamento completo

## 📊 Estrutura de Dados

### RecurringTransaction
```typescript
{
  id: string;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'semiannual' | 'yearly';
  start_date: string;
  end_date?: string;
  next_occurrence: string;
  day_of_month?: number;
  day_of_week?: number;
  notify_days_before: number;
  notify_email?: string;
  is_active: boolean;
  auto_create: boolean;
  occurrences_count: number;
  max_occurrences?: number;
}
```

## 🔧 Manutenção

### Verificar Status
```sql
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as ativas,
  SUM(CASE WHEN next_occurrence <= CURDATE() THEN 1 ELSE 0 END) as pendentes
FROM recurring_transactions;
```

### Ver Últimas Ocorrências Processadas
```sql
SELECT * FROM recurring_transaction_occurrences 
ORDER BY created_at DESC 
LIMIT 10;
```

### Ver Notificações Enviadas
```sql
SELECT * FROM recurring_transaction_notifications 
ORDER BY sent_at DESC 
LIMIT 10;
```

## 🎨 Interface

### Abas no Financeiro
- **Transações**: Lista de transações normais
- **Recorrências**: Gestão de transações recorrentes
- **Projeção**: Visualização de fluxo de caixa futuro
- **Dashboard**: Dashboard financeiro
- Outras abas existentes...

## 🔐 Segurança
- Todas as rotas protegidas com `authenticateAdmin`
- Validação de dados no backend
- Sanitização de inputs
- Queries parametrizadas (prevenção SQL injection)

## 📝 Notas Técnicas
- O sistema verifica automaticamente se a tabela existe e cria se necessário
- Conexões do pool são gerenciadas corretamente
- Logs detalhados para debugging
- Tratamento robusto de erros

## 🎉 Status
✅ **PRONTO PARA PRODUÇÃO**

Todas as funcionalidades foram implementadas e testadas com sucesso!

