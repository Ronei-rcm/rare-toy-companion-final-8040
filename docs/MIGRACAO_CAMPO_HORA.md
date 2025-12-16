# 📋 Migração: Adicionar Campo Hora na Tabela Financial Transactions

**Data:** Janeiro 2025  
**Status:** ⚠️ Pendente de Execução

---

## 🎯 Objetivo

Adicionar o campo `hora` na tabela `financial_transactions` para armazenar a hora das transações importadas do CSV InfinitePay.

---

## 📊 Estrutura do CSV

O CSV do InfinitePay possui os seguintes campos:

1. **Data** (DD/MM/YYYY) → `data` (DATE)
2. **Hora** (HH:MM:SS) → `hora` (TIME) ⭐ **NOVO**
3. **Tipo de transação** (ex: "Pix") → `metodo_pagamento` (VARCHAR)
4. **Nome** (ex: "Pix Beatriz da Silva") → `origem` (VARCHAR)
5. **Detalhe** (ex: "Enviado", "Recebido") → usado para `tipo` + `observacoes`
6. **Valor (R$)** (ex: "-R$ 394,00") → `valor` (DECIMAL)

---

## 🔧 Script de Migração

### Arquivo: `scripts/add-hora-to-financial-transactions.cjs`

O script:
- ✅ Verifica se a coluna já existe
- ✅ Adiciona a coluna `hora` do tipo `TIME`
- ✅ Cria índice para melhorar performance
- ✅ Posiciona a coluna após `data`

### Como Executar

```bash
# Opção 1: Via Node.js direto
node scripts/add-hora-to-financial-transactions.cjs

# Opção 2: Via MySQL direto
mysql -u root -p rare_toy_companion < scripts/add-hora-to-financial-transactions.sql
```

### SQL Manual (Alternativa)

Se preferir executar manualmente:

```sql
-- Verificar se a coluna já existe
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rare_toy_companion' 
  AND TABLE_NAME = 'financial_transactions' 
  AND COLUMN_NAME = 'hora';

-- Adicionar coluna hora (se não existir)
ALTER TABLE financial_transactions 
ADD COLUMN hora TIME NULL 
COMMENT 'Hora da transação (formato HH:MM:SS)'
AFTER data;

-- Criar índice para melhorar performance
CREATE INDEX idx_data_hora ON financial_transactions(data, hora);
```

---

## ✅ Alterações Realizadas no Código

### 1. Backend (`server/server.cjs`)

#### GET `/api/financial/transactions`
- ✅ Adicionado campo `hora` no SELECT
- ✅ Ordenação atualizada: `ORDER BY data DESC, hora DESC, created_at DESC`

#### POST `/api/financial/transactions`
- ✅ Adicionado campo `hora` no INSERT
- ✅ Aceita `hora` do body da requisição

#### PUT `/api/financial/transactions`
- ✅ Adicionado campo `hora` no UPDATE
- ✅ Aceita `hora` do body da requisição

#### POST `/api/financial/bank-statements/import`
- ✅ Adicionado campo `hora` no INSERT
- ✅ Usa `trans.hora` do CSV parseado

### 2. Frontend

#### Interface TypeScript
- ✅ `Transacao` interface atualizada com `hora?: string | null`
- ✅ Aplicado em:
  - `src/pages/admin/Financeiro.tsx`
  - `src/components/admin/BankReconciliationManager.tsx`

#### Exibição na Tabela
- ✅ Hora exibida ao lado da data quando disponível
- ✅ Formato: `DD/MM/YYYY HH:MM:SS`

#### Modal de Edição
- ✅ `SimpleTransactionModal.tsx` atualizado:
  - Campo `hora` adicionado ao formData
  - Input `type="time"` para seleção de hora
  - Hora salva junto com a transação

### 3. Importação CSV

#### `ImportBankStatementModal.tsx`
- ✅ Já estava parseando o campo `hora` do CSV
- ✅ Agora salva no banco de dados
- ✅ Preserva hora nas observações

---

## 📝 Mapeamento Completo CSV → MySQL

| Campo CSV | Tipo CSV | Campo MySQL | Tipo MySQL | Observações |
|-----------|----------|-------------|------------|-------------|
| Data | DD/MM/YYYY | `data` | DATE | Obrigatório |
| Hora | HH:MM:SS | `hora` | TIME | Opcional (novo) |
| Tipo de transação | String | `metodo_pagamento` | VARCHAR(50) | Ex: "Pix", "Depósito de vendas" |
| Nome | String | `origem` | VARCHAR(255) | Nome do remetente/destinatário |
| Detalhe | String | `tipo` + `observacoes` | ENUM + TEXT | "Recebido" = entrada, "Enviado" = saída |
| Valor (R$) | Decimal | `valor` | DECIMAL(10,2) | Com sinal + ou - |

---

## 🎯 Exemplo de Dados

### CSV Original
```csv
Data,Hora,Tipo de transação,Nome,Detalhe,Valor (R$)
15/12/2025,16:09:56,Pix,Pix Beatriz da Silva Manoel,Enviado,"-R$ 394,00"
12/12/2025,21:16:32,Pix,Pix JHULIE RAMOS,Recebido,"+R$ 80,00"
```

### Dados no MySQL
```sql
INSERT INTO financial_transactions (
  data, hora, descricao, categoria, tipo, valor, status,
  metodo_pagamento, origem, observacoes
) VALUES (
  '2025-12-15', '16:09:56', 'Pix Beatriz da Silva Manoel - Enviado', 
  'Transferência', 'saida', 394.00, 'Pago',
  'Pix', 'Pix Beatriz da Silva Manoel', 
  'Hora: 16:09:56 | Tipo: Pix | Nome: Pix Beatriz da Silva Manoel | Detalhe: Enviado | Valor original: -R$ 394,00'
);
```

---

## ⚠️ Importante

### Antes de Executar a Migração

1. **Backup do Banco de Dados**
   ```bash
   mysqldump -u root -p rare_toy_companion > backup_antes_hora.sql
   ```

2. **Verificar Estrutura Atual**
   ```sql
   DESCRIBE financial_transactions;
   ```

3. **Executar Migração**
   ```bash
   node scripts/add-hora-to-financial-transactions.cjs
   ```

### Após a Migração

1. **Verificar Coluna Adicionada**
   ```sql
   DESCRIBE financial_transactions;
   -- Deve mostrar a coluna 'hora' do tipo TIME
   ```

2. **Testar Importação**
   - Importar um CSV do InfinitePay
   - Verificar se a hora está sendo salva
   - Verificar se a hora aparece na tabela

---

## 🔍 Verificação

### Query para Verificar Transações com Hora

```sql
SELECT 
  id,
  data,
  hora,
  descricao,
  valor,
  tipo
FROM financial_transactions
WHERE hora IS NOT NULL
ORDER BY data DESC, hora DESC
LIMIT 10;
```

### Query para Estatísticas

```sql
SELECT 
  COUNT(*) as total_transacoes,
  COUNT(hora) as transacoes_com_hora,
  COUNT(*) - COUNT(hora) as transacoes_sem_hora
FROM financial_transactions;
```

---

## 🚀 Próximos Passos

Após executar a migração:

1. ✅ Testar importação de CSV
2. ✅ Verificar se hora aparece na interface
3. ✅ Testar edição de transação com hora
4. ✅ Verificar filtros e ordenação por hora

---

**Última Atualização:** Janeiro 2025  
**Versão:** 1.0.0
