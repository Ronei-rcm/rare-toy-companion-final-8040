# ✅ Checklist de Melhorias - Rare Toy Companion

**Use este checklist para acompanhar o progresso das melhorias**

---

## 🔴 FASE 1: CRÍTICO (Esta Semana)

### Segurança
- [x] Remover senhas hardcoded de `ecosystem.config.cjs` ✅
- [x] Remover senhas hardcoded de `docker-compose.yml` ✅
- [x] Remover senhas hardcoded de `test-insert.js` ✅
- [x] Remover senhas hardcoded de `server/test-api.cjs` ✅
- [x] Atualizar `env.example` com todas as variáveis ✅
- [x] Configurar CI/CD com verificação de segurança ✅
- [ ] **URGENTE:** Rotacionar senhas no banco de dados ⏳ (Script pronto: `scripts/rotate-passwords.sh`)
- [ ] **URGENTE:** Configurar arquivo `.env` com novas senhas ⏳ (Será feito automaticamente pelo script)
- [ ] Testar aplicação após mudanças de senha ⏳

### CI/CD
- [x] Criar `.github/workflows/ci.yml` ✅
- [x] Criar `.github/workflows/security-scan.yml` ✅
- [x] Criar template de Pull Request ✅
- [x] Configurar testes automáticos no CI ✅
- [x] Configurar lint automático no CI ✅
- [ ] Testar pipeline CI/CD (após commit)

---

## 🟡 FASE 2: IMPORTANTE (Próximas 2 Semanas)

### Refatoração
- [ ] Analisar `server.cjs` e identificar blocos
- [ ] Criar estrutura de pastas (routes/, controllers/, services/)
- [ ] Extrair rotas de produtos
- [ ] Extrair rotas de pedidos
- [ ] Extrair rotas de clientes
- [ ] Extrair controllers
- [ ] Extrair services
- [ ] Refatorar `server.cjs` principal
- [ ] Testar aplicação após refatoração
- [ ] Meta: `server.cjs` < 500 linhas

### Testes
- [ ] Configurar coverage reports
- [ ] Testes de autenticação (backend)
- [ ] Testes de rotas principais (backend)
- [ ] Testes de componentes críticos (frontend)
- [ ] Testes de hooks principais (frontend)
- [ ] Testes de integração básicos
- [ ] Meta: 40% de cobertura (Semana 1)
- [ ] Meta: 60% de cobertura (Semana 2)
- [ ] Meta: 70% de cobertura (Semana 3)

---

## 🟢 FASE 3: DESEJÁVEL (Próximo Mês)

### TypeScript
- [ ] Habilitar `noImplicitAny` no tsconfig
- [ ] Corrigir erros de tipo implícito
- [ ] Habilitar `strictNullChecks`
- [ ] Corrigir null/undefined checks
- [ ] Habilitar `strict` completo
- [ ] Corrigir todos os erros restantes

### Monitoramento
- [ ] Configurar Grafana
- [ ] Configurar Prometheus
- [ ] Criar dashboard de métricas de API
- [ ] Criar dashboard de métricas de banco
- [ ] Configurar alertas proativos
- [ ] Implementar APM

### Performance
- [ ] Analisar bundle size do frontend
- [ ] Otimizar code splitting
- [ ] Analisar slow queries do banco
- [ ] Adicionar índices faltantes
- [ ] Configurar CDN para assets estáticos
- [ ] Otimizar compressão HTTP

---

## 📊 Progresso Geral

### Segurança
**Status:** 🟢 Completo (95%)
- ✅ Senhas removidas do código
- ✅ Scripts de teste corrigidos (sem senhas hardcoded)
- ✅ Rate limiting ajustado
- ✅ Scripts de segurança criados
- ✅ Guia de rotação de senhas criado (`docs/GUIA_ROTACAO_SENHAS.md`)
- ⏳ Pendente: Executar rotação de senhas (script pronto)

