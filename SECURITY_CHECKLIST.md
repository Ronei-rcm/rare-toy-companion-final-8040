# 🔐 Checklist de Segurança - Rare Toy Companion

**Data:** 11 de Janeiro de 2025  
**Status:** ⚠️ AÇÕES PENDENTES

---

## 🚨 CRÍTICO - Ação Imediata Necessária

### 1. Senhas Hardcoded no Código

**Status:** 🔴 **VULNERABILIDADE CRÍTICA**

**Problema:** Encontradas senhas hardcoded em múltiplos arquivos do projeto.

**Arquivos Afetados:**

#### Scripts (25 arquivos):
- ✅ `scripts/create-budgets-table.cjs` - **CORRIGIDO**
- ✅ `scripts/notify-recurring-transactions.cjs` - **CORRIGIDO**
- ✅ `scripts/test-recurring-insert.cjs` - **CORRIGIDO**
- ⚠️ `scripts/test-orders-sync.js` - **PENDENTE**
- ⚠️ `scripts/test-endpoint.cjs` - **PENDENTE**
- ⚠️ `scripts/debug-auth.cjs` - **PENDENTE**
- ⚠️ `scripts/refactor-server.cjs` - **PENDENTE**
- ⚠️ `scripts/simple-migrate.cjs` - **PENDENTE**
- ⚠️ `scripts/migrate-database.cjs` - **PENDENTE**
- ⚠️ `scripts/optimize-database.cjs` - **PENDENTE**
- ⚠️ `scripts/test-address-system.cjs` - **PENDENTE**
- ⚠️ `scripts/fix-orphan-orders.cjs` - **PENDENTE**
- ⚠️ `scripts/test-new-user-orders.cjs` - **PENDENTE**
- ⚠️ `scripts/test-real-user-flow.cjs` - **PENDENTE**
- ⚠️ `scripts/test-minha-conta-complete.cjs` - **PENDENTE**
- ⚠️ `scripts/test-complete-flow.cjs` - **PENDENTE**
- ⚠️ `scripts/test-user-account.cjs` - **PENDENTE**
- ⚠️ Scripts de deploy em `scripts/deploy-*.sh` - **PENDENTE**

#### Serviços (7 arquivos):
- ✅ `server/services/googleCalendarService.cjs` - **CORRIGIDO**
- ⚠️ `server/server-refactored.cjs` - **PENDENTE** (arquivo legado)
- ⚠️ Arquivos em `server/legacy/` - **PENDENTE** (podem ser ignorados)

**Ação Requerida:**

```bash
# Opção 1: Usar script automatizado
bash scripts/fix-hardcoded-passwords.sh

# Opção 2: Correção manual
# Substituir em todos os arquivos:
# ANTES: password: process.env.MYSQL_PASSWORD || 'RSM_Rg51gti66'
# DEPOIS: password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || ''
```

**Próximos Passos:**

1. ✅ Criar script de correção automática
2. ⚠️ Executar script para corrigir todos os arquivos
3. ⚠️ Revisar alterações com `git diff`
4. ⚠️ Testar conexão com banco: `npm run mysql:test`
5. ⚠️ Verificar que nenhuma senha permanece no código: `grep -r "RSM_Rg51gti66\|rg51gt66" .`
6. ⚠️ Commit das correções
7. ⚠️ **IMPORTANTE:** Considerar rotacionar senha do MySQL em produção

---

## ✅ Segurança Implementada

### Autenticação e Autorização

- ✅ JWT tokens com refresh tokens
- ✅ Middleware de autenticação robusto
- ✅ Role-based access control (RBAC)
- ✅ Cookies httpOnly para sessões
- ✅ Rate limiting por rota (express-rate-limit)

**Configurações:**
```javascript
authLimiter: 5 requests/15min
cartLimiter: 20 requests/min
generalLimiter: 100 requests/15min
```

### Proteção Contra Ataques

- ✅ **SQL Injection:** Prepared statements em 100% das queries
- ✅ **XSS:** Sanitização com validator.js
- ✅ **CSRF:** Double Submit Cookie Pattern
- ✅ **Rate Limiting:** Configurado por tipo de rota
- ✅ **CORS:** Configurado adequadamente por ambiente

### Headers de Segurança (Helmet)

- ✅ Content Security Policy (CSP)
- ✅ X-Frame-Options (previne clickjacking)
- ✅ X-Content-Type-Options
- ✅ Strict-Transport-Security (HSTS)
- ✅ X-XSS-Protection

### Validação e Sanitização

- ✅ express-validator em rotas sensíveis
- ✅ Zod para validação de schemas (frontend)
- ✅ Sanitização de objetos com validator.js
- ✅ Limite de payload: 10MB

### Monitoramento

- ✅ Logs estruturados (Winston)
- ✅ Tracking de erros (Sentry)
- ✅ Auditoria de ações administrativas

