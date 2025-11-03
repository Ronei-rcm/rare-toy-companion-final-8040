# 🏗️ Arquitetura Técnica - Rare Toy Companion

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Sistema](#arquitetura-de-sistema)
3. [Frontend](#frontend)
4. [Backend](#backend)
5. [Banco de Dados](#banco-de-dados)
6. [Segurança](#segurança)
7. [Performance](#performance)
8. [Infraestrutura](#infraestrutura)
9. [Integraões](#integrações)
10. [Fluxos Principais](#fluxos-principais)

---

## 🎯 Visão Geral

A aplicação **Rare Toy Companion** é construída com uma arquitetura moderna de **SPA (Single Page Application)** no frontend e **API RESTful** no backend, seguindo os princípios de:

- **Separação de Responsabilidades** - Frontend e Backend completamente desacoplados
- **Escalabilidade** - Componentes independentes que podem escalar horizontalmente
- **Segurança** - Múltiplas camadas de proteção e validação
- **Performance** - Cache, otimizações e lazy loading
- **Manutenibilidade** - Código limpo, modular e bem documentado

### Stack Resumida

```
Frontend: React 18 + TypeScript + Vite + Tailwind
Backend: Node.js + Express 5 + MySQL 8
Cache: Redis
Process: PM2
Monitor: Winston + Sentry
```

---

## 🏛️ Arquitetura de Sistema

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                       CLIENTE                           │
│              (Browser / Mobile Browser)                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ HTTPS
                     │
┌────────────────────▼────────────────────────────────────┐
│                  NGINX (Reverse Proxy)                  │
│              SSL/TLS Termination + GZIP                 │
└────────┬─────────────────────────────┬──────────────────┘
         │                             │
         │ :8040                       │ :3001
         │                             │
┌────────▼──────────────┐    ┌─────────▼──────────────────┐
│   FRONTEND (Vite)     │    │   BACKEND (Express)        │
│   React + TypeScript  │    │   Node.js API Server       │
│   Service Worker      │    │   JWT Auth + Validation    │
└───────────────────────┘    └─────┬──────────────────────┘
                                   │
                     ┌─────────────┼──────────────┐
                     │             │              │
            ┌────────▼────┐  ┌────▼─────┐  ┌────▼─────┐
            │   MySQL     │  │  Redis   │  │  Sharp   │
            │  Database   │  │  Cache   │  │  Images  │
            └─────────────┘  └──────────┘  └──────────┘
```

### Camadas da Aplicação

```
┌──────────────────────────────────────┐
│      PRESENTATION LAYER              │  React Components + Pages
├──────────────────────────────────────┤
│      APPLICATION LAYER               │  Business Logic + State Management
├──────────────────────────────────────┤
│      API LAYER                       │  HTTP Client + Endpoints
├──────────────────────────────────────┤
│      BACKEND API LAYER               │  Express Routes + Controllers
├──────────────────────────────────────┤
│      BUSINESS LOGIC LAYER            │  Services + Validators
├──────────────────────────────────────┤
│      DATA ACCESS LAYER               │  MySQL Queries + Models
├──────────────────────────────────────┤
│      INFRASTRUCTURE LAYER            │  Cache + Logs + Monitoring
└──────────────────────────────────────┘
```

---

## ⚛️ Frontend

### Estrutura de Componentes

```
src/
├── components/
│   ├── ui/                    # Componentes base (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   └── ...
│   │
│   ├── cart/                  # Sistema de Carrinho
│   │   ├── CarrinhoDrawer.tsx
│   │   ├── CarrinhoItems.tsx
│   │   ├── OptimizedProductImage.tsx
│   │   ├── SmartProductSuggestions.tsx
│   │   ├── EnhancedCartIncentives.tsx
│   │   └── MobileOptimizedCart.tsx
│   │
│   ├── admin/                 # Componentes Admin
│   │   ├── Dashboard/
│   │   ├── Products/
│   │   ├── Orders/
│   │   └── Financial/
│   │
│   └── cliente/               # Componentes Cliente
│       ├── MinhaConta/
│       ├── Pedidos/
│       └── Enderecos/
│
├── pages/                     # Páginas da aplicação
│   ├── Index.tsx             # Home
│   ├── Loja.tsx              # Catálogo
│   ├── ProdutoDetalhe.tsx    # Detalhe produto
│   ├── Carrinho.tsx          # Carrinho
│   ├── auth/                 # Autenticação
│   ├── admin/                # Admin pages
│   └── cliente/              # Cliente pages
│
├── contexts/                  # Context Providers
│   ├── AuthContext.tsx       # Autenticação
│   ├── CartContext.tsx       # Carrinho
│   ├── ThemeContext.tsx      # Tema
│   └── ToastContext.tsx      # Notificações
│
├── hooks/                     # Custom Hooks
│   ├── useAuth.ts            # Hook de autenticação
│   ├── useCart.ts            # Hook de carrinho
│   ├── useCartRecovery.ts    # Recuperação carrinho
│   └── useProducts.ts        # Hook de produtos
│
├── services/                  # Serviços de API
│   ├── api.ts                # Cliente HTTP base
│   ├── authService.ts        # Serviço de auth
│   ├── productService.ts     # Serviço de produtos
│   └── orderService.ts       # Serviço de pedidos
│
├── utils/                     # Utilitários
│   ├── formatters.ts         # Formatação
│   ├── validators.ts         # Validação
│   └── constants.ts          # Constantes
│
└── types/                     # TypeScript Types
    ├── models.ts             # Modelos de dados
    ├── api.ts                # Tipos da API
    └── contexts.ts           # Tipos de contextos
```

### Gerenciamento de Estado

#### 1. Context API (Estado Global)

```typescript
// AuthContext - Autenticação do usuário
<AuthProvider>
  - user: User | null
  - isAuthenticated: boolean
  - login(email, password)
  - logout()
  - register(userData)
</AuthProvider>

// CartContext - Estado do carrinho
<CartProvider>
  - items: CartItem[]
  - total: number
  - addItem(product, quantity)
  - removeItem(itemId)
  - updateQuantity(itemId, quantity)
  - clearCart()
</CartProvider>
```

#### 2. TanStack Query (Estado do Servidor)

```typescript
// Cache e sincronização com backend
useQuery(['products'], fetchProducts)
useQuery(['orders'], fetchOrders)
useMutation(createOrder)
useMutation(updateProfile)
```

#### 3. Local State (useState/useReducer)

```typescript
// Estado local de componentes
const [isOpen, setIsOpen] = useState(false)
const [filters, setFilters] = useState({})
```

### Roteamento

```typescript
// React Router v6
<Routes>
  <Route path="/" element={<Index />} />
  <Route path="/loja" element={<Loja />} />
  <Route path="/produto/:id" element={<ProdutoDetalhe />} />
  <Route path="/carrinho" element={<Carrinho />} />
  
  {/* Rotas Protegidas */}
  <Route element={<ProtectedRoute />}>
    <Route path="/minha-conta" element={<MinhaConta />} />
    <Route path="/pedidos" element={<Pedidos />} />
  </Route>
  
  {/* Rotas Admin */}
  <Route element={<AdminRoute />}>
    <Route path="/admin" element={<Dashboard />} />
    <Route path="/admin/produtos" element={<Produtos />} />
    <Route path="/admin/pedidos" element={<PedidosAdmin />} />
  </Route>
</Routes>
```

### Performance Frontend

- **Code Splitting:** Rotas carregadas sob demanda
- **Lazy Loading:** Componentes pesados carregados quando necessário
- **Memoização:** `useMemo`, `useCallback` e `React.memo`
- **Debounce:** Em buscas e atualizações
- **Service Worker:** Cache de assets e API calls
- **Image Optimization:** Lazy loading + WebP + Placeholders

---

## 🔧 Backend

### Estrutura de Rotas

```javascript
server/
├── server.cjs                # Servidor principal
├── routes/
│   ├── admin-orders.cjs      # Rotas de pedidos admin
│   ├── financial-real-data.js # Dados financeiros
│   └── user-stats.js         # Estatísticas usuário
├── api-routes-minha-conta.cjs # Rotas área cliente
└── whatsapp-webhook-server.cjs # Webhook WhatsApp
```

### Principais Endpoints

#### Autenticação
```
POST   /api/auth/login           # Login cliente
POST   /api/auth/register        # Registro cliente
POST   /api/auth/logout          # Logout
POST   /api/admin/login          # Login admin
GET    /api/auth/verify          # Verificar token
POST   /api/auth/refresh         # Refresh token
```

##### Exemplos (Admin)

```bash
# Produção: login admin
curl -i -X POST "https://muhlstore.re9suainternet.com.br/api/admin/login" \
  -H "Content-Type: application/json" \
  --data '{"email":"admin@examplo.com","password":"admin1234"}'

# Verificação local (script utilitário)
node scripts/check-admin.cjs admin@examplo.com admin1234
```

#### Produtos
```
GET    /api/products             # Listar produtos
GET    /api/products/:id         # Detalhe produto
POST   /api/products             # Criar produto (admin)
PUT    /api/products/:id         # Atualizar produto (admin)
DELETE /api/products/:id         # Deletar produto (admin)
GET    /api/categories           # Listar categorias
```

#### Carrinho
```
GET    /api/cart                 # Obter carrinho
POST   /api/cart/add             # Adicionar item
PUT    /api/cart/update          # Atualizar quantidade
DELETE /api/cart/remove/:id      # Remover item
POST   /api/cart/clear           # Limpar carrinho
```

#### Pedidos
```
GET    /api/orders               # Listar pedidos
GET    /api/orders/:id           # Detalhe pedido
POST   /api/orders               # Criar pedido
PUT    /api/orders/:id/status    # Atualizar status (admin)
GET    /api/admin/orders         # Todos pedidos (admin)
```

#### Clientes
```
GET    /api/customers/profile    # Perfil cliente
PUT    /api/customers/profile    # Atualizar perfil
GET    /api/customers/:id/addresses # Endereços
POST   /api/customers/:id/addresses # Criar endereço
PUT    /api/customers/:id/addresses/:addressId # Atualizar
DELETE /api/customers/:id/addresses/:addressId # Deletar
```

#### Financeiro (Admin)
```
GET    /api/financial/transactions  # Lançamentos
POST   /api/financial/transactions  # Criar lançamento
GET    /api/financial/categories    # Categorias
GET    /api/financial/summary       # Resumo financeiro
```

#### Fornecedores (Admin)
```
GET    /api/suppliers            # Listar fornecedores
POST   /api/suppliers            # Criar fornecedor
PUT    /api/suppliers/:id        # Atualizar
DELETE /api/suppliers/:id        # Deletar
```

### Middleware Stack

```javascript
// Ordem de execução dos middlewares
app.use(sentry.requestHandler())     // 1. Monitoramento
app.use(helmetConfig)                // 2. Headers segurança
app.use(cors(corsOptions))           // 3. CORS
app.use(express.json({ limit: '10mb' })) // 4. Body parser
app.use(cookieParser())              // 5. Cookies
app.use(setDoubleSubmitCookie)       // 6. CSRF token
app.use(generalLimiter)              // 7. Rate limiting
app.use('/uploads', express.static('uploads')) // 8. Static files

// Rotas específicas com rate limiters customizados
app.use('/api/auth', authLimiter)
app.use('/api/cart', cartLimiter)
app.use('/api/products', productsLimiter)
```

### Validação de Dados

```javascript
// Exemplo de validação com express-validator
const { body, validationResult } = require('express-validator');

app.post('/api/products', [
  body('nome').trim().notEmpty().withMessage('Nome é obrigatório'),
  body('preco').isFloat({ min: 0 }).withMessage('Preço inválido'),
  body('estoque').isInt({ min: 0 }).withMessage('Estoque inválido'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  // Processar...
});
```

### Tratamento de Erros

```javascript
// Error handler centralizado
app.use((err, req, res, next) => {
  logger.error('Erro não tratado:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  sentry.captureException(err);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message
  });
});
```

---

## 🗄️ Banco de Dados

### Schema Principal

```sql
-- Usuários e Autenticação
admin_users
customers
customer_addresses
sessions

-- Produtos e Catálogo
products
categories
collections
product_images

-- Pedidos e Vendas
orders
order_items
order_status_history

-- Carrinho
cart_items
cart_recovery

-- Financeiro
financial_transactions
financial_categories

-- Fornecedores
suppliers
supplier_contacts

-- Blog e Conteúdo
blog_posts
blog_categories

-- Notificações
notifications
email_queue
push_subscriptions

-- Sistema
settings
logs
audit_trail
```

### Relacionamentos Principais

```
customers (1) ──────> (N) orders
customers (1) ──────> (N) customer_addresses
customers (1) ──────> (N) cart_items

orders (1) ──────> (N) order_items
orders (N) ──────> (1) customers

products (1) ──────> (N) order_items
products (1) ──────> (N) cart_items
products (N) ──────> (1) categories
products (N) ──────> (N) collections

suppliers (1) ──────> (N) products
```

### Índices Importantes

```sql
-- Performance de queries
CREATE INDEX idx_products_category ON products(categoria_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_date ON orders(created_at);
CREATE INDEX idx_cart_customer ON cart_items(customer_id);

-- Busca full-text
CREATE FULLTEXT INDEX idx_products_search ON products(nome, descricao);
```

### Migrations

```
database/migrations/
├── 001_initial_schema.sql
├── 002_add_collections.sql
├── 003_financial_module.sql
├── 004_blog_system.sql
├── 005_create_customer_addresses_table.sql
└── 006_add_cart_recovery.sql
```

---

## 🔐 Segurança

### 1. Autenticação JWT

```javascript
// Geração de token
const token = jwt.sign(
  { userId: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

// Verificação de token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};
```

### 1.1. Login Admin (Fluxo atual)

```text
1) Backend normaliza email (trim + lowerCase)
2) Busca em admin_users por email
3) Compara SHA256(senha) com senha_hash
4) Em caso de sucesso, emite token de sessão de admin
5) Retorna { ok: true, user, token } e seta cookie admin_token
```

```bash
# Ajustar senha/status do admin diretamente no banco, se necessário
mysql> UPDATE admin_users
      SET senha_hash = SHA2('admin1234', 256), status='ativo'
      WHERE email='admin@examplo.com';
```

### 2. Rate Limiting

```javascript
// Configurações por tipo de rota
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // máximo 100 requests
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5 // máximo 5 tentativas de login
});

const cartLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30 // máximo 30 operações de carrinho por minuto
});
```

### 3. Sanitização de Dados

```javascript
const sanitizeObject = (obj) => {
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = validator.escape(value.trim());
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
};
```

### 4. CSRF Protection

```javascript
// Double Submit Cookie Pattern
const setDoubleSubmitCookie = (req, res, next) => {
  if (!req.cookies.csrf_token) {
    const token = crypto.randomBytes(32).toString('hex');
    res.cookie('csrf_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
  }
  next();
};

// Validação
const validateCsrf = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const cookieToken = req.cookies.csrf_token;
  
  if (token !== cookieToken) {
    return res.status(403).json({ error: 'Token CSRF inválido' });
  }
  next();
};
```

### 5. SQL Injection Prevention

```javascript
// SEMPRE usar prepared statements
const [results] = await pool.execute(
  'SELECT * FROM products WHERE id = ? AND status = ?',
  [productId, 'ativo']
);

// NUNCA concatenar SQL
// ❌ ERRADO:
const query = `SELECT * FROM products WHERE id = ${productId}`;

// ✅ CORRETO:
const [results] = await pool.execute(
  'SELECT * FROM products WHERE id = ?',
  [productId]
);
```

### 6. Headers de Segurança (Helmet)

```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
})
```

---

## ⚡ Performance

### Cache Strategy

```javascript
// Redis cache para queries frequentes
const getCachedProducts = async () => {
  const cacheKey = 'products:active';
  
  // Tentar buscar do cache
  const cached = await redisCache.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Buscar do banco
  const [products] = await pool.execute(
    'SELECT * FROM products WHERE status = ?',
    ['ativo']
  );
  
  // Salvar no cache (TTL: 5 minutos)
  await redisCache.setex(cacheKey, 300, JSON.stringify(products));
  
  return products;
};
```

### Database Optimization

```sql
-- Query otimizada com índices
EXPLAIN SELECT 
  p.*, 
  c.nome as categoria_nome
FROM products p
INNER JOIN categories c ON p.categoria_id = c.id
WHERE p.status = 'ativo'
  AND p.estoque > 0
ORDER BY p.created_at DESC
LIMIT 20;

-- Connection pooling
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
```

### Frontend Optimization

```typescript
// Code splitting por rota
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProdutoDetalhe = lazy(() => import('./pages/ProdutoDetalhe'));

// Memoização de cálculos
const totalCarrinho = useMemo(() => {
  return items.reduce((sum, item) => sum + (item.preco * item.quantidade), 0);
}, [items]);

// Debounce em busca
const debouncedSearch = useMemo(
  () => debounce((term) => searchProducts(term), 300),
  []
);
```

---

## 🏢 Infraestrutura

### Process Management (PM2)

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'server/server.cjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        SERVER_PORT: 3001
      },
      error_file: 'logs/api-error.log',
      out_file: 'logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'frontend-preview',
      script: 'npm',
      args: 'run preview:pm2',
      env: {
        PORT: 8040
      }
    }
  ]
};
```

### Logging (Winston)

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### Monitoring (Sentry)

```javascript
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Capturar exceções
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 🔌 Integrações

### WhatsApp Business API

```javascript
// Webhook para receber mensagens
app.post('/webhook', async (req, res) => {
  const { entry } = req.body;
  
  for (const item of entry) {
    for (const change of item.changes) {
      if (change.field === 'messages') {
        await processWhatsAppMessage(change.value);
      }
    }
  }
  
  res.sendStatus(200);
});

// Enviar mensagem
const sendWhatsAppMessage = async (to, message) => {
  const response = await axios.post(
    `https://graph.facebook.com/v17.0/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message }
    },
    {
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );
  
  return response.data;
};
```

### Email Service (Nodemailer)

```javascript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendOrderConfirmation = async (order) => {
  await transporter.sendMail({
    from: '"Muhlstore" <noreply@muhlstore.com.br>',
    to: order.customer_email,
    subject: `Pedido #${order.id} confirmado!`,
    html: generateOrderEmailTemplate(order)
  });
};
```

### Payment Gateway (Mercado Pago)

```javascript
const mercadopago = require('mercadopago');

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN
});

