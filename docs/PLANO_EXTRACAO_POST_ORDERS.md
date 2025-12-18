# 📋 Plano de Extração - POST /api/orders (Criar Pedido)

**Data:** 11 de Janeiro de 2025  
**Status:** 📋 Planejado  
**Complexidade:** 🔴 Alta  
**Linhas no server.cjs:** ~280 linhas (linha 5386-5682)

---

## 🎯 Objetivo

Extrair a rota POST `/api/orders` (criar pedido) do `server.cjs` para o módulo de pedidos.

---

## 📊 Análise da Rota

### Complexidade
- **Linhas de código:** ~280 linhas
- **Dependências:** Múltiplas (carrinho, sessão, automações, schema dinâmico)
- **Lógica complexa:** Validações, transações implícitas, schema dinâmico

### Fluxo da Rota

1. **Validação do Carrinho**
   - Obter cart_id (getOrCreateCartId)
   - Buscar itens do carrinho
   - Validar se carrinho não está vazio
   - Validar produtos existentes
   - Remover itens inválidos

2. **Obtenção do UserId**
   - Tentar da sessão (cookie session_id)
   - Tentar do body (user_id)
   - Tentar pelo email fornecido
   - Buscar em customers table

3. **Criação do Pedido**
   - Gerar orderId (UUID)
   - Calcular total
   - **Schema dinâmico:** DESCRIBE orders para descobrir colunas
   - Montar INSERT dinamicamente
   - Inserir pedido

4. **Inserção de Itens**
   - **Schema dinâmico:** DESCRIBE order_items
   - Para cada item do carrinho:
     - Montar INSERT dinâmico
     - Inserir order_item

5. **Limpeza**
   - Limpar carrinho (DELETE FROM cart_items)

6. **Automações** (opcional)
   - Buscar dados do cliente
   - Processar automações (orderAutomationService.processEvent)
   - Não falhar se automação falhar

7. **Resposta**
   - Formatar resposta
   - Retornar 201 com dados do pedido

---

## 🏗️ Estratégia de Extração

### Abordagem Incremental (Recomendada)

Dividir em métodos menores no service:

1. **Método: `createOrder(orderData, cartId, userId)`**
   - Encapsula criação completa do pedido
   - Retorna objeto do pedido criado

2. **Método: `createOrderItems(orderId, items)`**
   - Encapsula inserção de itens
   - Trata schema dinâmico

3. **Método: `clearCart(cartId)`**
   - Limpa carrinho após criação

4. **Método: `processOrderAutomations(orderId, orderData)`**
   - Processa automações (opcional)

### Estrutura Proposta

```javascript
// orders.service.cjs

async function create(orderData, cartId, userId) {
  // 1. Validar carrinho (usar getValidCartItems existente)
  // 2. Calcular total
  // 3. Criar pedido (schema dinâmico)
  // 4. Criar order_items
  // 5. Limpar carrinho
  // 6. Processar automações (opcional)
  // 7. Retornar pedido criado
}

async function createOrderWithDynamicSchema(orderData, cartId, userId) {
  // Lógica de DESCRIBE orders e INSERT dinâmico
}

async function createOrderItemsWithDynamicSchema(orderId, items) {
  // Lógica de DESCRIBE order_items e INSERT dinâmico
}

async function clearCart(cartId) {
  // Limpar carrinho
}

async function processOrderAutomations(orderId, orderData) {
  // Processar automações
}
```

---

## 🔧 Dependências Necessárias

### Funções Helper
- ✅ `getOrCreateCartId()` - Já existe em `helpers.cjs`
- ✅ `getValidCartItems()` - Já existe no service
- ✅ `getUserIdFromSessionOrEmail()` - Já existe no service

### Serviços Externos
- ⚠️ `orderAutomationService` - Existe mas é inicializado no server.cjs
  - **Decisão:** Passar como parâmetro opcional ou importar diretamente

### Pool
- ✅ Pool compartilhado já disponível

---

## 📝 Implementação Proposta

### Passo 1: Criar Métodos no Service

Adicionar ao `orders.service.cjs`:

```javascript
/**
 * Cria um novo pedido a partir do carrinho
 * 
 * @param {Object} orderData - Dados do pedido (nome, email, telefone, endereco, etc)
 * @param {string} cartId - ID do carrinho
 * @param {string|null} userId - ID do usuário (opcional)
 * @param {Object} orderAutomationService - Serviço de automações (opcional)
 * @returns {Promise<Object>} Pedido criado
 */
async function create(orderData, cartId, userId, orderAutomationService = null) {
  // Implementação aqui
}
```

### Passo 2: Criar Controller

Adicionar ao `orders.controller.cjs`:

```javascript
/**
 * Cria um novo pedido
 * POST /api/orders
 */
async function create(req, res) {
  try {
    const cartId = getOrCreateCartId(req, res);
    // ... lógica de obtenção de userId ...
    // Chamar service.create(...)
  } catch (error) {
    // Tratamento de erro
  }
}
```

### Passo 3: Adicionar Rota

Adicionar ao `orders.cjs`:

```javascript
/**
 * POST /api/orders
 * Cria um novo pedido
 */
router.post('/', async (req, res) => {
  try {
    return await ordersController.create(req, res);
  } catch (error) {
    // Tratamento de erro
  }
});
```

---

## ⚠️ Pontos de Atenção

1. **Schema Dinâmico**
   - A rota usa DESCRIBE para descobrir colunas
   - Precisa manter compatibilidade com diferentes schemas
   - Código complexo mas necessário

2. **OrderAutomationService**
   - Inicializado no server.cjs com setTimeout
   - Pode não estar disponível imediatamente
   - Precisa passar como parâmetro ou importar condicionalmente

3. **Transações**
   - Atualmente não usa transações explícitas
   - Se um INSERT falhar, pode deixar dados inconsistentes
   - **Recomendação:** Adicionar transações no service

4. **Validações**
   - Validar carrinho não vazio
   - Validar produtos existentes
   - Validar dados do pedido (opcional mas recomendado)

---

## 🧪 Testes Recomendados

1. **Criar pedido com carrinho válido**
2. **Criar pedido com carrinho vazio** (deve falhar)
3. **Criar pedido com produtos inválidos** (deve remover e continuar)
4. **Criar pedido com usuário logado**
5. **Criar pedido sem usuário** (guest checkout)
6. **Verificar automações processadas**
7. **Verificar carrinho limpo após criação**

---

## 📊 Estimativa

- **Complexidade:** Alta
- **Tempo estimado:** 2-3 horas
- **Riscos:** Média (schema dinâmico, automações)
- **Prioridade:** 🔥 Alta

---

## 🎯 Próximos Passos

1. ⏳ Implementar método `create()` no service
2. ⏳ Implementar métodos auxiliares (createOrderItems, etc)
3. ⏳ Implementar controller
4. ⏳ Adicionar rota ao orders.cjs
5. ⏳ Testar criação de pedido
6. ⏳ Validar automações
7. ⏳ Comentar rota antiga no server.cjs
8. ⏳ Remover código antigo após validação

---

**Status:** 📋 Planejado - Aguardando Implementação  
**Última Atualização:** 11 de Janeiro de 2025
