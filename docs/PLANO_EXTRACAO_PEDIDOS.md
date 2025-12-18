# 📦 Plano de Extração - Módulo de Pedidos

**Data:** 11 de Janeiro de 2025  
**Status:** 📋 Planejado  
**Observação:** Já existe `routes/orders.cjs` - precisa consolidar e extrair rotas restantes do `server.cjs`

---

## 📊 Situação Atual

### Rotas já modularizadas
- ✅ `server/routes/orders.cjs` - Já existe (precisa verificar conteúdo)
- ✅ `server/routes/admin-orders.cjs` - Rotas admin de pedidos
- ✅ `server/routes/admin-orders-advanced.cjs` - Rotas admin avançadas
- ✅ `server/routes/orders-sync.cjs` - Sincronização de pedidos

### Rotas ainda no server.cjs (24 rotas encontradas)

1. `POST /api/orders` (linha 5386)
2. `POST /api/orders/:id/pix` (linha 5685)
3. `GET /api/orders/:id/status` (linha 5901)
4. `POST /api/orders/:id/infinitetap-result` (linha 5934)
5. `POST /api/orders/:id/confirm-payment` (linha 6044)
6. `GET /api/orders` (linha 6069) - Lista pedidos
7. `PATCH /api/orders/:id/associate-customer` (linha 7542)
8. `GET /api/orders/stats` (linha 7680)
9. `PATCH /api/orders/:id/status` (linha 7862)
10. `POST /api/orders/:id/tracking` (linha 7934)
11. `PATCH /api/orders/:id/associate-user` (linha 7977)
12. `POST /api/orders/bulk-action` (linha 8051)
13. `GET /api/orders/:orderId/status` (linha 10040) - Duplicado?
14. `GET /api/orders/stats` (linha 11116) - Duplicado?
15. `PATCH /api/orders/:id/status` (linha 11146) - Duplicado?
16. `PUT /api/orders/:id` (linha 11162)
17. `PATCH /api/orders/:id` (linha 11257)
18. `DELETE /api/orders/:id` (linha 11385)
19. `POST /api/orders/:id/reorder` (linha 11411)
20. `GET /api/orders/:id/invoice` (linha 11450)
21. `GET /api/orders/:id` (linha 11890)
22. `POST /api/orders/:id/reorder` (linha 12001) - Duplicado?
23. `POST /api/orders/:id/resend` (linha 12053)
24. `GET /api/orders/:id/timeline` (linha 12176)

**Total:** ~24 rotas (com algumas duplicatas aparentes)

---

## 🎯 Estratégia

### Fase 1: Análise
1. ⏳ Ler `server/routes/orders.cjs` existente
2. ⏳ Identificar quais rotas já estão lá
3. ⏳ Identificar duplicatas
4. ⏳ Mapear dependências

### Fase 2: Consolidação
1. ⏳ Adicionar rotas faltantes ao `orders.cjs` existente
2. ⏳ Criar `controllers/orders.controller.cjs` (se não existir)
3. ⏳ Criar `services/orders.service.cjs` (se não existir)
4. ⏳ Remover duplicatas

### Fase 3: Extração
1. ⏳ Mover lógica de negócio para services
2. ⏳ Mover validação/respostas para controllers
3. ⏳ Atualizar rotas para usar controllers
4. ⏳ Testar módulo

### Fase 4: Integração
1. ⏳ Comentar rotas antigas no `server.cjs`
2. ⏳ Testar aplicação completa
3. ⏳ Remover código antigo
4. ⏳ Limpar imports

---

## 📁 Estrutura Proposta

```
server/
├── routes/
│   ├── orders.cjs                    # Rotas principais (consolidar)
│   ├── admin-orders.cjs              # Já existe ✅
│   ├── admin-orders-advanced.cjs     # Já existe ✅
│   └── orders-sync.cjs               # Já existe ✅
├── controllers/
│   └── orders.controller.cjs         # Criar/atualizar
└── services/
    └── orders.service.cjs            # Criar/atualizar
```

---

## 📋 Rotas por Categoria

### Rotas Principais (Clientes)
- GET `/api/orders` - Lista pedidos do usuário
- GET `/api/orders/:id` - Detalhes do pedido
- POST `/api/orders` - Criar pedido
- PUT `/api/orders/:id` - Atualizar pedido
- PATCH `/api/orders/:id` - Atualizar parcial
- DELETE `/api/orders/:id` - Deletar pedido

### Rotas de Status
- GET `/api/orders/:id/status` - Status do pedido
- PATCH `/api/orders/:id/status` - Atualizar status

### Rotas de Pagamento
- POST `/api/orders/:id/pix` - Gerar PIX
- POST `/api/orders/:id/confirm-payment` - Confirmar pagamento
- POST `/api/orders/:id/infinitetap-result` - Resultado InfiniteTap

### Rotas de Ação
- POST `/api/orders/:id/reorder` - Reordenar
- POST `/api/orders/:id/resend` - Reenviar
- POST `/api/orders/bulk-action` - Ações em massa

### Rotas de Informações
- GET `/api/orders/stats` - Estatísticas
- GET `/api/orders/:id/invoice` - Nota fiscal
- GET `/api/orders/:id/timeline` - Timeline do pedido
- POST `/api/orders/:id/tracking` - Rastreamento

### Rotas de Associação
- PATCH `/api/orders/:id/associate-customer` - Associar cliente
- PATCH `/api/orders/:id/associate-user` - Associar usuário

---

## 🔧 Dependências Necessárias

### Middlewares
- Rate limiting (`highFrequencyLimiter`)
- Autenticação (`authenticateToken`)
- Cache (se aplicável)

### Utilitários
- Pool de conexão (já existe `server/database/pool.cjs`)
- Helpers (já existe `server/utils/helpers.cjs`)

### Serviços Externos
- Integração com gateway de pagamento
- Integração com InfiniteTap
- Sistema de tracking

---

## ⚠️ Pontos de Atenção

1. **Duplicatas:** Há rotas duplicadas aparentes - precisa consolidar
2. **Complexidade:** Rotas de pedidos têm muita lógica de negócio
3. **Dependências:** Integrações com sistemas externos
4. **Transações:** Muitas operações precisam de transações SQL

---

## 📊 Progresso Esperado

```
Análise:           0%  ⏳
Consolidação:      0%  ⏳
Extração:          0%  ⏳
Integração:        0%  ⏳

TOTAL:             0%  ⏳
```

---

## 🎯 Meta

- ✅ Todas as rotas de pedidos no `server.cjs` extraídas
- ✅ Módulo de pedidos consolidado e organizado
- ✅ Controllers e services criados
- ✅ Código antigo removido
- ✅ Módulo testado e funcionando

---

**Status:** 📋 Planejado - Aguardando Análise  
**Última Atualização:** 11 de Janeiro de 2025
