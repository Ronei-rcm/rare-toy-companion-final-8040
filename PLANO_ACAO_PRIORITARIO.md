# 🎯 Plano de Ação Prioritário - Rare Toy Companion

**Data de Criação:** 11 de Janeiro de 2025  
**Versão:** 1.1.0  
**Prazo Total:** 3 meses (12 semanas)

---

## 📋 Visão Geral

Este plano foca nas **3 prioridades críticas** identificadas na avaliação completa do projeto:

1. 🔴 **Refatoração do Backend** (19.898 linhas → < 500)
2. 🔴 **Aumentar Cobertura de Testes** (10% → 70%)
3. 🟡 **Finalizar Segurança** (rotação de senhas + 2FA)

---

## 🔴 PRIORIDADE 1: Refatoração do Backend

### Situação Atual
```
server/server.cjs: 19.898 linhas ❌
Meta: < 500 linhas ✅
```

### Estrutura Proposta
```
server/
├── server.cjs                    # < 500 linhas (apenas inicialização)
├── routes/
│   ├── index.cjs                 # Agrega todas as rotas
│   ├── products.routes.cjs       # Rotas de produtos
│   ├── orders.routes.cjs         # Rotas de pedidos
│   ├── customers.routes.cjs      # Rotas de clientes
│   ├── admin.routes.cjs          # Rotas admin
│   ├── auth.routes.cjs           # Rotas de autenticação
│   └── financial.routes.cjs      # Rotas financeiras
├── controllers/
│   ├── products.controller.cjs   # Lógica de produtos
│   ├── orders.controller.cjs     # Lógica de pedidos
│   ├── customers.controller.cjs  # Lógica de clientes
│   └── admin.controller.cjs      # Lógica admin
├── services/
│   ├── products.service.cjs      # Serviços de produtos
│   ├── orders.service.cjs        # Serviços de pedidos
│   ├── inventory.service.cjs     # Serviços de estoque
│   └── payment.service.cjs       # Serviços de pagamento
└── middleware/
    └── (já existe)
```

### Cronograma Detalhado

#### Semana 1: Análise e Estrutura
**Dias 1-2: Análise**
- [ ] Mapear todas as rotas no `server.cjs`
- [ ] Identificar dependências entre rotas
- [ ] Documentar estrutura atual
- [ ] Criar lista de endpoints

**Dia 3: Criar Estrutura**
- [ ] Criar pastas `routes/`, `controllers/`, `services/`
- [ ] Criar arquivos base para cada módulo
- [ ] Configurar exports/imports

**Dias 4-5: Extrair Rotas de Produtos**
- [ ] Mover rotas `/api/products/*` para `products.routes.cjs`
- [ ] Criar `products.controller.cjs`
- [ ] Criar `products.service.cjs`
- [ ] Testar módulo isoladamente

**Entregáveis Semana 1:**
- ✅ Estrutura de pastas criada
- ✅ Rotas de produtos extraídas (~300 linhas removidas)

---

#### Semana 2: Extrair Rotas de Pedidos e Clientes

**Dias 1-2: Extrair Rotas de Pedidos**
- [ ] Mover rotas `/api/orders/*` para `orders.routes.cjs`
- [ ] Criar `orders.controller.cjs`
- [ ] Criar `orders.service.cjs`
- [ ] Testar módulo

**Dias 3-4: Extrair Rotas de Clientes**
- [ ] Mover rotas `/api/customers/*` para `customers.routes.cjs`
- [ ] Criar `customers.controller.cjs`
- [ ] Criar `customers.service.cjs`
- [ ] Testar módulo

**Dia 5: Refatorar server.cjs Principal**
- [ ] Importar módulos extraídos
- [ ] Remover código movido
- [ ] Testar aplicação completa

**Entregáveis Semana 2:**
- ✅ Rotas de pedidos extraídas (~400 linhas removidas)
- ✅ Rotas de clientes extraídas (~300 linhas removidas)
- ✅ `server.cjs` reduzido para ~18.000 linhas

---

#### Semana 3: Extrair Rotas Admin e Finalizar

**Dias 1-2: Extrair Rotas Admin**
- [ ] Mover rotas `/api/admin/*` para `admin.routes.cjs`
- [ ] Criar `admin.controller.cjs`
- [ ] Testar módulo

**Dias 3-4: Extrair Services Restantes**
- [ ] Identificar lógica de negócio
- [ ] Mover para services apropriados
- [ ] Atualizar controllers

