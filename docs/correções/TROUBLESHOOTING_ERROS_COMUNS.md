# 🔧 Troubleshooting - Erros Comuns

**Data:** 11 de Janeiro de 2025  
**Status:** Em Produção

---

## 🚨 Problemas Identificados

### 1. ⚠️ Erro de Certificado SSL no Service Worker

**Sintoma:**
```
⚠️ Erro de certificado SSL ao registrar Service Worker: Failed to register a ServiceWorker for scope ('https://muhlstore.re9suainternet.com.br/') with script ('https://muhlstore.re9suainternet.com.br/sw.js'): An SSL certificate error occurred when fetching the script.
```

**Causa:**
- Certificado SSL expirado ou inválido no servidor de produção
- Certificado auto-assinado não confiável
- Cadeia de certificados incompleta

**Impacto:**
- ⚠️ **Baixo** - O app funciona normalmente, mas sem recursos offline (PWA)
- O Service Worker é opcional para o funcionamento básico da aplicação

**Status Atual:**
- ✅ O código já trata o erro graciosamente
- ✅ Não bloqueia o funcionamento da aplicação
- ⚠️ Precisa renovar/ajustar o certificado SSL

**Soluções:**

#### Opção 1: Renovar Certificado SSL (Recomendado)

```bash
# 1. Verificar certificado atual
openssl s_client -connect muhlstore.re9suainternet.com.br:443 -showcerts

# 2. Renovar certificado Let's Encrypt (se usar)
certbot renew --nginx

# 3. Reiniciar servidor web
sudo systemctl restart nginx
# ou
pm2 restart web
```

#### Opção 2: Verificar Configuração Nginx

```nginx
# Verificar se o certificado está configurado corretamente
server {
    listen 443 ssl http2;
    server_name muhlstore.re9suainternet.com.br;

    ssl_certificate /etc/letsencrypt/live/muhlstore.re9suainternet.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/muhlstore.re9suainternet.com.br/privkey.pem;

    # Certificar-se de que sw.js é servido corretamente
    location /sw.js {
        add_header Cache-Control "no-cache";
        proxy_cache_bypass $http_upgrade;
        proxy_pass http://localhost:8040/sw.js;
    }
}
```

#### Opção 3: Desabilitar Service Worker Temporariamente (Não Recomendado)

Se não for possível corrigir o certificado imediatamente, o código já trata o erro e não impede o funcionamento. Mas se quiser desabilitar completamente:

```typescript
// src/main.tsx - Comentar o registro do Service Worker
// if ('serviceWorker' in navigator) {
//   ... código do SW ...
// }
```

**Verificação:**
```bash
# Testar certificado
curl -I https://muhlstore.re9suainternet.com.br/sw.js

# Verificar se retorna 200 OK sem erros SSL
```

---

### 2. ❌ Erro 401 - Login: "Este email não possui senha cadastrada"

**Sintoma:**
```
/api/auth/login:1 Failed to load resource: the server responded with a status of 401 ()
Erro no login: Error: Este email não possui senha cadastrada. Use "Esqueci minha senha" para definir uma senha ou tente se registrar novamente.
```

**Causa:**
- Usuário existe no banco de dados (`users` ou `customers`) mas não possui `password_hash`
- Isso pode acontecer quando:
  - Usuário foi criado manualmente no banco
  - Migração de dados antigos sem senha
  - Registro incompleto

**Impacto:**
- ⚠️ **Médio** - Impede login do usuário afetado
- Não afeta outros usuários com senha cadastrada

**Localização do Código:**
- **Backend:** `server/server.cjs` (linhas 4174-4188)
- **Frontend:** `src/pages/auth/Login.tsx`

**Soluções:**

#### Opção 1: Criar/Redefinir Senha via "Esqueci Minha Senha" (Recomendado)

1. Na tela de login, clicar em "Esqueci minha senha"
2. Informar o email do usuário
3. Verificar email e seguir instruções para criar nova senha

**Endpoint:**
```
POST /api/auth/forgot-password
```

#### Opção 2: Adicionar Senha Manualmente no Banco (Admin)

```sql
-- 1. Verificar usuário
SELECT id, email, nome, password_hash FROM users WHERE email = 'usuario@exemplo.com';

-- 2. Criar hash da nova senha (usando bcrypt via script)
-- Script: node scripts/add-password-to-user.cjs usuario@exemplo.com "nova_senha123"
```

