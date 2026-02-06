# 🎯 Plano de Ação - Melhorias do Projeto

**Baseado em:** Avaliação Completa do Projeto  
**Data de Criação:** 11 de Janeiro de 2025  
**Priorização:** Por impacto e esforço

---

## 📊 Visão Geral

Este documento detalha o plano de ação para implementar as melhorias identificadas na avaliação do projeto, priorizadas por:

- 🔴 **CRÍTICO** - Impacto alto, esforço baixo (Fazer AGORA)
- 🟡 **IMPORTANTE** - Impacto alto, esforço médio (Próximas 2 semanas)
- 🟢 **DESEJÁVEL** - Impacto médio/alto, esforço variável (Próximo mês)

---

## 🔴 FASE 1: Críticas (Esta Semana)

### ✅ 1.1 Remover Senhas Hardcoded
**Status:** ✅ CONCLUÍDO  
**Tempo Estimado:** 30 minutos  
**Responsável:** Desenvolvedor

**Ações:**
- [x] Remover senha de `ecosystem.config.cjs`
- [x] Remover senhas de `docker-compose.yml`
- [x] Atualizar `env.example`
- [ ] **PENDENTE:** Rotacionar senhas no banco
- [ ] **PENDENTE:** Configurar `.env` com novas senhas
- [ ] **PENDENTE:** Testar aplicação

**Arquivos Modificados:**
- `ecosystem.config.cjs`
- `docker-compose.yml`
- `env.example`

**Documentação:** Ver `docs/CORRECOES_SEGURANCA_SENHAS.md`

---

### 🔴 1.2 Configurar CI/CD Básico
**Status:** 🔄 PENDENTE  
**Tempo Estimado:** 4-6 horas  
**Prioridade:** ALTA  
**Responsável:** DevOps/Backend

**Objetivo:** Automatizar testes e deploy básico

**Ações:**
- [ ] Criar `.github/workflows/ci.yml`
- [ ] Configurar testes automáticos
- [ ] Configurar lint automático
- [ ] Configurar build automático
- [ ] Configurar deploy automático em staging (opcional)

**Arquivo a Criar:**
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
  
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm audit --audit-level=moderate
```

**Benefícios:**
- ✅ Testes rodam automaticamente
- ✅ Bugs detectados antes do merge
- ✅ Qualidade de código garantida

---

## 🟡 FASE 2: Importantes (Próximas 2 Semanas)

### 🟡 2.1 Refatorar server.cjs
**Status:** 🔄 PENDENTE  
**Tempo Estimado:** 16-24 horas  
**Prioridade:** ALTA  
**Responsável:** Backend Lead

**Problema:** Arquivo com 17.500+ linhas dificulta manutenção

**Estrutura Proposta:**
```
server/
├── server.cjs              # Arquivo principal (minimal)
├── routes/
│   ├── products.routes.cjs
│   ├── orders.routes.cjs
│   ├── customers.routes.cjs
│   ├── admin.routes.cjs
│   ├── auth.routes.cjs
│   └── index.cjs
├── controllers/
│   ├── products.controller.cjs
│   ├── orders.controller.cjs
│   ├── customers.controller.cjs
│   └── admin.controller.cjs
├── services/
│   ├── products.service.cjs
│   ├── orders.service.cjs
│   └── customers.service.cjs
└── middleware/
    └── (já existe)
