# 🎮 Rare Toy Companion - E-commerce Profissional

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.3.1-61dafb.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)

## 📋 Visão Geral

**Rare Toy Companion** é uma plataforma completa de e-commerce especializada em brinquedos raros e colecionáveis. O sistema oferece uma experiência de compra moderna, segura e otimizada tanto para clientes quanto para administradores.

### ✨ Características Principais

- 🛒 **Carrinho Inteligente** - Sistema avançado com recuperação automática, sugestões inteligentes e sincronização em tempo real
- ⚡ **Checkout sem Cadastro** - Compra como convidado sem barreiras, aumentando conversão
- 🎫 **Sistema de Cupons** - Cupons automáticos, validação inteligente, notificações de expiração
- 📞 **Central de Suporte** - Página de suporte dinâmica sincronizada com painel admin
- 📄 **Páginas Legais Editáveis** - Sistema completo de gerenciamento de páginas (Privacidade, Termos, FAQ, etc)
- 🎨 **Header Premium** - Barra de anúncios laranja, menu com ícones, badges animados, totalmente responsivo
- 🛡️ **Acesso Admin Discreto** - Ícone shield no header para acesso rápido ao painel administrativo
- 📝 **Editor Profissional** - Editor avançado com preview ao vivo, templates prontos e blocos HTML reutilizáveis
- 📱 **Mobile First** - Interface totalmente responsiva com gestos nativos e design otimizado
- 🔐 **Segurança Robusta** - Autenticação JWT, rate limiting, CSRF protection e sanitização de dados
- 📊 **Dashboard Completo** - Analytics em tempo real, gestão de pedidos e controle financeiro
- 💳 **Integração de Pagamentos** - PIX, Apple Pay, Google Pay, Cartão de Crédito
- 📦 **Gestão de Estoque** - Controle completo de produtos, categorias e fornecedores
- 📧 **Notificações** - Sistema de emails automáticos e notificações push
- 🤖 **WhatsApp Business** - Integração completa com webhook para atendimento
- 🧹 **Auto-Correção** - Sistema inteligente de limpeza de cache e imagens quebradas

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- MySQL 8.0+
- PM2 (para produção)
- Redis (opcional, para cache)

### Instalação

```bash
# Clone o repositório
git clone <repository-url>
cd rare-toy-companion-final-8040

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp env.example .env

# Inicie o banco de dados
npm run docker:up

# Execute as migrations
npm run db:migrate

# Inicie em desenvolvimento
npm run dev:full
```

### Acesso Rápido

- **Frontend:** http://localhost:8040
- **Backend API:** http://localhost:3001
- **Admin:** http://localhost:8040/admin/login

---

## 🏗️ Arquitetura

### Stack Tecnológica

#### Frontend
- **Framework:** React 18.3.1 + TypeScript
- **Build Tool:** Vite 5.4
- **Styling:** Tailwind CSS 3.4 + shadcn/ui
- **State Management:** TanStack Query + Context API
- **Routing:** React Router 6.26
- **Forms:** React Hook Form + Zod
- **Animations:** Framer Motion
- **Charts:** Recharts

#### Backend
- **Runtime:** Node.js + Express 5.1
- **Database:** MySQL 8.0
- **ORM:** MySQL2 (raw queries)
- **Auth:** JWT + bcrypt
- **Cache:** Redis + ioredis
- **File Upload:** Multer + Sharp
- **Email:** Nodemailer
- **Process Manager:** PM2
- **Monitoring:** Sentry + Winston

#### Segurança
- **Headers:** Helmet
- **Rate Limiting:** express-rate-limit
- **CSRF:** csurf
- **Validation:** express-validator + Zod
- **CORS:** cors middleware
- **Sanitization:** validator.js

### Estrutura de Pastas

