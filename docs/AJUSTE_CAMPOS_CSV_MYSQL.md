# ✅ Ajuste de Campos CSV → MySQL

**Data:** Janeiro 2025  
**Status:** ✅ Implementado

---

## 🎯 Objetivo

Ajustar os campos do sistema financeiro para corresponder exatamente aos campos do CSV InfinitePay e armazená-los corretamente no MySQL.

---

## 📊 Mapeamento CSV → MySQL

### Campos do CSV InfinitePay

| # | Campo CSV | Formato | Campo MySQL | Tipo MySQL | Status |
|---|-----------|---------|-------------|------------|--------|
| 1 | **Data** | DD/MM/YYYY | `data` | DATE | ✅ Já existia |
| 2 | **Hora** | HH:MM:SS | `hora` | TIME | ✅ **NOVO** |
| 3 | **Tipo de transação** | String | `metodo_pagamento` | VARCHAR(50) | ✅ Já existia |
| 4 | **Nome** | String | `origem` | VARCHAR(255) | ✅ Já existia |
| 5 | **Detalhe** | String | `tipo` + `observacoes` | ENUM + TEXT | ✅ Já existia |
| 6 | **Valor (R$)** | Decimal | `valor` | DECIMAL(10,2) | ✅ Já existia |

---

## 🔧 Alterações Implementadas

### 1. **Estrutura do Banco de Dados**

#### Script de Migração Criado
- **Arquivo:** `scripts/add-hora-to-financial-transactions.cjs`
- **Função:** Adiciona coluna `hora` do tipo `TIME` na tabela `financial_transactions`

#### SQL da Migração
```sql
ALTER TABLE financial_transactions 
ADD COLUMN hora TIME NULL 
COMMENT 'Hora da transação (formato HH:MM:SS)'
AFTER data;

CREATE INDEX idx_data_hora ON financial_transactions(data, hora);
```

### 2. **Backend (API)**

#### GET `/api/financial/transactions`
```sql
SELECT 
  id, data, hora, descricao, categoria, origem, tipo, valor, 
  status, metodo_pagamento, observacoes, created_at, updated_at
FROM financial_transactions 
ORDER BY data DESC, hora DESC, created_at DESC
```

#### POST `/api/financial/transactions`
- ✅ Aceita campo `hora` no body
- ✅ Salva `hora` no banco de dados

#### PUT `/api/financial/transactions`
- ✅ Aceita campo `hora` no body
- ✅ Atualiza `hora` no banco de dados

#### POST `/api/financial/bank-statements/import`
- ✅ Usa `trans.hora` do CSV parseado
- ✅ Salva hora junto com a transação

### 3. **Frontend**

#### Interfaces TypeScript Atualizadas
```typescript
interface Transacao {
  id: number;
  descricao: string;
  categoria: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  status: 'Pago' | 'Pendente' | 'Atrasado';
  metodo_pagamento: string;
  data: string;
  hora?: string | null;  // ⭐ NOVO
  origem: string;
  observacoes: string;
}
```

#### Componentes Atualizados
- ✅ `src/pages/admin/Financeiro.tsx`
- ✅ `src/components/admin/BankReconciliationManager.tsx`
- ✅ `src/components/admin/SimpleTransactionModal.tsx`

#### Exibição na Interface
- ✅ Hora exibida ao lado da data quando disponível
- ✅ Formato: `DD/MM/YYYY HH:MM:SS`

#### Modal de Edição
- ✅ Campo `hora` adicionado ao formulário
- ✅ Input `type="time"` para seleção de hora
- ✅ Hora salva junto com a transação

---

## 📝 Exemplo de Importação

### CSV Original
```csv
Data,Hora,Tipo de transação,Nome,Detalhe,Valor (R$)
15/12/2025,16:09:56,Pix,Pix Beatriz da Silva Manoel,Enviado,"-R$ 394,00"
12/12/2025,21:16:32,Pix,Pix JHULIE RAMOS,Recebido,"+R$ 80,00"
01/12/2025,00:58:49,Depósito de vendas,Vendas,Depósito Infinite Pay,"+R$ 73,61"
```

### Dados no MySQL

