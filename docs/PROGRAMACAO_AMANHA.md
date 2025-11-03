# 📅 Programação para Amanhã - Melhorias Críticas

> Plano de trabalho focado em segurança e correções urgentes

**Data:** 30 de Outubro de 2025  
**Duração:** 8 horas (manhã + tarde)  
**Foco:** Segurança crítica e correções urgentes

---

## 🎯 Objetivos do Dia

### Meta Principal
Implementar **100% das correções de segurança críticas** identificadas na análise.

### Resultados Esperados
- ✅ Cookies seguros (httpOnly: true)
- ✅ JWT implementado para admin
- ✅ Senhas com hash forte (bcrypt)
- ✅ Middleware de segurança ativo
- ✅ Sistema testado e funcionando

---

## ⏰ CRONOGRAMA DETALHADO

### 🌅 MANHÃ (8:00 - 12:00) - 4 horas

#### 8:00 - 8:30 | Preparação e Setup
**Objetivo:** Preparar ambiente e revisar código atual

**Tarefas:**
- [ ] Backup do banco de dados atual
- [ ] Backup do código (git commit)
- [ ] Revisar vulnerabilidades identificadas
- [ ] Preparar ambiente de desenvolvimento

**Comandos:**
```bash
# Backup do banco
mysqldump -u root -p rare_toy_store > backup_$(date +%Y%m%d).sql

# Backup do código
git add .
git commit -m "Backup antes das correções de segurança"
git push origin main
```

---

#### 8:30 - 10:00 | Correção de Cookies (1h30)
**Prioridade:** 🔴 CRÍTICA

**Problema Atual:**
```javascript
// server/server.cjs linha 2978-2983
res.cookie('session_id', sid, { 
  httpOnly: false,  // ❌ VULNERÁVEL
  sameSite: 'lax',
  secure: false
});
```

**Correção:**
```javascript
// NOVO - SEGURO
res.cookie('session_id', sid, { 
  httpOnly: true,   // ✅ Protege contra XSS
  sameSite: 'strict', // ✅ Protege contra CSRF
  secure: process.env.NODE_ENV === 'production', // ✅ HTTPS em produção
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  domain: process.env.COOKIE_DOMAIN,
  path: '/',
  signed: true      // ✅ Assinado com secret
});
```

**Arquivos a Modificar:**
- [ ] `server/server.cjs` (linha ~2978)
- [ ] `server/middleware/auth.cjs`
- [ ] Adicionar cookie-parser com signed cookies

**Teste:**
```bash
# Verificar se cookie está httpOnly
curl -I http://localhost:3001/api/auth/login
# Deve mostrar: Set-Cookie: session_id=...; HttpOnly
```

---

#### 10:00 - 10:15 | Coffee Break ☕

---

#### 10:15 - 11:45 | JWT para Admin (1h30)
**Prioridade:** 🔴 CRÍTICA

**Problema Atual:**
```javascript
// Token previsível e inseguro
const adminToken = 'admin_token_' + Date.now() + '_' + user.id;
```

**Implementação JWT:**
```javascript
// 1. Instalar dependência
npm install jsonwebtoken

// 2. Criar utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';

const generateAdminToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
    },
    JWT_SECRET,
    { algorithm: 'HS256' }
  );
};

const verifyAdminToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = { generateAdminToken, verifyAdminToken };
```

**Arquivos a Modificar:**
- [ ] `server/server.cjs` (login admin)
- [ ] `server/middleware/auth.cjs`
- [ ] Criar `server/utils/jwt.js`

**Teste:**
```bash
# Testar login admin
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@examplo.com","password":"admin1234"}'
```

---

### 🌞 ALMOÇO (11:45 - 13:00)

---

### 🌤️ TARDE (13:00 - 17:00) - 4 horas

#### 13:00 - 14:30 | Migração de Senhas (1h30)
**Prioridade:** 🔴 CRÍTICA

**Problema Atual:**
```javascript
// SHA256 sem salt - vulnerável
const senhaHash = crypto.createHash('sha256').update(pass).digest('hex');
```

**Implementação Bcrypt:**
```javascript
// 1. Instalar dependência
npm install bcryptjs

// 2. Criar utils/password.js
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

// Para migrar senhas existentes
const migratePassword = async (plainPassword) => {
  // Converter SHA256 para bcrypt
  const sha256Hash = crypto.createHash('sha256').update(plainPassword).digest('hex');
  // Se hash atual for SHA256, re-hash com bcrypt
  return await hashPassword(plainPassword);
};

module.exports = { hashPassword, comparePassword, migratePassword };
```

**Script de Migração:**
```sql
-- Criar coluna temporária para nova senha
ALTER TABLE admin_users ADD COLUMN password_bcrypt VARCHAR(255);

-- Script para migrar (executar após implementação)
UPDATE admin_users SET password_bcrypt = 'novo_hash_bcrypt' WHERE id = 1;
```

**Arquivos a Modificar:**
- [ ] `server/server.cjs` (login admin)
- [ ] Criar `server/utils/password.js`
- [ ] Script de migração de senhas

---

#### 14:30 - 14:45 | Coffee Break ☕

---

#### 14:45 - 16:15 | Middleware de Segurança (1h30)
**Prioridade:** 🟡 ALTA

**Implementação:**
```javascript
// 1. Instalar dependências
npm install helmet express-rate-limit express-validator

// 2. Criar config/security.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const securityMiddleware = [
  // Helmet - Headers de segurança
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    ieNoOpen: true,
    noSniff: true,
    xssFilter: true,
  }),

  // Rate Limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: 'Muitas requisições, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  }),
];

module.exports = securityMiddleware;
```