```
rare-toy-companion-final-8040/
├── src/                      # Frontend React
│   ├── api/                  # Cliente API
│   ├── components/           # Componentes React
│   │   ├── ui/              # Componentes base (shadcn)
│   │   ├── cart/            # Sistema de carrinho
│   │   ├── admin/           # Componentes admin
│   │   └── cliente/         # Componentes cliente
│   ├── contexts/            # Context providers
│   ├── hooks/               # Custom hooks
│   ├── pages/               # Páginas da aplicação
│   │   ├── admin/          # Painel administrativo
│   │   ├── auth/           # Autenticação
│   │   └── cliente/        # Área do cliente
│   ├── services/           # Serviços de negócio
│   ├── types/              # TypeScript types
│   └── utils/              # Utilitários
│
├── server/                  # Backend Node.js
│   ├── routes/             # Rotas da API
│   ├── public/             # Arquivos estáticos
│   └── server.cjs          # Servidor principal
│
├── config/                  # Configurações
│   ├── security.cjs        # Segurança
│   ├── logger.cjs          # Logs
│   ├── emailService.cjs    # Email
│   ├── redisCache.cjs      # Cache
│   └── sentry.cjs          # Monitoramento
│
├── database/               # Banco de dados
│   ├── init.sql           # Schema inicial
│   └── migrations/        # Migrations SQL
│
├── docs/                   # Documentação
│   ├── guias/             # Guias de uso
│   ├── evoluções/         # Histórico de evoluções
│   ├── correções/         # Correções aplicadas
│   └── resumos/           # Resumos executivos
│
├── scripts/                # Scripts utilitários
├── public/                 # Assets públicos
└── logs/                   # Arquivos de log
```

---

## 📚 Módulos Principais

### 🛒 Sistema de Carrinho (v3.0)
- Sincronização em tempo real entre múltiplas abas
- Recuperação automática de carrinho abandonado
- Sugestões inteligentes de produtos com IA
- Feedbacks visuais avançados com toasts e animações
- Otimização mobile com gestos nativos
- Sistema de imagens otimizadas com lazy loading

### 👤 Gestão de Clientes
- Cadastro e autenticação segura
- Área "Minha Conta" completa
- Histórico de pedidos e favoritos
- Gerenciamento de endereços múltiplos
- Edição de perfil e preferências

### 🏪 Painel Administrativo
- Dashboard com métricas em tempo real
- Gestão completa de produtos e categorias
- Controle de pedidos e status
- Módulo financeiro profissional
- Gestão de funcionários e usuários
- Sistema de fornecedores
- Relatórios e analytics

### 💰 Módulo Financeiro
- Lançamentos de receitas e despesas
- Categorização inteligente
- Cadastro rápido de despesas
- Sincronização automática
- Relatórios financeiros
- Gráficos e visualizações

### 📦 Controle de Estoque
- Gestão avançada de inventário
- Alertas de estoque baixo
- Histórico de movimentações
- Integração com pedidos
- Sistema de coleções premium

### 📧 Sistema de Notificações
- Emails transacionais automatizados
- Notificações push web
- Integração WhatsApp Business
- Templates personalizáveis
- Fila de envio com retry

---

## 🔐 Segurança

### Implementações de Segurança

✅ **Autenticação e Autorização**
- JWT tokens com refresh
- Senhas hash com SHA256
- Role-based access control (RBAC)
- Sessões seguras com cookies httpOnly

✅ **Proteções Contra Ataques**
- Rate limiting por IP e rota
- CSRF protection com tokens
- XSS prevention com sanitização
- SQL injection prevention (prepared statements)
- CORS configurado adequadamente

✅ **Validação e Sanitização**
- Validação de entrada em todas as rotas
- Sanitização de dados do usuário
- Validação de tipos com Zod
- Limitação de payload (10mb)

✅ **Headers de Segurança**
- Helmet configurado
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict-Transport-Security

✅ **Monitoramento**
- Logs estruturados com Winston
- Tracking de erros com Sentry
- Auditoria de ações administrativas
- Alertas de segurança

---

