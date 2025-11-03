# 🚀 Guia Rápido de Testes do Carrinho

## 📋 Como Testar Rapidamente

### 1️⃣ Teste Visual Rápido (2 minutos)

1. **Abra a loja:** `http://localhost:5173/loja`
2. **Adicione um produto** clicando em "Adicionar ao Carrinho"
3. **Verifique:**
   - ✅ Toast de sucesso apareceu?
   - ✅ Drawer abriu automaticamente?
   - ✅ Contador no header atualizou?
   - ✅ Imagem do produto está visível?

### 2️⃣ Teste de Sincronização (3 minutos)

1. **Abra o drawer** do carrinho
2. **Aumente a quantidade** de um item
3. **Verifique:**
   - ✅ Total atualizou no drawer?
   - ✅ Total atualizou no header?
4. **Vá para** `/carrinho`
5. **Verifique:**
   - ✅ A quantidade está correta?
   - ✅ O total está correto?

### 3️⃣ Teste de Persistência (2 minutos)

1. **Adicione 2-3 produtos** ao carrinho
2. **Recarregue a página** (F5)
3. **Verifique:**
   - ✅ Os produtos ainda estão lá?
   - ✅ As quantidades estão corretas?

### 4️⃣ Teste Mobile (3 minutos)

1. **Abra as DevTools** (F12)
2. **Ative o modo mobile** (Ctrl+Shift+M)
3. **Teste:**
   - ✅ Drawer abre corretamente?
   - ✅ Gestos de arrastar funcionam?
   - ✅ Botões são touch-friendly?

### 5️⃣ Teste de Sugestões (2 minutos)

1. **Adicione produtos** de uma categoria
2. **Vá para** `/carrinho`
3. **Role até as sugestões**
4. **Verifique:**
   - ✅ Aparecem produtos relacionados?
   - ✅ Os badges estão corretos?
   - ✅ Ao clicar em adicionar, funciona?

---

## 🧪 Componente de Teste Automático

### Como Usar o CartSyncTester

1. **Importe o componente** em uma página de teste:
```tsx
import CartSyncTester from '@/components/debug/CartSyncTester';

// Em alguma página (ex: /test)
<CartSyncTester />
```

2. **Execute os testes** clicando no botão "Executar Testes"

3. **Veja os resultados** em tempo real

### O que ele testa:
- ✅ Adicionar produto
- ✅ LocalStorage
- ✅ Atualizar quantidade
- ✅ Contador do header
- ✅ Cálculo de total
- ✅ Remover produto
- ✅ Evento customizado (sincronização)

---

## 🐛 Troubleshooting Rápido

### Imagens não aparecem?
1. Verifique se o produto tem `imagemUrl` ou `image_url`
2. Confira se o placeholder.svg existe em `/public`
3. Veja o console para erros de CORS

### Drawer não abre?
1. Verifique se o `CartProvider` envolve a aplicação
2. Confira se o `state.isOpen` está mudando
3. Veja se há erros no console

### Sincronização falha?
1. Verifique se o backend está rodando
2. Confira as credenciais da API
3. Veja os erros de rede no DevTools

### Toast não aparece?
1. Verifique se o `useCartToast` está sendo usado
2. Confira se o container de toast está renderizado
3. Veja o z-index dos elementos

---

## ✅ Checklist Rápido de Deploy

Antes de fazer deploy, verifique:

- [ ] Todos os testes automáticos passaram
- [ ] Não há erros no console
- [ ] Imagens carregam corretamente
- [ ] Sincronização funciona em abas diferentes
- [ ] Mobile está responsivo
- [ ] Acessibilidade está OK (Tab navigation)
- [ ] Performance está boa (Lighthouse > 80)
- [ ] Backend está configurado corretamente

---

## 🚀 Pronto para Produção?

Se todos os testes passaram: **SIM!** ✅

Se algum teste falhou: **Revise e corrija antes!** ⚠️

---

**Boa sorte! 🎉**

