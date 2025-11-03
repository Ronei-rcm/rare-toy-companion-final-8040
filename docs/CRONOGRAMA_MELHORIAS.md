# 📅 Cronograma de Melhorias - Rare Toy Companion

> Plano completo de 6 semanas para otimizar segurança, UX e performance

**Data Início:** 29 de Outubro de 2025  
**Prazo:** 6 semanas  
**Status:** 🟢 Em Andamento

---

## 🎯 Visão Geral

### Objetivos Principais

1. **Segurança** - Aplicar 100% das boas práticas OWASP
2. **UX Admin** - Menu otimizado e produtividade máxima
3. **Performance** - Reduzir latência em 50%
4. **Escalabilidade** - Suportar 10x mais tráfego
5. **Qualidade** - Zero erros em produção

### Métricas de Sucesso

| Métrica | Atual | Meta | Melhoria |
|---------|-------|------|----------|
| P95 Latency | 800ms | 300ms | **63% redução** |
| Taxa de Erro | 0.5% | 0.01% | **98% redução** |
| Tempo de Navegação | 8s | 2s | **75% redução** |
| Score Lighthouse | 85 | 95 | **+10 pontos** |
| Suporte a Usuários | 100 | 1000 | **10x escala** |

---

## 📆 SEMANA 1: Endurecimento de Segurança

**Duração:** 5 dias úteis  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ⏳ Aguardando início

### Objetivos

- Implementar 100% das boas práticas OWASP básicas
- Corrigir vulnerabilidades de segurança identificadas
- Configurar middleware de segurança robusto
- Implementar logging estruturado

### Tarefas

#### Dia 1-2: Correção de Cookies e Sessões

**Problema:**
```javascript
// ANTES - VULNERÁVEL
res.cookie('session_id', sid, { 
  httpOnly: false,  // ❌ FALHA GRAVE
  sameSite: 'lax',
  secure: false
});
```

**Solução:**
```javascript
// DEPOIS - SEGURO
res.cookie('session_id', sid, { 
  httpOnly: true,   // ✅ Protege contra XSS
  sameSite: 'strict', // ✅ Protege contra CSRF
  secure: true,     // ✅ HTTPS obrigatório
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
  domain: process.env.COOKIE_DOMAIN,
  path: '/',
  signed: true      // ✅ Assinado com secret
});
```

**Entregáveis:**
- [ ] Cookie `httpOnly: true` em todas as rotas
- [ ] Cookie `secure: true` em produção
- [ ] Cookie `sameSite: strict`
- [ ] Rotação de sessão automática
- [ ] Limpeza de sessões antigas (cron job)

**Estimativa:** 4 horas

---

#### Dia 2-3: Autenticação Admin Robusta

**Problema:**
```javascript
// ANTES - TOKEN PREDITÍVEL
const adminToken = 'admin_token_' + Date.now() + '_' + user.id;
```

**Solução:**
```javascript
// DEPOIS - JWT ASSINADO
const adminToken = jwt.sign(
  { 
    id: user.id, 
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hora
  },
  process.env.JWT_SECRET,
  { algorithm: 'HS256' }
);
```

**Entregáveis:**
- [ ] JWT para autenticação admin
- [ ] Refresh token com rotação
- [ ] Middleware de validação robusto
- [ ] Rate limiting para login (5 tentativas/15min)
- [ ] Log de todas as tentativas de acesso

**Estimativa:** 6 horas

---

#### Dia 3-4: Validação e Sanitização

**Objetivo:** Prevenir SQL Injection e XSS

**Implementação:**
```javascript
// Validador robusto
const { body, validationResult } = require('express-validator');

// Validação de email
body('email')
  .trim()
  .normalizeEmail()
  .isEmail()
  .withMessage('Email inválido'),

// Sanitização de HTML
const validator = require('validator');
const cleanHtml = validator.escape(req.body.html);

// Queries parametrizadas (JÁ EXISTE ✅)
await pool.execute('SELECT * FROM users WHERE id = ?', [userId]);
```

**Entregáveis:**
- [ ] Validadores em 100% das rotas sensíveis
- [ ] Sanitização de HTML
- [ ] Validação de uploads
- [ ] Limite de payload (10MB)
- [ ] CORS configurado por ambiente

**Estimativa:** 8 horas

---

#### Dia 4-5: Middleware de Segurança

