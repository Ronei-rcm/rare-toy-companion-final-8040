# 🔧 Melhoria: Registro Completa Cadastro de Usuários Sem Senha

**Data:** 11 de Janeiro de 2025  
**Problema:** Usuários existentes sem senha não conseguiam completar cadastro via registro

---

## 🐛 Problema

Quando um usuário já existe no banco mas não tem senha cadastrada:

1. **Login falha** com: "Este email não possui senha cadastrada"
2. **Registro falha** com: "Este email já está cadastrado" (409)

**Resultado:** Usuário fica travado - não consegue fazer login nem completar cadastro.

---

## ✅ Solução Implementada

### Melhoria no Endpoint `/api/auth/register`

Agora o endpoint de registro verifica se o usuário existe **sem senha** e permite completar o cadastro:

**Fluxo:**
1. ✅ Verifica se email existe em `users`
2. ✅ Se existe **E não tem senha**: Atualiza senha e completa cadastro
3. ✅ Se existe **E tem senha**: Retorna erro (email já em uso)
4. ✅ Se existe apenas em `customers`: Cria em `users` com senha
5. ✅ Se não existe: Cria novo usuário normalmente

---

## 📋 Código Implementado

### Completar Cadastro de Usuário Existente

```javascript
// Se usuário existe sem senha
if (!existingUser.password_hash || existingUser.password_hash.trim() === '') {
  // Atualizar senha e nome
  const pw = await hashPassword(pass);
  await pool.execute(
    'UPDATE users SET password_hash = ?, nome = COALESCE(?, nome), updated_at = NOW() WHERE email = ?',
    [pw, nome || null, mail]
  );
  
  // Garantir entrada em customers
  // Criar sessão e cookies
  // Retornar sucesso
}
```

---

## 🎯 Cenários de Uso

### Cenário 1: Usuário Sem Senha em `users`
```
Estado inicial:
- users: { email: "lucine@gmail.com", password_hash: null }

Ação:
- Usuário tenta se registrar com email "lucine@gmail.com" e senha "123456"

Resultado:
✅ Senha é cadastrada
✅ Nome é atualizado (se fornecido)
✅ Sessão criada
✅ Login automático
```

### Cenário 2: Usuário Apenas em `customers`
```
Estado inicial:
- customers: { email: "lucine@gmail.com", nome: "Lucine" }
- users: (não existe)

Ação:
- Usuário tenta se registrar

Resultado:
✅ Entrada criada em `users` com senha
✅ ID sincronizado entre customers e users
✅ Sessão criada
✅ Login automático
```

### Cenário 3: Usuário Com Senha
```
Estado inicial:
- users: { email: "lucine@gmail.com", password_hash: "hash123" }

Ação:
- Usuário tenta se registrar

Resultado:
❌ Erro 409: "Este email já está cadastrado. Tente fazer login ou use 'Esqueci minha senha'."
```

---

## ✅ Benefícios

1. ✅ **Usuários não ficam travados** - Podem completar cadastro mesmo se já existem
2. ✅ **Sincronização automática** - Garante entrada em `users` e `customers`
3. ✅ **Login automático** - Após completar cadastro, usuário já fica logado
4. ✅ **Segurança mantida** - Usuários com senha não podem ser sobrescritos

---

## 🔄 Fluxo Completo

```
1. Usuário tenta registrar
   ↓
2. Sistema verifica se email existe
   ↓
3a. Não existe → Cria novo usuário ✅
3b. Existe sem senha → Atualiza senha e completa cadastro ✅
3c. Existe com senha → Retorna erro (fazer login) ❌
   ↓
4. Sessão criada e usuário logado automaticamente
```

---

## 📝 Notas

- ✅ Senha sempre é hasheada com bcrypt (se disponível) ou SHA256
- ✅ Nome só é atualizado se fornecido no registro
- ✅ Sessão é criada automaticamente após registro
- ✅ Cookies são configurados corretamente

---

**Última Atualização:** 11 de Janeiro de 2025

