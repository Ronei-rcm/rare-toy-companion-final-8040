# ⚡ Acesso Rápido - Rare Toy Companion Mirror

## 🌐 URLs

- **Aplicação:** http://192.168.9.100:8041
- **phpMyAdmin:** http://192.168.9.100:8082
- **GitHub:** https://github.com/Ronei-rcm/rare-toy-companion-final-8040

## 🔧 Comandos

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs

# Sincronizar banco
bash scripts/db-sync-remote-to-local.sh

# Reiniciar tudo
pm2 restart all

# Docker
docker ps | grep rare-toy
```

## 📊 Serviços

| Serviço | Porta | Acesso |
|---------|-------|---------|
| Web | 8041 | http://192.168.9.100:8041 |
| API | 3011 | http://192.168.9.100:3011 |
| phpMyAdmin | 8082 | http://192.168.9.100:8082 |
| MySQL Local | 3309 | localhost:3309 |

## 🔐 MySQL Local

- Host: localhost
- Porta: 3309
- Usuário: root
- Senha: (vazio)
- Banco: rare_toy_companion

---

✅ Sistema 100% funcional!
