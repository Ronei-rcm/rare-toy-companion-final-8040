# 🧪 GUIA RÁPIDO DE TESTES - MINHA CONTA

## ⚡ ACESSO RÁPIDO

```
https://muhlstore.re9suainternet.com.br/minha-conta
```

---

## 🎯 ROTEIRO DE TESTES (5 MINUTOS)

### **1️⃣ TAB: DASHBOARD** (30 seg)

**O que testar:**
- [ ] Ver 4 cards de estatísticas animados
- [ ] Verificar programa de fidelidade (barra de progresso)
- [ ] Ver badge VIP (muda com total gasto)
- [ ] Verificar se estatísticas estão corretas

**Como:**
1. Acesse `/minha-conta?tab=dashboard`
2. Veja os cards no topo
3. Role para baixo e veja a fidelidade

---

### **2️⃣ TAB: PEDIDOS** (2 min) 🔥

**O que testar:**
- [ ] Ver 4 cards de estatísticas no topo
- [ ] Usar busca por ID
- [ ] Filtrar por status
- [ ] Filtrar por período
- [ ] Alterar ordenação
- [ ] Clicar em um pedido (expande)
- [ ] Ver timeline de rastreamento
- [ ] Ver produtos com imagens
- [ ] Clicar "Repetir Pedido"
- [ ] Clicar "Nota Fiscal"
- [ ] Exportar CSV

**Como:**
1. Acesse `/minha-conta?tab=pedidos`
2. Veja os 4 cards no topo
3. Use os filtros:
   - Digite um ID na busca
   - Escolha um status (ex: "Entregue")
   - Escolha um período (ex: "Último mês")
   - Ordene por "Maior valor"
4. Clique em qualquer pedido para expandir
5. Veja a timeline visual
6. Veja os produtos com imagens
7. Clique em "Repetir Pedido" (vai para o carrinho)
8. Clique em "Nota Fiscal" (abre em nova aba)
9. Clique em "Exportar CSV" no topo

---

### **3️⃣ TAB: ENDEREÇOS** (1 min)

**O que testar:**
- [ ] Ver endereços cadastrados
- [ ] Adicionar novo endereço
- [ ] Buscar por CEP (auto-preenchimento)
- [ ] Definir como padrão
- [ ] Editar endereço
- [ ] Deletar endereço

**Como:**
1. Acesse `/minha-conta?tab=enderecos`
2. Clique em "Adicionar Endereço"
3. Digite um CEP (ex: 01310-100)
4. Veja o auto-preenchimento
5. Salve
6. Defina como padrão (estrela)
7. Edite (lápis)
8. Delete (lixeira)

---

### **4️⃣ TAB: FAVORITOS** (1 min)

**O que testar:**
- [ ] Ver grid visual de produtos
- [ ] Adicionar ao carrinho
- [ ] Adicionar TODOS ao carrinho
- [ ] Compartilhar lista
- [ ] Remover favorito

**Como:**
1. Acesse `/minha-conta?tab=favoritos`
2. Veja o grid de produtos
3. Passe o mouse sobre um produto (overlay aparece)
4. Clique em "Adicionar ao carrinho"
5. Clique em "Adicionar todos"
6. Clique em "Compartilhar Lista"
7. Clique no coração (remover)

---

### **5️⃣ TAB: PERFIL** (30 seg)

**O que testar:**
- [ ] Ver header premium com avatar
- [ ] Ver badge VIP
- [ ] Navegar entre as 3 subtabs
- [ ] Editar dados pessoais
- [ ] Ver card de benefícios VIP

**Como:**
1. Acesse `/minha-conta?tab=dados`
2. Veja o header premium
3. Veja o badge VIP
4. Clique em "Info"
5. Clique em "Segurança"
6. Clique em "Preferências"
7. Edite algum dado (ex: nome)
8. Salve

---

## 📊 CHECKLIST VISUAL

### **Cards de Estatísticas (Pedidos):**
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  📦 Total       │  │  💰 Total       │  │  ✅ Entregues   │  │  📅 Este Mês    │
│     Pedidos     │  │     Gasto       │  │                 │  │                 │
│                 │  │                 │  │                 │  │                 │
│       10        │  │   R$ 1.500,00   │  │        8        │  │        3        │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

### **Filtros (Pedidos):**
```
┌──────────────────────────────────────────────────────────────────┐
│  🔍 Buscar     │  📊 Status    │  📅 Período   │  🔄 Ordenar  │
│  [Digite ID...]│  [Todos ▼]    │  [Todos ▼]    │  [Recente ▼] │
└──────────────────────────────────────────────────────────────────┘
```

