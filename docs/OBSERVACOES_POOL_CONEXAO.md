# 🔍 Observações sobre Pool de Conexão

**Data:** 11 de Janeiro de 2025

---

## 📊 Padrão Atual Identificado

Após análise das rotas existentes, foi identificado que:

### Padrão Atual
**Cada arquivo de rotas cria seu próprio pool de conexão**

Exemplos:
- `server/routes/admin-orders-advanced.cjs` - cria pool próprio (linha 8)
- `server/routes/google-calendar.cjs` - cria pool próprio (linha 8)
- `server/routes/orders-sync.cjs` - cria pool próprio (linha 5)
- `server/routes/sync-api.cjs` - cria pool próprio (linha 6)

### server.cjs
- Pool criado na linha 543
- Disponível via `app.locals.pool` (linha 558)

---

## ⚠️ Problema Identificado

### Múltiplos Pools
Cada rota criando seu próprio pool resulta em:
- ❌ Múltiplas conexões ao banco
- ❌ Uso ineficiente de recursos
- ❌ Dificuldade de gerenciamento
- ❌ Possível exceder limite de conexões

### Solução Recomendada

#### Opção 1: Compartilhar Pool via Require
Criar um módulo que exporta o pool:

```javascript
// server/database/pool.cjs
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

module.exports = pool;
```

#### Opção 2: Usar app.locals (Atual)
```javascript
// No server.cjs
app.locals.pool = pool;

// Nas rotas
router.get('/', async (req, res) => {
  const pool = req.app.locals.pool;
  // usar pool...
});
```

#### Opção 3: Passar via Middleware (Melhor)
```javascript
// No server.cjs
app.use((req, res, next) => {
  req.pool = pool;
  next();
});

// Nas rotas
router.get('/', async (req, res) => {
  const pool = req.pool;
  // usar pool...
});
```

---

## 🎯 Recomendação para Refatoração

### Fase 1: Manter Padrão Atual (Temporário)
- Para não quebrar funcionalidade existente
- Criar pools próprios nas novas rotas
- Documentar necessidade de refatoração futura

### Fase 2: Centralizar Pool (Futuro)
- Criar `server/database/pool.cjs`
- Migrar todas as rotas para usar pool centralizado
- Remover pools duplicados

---

## 📋 Checklist de Implementação

### Para Novas Rotas (Produtos)
- [ ] Decidir abordagem (pool próprio vs compartilhado)
- [ ] Documentar decisão
- [ ] Implementar
- [ ] Testar

### Para Refatoração Futura
- [ ] Criar módulo de pool centralizado
- [ ] Migrar rotas existentes
- [ ] Remover pools duplicados
- [ ] Monitorar performance

---

## 💡 Considerações

### Vantagens de Pool Compartilhado
- ✅ Uso eficiente de recursos
- ✅ Gerenciamento centralizado
- ✅ Melhor performance
- ✅ Mais fácil de debugar

### Desvantagens
- ⚠️ Mudança em múltiplos arquivos
- ⚠️ Risco de quebrar funcionalidade
- ⚠️ Necessita testes completos

---

**Status:** 📝 Observação Documentada  
**Ação:** Decidir abordagem antes de começar extração  
**Última Atualização:** 11 de Janeiro de 2025