#### Transação 1 (Pix Enviado)
```sql
INSERT INTO financial_transactions (
  data, hora, descricao, categoria, tipo, valor, status,
  metodo_pagamento, origem, observacoes
) VALUES (
  '2025-12-15',           -- Data
  '16:09:56',             -- Hora ⭐
  'Pix Beatriz da Silva Manoel - Enviado',
  'Transferência',
  'saida',
  394.00,
  'Pago',
  'Pix',                  -- Tipo de transação
  'Pix Beatriz da Silva Manoel',  -- Nome
  'Hora: 16:09:56 | Tipo: Pix | Nome: Pix Beatriz da Silva Manoel | Detalhe: Enviado | Valor original: -R$ 394,00'
);
```

#### Transação 2 (Pix Recebido)
```sql
INSERT INTO financial_transactions (
  data, hora, descricao, categoria, tipo, valor, status,
  metodo_pagamento, origem, observacoes
) VALUES (
  '2025-12-12',
  '21:16:32',             -- Hora ⭐
  'Pix JHULIE RAMOS - Recebido',
  'Transferência',
  'entrada',
  80.00,
  'Pago',
  'Pix',
  'Pix JHULIE RAMOS',
  'Hora: 21:16:32 | Tipo: Pix | Nome: Pix JHULIE RAMOS | Detalhe: Recebido | Valor original: +R$ 80,00'
);
```

#### Transação 3 (Depósito de Vendas)
```sql
INSERT INTO financial_transactions (
  data, hora, descricao, categoria, tipo, valor, status,
  metodo_pagamento, origem, observacoes
) VALUES (
  '2025-12-01',
  '00:58:49',             -- Hora ⭐
  'Vendas - Depósito Infinite Pay',
  'Vendas',
  'entrada',
  73.61,
  'Pago',
  'Depósito de vendas',  -- Tipo de transação
  'Vendas',              -- Nome
  'Hora: 00:58:49 | Tipo: Depósito de vendas | Nome: Vendas | Detalhe: Depósito Infinite Pay | Valor original: +R$ 73,61'
);
```

---

## ✅ Checklist de Implementação

### Banco de Dados
- [x] Script de migração criado
- [ ] Migração executada (pendente execução manual)
- [x] Coluna `hora` definida como TIME NULL
- [x] Índice `idx_data_hora` criado

### Backend
- [x] GET `/api/financial/transactions` retorna `hora`
- [x] POST `/api/financial/transactions` aceita `hora`
- [x] PUT `/api/financial/transactions` aceita `hora`
- [x] POST `/api/financial/bank-statements/import` salva `hora`

### Frontend
- [x] Interface `Transacao` atualizada
- [x] Tabela exibe hora quando disponível
- [x] Modal de edição tem campo hora
- [x] Importação CSV preserva hora

### Importação CSV
- [x] Parser extrai campo `hora`
- [x] Hora salva no banco de dados
- [x] Hora preservada nas observações

---

## 🚀 Como Executar a Migração

### Opção 1: Via Script Node.js
```bash
node scripts/add-hora-to-financial-transactions.cjs
```

### Opção 2: Via MySQL Direto
```sql
ALTER TABLE financial_transactions 
ADD COLUMN hora TIME NULL 
COMMENT 'Hora da transação (formato HH:MM:SS)'
AFTER data;

CREATE INDEX idx_data_hora ON financial_transactions(data, hora);
```

### Opção 3: Via Endpoint (Futuro)
```bash
POST /api/financial/migrate/add-hora
```

---

## 📊 Estrutura Final da Tabela

```sql
CREATE TABLE financial_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  data DATE NOT NULL,
  hora TIME NULL,                    -- ⭐ NOVO
  descricao VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  valor DECIMAL(10,2) NOT NULL,
  status ENUM('Pago', 'Pendente', 'Atrasado') DEFAULT 'Pendente',
  metodo_pagamento VARCHAR(50),
  origem VARCHAR(255),
  observacoes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_data_hora (data, hora)   -- ⭐ NOVO
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🎯 Resultado Final

Após a migração e importação:

1. ✅ **Todos os 6 campos do CSV são importados**
2. ✅ **Hora é armazenada no banco de dados**
3. ✅ **Hora é exibida na interface**
4. ✅ **Hora pode ser editada no modal**
5. ✅ **Ordenação por data e hora funciona**
6. ✅ **Todos os campos preservados nas observações**

---

**Última Atualização:** Janeiro 2025  
**Versão:** 1.0.0