**Arquivos a Modificar:**
- [ ] `server/server.cjs` (adicionar middleware)
- [ ] Criar `config/security.js`
- [ ] Configurar CORS adequado

---

#### 16:15 - 17:00 | Testes e Validação (45min)
**Prioridade:** 🟢 MÉDIA

**Testes de Segurança:**
```bash
# 1. Testar cookies httpOnly
curl -I http://localhost:3001/api/auth/login

# 2. Testar JWT admin
curl -X POST http://localhost:3001/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@examplo.com","password":"admin1234"}'
  -d '{"email":"admin@examplo.com","password":"admin1234"}'

# 3. Testar rate limiting
for i in {1..105}; do curl http://localhost:3001/api/products; done

# 4. Testar headers de segurança
curl -I http://localhost:3001/
```

---

## 🔐 Troubleshooting Rápido: Login Admin

### Verificar se email, status e senha estão corretos

```bash
# Compara SHA256(senha) com senha_hash no banco e mostra status/role
node scripts/check-admin.cjs admin@examplo.com admin1234
```

### Ajustar senha e ativar usuário (se necessário)

```sql
UPDATE admin_users
SET senha_hash = SHA2('admin1234', 256), status = 'ativo'
WHERE email = 'admin@examplo.com';
```

### Testar login via cURL (produção)

```bash
curl -i -X POST "https://muhlstore.re9suainternet.com.br/api/admin/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"admin@examplo.com","password":"admin1234"}'
```

**Checklist de Validação:**
- [ ] Cookies com httpOnly: true
- [ ] JWT funcionando para admin
- [ ] Senhas com bcrypt
- [ ] Rate limiting ativo
- [ ] Headers de segurança (helmet)
- [ ] Login admin funcionando
- [ ] Login usuário funcionando

---

## 📋 CHECKLIST COMPLETO

### ✅ Preparação
- [ ] Backup do banco de dados
- [ ] Backup do código (git)
- [ ] Ambiente de desenvolvimento pronto
- [ ] Dependências instaladas

### ✅ Correções de Segurança
- [ ] Cookies com httpOnly: true
- [ ] Cookies com secure: true (produção)
- [ ] Cookies com sameSite: strict
- [ ] JWT implementado para admin
- [ ] Senhas migradas para bcrypt
- [ ] Middleware de segurança ativo

### ✅ Testes
- [ ] Login admin funcionando
- [ ] Login usuário funcionando
- [ ] Cookies seguros
- [ ] Rate limiting funcionando
- [ ] Headers de segurança ativos

### ✅ Documentação
- [ ] Changelog atualizado
- [ ] Documentação de segurança
- [ ] Instruções de deploy

---

## 🚨 PONTOS DE ATENÇÃO

### ⚠️ Backup Obrigatório
**ANTES de qualquer mudança:**
```bash
# Backup completo
mysqldump -u root -p rare_toy_store > backup_seguranca_$(date +%Y%m%d).sql
git add . && git commit -m "Backup antes correções segurança"
```

### ⚠️ Teste em Ambiente
- Testar todas as mudanças em desenvolvimento primeiro
- Validar login admin e usuário
- Verificar se não quebrou funcionalidades existentes

### ⚠️ Deploy Gradual
- Implementar em horário de baixo tráfego
- Monitorar logs após deploy
- Ter plano de rollback pronto

---

## 📊 MÉTRICAS DE SUCESSO

### Antes vs Depois

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Cookies Seguros | ❌ 0% | ✅ 100% | +100% |
| Autenticação Admin | ❌ Vulnerável | ✅ JWT | +100% |
| Hash de Senhas | ❌ SHA256 | ✅ Bcrypt | +100% |
| Headers Segurança | ❌ Básicos | ✅ Helmet | +100% |
| Rate Limiting | ❌ Não existe | ✅ Ativo | +100% |

### Score de Segurança
- **Antes:** 4.5/10 (Crítico)
- **Depois:** 8.5/10 (Bom)
- **Melhoria:** +89%

---

## 🎯 PRÓXIMOS PASSOS (Após Amanhã)

### Semana 2 - RBAC
- Sistema de roles e permissões
- Middleware de autorização
- UI adaptativa por permissão

### Semana 3 - Auditoria
- Logs de auditoria
- Dashboard de segurança
- Exportação de logs

---

## 📞 SUPORTE

### Em Caso de Problemas

**Problema:** Login não funciona após mudanças
**Solução:** 
1. Verificar logs do servidor
2. Testar com curl
3. Rollback se necessário

**Problema:** Cookies não funcionam
**Solução:**
1. Verificar configuração de domínio
2. Testar em diferentes navegadores
3. Verificar HTTPS em produção

**Problema:** JWT inválido
**Solução:**
1. Verificar JWT_SECRET
2. Verificar expiração do token
3. Verificar algoritmo

---

## ✅ CONCLUSÃO

### Objetivos do Dia
- ✅ Implementar 100% das correções críticas de segurança
- ✅ Sistema mais seguro e robusto
- ✅ Base sólida para próximas melhorias

### Tempo Estimado
- **Total:** 8 horas
- **Manhã:** 4 horas (cookies + JWT)
- **Tarde:** 4 horas (senhas + middleware + testes)

### Resultado Esperado
Sistema com segurança de nível empresarial, pronto para produção.

---

**Criado em:** 29/10/2025  
**Versão:** 1.0.0  
**Status:** 🟢 Pronto para execução