**Script disponível:**
```bash
node scripts/add-password-to-user.cjs usuario@exemplo.com "nova_senha123"
```

#### Opção 3: Criar Senha Programaticamente (Desenvolvimento)

```bash
# Usar script de criação de senha
node scripts/add-password-to-user.cjs email@exemplo.com "senha_segura123"
```

**Script:** `scripts/add-password-to-user.cjs`

#### Opção 4: Verificar e Corrigir Dados no Banco

```sql
-- Listar usuários sem senha
SELECT id, email, nome, created_at 
FROM users 
WHERE password_hash IS NULL OR password_hash = '';

-- Verificar se usuário existe em customers também
SELECT id, email, nome 
FROM customers 
WHERE email = 'usuario@exemplo.com';
```

**Código Backend (server/server.cjs):**

```javascript
// Linha 4174-4188
if (!user.senha_hash) {
  // Se não tem senha_hash, verificar se senha foi fornecida
  if (pass && pass.length > 0) {
    // Se senha foi fornecida mas usuário não tem hash
    return res.status(401).json({ 
      error: 'credenciais_invalidas',
      message: 'Este email não possui senha cadastrada. Por favor, use a opção "Esqueci minha senha" ou crie uma nova conta.'
    });
  }
}
```

**Prevenção Futura:**

1. **Validação no Frontend:**
```typescript
// Garantir que registro sempre cria senha
const handleRegister = async (data) => {
  if (!data.password || data.password.length < 6) {
    toast.error('Senha deve ter no mínimo 6 caracteres');
    return;
  }
  // ... resto do código
};
```

2. **Validação no Backend:**
```javascript
// Garantir que password_hash sempre é criado no registro
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  
  if (!password || password.length < 6) {
    return res.status(400).json({ 
      error: 'password_required',
      message: 'Senha é obrigatória e deve ter no mínimo 6 caracteres'
    });
  }
  
  // Criar hash antes de salvar
  const password_hash = await hashPassword(password);
  // ... salvar no banco
});
```

---

## 📋 Checklist de Verificação

### Para Erro SSL:
- [ ] Verificar data de expiração do certificado
- [ ] Renovar certificado Let's Encrypt (se usar)
- [ ] Testar acesso HTTPS manualmente
- [ ] Verificar configuração Nginx/Apache
- [ ] Testar se `/sw.js` é acessível via HTTPS

### Para Erro de Login:
- [ ] Verificar se usuário existe no banco
- [ ] Verificar se `password_hash` está NULL ou vazio
- [ ] Tentar usar "Esqueci minha senha"
- [ ] Criar senha via script se necessário
- [ ] Verificar logs do servidor para mais detalhes

---

## 🔍 Comandos Úteis

### Verificar Certificado SSL
```bash
# Verificar certificado
openssl s_client -connect muhlstore.re9suainternet.com.br:443 -showcerts

# Verificar expiração
echo | openssl s_client -servername muhlstore.re9suainternet.com.br -connect muhlstore.re9suainternet.com.br:443 2>/dev/null | openssl x509 -noout -dates

# Testar acesso HTTPS
curl -I https://muhlstore.re9suainternet.com.br/sw.js
```

### Verificar Usuários no Banco
```bash
# Ver usuários sem senha
mysql -u root -p -e "SELECT id, email, nome, password_hash IS NULL as sem_senha FROM users WHERE password_hash IS NULL OR password_hash = '';"

# Adicionar senha a usuário
node scripts/add-password-to-user.cjs email@exemplo.com "senha123"
```

### Ver Logs do Servidor
```bash
# Logs PM2
pm2 logs api --lines 50

# Filtrar erros de login
pm2 logs api --lines 200 --nostream | grep -i "login\|auth\|401"

# Filtrar erros SSL
pm2 logs api --lines 100 --nostream | grep -i "ssl\|certificate"
```

---

## 📚 Referências

- [Documentação de Segurança](SECURITY_CHECKLIST.md)
- [Documentação de Autenticação](docs/guias/GUIA_AUTENTICACAO.md)
- [Correções de Segurança](CORRECAO_SEGURANCA_RESUMO.md)

---

**Última atualização:** 11 de Janeiro de 2025