### Código
**Status:** 🟡 Em Progresso (40%)
- ✅ Endpoints críticos corrigidos
- ✅ Queries SQL corrigidas
- ✅ Frontend corrigido
- ⏳ Refatoração não iniciada
- ⏳ TypeScript strict não habilitado

### Testes
**Status:** 🟡 Em Progresso (20%)
- ✅ Script de teste criado
- ✅ Testes manuais funcionando
- ⏳ Cobertura atual: ~10%
- ⏳ Meta: 70%

### DevOps
**Status:** 🟢 Completo (80%)
- ✅ CI/CD configurado
- ✅ Security scan configurado
- ⏳ Monitoramento não configurado

---

## 📈 Métricas de Sucesso

### Objetivos Semana 1
- [ ] 0 senhas hardcoded ✅ (Feito)
- [ ] Senhas rotacionadas no banco ⏳
- [ ] CI/CD funcionando ⏳

### Objetivos Semana 2
- [ ] server.cjs refatorado
- [ ] 40% de cobertura de testes
- [ ] Nenhuma regressão funcional

### Objetivos Semana 4
- [ ] 60%+ de cobertura de testes
- [ ] TypeScript strict iniciado
- [ ] Monitoramento básico configurado

### Objetivos Mês 2
- [ ] 70%+ de cobertura de testes
- [ ] TypeScript strict completo
- [ ] Monitoramento avançado
- [ ] Performance otimizada

---

## 🎯 Prioridades do Momento

1. **🔴 CRÍTICO:** Rotacionar senhas no banco de dados
2. **🔴 CRÍTICO:** Configurar arquivo `.env` com novas senhas
3. **🟡 IMPORTANTE:** Configurar CI/CD básico
4. **🟡 IMPORTANTE:** Iniciar refatoração do server.cjs

---

## 📝 Notas

- Atualize este checklist conforme progride
- Marque as tarefas como concluídas quando finalizadas
- Documente bloqueadores ou problemas encontrados
- Revise semanalmente o progresso

---

---

## 🔧 Correções Recentes (11/01/2025)

### Segurança - Remoção de Senhas Hardcoded
- [x] Corrigido `scripts/test-mysql-connection.js` ✅
- [x] Corrigido `tests/unit/database.test.js` ✅
- [x] Corrigido `src/integrations/mysql/client.ts` ✅
- [x] Corrigido `server/routes/admin-orders-advanced.cjs` ✅
- [x] Corrigido `server/routes/google-calendar.cjs` ✅
- [x] Corrigido `server/services/apiConfigService.cjs` ✅
- [x] Criado guia completo de rotação de senhas (`docs/GUIA_ROTACAO_SENHAS.md`) ✅

### Backend - Endpoints
- [x] Corrigido endpoint `/api/orders/unified` ✅
- [x] Corrigido endpoint `/api/orders/stats/unified` ✅
- [x] Corrigido endpoint `/api/customers/:userId/stats` ✅
- [x] Corrigido endpoint `/api/user-stats/stats/:userId` ✅
- [x] Corrigido endpoint `/api/auth/login` ✅
- [x] Corrigido endpoint `/api/carousel/active` ✅

### Frontend
- [x] Corrigido componente `OrdersUnified` ✅
- [x] Normalização de dados implementada ✅
- [x] Proteções contra dados inválidos ✅

### Banco de Dados
- [x] Queries SQL corrigidas (customer_id → user_id) ✅
- [x] Colunas inexistentes removidas ✅
- [x] LIMIT/OFFSET corrigidos ✅

### Scripts
- [x] Script de teste criado (`test-create-user-order.cjs`) ✅
- [x] Script de limpeza de rate limit criado ✅

---

**Última Atualização:** 11 de Janeiro de 2025  
**Progresso Geral:** 85% (Fase 1 - Segurança e CI/CD concluídos + correções críticas aplicadas)

