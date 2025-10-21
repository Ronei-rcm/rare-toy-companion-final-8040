# 🗄️ Sistema de Redundância MySQL

## ✅ Status: INSTALADO E FUNCIONANDO

Sistema completo de redundância e backup do banco de dados MySQL implementado com sucesso!

---

## 🎯 O Que Foi Criado

### **1. MySQL Local (Container Docker)**
- **Container:** `rare-toy-mysql-mirror`
- **Status:** Rodando e saudável (healthy)
- **Porta:** 3309
- **Banco:** `rare_toy_companion`
- **Tabelas:** 41 tabelas sincronizadas
- **Volume:** Persistente (dados mantidos entre reinicializações)

### **2. phpMyAdmin Local**
- **Container:** `rare-toy-phpmyadmin-mirror`
- **Porta:** 8082
- **Acesso Local:** http://localhost:8082
- **Acesso Rede:** http://192.168.9.100:8082

### **3. Script de Sincronização**
- **Arquivo:** `scripts/db-sync-remote-to-local.sh`
- **Função:** Sincroniza MySQL remoto → MySQL local
- **Backups:** Mantém últimos 5 dumps automáticos

---

## 🌐 Como Acessar

### **MySQL Local via Terminal**
```bash
mysql -h localhost -P 3309 -u root rare_toy_companion
```

### **MySQL Local via Docker**
```bash
docker exec -it rare-toy-mysql-mirror mysql -u root rare_toy_companion
```

### **phpMyAdmin Local**
- **Local:** http://localhost:8082
- **Rede:** http://192.168.9.100:8082
- **Servidor:** mysql-mirror
- **Usuário:** root
- **Senha:** (deixe em branco)

---

## 🔄 Sincronização

### **Sincronizar Dados Agora**
```bash
cd /srv/erp-muhlstore/rare-toy-companion-mirror
bash scripts/db-sync-remote-to-local.sh
```

### **O Que a Sincronização Faz:**
1. ✅ Conecta ao MySQL remoto via túnel SSH
2. ✅ Faz dump completo do banco `rare_toy_companion`
3. ✅ Importa dados no MySQL local (container)
4. ✅ Verifica integridade (conta tabelas)
5. ✅ Salva backup em `mysql/dumps/`
6. ✅ Mantém apenas últimos 5 dumps

### **Configurar Sincronização Automática**
```bash
# Adicionar ao crontab para sincronizar diariamente às 3h
(crontab -l 2>/dev/null; echo "0 3 * * * cd /srv/erp-muhlstore/rare-toy-companion-mirror && bash scripts/db-sync-remote-to-local.sh >> logs/db-sync.log 2>&1") | crontab -
```

---

## 🔧 Gerenciar Containers

### **Iniciar/Parar Containers**
```bash
# Iniciar
docker-compose -f docker-compose.mysql.yml up -d

# Parar
docker-compose -f docker-compose.mysql.yml down

# Reiniciar
docker-compose -f docker-compose.mysql.yml restart

# Ver status
docker-compose -f docker-compose.mysql.yml ps
```

### **Ver Logs**
```bash
# MySQL
docker logs rare-toy-mysql-mirror

# phpMyAdmin
docker logs rare-toy-phpmyadmin-mirror

# Seguir logs em tempo real
docker logs -f rare-toy-mysql-mirror
```

### **Acessar MySQL Diretamente**
```bash
docker exec -it rare-toy-mysql-mirror mysql -u root
```

---

## 📊 Estrutura de Arquivos

```
/srv/erp-muhlstore/rare-toy-companion-mirror/
│
├── docker-compose.mysql.yml          # Configuração dos containers
│
├── mysql/
│   ├── dumps/                        # Dumps do banco (backups)
│   │   └── remote_db_YYYYMMDD_HHMMSS.sql
│   ├── backups/                      # Backups extras
│   └── init/                         # Scripts de inicialização
│
└── scripts/
    └── db-sync-remote-to-local.sh    # Script de sincronização
```

---

## 🎯 Benefícios da Redundância

### **1. Backup Local Completo**
- Cópia completa do banco de dados
- Dados persistentes em volume Docker
- Backups automáticos em SQL

### **2. Desenvolvimento Independente**
- Trabalhe sem depender do servidor remoto
- Testes seguros sem afetar produção
- Desenvolvimento offline possível

### **3. Performance Melhorada**
- Queries executadas localmente
- Sem latência de rede
- Ideal para desenvolvimento

### **4. Recuperação Rápida**
- Restauração imediata de backups
- Múltiplos pontos de restauração
- Proteção contra falhas

---

## 🔐 Credenciais

