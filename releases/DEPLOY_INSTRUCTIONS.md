# 🚀 INSTRUÇÕES DE DEPLOY - MUHLSTORE v2.0

## 📦 Pacote Criado
**Nome:** muhlstore_production_2.0_20251010_151540.tar.gz  
**Tamanho:** 34M  
**Data:** 10/10/2025 15:15:44  
**Checksum MD5:** 14f37a117a20b83db5676fec8bed2d0a

## 🔧 Passo a Passo de Instalação

### 1. Upload do Pacote

**Via SCP:**
```bash
scp muhlstore_production_2.0_20251010_151540.tar.gz usuario@seu-servidor.com:/home/usuario/
```

**Via FTP/SFTP:**
- Use FileZilla ou outro cliente FTP
- Upload para: /home/usuario/

### 2. No Servidor Ubuntu

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Extrair pacote
tar -xzf muhlstore_production_2.0_20251010_151540.tar.gz
cd muhlstore_production_2.0_20251010_151540

# Configurar ambiente
cp .env.production.example .env
nano .env  # Edite suas configurações

# Executar instalação
chmod +x install.sh
./install.sh
```

### 3. Configurar Banco de Dados

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE rare_toy_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rare_toy_user'@'localhost' IDENTIFIED BY 'SUA_SENHA';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 4. Build e Inicialização

```bash
# Instalar dependências
npm install

# Build para produção
npm run build

# Iniciar com PM2
npm run pm2:start

# Verificar status
npm run pm2:status
```

### 5. Configurar Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
```

### 6. Verificação

Acesse no navegador:
- **Frontend:** http://seu-ip
- **API:** http://seu-ip:3001/api/health

## 🔒 Configuração SSL (Opcional mas Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática
sudo certbot renew --dry-run
```

## 📊 Monitoramento

```bash
# Ver logs em tempo real
npm run pm2:logs

# Monitor interativo
npm run pm2:monit

# Status dos processos
npm run pm2:status
```

## 🗄️ Backup

```bash
# Backup completo
npm run backup

# Backup apenas do banco
npm run backup:db

# Configurar backup automático (cron)
crontab -e
# Adicionar linha:
0 2 * * * cd /caminho/para/projeto && npm run backup
```

## 🆘 Troubleshooting

**Problema:** Porta em uso
```bash
sudo lsof -i :3001
sudo kill -9 PID
```

**Problema:** Node não encontrado
```bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
```

**Problema:** Permissões
```bash
sudo chown -R $USER:$USER .
chmod +x install.sh
chmod +x scripts/*.sh
```

## ✅ Checklist de Produção

- [ ] Servidor Ubuntu 20.04+ configurado
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Banco de dados MySQL criado
- [ ] Firewall configurado
- [ ] SSL/HTTPS configurado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] DNS apontando para o servidor
- [ ] Testes de funcionalidade realizados

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte INSTALACAO.md no pacote
- Verifique logs com `npm run pm2:logs`
- Execute health check com `npm run health:check`

**Boa sorte com o deploy! 🚀**
