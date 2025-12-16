# 🔧 Correções e Melhorias - Janeiro 2025

**Data:** 11 de Janeiro de 2025  
**Status:** ✅ Concluído

---

## 📋 Resumo Executivo

Esta sessão focou em corrigir múltiplos erros críticos relacionados a:
1. Rate limiting de cadastro
2. Endpoints de pedidos e estatísticas
3. Autenticação e login
4. Frontend - componente de pedidos

---

## ✅ Correções Implementadas

### 1. Rate Limiter de Cadastro

**Problema:**
- Limite muito restritivo (5 contas/hora)
- Bloqueava usuários legítimos que tentavam criar conta com email já existente

**Solução:**
- Limite aumentado: **5 → 30 contas/hora**
- `skipSuccessfulRequests: true` - Só conta tentativas bem-sucedidas
- Erros (409, 400, etc) não contam mais no rate limit

**Arquivos:**
- `config/security.cjs`
- `scripts/clear-rate-limit.cjs` (novo)

---

### 2. Endpoints de Pedidos - Erro 500

**Problemas Identificados:**

#### 2.1. Uso de `customer_id` em vez de `user_id`
- **Erro:** "Unknown column 'customer_id' in 'where clause'"
- **Causa:** Tabela `orders` não tem coluna `customer_id`, apenas `user_id`
- **Endpoints corrigidos:**
  - `/api/orders/unified`
  - `/api/orders/stats/unified`
  - `/api/customers/:userId/stats`
  - `/api/user-stats/stats/:userId`

#### 2.2. Colunas inexistentes na tabela `orders`
- **Erro:** "Unknown column 'email' in 'where clause'"
- **Colunas removidas/corrigidas:**
  - ❌ `o.nome` → ✅ `c.nome` (via JOIN)
  - ❌ `o.email` → ✅ `c.email` (via JOIN)
  - ❌ `o.telefone` → ✅ `c.telefone` (via JOIN)
  - ❌ `o.endereco` → ✅ `o.shipping_address`
  - ❌ `o.metodo_pagamento` → ✅ `o.payment_method`

#### 2.3. LIMIT/OFFSET com placeholders
- **Erro:** "Incorrect arguments to mysqld_stmt_execute"
- **Causa:** MySQL não aceita placeholders (`?`) em LIMIT/OFFSET
- **Solução:** Usar valores literais diretamente: `LIMIT ${limitInt} OFFSET ${offsetInt}`

#### 2.4. Colunas inexistentes em `order_items`
- **Erro:** "Unknown column 'oi.name' in 'field list'"
- **Correção:** Removidas colunas `name` e `image_url` (não existem na tabela)

**Arquivos:**
- `server/routes/orders-sync.cjs`
- `server/server.cjs`

---

### 3. Autenticação - Login

**Problema:**
- **Erro:** "Unknown column 'senha_hash' in 'field list'"
- **Causa:** Query tentava usar `COALESCE(password_hash, senha_hash)`, mas tabela `users` só tem `password_hash`

**Solução:**
- Query corrigida para usar apenas `password_hash`
- Busca em `customers` agora busca senha em `users` pelo mesmo ID

**Arquivos:**
- `server/server.cjs` (endpoint `/api/auth/login`)

---

### 4. Frontend - Componente OrdersUnified

**Problemas:**

#### 4.1. Erro de inicialização
- **Erro:** "Cannot access 'v' before initialization"
- **Causa:** Função `getStatusInfo` sendo usada antes de ser declarada (problema de hoisting)

**Solução:**
- Função `getStatusInfo` movida para fora do componente
- Tipo TypeScript adicionado

#### 4.2. Dados não normalizados
- **Problema:** `order.items` podia ser `undefined` ou `null`
- **Solução:**
  - Normalização dos dados recebidos da API
  - Garantido que `items` seja sempre um array
  - Fallbacks adicionados em todos os acessos

#### 4.3. Dependências de useEffect
- **Problema:** Loops infinitos causados por dependências incorretas
- **Solução:** Dependências ajustadas para valores primitivos

**Arquivos:**
- `src/components/cliente/OrdersUnified.tsx`

---

### 5. Carrossel - Endpoint `/api/carousel/active`

**Problema:**
- **Erro:** "Unknown column 'is_active' in 'where clause'"
- **Causa:** Coluna correta é `active`, não `is_active`

