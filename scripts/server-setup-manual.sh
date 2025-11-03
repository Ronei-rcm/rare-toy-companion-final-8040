#!/bin/bash

# 🛠️ Script de Configuração Manual - Servidor 177.67.32.55
# Execute este script DIRETAMENTE no servidor após conectar via SSH
# Data: 13 de outubro de 2025

set -e

# Configurações
SERVER_DIR="/home/espelhar"
PROJECT_NAME="muhlstore-rare-toy-companion"
PROJECT_URL="https://github.com/seu-usuario/muhlstore.git"  # Substitua pela URL real

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛠️ CONFIGURAÇÃO MANUAL DO SERVIDOR MUHLSTORE${NC}"
echo -e "${BLUE}📁 Diretório: ${SERVER_DIR}${NC}"
echo ""

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

# Atualizar sistema
log "Atualizando sistema..."
apt-get update && apt-get upgrade -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
apt-get install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Instalar Node.js 18
log "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verificar instalação do Node.js
log "Verificando Node.js..."
node --version
npm --version

# Instalar PM2 globalmente
log "Instalando PM2..."
npm install -g pm2

# Instalar MySQL
log "Instalando MySQL..."
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Configurar MySQL
log "Configurando MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS rare_toy_companion;"
mysql -e "CREATE USER IF NOT EXISTS 'muhlstore'@'localhost' IDENTIFIED BY 'rg51gt66';"
mysql -e "GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'muhlstore'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Instalar Nginx
log "Instalando Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# Configurar firewall
log "Configurando firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8022/tcp
ufw --force enable

# Criar diretório do projeto
log "Criando diretório do projeto..."
mkdir -p ${SERVER_DIR}
cd ${SERVER_DIR}

# Clonar projeto (você pode usar git clone ou upload manual)
log "Preparando para receber projeto..."
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS:${NC}"
echo -e "${YELLOW}1. Faça upload do projeto para: ${SERVER_DIR}/${NC}"
echo -e "${YELLOW}2. Ou clone do repositório Git${NC}"
echo -e "${YELLOW}3. Execute: cd ${SERVER_DIR}/${PROJECT_NAME}${NC}"
echo -e "${YELLOW}4. Execute: npm install${NC}"
echo -e "${YELLOW}5. Execute: npm run build${NC}"
echo -e "${YELLOW}6. Execute: pm2 start ecosystem.config.cjs${NC}"

# Criar arquivo de configuração do Nginx
log "Criando configuração do Nginx..."
cat > /etc/nginx/sites-available/muhlstore << 'EOF'
server {
    listen 80;
    server_name 177.67.32.55;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Ativar site no Nginx
log "Ativando site no Nginx..."
ln -sf /etc/nginx/sites-available/muhlstore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Criar arquivo .env para o projeto
log "Criando arquivo .env..."
cat > ${SERVER_DIR}/.env << 'EOF'
# Database
MYSQL_HOST=localhost
MYSQL_USER=muhlstore
MYSQL_PASSWORD=rg51gt66
MYSQL_DATABASE=rare_toy_companion
MYSQL_PORT=3306

# Server
PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=http://177.67.32.55/api
VITE_APP_URL=http://177.67.32.55
EOF

# Criar script de deploy local
log "Criando script de deploy local..."
cat > ${SERVER_DIR}/deploy-local.sh << 'EOF'
#!/bin/bash
set -e

PROJECT_DIR="/home/espelhar/muhlstore-rare-toy-companion"

echo "🚀 Deploy local do MuhlStore..."

# Parar serviços
pm2 stop all 2>/dev/null || true

# Ir para diretório do projeto
cd $PROJECT_DIR

# Instalar dependências
npm install

# Fazer build
npm run build

# Executar migrações
npm run db:migrate

# Iniciar serviços
pm2 start ecosystem.config.cjs

# Verificar status
pm2 status

echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://177.67.32.55"
EOF

chmod +x ${SERVER_DIR}/deploy-local.sh

# Criar arquivo de instruções
log "Criando arquivo de instruções..."
cat > ${SERVER_DIR}/INSTRUCOES.md << 'EOF'
# 🚀 Instruções de Deploy - MuhlStore

## 📋 Status da Configuração
- ✅ Node.js 18 instalado
- ✅ PM2 instalado
- ✅ MySQL instalado e configurado
- ✅ Nginx instalado e configurado
- ✅ Firewall configurado
- ✅ Banco de dados `rare_toy_companion` criado

## 🔧 Próximos Passos

### 1. Fazer Upload do Projeto
```bash
# Opção A: Via SCP (do seu computador local)
scp -P 8022 -r /caminho/para/muhlstore root@177.67.32.55:/home/espelhar/

# Opção B: Via Git Clone
cd /home/espelhar
git clone https://github.com/seu-usuario/muhlstore.git muhlstore-rare-toy-companion
```

### 2. Configurar Projeto
```bash
cd /home/espelhar/muhlstore-rare-toy-companion
npm install
npm run build
```

### 3. Configurar Banco de Dados
```bash
npm run db:migrate
```

### 4. Iniciar Serviços
```bash
pm2 start ecosystem.config.cjs
```

### 5. Verificar Status
```bash
pm2 status
pm2 logs
```

## 🌐 Acessos
- **Frontend**: http://177.67.32.55
- **Admin**: http://177.67.32.55/admin
- **API**: http://177.67.32.55/api

## 🔧 Comandos Úteis
```bash
# Reiniciar serviços
pm2 restart all

# Ver logs
pm2 logs

# Status dos serviços
pm2 status

# Status do Nginx
systemctl status nginx

# Status do MySQL
systemctl status mysql

# Deploy rápido
/home/espelhar/deploy-local.sh
```

## 📞 Suporte
Em caso de problemas, verifique:
1. Logs do PM2: `pm2 logs`
2. Logs do Nginx: `tail -f /var/log/nginx/error.log`
3. Status dos serviços: `systemctl status nginx mysql`
4. Conectividade: `curl http://localhost:3000`
EOF

log "🎉 CONFIGURAÇÃO DO SERVIDOR CONCLUÍDA!"
echo ""
echo -e "${GREEN}✅ Ambiente preparado com sucesso!${NC}"
echo -e "${GREEN}✅ Node.js, PM2, MySQL e Nginx instalados${NC}"
echo -e "${GREEN}✅ Firewall configurado${NC}"
echo -e "${GREEN}✅ Banco de dados criado${NC}"
echo ""
echo -e "${BLUE}📋 PRÓXIMOS PASSOS:${NC}"
echo -e "${YELLOW}1. Faça upload do projeto para /home/espelhar/${NC}"
echo -e "${YELLOW}2. Execute: cd /home/espelhar/muhlstore-rare-toy-companion${NC}"
echo -e "${YELLOW}3. Execute: npm install && npm run build${NC}"
echo -e "${YELLOW}4. Execute: pm2 start ecosystem.config.cjs${NC}"
echo ""
echo -e "${BLUE}📖 Instruções detalhadas: /home/espelhar/INSTRUCOES.md${NC}"
echo -e "${BLUE}🚀 Deploy rápido: /home/espelhar/deploy-local.sh${NC}"
