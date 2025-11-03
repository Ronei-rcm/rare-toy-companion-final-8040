# 🧪 GUIA COMPLETO DE TESTES - MUHLSTORE

## 📋 **COMANDOS DE TESTE**

```bash
# Rodar todos os testes (modo watch)
npm test

# Rodar uma vez (CI/CD)
npm run test:run

# Interface visual interativa
npm run test:ui

# Gerar relatório de cobertura
npm run test:coverage

# Rodar apenas um arquivo
npm test -- imageUtils.test.ts

# Rodar testes que contenham "cart" no nome
npm test -- --grep cart
```

---

## 🎯 **ESTRUTURA DE TESTES**

```
/src/tests/
  ├── setup.ts                        # Configuração global
  ├── utils/
  │   ├── imageUtils.test.ts         # Testes de utilitários de imagem
  │   └── accessibility.test.ts      # Testes de acessibilidade
  └── integration/
      └── api.test.ts                 # Testes de API
```

---

## ✅ **TESTES IMPLEMENTADOS**

### **1. Image Utils (9 testes)**
```typescript
✓ normalizeImageUrl - valores inválidos
✓ normalizeImageUrl - URLs completas
✓ normalizeImageUrl - caminhos relativos
✓ normalizeImageUrl - lovable-uploads
✓ getProductImage - múltiplos campos
✓ getProductImage - placeholder fallback
✓ getProductImage - priorização de campos
```

### **2. Accessibility (8 testes)**
```typescript
✓ generateAriaId - IDs únicos
✓ getAriaLoadingProps - loading states
✓ getAriaLoadingProps - not loading
✓ getAriaAlertProps - role alert para errors
✓ getAriaAlertProps - role status para info
✓ checkColorContrast - alto contraste
✓ checkColorContrast - baixo contraste
```

### **3. API Integration (3 testes)**
```typescript
✓ GET /api/produtos - lista produtos
✓ GET /api/produtos?categoria - filtros
✓ GET /api/health - health check
```

---

## 📊 **COBERTURA DE CÓDIGO**

Execute e veja o relatório HTML:
```bash
npm run test:coverage

# Abrir relatório no navegador
open coverage/index.html
```

**Metas de Cobertura:**
- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

---

## 🔍 **EXEMPLO DE TESTE UNITÁRIO**

```typescript
// src/tests/contexts/CartContext.test.tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from '@/contexts/CartContext';

describe('CartContext', () => {
  it('deve adicionar item ao carrinho', async () => {
    const wrapper = ({ children }) => <CartProvider>{children}</CartProvider>;
    const { result } = renderHook(() => useCart(), { wrapper });

    const produto = {
      id: '1',
      nome: 'Teste',
      preco: 10,
    };

    await act(async () => {
      await result.current.addItem(produto, 2);
    });

    expect(result.current.state.itens).toHaveLength(1);
    expect(result.current.state.quantidadeTotal).toBe(2);
    expect(result.current.state.total).toBe(20);
  });
});
```

---

## 🌐 **EXEMPLO DE TESTE DE INTEGRAÇÃO**

```typescript
// src/tests/integration/cart.test.ts
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../../server';

describe('Cart API', () => {
  it('POST /api/cart/items deve adicionar item', async () => {
    const response = await request(app)
      .post('/api/cart/items')
      .send({
        product_id: '123',
        name: 'Produto Teste',
        price: 10.00,
        quantity: 1
      });

    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
  });

  it('GET /api/cart deve retornar carrinho', async () => {
    const response = await request(app)
      .get('/api/cart');

    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
  });
});
```

---

## 🎨 **TESTE NO NAVEGADOR**

### **1. Carrinho:**
1. Adicionar produto → Ver toast com imagem
2. Abrir carrinho → Ver mensagens de incentivo
3. Scroll → Ver sugestões de produtos
4. Esperar 1h → Receber e-mail de recuperação

### **2. Pagamentos:**
1. Finalizar compra
2. Selecionar Apple Pay (Safari/iOS)
3. Ou Google Pay (Chrome/Android)
4. Ou Mercado Pago PIX

### **3. Acessibilidade:**
1. Navegar apenas com Tab
2. Pressionar Enter/Space para ativar
3. Testar com leitor de tela
4. Aumentar zoom para 200%

---

## 🐛 **TESTES MANUAIS IMPORTANTES**

### **Checklist de QA:**

#### **Carrinho:**
- [ ] Adicionar produto → Toast aparece com imagem
- [ ] Quantidade atualiza em tempo real
- [ ] Drawer sincroniza com página
- [ ] Badge no header anima
- [ ] Mensagens de incentivo aparecem
- [ ] Barra de progresso funciona
- [ ] Sugestões carregam

#### **Checkout:**
- [ ] Checkout rápido preenche dados
- [ ] Apple Pay aparece no Safari
- [ ] Google Pay aparece no Chrome
- [ ] PIX gera QR Code
- [ ] Webhook atualiza status

#### **E-mail:**
- [ ] E-mail de 1h chega
- [ ] E-mail de 24h com cupom
- [ ] Templates renderizam bem
- [ ] Links funcionam

#### **Segurança:**
- [ ] Rate limit bloqueia após limite
- [ ] CSRF token valida
- [ ] Headers de segurança presentes
- [ ] Inputs sanitizados

#### **Performance:**
- [ ] Imagens carregam lazy
- [ ] Cache Redis funciona
- [ ] Página carrega < 3s
- [ ] Lighthouse > 90

#### **Acessibilidade:**
- [ ] Tab navega logicamente
- [ ] Focus visível
- [ ] Contraste adequado
- [ ] Screen reader funciona

---

## 🔧 **TROUBLESHOOTING**

### **Testes Falhando:**
```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Limpar cache do Vitest
npx vitest --clearCache
```

### **Redis Não Conecta:**
```bash
# Verificar se está rodando
sudo systemctl status redis-server

# Iniciar
sudo systemctl start redis-server

# Testar conexão
redis-cli ping
# Deve retornar: PONG
```

### **E-mails Não Enviam:**
```bash
# Verificar configuração SMTP
node -e "const nodemailer = require('nodemailer'); nodemailer.createTransport({host: process.env.SMTP_HOST, port: process.env.SMTP_PORT, auth: {user: process.env.SMTP_USER, pass: process.env.SMTP_PASS}}).verify().then(console.log).catch(console.error)"
```

---

## 📈 **MÉTRICAS DE QUALIDADE**

Execute e veja os resultados:

```bash
# Lighthouse (Performance, Acessibilidade, SEO)
npm run build
npx serve dist
# Abra Chrome DevTools → Lighthouse

# Bundle analyzer
npm run build -- --analyze

# Cobertura de testes
npm run test:coverage
```

**Metas:**
- Lighthouse Performance: > 90
- Lighthouse Accessibility: > 95
- Lighthouse Best Practices: > 90
- Test Coverage: > 80%

---

## 🎓 **APRENDIZADO**

### **Conceitos Implementados:**
- ✅ Testing Library patterns
- ✅ Mock de APIs
- ✅ Snapshot testing
- ✅ Integration testing
- ✅ E2E testing concepts
- ✅ TDD workflow

### **Boas Práticas:**
- ✅ Arrange-Act-Assert pattern
- ✅ Isolation de testes
- ✅ Cleanup automático
- ✅ Mocks e stubs apropriados
- ✅ Testes descritivos

---

*Guia completo para garantir qualidade máxima do código!* 🚀
