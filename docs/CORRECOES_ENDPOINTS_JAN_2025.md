# Correções de Endpoints - Janeiro 2025

## 📋 Resumo

Este documento descreve todas as correções aplicadas nos endpoints da API para resolver erros 500 (Internal Server Error) identificados durante o uso do painel administrativo.

---

## 🔧 Correções Aplicadas

### 1. Endpoint `/api/admin/customers` e `/api/admin/customers/stats`

**Problemas Identificados:**
- Erro 500 ao carregar lista de clientes
- Erro de collation: `Illegal mix of collations (utf8mb4_unicode_ci,IMPLICIT) and (utf8mb4_general_ci,IMPLICIT)`
- Coluna `customer_id` não existe na tabela `orders` (correto é `user_id`)
- Coluna `status` não existe na tabela `customers`

**Correções Aplicadas:**
1. Substituído `customer_id` por `user_id` nas subqueries de estatísticas
2. Adicionado `CAST(user_id AS CHAR)` para converter INT para VARCHAR na comparação
3. Aplicado `COLLATE utf8mb4_unicode_ci` nas comparações de JOIN para garantir collation consistente
4. Removidas referências à coluna `status` inexistente na tabela `customers`
5. Corrigido tratamento de `LIMIT` e `OFFSET` usando interpolação direta (algumas versões do MySQL não suportam placeholders)

**Arquivos Modificados:**
- `server/server.cjs` (linhas ~5418-5462, ~5481-5545)

---

### 2. Endpoint `/api/admin/blog/posts` (POST/PUT)

**Problemas Identificados:**
- Erro 500 ao criar/atualizar posts do blog
- Colunas `meta_title`, `meta_description` e `meta_keywords` não existem na tabela `blog_posts`

**Correções Aplicadas:**
1. Removidas colunas `meta_title`, `meta_description` e `meta_keywords` do INSERT
2. Removidas referências a essas colunas no UPDATE
3. Ajustado número de parâmetros no INSERT (de 18 para 15)

**Arquivos Modificados:**
- `server/server.cjs` (linhas ~12220-12308, ~12368-12464)

---

### 3. Endpoint `/api/events` (POST/PUT)

**Problemas Identificados:**
- Erro 500 ao criar eventos
- Múltiplas colunas não existem na tabela `events`:
  - `data_inicio` e `data_fim`
  - `numero_vagas` e `vagas_limitadas`
  - `feira_fechada`, `renda_total`, `participantes_confirmados`
  - `ativo` (a tabela usa `status` em vez de `ativo`)

**Correções Aplicadas:**
1. Removidas colunas inexistentes do INSERT:
   - `data_inicio`, `data_fim`
   - `numero_vagas`, `vagas_limitadas`
   - `feira_fechada`, `renda_total`, `participantes_confirmados`
2. Convertido campo `ativo` (boolean) para `status` (string):
   - `true` → `'ativo'`
   - `false` → `'inativo'`
3. Ajustado UPDATE para usar apenas campos existentes
4. Endpoint `/api/events/:id/fechar-feira` ajustado para não usar colunas inexistentes

**Estrutura Final do INSERT:**
```sql
INSERT INTO events (
  id, titulo, descricao, data_evento, local, imagem_url, status
) VALUES (?, ?, ?, ?, ?, ?, ?)
```

**Arquivos Modificados:**
- `server/server.cjs` (linhas ~2429-2499, ~2502-2545, ~2548-2575)

---

### 4. Endpoint `/api/admin/orders` (GET)

**Problemas Identificados:**
- Erro 500 ao carregar lista de pedidos
- Erro: `Incorrect arguments to mysqld_stmt_execute` com `LIMIT` e `OFFSET`

**Correções Aplicadas:**
1. Corrigido tratamento de parâmetros `page`, `limit` e `offset` usando `Number()` e `Math.max()`
2. Alterado `LIMIT ? OFFSET ?` para interpolação direta: `LIMIT ${limitValue} OFFSET ${offsetValue}`

**Arquivos Modificados:**
- `server/server.cjs` (linhas relacionadas ao endpoint de pedidos)

---

### 5. Endpoint `/api/admin/marketplace/sellers` (POST/PUT)

