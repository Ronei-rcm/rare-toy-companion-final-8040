# 💳 Funcionalidade: Pagar Conta

**Data de Implementação:** Janeiro 2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado

---

## 📋 Visão Geral

Funcionalidade completa para pagamento de contas/transações financeiras com integração ao sistema de contas bancárias. Permite dar baixa em transações pendentes ou atrasadas, escolhendo de qual conta bancária o dinheiro será debitado (para saídas) ou creditado (para entradas).

---

## ✨ Funcionalidades Implementadas

### 1. Modal de Pagamento
- **Componente:** `PayBillModal.tsx`
- **Localização:** `src/components/admin/PayBillModal.tsx`
- Interface intuitiva com:
  - Seleção de conta bancária ativa
  - Exibição de saldo disponível
  - Validação de saldo insuficiente
  - Data de pagamento customizável
  - Campo de observações
  - Resumo visual do pagamento

### 2. Integração na Página Financeiro
- Botão "Pagar" (ícone Wallet) nas transações pendentes/atrasadas
- Integração completa com a tabela de transações
- Atualização automática após pagamento

### 3. Endpoint Backend
- **Rota:** `POST /api/financial/transactions/:id/pay`
- Processamento atômico (transação do banco de dados)
- Atualização de status da transação
- Atualização de saldo da conta bancária
- Registro de histórico de pagamento

---

## 🔧 Arquitetura Técnica

### Frontend

#### Componente PayBillModal
```typescript
interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    id: number;
    descricao: string;
    categoria: string;
    tipo: 'entrada' | 'saida';
    valor: number;
    status: string;
    data: string;
  } | null;
  onSuccess: () => void;
}
```

**Características:**
- Carrega automaticamente contas bancárias ativas ao abrir
- Valida saldo antes de permitir pagamento
- Mostra saldo disponível em tempo real
- Calcula saldo após pagamento
- Interface responsiva e acessível

#### Integração na Página Financeiro
- Botão de pagar aparece apenas para transações pendentes/atrasadas
- Modal abre com transação selecionada
- Atualização automática da lista após pagamento bem-sucedido

### Backend

#### Endpoint de Pagamento
```javascript
POST /api/financial/transactions/:id/pay
```

**Parâmetros:**
```json
{
  "account_id": number,        // ID da conta bancária
  "data_pagamento": string,    // Data no formato YYYY-MM-DD (opcional)
  "observacoes": string        // Observações adicionais (opcional)
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "message": "Pagamento processado com sucesso",
  "transaction": {
    "id": 123,
    "status": "Pago",
    "data": "2025-01-15"
  },
  "account": {
    "id": 1,
    "nome": "Conta Principal",
    "novo_saldo": 8500.00
  }
}
```

**Validações:**
- Transação deve existir
- Transação não pode estar já paga
- Conta bancária deve existir e estar ativa
- Para saídas, verifica saldo suficiente (incluindo limite)

**Processamento:**
1. Inicia transação do banco de dados
2. Atualiza status da transação para "Pago"
3. Atualiza data e método de pagamento
4. Adiciona observação sobre pagamento
5. Atualiza saldo da conta bancária:
   - **Saída:** debita valor
   - **Entrada:** credita valor
6. Registra histórico (se tabela existir)
7. Confirma transação

---

## 🎯 Fluxo de Uso

### 1. Usuário vê transação pendente
- Na tabela de transações, transações pendentes/atrasadas mostram botão de pagar (ícone Wallet)

### 2. Clicar em "Pagar"
- Modal abre com:
  - Detalhes da transação
  - Lista de contas bancárias ativas
  - Formulário de pagamento

### 3. Selecionar conta bancária
- Dropdown mostra todas as contas ativas
- Exibe saldo atual de cada conta
- Mostra saldo disponível (saldo + limite)

### 4. Configurar pagamento
- Data do pagamento (padrão: hoje)
- Observações opcionais
- Visualização do resumo:
  - Valor a pagar/receber
  - Conta selecionada
  - Saldo após pagamento

### 5. Confirmar pagamento
- Sistema valida saldo (para saídas)
- Processa pagamento atomicamente
- Atualiza status da transação
- Atualiza saldo da conta
- Fecha modal e atualiza lista

---