**Implementação:**
```javascript
// config/security-enhanced.mjs
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

export const securityMiddleware = [
  // 1. Helmet - Headers de segurança
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: { maxAge: 31536000, includeSubDomains: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: false,
    referrerPolicy: { policy: "no-referrer" },
    xssFilter: true,
  }),

  // 2. Rate Limiting
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // 100 requests por IP
    message: 'Muitas requisições, tente novamente mais tarde.',
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // 3. CSRF Protection
  express.csrf({ cookie: true }),
];

// Aplicar em server.cjs
app.use(...securityMiddleware);
```

**Entregáveis:**
- [ ] Helmet configurado
- [ ] Rate limiting por rota
- [ ] CSRF protection
- [ ] Logging estruturado (Winston)
- [ ] Health checks

**Estimativa:** 6 horas

---

### Checklist de Qualidade

- [ ] Todos os cookies com `httpOnly: true`
- [ ] JWT implementado para admin
- [ ] Rate limiting ativo
- [ ] Helmet configurado
- [ ] Logs estruturados
- [ ] Testes de segurança passando
- [ ] Documentação atualizada

**Total Semana 1:** 24 horas

---

## 📆 SEMANA 2: RBAC e Permissões Granulares

**Duração:** 5 dias úteis  
**Prioridade:** 🔴 ALTA  
**Status:** ⏳ Aguardando

### Objetivos

- Sistema de roles robusto
- Permissões granulares por módulo
- Middleware de autorização
- UI adaptativa por permissão

### Tarefas

#### Dia 1-2: Sistema de Roles

**Estrutura:**
```typescript
// Tipos de Role
enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  GERENTE = 'gerente',
  OPERADOR = 'operador',
  VISUALIZADOR = 'visualizador'
}

// Permissões
interface Permissions {
  produtos: {
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    deletar: boolean;
  };
  pedidos: { ... };
  financeiro: { ... };
}
```

**Entregáveis:**
- [ ] Enum de roles
- [ ] Tabela `admin_permissions`
- [ ] Seeder de permissões
- [ ] Middleware de autorização
- [ ] Validadores por módulo

**Estimativa:** 8 horas

---

#### Dia 3-4: Middleware de Autorização

**Implementação:**
```javascript
// middleware/rbac.mjs
export const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    const user = req.admin_user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const hasPermission = await checkPermission(user.id, resource, action);
    
    if (!hasPermission) {
      return res.status(403).json({ 
        error: 'Forbidden',
        message: `Você não tem permissão para ${action} em ${resource}` 
      });
    }

    next();
  };
};

// Uso
app.put('/api/admin/products/:id', 
  authenticateAdmin, 
  requirePermission('produtos', 'editar'),
  updateProductController
);
```

**Entregáveis:**
- [ ] Middleware `requirePermission`
- [ ] Integração em todas as rotas admin
- [ ] Error handling robusto
- [ ] Logs de acesso negado

**Estimativa:** 6 horas

---

#### Dia 4-5: UI Adaptativa

**Implementação:**
```typescript
// hooks/usePermissions.ts
export const usePermissions = () => {
  const { user } = useAdmin();
  
  const can = (resource: string, action: string) => {
    return user?.permissions?.[resource]?.[action] || false;
  };

  return { can, user };
};

// Uso em componentes
const { can } = usePermissions();

{can('produtos', 'criar') && (
  <Button onClick={handleCreate}>
    Novo Produto
  </Button>
)}
```

**Entregáveis:**
- [ ] Hook `usePermissions`
- [ ] Componente `<PermissionGate>`
- [ ] Ocultar itens do menu por permissão
- [ ] Tooltips para ações restritas

**Estimativa:** 8 horas

---

### Checklist de Qualidade

- [ ] Sistema de roles implementado
- [ ] Permissões granulares ativas
- [ ] Middleware de autorização
- [ ] UI adaptativa por role
- [ ] Testes de permissões
- [ ] Documentação atualizada

**Total Semana 2:** 22 horas

---

## 📆 SEMANA 3: UX Admin e Auditoria

**Duração:** 5 dias úteis  
**Prioridade:** 🟡 MÉDIA  
**Status:** ✅ Menu Otimizado

### Objetivos

- Menu otimizado com busca e categorias ✅
- Sistema de auditoria completo
- Exportação de dados
- Dashboard com métricas

### Tarefas

#### Dia 1: Menu Otimizado ✅

**Status:** ✅ IMPLEMENTADO

Ver `docs/MELHORIAS_MENU_ADMIN.md`

