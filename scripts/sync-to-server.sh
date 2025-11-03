#!/bin/bash

# 🔄 Script de Sincronização Contínua - MuhlStore
# Sincroniza o projeto local com o servidor 192.168.9.108
# Data: 13 de outubro de 2025

set -e

# Configurações
SERVER_IP="177.67.32.55"
SERVER_PORT="8022"
SERVER_USER="root"
SERVER_DIR="/home/espelhar/muhlstore-rare-toy-companion"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔄 SINCRONIZANDO MUHLSTORE COM SERVIDOR${NC}"
echo -e "${BLUE}📡 ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}${NC}"
echo ""

# Verificar se rsync está disponível
if ! command -v rsync &> /dev/null; then
    echo "Instalando rsync..."
    apt-get update && apt-get install -y rsync
fi

# Sincronizar arquivos (excluindo node_modules, .git, etc.)
echo -e "${GREEN}Sincronizando arquivos...${NC}"
rsync -avz --progress -e "ssh -p ${SERVER_PORT}" \
    --exclude='node_modules/' \
    --exclude='.git/' \
    --exclude='dist/' \
    --exclude='*.log' \
    --exclude='.env.local' \
    --exclude='public/lovable-uploads/' \
    --delete \
    ./ ${SERVER_USER}@${SERVER_IP}:${SERVER_DIR}/

echo -e "${GREEN}✅ Sincronização concluída!${NC}"

# Executar comandos no servidor
echo -e "${YELLOW}Executando comandos no servidor...${NC}"

# Instalar dependências
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_DIR} && npm install"

# Fazer build do projeto
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_DIR} && npm run build"

# Reiniciar serviços
ssh -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "cd ${SERVER_DIR} && pm2 restart all"

echo -e "${GREEN}🎉 Sincronização e deploy concluídos!${NC}"
echo -e "${BLUE}🌐 Acesse: http://${SERVER_IP}${NC}"