const createPayment = async (orderData) => {
  const preference = {
    items: orderData.items.map(item => ({
      title: item.nome,
      unit_price: item.preco,
      quantity: item.quantidade
    })),
    back_urls: {
      success: `${process.env.FRONTEND_URL}/pedido/sucesso`,
      failure: `${process.env.FRONTEND_URL}/pedido/erro`,
      pending: `${process.env.FRONTEND_URL}/pedido/pendente`
    },
    notification_url: `${process.env.BACKEND_URL}/api/payments/webhook`
  };
  
  const response = await mercadopago.preferences.create(preference);
  return response.body;
};
```

---

## 🔄 Fluxos Principais

### Fluxo de Autenticação

```
1. Usuário envia email + senha
2. Backend valida credenciais
3. Verifica hash SHA256 da senha
4. Gera JWT token
5. Retorna token + dados do usuário
6. Frontend armazena token (localStorage)
7. Frontend adiciona token em headers (Authorization: Bearer TOKEN)
8. Backend valida token em rotas protegidas
```

### Fluxo de Compra

```
1. Cliente adiciona produtos ao carrinho
2. Carrinho salvo no Context + LocalStorage
3. Cliente vai para checkout
4. Preenche dados de entrega
5. Escolhe método de pagamento
6. Backend cria pedido (status: pendente)
7. Gera link/QR de pagamento
8. Cliente efetua pagamento
9. Webhook recebe confirmação
10. Backend atualiza pedido (status: pago)
11. Atualiza estoque
12. Envia email de confirmação
13. Cliente recebe notificação
```

### Fluxo de Recuperação de Carrinho

```
1. Cliente adiciona itens ao carrinho
2. Sistema detecta inatividade (15min)
3. Salva carrinho no banco (cart_recovery)
4. Scheduler busca carrinhos abandonados (diário)
5. Envia email de recuperação
6. Cliente clica no link do email
7. Carrinho é restaurado automaticamente
8. Mostra banner de recuperação
```

---

## 📊 Métricas e Monitoramento

### KPIs Técnicos

- **Uptime:** 99.9% (meta)
- **Response Time:** < 200ms (média)
- **Error Rate:** < 0.1%
- **Database Query Time:** < 50ms
- **Cache Hit Rate:** > 80%

### Health Checks

```javascript
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      disk: await checkDiskSpace()
    }
  };
  
  res.json(health);
});
```

---

## 🔧 Troubleshooting Técnico

### Problemas Resolvidos (Out 2024)

#### 1. Endereços não persistiam no banco de dados

**Sintoma:** Endereços eram criados na interface mas desapareciam ao recarregar.

**Root Cause:** 
- Frontend (`EnhancedAddressManager.tsx`) salvava apenas no estado React local
- Não havia chamada à API para persistir os dados

**Solução Implementada:**
```typescript
// Antes (❌)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const newAddress: Address = {
    id: Date.now().toString(), // ID local
    ...formData
  };
  setAddresses(prev => [...prev, newAddress]); // Apenas estado local
};