---

## ⚠️ Melhorias Recomendadas

### 1. Rotação de Senhas

**Recomendação:** Implementar rotação automática de senhas.

```bash
# Script já existe: scripts/rotate-passwords.sh
# Executar periodicamente (ex: mensalmente via cron)
```

### 2. Secrets Management

**Recomendação:** Usar gerenciador de secrets (ex: HashiCorp Vault, AWS Secrets Manager).

**Status Atual:** Variáveis de ambiente (.env)  
**Ideal:** Secrets manager externo

### 3. Auditoria de Segurança

**Recomendação:** Implementar auditoria completa de ações sensíveis.

**Já Implementado:**
- ✅ Logs de login admin
- ✅ Logs de operações administrativas

**Pode Melhorar:**
- ⚠️ Dashboard de auditoria
- ⚠️ Alertas de ações suspeitas
- ⚠️ Retenção de logs configurável

### 4. Testes de Segurança

**Recomendação:** Implementar testes automatizados de segurança.

```bash
# Verificar vulnerabilidades
npm audit

# Scan de segurança (script existe)
npm run security:scan
```

### 5. Criptografia de Dados Sensíveis

**Recomendação:** Criptografar dados sensíveis no banco.

**Status Atual:**
- ✅ Senhas hash com SHA256 (admin)
- ✅ JWT tokens assinados
- ⚠️ Dados de cliente (endereços, telefones) não criptografados

**Recomendação:** Implementar criptografia AES-256 para dados sensíveis.

---

## 📋 Checklist de Verificação

### Pré-Deploy

- [ ] ✅ Todas as senhas hardcoded removidas
- [ ] ✅ Arquivo `.env` configurado (não commitado)
- [ ] ✅ `.env.example` atualizado sem senhas reais
- [ ] ✅ `.gitignore` contém `.env`
- [ ] ✅ `docker-compose.yml` usa variáveis de ambiente
- [ ] ✅ `ecosystem.config.cjs` usa apenas variáveis de ambiente
- [ ] ✅ Todas as dependências atualizadas (`npm audit`)
- [ ] ✅ Testes de segurança executados (`npm run security:scan`)
- [ ] ✅ Rate limiting configurado e testado
- [ ] ✅ CORS configurado para domínio de produção
- [ ] ✅ HTTPS configurado em produção
- [ ] ✅ Certificados SSL válidos e renováveis

### Pós-Deploy

- [ ] ✅ Conexão com banco de dados testada
- [ ] ✅ Autenticação funcionando (login admin/cliente)
- [ ] ✅ Rate limiting ativo e funcionando
- [ ] ✅ Logs sendo gerados corretamente
- [ ] ✅ Sentry configurado e capturando erros
- [ ] ✅ Backup automático configurado
- [ ] ✅ Monitoramento de performance ativo

### Manutenção Mensal

- [ ] ⚠️ Executar `npm audit` e corrigir vulnerabilidades
- [ ] ⚠️ Revisar logs de segurança
- [ ] ⚠️ Verificar tentativas de acesso suspeitas
- [ ] ⚠️ Rotacionar senhas (se necessário)
- [ ] ⚠️ Atualizar dependências críticas
- [ ] ⚠️ Revisar permissões de usuários admin

---

## 🔧 Ferramentas de Segurança

### Scripts Disponíveis

```bash
# Verificar vulnerabilidades NPM
npm audit

# Scan de segurança do projeto
npm run security:scan

# Verificar segurança (script bash)
npm run security:check

# Rotacionar senhas
npm run security:rotate-passwords

# Testar conexão MySQL
npm run mysql:test
```

### Comandos Úteis

```bash
# Buscar senhas hardcoded
grep -r "RSM_Rg51gti66\|rg51gt66" .

# Verificar arquivos .env não commitados
git ls-files | grep "\.env$"

# Verificar permissões de arquivos sensíveis
find . -name ".env*" -type f -ls

# Verificar variáveis de ambiente em uso
grep -r "process.env" server/ src/ --include="*.js" --include="*.ts" --include="*.cjs"
```

---

## 📚 Recursos Adicionais

### Documentação

- [Guia de Segurança](docs/CRONOGRAMA_MELHORIAS.md)
- [Correções de Segurança Aplicadas](docs/CORRECOES_SEGURANCA_SENHAS.md)
- [Plano de Melhorias de Segurança](PLANO_ACAO_PRIORITARIO.md)

### Referências Externas

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 📞 Contato

Para questões de segurança:
- 📧 Email: suporte@muhlstore.com.br
- 📱 WhatsApp: (número)

**⚠️ IMPORTANTE:** Se encontrar uma vulnerabilidade de segurança, **não abra uma issue pública**. Entre em contato diretamente com a equipe.

---

**Última atualização:** 11 de Janeiro de 2025  
**Próxima revisão:** 11 de Fevereiro de 2025