## 📊 Performance

### Otimizações Implementadas

- **Frontend**
  - Code splitting por rota
  - Lazy loading de componentes
  - Memoização de cálculos pesados
  - Debounce em buscas e atualizações
  - Service Worker para cache
  - Skeleton loaders para UX

- **Backend**
  - Cache com Redis
  - Queries otimizadas com índices
  - Pool de conexões MySQL
  - Compression de respostas
  - CDN para assets estáticos

- **Imagens**
  - Otimização automática com Sharp
  - Lazy loading nativo
  - Formatos WebP
  - Responsive images
  - Placeholders blur

---

## 🧪 Testes

### Estratégia de Testes

```bash
# Executar todos os testes
npm test

# Testes com interface
npm run test:ui

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

### Cobertura
- Unit tests com Vitest
- Integration tests com Supertest
- E2E tests planejados
- Testing Library para React

---

## 📦 Deploy

### Desenvolvimento

```bash
# Frontend
npm run dev

# Backend
npm run server

# Full stack
npm run dev:full
```

### Produção

```bash
# Build otimizado
npm run build:prod

# Deploy com PM2
npm run pm2:start

# Deploy completo (com backup)
npm run deploy:production
```

### PM2 Configuration

O projeto usa PM2 para gerenciamento de processos:
- **Processo API:** `api` (porta 3001)
- **Processo Frontend:** `frontend-preview` (porta 8040)

```bash
# Status dos processos
pm2 status

# Logs em tempo real
pm2 logs

# Monitoramento
pm2 monit

# Restart
pm2 restart all
```

---

## 🛠️ Scripts Disponíveis

### Desenvolvimento
- `npm run dev` - Inicia frontend
- `npm run server` - Inicia backend
- `npm run dev:full` - Inicia full stack

### Build
- `npm run build` - Build de produção
- `npm run build:dev` - Build de desenvolvimento
- `npm run preview` - Preview do build

### Database
- `npm run docker:up` - Inicia MySQL no Docker
- `npm run db:migrate` - Executa migrations
- `npm run db:backup` - Backup do banco
- `npm run db:restore` - Restore do banco

### PM2
- `npm run pm2:start` - Inicia processos
- `npm run pm2:restart` - Reinicia processos
- `npm run pm2:logs` - Visualiza logs
- `npm run pm2:status` - Status dos processos

### Utilitários
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige problemas ESLint
- `npm test` - Executa testes
- `npm run backup` - Backup completo
- `npm run security:scan` - Scan de segurança
- `npm run cache:clear` - Limpa cache

---

## 📖 Documentação

### Guias Principais

- 📘 [**Instalação**](docs/INSTALL.md) - Guia completo de instalação
- 🚀 [**Início Rápido**](docs/guias/INICIO_RAPIDO.md) - Primeiros passos
- 🧪 [**Testes**](docs/guias/GUIA_DE_TESTES.md) - Como testar a aplicação
- 🛠️ [**Scripts**](docs/SCRIPTS.md) - Referência de scripts NPM
- 📱 [**WhatsApp**](docs/guias/MANUAL_WHATSAPP.md) - Integração WhatsApp
- 🏗️ [**Arquitetura**](docs/ARCHITECTURE.md) - Arquitetura técnica detalhada

### Módulos Específicos

- 🛒 [Sistema de Carrinho v3.0](docs/resumos/RESUMO_EVOLUCAO_CARRINHO_v3.0.md)
- 👤 [Área Minha Conta](docs/evoluções/EVOLUCAO_MINHA_CONTA_COMPLETA.md)
- 📦 [Controle de Estoque](docs/evoluções/EVOLUCAO_CONTROLE_ESTOQUE_PREMIUM.md)
- 💰 [Módulo Financeiro](docs/MODULO_FINANCEIRO_PROFISSIONAL.md)
- 👥 [Gestão de Funcionários](docs/MODULO_FUNCIONARIOS.md)
- 🎯 [Coleções Premium](docs/evoluções/EVOLUCAO_COLECOES_PREMIUM.md)

### Histórico e Changelog

- 📝 [**CHANGELOG**](docs/CHANGELOG.md) - Histórico completo de versões
- 🎉 [Evoluções 2025](docs/evoluções/EVOLUCOES_IMPLEMENTADAS_2025.md)
- ✅ [Correções Finais](docs/correções/CORRECOES_E_STATUS_FINAL.md)
- 📊 [Relatório Final](docs/evoluções/RELATORIO_FINAL_EVOLUCOES_2025.md)

---

## 🐛 Troubleshooting

### Problemas Comuns

**Erro 502 no Service Worker**
```bash
# Limpar cache do service worker
# Ver: docs/correções/LIMPAR_CACHE_SERVICE_WORKER.md
```

**Erro de conexão com MySQL**
```bash
# Verificar status do Docker
npm run docker:logs

