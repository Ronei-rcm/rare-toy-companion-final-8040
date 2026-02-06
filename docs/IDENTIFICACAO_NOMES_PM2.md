# 🏷️ Identificação de Serviços PM2 por Nome

**Data:** 17 de Janeiro de 2025  
**Análise:** Identificação de cada serviço apenas pelo nome

---

## 📋 Serviços PM2 Ativos (por Nome)

### 1. **`api`** 

✅ **Projeto:** Rare Toy Companion  
📁 **Função:** Backend API Principal  
🔌 **Porta:** 3001  
💾 **Memória:** ~226 MB  

**Identificação pelo nome:**
- Nome curto e direto: `api`
- Indica que é o serviço de API REST do backend
- Padrão comum em projetos Node.js/Express

---

### 2. **`web`**

✅ **Projeto:** Rare Toy Companion  
📁 **Função:** Frontend/Proxy Server  
🔌 **Porta:** 8040  
💾 **Memória:** ~55 MB  

**Identificação pelo nome:**
- Nome genérico: `web`
- Indica serviço web (frontend/proxy)
- Comum para servidores que servem aplicações web

---

### 3. **`whatsapp-webhook`**

✅ **Projeto:** Rare Toy Companion  
📁 **Função:** Webhook WhatsApp Business  
🔌 **Porta:** 3002  
💾 **Memória:** ~62 MB  

**Identificação pelo nome:**
- Nome descritivo: `whatsapp-webhook`
- Indica claramente que é um webhook para WhatsApp
- Padrão: `[integração]-webhook`

---

### 4. **`nimble-sheet-backend`**

🌐 **Projeto:** Nimble Sheet App (outro projeto)  
📁 **Função:** Backend do Nimble Sheet  
💾 **Memória:** ~66 MB  

**Identificação pelo nome:**
- Nome composto: `nimble-sheet-backend`
- Indica:
  - `nimble-sheet` = Nome do projeto/aplicação
  - `backend` = Tipo de serviço
- **Padrão:** `[nome-projeto]-[tipo-serviço]`

---

## 📊 Análise dos Padrões de Nomenclatura

### **Padrão 1: Nomes Simples**
```
api     → Serviço de API REST
web     → Serviço web/frontend
```
✅ **Vantagem:** Curto e direto  
⚠️ **Desvantagem:** Pode ser genérico demais

---

### **Padrão 2: Nomes Descritivos**
```
whatsapp-webhook  → Webhook específico para WhatsApp
```
✅ **Vantagem:** Muito claro sobre a função  
✅ **Bom para:** Serviços específicos/isolados

---

### **Padrão 3: Nomes Compostos**
```
nimble-sheet-backend  → [projeto]-[tipo]
```
✅ **Vantagem:** Identifica projeto + função  
✅ **Bom para:** Múltiplos projetos no mesmo PM2

---

## 🎯 Identificação Rápida por Nome

| Nome do Serviço | Projeto | Tipo | Identificação |
|---|---|---|---|
| `api` | Rare Toy Companion | Backend API | ✅ Nome simples - API REST |
| `web` | Rare Toy Companion | Frontend/Proxy | ✅ Nome simples - Serviço web |
| `whatsapp-webhook` | Rare Toy Companion | Webhook | ✅ Descritivo - Webhook WhatsApp |
| `nimble-sheet-backend` | Nimble Sheet App | Backend | ✅ Composto - [projeto]-backend |

---

## 💡 Recomendações de Nomenclatura

### **Para Projetos Únicos (PM2 isolado):**
✅ **Usar nomes simples:**
- `api`
- `web`
- `worker`
- `scheduler`

### **Para Múltiplos Projetos (PM2 compartilhado):**
✅ **Usar nomes compostos:**
- `[projeto]-api`
- `[projeto]-web`
- `[projeto]-worker`

### **Para Serviços Específicos:**
✅ **Usar nomes descritivos:**
- `whatsapp-webhook`
- `email-service`
- `payment-processor`

---

## 🔍 Como Identificar Serviços Apenas pelo Nome

### **Palavras-chave para identificação:**

1. **`api`** → Sempre é backend/API REST
2. **`web`** → Geralmente é frontend/proxy
3. **`backend`** → Backend de algum projeto
4. **`webhook`** → Serviço de webhook
5. **`worker`** → Processo de background
6. **`scheduler`** → Agendador de tarefas

### **Nomes com hífen (`-`):**
- Primeira parte = Projeto/integração
- Segunda parte = Tipo de serviço

Exemplos:
- `whatsapp-webhook` = Webhook do WhatsApp
- `nimble-sheet-backend` = Backend do Nimble Sheet
- `email-service` = Serviço de email

---

## ✅ Resumo de Identificação

### **Serviços do Rare Toy Companion:**
```
✅ api              → Backend API
✅ web              → Frontend/Proxy
✅ whatsapp-webhook → Webhook WhatsApp
```

### **Serviços de Outros Projetos:**
```
🌐 nimble-sheet-backend → Backend do Nimble Sheet
```

---

## 📝 Checklist de Identificação

Ao ver um nome de serviço PM2, você pode identificar:

- [ ] **Nome simples?** → Provavelmente projeto único
- [ ] **Nome com hífen?** → `[projeto/função]-[tipo]`
- [ ] **Contém "api"?** → Backend/API REST
- [ ] **Contém "web"?** → Frontend/Servidor web
- [ ] **Contém "webhook"?** → Serviço de webhook
- [ ] **Contém "backend"?** → Backend de algum projeto

---

**Última atualização:** 17 de Janeiro de 2025
