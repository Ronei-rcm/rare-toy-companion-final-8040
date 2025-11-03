# 🚀 Guia de Instalação Automática - MuhlStore

Este guia detalha como usar o script de instalação automática `install.sh` para configurar a MuhlStore em um servidor Linux limpo.

## 📋 Pré-requisitos

### Sistema Operacional Suportado
- ✅ Ubuntu 20.04 ou superior
- ✅ Debian 11 ou superior
- ✅ CentOS 8 ou superior
- ✅ Rocky Linux 8 ou superior

### Requisitos Mínimos de Hardware
- **CPU**: 2 cores (recomendado 4 cores)
- **RAM**: 2GB (recomendado 4GB)
- **Disco**: 20GB livres (recomendado 40GB)
- **Rede**: Conexão de internet ativa

### Informações Necessárias
Antes de executar o script, tenha em mãos:
- ✅ URL do repositório Git (ou caminho local)
- ✅ Domínio configurado (ex: muhlstore.com.br)
- ✅ E-mail para certificado SSL
- ✅ Senha desejada para o banco de dados MySQL

## 🎯 Instalação Rápida

### Opção 1: Instalação Direta (Repositório já clonado)

```bash
# 1. Navegue até o diretório do projeto
cd /caminho/do/projeto

# 2. Execute o script como root
sudo ./install.sh
```

### Opção 2: Instalação em Servidor Limpo

```bash
# 1. Baixar o script
wget https://seu-repositorio.com/install.sh

# 2. Tornar executável
chmod +x install.sh

# 3. Executar como root
sudo ./install.sh
```

## 📝 O Que o Script Faz

O script automatiza **TODAS** as etapas necessárias:

### 1️⃣ **Preparação do Sistema**
- ✅ Detecta automaticamente a distribuição Linux
- ✅ Atualiza o sistema operacional
- ✅ Instala dependências básicas (curl, wget, git, build-essential, etc.)

### 2️⃣ **Instalação do Node.js**
- ✅ Instala NVM (Node Version Manager)
- ✅ Instala Node.js LTS via NVM
- ✅ Configura Node.js no PATH

### 3️⃣ **Instalação do PM2**
- ✅ Instala PM2 globalmente
- ✅ Configura PM2 para iniciar automaticamente no boot
- ✅ Cria serviço systemd para PM2

### 4️⃣ **Instalação do MySQL**
Você escolhe entre:
- **Opção 1 (Recomendada)**: MySQL via Docker
  - Isolado e fácil de gerenciar
  - Backup e restauração simplificados
  - Não interfere com outros serviços
  
- **Opção 2**: MySQL nativo
  - Instalação direta no sistema
  - Performance ligeiramente melhor
  - Requer mais configuração manual

### 5️⃣ **Configuração do Projeto**
- ✅ Clona ou atualiza o repositório
- ✅ Instala todas as dependências npm
- ✅ Cria arquivo `.env` com suas configurações
- ✅ Faz build de produção do frontend

### 6️⃣ **Configuração do Nginx**
- ✅ Cria configuração otimizada para SPA
- ✅ Configura proxy reverso para API (porta 3001)
- ✅ Configura proxy para uploads e WhatsApp webhook
- ✅ Ativa compressão gzip
- ✅ Configura cache para assets estáticos

### 7️⃣ **Certificado SSL (Let's Encrypt)**
- ✅ Instala Certbot
- ✅ Gera certificado SSL gratuito
- ✅ Configura renovação automática
- ✅ Redireciona HTTP → HTTPS automaticamente

### 8️⃣ **Inicialização da Aplicação**
- ✅ Inicia backend (API) com PM2
- ✅ Inicia servidor de preview do frontend
- ✅ Inicia webhook do WhatsApp (se configurado)
- ✅ Salva configuração do PM2

### 9️⃣ **Configuração de Segurança**
- ✅ Configura firewall (UFW ou firewalld)
- ✅ Libera portas: 22 (SSH), 80 (HTTP), 443 (HTTPS)
- ✅ Define permissões corretas nos arquivos

### 🔟 **Backup Automático**
- ✅ Cria script de backup
- ✅ Agenda backup diário às 3h da manhã
- ✅ Mantém os últimos 7 backups
- ✅ Inclui código + banco de dados

## 🎬 Passo a Passo Detalhado

### 1. Preparar o Servidor