**Dia 5: Refatoração Final e Testes**
- [ ] Reduzir `server.cjs` para < 500 linhas
- [ ] Testes completos da aplicação
- [ ] Documentação da nova estrutura

**Entregáveis Semana 3:**
- ✅ `server.cjs` < 500 linhas
- ✅ Todos os módulos funcionando
- ✅ Testes passando
- ✅ Documentação atualizada

---

### Métricas de Sucesso
- ✅ `server.cjs` com menos de 500 linhas
- ✅ Cada arquivo com menos de 500 linhas
- ✅ 100% dos testes passando
- ✅ Zero regressões funcionais
- ✅ Performance mantida ou melhorada

### ROI Esperado
- **Manutenibilidade:** +300%
- **Testabilidade:** +500%
- **Produtividade:** +200%
- **Onboarding:** +400%

---

## 🔴 PRIORIDADE 2: Aumentar Cobertura de Testes

### Situação Atual
```
Cobertura: ~10% ❌
Meta: 70% ✅
```

### Estratégia de Testes

#### Fase 1: Testes de Backend (Semana 4-5) - Meta: 40%

**Semana 4: APIs Críticas**
- [ ] Configurar coverage reports (Vitest/Istanbul)
- [ ] Testes de autenticação:
  - [ ] POST `/api/auth/login`
  - [ ] POST `/api/auth/logout`
  - [ ] POST `/api/auth/refresh`
  - [ ] GET `/api/auth/me`
- [ ] Testes de produtos:
  - [ ] GET `/api/products`
  - [ ] GET `/api/products/:id`
  - [ ] POST `/api/products` (admin)
- [ ] Testes de pedidos:
  - [ ] POST `/api/orders`
  - [ ] GET `/api/orders/:id`
  - [ ] PUT `/api/orders/:id`

**Semana 5: Services e Integrações**
- [ ] Testes de services:
  - [ ] `products.service.cjs`
  - [ ] `orders.service.cjs`
  - [ ] `inventory.service.cjs`
- [ ] Testes de integrações:
  - [ ] Pagamentos
  - [ ] Email
  - [ ] Cache (Redis)

**Entregáveis:**
- ✅ Cobertura de 40%
- ✅ Todas APIs críticas testadas

---

#### Fase 2: Testes de Integração e Frontend (Semana 6-7) - Meta: 60%

**Semana 6: Testes de Integração**
- [ ] Fluxo completo de pedido:
  - [ ] Adicionar ao carrinho
  - [ ] Checkout
  - [ ] Pagamento
  - [ ] Confirmação
- [ ] Testes E2E básicos (Cypress/Playwright):
  - [ ] Login → Compra → Confirmação
  - [ ] Admin: Criar produto → Publicar

**Semana 7: Testes de Frontend**
- [ ] Componentes críticos:
  - [ ] `CartContext.tsx`
  - [ ] `CheckoutRapido.tsx`
  - [ ] `OrdersUnified.tsx`
- [ ] Hooks principais:
  - [ ] `useCart`
  - [ ] `useAuth`
  - [ ] `useProducts`

**Entregáveis:**
- ✅ Cobertura de 60%
- ✅ Testes E2E funcionando

---

#### Fase 3: Cobertura Completa (Semana 8-9) - Meta: 70%

**Semana 8: Edge Cases e Segurança**
- [ ] Testes de edge cases
- [ ] Testes de segurança:
  - [ ] Rate limiting
  - [ ] CSRF protection
  - [ ] SQL injection prevention
- [ ] Testes de performance

**Semana 9: Finalização e CI/CD**
- [ ] Atingir 70% de cobertura
- [ ] Integrar testes no CI/CD
- [ ] Configurar coverage reports automáticos
- [ ] Documentar testes

**Entregáveis:**
- ✅ Cobertura de 70%
- ✅ CI/CD integrado
- ✅ Coverage reports automáticos

---

### Testes Prioritários (Ordem de Implementação)

1. **Autenticação** (Crítico - Semana 4)
2. **Pedidos** (Crítico - Semana 4)
3. **Produtos** (Importante - Semana 4)
4. **Checkout** (Crítico - Semana 6)
5. **Pagamentos** (Crítico - Semana 6)
6. **Services** (Importante - Semana 5)
7. **Frontend Components** (Importante - Semana 7)

### Métricas de Sucesso
- ✅ 70% de cobertura
- ✅ Todos testes críticos passando
- ✅ CI/CD integrado
- ✅ Coverage reports automáticos
- ✅ Zero regressões

### ROI Esperado
- **Bugs em Produção:** -80%
- **Confiança em Deploys:** +500%
- **Velocidade de Desenvolvimento:** +100%