// Depois (✅)
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const response = await fetch('/api/addresses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  await loadAddresses(); // Recarrega da API
};
```

**Backend Fix:**
```javascript
// Adicionado id (UUID) no INSERT
const savedAddressId = uuidv4();
await pool.execute(
  `INSERT INTO customer_addresses (id, customer_id, tipo, nome, cep, rua, ...)
   VALUES (?, ?, ?, ?, ?, ?, ...)`,
  [savedAddressId, userId, tipo, nome, cep, rua, ...]
);
```

#### 2. Erros SQL: Unknown column 'cliente_id'

**Sintoma:** Query falhava com `Unknown column 'cliente_id' in 'where clause'`

**Root Cause:** 
- Tabela usa `customer_id` mas código tinha `cliente_id` (inconsistência)
- Ocorreu em 3 queries diferentes

**Solução:**
```javascript
// Corrigido em server/server.cjs (3 locais)
// Linha 6432 - GET /api/customers/current/stats
const [addresses] = await pool.execute(
  'SELECT COUNT(*) as total FROM customer_addresses WHERE customer_id = ?', 
  [userId]
);

// Linha 6725 - POST /api/dev/user-setup
const [existingAddress] = await pool.execute(
  'SELECT id FROM customer_addresses WHERE customer_id = ?', 
  [userId]
);

