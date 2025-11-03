# ⚡ INÍCIO RÁPIDO - MUHLSTORE

## 🚀 **Coloque o projeto no ar em 5 minutos!**

---

## 📋 **PRÉ-REQUISITOS**

```bash
✅ Node.js 18+ instalado
✅ MySQL rodando
✅ PM2 instalado (npm i -g pm2)
```

---

## 🎯 **PASSO A PASSO**

### **1️⃣ Configurar Ambiente (2 min)**

```bash
# Copiar variáveis de ambiente
cp env.example .env

# Editar com suas configurações
nano .env
```

**Mínimo necessário no .env:**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua-senha
DB_NAME=rare_toy_store
SERVER_PORT=3001
VITE_PORT=8040
```

---

### **2️⃣ Configurar Banco de Dados (1 min)**

```bash
# Criar banco de dados
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS rare_toy_store;"

# Rodar migração inicial (se ainda não rodou)
mysql -u root -p rare_toy_store < database/init.sql

# Rodar migração de recuperação de carrinho
mysql -u root -p rare_toy_store < database/add_cart_recovery_columns.sql
```

---

### **3️⃣ Instalar Dependências (1 min)**

```bash
# Já foi feito, mas se precisar:
npm install
```

---

### **4️⃣ Iniciar Aplicação (30 seg)**

```bash
# Build de produção
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.cjs

# Ver status
pm2 status
```

**Pronto! 🎉**
- Frontend: http://localhost:8040
- Backend: http://localhost:3001
- Admin: http://localhost:8040/admin

---

### **5️⃣ Verificar Saúde (30 seg)**

```bash
# Health check
curl http://localhost:3001/api/health

# Ver logs
pm2 logs

# Status dos serviços
pm2 status
```

---

## 🎨 **CONFIGURAÇÕES OPCIONAIS**

### **📧 E-mail (Recuperação de Carrinho):**

```bash
# Adicionar no .env:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app    # Gerar em: myaccount.google.com/apppasswords
```

### **💳 Mercado Pago:**

```bash
# Adicionar no .env:
MERCADOPAGO_ACCESS_TOKEN=seu-token  # Obter em: mercadopago.com.br/developers
FRONTEND_URL=http://localhost:8040
API_URL=http://localhost:3001
```

### **⚡ Redis (Cache):**

```bash
# Instalar Redis
sudo apt install redis-server   # Ubuntu/Debian
brew install redis              # macOS

# Iniciar
sudo systemctl start redis-server

# Adicionar no .env:
REDIS_HOST=localhost
REDIS_PORT=6379
```

### **🔍 Sentry (Monitoramento):**

```bash
# Criar conta em sentry.io
# Criar projeto Node.js
# Copiar DSN

# Adicionar no .env:
SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
```

---

## 🧪 **TESTAR FUNCIONALIDADES**

### **1. Carrinho Inteligente:**
```
1. Adicionar produto → Ver toast com imagem
2. Abrir carrinho (ícone no header)
3. Ver mensagens de incentivo
4. Scroll → Ver sugestões de produtos
5. Atualizar quantidade → Ver feedback
```

### **2. Checkout Rápido:**
```
1. Fazer login/cadastro
2. Adicionar produtos
3. Clicar "Checkout Rápido"
4. Dados preenchidos automaticamente!
5. Escolher pagamento (PIX/Cartão/Apple/Google Pay)
6. Confirmar
```

### **3. Recuperação de Carrinho:**
```
1. Adicionar produtos sem comprar
2. Aguardar 1 hora
3. Verificar e-mail
4. Clicar no link de recuperação
5. Usar cupom VOLTA10 (após 24h)
```

### **4. Pagamentos:**
```
PIX:
- Escolher PIX → QR Code aparece
- Escanear ou copiar código
- Pagamento confirmado automaticamente

Apple Pay (Safari/iOS):
- Botão aparece automaticamente
- Clicar → Confirmar com Face/Touch ID

Google Pay (Chrome/Android):
- Botão aparece automaticamente
- Clicar → Selecionar cartão
```

---

## 📱 **APPS MOBILE**

### **iOS (Safari):**
- ✅ Apple Pay nativo
- ✅ Responsivo 100%
- ✅ Gestos touch
- ✅ PWA pronto

### **Android (Chrome):**
- ✅ Google Pay nativo
- ✅ Responsivo 100%
- ✅ Gestos touch
- ✅ PWA pronto

---

## 🐛 **PROBLEMAS COMUNS**

### **Erro: Cannot connect to MySQL**
```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Iniciar se necessário
sudo systemctl start mysql