**Características:**
- ✅ Agrupamento por categorias
- ✅ Busca rápida (Command Palette)
- ✅ Badges de notificações
- ✅ Atalhos de teclado
- ✅ Mobile otimizado

**Estimativa:** Completo

---

#### Dia 2-3: Sistema de Auditoria

**Implementação:**
```sql
-- Criar tabela de auditoria
CREATE TABLE audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  user_email VARCHAR(255),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id INT,
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user (user_id),
  INDEX idx_resource (resource, resource_id),
  INDEX idx_created (created_at)
);
```

**Middleware:**
```javascript
export const auditLog = (action, resource) => {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      if (res.statusCode < 400) {
        logAction(req.user, action, resource, {
          request: req.body,
          response: data,
          ip: req.ip,
          userAgent: req.headers['user-agent']
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};
```

**Entregáveis:**
- [ ] Tabela `audit_logs`
- [ ] Middleware de auditoria
- [ ] Log de todas as ações críticas
- [ ] Dashboard de auditoria
- [ ] Exportação de logs

**Estimativa:** 8 horas

---

#### Dia 4-5: Exportação e Relatórios

**Features:**
- Export para CSV
- Export para PDF
- Filtros avançados
- Email de relatórios

**Entregáveis:**
- [ ] Export CSV
- [ ] Export PDF
- [ ] Agendamento de relatórios
- [ ] Envio por email

**Estimativa:** 6 horas

---

### Checklist de Qualidade

- [ ] Menu otimizado ✅
- [ ] Auditoria implementada
- [ ] Exportação funcional
- [ ] Dashboard com métricas
- [ ] Testes end-to-end

**Total Semana 3:** 14 horas

---

## 📆 SEMANA 4: Performance e Banco de Dados

**Duração:** 5 dias úteis  
**Prioridade:** 🟡 MÉDIA  
**Status:** ⏳ Aguardando

### Objetivos

- Índices otimizados no banco
- Cache implementado
- Queries otimizadas
- Lazy loading

### Tarefas

#### Dia 1-2: Índices e Otimizações

**SQL:**
```sql
-- Índices críticos
CREATE INDEX idx_sessions_active ON sessions(user_id, last_seen);
CREATE INDEX idx_orders_status_date ON orders(status, created_at);
CREATE INDEX idx_products_category ON products(category_id, status);
CREATE INDEX idx_cart_items_user ON cart_items(cart_id, created_at);

-- Análise de performance
EXPLAIN SELECT * FROM orders WHERE status = 'criado' ORDER BY created_at DESC;
```

**Entregáveis:**
- [ ] Índices em tabelas críticas
- [ ] Análise EXPLAIN em queries lentas
- [ ] Otimização de JOINs
- [ ] Remoção de N+1 queries

**Estimativa:** 8 horas

---

#### Dia 3-4: Cache com Redis

**Implementação:**
```javascript
import redis from 'redis';

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
});

// Cache helper
export const cacheGet = async (key) => {
  const cached = await client.get(key);
  return cached ? JSON.parse(cached) : null;
};

export const cacheSet = async (key, value, ttl = 3600) => {
  await client.setex(key, ttl, JSON.stringify(value));
};

// Uso em rotas
app.get('/api/products', async (req, res) => {
  const cacheKey = `products_${req.query.page}`;
  let products = await cacheGet(cacheKey);
  
  if (!products) {
    products = await fetchProducts(req.query);
    await cacheSet(cacheKey, products);
  }
  
  res.json(products);
});
```

**Entregáveis:**
- [ ] Redis configurado
- [ ] Cache em rotas públicas
- [ ] Invalidação de cache
- [ ] Cache warming

**Estimativa:** 6 horas

---

#### Dia 5: Paginação e Lazy Loading

**Implementação:**
```typescript
// Hooks para paginação infinita
const useInfiniteProducts = (filters) => {
  return useInfiniteQuery({
    queryKey: ['products', filters],
    queryFn: ({ pageParam = 0 }) => fetchProducts({ ...filters, offset: pageParam }),
    getNextPageParam: (lastPage, allPages) => 
      lastPage.length === 20 ? allPages.length * 20 : undefined,
  });
};
```

**Entregáveis:**
- [ ] Paginação infinita
- [ ] Lazy loading de imagens
- [ ] Skeleton loaders
- [ ] Virtual scrolling

**Estimativa:** 4 horas

---

### Checklist de Qualidade

- [ ] Índices criados
- [ ] Redis configurado
- [ ] Cache funcionando
- [ ] Queries otimizadas
- [ ] Performance testado

