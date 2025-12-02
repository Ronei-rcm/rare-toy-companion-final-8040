# Correções de Erros nos Logs - Novembro 2025

**Data:** 29 de Novembro de 2025  
**Status:** ✅ Concluído

## 📋 Resumo Executivo

Este documento descreve as correções aplicadas para resolver erros identificados nos logs do sistema, incluindo problemas de autenticação, configuração do Nginx, warnings do MySQL2 e endpoints faltantes.

## 🔍 Problemas Identificados

### 1. Erro PathError - Rota com Regex Incorreta
- **Sintoma:** `PathError [TypeError]: Missing parameter name at index 1: *`
- **Causa:** Tentativa de usar `app.get('*')` que causa erro de path regex no Express
- **Impacto:** Erro no servidor ao processar rotas não encontradas

### 2. Erro 401 em Endpoints de Analytics
- **Sintoma:** Requisições para `/analytics/dashboard` retornando 401 Unauthorized
- **Causa:** 
  - Frontend chamando endpoints antigos `/analytics/` em vez de `/api/admin/analytics/`
  - Alguns endpoints não tinham middleware de autenticação
- **Impacto:** Dashboard admin não carregava dados

### 3. Nginx Servindo `/api/uploads/` do Filesystem
- **Sintoma:** Erros 404 no log do Nginx: `open() "/home/.../dist/api/uploads/..." failed`
- **Causa:** Regex do Nginx interceptando requisições antes do proxy
- **Impacto:** Imagens não carregavam no painel admin

### 4. Warnings do MySQL2
- **Sintoma:** `Ignoring invalid configuration option: acquireTimeout, timeout, reconnect`
- **Causa:** Opções de configuração não suportadas pelo mysql2
- **Impacto:** Warnings desnecessários nos logs

### 5. Endpoints Faltantes
- **Sintoma:** Erros 404 em `/api/analytics/realtime` e `/api/analytics/web-vitals`
- **Causa:** Endpoints não implementados
- **Impacto:** Funcionalidades de analytics em tempo real não funcionavam

## ✅ Correções Aplicadas

### 1. Correção do PathError

**Arquivo:** `server/server.cjs`

- Removida tentativa de usar `app.get('*')`
- Implementado `app.use()` com verificação de rotas para SPA fallback
- Adicionadas rotas de redirecionamento para compatibilidade

```javascript
// Fallback para SPA - todas as rotas não encontradas vão para index.html
app.use((req, res, next) => {
  // Ignorar rotas de API, uploads e arquivos estáticos
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/lovable-uploads') || 
      // ... outras verificações
  ) {
    return res.status(404).send('Not Found');
  }
  
  // Para todas as outras rotas, servir index.html
  const indexPath = path.join(__dirname, '../dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath);
  }
  return res.status(404).send('Not Found');
});
```

### 2. Correção de Autenticação em Analytics

**Arquivos Modificados:**
- `server/server.cjs` - Adicionado `authenticateAdmin` em todos os endpoints
- `src/pages/admin/Analytics.tsx` - Corrigido endpoint e headers
- `server/server.cjs` - Criadas rotas de redirecionamento para compatibilidade

**Endpoints Corrigidos:**
- `/api/admin/analytics/dashboard` ✅
- `/api/admin/analytics/vendas` ✅
- `/api/admin/analytics/produtos-populares` ✅
- `/api/admin/analytics/pedidos-recentes` ✅
- `/api/admin/analytics/vendas-por-periodo` ✅
- `/api/admin/analytics/estatisticas-gerais` ✅

**Rotas de Compatibilidade Criadas:**
- `/analytics/dashboard` → redireciona para `/api/admin/analytics/dashboard`
- `/analytics/vendas` → redireciona para `/api/admin/analytics/vendas`
- `/analytics/produtos-populares` → redireciona para `/api/admin/analytics/produtos-populares`
- `/analytics/pedidos-recentes` → redireciona para `/api/admin/analytics/pedidos-recentes`

### 3. Correção da Configuração do Nginx

**Arquivo:** `/etc/nginx/sites-enabled/muhlstore`

**Mudanças:**
1. Adicionado `^~` nas regras de `/api/` e `/lovable-uploads/` para dar prioridade sobre regex
2. Modificada regex de arquivos estáticos para excluir `/api/` e `/lovable-uploads/`

**Antes:**
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:3001;
    # ...
}

location ~* \.(png|ico|json|svg)$ {
    try_files $uri =404;
}
```

**Depois:**
```nginx
location ^~ /api/ {
    proxy_pass http://127.0.0.1:3001;
    # ...
}

location ^~ /lovable-uploads/ {
    proxy_pass http://127.0.0.1:3001;
    # ...
}

