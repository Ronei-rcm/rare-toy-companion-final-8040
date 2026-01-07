# 🚀 Guia de Instalação Completa - MuhlStore

## 📋 Visão Geral

Este guia descreve como usar o script de instalação automática `install-completo.sh` para instalar o MuhlStore em um servidor Linux completamente limpo (sem nenhuma dependência pré-instalada).

## ✨ O Que o Script Faz

O script `install-completo.sh` automatiza **TODAS** as etapas necessárias:

1. ✅ **Detecta o sistema operacional** (Ubuntu, Debian, CentOS, Rocky Linux, etc.)
2. ✅ **Atualiza o sistema** e instala dependências básicas
3. ✅ **Instala Node.js 20** via NVM
4. ✅ **Instala PM2** para gerenciamento de processos
5. ✅ **Instala MySQL** e configura banco de dados
6. ✅ **Instala Nginx** como servidor web reverso
7. ✅ **Instala Certbot** para certificados SSL (opcional)
8. ✅ **Instala dependências do projeto** (npm install)
9. ✅ **Configura variáveis de ambiente** (.env)
10. ✅ **Configura banco de dados** (executa migrations)
11. ✅ **Faz build do projeto** (npm run build)
12. ✅ **Configura Nginx** com proxy reverso
13. ✅ **Configura SSL** com Let's Encrypt (opcional)
14. ✅ **Configura firewall** (UFW ou firewalld)
15. ✅ **Inicia serviços** com PM2

## 📋 Pré-requisitos

### Sistema Operacional Suportado

- ✅ Ubuntu 20.04 ou superior
- ✅ Debian 11 ou superior
- ✅ CentOS 8 ou superior
- ✅ Rocky Linux 8 ou superior
- ✅ Fedora 35 ou superior

### Requisitos Mínimos de Hardware

- **CPU**: 2 cores (recomendado 4 cores)
- **RAM**: 2GB (recomendado 4GB)
- **Disco**: 20GB livres (recomendado 40GB)
- **Rede**: Conexão de internet ativa

### Informações Necessárias

Antes de executar o script, tenha em mãos:

- ✅ **Senha do MySQL root** (será solicitada durante a instalação)
- ✅ **Domínio** (opcional, ex: muhlstore.com.br)
- ✅ **E-mail** para certificado SSL (se usar SSL)

## 🎯 Instalação Rápida

### Opção 1: Servidor Limpo (Recomendado)

```bash
# 1. Conectar ao servidor via SSH
ssh usuario@seu-servidor.com

# 2. Clonar o repositório (ou fazer upload do projeto)
git clone https://github.com/seu-usuario/rare-toy-companion-final-8040.git
cd rare-toy-companion-final-8040

# 3. Executar o script de instalação
sudo ./install-completo.sh
```

### Opção 2: Download Direto do Script

```bash
# 1. Baixar o script
wget https://raw.githubusercontent.com/seu-usuario/rare-toy-companion-final-8040/main/install-completo.sh

# 2. Tornar executável
chmod +x install-completo.sh

# 3. Executar
sudo ./install-completo.sh
```

## 📝 Processo de Instalação

### 1. Coleta de Informações

O script solicitará as seguintes informações:

```
Digite a senha do MySQL root: [senha oculta]
Digite a senha para o banco de dados da aplicação (ou Enter para gerar automaticamente): [senha ou Enter]
Digite o domínio do site (ex: muhlstore.com.br) ou Enter para pular: [domínio ou Enter]
Deseja instalar certificado SSL com Let's Encrypt? (s/N): [s ou N]
Digite o e-mail para o certificado SSL: [e-mail]
```

### 2. Instalação Automática

O script executará todas as etapas automaticamente. Você verá mensagens como:

```
🔍 Detectando Sistema Operacional
🔄 Atualizando Sistema
📦 Instalando Node.js
⚡ Instalando PM2
🗄️ Instalando MySQL
🌐 Instalando Nginx
...
```

### 3. Configuração Final

Após a instalação, o script:
- ✅ Cria o arquivo `.env` com todas as configurações
- ✅ Configura o banco de dados
- ✅ Faz build do projeto
- ✅ Inicia todos os serviços com PM2

## 🔧 Configurações Pós-Instalação

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env` para configurar:

```bash
nano .env
```

**Configurações importantes:**

```env
# E-mail (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app  # Gerar em: myaccount.google.com/apppasswords

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=seu-access-token  # Obter em: mercadopago.com.br/developers