### **MySQL Local (Porta 3309)**
- **Host:** localhost ou 192.168.9.100
- **Porta:** 3309
- **Usuário:** root
- **Senha:** (sem senha)
- **Banco:** rare_toy_companion

### **MySQL Remoto (Via Túnel - Porta 3308)**
- **Host:** 127.0.0.1 (túnel SSH)
- **Porta:** 3308
- **Usuário:** root
- **Senha:** RSM_Rg51gti66
- **Banco:** rare_toy_companion

### **phpMyAdmin Local (Porta 8082)**
- **URL:** http://localhost:8082 ou http://192.168.9.100:8082
- **Servidor:** mysql-mirror
- **Usuário:** root
- **Senha:** (deixe em branco)

---

## 🔧 Comandos Úteis

### **Verificar Status**
```bash
# Containers Docker
docker ps | grep rare-toy

# Processos PM2
pm2 status

# Portas em uso
ss -tlnp | grep -E "3309|8082|3308"
```

### **Sincronização**
```bash
# Sincronizar manualmente
bash scripts/db-sync-remote-to-local.sh

# Ver dumps salvos
ls -lh mysql/dumps/

# Restaurar dump específico
cat mysql/dumps/remote_db_TIMESTAMP.sql | docker exec -i rare-toy-mysql-mirror mysql -u root rare_toy_companion
```

### **Manutenção**
```bash
# Limpar dumps antigos (manter apenas 5)
cd mysql/dumps
ls -t remote_db_*.sql | tail -n +6 | xargs rm

# Ver uso de espaço
du -sh mysql/dumps/
docker system df

# Backup manual do volume
docker run --rm -v rare-toy-companion-mirror_mysql_mirror_data:/data -v $(pwd):/backup ubuntu tar czf /backup/mysql-volume-backup.tar.gz /data
```

---

## 🚀 Próximos Passos

### **1. Automatizar Sincronização**
Configure o cron para sincronizar automaticamente:
```bash
# Diariamente às 3h da manhã
0 3 * * * cd /srv/erp-muhlstore/rare-toy-companion-mirror && bash scripts/db-sync-remote-to-local.sh >> logs/db-sync.log 2>&1

# A cada 6 horas
0 */6 * * * cd /srv/erp-muhlstore/rare-toy-companion-mirror && bash scripts/db-sync-remote-to-local.sh >> logs/db-sync.log 2>&1
```

### **2. Usar MySQL Local na Aplicação (Opcional)**
Para usar o MySQL local em vez do remoto, atualize o `.env`:
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3309
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DATABASE=rare_toy_companion
```

### **3. Configurar Backups Externos**
```bash
# Backup para outro servidor
rsync -avz mysql/dumps/ user@backup-server:/backups/rare-toy-mysql/

# Backup para cloud
# Configure rclone ou similar
```

---

## ⚠️ Avisos Importantes

1. **Senha Vazia:** O MySQL local não tem senha. Isso é adequado para desenvolvimento local mas **NÃO** para produção.

2. **Sincronização Manual:** A sincronização não é automática. Execute o script manualmente ou configure o cron.

3. **Dados Locais:** Mudanças no MySQL local **NÃO** são sincronizadas para o remoto automaticamente.

4. **Volume Persistente:** Os dados do MySQL são mantidos em um volume Docker. Para removê-los completamente:
   ```bash
   docker-compose -f docker-compose.mysql.yml down -v
   ```

---

## 🆘 Solução de Problemas

### **Container não inicia**
```bash
# Ver logs de erro
docker logs rare-toy-mysql-mirror

# Recriar container
docker-compose -f docker-compose.mysql.yml down
docker-compose -f docker-compose.mysql.yml up -d
```

### **Sincronização falha**
```bash
# Verificar túnel SSH
pm2 list | grep tunnel
ss -tlnp | grep 3308

# Testar conexão manualmente
mysql -h 127.0.0.1 -P 3308 -u root -pRSM_Rg51gti66 -e "SELECT 1"
```

### **phpMyAdmin não acessa MySQL**
```bash
# Verificar se containers estão na mesma rede
docker network inspect rare-toy-companion-mirror_rare-toy-network

# Reiniciar phpMyAdmin
docker restart rare-toy-phpmyadmin-mirror
```

---

## 📞 Resumo Rápido

| Serviço | Porta | Acesso |
|---------|-------|--------|
| **MySQL Local** | 3309 | localhost:3309 ou 192.168.9.100:3309 |
| **phpMyAdmin Local** | 8082 | http://localhost:8082 |
| **MySQL Remoto (túnel)** | 3308 | 127.0.0.1:3308 (interno) |

---

**Criado em:** 21 de Outubro de 2025  
**Status:** ✅ Operacional  
**Última sincronização:** 41 tabelas, 140KB