---

## 🟡 PRIORIDADE 3: Finalizar Segurança

### Tarefas Imediatas (Esta Semana)

#### 1. Rotação de Senhas
- [ ] Executar script `scripts/rotate-passwords.sh`
- [ ] Verificar novas senhas no `.env`
- [ ] Testar conexões após rotação
- [ ] Documentar processo

**Tempo:** 30 minutos  
**Prioridade:** 🔴 CRÍTICA

---

#### 2. Implementar 2FA para Admin

**Semana 10: Implementação**
- [ ] Escolher biblioteca (speakeasy ou similar)
- [ ] Criar tabela `admin_2fa` no banco
- [ ] Endpoint para gerar QR code
- [ ] Endpoint para verificar token
- [ ] Atualizar login admin
- [ ] Página de configuração 2FA

**Semana 11: Testes e Documentação**
- [ ] Testes de 2FA
- [ ] Documentação de uso
- [ ] Backup codes
- [ ] Recovery process

**Entregáveis:**
- ✅ 2FA funcionando para admin
- ✅ QR code generation
- ✅ Backup codes
- ✅ Testes completos

---

#### 3. Auditoria de Segurança

**Semana 12: Revisão Completa**
- [ ] Revisar todas as rotas
- [ ] Verificar headers de segurança
- [ ] Testar rate limiting
- [ ] Verificar CSRF protection
- [ ] Penetration testing básico
- [ ] Documentar vulnerabilidades encontradas

**Entregáveis:**
- ✅ Relatório de segurança
- ✅ Vulnerabilidades corrigidas
- ✅ Recomendações implementadas

---

## 📅 Timeline Consolida do

```
┌─────────────────────────────────────────────────────────┐
│ SEMANA 1-3:  Refatoração Backend                        │
│ ✅ server.cjs: 19.898 → < 500 linhas                    │
├─────────────────────────────────────────────────────────┤
│ SEMANA 4-5:  Testes Backend (40% cobertura)            │
│ ✅ APIs críticas testadas                               │
├─────────────────────────────────────────────────────────┤
│ SEMANA 6-7:  Testes Integração/Frontend (60%)          │
│ ✅ E2E e componentes testados                           │
├─────────────────────────────────────────────────────────┤
│ SEMANA 8-9:  Cobertura Completa (70%)                  │
│ ✅ CI/CD integrado                                      │
├─────────────────────────────────────────────────────────┤
│ SEMANA 10-11: 2FA Admin                                │
│ ✅ 2FA implementado e testado                           │
├─────────────────────────────────────────────────────────┤
│ SEMANA 12:   Auditoria de Segurança                    │
│ ✅ Segurança 100%                                       │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Validação Final

### Refatoração
- [ ] `server.cjs` < 500 linhas
- [ ] Todos os módulos funcionando
- [ ] Zero regressões
- [ ] Performance mantida
- [ ] Documentação atualizada

### Testes
- [ ] 70% de cobertura
- [ ] CI/CD integrado
- [ ] Todos testes passando
- [ ] Coverage reports automáticos

### Segurança
- [ ] Senhas rotacionadas
- [ ] 2FA implementado
- [ ] Auditoria completa
- [ ] Vulnerabilidades corrigidas

---

## 📊 Métricas de Sucesso do Plano

| Métrica | Atual | Meta 3 Meses | Status |
|---------|-------|--------------|--------|
| server.cjs | 19.898 linhas | < 500 | ⏳ |
| Cobertura Testes | 10% | 70% | ⏳ |
| Segurança | 95% | 100% | ⏳ |
| Bugs/mês | ~20 | ~4 | ⏳ |
| Manutenibilidade | 6.5/10 | 9.5/10 | ⏳ |

---

## 🎯 Próximos Passos Imediatos

1. ✅ **Revisar este plano** com o time
2. ⏳ **Alocar recursos** para refatoração (2-3 devs)
3. ⏳ **Executar rotação de senhas** (30 min)
4. ⏳ **Iniciar Semana 1** da refatoração
5. ⏳ **Configurar ambiente de testes**

---

**Documentos Relacionados:**
- `docs/AVALIACAO_COMPLETA_E_EVOLUCOES.md` - Avaliação completa
- `AVALIACAO_PROJETO_RESUMO.md` - Resumo executivo
- `CHECKLIST_MELHORIAS.md` - Checklist detalhado

---

**Última Atualização:** 11 de Janeiro de 2025  
**Status:** 📋 Plano Criado - Aguardando Aprovação
