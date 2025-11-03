#!/bin/bash

# 🔍 Script de Teste de Conexão - Servidor 177.67.32.55
# Data: 13 de outubro de 2025

set -e

# Configurações
SERVER_IP="177.67.32.55"
SERVER_PORT="8022"
SERVER_USER="root"
SERVER_PASSWORD="rg51gt66"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 TESTANDO CONEXÃO COM SERVIDOR${NC}"
echo -e "${BLUE}📡 ${SERVER_USER}@${SERVER_IP}:${SERVER_PORT}${NC}"
echo ""

# Teste 1: Ping
echo -e "${YELLOW}1. Testando conectividade de rede...${NC}"
if ping -c 1 -W 3 ${SERVER_IP} > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Ping: OK${NC}"
else
    echo -e "${RED}❌ Ping: FALHOU${NC}"
    exit 1
fi

# Teste 2: Porta SSH
echo -e "${YELLOW}2. Testando porta SSH ${SERVER_PORT}...${NC}"
if timeout 5 bash -c "</dev/tcp/${SERVER_IP}/${SERVER_PORT}" 2>/dev/null; then
    echo -e "${GREEN}✅ Porta ${SERVER_PORT}: OK${NC}"
else
    echo -e "${RED}❌ Porta ${SERVER_PORT}: FALHOU${NC}"
    exit 1
fi

# Teste 3: Conexão SSH com senha
echo -e "${YELLOW}3. Testando autenticação SSH...${NC}"
if sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o PasswordAuthentication=yes -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
    echo -e "${GREEN}✅ SSH com senha: OK${NC}"
else
    echo -e "${RED}❌ SSH com senha: FALHOU${NC}"
    echo -e "${YELLOW}💡 Tentando diferentes métodos de autenticação...${NC}"
    
    # Tentar com diferentes opções
    echo -e "${YELLOW}   Tentando com PreferredAuthentications...${NC}"
    if sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 -o PreferredAuthentications=password -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
        echo -e "${GREEN}✅ SSH com PreferredAuthentications: OK${NC}"
    else
        echo -e "${RED}❌ SSH com PreferredAuthentications: FALHOU${NC}"
        
        echo -e "${YELLOW}   Tentando sem verificação de host...${NC}"
        if sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "echo 'SSH OK'" 2>/dev/null; then
            echo -e "${GREEN}✅ SSH sem verificação de host: OK${NC}"
        else
            echo -e "${RED}❌ SSH sem verificação de host: FALHOU${NC}"
            echo -e "${RED}❌ Todas as tentativas de SSH falharam${NC}"
            echo -e "${YELLOW}💡 Verifique:${NC}"
            echo -e "${YELLOW}   - Credenciais corretas (usuário/senha)${NC}"
            echo -e "${YELLOW}   - Porta SSH correta${NC}"
            echo -e "${YELLOW}   - Serviço SSH rodando${NC}"
            echo -e "${YELLOW}   - Firewall permitindo conexões${NC}"
            exit 1
        fi
    fi
fi

# Teste 4: Verificar ambiente do servidor
echo -e "${YELLOW}4. Verificando ambiente do servidor...${NC}"
sshpass -p "${SERVER_PASSWORD}" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 -p ${SERVER_PORT} ${SERVER_USER}@${SERVER_IP} "
    echo 'Sistema:'
    uname -a
    echo ''
    echo 'Node.js:'
    node --version 2>/dev/null || echo 'Node.js não instalado'
    echo ''
    echo 'PM2:'
    pm2 --version 2>/dev/null || echo 'PM2 não instalado'
    echo ''
    echo 'MySQL:'
    mysql --version 2>/dev/null || echo 'MySQL não instalado'
    echo ''
    echo 'Nginx:'
    nginx -v 2>/dev/null || echo 'Nginx não instalado'
    echo ''
    echo 'Espaço em disco:'
    df -h /
    echo ''
    echo 'Memória:'
    free -h
"

echo ""
echo -e "${GREEN}🎉 TESTE DE CONEXÃO CONCLUÍDO!${NC}"
echo -e "${GREEN}✅ Servidor acessível e pronto para deploy${NC}"
echo ""
echo -e "${BLUE}📋 Informações do servidor:${NC}"
echo -e "${YELLOW}  IP: ${SERVER_IP}${NC}"
echo -e "${YELLOW}  Porta SSH: ${SERVER_PORT}${NC}"
echo -e "${YELLOW}  Usuário: ${SERVER_USER}${NC}"
echo -e "${YELLOW}  Senha: ${SERVER_PASSWORD}${NC}"
echo ""
echo -e "${BLUE}🚀 Próximos passos:${NC}"
echo -e "${YELLOW}  ./scripts/deploy-to-server.sh${NC}"
