# 🔧 Troubleshooting - Recuperação de Senha

**Data:** 11 de Janeiro de 2025

---

## ❌ Problema: Não Consigo Recuperar a Senha

Se você está tendo problemas para recuperar a senha, siga este guia passo a passo:

---

## 🔍 Diagnóstico Passo a Passo

### 1. Verificar se as Colunas Existem no Banco

**Problema Comum:** As colunas `reset_token` e `reset_expires` podem não existir nas tabelas `users` e `customers`.

**Solução:**

```bash
# Executar script de verificação/criação de colunas
node scripts/check-reset-password-tables.cjs
```

**Ou manualmente no MySQL:**

```sql
-- Verificar se colunas existem
SELECT COLUMN_NAME 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_SCHEMA = 'rare_toy_companion' 
AND TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('reset_token', 'reset_expires');

-- Adicionar colunas em users (se não existirem)
ALTER TABLE `rare_toy_companion`.`users` 
ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `reset_expires` DATETIME NULL DEFAULT NULL;

-- Adicionar colunas em customers (se não existirem)
ALTER TABLE `rare_toy_companion`.`customers` 
ADD COLUMN IF NOT EXISTS `reset_token` VARCHAR(255) NULL DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `reset_expires` DATETIME NULL DEFAULT NULL;
```

---

### 2. Verificar Configuração de Email (SMTP)

**Problema Comum:** Email não está sendo enviado porque SMTP não está configurado.

**Verificar:**

```bash
# Verificar variáveis de ambiente
grep -E "SMTP|EMAIL" .env

# Deve conter:
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=seu-email@gmail.com
# SMTP_PASS=sua-senha-app
```

**Solução:**

1. Configure as variáveis SMTP no arquivo `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

2. Para Gmail, use uma "Senha de App":
   - Acesse: https://myaccount.google.com/apppasswords
   - Gere uma senha de app
   - Use essa senha no `SMTP_PASS`

---

### 3. Verificar Logs do Servidor

**Ver logs em tempo real:**

```bash
# Logs PM2
pm2 logs api --lines 50

# Filtrar erros de recuperação de senha
pm2 logs api --lines 200 --nostream | grep -i "reset\|forgot\|password\|email"
```

**Erros comuns nos logs:**

- `Unknown column 'reset_token'` → Execute `node scripts/check-reset-password-tables.cjs`
- `SMTP não configurado` → Configure variáveis SMTP no `.env`
- `Email não enviado` → Verifique credenciais SMTP

---

### 4. Verificar se Email Existe no Banco

**Verificar usuário:**

```sql
-- Buscar em users
SELECT id, email FROM `rare_toy_companion`.`users` WHERE email = 'seu@email.com';

-- Buscar em customers
SELECT id, email FROM `rare_toy_companion`.`customers` WHERE email = 'seu@email.com';
```

**Se não encontrar:**
- Verifique se digitou o email corretamente
- Verifique se o usuário foi cadastrado
- O sistema não revela se email existe (por segurança)

---

### 5. Testar Endpoint Diretamente

**Testar via cURL:**

```bash
# Testar forgot-password
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com"}'

# Em desenvolvimento, deve retornar resetUrl e token
```

**Verificar resposta:**
```json
{
  "ok": true,
  "message": "Se o email existir, você receberá um link para redefinir sua senha.",
  "resetUrl": "http://localhost:8040/auth/reset-password?token=...",
  "token": "..."
}
```

---

### 6. Verificar Rotas Frontend

**Verificar se rotas estão configuradas:**

```bash
# Verificar arquivo de rotas
grep -E "recuperar-senha|reset-password" src/routes/appRoutes.tsx
```

**Deve conter:**
```typescript
{ path: "/auth/recuperar-senha", element: <ForgotPassword /> },
{ path: "/auth/reset-password", element: <ResetPassword /> },
```

---

### 7. Problemas Específicos

#### ❌ Erro: "Email inválido"

**Causa:** Email não passou na validação

**Solução:**
- Verifique formato do email
- Use email válido (ex: `usuario@exemplo.com`)

#### ❌ Erro: "Token inválido ou expirado"

**Causa:** Token expirou (válido por 1 hora) ou token inválido

**Solução:**
- Solicite novo link de redefinição
- Use o link recebido por email (não compartilhe)

#### ❌ Erro: "Email não enviado"

**Causa:** SMTP não configurado ou credenciais inválidas

**Solução:**
- Verifique configuração SMTP no `.env`
- Teste credenciais SMTP
- Em desenvolvimento, veja o link no console do servidor

---

## 🛠️ Soluções Rápidas

### Solução 1: Executar Script de Verificação

```bash
# Verificar e criar colunas no banco
node scripts/check-reset-password-tables.cjs
```

### Solução 2: Verificar Email em Desenvolvimento

Em desenvolvimento, o servidor retorna `resetUrl` e `token` na resposta:

```javascript
// Ver no console do navegador (F12)
// Após solicitar reset, verifique o console do servidor:
// pm2 logs api --lines 50
```

### Solução 3: Testar Manualmente

```bash
# 1. Solicitar reset via API
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"seu@email.com"}'

