# 📦 Status da Extração - Módulo de Pedidos

**Data:** 11 de Janeiro de 2025  
**Status:** 🔄 Em Progresso

---

## ✅ Rotas Extraídas (3/24)

### Rotas CRUD Básicas
1. ✅ **GET `/api/orders`** - Lista pedidos do usuário
   - Controller: `ordersController.getAll`
   - Service: `ordersService.findAll`
   - Status: ✅ Extraída e registrada

2. ✅ **GET `/api/orders/:id`** - Detalhes do pedido
   - Controller: `ordersController.getById`
   - Service: `ordersService.findById`
   - Status: ✅ Extraída e registrada

3. ✅ **DELETE `/api/orders/:id`** - Deleta pedido
   - Controller: `ordersController.remove`
   - Service: `ordersService.remove`
   - Status: ✅ Extraída e registrada

---

## ⏳ Rotas Pendentes (21/24)

### CRUD Básicas (1 rota)
4. ⏳ **POST `/api/orders`** - Criar pedido (linha 5386)
   - Complexidade: Alta
   - Dependências: Carrinho, validações, transações

### Rotas de Pagamento (3 rotas) 🔥
5. ⏳ POST `/api/orders/:id/pix` - Gerar PIX (linha 5685)
6. ⏳ POST `/api/orders/:id/confirm-payment` - Confirmar pagamento (linha 6044)
7. ⏳ POST `/api/orders/:id/infinitetap-result` - InfiniteTap (linha 5934)

### Rotas de Ação (3 rotas)
8. ⏳ POST `/api/orders/:id/reorder` - Reordenar (linhas 11411, 12001)
9. ⏳ POST `/api/orders/:id/resend` - Reenviar (linha 12053)
10. ⏳ POST `/api/orders/bulk-action` - Ações em massa (linha 8051)

### Rotas de Informações (5 rotas)
11. ⏳ GET `/api/orders/:id/status` - Status (linhas 5901, 10040)
12. ⏳ GET `/api/orders/stats` - Estatísticas (linhas 7680, 11116)
13. ⏳ GET `/api/orders/:id/invoice` - Nota fiscal (linha 11450)
14. ⏳ GET `/api/orders/:id/timeline` - Timeline (linha 12176)
15. ⏳ POST `/api/orders/:id/tracking` - Tracking (linha 7934)

### Rotas de Associação (2 rotas)
16. ⏳ PATCH `/api/orders/:id/associate-customer` (linha 7542)
17. ⏳ PATCH `/api/orders/:id/associate-user` (linha 7977)

### Rotas Duplicadas/Equivalentes (7 rotas)
18-24. Rotas que já existem de forma equivalente ou são duplicadas

---

## 📊 Progresso

```
Rotas Extraídas:       3/24 (12.5%)
Service/Controller:    ✅ Pronto
Routes:                🔄 Em progresso
────────────────────────────────────
TOTAL:                 ~12.5%
```

---

## 🎯 Próximos Passos

### Imediato
1. ⏳ Testar rotas GET e DELETE extraídas
2. ⏳ Validar funcionamento
3. ⏳ Comentar rotas antigas no server.cjs após validação

### Curto Prazo
4. ⏳ Criar service/controller para POST `/api/orders` (criar pedido)
5. ⏳ Extrair rotas de pagamento (PIX, confirm, infinitetap)
6. ⏳ Adicionar ao orders.cjs

### Médio Prazo
7. ⏳ Extrair rotas restantes conforme necessidade
8. ⏳ Remover código antigo do server.cjs
9. ⏳ Consolidar duplicatas

---

## ⚠️ Notas

- **Ordem das Rotas:** GET `/api/orders` deve vir ANTES de GET `/api/orders/:id` para evitar conflitos
- **Rotas Específicas:** Rotas como `/api/orders/stats` devem vir ANTES de rotas genéricas com parâmetros
- **Duplicatas:** Algumas rotas existem duplicadas no server.cjs - precisam ser consolidadas

---

**Status:** 🔄 3 Rotas Extraídas - Progresso: 12.5%  
**Última Atualização:** 11 de Janeiro de 2025
