#!/bin/bash

# 🚀 Script de Deploy - MuhlStore para Servidor 192.168.9.108
# Data: 13 de outubro de 2025
# Versão: 1.0.7

set -e  # Parar em caso de erro

# Configurações do servidor
SERVER_IP="177.67.32.55"
SERVER_PORT="8022"
SERVER_USER="root"
SERVER_PASSWORD="rg51gt66"
SERVER_DIR="/home/espelhar"
PROJECT_NAME="muhlstore-rare-toy-companion"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 INICIANDO DEPLOY DO MUHLSTORE v1.0.7${NC}"
echo -e "${BLUE}📡 Servidor: ${SERVER_USER}@${SERVER_IP}${NC}"
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

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Verificar se sshpass está instalado
if ! command -v sshpass &> /dev/null; then
    log "Instalando sshpass..."
    apt-get update && apt-get install -y sshpass
fi

# Verificar conectividade
log "Verificando conectividade com o servidor..."
if ! ping -c 1 -W 3 ${SERVER_IP} > /dev/null 2>&1; then
    error "Servidor ${SERVER_IP} não está acessível. Verifique a conectividade de rede."
fi

# Função para executar comandos no servidor remoto
run_remote() {
    sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "$1"
}

# Função para copiar arquivos para o servidor
copy_to_server() {
    sshpass -p "${SERVER_PASSWORD}" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -P ${SERVER_PORT} -r "$1" ${SERVER_USER}@${SERVER_IP}:$2
}

log "🔧 Configurando ambiente no servidor..."

# Criar diretório no servidor
run_remote "mkdir -p ${SERVER_DIR}"

# Verificar se Node.js está instalado
log "Verificando Node.js no servidor..."
if ! run_remote "node --version" > /dev/null 2>&1; then
    log "Instalando Node.js..."
    run_remote "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && apt-get install -y nodejs"
fi

# Verificar se PM2 está instalado
if ! run_remote "pm2 --version" > /dev/null 2>&1; then
    log "Instalando PM2..."
    run_remote "npm install -g pm2"
fi

# Verificar se MySQL está instalado
if ! run_remote "mysql --version" > /dev/null 2>&1; then
    log "Instalando MySQL..."
    run_remote "apt-get update && apt-get install -y mysql-server"
fi

# Verificar se Nginx está instalado
if ! run_remote "nginx -v" > /dev/null 2>&1; then
    log "Instalando Nginx..."
    run_remote "apt-get update && apt-get install -y nginx"
fi

log "📦 Copiando projeto para o servidor..."

# Criar arquivo .tar.gz do projeto atual
log "Criando backup do projeto..."
tar -czf ${PROJECT_NAME}-v1.0.7.tar.gz \
    --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='*.log' \
    --exclude='.env.local' \
    .

# Copiar projeto para o servidor
log "Enviando projeto para o servidor..."
copy_to_server "${PROJECT_NAME}-v1.0.7.tar.gz" "${SERVER_DIR}/"

# Extrair projeto no servidor
log "Extraindo projeto no servidor..."
run_remote "cd ${SERVER_DIR} && tar -xzf ${PROJECT_NAME}-v1.0.7.tar.gz -C ${PROJECT_NAME} || mkdir -p ${PROJECT_NAME} && tar -xzf ${PROJECT_NAME}-v1.0.7.tar.gz -C ${PROJECT_NAME}"

# Configurar projeto no servidor
log "Configurando projeto no servidor..."
run_remote "cd ${SERVER_DIR}/${PROJECT_NAME} && npm install"

# Configurar banco de dados
log "Configurando banco de dados..."
run_remote "mysql -u root -p'${SERVER_PASSWORD}' -e 'CREATE DATABASE IF NOT EXISTS rare_toy_companion;'"

# Executar migrações
log "Executando migrações do banco..."
run_remote "cd ${SERVER_DIR}/${PROJECT_NAME} && npm run db:migrate"

# Configurar PM2
log "Configurando PM2..."
run_remote "cd ${SERVER_DIR}/${PROJECT_NAME} && pm2 start ecosystem.config.cjs"

# Configurar Nginx
log "Configurando Nginx..."
run_remote "cat > /etc/nginx/sites-available/muhlstore << 'EOF'
server {
    listen 80;
    server_name ${SERVER_IP};
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection \"upgrade\";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF"

# Ativar site no Nginx
run_remote "ln -sf /etc/nginx/sites-available/muhlstore /etc/nginx/sites-enabled/"
run_remote "rm -f /etc/nginx/sites-enabled/default"
run_remote "nginx -t && systemctl reload nginx"

# Configurar firewall
log "Configurando firewall..."
run_remote "ufw allow ${SERVER_PORT}/tcp && ufw allow 80/tcp && ufw allow 443/tcp && ufw --force enable"

# Configurar SSL (opcional)
log "Configurando SSL com Let's Encrypt..."
if command -v certbot &> /dev/null; then
    run_remote "certbot --nginx -d ${SERVER_IP} --non-interactive --agree-tos --email admin@muhlstore.com"
fi

# Limpar arquivos temporários
log "Limpando arquivos temporários..."
rm -f ${PROJECT_NAME}-v1.0.7.tar.gz
run_remote "rm -f ${SERVER_DIR}/${PROJECT_NAME}-v1.0.7.tar.gz"

# Verificar status dos serviços
log "Verificando status dos serviços..."
run_remote "pm2 status"
run_remote "systemctl status nginx --no-pager -l"

log "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo -e "${GREEN}✅ Servidor: ${SERVER_IP}${NC}"
echo -e "${GREEN}✅ Projeto: ${PROJECT_NAME} v1.0.7${NC}"
echo -e "${GREEN}✅ Diretório: ${SERVER_DIR}/${PROJECT_NAME}${NC}"
echo -e "${GREEN}✅ Frontend: http://${SERVER_IP}${NC}"
echo -e "${GREEN}✅ API: http://${SERVER_IP}/api${NC}"
echo -e "${GREEN}✅ Admin: http://${SERVER_IP}/admin${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo -e "${YELLOW}  PM2 Status: ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} 'pm2 status'${NC}"
echo -e "${YELLOW}  PM2 Logs: ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} 'pm2 logs'${NC}"
echo -e "${YELLOW}  Nginx Status: ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} 'systemctl status nginx'${NC}"
echo -e "${YELLOW}  Restart: ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} 'cd ${SERVER_DIR}/${PROJECT_NAME} && pm2 restart all'${NC}"
echo ""
echo -e "${GREEN}🚀 MuhlStore está rodando no servidor!${NC}"