# Verificar credenciais no .env
```

### **Erro: Port 3001 already in use**
```bash
# Parar processos PM2
pm2 stop all
pm2 delete all

# Ou mudar porta no .env
SERVER_PORT=3002
```

### **Erro: Redis connection failed**
```bash
# Redis é OPCIONAL! O sistema funciona sem
# Para habilitar:
sudo systemctl start redis-server

# Ou desabilitar (deixar vazio no .env):
REDIS_HOST=
```

### **E-mails não enviam**
```bash
# E-mail é OPCIONAL! Sistema funciona sem
# Para Gmail, usar senha de app:
# https://myaccount.google.com/apppasswords
```

---

## 🎯 **COMANDOS ESSENCIAIS**

```bash
# Ver tudo rodando
pm2 status

# Ver logs em tempo real
pm2 logs

# Reiniciar tudo
pm2 restart all

# Parar tudo
pm2 stop all

# Ver logs do Winston
tail -f logs/combined.log
tail -f logs/error.log

# Limpar cache Redis
redis-cli FLUSHDB

# Backup do banco
npm run backup

# Rodar testes
npm test
```

---

## 🎨 **ACESSAR O SISTEMA**

### **Frontend Público:**
- Home: http://localhost:8040
- Loja: http://localhost:8040/loja
- Carrinho: http://localhost:8040/carrinho
- Sobre: http://localhost:8040/about

### **Painel Admin:**
- Login: http://localhost:8040/admin/login
- Dashboard: http://localhost:8040/admin
- Produtos: http://localhost:8040/admin/produtos
- Pedidos: http://localhost:8040/admin/pedidos
- Configurações: http://localhost:8040/admin/configuracoes

### **API:**
- Health: http://localhost:3001/api/health
- Produtos: http://localhost:3001/api/produtos
- Carrinho: http://localhost:3001/api/cart

---

## 📊 **MONITORAMENTO**

### **PM2 Web Dashboard:**
```bash
pm2 web
# Acesse: http://localhost:9615
```

### **Logs em Tempo Real:**
```bash
# Todos os logs
pm2 logs

# Apenas API
pm2 logs api

# Apenas erros
pm2 logs --err

# Logs do Winston
tail -f logs/combined.log
```

### **Redis Monitor:**
```bash
redis-cli monitor
```

---

## ✅ **CHECKLIST DE VERIFICAÇÃO**

Após iniciar, verificar:

- [ ] PM2 mostra 3 processos rodando (api, web, whatsapp-webhook)
- [ ] Frontend abre em http://localhost:8040
- [ ] Backend responde em http://localhost:3001/api/health
- [ ] Produtos aparecem na loja
- [ ] Carrinho funciona (adicionar/remover)
- [ ] WhatsApp button aparece após scroll
- [ ] Toasts mostram imagens dos produtos
- [ ] Mensagens de incentivo aparecem
- [ ] Sugestões de produtos carregam
- [ ] Logs aparecem sem erros
- [ ] Redis conecta (se configurado)
- [ ] Sentry rastreia (se configurado)

---

## 🆘 **SUPORTE**

### **Logs:**
```bash
# Ver tudo
pm2 logs

# Últimas 100 linhas
pm2 logs --lines 100

# Apenas erros
grep ERROR logs/error.log
```

### **Reset Completo:**
```bash
# Parar tudo
pm2 stop all
pm2 delete all

# Limpar
rm -rf node_modules dist

# Reinstalar
npm install

# Build
npm run build

# Reiniciar
pm2 start ecosystem.config.cjs
```

---

## 🎓 **APRENDA MAIS**

- **README.md** - Visão geral completa
- **GUIA_DE_TESTES.md** - Como testar
- **RELATORIO_FINAL.md** - Estatísticas completas
- **TECHNICAL_DOCS.md** - Detalhes técnicos

---

**Boa sorte com seu e-commerce! 🚀**

*Sistema pronto para escalar e gerar resultados!*
