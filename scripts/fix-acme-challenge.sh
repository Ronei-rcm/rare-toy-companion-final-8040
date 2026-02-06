#!/bin/bash

# Script para corrigir configuração ACME Challenge do Let's Encrypt
# Uso: sudo ./scripts/fix-acme-challenge.sh

set -e

echo "🔧 Configurando Nginx para ACME Challenge do Let's Encrypt..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor, execute como root (sudo)${NC}"
    exit 1
fi

DOMAIN="muhlstore.re9suainternet.com.br"
NGINX_CONFIG="/etc/nginx/sites-available/${DOMAIN}"
ACME_DIR="/var/www/html/.well-known/acme-challenge"

# 1. Criar diretório para ACME challenge
echo "📁 Criando diretório para ACME challenge..."
mkdir -p "${ACME_DIR}"
chown -R www-data:www-data /var/www/html/.well-known
chmod -R 755 /var/www/html/.well-known
echo -e "${GREEN}✅ Diretório criado: ${ACME_DIR}${NC}"
echo ""

# 2. Verificar se arquivo de configuração existe
if [ ! -f "${NGINX_CONFIG}" ]; then
    echo -e "${RED}❌ Arquivo de configuração não encontrado: ${NGINX_CONFIG}${NC}"
    echo "Por favor, crie o arquivo de configuração primeiro."
    exit 1
fi

# 3. Fazer backup
BACKUP_FILE="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
cp "${NGINX_CONFIG}" "${BACKUP_FILE}"
echo -e "${GREEN}✅ Backup criado: ${BACKUP_FILE}${NC}"
echo ""

# 4. Verificar se já tem configuração ACME
if grep -q "location /.well-known/acme-challenge/" "${NGINX_CONFIG}"; then
    echo -e "${YELLOW}⚠️  Configuração ACME já existe no arquivo.${NC}"
    echo "Deseja atualizar mesmo assim? (s/N)"
    read -r response
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi
fi

# 5. Criar arquivo temporário com configuração
TEMP_CONFIG=$(mktemp)

# Ler arquivo atual e adicionar configuração ACME
cat > "${TEMP_CONFIG}" << 'EOF'
# Configuração para ACME Challenge do Let's Encrypt
# Adicione ANTES do bloco location / no servidor HTTP (porta 80)

# No bloco server { listen 80; ... }
# Adicione:
#   location /.well-known/acme-challenge/ {
#       root /var/www/html;
#       try_files $uri =404;
#   }

# No bloco server { listen 443 ssl; ... }
# Adicione:
#   location /.well-known/acme-challenge/ {
#       root /var/www/html;
#       try_files $uri =404;
#   }
EOF

echo "📝 Configuração necessária:"
echo ""
cat "${TEMP_CONFIG}"
echo ""
echo ""

# 6. Mostrar instruções
echo -e "${YELLOW}📋 PRÓXIMOS PASSOS MANUAIS:${NC}"
echo ""
echo "1. Edite o arquivo de configuração:"
echo "   sudo nano ${NGINX_CONFIG}"
echo ""
echo "2. No bloco 'server { listen 80; ... }', adicione ANTES do 'location /':"
echo ""
echo "   location /.well-known/acme-challenge/ {"
echo "       root /var/www/html;"
echo "       try_files \$uri =404;"
echo "   }"
echo ""
echo "3. No bloco 'server { listen 443 ssl; ... }', adicione ANTES do 'location /':"
echo ""
echo "   location /.well-known/acme-challenge/ {"
echo "       root /var/www/html;"
echo "       try_files \$uri =404;"
echo "   }"
echo ""
echo "4. Testar configuração:"
echo "   sudo nginx -t"
echo ""
echo "5. Recarregar Nginx:"
echo "   sudo systemctl reload nginx"
echo ""
echo "6. Testar acesso:"
echo "   echo 'test' | sudo tee ${ACME_DIR}/test.txt"
echo "   curl http://${DOMAIN}/.well-known/acme-challenge/test.txt"
echo ""
echo "7. Renovar certificado:"
echo "   sudo certbot renew --nginx"
echo ""

# Limpar arquivo temporário
rm -f "${TEMP_CONFIG}"

echo -e "${GREEN}✅ Diretório ACME criado e configurado!${NC}"
echo -e "${YELLOW}⚠️  Agora edite manualmente o arquivo Nginx conforme instruções acima.${NC}"