// Linha 6763 - GET /api/customers/:userId/stats
const [addresses] = await pool.execute(
  'SELECT COUNT(*) as total FROM customer_addresses WHERE customer_id = ?', 
  [userId]
);
```

#### 3. Erro: Unknown column 'status' em customer_coupons

**Sintoma:** `Unknown column 'status' in 'where clause'`

**Root Cause:** 
- Tabela `customer_coupons` usa `usado` (tinyint) e `data_fim` (datetime)
- Código buscava por coluna `status` inexistente

**Solução:**
```javascript
// Antes (❌)
const [coupons] = await pool.execute(
  'SELECT COUNT(*) as total FROM customer_coupons WHERE customer_id = ? AND status = "active"',
  [userId]
);

// Depois (✅)
const [coupons] = await pool.execute(
  'SELECT COUNT(*) as total FROM customer_coupons WHERE customer_id = ? AND usado = 0 AND data_fim >= NOW()',
  [userId]
);
```

#### 4. TypeError: Cannot read properties of undefined (reading 'map')

**Sintoma:** Página "Minha Conta" crashava ao tentar renderizar pedidos

**Root Cause:**
- Backend não retornava colunas `items` e `status_timeline` em alguns casos
- Frontend tentava fazer `.map()` em `undefined`

**Solução:**
```typescript
// Proteção com || []
{(selectedOrder.items || []).map((item) => (
  <div key={item.id}>...</div>
))}

