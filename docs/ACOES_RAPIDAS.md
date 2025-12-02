# ⚡ Ações Rápidas - Deploy Jan 2025

## 🎯 3 Passos Essenciais

### 1. Configurar JWT_SECRET
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Copie o resultado e adicione ao .env:
# JWT_SECRET=resultado-copiado
```

### 2. Aplicar Migrações
```bash
mysql -h127.0.0.1 -P3306 -uroot -p rare_toy_companion < database/migrations/014_create_audit_logs_table.sql
mysql -h127.0.0.1 -P3306 -uroot -p rare_toy_companion < database/migrations/015_optimize_database_indexes.sql
```

### 3. Build e Reiniciar
```bash
npm run build
pm2 restart api
```

---

## ✅ Pronto!

Todas as melhorias já estão no código. Só falta aplicar as migrações e reiniciar.

---

**Documentação completa:** `docs/RESUMO_EVOLUCOES_JAN_2025.md`