**Problemas Identificados:**
- Erro 500 ao salvar vendedores do marketplace
- Campos sendo inseridos/atualizados não existem na tabela `marketplace_sellers`

**Correções Aplicadas:**
1. Removidos campos inexistentes do INSERT e UPDATE:
   - `email`, `telefone`, `whatsapp`, `instagram`, `website`
   - `politica_troca`, `politica_envio`, `horario_atendimento`
2. Corrigido erro de sintaxe no `pool.execute` (parênteses faltando)
3. Melhorado tratamento de erros com mensagens específicas

**Arquivos Modificados:**
- `server/server.cjs` (linhas relacionadas ao endpoint de marketplace sellers)

---

## 🔐 Correção de Autenticação

### JWT Secret Fix

**Problema Identificado:**
- `JWT_SECRET` estava sendo gerado com `Date.now()` como fallback, causando mudança a cada reinicialização do servidor
- Isso invalidava todos os tokens JWT existentes, causando erros 401

**Correção Aplicada:**
- Alterado `JWT_SECRET` para valor fixo: `'muhlstore-admin-secret-key-2025-do-not-change-in-production'`
- Adicionados logs de debug no middleware de autenticação

**Arquivos Modificados:**
- `server/utils/security.cjs`
- `server/middleware/auth.cjs`

---

## 📊 Estrutura das Tabelas

### Tabela `events`
```sql
CREATE TABLE events (
  id VARCHAR(191) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  data_evento DATETIME NOT NULL,
  local VARCHAR(255),
  imagem_url VARCHAR(500),
  link_inscricao VARCHAR(500),
  status VARCHAR(50) DEFAULT 'ativo',  -- NOTA: Usa 'status' não 'ativo'
  destaque BOOLEAN DEFAULT FALSE,
  ordem INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Tabela `blog_posts`
- **Colunas removidas:** `meta_title`, `meta_description`, `meta_keywords`
- **Colunas existentes:** `id`, `titulo`, `slug`, `resumo`, `conteudo`, `categoria`, `imagem_url`, `imagem_destaque`, `autor`, `autor_avatar`, `tempo_leitura`, `destaque`, `status`, `tags`, `publicado_em`, `created_at`, `updated_at`

### Tabela `customers`
- **Não possui coluna:** `status`
- **Coluna correta na tabela `orders`:** `user_id` (não `customer_id`)

---

## ✅ Testes Realizados

1. ✅ Criação de eventos via painel admin
2. ✅ Listagem de clientes no painel admin
3. ✅ Estatísticas de clientes
4. ✅ Criação/atualização de posts do blog
5. ✅ Listagem de pedidos no painel admin
6. ✅ Autenticação admin (JWT)

---

## 🚀 Próximos Passos Recomendados

1. **Migração de Banco de Dados:**
   - Considerar adicionar as colunas `data_inicio` e `data_fim` na tabela `events` se necessário
   - Adicionar coluna `status` na tabela `customers` se necessário para funcionalidades futuras

2. **Validação de Schema:**
   - Criar script de validação que verifica se todas as colunas usadas no código existem nas tabelas
   - Executar antes de cada deploy

3. **Documentação de API:**
   - Atualizar documentação da API com a estrutura correta de cada endpoint
   - Incluir exemplos de request/response

---

## 📝 Notas Importantes

- **Collation MySQL:** Sempre usar `COLLATE utf8mb4_unicode_ci` explicitamente em JOINs quando houver mistura de tipos (INT vs VARCHAR)
- **LIMIT/OFFSET:** Algumas versões do MySQL não suportam placeholders para LIMIT/OFFSET, usar interpolação direta
- **Conversão de Tipos:** Sempre converter explicitamente tipos diferentes antes de comparar (ex: `CAST(user_id AS CHAR)`)
- **JWT Secret:** Nunca usar valores dinâmicos como `Date.now()` para JWT_SECRET em produção

---

## 🔗 Referências

- Arquivo principal: `server/server.cjs`
- Middleware de autenticação: `server/middleware/auth.cjs`
- Utilitários de segurança: `server/utils/security.cjs`
- Migrações de banco: `database/migrations/`

---

**Data de Criação:** 01/12/2025  
**Última Atualização:** 01/12/2025  
**Autor:** Sistema de Correções Automáticas

