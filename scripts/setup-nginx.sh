#!/bin/bash

################################################################################
# 🌐 Setup Nginx para MuhlStore
# 
# Configura Nginx como proxy reverso para o domínio
# muhl.store.re9suainternet.com.br
################################################################################

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Configuração Nginx - MuhlStore"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Verificar se Nginx está instalado
if ! command -v nginx &> /dev/null; then
    log_error "Nginx não está instalado!"
    echo ""
    log_info "Instalando Nginx..."
    apt update
    apt install -y nginx
    
    if [ $? -eq 0 ]; then
        log_success "Nginx instalado com sucesso"
    else
        log_error "Falha ao instalar Nginx"
        exit 1
    fi
fi

log_success "Nginx está instalado ($(nginx -v 2>&1 | cut -d'/' -f2))"

# Copiar configuração
CONFIG_SOURCE="/srv/erp-muhlstore/rare-toy-companion-mirror/nginx-muhlstore.conf"
CONFIG_DEST="/etc/nginx/sites-available/muhlstore.conf"
CONFIG_LINK="/etc/nginx/sites-enabled/muhlstore.conf"

log_info "Copiando configuração..."
cp "$CONFIG_SOURCE" "$CONFIG_DEST"

if [ $? -eq 0 ]; then
    log_success "Configuração copiada para $CONFIG_DEST"
else
    log_error "Falha ao copiar configuração"
    exit 1
fi

# Criar symlink
if [ -L "$CONFIG_LINK" ]; then
    log_warning "Symlink já existe, removendo..."
    rm "$CONFIG_LINK"
fi

ln -s "$CONFIG_DEST" "$CONFIG_LINK"
log_success "Symlink criado em sites-enabled"

# Remover configuração padrão se existir
if [ -L "/etc/nginx/sites-enabled/default" ]; then
    log_info "Removendo configuração padrão..."
    rm /etc/nginx/sites-enabled/default
    log_success "Configuração padrão removida"
fi

# Testar configuração
log_info "Testando configuração do Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    log_success "Configuração válida!"
    
    # Recarregar Nginx
    log_info "Recarregando Nginx..."
    systemctl reload nginx
    
    if [ $? -eq 0 ]; then
        log_success "Nginx recarregado com sucesso!"
    else
        log_error "Falha ao recarregar Nginx"
        exit 1
    fi
else
    log_error "Configuração inválida! Verifique os erros acima."
    exit 1
fi

# Verificar status
log_info "Verificando status do Nginx..."
systemctl status nginx --no-pager | head -10

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "✨ Nginx configurado com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "🌐 Seu site estará disponível em:"
echo "   http://muhl.store.re9suainternet.com.br"
echo ""
log_info "📊 Verifique os logs em:"
echo "   /var/log/nginx/muhlstore-access.log"
echo "   /var/log/nginx/muhlstore-error.log"
echo ""
log_info "🔧 Comandos úteis:"
echo "   systemctl status nginx    # Ver status"
echo "   systemctl reload nginx    # Recarregar configuração"
echo "   nginx -t                  # Testar configuração"
echo "   tail -f /var/log/nginx/muhlstore-access.log  # Ver logs"
echo ""
log_info "🔐 Para configurar HTTPS (SSL):"
echo "   apt install certbot python3-certbot-nginx"
echo "   certbot --nginx -d muhl.store.re9suainternet.com.br"
echo ""