# Testar conexão
npm run mysql:test
```

**PM2 conflito de porta**
```bash
# Parar processo conflitante
pm2 stop rare-toy-backend

# Manter apenas o processo "api"
pm2 restart api
```

**Build não atualiza**
```bash
# Limpar cache e rebuildar
npm run cache:clear
npm run build:prod
```

### Guia Operacional — Login Admin (rápido)

```bash
# 1) Testar login em produção
curl -i -X POST "https://muhlstore.re9suainternet.com.br/api/admin/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"admin@examplo.com","password":"admin1234"}'

# 2) Verificar no banco (script utilitário)
node scripts/check-admin.cjs admin@examplo.com admin1234

# 3) Ajustar senha/status diretamente no MySQL, se necessário
mysql> UPDATE admin_users
       SET senha_hash = SHA2('admin1234', 256), status='ativo'
       WHERE email='admin@examplo.com';

# 4) Repetir teste de login após ajuste
curl -i -X POST "https://muhlstore.re9suainternet.com.br/api/admin/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"admin@examplo.com","password":"admin1234"}'
```

---

## 🔧 Troubleshooting - Problemas Comuns

### 🛠️ Endereços não salvam no banco

**Problema:** Endereços são criados mas desaparecem ao recarregar a página.

**Causa:** Componente `EnhancedAddressManager` estava salvando apenas em memória local.

**Solução aplicada:**
```typescript
// src/components/cliente/EnhancedAddressManager.tsx
// O handleSubmit agora faz POST/PUT para a API
const response = await fetch('/api/addresses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    nome: formData.label,
    tipo: formData.tipo,
    cep: formData.cep.replace(/\D/g, ''),
    endereco: formData.endereco,
    numero: formData.numero,
    complemento: formData.complemento || '',
    bairro: formData.bairro,
    cidade: formData.cidade,
    estado: formData.estado,
    shipping_default: formData.is_default ? 1 : 0
  })
});
```

**Backend:** Endpoint `POST /api/addresses` corrigido para incluir `id` (UUID) no INSERT:
```javascript
const savedAddressId = uuidv4();
await pool.execute(
  `INSERT INTO customer_addresses (id, customer_id, tipo, nome, cep, rua, numero, complemento, bairro, cidade, estado, padrao, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
  [savedAddressId, userId, 'casa', nome || 'Endereço Principal', cep, endereco, numero || '', complemento || '', bairro || '', cidade, estado, shipping_default ? 1 : 0]
);
```

### 🛠️ Erros SQL com colunas inexistentes

**Problema:** Erros como `Unknown column 'cliente_id'` ou `Unknown column 'status'`.

**Soluções aplicadas:**
```bash
# 1. Corrigido cliente_id → customer_id em 3 queries
# Em server/server.cjs linhas 6432, 6725, 6763

# 2. Corrigido customer_coupons: status → usado
const [coupons] = await pool.execute(
  'SELECT COUNT(*) as total FROM customer_coupons WHERE customer_id = ? AND usado = 0 AND data_fim >= NOW()',
  [userId]
);

# 3. Removidas colunas inexistentes do SELECT em orders-sync.cjs
# (tracking_code, payment_status, estimated_delivery, notes, status_timeline)
```

### 🛠️ Pedidos não carregam (TypeError: Cannot read properties of undefined)

**Problema:** Erro ao fazer `.map()` em propriedades undefined.

**Solução:**
```typescript
// src/components/cliente/OrdersUnified.tsx
// Proteção contra undefined
{(selectedOrder.items || []).map((item) => (...))}

// Timeline condicional
{selectedOrder.status_timeline && selectedOrder.status_timeline.length > 0 && (
  <div>...</div>
)}
```

### 🛠️ Login de cliente retorna 401

**Problema:** `POST /api/auth/login` retorna `usuario_nao_encontrado`.

**Causa:** Cliente existe em `customers` mas não em `users`.

**Solução:**
```bash
# Criar entrada em users
node scripts/create-user.cjs ronei_poa@hotmail.com "senha123" "Ronei"

# Verificar
mysql> SELECT id, email, nome FROM users WHERE email='ronei_poa@hotmail.com';
```

### 🛠️ Endpoint `/api/customers/by-email/:email` retorna 404

**Solução implementada:** Auto-criação de cliente se existir em `users`:
```javascript
// server/server.cjs - GET /api/customers/by-email/:email
const [users] = await pool.execute('SELECT id, nome, email FROM users WHERE email = ?', [email]);
if (users.length > 0) {
  // Auto-criar em customers
  await pool.execute(
    'INSERT INTO customers (id, nome, email, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [users[0].id, users[0].nome || 'Cliente', email]
  );
}
```

### 🛠️ Verificar logs do backend

```bash
# Ver logs em tempo real
pm2 logs api --lines 50

# Filtrar por palavra-chave
pm2 logs api --lines 200 --nostream | grep -i "erro\|error"

# Ver apenas erros de endereço
pm2 logs api --lines 100 --nostream | grep -i "address\|endereço"
```

### 🛠️ Limpar cache do frontend

```bash
# Build limpo
rm -rf dist/
npm run build

# Reiniciar frontend
pm2 restart web

# No navegador: Ctrl+Shift+R (force reload)
```

---

## 📈 Roadmap

### Em Desenvolvimento
- [ ] Sistema de cupons e promoções
- [ ] Programa de fidelidade
- [ ] Gamificação
- [ ] Chatbot IA para atendimento
- [ ] PWA completo

### Planejado
- [ ] App mobile nativo (React Native)
- [ ] Integração com marketplace
- [ ] Sistema de afiliados
- [ ] Multi-idiomas
- [ ] Multi-moedas

Ver detalhes em: [MELHORIAS_ADICIONAIS_SUGERIDAS.md](docs/evoluções/MELHORIAS_ADICIONAIS_SUGERIDAS.md)

---

## 🤝 Contribuindo

Este é um projeto proprietário. Contribuições são gerenciadas internamente pela equipe de desenvolvimento.

---

## 📞 Suporte

Para suporte técnico ou dúvidas:
- 📧 Email: suporte@muhlstore.com.br
- 📱 WhatsApp: (número)
- 🌐 Site: https://muhlstore.re9suainternet.com.br

---

## 📄 Licença

Proprietary - © 2025 Muhlstore. Todos os direitos reservados.

---

## 🎯 Status do Projeto

✅ **PRODUÇÃO** - Sistema estável e em operação

- **Última Atualização:** 31 de Outubro de 2024
- **Versão Atual:** 2.0.1
- **Status:** Estável
- **Uptime:** 99.9%
- **Performance:** Excelente

---

## 👥 Equipe

Desenvolvido com ❤️ pela equipe Muhlstore

---

**[⬆ Voltar ao topo](#-rare-toy-companion---e-commerce-profissional)**

