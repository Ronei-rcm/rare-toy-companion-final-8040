# 📦 Plano de Extração - Módulo de Produtos

**Data:** 11 de Janeiro de 2025  
**Módulo:** Produtos  
**Status:** 📋 Planejado

---

## 📊 Rotas Identificadas

### Rotas Principais de Produtos

1. **GET** `/api/produtos` (linha 1253)
   - Lista produtos com paginação e filtros
   - Cache middleware aplicado
   - Rate limiting aplicado

2. **GET** `/api/produtos/destaque` (linha 1366)
   - Produtos em destaque

3. **GET** `/api/produtos/categoria/:categoria` (linha 1837)
   - Produtos por categoria

4. **GET** `/api/produtos/:id` (linha 1968)
   - Detalhes de um produto específico
   - Cache aplicado

5. **POST** `/api/produtos/quick-add-test` (linha 2026)
   - Teste rápido de adição (sem upload)

6. **POST** `/api/produtos/quick-add` (linha 2092)
   - Adição rápida de produto (com upload)

7. **POST** `/api/produtos` (linha 2263)
   - Criar novo produto

8. **PUT** `/api/produtos/:id` (linha 2362)
   - Atualizar produto existente

9. **DELETE** `/api/produtos/:id` (linha 2521)
   - Deletar produto

### Rotas de Reviews (Produtos)

10. **GET** `/api/products/:productId/reviews` (linha 10768)
11. **POST** `/api/products/:productId/reviews` (linha 10790)
12. **GET** `/api/products/:productId/reviews/stats` (linha 10877)

### Rotas de Coleções (Relacionadas)

13. **GET** `/api/collections/:id/products` (linha 3232)
14. **POST** `/api/collections/:id/products` (linha 8605)
15. **DELETE** `/api/collections/:id/products/:productId` (linha 8658)
16. **PATCH** `/api/collections/:id/products/reorder` (linha 8709)

**Total:** 16 rotas relacionadas a produtos

---

## 📁 Estrutura Proposta

```
server/
├── routes/
│   └── products.routes.cjs      # Todas as rotas de produtos
├── controllers/
│   └── products.controller.cjs  # Lógica de controle
└── services/
    └── products.service.cjs     # Acesso ao banco e lógica de negócio
```

---

## 🔄 Plano de Extração

### Passo 1: Criar Arquivos Base
- [ ] Copiar template para `routes/products.routes.cjs`
- [ ] Copiar template para `controllers/products.controller.cjs`
- [ ] Copiar template para `services/products.service.cjs`
- [ ] Configurar imports e exports básicos

### Passo 2: Extrair Rotas Principais
- [ ] Extrair GET `/api/produtos` (lista)
- [ ] Extrair GET `/api/produtos/:id` (detalhes)
- [ ] Extrair GET `/api/produtos/destaque`
- [ ] Extrair GET `/api/produtos/categoria/:categoria`
- [ ] Testar rotas extraídas

### Passo 3: Extrair Rotas de Criação/Atualização
- [ ] Extrair POST `/api/produtos`
- [ ] Extrair POST `/api/produtos/quick-add`
- [ ] Extrair PUT `/api/produtos/:id`
- [ ] Extrair DELETE `/api/produtos/:id`
- [ ] Testar rotas extraídas

### Passo 4: Extrair Rotas de Reviews
- [ ] Extrair rotas de reviews
- [ ] Criar controller e service para reviews
- [ ] Testar integração

### Passo 5: Integrar no server.cjs
- [ ] Remover rotas antigas do server.cjs
- [ ] Importar router de produtos
- [ ] Registrar rotas: `app.use('/api/produtos', productsRouter)`
- [ ] Testar aplicação completa

### Passo 6: Refatorar Lógica
- [ ] Mover queries SQL para services
- [ ] Mover lógica de negócio para services
- [ ] Manter apenas validação e resposta nos controllers
- [ ] Testar novamente

---

## ⚠️ Dependências Identificadas

### Middlewares Necessários
- `productsLimiter` - Rate limiting
- `productsCacheMiddleware` - Cache Redis
- `authenticateAdmin` - Para rotas admin

### Utilitários Necessários
- `pool` - Conexão MySQL
- `getPublicUrl()` - Função helper para URLs
- `multer` - Para uploads (quick-add)

### Configurações
- Redis cache config
- Security config
- Logger

---

## ✅ Critérios de Sucesso

1. **Funcionalidade**
   - Todas as rotas funcionando
   - Sem regressões
   - Performance mantida

2. **Código**
   - Rotas extraídas do server.cjs
   - Código organizado em camadas
   - Reutilizável

3. **Testes**
   - Testes básicos passando
   - Integração funcionando

4. **Documentação**
   - Comentários no código
   - README atualizado

---

## 📝 Notas Importantes

### Considerações
- Manter compatibilidade com frontend existente
- Não quebrar URLs existentes
- Manter cache funcionando
- Manter rate limiting

### Decisões Técnicas
- Usar `/api/produtos` como prefixo (português)
- Reviews podem ficar no mesmo módulo ou separado
- Coleções podem ficar em módulo separado

---

## 🎯 Próximos Passos

1. ✅ Plano criado
2. ⏳ Criar arquivos base
3. ⏳ Começar extração incremental
4. ⏳ Testar após cada etapa

---

**Status:** 📋 Pronto para Iniciar Extração  
**Última Atualização:** 11 de Janeiro de 2025
