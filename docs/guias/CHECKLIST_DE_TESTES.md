# ✅ CHECKLIST DE TESTES - MUHLSTORE

## 🚀 **ANTES DE COMEÇAR**

### 1. **Garantir que o sistema está rodando:**

```bash
# Ver status
pm2 status

# Se não estiver rodando:
pm2 restart all

# Ver logs em tempo real
pm2 logs
```

**Verificar:**
- [ ] API (porta 3001) rodando ✅
- [ ] Web (porta 8040) rodando ✅
- [ ] WhatsApp webhook (porta 3002) rodando ✅

---

## 🛒 **TESTAR CARRINHO (Principais Features)**

### ✅ **1. Sincronização e Imagens**
- [ ] Adicionar produto à loja
- [ ] Ver toast **COM FOTO** do produto aparecer 📸
- [ ] Badge no header animar
- [ ] Abrir drawer do carrinho
- [ ] Verificar que imagem aparece correta
- [ ] Abrir em outra aba → Carrinho sincronizado ✅

### ✅ **2. Mensagens de Incentivo**
- [ ] Ver barra de progresso para frete grátis
- [ ] Porcentagem aumentar conforme adiciona produtos
- [ ] Mensagem "Falta R$ X" aparecer
- [ ] Quando atingir R$ 200 → "Parabéns! Frete grátis!" 🎉
- [ ] Ver destaque do desconto PIX

### ✅ **3. Sugestões de Produtos**
- [ ] Scroll até o final da página do carrinho
- [ ] Ver seção "Você também pode gostar"
- [ ] Produtos relacionados aparecem
- [ ] Clicar "+" para adicionar sugestão
- [ ] Produto vai para o carrinho ✅

### ✅ **4. Cart Analytics** (NOVO!)
- [ ] Ver card "Insights do Seu Carrinho"
- [ ] Verificar "Preço Médio" calculado
- [ ] Ver "Total de Produtos"
- [ ] Ver "Economia com PIX" destacada
- [ ] Ver "Entrega Estimada" (3-7 dias)

### ✅ **5. Ações Rápidas** (NOVO!)
- [ ] Ver botões: Copiar/Compartilhar/Salvar/Favoritar/Presente
- [ ] Clicar "Copiar Lista" → Ctrl+V para verificar
- [ ] Clicar "Compartilhar" (funciona em mobile)
- [ ] Clicar "Salvar" → Ver toast de confirmação
- [ ] Clicar "Favoritar" → Produtos vão para wishlist
- [ ] Clicar "É Presente" → Ver feedback

### ✅ **6. Comparação de Preços** (NOVO!)
- [ ] Ver card "Comparação de Pagamentos"
- [ ] **PIX destacado** como "Melhor Escolha" 💚
- [ ] Ver economia com PIX
- [ ] Ver parcelamento cartão (3x, 6x, 12x)
- [ ] Valores calculados corretamente

### ✅ **7. WhatsApp Flutuante**
- [ ] Scroll para baixo na página
- [ ] Botão verde do WhatsApp aparece
- [ ] Tooltip "Precisa de ajuda?" aparece por 5s
- [ ] Clicar → Abre WhatsApp Web ✅

---

## 💳 **TESTAR PAGAMENTOS**

### ✅ **1. Apple Pay** (Safari/iOS/Mac)
- [ ] Abrir no Safari
- [ ] Ir para checkout
- [ ] Ver botão "Apple Pay"
- [ ] Clicar → Confirmar com Touch ID/Face ID
- [ ] Pagamento processar ✅

### ✅ **2. Google Pay** (Chrome/Android)
- [ ] Abrir no Chrome
- [ ] Ir para checkout
- [ ] Ver botão "Google Pay"
- [ ] Clicar → Selecionar cartão
- [ ] Pagamento processar ✅

### ✅ **3. Mercado Pago PIX**
- [ ] Escolher PIX no checkout
- [ ] Ver QR Code gerado
- [ ] Ver código copia-e-cola
- [ ] Escanear QR Code
- [ ] Webhook atualizar status automaticamente ✅

### ✅ **4. Checkout 1-Clique**
- [ ] Fazer login
- [ ] Ter dados completos (endereço, etc)
- [ ] Clicar "Checkout Rápido"
- [ ] Dados pré-preenchidos
- [ ] Confirmar em 1 clique ✅

---

