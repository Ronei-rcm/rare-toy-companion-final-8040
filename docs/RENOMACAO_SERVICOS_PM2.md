# 🔄 Renomeação de Serviços PM2 com Prefixo do Projeto

**Data:** 17 de Janeiro de 2025  
**Objetivo:** Renomear serviços PM2 para incluir prefixo `muhlstore_` para fácil identificação

---

## 🎯 Motivo da Renomeação

Renomear os serviços para incluir o prefixo do projeto facilita:
- ✅ **Identificação rápida** de qual projeto cada serviço pertence
- ✅ **Organização** quando há múltiplos projetos no mesmo PM2
- ✅ **Evitar conflitos** de nomes entre projetos
- ✅ **Clareza** na documentação e logs

---

## 📋 Serviços Atuais vs Propostos

### **ANTES (Nomes Atuais):**

| Nome Atual | Função | Projeto |
|---|---|---|
| `api` | Backend API | Rare Toy Companion |
| `web` | Frontend/Proxy | Rare Toy Companion |
| `whatsapp-webhook` | Webhook WhatsApp | Rare Toy Companion |

### **DEPOIS (Nomes Propostos com Prefixo):**

| Nome Novo | Nome Atual | Função | Projeto |
|---|---|---|---|
| `muhlstore_api` | `api` | Backend API | Rare Toy Companion |
| `muhlstore_web` | `web` | Frontend/Proxy | Rare Toy Companion |
| `muhlstore_whatsapp-webhook` | `whatsapp-webhook` | Webhook WhatsApp | Rare Toy Companion |

---

## 🔧 Comandos para Renomeação

### **Opção 1: Renomeação Manual (PM2)**

```bash
# 1. Renomear 'api' para 'muhlstore_api'
pm2 delete api
pm2 start ecosystem.config.cjs --only api --name muhlstore_api

# 2. Renomear 'web' para 'muhlstore_web'
pm2 delete web
pm2 start ecosystem.config.cjs --only web --name muhlstore_web

# 3. Renomear 'whatsapp-webhook' para 'muhlstore_whatsapp-webhook'
pm2 delete whatsapp-webhook
pm2 start ecosystem.config.cjs --only whatsapp-webhook --name muhlstore_whatsapp-webhook

# 4. Salvar configuração
pm2 save
```

### **Opção 2: Atualizar ecosystem.config.cjs (Recomendado)**

Atualizar o arquivo `ecosystem.config.cjs` para usar os novos nomes:

```javascript
module.exports = {
  apps: [
    {
      name: "muhlstore_api",  // ← ALTERADO de "api"
      script: "./server/server.cjs",
      // ... resto da config
    },
    {
      name: "muhlstore_web",  // ← ALTERADO de "web"
      script: "./server/proxy-debug.cjs",
      // ... resto da config
    },
    {
      name: "muhlstore_whatsapp-webhook",  // ← ALTERADO de "whatsapp-webhook"
      script: "./server/whatsapp-webhook-server.cjs",
      // ... resto da config
    }
  ]
};
```

Depois:
```bash
# Parar serviços antigos
pm2 stop api web whatsapp-webhook
pm2 delete api web whatsapp-webhook

# Iniciar com novos nomes
pm2 start ecosystem.config.cjs

# Salvar
pm2 save
```

---

## 📊 Comparação: Antes vs Depois

### **ANTES:**
```
┌────┬───────────────────┬─────────┬──────────┐
│ id │ name              │ status  │ mem      │
├────┼───────────────────┼─────────┼──────────┤
│ 0  │ whatsapp-webhook  │ online  │ 62.4mb   │
│ 3  │ api               │ online  │ 226.1mb  │
│ 4  │ nimble-sheet...   │ online  │ 65.7mb   │
│ 5  │ web               │ online  │ 55.4mb   │
└────┴───────────────────┴─────────┴──────────┘
```

❌ **Problema:** Não é imediato identificar quais são do MuhlStore

---

### **DEPOIS:**
```
┌────┬──────────────────────────────┬─────────┬──────────┐
│ id │ name                         │ status  │ mem      │
├────┼──────────────────────────────┼─────────┼──────────┤
│ 0  │ muhlstore_whatsapp-webhook   │ online  │ 62.4mb   │
│ 3  │ muhlstore_api                │ online  │ 226.1mb  │
│ 4  │ nimble-sheet-backend         │ online  │ 65.7mb   │
│ 5  │ muhlstore_web                │ online  │ 55.4mb   │
└────┴──────────────────────────────┴─────────┴──────────┘
```

✅ **Benefício:** Fica claro que os 3 primeiros são do MuhlStore

---

## 🔍 Identificação Visual Melhorada

### **Agrupamento Visual:**
```
MuhlStore:
├── muhlstore_api
├── muhlstore_web
└── muhlstore_whatsapp-webhook

Outros Projetos:
└── nimble-sheet-backend
```

---

## ⚙️ Atualizações Necessárias

Após renomear, você precisará atualizar:

### **1. Scripts e Documentação:**
- Referências em scripts shell
- Documentação que menciona `api`, `web`, `whatsapp-webhook`
- Comandos PM2 em scripts de deploy

### **2. Comandos PM2:**
```bash
# ANTES:
pm2 logs api
pm2 restart web

# DEPOIS:
pm2 logs muhlstore_api
pm2 restart muhlstore_web
```

### **3. Monitoramento:**
- Dashboards que referenciam os nomes antigos
- Alertas e notificações

---

## ✅ Checklist de Renomeação

- [ ] 1. Fazer backup do `ecosystem.config.cjs`
- [ ] 2. Atualizar `ecosystem.config.cjs` com novos nomes
- [ ] 3. Parar serviços antigos: `pm2 stop api web whatsapp-webhook`
- [ ] 4. Deletar serviços antigos: `pm2 delete api web whatsapp-webhook`
- [ ] 5. Iniciar com novos nomes: `pm2 start ecosystem.config.cjs`
- [ ] 6. Verificar que tudo está funcionando: `pm2 list`
- [ ] 7. Salvar configuração: `pm2 save`
- [ ] 8. Testar acesso às aplicações
- [ ] 9. Atualizar documentação e scripts

---

## 🎯 Padrão de Nomenclatura Recomendado

### **Formato:**
```
[projeto]_[tipo-serviço]
```

### **Exemplos:**
```
muhlstore_api                 → Backend API
muhlstore_web                 → Frontend/Proxy
muhlstore_whatsapp-webhook    → Webhook WhatsApp
muhlstore_worker              → Worker (se houver)
muhlstore_scheduler           → Scheduler (se houver)
```

### **Vantagens:**
- ✅ Identificação imediata do projeto
- ✅ Fácil agrupamento visual
- ✅ Sem conflitos entre projetos
- ✅ Padrão claro e consistente

---

## 📝 Notas Importantes

1. ⚠️ **Tempo de Downtime:** Haverá um breve downtime durante a renomeação (apenas alguns segundos)

2. ⚠️ **Nginx/Proxy:** Se você tiver configurações Nginx que referenciam os serviços, elas continuarão funcionando (conectam por porta, não por nome)

3. ⚠️ **Logs Antigos:** Os logs antigos permanecerão com os nomes antigos

4. ✅ **PM2 Save:** Não esqueça de executar `pm2 save` após renomear

---

## 🚀 Próximos Passos

1. Revisar esta proposta
2. Fazer backup do `ecosystem.config.cjs`
3. Executar renomeação
4. Verificar funcionamento
5. Atualizar documentação

---

**Última atualização:** 17 de Janeiro de 2025
