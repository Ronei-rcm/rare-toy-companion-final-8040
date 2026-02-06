# 📚 Explicação dos Serviços PM2 - Rare Toy Companion

**Data:** 17 de Janeiro de 2025  
**Projeto:** rare-toy-companion-final-8040

---

## 🎯 Visão Geral

Atualmente, você tem **4 processos PM2** rodando no servidor. Vou explicar cada um deles em detalhes:

---

## ✅ Serviços do Projeto Rare Toy Companion

### 1. **`api`** (ID: 3) - Backend API Principal

```
📊 Status: Online
💾 Memória: ~226 MB
🔌 Porta: 3001
📁 Script: server/server.cjs
```

#### **O que faz:**
Este é o **coração do backend** da sua aplicação. Ele é responsável por:

- ✅ **API REST completa** - Todas as rotas `/api/*`
- ✅ **Autenticação** - Login, registro, recuperação de senha, JWT
- ✅ **Produtos** - CRUD de produtos, categorias, estoque
- ✅ **Carrinho** - Gerenciamento de carrinho de compras
- ✅ **Pedidos** - Processamento e gestão de pedidos
- ✅ **Admin** - Painel administrativo completo
- ✅ **Clientes** - Gestão de clientes e endereços
- ✅ **Fornecedores** - CRUD de fornecedores
- ✅ **Financeiro** - Transações financeiras
- ✅ **Uploads** - Gerenciamento de imagens e arquivos
- ✅ **Banco de Dados** - Conexão MySQL com pool de conexões
- ✅ **Cache Redis** - Cache de dados para performance
- ✅ **Segurança** - Rate limiting, CORS, Helmet, CSRF

#### **Tecnologias:**
- Node.js + Express
- MySQL2 (pool de conexões)
- Redis (cache)
- JWT (autenticação)
- bcrypt (hash de senhas)
- Multer (uploads)
- Nodemailer (emails)

#### **Rotas Principais:**
```
POST   /api/auth/login          - Login de usuários
POST   /api/auth/register       - Registro de novos usuários
GET    /api/products            - Listar produtos
GET    /api/products/:id        - Detalhes de produto
POST   /api/cart/add            - Adicionar ao carrinho
GET    /api/admin/*             - Rotas administrativas
... e muitas outras
```

---

### 2. **`web`** (ID: 5) - Frontend/Proxy Server

```
📊 Status: Online
💾 Memória: ~55 MB
🔌 Porta: 8040
📁 Script: server/proxy-debug.cjs
```

#### **O que faz:**
Este é o **servidor que serve o frontend** (aplicação React) em produção:

- ✅ **Servir Build Vite** - Serve os arquivos estáticos compilados (HTML, CSS, JS)
- ✅ **Proxy reverso** - Encaminha requisições `/api/*` para o backend na porta 3001
- ✅ **SPA (Single Page Application)** - Configura rotas para React Router
- ✅ **Compressão** - Comprime arquivos estáticos para melhor performance
- ✅ **Cache headers** - Configura headers de cache para assets estáticos

#### **Fluxo de Requisições:**
```
Cliente (Navegador)
    ↓
https://muhlstore.re9suainternet.com.br (porta 8040)
    ↓
┌─────────────────────────────────────┐
│  server/proxy-debug.cjs (web)      │
│                                     │
│  Requisição é para /api/* ?        │
│         ↓              ↓            │
│     SIM (proxy)    NÃO (arquivo)   │
│         ↓              ↓            │
│  Backend:3001    dist/* (build)    │
└─────────────────────────────────────┘
```

#### **Por que existe:**
Em desenvolvimento, você usa `npm run dev` que roda o Vite dev server.  
Em produção, o Vite gera um `build` (arquivos estáticos) que precisam ser servidos por um servidor. O `proxy-debug.cjs` faz isso.

---

### 3. **`whatsapp-webhook`** (ID: 0) - Webhook WhatsApp Business

```
📊 Status: Online
💾 Memória: ~62 MB
🔌 Porta: 3002
📁 Script: server/whatsapp-webhook-server.cjs
```

#### **O que faz:**
Servidor dedicado para receber **webhooks do WhatsApp Business API**:

- ✅ **Receber webhooks** - Recebe notificações do Meta/WhatsApp
- ✅ **Verificação de webhook** - Valida requisições do WhatsApp (GET com challenge)
- ✅ **Processar mensagens** - Processa mensagens recebidas via webhook
- ✅ **Enviar respostas** - Envia mensagens automáticas via WhatsApp API
- ✅ **Salvar no banco** - Registra interações no banco de dados
- ✅ **Autenticação** - Verifica token/secreto do webhook

#### **Endpoints:**
```
GET  /webhook         - Verificação do webhook (challenge do Meta)
POST /webhook         - Receber mensagens/eventos do WhatsApp
POST /send-message    - Enviar mensagem via WhatsApp (se configurado)
```

#### **Por que separado?**
O webhook do WhatsApp precisa estar em uma porta/URL específica configurada no Meta Business. Separar em um servidor dedicado facilita:
- Configuração independente
- Escalabilidade
- Monitoramento isolado
- Manutenção sem afetar o backend principal

---

## 🌐 Serviços de Outros Projetos

### 4. **`nimble-sheet-backend`** (ID: 4) - Outro Projeto

```
📊 Status: Online
💾 Memória: ~66 MB
📁 Script: /home/asun/nimble-sheet-app/backend/server.js
```

#### **O que é:**
Este é um **projeto diferente** (não faz parte do Rare Toy Companion):

- ✅ Pertence a outro projeto (`nimble-sheet-app`)
- ✅ Está em outro diretório (`/home/asun/nimble-sheet-app/`)
- ✅ Não deve ser removido (é de outro sistema)

#### **Recomendação:**
✅ **MANTER** - Não faça nada com este processo. Ele é gerenciado por outro projeto.

---

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│                    Cliente (Navegador)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ↓
        ┌───────────────────────────────┐
        │  https://muhlstore...:8040    │
        │  (Nginx → proxy reverso)      │
        └───────────────┬───────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ↓                               ↓
┌───────────────────┐         ┌──────────────────┐
│   web (8040)      │         │  whatsapp-webhook│
│   proxy-debug.cjs │         │  (3002)          │
│                   │         └────────┬─────────┘
│   Serve arquivos  │                  │
│   estáticos do    │                  ↓
│   frontend React  │         ┌──────────────────┐
└────────┬──────────┘         │  Meta/WhatsApp   │
         │                    │  Business API    │
         │ Proxy /api/*       └──────────────────┘
         ↓
┌───────────────────┐
│   api (3001)      │
│   server.cjs      │
│                   │
│   Backend API     │
│   - Autenticação  │
│   - Produtos      │
│   - Carrinho      │
│   - Pedidos       │
│   - Admin         │
└────────┬──────────┘
         │
         ↓
┌───────────────────┐
│   MySQL Database  │
│   Redis Cache     │
└───────────────────┘
```

---

## 🔄 Fluxo de Comunicação

### **1. Usuário acessa o site:**
```
Cliente → Nginx (porta 443/80) → web (8040) → Serve arquivos do build
```

### **2. Usuário faz login:**
```
Cliente → Nginx → web (8040) → api (3001) → MySQL → Resposta → Cliente
```

### **3. Usuário recebe mensagem WhatsApp:**
```
Meta/WhatsApp → whatsapp-webhook (3002) → MySQL → Processa mensagem
```

---

## 💡 Comandos Úteis

### **Ver logs em tempo real:**
```bash
pm2 logs api              # Logs do backend
pm2 logs web              # Logs do frontend/proxy
pm2 logs whatsapp-webhook # Logs do webhook
pm2 logs                  # Todos os logs juntos
```

### **Monitorar recursos:**
```bash
pm2 monit                 # Monitor em tempo real (CPU, memória)
```

### **Reiniciar serviços:**
```bash
pm2 restart api           # Reiniciar apenas o backend
pm2 restart ecosystem.config.cjs  # Reiniciar todos os serviços do projeto
```

### **Ver status:**
```bash
pm2 list                  # Lista todos os processos
pm2 describe api          # Detalhes do processo 'api'
```

---

## ✅ Conclusão

Você tem uma arquitetura **bem organizada** com separação de responsabilidades:

- 🎯 **`api`** - Backend principal (toda a lógica de negócio)
- 🌐 **`web`** - Frontend em produção (serve o build React)
- 📱 **`whatsapp-webhook`** - Integração WhatsApp (isolado)
- 📋 **`nimble-sheet-backend`** - Outro projeto (não mexer)

Todos os serviços estão **online** e funcionando corretamente! ✅

---

**Última atualização:** 17 de Janeiro de 2025