**Total Semana 4:** 18 horas

---

## 📆 SEMANA 5: Observabilidade e Backups

**Duração:** 5 dias úteis  
**Prioridade:** 🟢 BAIXA  
**Status:** ⏳ Aguardando

### Objetivos

- Health checks
- Métricas e monitoring
- Backups automáticos
- Documentação

### Tarefas

#### Dia 1-2: Health Checks e Métricas

**Implementação:**
```javascript
// Endpoint de health check
app.get('/api/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    disk: await checkDiskSpace(),
    memory: await checkMemory(),
    uptime: process.uptime(),
  };

  const allHealthy = Object.values(checks).every(c => c.status === 'ok');
  
  res.status(allHealthy ? 200 : 503).json(checks);
});
```

**Entregáveis:**
- [ ] Health check endpoint
- [ ] Métricas Prometheus
- [ ] Dashboard Grafana
- [ ] Alertas configurados

**Estimativa:** 8 horas

---

#### Dia 3-4: Backups Automáticos

**Cron Job:**
```bash
# Criar script de backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DATE}.sql.gz"

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME | gzip > /backups/$BACKUP_FILE

# Manter apenas últimos 30 dias
find /backups -type f -mtime +30 -delete

# Upload para S3
aws s3 cp /backups/$BACKUP_FILE s3://backups/
```

**Entregáveis:**
- [ ] Script de backup
- [ ] Cron job configurado
- [ ] Upload para S3
- [ ] Teste de restauração

**Estimativa:** 6 horas

---

#### Dia 5: Documentação Final

**Documentos:**
- [ ] Guia de deploy
- [ ] Runbook de incidentes
- [ ] Diagrama de arquitetura
- [ ] Guia de troubleshooting

**Estimativa:** 4 horas

---

### Checklist de Qualidade

- [ ] Health checks ativos
- [ ] Métricas configuradas
- [ ] Backups automáticos
- [ ] Documentação completa

**Total Semana 5:** 18 horas

---

## 📆 SEMANA 6: QA Final e Hardening

**Duração:** 3 dias úteis  
**Prioridade:** 🟢 MÉDIA  
**Status:** ⏳ Aguardando

### Objetivos

- Testes completos
- Pentest leve
- Otimizações finais
- Release notes

### Tarefas

#### Dia 1: Testes Completos

- [ ] Testes unitários (80%+ coverage)
- [ ] Testes de integração
- [ ] Testes E2E
- [ ] Testes de performance

**Estimativa:** 6 horas

---

#### Dia 2: Pentest Leve

- [ ] Verificação OWASP Top 10
- [ ] Scan de dependências
- [ ] Teste de CORS
- [ ] Teste de SQL Injection

**Estimativa:** 4 horas

---

#### Dia 3: Release

- [ ] Release notes
- [ ] Changelog
- [ ] Migração de dados
- [ ] Rollback plan

**Estimativa:** 4 horas

---

## 📊 Resumo Executivo

### Tempo Total

| Fase | Duração | Horas |
|------|---------|-------|
| Semana 1: Segurança | 5 dias | 24h |
| Semana 2: RBAC | 5 dias | 22h |
| Semana 3: UX | 5 dias | 14h |
| Semana 4: Performance | 5 dias | 18h |
| Semana 5: Observabilidade | 5 dias | 18h |
| Semana 6: QA | 3 dias | 14h |
| **TOTAL** | **28 dias** | **110h** |

### Priorização

| Prioridade | Semanas | Impacto |
|------------|---------|---------|
| 🔴 CRÍTICA | 1-2 | Alto |
| 🟡 MÉDIA | 3-4 | Médio |
| 🟢 BAIXA | 5-6 | Baixo |

### ROI Estimado

| Melhoria | Impacto | Valor |
|----------|---------|-------|
| Segurança | 98% redução de vulnerabilidades | $10k/ano |
| Performance | 63% redução de latência | $5k/ano |
| UX | 75% redução tempo navegação | $15k/ano |
| **TOTAL** | | **$30k/ano** |

---

## ✅ Próximos Passos

1. **Aprovar cronograma** - Confirmar disponibilidade
2. **Semana 1: Começar** - Segurança crítica
3. **Revisar semanalmente** - Ajustar conforme necessário
4. **Deploy gradual** - Testar em produção
5. **Monitorar métricas** - Validar resultados

---

**Criado em:** 29/10/2025  
**Versão:** 1.0.0  
**Autor:** Sistema de Melhorias Automatizado

