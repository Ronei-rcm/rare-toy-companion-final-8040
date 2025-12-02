# ⚡ Ações Necessárias - Janeiro 2025

**Data:** 11 de Janeiro de 2025  
**Status:** 🔴 Ação Requerida

---

## 🚨 Problemas Identificados

1. **Erro 401 Unauthorized** - Código compilado desatualizado
2. **Imagem quebrada sendo carregada** - `1762878398817-138452280.png`

---

## ✅ Solução: Rebuild Completo

### Passo 1: Rebuild do Frontend

```bash
cd /home/git-muhlstore/rare-toy-companion-final-8040
npm run build
```

**Tempo estimado:** 2-5 minutos

### Passo 2: Reiniciar Servidor Backend

```bash
pm2 restart api
```

**Verificar status:**
```bash
pm2 status
```

### Passo 3: Reiniciar Frontend (se usar PM2)

```bash
pm2 restart frontend
# ou
pm2 restart all
```

### Passo 4: Limpar Cache do Navegador

**Opção 1 - Limpar Cache:**
- Pressione `Ctrl + Shift + Delete`
- Selecione "Imagens e arquivos em cache"
- Clique em "Limpar dados"

**Opção 2 - Modo Anônimo:**
- Abra uma janela anônima/privada
- Acesse o site

### Passo 5: Fazer Login Novamente

1. Acesse `/admin/login`
2. Faça login com suas credenciais
3. O token será salvo automaticamente

---

## 🔍 Verificação Pós-Rebuild

### 1. Console do Navegador

Abra DevTools (F12) e verifique:

✅ **Não deve haver:**
- Erros 401 (Unauthorized)
- Warnings de DialogContent sem Description
- Erros de carregamento de imagens quebradas

✅ **Deve aparecer:**
- `✅ Service Worker registrado com sucesso`
- `🔍 Verificando imagens quebradas no localStorage...`

### 2. Network Tab

1. Abra DevTools → Network
2. Recarregue a página
3. Procure por requisições para `/api/admin/marketplace/sellers`
4. Clique na requisição
5. Veja a aba "Headers"
6. **Verifique:** Deve ter header `X-Admin-Token`
7. **Status:** Deve ser `200 OK` (não 401)

### 3. Funcionalidades

✅ Marketplace Admin deve carregar vendedores  
✅ Deve ser possível criar/editar vendedores  
✅ Não deve haver erros 401

---

## 🐛 Se o Problema Persistir

### Verificar Token

No console do navegador:
```javascript
console.log('Token:', localStorage.getItem('admin_token'));
```

Se retornar `null`:
1. Faça login novamente
2. Verifique se o token foi salvo

### Verificar Logs do Servidor

```bash
pm2 logs api --lines 50
```

Procure por:
- `Token de administrador necessário`
- `unauthorized`
- `X-Admin-Token`

### Verificar Código Compilado

O arquivo compilado deve ter sido atualizado:
```bash
ls -lh dist/assets/*.js | head -5
```

Verifique a data de modificação - deve ser recente.

---

## 📋 Checklist Completo

- [ ] `npm run build` executado com sucesso
- [ ] Backend reiniciado (`pm2 restart api`)
- [ ] Frontend reiniciado (se usar PM2)
- [ ] Cache do navegador limpo
- [ ] Login feito novamente
- [ ] Console sem erros 401
- [ ] Network tab mostra header `X-Admin-Token`
- [ ] Marketplace Admin funcionando
- [ ] Sem warnings de DialogContent

---

## ⚡ Comando Rápido (Tudo de Uma Vez)

```bash
cd /home/git-muhlstore/rare-toy-companion-final-8040 && \
npm run build && \
pm2 restart api && \
pm2 restart frontend 2>/dev/null || true && \
echo "✅ Rebuild completo! Agora:"
echo "1. Limpe o cache do navegador (Ctrl+Shift+Delete)"
echo "2. Faça login novamente em /admin/login"
echo "3. Teste o Marketplace Admin"
```

---

## 📝 Notas Importantes

1. **O código fonte está correto** - As correções foram aplicadas
2. **O problema é o bundle compilado** - Precisa ser reconstruído
3. **Cache do navegador** - Pode estar servindo versão antiga
4. **Token de autenticação** - Pode ter expirado, faça login novamente

---

## 🎯 Resultado Esperado

Após seguir todos os passos:

✅ Código compilado atualizado  
✅ Autenticação funcionando  
✅ Erros 401 resolvidos  
✅ Imagens quebradas bloqueadas  
✅ Warnings de acessibilidade corrigidos  
✅ Sistema funcionando normalmente

---

**Última atualização:** 11 de Janeiro de 2025  
**Prioridade:** 🔴 Alta - Ação Imediata Necessária