// Renderização condicional
{selectedOrder.status_timeline && selectedOrder.status_timeline.length > 0 && (
  <div>
    <h3>Histórico de Status</h3>
    {selectedOrder.status_timeline.map((entry, index) => (...))}
  </div>
)}
```

**Backend Fix:**
```javascript
// Adicionado DialogDescription para acessibilidade
<DialogHeader>
  <DialogTitle>Detalhes do Pedido</DialogTitle>
  <DialogDescription>
    Informações completas sobre seu pedido, incluindo status, itens e histórico.
  </DialogDescription>
</DialogHeader>
```

#### 5. Colunas inexistentes no SELECT de orders

**Sintoma:** 500 error ao buscar pedidos: `Unknown column 'o.tracking_code'`

**Root Cause:**
- SELECT incluía colunas que não existem na tabela `orders`:
  - `tracking_code`, `payment_status`, `estimated_delivery`, `notes`
  - `customer_telefone_real`, `customer_total_orders`, etc.

**Solução:**
```javascript
// server/routes/orders-sync.cjs
// Removidas todas as colunas inexistentes do SELECT
const [orders] = await pool.execute(`
  SELECT
    o.id,
    o.user_id,
    o.customer_id,
    o.status,
    o.total,
    o.nome as customer_name,
    o.email as customer_email,
    o.telefone as customer_phone,
    o.endereco as shipping_address,
    o.metodo_pagamento as payment_method,
    o.created_at,
    o.updated_at,
    c.nome as customer_nome,
    c.email as customer_email_real,
    (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as items_count
  FROM orders o
  LEFT JOIN customers c ON o.customer_id = c.id
  WHERE ...
`, [...queryParams]);
```

#### 6. Auto-criação de cliente em customers

**Sintoma:** `GET /api/customers/by-email/:email` retornava 404 mesmo com usuário válido

**Solução Implementada:**
```javascript
// server/server.cjs - GET /api/customers/by-email/:email
const [customers] = await pool.execute(
  'SELECT id, nome, email FROM customers WHERE email = ?', 
  [email]
);