# 2. Copiar token da resposta (desenvolvimento)
# 3. Acessar: http://localhost:8040/auth/reset-password?token=TOKEN_AQUI
```

---

## 📋 Checklist de Verificação

Execute este checklist para diagnosticar o problema:

- [ ] **Colunas do banco existem?**
  ```bash
  node scripts/check-reset-password-tables.cjs
  ```

- [ ] **SMTP configurado?**
  ```bash
  grep SMTP .env
  ```

- [ ] **Email existe no banco?**
  ```sql
  SELECT email FROM users WHERE email = 'seu@email.com';
  SELECT email FROM customers WHERE email = 'seu@email.com';
  ```

- [ ] **Endpoint funcionando?**
  ```bash
  curl -X POST http://localhost:3001/api/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@teste.com"}'
  ```

- [ ] **Rotas frontend configuradas?**
  ```bash
  grep "recuperar-senha\|reset-password" src/routes/appRoutes.tsx
  ```

- [ ] **Servidor rodando?**
  ```bash
  pm2 status
  ```

- [ ] **Sem erros no console?**
  - Abra DevTools (F12)
  - Vá em Console e Network
  - Solicite reset e verifique erros

---

## 🚨 Problemas Comuns e Soluções

### Problema: "Email não encontrado"

**Sintoma:** Sempre recebe mensagem de sucesso, mas não recebe email

**Causas possíveis:**
1. Email não existe no banco
2. SMTP não configurado (email não é enviado)
3. Email caiu em spam

**Solução:**
- Verifique logs do servidor: `pm2 logs api --lines 100`
- Verifique pasta de spam do email
- Em desenvolvimento, veja o link no console

---

### Problema: "Token inválido"

**Sintoma:** Link não funciona ao clicar

**Causas possíveis:**
1. Token expirou (válido por 1 hora)
2. Token já foi usado
3. URL incorreta

**Solução:**
- Solicite novo link de redefinição
- Use o link exato do email
- Verifique se token não expirou

---

### Problema: "Erro ao salvar token"

**Sintoma:** Log mostra "Erro ao salvar token"

**Causa:** Colunas `reset_token` e `reset_expires` não existem

**Solução:**
```bash
node scripts/check-reset-password-tables.cjs
```

---

## 📞 Suporte Adicional

Se nenhuma das soluções funcionar:

1. **Coletar informações:**
   ```bash
   # Logs do servidor
   pm2 logs api --lines 200 > logs-recuperacao-senha.txt
   
   # Verificar banco
   mysql -u root -p -e "DESCRIBE rare_toy_companion.users;" | grep reset
   mysql -u root -p -e "DESCRIBE rare_toy_companion.customers;" | grep reset
   ```

2. **Verificar erros no console do navegador:**
   - Abra DevTools (F12)
   - Vá em Console
   - Solicite reset e copie erros

3. **Testar endpoint manualmente:**
   ```bash
   curl -v -X POST http://localhost:3001/api/auth/forgot-password \
     -H "Content-Type: application/json" \
     -d '{"email":"seu@email.com"}'
   ```

---

**Última atualização:** 11 de Janeiro de 2025
