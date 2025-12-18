# 🎯 Próximos Passos - Refatoração Backend

**Data:** 11 de Janeiro de 2025  
**Status Atual:** 48% Completo

---

## 📊 Situação Atual

### ✅ Completado
- ✅ Avaliação completa do projeto (8.2/10)
- ✅ Estrutura modular criada
- ✅ Utilitários compartilhados
- ✅ **Módulo de Produtos: 100% (9 rotas)**
- ✅ **Módulo de Pedidos: 12.5% (3 rotas de 24)**
- ✅ Documentação extensiva (30+ documentos)

### 🔄 Em Progresso
- 🔄 Módulo de Pedidos (21 rotas pendentes)
- ⏳ Módulo de Clientes
- ⏳ Módulo Admin

---

## 🎯 Próximos Passos Prioritários

### 1. Testes e Validação (URGENTE) 🔥

**Objetivo:** Validar que os módulos criados funcionam corretamente antes de continuar

**Tarefas:**
- [ ] Testar módulo de produtos (9 rotas)
  - [ ] GET `/api/produtos` - Listar produtos
  - [ ] GET `/api/produtos/:id` - Detalhes
  - [ ] GET `/api/produtos/destaque` - Destaque
  - [ ] GET `/api/produtos/categoria/:categoria` - Por categoria
  - [ ] POST `/api/produtos` - Criar produto
  - [ ] PUT `/api/produtos/:id` - Atualizar
  - [ ] DELETE `/api/produtos/:id` - Deletar
  - [ ] POST `/api/produtos/quick-add` - Quick-add
  - [ ] POST `/api/produtos/quick-add-test` - Quick-add teste

- [ ] Testar rotas de pedidos extraídas (3 rotas)
  - [ ] GET `/api/orders` - Listar pedidos
  - [ ] GET `/api/orders/:id` - Detalhes
  - [ ] DELETE `/api/orders/:id` - Deletar

- [ ] Validar compatibilidade com frontend
- [ ] Verificar logs e erros
- [ ] Validar cache funcionando
- [ ] Validar rate limiting funcionando

**Após validação:**
- [ ] Comentar rotas antigas no `server.cjs`
- [ ] Testar novamente
- [ ] Remover código antigo se tudo funcionar

---

### 2. Continuar Módulo de Pedidos (ALTA PRIORIDADE) 🔥

**Objetivo:** Extrair as rotas críticas restantes de pedidos

#### 2.1. POST /api/orders (Criar Pedido) - CRÍTICO

**Complexidade:** Alta  
**Dependências:** Carrinho, validações, transações SQL

**Tarefas:**
- [ ] Analisar código atual no `server.cjs` (linha 5386)
- [ ] Criar método `create()` no `ordersService`
  - [ ] Validar carrinho
  - [ ] Criar pedido
  - [ ] Criar order_items
  - [ ] Limpar carrinho
  - [ ] Processar automações
- [ ] Criar método `create()` no `ordersController`
- [ ] Adicionar rota POST `/api/orders` no `orders.cjs`
- [ ] Testar criação de pedido

#### 2.2. Rotas de Pagamento (3 rotas) - CRÍTICO

**Rotas:**
- [ ] POST `/api/orders/:id/pix` - Gerar PIX (linha 5685)
- [ ] POST `/api/orders/:id/confirm-payment` - Confirmar pagamento (linha 6044)
- [ ] POST `/api/orders/:id/infinitetap-result` - InfiniteTap (linha 5934)

**Tarefas:**
- [ ] Criar service para pagamentos
- [ ] Criar controllers para cada rota
- [ ] Adicionar rotas ao `orders.cjs`
- [ ] Testar integrações

---

### 3. Extrair Módulo de Clientes (MÉDIA PRIORIDADE) 🟡

**Objetivo:** Modularizar rotas de clientes/usuários

**Tarefas:**
- [ ] Analisar rotas de clientes no `server.cjs`
- [ ] Identificar rotas a extrair
- [ ] Criar `customers.service.cjs`
- [ ] Criar `customers.controller.cjs`
- [ ] Criar `customers.routes.cjs`
- [ ] Registrar router no `server.cjs`
- [ ] Testar módulo

---

### 4. Extrair Módulo Admin (MÉDIA PRIORIDADE) 🟡

**Objetivo:** Modularizar rotas administrativas

**Observação:** Algumas rotas admin já existem separadas (`admin-orders.cjs`, etc.)

**Tarefas:**
- [ ] Identificar rotas admin ainda no `server.cjs`
- [ ] Consolidar com rotas admin existentes
- [ ] Criar services/controllers necessários
- [ ] Organizar estrutura
- [ ] Testar

---

### 5. Finalização e Limpeza (LONGO PRAZO) 🟢

**Objetivo:** Reduzir `server.cjs` para < 500 linhas

**Tarefas:**
- [ ] Remover todo código extraído
- [ ] Limpar imports não usados
- [ ] Validar que `server.cjs` está apenas com:
  - Configuração do Express
  - Middlewares globais
  - Registro de routers
  - Inicialização do servidor
- [ ] Reduzir para < 500 linhas
- [ ] Testes completos
- [ ] Documentação final

---

## 📋 Checklist de Progresso

### Fase 1: Validação (Esta Semana)
- [ ] Testar módulo de produtos
- [ ] Testar rotas de pedidos extraídas
- [ ] Validar compatibilidade frontend
- [ ] Remover código antigo validado

### Fase 2: Pedidos (Próximas 2 Semanas)
- [ ] POST `/api/orders` (criar pedido)
- [ ] Rotas de pagamento (3 rotas)
- [ ] Outras rotas de pedidos (17 rotas restantes)

### Fase 3: Outros Módulos (Próximo Mês)
- [ ] Módulo de Clientes
- [ ] Módulo Admin
- [ ] Outros módulos menores

### Fase 4: Finalização (Próximo Mês)
- [ ] Limpar `server.cjs`
- [ ] Reduzir para < 500 linhas
- [ ] Testes completos
- [ ] Documentação final

---

## ⚠️ Pontos de Atenção

1. **Ordem das Rotas:** Sempre colocar rotas específicas antes de genéricas
2. **Compatibilidade:** Garantir que frontend continue funcionando
3. **Testes:** Testar cada módulo após extração
4. **Duplicatas:** Identificar e consolidar rotas duplicadas
5. **Dependências:** Mapear dependências entre módulos

---

## 📊 Métricas de Sucesso

### Objetivos
- ✅ Reduzir `server.cjs` para < 500 linhas
- ✅ Modularizar 80%+ das rotas
- ✅ Manter 100% compatibilidade com frontend
- ✅ Documentar todas as mudanças

### Atual
- 🔄 `server.cjs`: ~19.800 linhas (redução: ~0.5%)
- 🔄 Rotas modularizadas: 17/423 (4%)
- ✅ Compatibilidade: Mantida (aguardando testes)
- ✅ Documentação: Completa

---

**Status:** 📋 Próximos Passos Definidos  
**Última Atualização:** 11 de Janeiro de 2025
