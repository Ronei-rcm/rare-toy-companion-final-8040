# 📦 Como Fazer Backup do Projeto - Guia Rápido

> **5 minutos** para criar um backup completo pronto para transferência

---

## 🚀 Método Rápido (1 Comando)

```bash
npm run backup:project
```

**Pronto!** 🎉 

O backup será criado em: `/home/projeto-git/rare-toy-companion_backup_YYYYMMDD_HHMMSS.zip`

---

## 📋 O Que Acontece

1. ✅ Copia todo o código-fonte
2. ✅ Exclui arquivos desnecessários (node_modules, dist, logs)
3. ✅ Compacta tudo em um arquivo .zip
4. ✅ Gera checksum MD5 para verificação
5. ✅ Salva em `/home/projeto-git/`
6. ✅ Cria guias de restauração automáticos

---

## 📤 Transferir para Outra Máquina

### Via SCP (Recomendado)

```bash
scp /home/projeto-git/rare-toy-companion_backup_*.zip usuario@servidor:/destino/
```

### Via rsync (Para arquivos grandes)

```bash
rsync -avz --progress /home/projeto-git/rare-toy-companion_backup_*.zip usuario@servidor:/destino/
```

---

## 📥 Restaurar na Outra Máquina

```bash
# 1. Extrair
unzip rare-toy-companion_backup_*.zip
cd rare-toy-companion_backup_*

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
nano .env  # Editar configurações

# 4. Configurar banco
npm run docker:up
npm run db:migrate

# 5. Build e iniciar
npm run build:prod
npm run pm2:start
```

**Guia completo dentro do ZIP:** `COMO_RESTAURAR.md`

---

## 📊 Tamanho do Backup

- **Sem node_modules:** ~50-100MB ✅
- **Tempo:** 2-5 minutos
- **Compactação:** ZIP padrão

---

## 🔐 Verificar Integridade

```bash
# Na máquina de destino
md5sum -c rare-toy-companion_backup_*.md5
```

Se retornar `OK`, o arquivo está íntegro.

---

## 🔄 Automatizar (Backup Diário)

### Adicionar ao Crontab

```bash
# Editar crontab
crontab -e

# Adicionar linha (backup diário às 2h da manhã)
0 2 * * * cd /home/git-muhlstore/rare-toy-companion-final-8040 && /usr/bin/npm run backup:project

# Limpeza automática (manter últimos 7 dias)
0 3 * * * find /home/projeto-git/ -name "rare-toy-companion_backup_*.zip" -mtime +7 -delete
```

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- 📖 [**scripts/README_BACKUP.md**](scripts/README_BACKUP.md) - Documentação completa
- 🔧 [**scripts/backup-project.sh**](scripts/backup-project.sh) - Script fonte

---

## 🆘 Problemas Comuns

### "Permission denied"

```bash
chmod +x scripts/backup-project.sh
npm run backup:project
```

### "No space left on device"

```bash
# Verificar espaço
df -h /home/projeto-git/

# Limpar backups antigos
find /home/projeto-git/ -name "*.zip" -mtime +7 -delete
```

### "rsync: command not found"

```bash
sudo apt-get install rsync
```

---

## ✅ Checklist Rápido

**Antes do Backup:**
- [ ] Código salvo e commitado
- [ ] ~200MB de espaço livre

**Após o Backup:**
- [ ] Arquivo .zip criado em `/home/projeto-git/`
- [ ] Tamanho entre 50-100MB
- [ ] Arquivo .md5 também criado

**Na Máquina de Destino:**
- [ ] Arquivo transferido
- [ ] `md5sum -c` retorna OK
- [ ] Extraído sem erros
- [ ] `npm install` executado
- [ ] `.env` configurado
- [ ] Aplicação funcionando

---

## 💡 Dicas

1. ✅ Faça backup antes de atualizações importantes
2. ✅ Automatize com cron para backups regulares
3. ✅ Mantenha 3-7 backups recentes
4. ✅ Teste a restauração periodicamente
5. ✅ Guarde backups em múltiplos locais

---

## 📞 Suporte

- 📖 Documentação: [scripts/README_BACKUP.md](scripts/README_BACKUP.md)
- 📧 Email: suporte@muhlstore.com.br

---

**Última Atualização:** 21 de Outubro de 2025

**[⬆ Voltar ao topo](#-como-fazer-backup-do-projeto---guia-rápido)**