```

**Plano de Refatoração:**

**Semana 1:**
- [ ] Analisar server.cjs e identificar blocos lógicos
- [ ] Criar estrutura de pastas
- [ ] Extrair rotas de produtos (300 linhas)
- [ ] Extrair rotas de pedidos (400 linhas)
- [ ] Extrair rotas de clientes (300 linhas)
- [ ] Testar cada módulo extraído

**Semana 2:**
- [ ] Extrair controllers
- [ ] Extrair services
- [ ] Refatorar server.cjs para usar módulos
- [ ] Testes de integração
- [ ] Documentação

**Métricas de Sucesso:**
- ✅ server.cjs com menos de 500 linhas
- ✅ Cada arquivo com menos de 500 linhas
- ✅ 100% dos testes passando
- ✅ Nenhuma funcionalidade quebrada

---

### 🟡 2.2 Aumentar Cobertura de Testes
**Status:** 🔄 PENDENTE  
**Tempo Estimado:** 20-30 horas  
**Prioridade:** ALTA  
**Responsável:** Full-stack Developer  
**Meta:** 70% de cobertura

**Componentes Críticos para Testar:**

**Backend (Prioridade Alta):**
- [ ] `server/middleware/auth.cjs` - Autenticação
- [ ] `server/routes/*.cjs` - Rotas principais
- [ ] `config/security.cjs` - Validações
- [ ] `config/logger.cjs` - Logging

**Frontend (Prioridade Média):**
- [ ] `src/components/cart/*` - Sistema de carrinho
- [ ] `src/components/admin/Dashboard.tsx` - Dashboard
- [ ] `src/hooks/useCart.ts` - Hook de carrinho
- [ ] `src/services/api.ts` - Cliente API

**Plano por Sprint:**

**Sprint 1 (Semana 1):**
- [ ] Configurar coverage reports
- [ ] Testes de autenticação (backend)
- [ ] Testes de rotas principais (backend)
- [ ] Meta: 40% de cobertura

**Sprint 2 (Semana 2):**
- [ ] Testes de componentes críticos (frontend)
- [ ] Testes de hooks principais (frontend)
- [ ] Testes de integração básicos
- [ ] Meta: 60% de cobertura

**Sprint 3 (Semana 3):**
- [ ] Testes de edge cases
- [ ] Testes de performance
- [ ] Testes E2E dos fluxos principais
- [ ] Meta: 70% de cobertura

**Scripts a Adicionar:**
```json
{
  "test:coverage:watch": "vitest --coverage --watch",
  "test:coverage:report": "vitest run --coverage --reporter=html",
  "test:e2e": "playwright test"
}
```

---

## 🟢 FASE 3: Desejáveis (Próximo Mês)

### 🟢 3.1 Habilitar TypeScript Strict Mode
**Status:** 🔄 PENDENTE  
**Tempo Estimado:** 20-30 horas  
**Prioridade:** MÉDIA  
**Responsável:** Frontend Lead

**Abordagem Gradual:**

**Semana 1: Habilitar noImplicitAny**
```json
// tsconfig.json
{
  "noImplicitAny": true  // Apenas este primeiro
}
```
- [ ] Corrigir erros de tipo implícito
- [ ] Adicionar tipos explícitos
- [ ] Testar aplicação

**Semana 2: Habilitar strictNullChecks**
```json
{
  "strictNullChecks": true
}
```
- [ ] Corrigir null/undefined checks
- [ ] Usar optional chaining
- [ ] Adicionar validações

**Semana 3: Habilitar strict completo**
```json
{
  "strict": true
}
```
- [ ] Corrigir todos os erros restantes
- [ ] Revisar tipos complexos
- [ ] Documentar mudanças

**Benefícios:**
- ✅ Menos bugs em runtime
- ✅ Melhor autocomplete no IDE
- ✅ Refatoração mais segura

---

### 🟢 3.2 Monitoramento Avançado
**Status:** 🔄 PENDENTE  
**Tempo Estimado:** 12-16 horas  
**Prioridade:** MÉDIA  
**Responsável:** DevOps

**Ferramentas a Implementar:**

1. **Dashboard de Métricas (Grafana)**
   - [ ] Configurar Grafana
   - [ ] Conectar ao Prometheus
   - [ ] Criar dashboards:
     - [ ] Métricas de API (latência, erros)
     - [ ] Métricas de banco (queries lentas)
     - [ ] Métricas de sistema (CPU, memória)

2. **Alertas Proativos**
   - [ ] Alertas de erro 500 > 10/min
   - [ ] Alertas de latência > 2s
   - [ ] Alertas de uso de memória > 80%
   - [ ] Alertas de espaço em disco < 20%

3. **Análise de Performance**
   - [ ] APM (Application Performance Monitoring)
   - [ ] Análise de queries lentas
   - [ ] Análise de bundle size
   - [ ] Análise de renderização (React DevTools Profiler)

---

### 🟢 3.3 Otimização de Performance
**Status:** 🔄 PENDENTE  
**Tempo Estimado:** 16-20 horas  
**Prioridade:** MÉDIA

**Áreas de Foco:**

1. **Frontend**
   - [ ] Analisar bundle size
   - [ ] Implementar code splitting avançado
   - [ ] Otimizar imagens (WebP, lazy loading)
   - [ ] Implementar virtual scrolling em listas longas

2. **Backend**
   - [ ] Analisar slow queries
   - [ ] Adicionar índices faltantes
   - [ ] Implementar query caching
   - [ ] Otimizar joins complexos

3. **Infraestrutura**
   - [ ] Configurar CDN para assets estáticos
   - [ ] Implementar cache de HTTP headers
   - [ ] Otimizar compressão (gzip/brotli)

---

## 📅 Timeline Consolidado

### Semana 1 (Atual)
- ✅ Remover senhas hardcoded
- 🔄 Configurar CI/CD básico
- 🔄 Iniciar refatoração server.cjs

### Semana 2
- 🔄 Continuar refatoração server.cjs
- 🔄 Iniciar aumento de cobertura de testes
- ✅ CI/CD funcional

### Semana 3
- 🔄 Finalizar refatoração server.cjs
- 🔄 Continuar testes (meta 60%)
- 🔄 Iniciar TypeScript strict (gradual)

### Semana 4
- 🔄 Finalizar testes (meta 70%)
- 🔄 TypeScript strict avançado
- 🔄 Iniciar monitoramento

### Mês 2
- 🔄 Monitoramento completo
- 🔄 Otimizações de performance
- 🔄 Melhorias contínuas

---

## 📊 Métricas de Sucesso

### Fase 1 (Esta Semana)
- ✅ 0 senhas hardcoded no código
- ✅ CI/CD rodando automaticamente
- ✅ Testes passando no CI

### Fase 2 (2 Semanas)
- ✅ server.cjs refatorado (< 500 linhas)
- ✅ 60%+ de cobertura de testes
- ✅ Nenhuma regressão funcional

### Fase 3 (1 Mês)
- ✅ 70%+ de cobertura de testes
- ✅ TypeScript strict habilitado
- ✅ Monitoramento configurado
- ✅ Performance otimizada (Lighthouse > 90)

---

## 🎯 Responsabilidades

| Tarefa | Responsável | Prazo |
|--------|-------------|-------|
| Remover senhas | Backend Dev | ✅ Concluído |
| Rotacionar senhas | Backend Dev | Esta semana |
| CI/CD | DevOps | Esta semana |
| Refatorar server.cjs | Backend Lead | 2 semanas |
| Aumentar testes | Full-stack | 3 semanas |
| TypeScript strict | Frontend Lead | 1 mês |
| Monitoramento | DevOps | 1 mês |

---

## 📝 Notas

- ⚠️ Priorizar segurança (Fase 1) antes de tudo
- ⚠️ Não fazer refatoração e testes ao mesmo tempo
- ⚠️ Sempre testar após cada mudança
- ⚠️ Documentar decisões importantes

---

**Última Atualização:** 11 de Janeiro de 2025  
**Próxima Revisão:** Semanalmente durante execução