### **Accordion (Pedido Expandido):**
```
┌────────────────────────────────────────────────────────────────────┐
│  📦 Pedido #abc12345                             🟢 Entregue       │
│  📅 15 de Jan, 2025                              R$ 299,90          │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  🚚 Timeline de Rastreamento:                                      │
│     ✅ Pedido Criado       ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━         │
│     ✅ Pagamento Confirmado                                        │
│     ✅ Em Preparação                                               │
│     ✅ Enviado                                                     │
│     ✅ Entregue                                                    │
│                                                                    │
│  📍 Entrega:                      💳 Pagamento:                    │
│  Rua ABC, 123                     PIX                              │
│  São Paulo - SP                   ✅ Pago                          │
│  CEP: 01234-567                                                    │
│                                                                    │
│  📦 Produtos (2):                                                  │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ [IMG] Produto 1  Qtd: 1      R$ 149,90              │         │
│  │       ⚡ Comprar novamente                            │         │
│  └──────────────────────────────────────────────────────┘         │
│  ┌──────────────────────────────────────────────────────┐         │
│  │ [IMG] Produto 2  Qtd: 1      R$ 150,00              │         │
│  │       ⚡ Comprar novamente                            │         │
│  └──────────────────────────────────────────────────────┘         │
│                                                                    │
│  [👁️ Ver Detalhes] [🔄 Repetir Pedido] [📄 Nota] [🚚 Rastrear]  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ AÇÕES RÁPIDAS PARA TESTAR

### **Repetir Pedido:**
1. Expanda um pedido
2. Clique "Repetir Pedido"
3. Será redirecionado para `/carrinho`
4. Todos os produtos do pedido estarão no carrinho

### **Nota Fiscal:**
1. Expanda um pedido
2. Clique "Nota Fiscal"
3. Abre em nova aba com HTML da nota

### **Rastrear Entrega:**
1. Expanda um pedido que tenha código de rastreamento
2. Clique "Rastrear Entrega"
3. Abre site dos Correios

### **Exportar CSV:**
1. Use filtros se quiser
2. Clique "Exportar CSV" no topo
3. Download automático do arquivo `meus-pedidos-YYYY-MM-DD.csv`

---

## 🎯 NÍVEIS VIP PARA TESTAR

Faça pedidos e veja o badge mudar automaticamente:

```
🥉 BRONZE     →  R$ 0 - 499         →  Badge bronze
🥈 PRATA      →  R$ 500 - 1.999     →  Badge prata
🥇 OURO       →  R$ 2.000 - 4.999   →  Badge ouro
💎 DIAMANTE   →  R$ 5.000+          →  Badge diamante + Card VIP
```

---

## 📱 RESPONSIVIDADE

Teste em diferentes tamanhos de tela:

- [ ] Desktop (1920px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

**Como:**
1. Abra DevTools (F12)
2. Clique no ícone de dispositivos (Ctrl+Shift+M)
3. Teste cada resolução

---

## 🐛 POSSÍVEIS ERROS E SOLUÇÕES

### **Erro: "Nenhum pedido encontrado"**
**Solução:** Faça um pedido primeiro em `/loja`

### **Erro: "Estatísticas não carregam"**
**Solução:** Verifique se o backend está rodando (PM2)

### **Erro: "Filtros não funcionam"**
**Solução:** Limpe o cache do navegador (Ctrl+Shift+Del)

### **Erro: "Timeline não aparece"**
**Solução:** Verifique se o pedido tem status válido

---

## ✅ CHECKLIST FINAL

Após testar tudo:

- [ ] Cards de estatísticas aparecem corretamente
- [ ] Filtros funcionam (busca, status, período, ordenação)
- [ ] Accordion expande/colapsa
- [ ] Timeline visual é renderizada
- [ ] Produtos com imagens aparecem
- [ ] Ações rápidas funcionam (repetir, nota, rastrear)
- [ ] Exportar CSV funciona
- [ ] Badge VIP está correto
- [ ] Programa de fidelidade calcula pontos
- [ ] Dashboard carrega estatísticas
- [ ] Endereços com ViaCEP funcionam
- [ ] Favoritos aparecem em grid
- [ ] Perfil tem 3 subtabs
- [ ] Responsivo em mobile/tablet

---

## 🎊 PRONTO!

Se todos os itens estiverem ✅, a página **Minha Conta** está **100% FUNCIONAL!**

**Aproveite sua área do cliente premium!** 🏆
