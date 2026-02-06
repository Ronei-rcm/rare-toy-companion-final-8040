# 🔍 Identificação de Projetos por Serviço PM2

**Data:** 17 de Janeiro de 2025  
**Análise:** Identificação do projeto de origem de cada serviço PM2

---

## 📊 Serviços PM2 Ativos

| ID | Nome | Projeto | Diretório | Script | Status |
|---|---|---|---|---|---|
| 0 | `whatsapp-webhook` | **Rare Toy Companion** | `/home/git-muhlstore/rare-toy-companion-final-8040` | `server/whatsapp-webhook-server.cjs` | ✅ Online |
| 3 | `api` | **Rare Toy Companion** | `/home/git-muhlstore/rare-toy-companion-final-8040` | `server/server.cjs` | ✅ Online |
| 4 | `nimble-sheet-backend` | **Nimble Sheet App** | `/home/asun/nimble-sheet-app/backend` | `server.js` | ✅ Online |
| 5 | `web` | **Rare Toy Companion** | `/home/git-muhlstore/rare-toy-companion-final-8040` | `server/proxy-debug.cjs` | ✅ Online |

---

## 🎯 Projeto: Rare Toy Companion

**Diretório Raiz:** `/home/git-muhlstore/rare-toy-companion-final-8040`

### ✅ Serviços deste Projeto:

#### 1. **`api`** (ID: 3)
- **Script:** `server/server.cjs`
- **CWD:** `/home/git-muhlstore/rare-toy-companion-final-8040`
- **Porta:** 3001
- **Função:** Backend API principal

#### 2. **`web`** (ID: 5)
- **Script:** `server/proxy-debug.cjs`
- **CWD:** `/home/git-muhlstore/rare-toy-companion-final-8040`
- **Porta:** 8040
- **Função:** Frontend/Proxy server

#### 3. **`whatsapp-webhook`** (ID: 0)
- **Script:** `server/whatsapp-webhook-server.cjs`
- **CWD:** `/home/git-muhlstore/rare-toy-companion-final-8040`
- **Porta:** 3002
- **Função:** Webhook WhatsApp Business

**Total:** 3 serviços deste projeto

---

## 🌐 Projeto: Nimble Sheet App

**Diretório Raiz:** `/home/asun/nimble-sheet-app`

### ✅ Serviços deste Projeto:

#### 1. **`nimble-sheet-backend`** (ID: 4)
- **Script:** `backend/server.js`
- **CWD:** `/home/asun/nimble-sheet-app/backend`
- **Porta:** (não especificada no PM2, mas provavelmente configurada no script)
- **Função:** Backend do projeto Nimble Sheet

**Total:** 1 serviço deste projeto

---

## 📋 Resumo por Projeto

### **Rare Toy Companion** (`/home/git-muhlstore/rare-toy-companion-final-8040`)
```
✅ api (ID: 3)
✅ web (ID: 5)
✅ whatsapp-webhook (ID: 0)
```
**Status:** Todos os 3 serviços estão online e configurados corretamente

### **Nimble Sheet App** (`/home/asun/nimble-sheet-app`)
```
✅ nimble-sheet-backend (ID: 4)
```
**Status:** Serviço online (projeto externo, não modificar)

---

## 🔧 Gerenciamento por Projeto

### Para gerenciar apenas os serviços do **Rare Toy Companion**:

```bash
# Listar apenas serviços do projeto atual
pm2 list | grep -E "api|web|whatsapp-webhook"

# Parar todos os serviços do Rare Toy Companion
pm2 stop api web whatsapp-webhook

# Iniciar todos os serviços do Rare Toy Companion
pm2 start api web whatsapp-webhook

# Reiniciar usando ecosystem.config.cjs (apenas Rare Toy Companion)
cd /home/git-muhlstore/rare-toy-companion-final-8040
pm2 restart ecosystem.config.cjs

# Ver logs apenas do Rare Toy Companion
pm2 logs api web whatsapp-webhook
```

### Para gerenciar o serviço do **Nimble Sheet App**:

⚠️ **ATENÇÃO:** Este é um projeto separado. Só modifique se tiver acesso/permissão.

```bash
# Verificar status
pm2 describe nimble-sheet-backend

# Logs (se necessário)
pm2 logs nimble-sheet-backend
```

---

## 📁 Estrutura de Diretórios

```
/home/
├── git-muhlstore/
│   └── rare-toy-companion-final-8040/    ← PROJETO 1
│       ├── server/
│       │   ├── server.cjs                ← api (ID: 3)
│       │   ├── proxy-debug.cjs           ← web (ID: 5)
│       │   └── whatsapp-webhook-server.cjs ← whatsapp-webhook (ID: 0)
│       └── ecosystem.config.cjs
│
└── asun/
    └── nimble-sheet-app/                  ← PROJETO 2
        └── backend/
            └── server.js                  ← nimble-sheet-backend (ID: 4)
```

---

## ✅ Verificação de Integridade

### Serviços do Rare Toy Companion:
- ✅ `api` → `server/server.cjs` (existe)
- ✅ `web` → `server/proxy-debug.cjs` (existe)
- ✅ `whatsapp-webhook` → `server/whatsapp-webhook-server.cjs` (existe)
- ✅ Todos os 3 serviços estão configurados no `ecosystem.config.cjs`

### Serviço do Nimble Sheet App:
- ✅ `nimble-sheet-backend` → `/home/asun/nimble-sheet-app/backend/server.js` (existe)
- ⚠️ Não está no `ecosystem.config.cjs` do Rare Toy Companion (correto, é outro projeto)

---

## 🎯 Conclusão

**Total de projetos identificados:** 2
- **Rare Toy Companion:** 3 serviços
- **Nimble Sheet App:** 1 serviço

**Total de serviços PM2:** 4

Todos os serviços estão **online** e rodando corretamente em seus respectivos projetos.

---

**Última atualização:** 17 de Janeiro de 2025