# WhatsApp Business
WHATSAPP_TOKEN=seu-token
WHATSAPP_PHONE_ID=seu-phone-id
```

### 2. Verificar Status dos Serviços

```bash
# Ver status do PM2
pm2 status

# Ver logs
pm2 logs

# Ver logs de um serviço específico
pm2 logs api
pm2 logs web
```

### 3. Reiniciar Serviços

```bash
# Reiniciar todos
pm2 restart all

# Reiniciar um serviço específico
pm2 restart api
```

## 🔒 Configuração de SSL (Opcional)

Se você forneceu um domínio durante a instalação, o script tentará configurar SSL automaticamente. Se não funcionou, execute manualmente:

```bash
# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática (já configurada)
sudo certbot renew --dry-run
```

## 🛠️ Comandos Úteis

### Gerenciamento de Serviços

```bash
# Ver status
pm2 status

# Ver logs em tempo real
pm2 logs

# Reiniciar todos os serviços
pm2 restart all

# Parar todos os serviços
pm2 stop all

# Deletar todos os serviços
pm2 delete all
```

### Banco de Dados

```bash
# Conectar ao MySQL
mysql -u rare_toy_user -p

# Backup do banco
mysqldump -u rare_toy_user -p rare_toy_companion > backup.sql

# Restaurar backup
mysql -u rare_toy_user -p rare_toy_companion < backup.sql
```

### Nginx

```bash
# Testar configuração
sudo nginx -t

# Recarregar configuração
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

## 🐛 Solução de Problemas

### Erro: "Node.js não encontrado"

```bash
# Carregar NVM manualmente
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20
```

### Erro: "PM2 não encontrado"

```bash
# Instalar PM2 globalmente
npm install -g pm2
```

### Erro: "MySQL não conecta"

```bash
# Verificar se MySQL está rodando
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Verificar senha
mysql -u root -p
```

### Erro: "Porta já em uso"

```bash
# Verificar portas em uso
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :8040

# Parar processos conflitantes
pm2 delete all
```

### Erro: "Nginx não inicia"

```bash
# Verificar configuração
sudo nginx -t

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log
```

## 📊 Verificação da Instalação

Após a instalação, verifique se tudo está funcionando:

```bash
# 1. Verificar serviços PM2
pm2 status
# Deve mostrar: api, web, whatsapp-webhook (se configurado)

# 2. Verificar Node.js
node -v
# Deve mostrar: v20.x.x

# 3. Verificar MySQL
mysql -u rare_toy_user -p -e "SHOW DATABASES;"
# Deve mostrar: rare_toy_companion, rare_toy_store

# 4. Verificar Nginx
sudo systemctl status nginx
# Deve estar: active (running)

# 5. Testar API
curl http://localhost:3001/api/health
# Deve retornar: {"status":"healthy",...}

# 6. Testar Frontend
curl http://localhost:8040
# Deve retornar: HTML da aplicação
```

## 🔄 Atualização do Projeto

Para atualizar o projeto após mudanças no código:

```bash
# 1. Atualizar código
git pull origin main

# 2. Instalar novas dependências
npm install

# 3. Fazer build
npm run build

# 4. Reiniciar serviços
pm2 restart all
```

## 📝 Notas Importantes

1. **Senhas**: O script gera senhas seguras automaticamente. Anote-as em local seguro.

2. **Firewall**: O script configura o firewall automaticamente. Certifique-se de que a porta 22 (SSH) está acessível.

3. **SSL**: Para SSL funcionar, o domínio deve estar apontando para o IP do servidor antes de executar o script.

4. **Backups**: Configure backups automáticos após a instalação.

5. **Monitoramento**: Configure monitoramento (Sentry, logs, etc.) após a instalação.

## 🆘 Suporte

Se encontrar problemas durante a instalação:

1. Verifique os logs: `pm2 logs`
2. Verifique os logs do sistema: `journalctl -xe`
3. Verifique a documentação: `docs/`
4. Abra uma issue no GitHub

## ✅ Checklist Pós-Instalação

- [ ] Configurar variáveis de ambiente no `.env`
- [ ] Configurar e-mail SMTP
- [ ] Configurar Mercado Pago (se usar)
- [ ] Configurar WhatsApp Business (se usar)
- [ ] Testar criação de pedidos
- [ ] Testar pagamentos
- [ ] Configurar backups automáticos
- [ ] Configurar monitoramento
- [ ] Testar SSL (se instalado)
- [ ] Verificar logs de erro

---

**Última atualização:** Janeiro 2026  
**Versão do script:** 3.0