if (customers.length === 0) {
  // Busca em users
  const [users] = await pool.execute(
    'SELECT id, nome, email FROM users WHERE email = ?', 
    [email]
  );
  
  if (users.length > 0) {
    // Auto-criar em customers
    await pool.execute(
      'INSERT INTO customers (id, nome, email, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [users[0].id, users[0].nome || 'Cliente', email]
    );
    
    // Recarrega dados
    [customers] = await pool.execute(
      'SELECT id, nome, email FROM customers WHERE email = ?', 
      [email]
    );
  }
}
```

### Ferramentas de Diagnóstico

```bash
# 1. Verificar estrutura de tabela
mysql -u root -p'PASSWORD' -h 127.0.0.1 rare_toy_companion \
  -e "DESCRIBE customer_addresses;"

# 2. Ver logs do backend filtrados
pm2 logs api --lines 100 --nostream | grep -i "erro\|error\|failed"

# 3. Testar endpoint diretamente
curl -X POST https://muhlstore.re9suainternet.com.br/api/addresses \
  -H "Content-Type: application/json" \
  -b "cookies.txt" \
  -d '{"nome":"Casa","cep":"90000000","endereco":"Rua Teste",...}'

# 4. Verificar dados salvos
mysql -u root -p'PASSWORD' -h 127.0.0.1 rare_toy_companion \
  -e "SELECT id, customer_id, nome, cidade FROM customer_addresses ORDER BY created_at DESC LIMIT 5;"
```

---

## 🚀 Próximos Passos

### Melhorias Planejadas

1. **Microservices:** Separar módulos em serviços independentes
2. **GraphQL:** Adicionar endpoint GraphQL para queries complexas
3. **WebSockets:** Real-time para chat e notificações
4. **CDN:** Distribuição de assets estáticos
5. **Load Balancer:** Múltiplas instâncias do backend
6. **Queue System:** Bull/BullMQ para jobs assíncronos
7. **ElasticSearch:** Busca avançada e facetada

---

**Última Atualização:** 31 de Outubro de 2024

**[⬆ Voltar ao topo](#-arquitetura-técnica---rare-toy-companion)**