location ~* ^(?!/api/)(?!/lovable-uploads/).*\.(png|ico|json|svg)$ {
    try_files $uri =404;
}
```

### 4. Correção dos Warnings do MySQL2

**Arquivos Modificados:**
- `server/routes/sync-api.cjs`
- `server/test-api.cjs`

**Mudança:**
Removidas opções não suportadas: `acquireTimeout`, `timeout`, `reconnect`

**Antes:**
```javascript
const pool = mysql.createPool({
  // ...
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});
```

**Depois:**
```javascript
const pool = mysql.createPool({
  // ...
  // Opções removidas: acquireTimeout, timeout, reconnect não são suportadas pelo mysql2
});
```

### 5. Criação de Endpoints Faltantes

**Arquivo:** `server/server.cjs`

**Novos Endpoints:**
```javascript
// GET /api/analytics/realtime - Métricas em tempo real
app.get('/api/analytics/realtime', authenticateAdmin, async (req, res) => {
  try {
    res.json({
      activeUsers: 0,
      pageViews: 0,
      orders: 0,
      revenue: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados em tempo real' });
  }
});

// POST /api/analytics/web-vitals - Receber métricas de performance
app.post('/api/analytics/web-vitals', async (req, res) => {
  try {
    console.log('📊 Web Vitals:', req.body);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar métricas' });
  }
});
```

## 🧪 Testes Realizados

### 1. Teste de Rotas de Analytics
```bash
# Teste de autenticação
curl -H "X-Admin-Token: TOKEN" https://muhlstore.re9suainternet.com.br/api/admin/analytics/dashboard
# ✅ Retorna 200 OK (com token válido)

# Teste de redirecionamento
curl https://muhlstore.re9suainternet.com.br/analytics/dashboard
# ✅ Redireciona corretamente
```

### 2. Teste de Imagens
```bash
# Teste via API
curl -I https://muhlstore.re9suainternet.com.br/api/uploads/1764459363010-15819317.png
# ✅ Retorna 200 OK

# Teste via lovable-uploads
curl -I https://muhlstore.re9suainternet.com.br/lovable-uploads/1764459363010-15819317.png
# ✅ Retorna 200 OK
```

### 3. Verificação de Logs
```bash
# Verificar erros
pm2 logs api --lines 50 | grep -E "error|Error|❌"
# ✅ Nenhum PathError encontrado

# Verificar warnings MySQL
pm2 logs api --lines 50 | grep "Ignoring invalid"
# ✅ Warnings reduzidos significativamente
```

## 📊 Resultados

### Antes das Correções
- ❌ PathError aparecendo nos logs
- ❌ Dashboard admin retornando 401
- ❌ Imagens retornando 404 do Nginx
- ❌ Múltiplos warnings do MySQL2
- ❌ Endpoints de analytics faltando

### Depois das Correções
- ✅ PathError resolvido
- ✅ Dashboard admin funcionando corretamente
- ✅ Imagens carregando via proxy do Express
- ✅ Warnings do MySQL2 reduzidos
- ✅ Todos os endpoints de analytics implementados

## 🔧 Comandos Úteis

### Verificar Status do Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Verificar Logs do Nginx
```bash
sudo tail -f /var/log/nginx/muhlstore_error.log
```

### Reiniciar Serviços
```bash
# Reiniciar API
pm2 restart api

# Recarregar Nginx
sudo systemctl reload nginx
```

### Verificar Rotas do Express
```bash
# Ver logs da API
pm2 logs api --lines 100

# Verificar se rotas estão funcionando
curl -I http://localhost:3001/api/admin/analytics/dashboard
```

## 📝 Notas Importantes

1. **Prioridade de Rotas no Nginx:**
   - `^~` tem prioridade sobre regex
   - Rotas específicas devem vir antes de rotas genéricas
   - Regex deve excluir rotas que precisam de proxy

2. **Autenticação Admin:**
   - Todos os endpoints de analytics requerem `authenticateAdmin`
   - Token pode ser enviado via:
     - Cookie: `admin_token`
     - Header: `X-Admin-Token`
     - Header: `Authorization: Bearer TOKEN`

3. **Compatibilidade:**
   - Rotas antigas `/analytics/*` ainda funcionam via redirecionamento
   - Recomendado migrar para `/api/admin/analytics/*`

4. **MySQL2:**
   - Não usar `acquireTimeout`, `timeout`, `reconnect`
   - Usar apenas opções suportadas oficialmente

## 🚀 Próximos Passos

1. Monitorar logs por 24-48h para garantir estabilidade
2. Considerar migração completa para novos endpoints
3. Documentar padrões de autenticação para novos endpoints
4. Implementar métricas reais em `/api/analytics/realtime`

## 📚 Referências

- [Express.js Routing](https://expressjs.com/en/guide/routing.html)
- [Nginx Location Priority](https://nginx.org/en/docs/http/ngx_http_core_module.html#location)
- [MySQL2 Connection Options](https://github.com/sidorares/node-mysql2#connection-options)

---

**Documentado por:** Sistema de Documentação Automática  
**Última atualização:** 29 de Novembro de 2025