## 👤 **TESTAR ÁREA DO CLIENTE**

### ✅ **1. Customer Dashboard** (NOVO!)
- [ ] Login como cliente
- [ ] Ir em "Minha Conta"
- [ ] Ver estatísticas:
  - [ ] Total de pedidos
  - [ ] Total gasto
  - [ ] Favoritos
  - [ ] Último pedido
- [ ] Ver "Programa de Fidelidade"
- [ ] Barra de progresso animada
- [ ] Pontos calculados (1 ponto = R$ 10)

### ✅ **2. Order History** (NOVO!)
- [ ] Ver lista de pedidos
- [ ] Clicar em um pedido (accordion abre)
- [ ] Ver rastreamento visual (timeline)
- [ ] Ver endereço de entrega
- [ ] Ver método de pagamento
- [ ] Ver produtos do pedido com imagens
- [ ] Clicar "Repetir Pedido" → Itens vão pro carrinho
- [ ] Clicar "Nota Fiscal" → Abre HTML/PDF

### ✅ **3. Order Tracking** (NOVO!)
- [ ] Ver timeline de 4 etapas
- [ ] Etapas completadas em verde
- [ ] Etapa atual com anel azul
- [ ] Animação suave
- [ ] Previsão de entrega exibida

---

## 🔧 **TESTAR PAINEL ADMIN**

### ✅ **1. Orders Advanced** (NOVO!)
- [ ] Login como admin
- [ ] Ir em "Pedidos"
- [ ] Ver estatísticas no topo:
  - [ ] Total de pedidos
  - [ ] Receita total
  - [ ] Em transporte
  - [ ] Entregues
- [ ] Buscar por ID/cliente
- [ ] Filtrar por status
- [ ] Filtrar por período
- [ ] Clicar "Exportar" → Baixar CSV
- [ ] Clicar "..." em um pedido
- [ ] Atualizar status → Ver mudança imediata

### ✅ **2. Fornecedores (Bug corrigido!)**
- [ ] Ir em "Fornecedores"
- [ ] Página carrega SEM ERRO 404 ✅
- [ ] Ver lista de fornecedores
- [ ] Criar novo fornecedor
- [ ] Editar fornecedor
- [ ] Deletar fornecedor

---

## 🔐 **TESTAR SEGURANÇA**

### ✅ **1. Rate Limiting**
```bash
# Testar limite de requisições (abuse protection)
for i in {1..110}; do curl http://localhost:3001/api/produtos; done

# Deve retornar erro 429 após 100 requests
```

### ✅ **2. Headers de Segurança**
```bash
# Verificar headers do Helmet
curl -I http://localhost:3001/api/health

# Deve ter:
# - X-Content-Type-Options
# - X-Frame-Options
# - Strict-Transport-Security
```

---

## ⚡ **TESTAR PERFORMANCE**

### ✅ **1. Redis Cache**
```bash
# Ver se Redis está conectado
redis-cli ping
# Deve retornar: PONG

# Primeira request (sem cache)
time curl http://localhost:3001/api/produtos

# Segunda request (com cache - 70% mais rápido!)
time curl http://localhost:3001/api/produtos
```

### ✅ **2. Imagens Otimizadas**
- [ ] Inspecionar imagens no DevTools
- [ ] Ver formato WebP
- [ ] Ver tamanho reduzido (~60% menor)
- [ ] Lazy loading funcionando (scroll lento)

---

## ♿ **TESTAR ACESSIBILIDADE**

### ✅ **1. Navegação por Teclado**
- [ ] Usar APENAS Tab/Shift+Tab
- [ ] Navegar por todo o site
- [ ] Enter/Space para ativar botões
- [ ] Escape para fechar modais
- [ ] Focus visível (anel azul)

### ✅ **2. Screen Reader** (Opcional)
- [ ] Ativar leitor de tela do sistema
- [ ] Navegar pelo site
- [ ] ARIA labels sendo lidos
- [ ] Mensagens de loading anunciadas

### ✅ **3. Contraste**
- [ ] Abrir DevTools → Lighthouse
- [ ] Rodar audit
- [ ] Acessibilidade deve ser > 95 ✅

---

## 📧 **TESTAR E-MAIL** (Se configurado)