**Solução:**
- Query corrigida: `WHERE active = 1`

**Arquivos:**
- `server/server.cjs`

---

### 6. Tabela `customer_coupons`

**Problema:**
- **Erro:** "Unknown column 'usado' in 'where clause'"
- **Causa:** Coluna correta é `status`, não `usado`
- **Erro:** "Unknown column 'data_fim' in 'where clause'"
- **Causa:** Coluna correta é `expires_at`, não `data_fim`

**Solução:**
- Query corrigida: `WHERE status = "active" AND expires_at >= NOW()`

**Arquivos:**
- `server/server.cjs`

---

## 📊 Estrutura Correta das Tabelas

### `orders`
```sql
- id (varchar(36))
- user_id (varchar(36)) ← Usar este, NÃO customer_id
- total (decimal(10,2))
- status (enum)
- payment_method (varchar(50))
- shipping_address (text)
- tracking_code (varchar(255))
- created_at, updated_at
```

### `order_items`
```sql
- id (varchar(36))
- order_id (varchar(36))
- product_id (varchar(191))
- quantity (int)
- price (decimal(10,2))
- created_at
-- NÃO tem: name, product_name, image_url
```

### `users`
```sql
- id (varchar(36))
- email (varchar(255))
- password_hash (varchar(255)) ← Usar este
- nome (varchar(255))
```

### `customers`
```sql
- id (varchar(36)) ← Mesmo ID de users
- nome (varchar(255))
- email (varchar(255))
- telefone (varchar(50))
-- NÃO tem: password_hash
```

### `carousel_items`
```sql
- id (varchar(36))
- title, subtitle, image_url
- active (tinyint(1)) ← Usar este, NÃO is_active
- order_index (int)
```

### `customer_coupons`
```sql
- id (varchar(36))
- customer_id (varchar(36))
- status (enum: 'active', 'used', 'expired') ← Usar este, NÃO usado
- expires_at (timestamp) ← Usar este, NÃO data_fim
```

---

## 🛠️ Scripts Criados

### `scripts/test-create-user-order.cjs`
Script para testar criação de usuário e pedido.

**Uso:**
```bash
node scripts/test-create-user-order.cjs
```

**Funcionalidades:**
- Cria usuário de teste
- Cria pedido de teste
- Cria item do pedido
- Testa busca de pedidos
- Testa estatísticas

### `scripts/clear-rate-limit.cjs`
Script para limpar rate limits de registro.

**Uso:**
```bash
# Limpar todos os rate limits
npm run rate-limit:clear

# Limpar rate limit de um IP específico
node scripts/clear-rate-limit.cjs 177.67.32.65
```

---

## 📝 Documentações Criadas/Atualizadas

1. ✅ `docs/SOLUCAO_EMAIL_JA_CADASTRADO.md`
2. ✅ `docs/SOLUCAO_RATE_LIMIT_CADASTRO.md`
3. ✅ `docs/CORRECAO_ENDPOINTS_CUSTOMER_ID.md`
4. ✅ `docs/TESTE_CRIACAO_USUARIO_PEDIDO.md`
5. ✅ `docs/CORRECOES_JANEIRO_2025.md` (este arquivo)

---

## ✅ Status Final

### Backend
- ✅ Rate limiter ajustado
- ✅ Endpoints de pedidos corrigidos
- ✅ Endpoint de login corrigido
- ✅ Endpoint de carrossel corrigido
- ✅ Queries SQL validadas

### Frontend
- ✅ Componente OrdersUnified corrigido
- ✅ Normalização de dados implementada
- ✅ Proteções contra dados inválidos
- ✅ Build funcionando

### Testes
- ✅ Script de teste criado
- ✅ Teste de criação de usuário/pedido funcionando
- ✅ Login funcionando
- ✅ Busca de pedidos funcionando

---

## 🎯 Próximos Passos Recomendados

1. **Testes em produção:**
   - Testar criação de novos usuários
   - Testar criação de pedidos
   - Verificar se todos os endpoints estão funcionando

2. **Monitoramento:**
   - Acompanhar logs de erros
   - Verificar se há mais erros 500

3. **Melhorias futuras:**
   - Adicionar testes automatizados
   - Documentar todas as tabelas do banco
   - Criar script de migração de dados

---

**Última Atualização:** 11 de Janeiro de 2025

