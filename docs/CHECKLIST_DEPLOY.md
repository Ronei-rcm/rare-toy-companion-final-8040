# ✅ Checklist de Deploy - Janeiro 2025

**Data:** 11 de Janeiro de 2025  
**Versão:** 2.1.0

---

## 📋 Checklist Pré-Deploy

### 🔐 Segurança
- [ ] JWT_SECRET configurado no `.env`
- [ ] Migração de auditoria aplicada (`014_create_audit_logs_table.sql`)
- [ ] Senhas admin migradas para bcrypt (opcional, automático na próxima troca)
- [ ] Cookies seguros verificados (automático)

### ⚡ Performance
- [ ] Migração de índices aplicada (`015_optimize_database_indexes.sql`)
- [ ] Redis configurado (opcional mas recomendado)
- [ ] Queries otimizadas ativas

### 🏗️ Build
- [ ] Frontend buildado (`npm run build`)
- [ ] Dependências instaladas (`npm install`)
- [ ] Servidor reiniciado (`pm2 restart api`)

---

## 🚀 Comandos Rápidos

### 1. Configurar JWT_SECRET
```bash
# Gerar secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Adicionar ao .env
echo "JWT_SECRET=seu-secret-gerado" >> .env
```

### 2. Aplicar Migrações
```bash
# Auditoria
mysql -h127.0.0.1 -P3306 -uroot -p rare_toy_companion < database/migrations/014_create_audit_logs_table.sql

# Índices
mysql -h127.0.0.1 -P3306 -uroot -p rare_toy_companion < database/migrations/015_optimize_database_indexes.sql
```

### 3. Configurar Redis (Opcional)
```bash
# Instalar
sudo apt-get install redis-server

# Iniciar
sudo systemctl start redis-server

# Adicionar ao .env
echo "REDIS_HOST=localhost" >> .env
echo "REDIS_PORT=6379" >> .env
```

### 4. Build e Deploy
```bash
# Build frontend
npm run build

# Reiniciar servidor
pm2 restart api

# Ver logs
pm2 logs api
```

---

## ✅ Verificação Pós-Deploy

### Testes Básicos
- [ ] Servidor responde: `curl http://localhost:3001/health`
- [ ] Login admin funciona
- [ ] Endpoint de categorias funciona: `curl http://localhost:3001/api/categorias`
- [ ] Cache Redis funcionando (se configurado): `redis-cli ping`

### Verificação de Logs
- [ ] Sem erros críticos nos logs: `pm2 logs api`
- [ ] Redis conectado (se configurado)
- [ ] JWT funcionando corretamente

---

## 📊 Status

**Implementado:**
- ✅ JWT para autenticação admin
- ✅ Bcrypt para senhas
- ✅ Cookies seguros
- ✅ Sistema de auditoria
- ✅ Índices de banco otimizados
- ✅ Cache Redis em endpoints críticos

**Ações Necessárias:**
- ⏳ Aplicar migrações
- ⏳ Configurar JWT_SECRET
- ⏳ Build do frontend
- ⏳ Reiniciar servidor

---

**Última atualização:** 11 de Janeiro de 2025