### ✅ **1. Carrinho Abandonado**
```
1. Adicionar produtos ao carrinho
2. Sair sem comprar
3. Aguardar 1 hora (ou forçar no código)
4. Verificar e-mail
5. Abrir e-mail → Ver template bonito
6. Clicar no link → Voltar ao carrinho
```

### ✅ **2. Cupom de 24 horas**
```
1. Aguardar 24 horas sem comprar
2. Verificar e-mail com "Última Chance"
3. Ver cupom VOLTA10
4. Usar cupom (10% OFF)
```

---

## 📊 **LOGS E MONITORAMENTO**

### ✅ **1. Winston Logs**
```bash
# Ver logs em tempo real
tail -f logs/combined.log

# Ver apenas erros
tail -f logs/error.log

# Buscar por palavra
grep "Carrinho" logs/combined.log
```

### ✅ **2. PM2 Logs**
```bash
# Todos os logs
pm2 logs

# Apenas API
pm2 logs api

# Apenas erros
pm2 logs --err
```

---

## 🧪 **TESTES AUTOMATIZADOS**

```bash
# Rodar todos os testes
npm run test:run

# Resultado esperado:
# ✓ 14 testes passando
# ✓ 0 erros

# Ver interface visual
npm run test:ui

# Gerar coverage
npm run test:coverage
```

---

## 🎯 **CHECKLIST RÁPIDO**

### **Funcionalidades Críticas:**
- [ ] ✅ Adicionar produto → Toast com foto aparece
- [ ] ✅ Carrinho sincroniza em tempo real
- [ ] ✅ Mensagens de incentivo aparecem
- [ ] ✅ Sugestões de produtos carregam
- [ ] ✅ Analytics mostram dados corretos
- [ ] ✅ Ações rápidas funcionam
- [ ] ✅ Comparação de preços calcula certo
- [ ] ✅ WhatsApp button aparece
- [ ] ✅ Checkout rápido preenche dados
- [ ] ✅ Pagamentos modernos disponíveis
- [ ] ✅ Dashboard cliente mostra stats
- [ ] ✅ Histórico de pedidos funciona
- [ ] ✅ Admin pode gerenciar pedidos
- [ ] ✅ Fornecedores carregam SEM ERRO ✅
- [ ] ✅ PIX não dá erro 400 ✅

---

## 🐛 **SE ENCONTRAR PROBLEMAS**

### **Frontend não carrega:**
```bash
pm2 restart web
pm2 logs web
```

### **API retorna erro:**
```bash
pm2 restart api
pm2 logs api
tail -f logs/error.log
```

### **Cache não funciona:**
```bash
# Verificar Redis
redis-cli ping

# Reiniciar Redis
sudo systemctl restart redis-server
```

### **Build com erro:**
```bash
# Limpar e rebuild
rm -rf dist
npm run build
```

---

## 📞 **TESTAR EM DISPOSITIVOS**

### **Desktop:**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

### **Mobile:**
- [ ] iOS Safari (Apple Pay)
- [ ] Android Chrome (Google Pay)
- [ ] Responsividade 100%

---

## 🎊 **BOA SORTE NOS TESTES!**

Qualquer problema, é só chamar! Estou aqui para ajudar! 🚀

**Comandos úteis:**
```bash
# Status geral
pm2 status

# Logs
pm2 logs

# Reiniciar
pm2 restart all

# Health check
curl http://localhost:3001/api/health

# Ver erros
tail -f logs/error.log
```

---

## 📊 **O QUE ESPERAR**

### **No Carrinho:**
✨ Toast com foto do produto
✨ Mensagens motivacionais
✨ Barra de progresso frete grátis
✨ Sugestões de produtos
✨ Analytics com insights
✨ 5 ações rápidas
✨ Comparação PIX vs Cartão

### **No Checkout:**
✨ 1-clique para comprar
✨ Apple Pay (Safari)
✨ Google Pay (Chrome)
✨ Mercado Pago PIX

### **Na Conta do Cliente:**
✨ Dashboard com estatísticas
✨ Programa de fidelidade
✨ Histórico interativo
✨ Rastreamento visual
✨ Repetir pedido (1 clique)

### **No Admin:**
✨ Painel de pedidos avançado
✨ Estatísticas em tempo real
✨ Filtros múltiplos
✨ Exportação CSV
✨ Fornecedores SEM ERRO ✅

---

**Tudo pronto para seus testes! 🎉**

Divirta-se explorando todas as funcionalidades! 🚀