## 🔒 Validações e Segurança

### Validações Frontend
- ✅ Conta bancária obrigatória
- ✅ Validação de saldo insuficiente
- ✅ Data de pagamento válida
- ✅ Botão desabilitado durante processamento

### Validações Backend
- ✅ Transação existe
- ✅ Transação não está paga
- ✅ Conta bancária existe e está ativa
- ✅ Saldo suficiente (para saídas)
- ✅ Transação atômica (rollback em caso de erro)

---

## 📊 Estrutura de Dados

### Transação Financeira
- Status atualizado para "Pago"
- Data atualizada para data de pagamento
- Método de pagamento: "Conta: [Nome] ([Banco])"
- Observações incluem histórico de pagamento

### Conta Bancária
- Saldo atualizado:
  - Saída: `saldo = saldo - valor`
  - Entrada: `saldo = saldo + valor`
- Última movimentação atualizada

### Histórico de Pagamento (Opcional)
Se a tabela `financial_payments` existir:
- `transaction_id`: ID da transação
- `account_id`: ID da conta usada
- `valor`: Valor do pagamento
- `data_pagamento`: Data do pagamento
- `tipo`: Tipo da transação (entrada/saida)
- `observacoes`: Observações adicionais

---

## 🎨 Interface do Usuário

### Modal de Pagamento

**Header:**
- Ícone de check verde
- Título "Pagar Conta"
- Descrição explicativa

**Seções:**
1. **Detalhes da Conta**
   - Descrição, categoria, tipo, valor
   - Visualização clara dos dados

2. **Seleção de Conta Bancária**
   - Dropdown com contas ativas
   - Exibição de saldo em cada item
   - Informações da conta selecionada:
     - Saldo atual
     - Limite disponível
     - Saldo disponível total
     - Aviso de saldo insuficiente (se aplicável)

3. **Data do Pagamento**
   - Campo de data (padrão: hoje)
   - Validação de formato

4. **Observações**
   - Campo de texto opcional
   - Adiciona contexto ao pagamento

5. **Resumo do Pagamento**
   - Valor do pagamento
   - Conta selecionada
   - Saldo após pagamento (em destaque)

**Footer:**
- Botão "Cancelar"
- Botão "Confirmar Pagamento" (verde)
- Estado de loading durante processamento

### Botão na Tabela
- Ícone Wallet
- Aparece apenas em transações pendentes/atrasadas
- Hover effect verde
- Tooltip "Pagar conta"

---

## 🔄 Integrações

### Contas Bancárias
- Usa endpoint `/api/financial/contas`
- Filtra apenas contas ativas
- Carrega saldo em tempo real

### Transações Financeiras
- Usa endpoint `/api/financial/transactions/:id/pay`
- Atualiza status e dados
- Recarrega lista após pagamento

### Sincronização
- Atualização automática de saldos
- Histórico preservado em observações
- Rastreabilidade completa

---

## 🚀 Melhorias Futuras

- [ ] Pagamento parcial de contas
- [ ] Agendamento de pagamentos futuros
- [ ] Pagamento múltiplo (selecionar várias contas)
- [ ] Notificações de pagamento
- [ ] Relatório de pagamentos por conta
- [ ] Integração com conciliação bancária
- [ ] Exportação de comprovantes
- [ ] Histórico detalhado de pagamentos

---

## 📝 Notas Técnicas

### Performance
- Carregamento assíncrono de contas
- Validação client-side antes de enviar
- Processamento atômico no backend
- Atualização otimizada da UI

### Acessibilidade
- Labels descritivos
- ARIA labels apropriados
- Navegação por teclado
- Feedback visual claro

### Responsividade
- Modal adaptável
- Layout flexível
- Funciona em mobile

---

## ✅ Checklist de Implementação

- [x] Criar componente PayBillModal
- [x] Integrar na página Financeiro
- [x] Adicionar botão de pagar na tabela
- [x] Criar endpoint de pagamento
- [x] Implementar validações
- [x] Atualização de saldo
- [x] Histórico de pagamento
- [x] Tratamento de erros
- [x] Feedback ao usuário
- [x] Documentação

---

**Última atualização:** Janeiro 2025  
**Mantido por:** Equipe de Desenvolvimento  
**Versão:** 1.0.0