```bash
# Atualizar sistema (opcional - script já faz isso)
sudo apt update && sudo apt upgrade -y

# Se for usar chave SSH (recomendado)
ssh-copy-id usuario@seu-servidor.com
```

### 2. Configurar DNS

Antes de executar o script, configure seu domínio:

```
Tipo A: muhlstore.com.br → IP_DO_SERVIDOR
Tipo A: www.muhlstore.com.br → IP_DO_SERVIDOR
```

Aguarde a propagação DNS (pode levar até 24h, geralmente 1-2h).

### 3. Executar o Script

```bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Baixar e executar o script
wget https://raw.githubusercontent.com/SEU_USUARIO/SEU_REPO/main/install.sh
chmod +x install.sh
sudo ./install.sh
```

### 4. Responder às Perguntas do Script

O script fará perguntas interativas:

#### MySQL
```
Escolha o método de instalação do MySQL:
1) Docker (recomendado)
2) Nativo
Opção [1-2]: 1

Digite a senha root do MySQL: ********
Digite o nome do banco de dados: muhlstore
```

#### Projeto
```
Digite a URL do repositório Git: https://github.com/usuario/muhlstore.git
Digite o diretório de instalação [/var/www/muhlstore]: [ENTER]
```

#### Banco de Dados
```
Digite o host do MySQL [localhost]: [ENTER]
Digite a porta do MySQL [3306]: [ENTER]
Digite o usuário do MySQL [root]: [ENTER]
Digite a senha do MySQL: ********
Digite o nome do banco de dados: muhlstore
```

#### Domínio
```
Digite o domínio do site: muhlstore.com.br
```

#### SSL
```
Deseja configurar SSL agora? [S/n]: S
Digite seu e-mail para notificações do Let's Encrypt: seu@email.com
```

### 5. Aguardar Conclusão

O script levará entre **10-20 minutos** dependendo de:
- Velocidade da internet
- Recursos do servidor
- Escolha MySQL (Docker é mais rápido)

## ✅ Verificação Pós-Instalação

Após a conclusão, verifique se tudo está funcionando:

### 1. Verificar PM2
```bash
pm2 status
```
Deve mostrar 3 processos rodando:
- ✅ api (porta 3001)
- ✅ web (porta 8040)
- ✅ whatsapp-webhook (porta 3002)

### 2. Verificar Nginx
```bash
sudo nginx -t
sudo systemctl status nginx
```

### 3. Verificar MySQL
```bash
# Se Docker
docker ps | grep mysql

# Se Nativo
sudo systemctl status mysql
```

### 4. Testar Acesso
```bash
# Testar HTTP local
curl -I http://localhost

# Testar HTTPS público
curl -I https://muhlstore.com.br
```

### 5. Acessar o Site
Abra no navegador:
- 🌐 Frontend: `https://muhlstore.com.br`
- 🔧 Admin: `https://muhlstore.com.br/admin`

## 🔧 Comandos Úteis Pós-Instalação

### PM2 (Gerenciamento de Processos)
```bash
# Ver status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de um processo específico
pm2 logs api

# Reiniciar todos os processos
pm2 restart all

# Reiniciar processo específico
pm2 restart api

# Parar todos os processos
pm2 stop all

# Salvar configuração atual
pm2 save

# Ver monitoramento
pm2 monit
```

### Nginx
```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/muhlstore-error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/muhlstore-access.log
```

### MySQL (Docker)
```bash
# Ver status do container
docker ps | grep mysql

# Acessar MySQL via console
docker exec -it muhlstore-mysql mysql -u root -p

# Ver logs do MySQL
docker logs muhlstore-mysql

# Backup manual do banco
docker exec muhlstore-mysql mysqldump -u root -p${DB_PASSWORD} muhlstore > backup.sql

# Restaurar backup
docker exec -i muhlstore-mysql mysql -u root -p${DB_PASSWORD} muhlstore < backup.sql
```

### MySQL (Nativo)
```bash
# Status do serviço
sudo systemctl status mysql

# Acessar MySQL
mysql -u root -p

# Backup manual
mysqldump -u root -p muhlstore > backup.sql

# Restaurar backup
mysql -u root -p muhlstore < backup.sql
```

### Backup
```bash
# Executar backup manualmente
cd /var/www/muhlstore
./backup.sh

# Ver backups existentes
ls -lh backups/

# Restaurar backup (extrair zip)
unzip backups/backup_2024-01-01_03-00-00.zip -d restore/
```

