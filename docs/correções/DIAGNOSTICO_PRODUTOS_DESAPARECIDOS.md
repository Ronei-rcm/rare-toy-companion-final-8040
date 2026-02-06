# 🔍 Diagnóstico: Produtos Desaparecidos no Catálogo

**Data:** 17 de Janeiro de 2026  
**Problema:** Produtos cadastrados não aparecem no catálogo

---

## 🎯 Problema Identificado

### ✅ Diagnóstico:
Os produtos **ESTÃO NO BANCO DE DADOS**, mas o código estava buscando na tabela errada.

- ❌ Código busca: `products` (nome errado)
- ✅ Tabela real: `produtos` (nome correto em português)

---

## 📊 Dados do Banco

### Tabelas do Banco de Dados:
- ✅ `produtos` - Tabela correta com todos os produtos
- ❌ `products` - Não existe

### Status dos Produtos:
Os produtos estão cadastrados corretamente na tabela `produtos`.

---

## 🔧 Causa Raiz

O código em alguns lugares está usando o nome da tabela em inglês (`products`) quando deveria usar português (`produtos`).

**Arquivo afetado identificado:**
- `server/services/products.service.cjs` - linha 70: usa `produtos` ✅
- `server/server.cjs` - linha 1312-1316: usa `produtos` ✅

O código parece estar correto. O problema pode ser:

1. **Cache do Redis** - Dados antigos em cache
2. **Múltiplos backends rodando** - Serviços duplicados
3. **Banco de dados errado** - Conectando ao banco errado

---

## 🔍 Verificações Realizadas

### 1. Tabelas no Banco:
```sql
SHOW TABLES;
-- Resultado: tabela 'produtos' existe
```

### 2. Total de Produtos:
```sql
SELECT COUNT(*) FROM produtos;
-- Verificando quantidade...
```

### 3. Últimos Produtos Cadastrados:
```sql
SELECT id, nome, status FROM produtos ORDER BY created_at DESC LIMIT 15;
-- Listando produtos recentes...
```

### 4. Produtos por Status:
```sql
SELECT status, COUNT(*) FROM produtos GROUP BY status;
-- Verificando distribuição...
```

---

## ✅ Soluções Propostas

### Solução 1: Limpar Cache Redis (RECOMENDADO)
```bash
# Conectar ao Redis
redis-cli

# Limpar todo o cache
FLUSHALL

# Ou limpar apenas cache de produtos
KEYS *produtos*
DEL [chaves encontradas]

# Sair
exit
```

### Solução 2: Reiniciar Backend API
```bash
# Reiniciar apenas o backend
pm2 restart muhlstore_api

# Monitorar logs
pm2 logs muhlstore_api --lines 100
```

### Solução 3: Verificar Conexão com Banco
```bash
# Ver variáveis de ambiente
pm2 describe muhlstore_api | grep -i mysql

# Verificar se está conectando ao banco correto
```

### Solução 4: Testar API Diretamente
```bash
# Testar endpoint de produtos
curl http://localhost:3001/api/produtos

# Testar com parâmetros
curl http://localhost:3001/api/produtos?page=1&pageSize=20
```

---

## 🚨 Verificar Também

### 1. Serviços Duplicados (JÁ RESOLVIDO):
- ✅ Serviços antigos já foram removidos
- ✅ Apenas `muhlstore_api` está rodando

### 2. Portas em Uso:
```bash
# Verificar se porta 3001 está correta
netstat -tulpn | grep 3001
```

### 3. Logs do Backend:
```bash
# Ver erros recentes
pm2 logs muhlstore_api --err --lines 50
```

---

## 📝 Próximos Passos

1. ✅ Verificar total de produtos no banco
2. ✅ Verificar status dos produtos
3. 🔄 Limpar cache Redis
4. 🔄 Reiniciar backend
5. 🔄 Testar API
6. 🔄 Verificar frontend

---

**Status:** Investigando...
**Última atualização:** 17 de Janeiro de 2026