### SSL (Let's Encrypt)
```bash
# Renovar certificados manualmente
sudo certbot renew

# Testar renovação (dry-run)
sudo certbot renew --dry-run

# Listar certificados
sudo certbot certificates
```

## 🐛 Troubleshooting

### Problema: Script falha ao instalar dependências

**Solução:**
```bash
# Atualizar sistema manualmente
sudo apt update && sudo apt upgrade -y

# Executar script novamente
sudo ./install.sh
```

### Problema: PM2 não inicia no boot

**Solução:**
```bash
# Reconfigurar startup do PM2
pm2 startup systemd -u $USER --hp $HOME

# Executar o comando gerado
# Depois salvar
pm2 save
```

### Problema: Nginx mostra erro 502

**Solução:**
```bash
# Verificar se API está rodando
pm2 status

# Verificar logs da API
pm2 logs api

# Reiniciar API
pm2 restart api
```

### Problema: SSL não funciona

**Solução:**
```bash
# Verificar se portas 80 e 443 estão abertas
sudo ufw status

# Liberar portas se necessário
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Tentar configurar SSL novamente
sudo certbot --nginx -d muhlstore.com.br -d www.muhlstore.com.br
```

### Problema: MySQL não conecta

**Solução Docker:**
```bash
# Verificar se container está rodando
docker ps | grep mysql

# Iniciar container se parado
docker-compose up -d

# Ver logs
docker logs muhlstore-mysql
```

**Solução Nativa:**
```bash
# Verificar status
sudo systemctl status mysql

# Iniciar se parado
sudo systemctl start mysql

# Ver logs
sudo tail -f /var/log/mysql/error.log
```

### Problema: Site não carrega

**Checklist:**
```bash
# 1. Verificar DNS
nslookup muhlstore.com.br

# 2. Verificar Nginx
sudo systemctl status nginx
sudo nginx -t

# 3. Verificar PM2
pm2 status

# 4. Verificar firewall
sudo ufw status

# 5. Ver logs
pm2 logs
sudo tail -f /var/log/nginx/muhlstore-error.log
```

## 📊 Monitoramento

### Recursos do Servidor
```bash
# CPU e memória
htop

# Espaço em disco
df -h

# Processos Node.js
ps aux | grep node
```

### Logs Centralizados
```bash
# Todos os logs do PM2
pm2 logs --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/*.log

# Logs do sistema
sudo journalctl -f
```

## 🔄 Atualização do Sistema

Para atualizar o código da aplicação:

```bash
# 1. Navegar até o diretório
cd /var/www/muhlstore

# 2. Atualizar código
git pull

# 3. Instalar dependências (se houver novas)
npm install

# 4. Rebuild
npm run build

# 5. Reiniciar aplicação
pm2 restart all
```

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs**: `pm2 logs` e `/var/log/nginx/`
2. **Consulte a documentação**: `README.md` e `MANUAL_WHATSAPP.md`
3. **Verifique as issues** do repositório
4. **Abra uma issue** com detalhes do erro

## 🗑️ Desinstalação

Se precisar remover completamente a MuhlStore do servidor:

```bash
# Executar script de desinstalação
sudo ./uninstall.sh
```

O script irá:
- ✅ Criar backup opcional antes de remover
- ✅ Parar todos os processos PM2
- ✅ Remover configuração do Nginx
- ✅ Deletar certificado SSL
- ✅ Remover container MySQL (Docker)
- ✅ Deletar arquivos do projeto
- ✅ Remover agendamentos (cron)
- ✅ Opcionalmente remover Node.js, Docker e Nginx

**⚠️ ATENÇÃO**: Esta ação é irreversível! Sempre crie um backup antes.

## 🎉 Conclusão

Após seguir este guia, você terá:

- ✅ Sistema completo instalado e rodando
- ✅ SSL configurado (HTTPS)
- ✅ Backup automático diário
- ✅ Processos gerenciados pelo PM2
- ✅ Nginx como servidor web
- ✅ MySQL rodando (Docker ou nativo)
- ✅ Firewall configurado

**Próximos passos:**
1. Acessar o painel admin
2. Configurar informações da loja
3. Adicionar produtos e coleções
4. Configurar WhatsApp Business
5. Configurar PIX

**Boa sorte com sua loja! 🚀**

