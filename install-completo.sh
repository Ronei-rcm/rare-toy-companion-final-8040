#!/bin/bash
set -e

# =============================================================================
# 🚀 MUHLSTORE - INSTALADOR AUTOMÁTICO COMPLETO PARA SERVIDOR LIMPO
# =============================================================================
# Versão: 3.0
# Data: Janeiro 2026
# Descrição: Instala tudo automaticamente em um servidor Linux limpo
# =============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Variáveis globais
PROJECT_DIR=$(pwd)
PROJECT_NAME="MuhlStore"
NODE_VERSION="20"
MYSQL_ROOT_PASSWORD=""
MYSQL_DB_PASSWORD=""
DOMAIN_NAME=""
EMAIL_SSL=""
INSTALL_SSL=false
SKIP_SSL=false

# =============================================================================
# FUNÇÕES DE UTILIDADE
# =============================================================================

print_banner() {
    clear
    echo -e "${PURPLE}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║              🚀 MUHLSTORE - INSTALADOR COMPLETO             ║"
    echo "║                                                              ║"
    echo "║         Instalação Automática para Servidor Limpo           ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
}

print_header() {
    echo -e "\n${BLUE}${BOLD}==> $1${NC}\n"
}

print_info() {
    echo -e "${CYAN}ℹ  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠  $1${NC}"
}

print_error() {
    echo -e "${RED}✗  $1${NC}"
}

print_step() {
    echo -e "\n${WHITE}▶  $1${NC}"
}

# =============================================================================
# VERIFICAÇÕES INICIAIS
# =============================================================================

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "Este script precisa ser executado como root (use sudo)"
        exit 1
    fi
}

detect_os() {
    print_header "🔍 Detectando Sistema Operacional"
    
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        OS=$ID
        OS_VERSION=$VERSION_ID
        print_info "Sistema detectado: $NAME $VERSION"
        
        case $ID in
            ubuntu|debian)
                PACKAGE_MANAGER="apt"
                UPDATE_CMD="apt update"
                INSTALL_CMD="apt install -y"
                ;;
            centos|rhel|fedora|rocky)
                PACKAGE_MANAGER="yum"
                UPDATE_CMD="yum check-update || true"
                INSTALL_CMD="yum install -y"
                ;;
            arch|manjaro)
                PACKAGE_MANAGER="pacman"
                UPDATE_CMD="pacman -Sy"
                INSTALL_CMD="pacman -S --noconfirm"
                ;;
            *)
                print_error "Sistema operacional não suportado: $ID"
                exit 1
                ;;
        esac
        
        print_success "Sistema operacional identificado"
    else
        print_error "Não foi possível detectar o sistema operacional"
        exit 1
    fi
}

# =============================================================================
# COLETA DE INFORMAÇÕES
# =============================================================================

collect_info() {
    print_header "📝 Coletando Informações"
    
    # Senha do MySQL Root
    while [[ -z "$MYSQL_ROOT_PASSWORD" ]]; do
        echo -n "Digite a senha do MySQL root: "
        read -s MYSQL_ROOT_PASSWORD
        echo
        if [[ -z "$MYSQL_ROOT_PASSWORD" ]]; then
            print_warning "A senha não pode estar vazia!"
        fi
    done
    
    # Senha do banco de dados da aplicação
    echo -n "Digite a senha para o banco de dados da aplicação (ou Enter para gerar automaticamente): "
    read -s MYSQL_DB_PASSWORD
    echo
    if [[ -z "$MYSQL_DB_PASSWORD" ]]; then
        MYSQL_DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        print_info "Senha gerada automaticamente: $MYSQL_DB_PASSWORD"
    fi
    
    # Domínio
    echo -n "Digite o domínio do site (ex: muhlstore.com.br) ou Enter para pular: "
    read DOMAIN_NAME
    
    # SSL
    if [[ -n "$DOMAIN_NAME" ]]; then
        echo -n "Deseja instalar certificado SSL com Let's Encrypt? (s/N): "
        read -n 1 install_ssl_choice
        echo
        if [[ "$install_ssl_choice" =~ ^[Ss]$ ]]; then
            INSTALL_SSL=true
            echo -n "Digite o e-mail para o certificado SSL: "
            read EMAIL_SSL
            if [[ -z "$EMAIL_SSL" ]]; then
                print_warning "E-mail não fornecido. SSL será pulado."
                INSTALL_SSL=false
            fi
        fi
    else
        SKIP_SSL=true
    fi
    
    print_success "Informações coletadas"
}

# =============================================================================
# ATUALIZAÇÃO DO SISTEMA
# =============================================================================

update_system() {
    print_header "🔄 Atualizando Sistema"
    
    print_step "Atualizando repositórios"
    $UPDATE_CMD
    
    print_step "Instalando dependências básicas"
    $INSTALL_CMD curl wget git build-essential software-properties-common \
        apt-transport-https ca-certificates gnupg lsb-release
    
    print_success "Sistema atualizado"
}

# =============================================================================
# INSTALAÇÃO DO NODE.JS
# =============================================================================

install_nodejs() {
    print_header "📦 Instalando Node.js"
    
    if command -v node &> /dev/null; then
        NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
        if [[ $NODE_CURRENT -ge 18 ]]; then
            print_info "Node.js já instalado: $(node -v)"
            return
        fi
    fi
    
    print_step "Instalando Node.js $NODE_VERSION via NVM"
    
    # Detectar usuário não-root
    if [[ -n "$SUDO_USER" ]]; then
        REAL_USER=$SUDO_USER
    else
        REAL_USER=$(who am i | awk '{print $1}')
    fi
    
    # Instalar NVM para o usuário
    sudo -u $REAL_USER bash << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] || curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20
nvm alias default 20
EOF
    
    # Configurar NVM no PATH do sistema
    if ! grep -q "NVM_DIR" /etc/profile; then
        cat >> /etc/profile << 'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
EOF
    fi
    
    # Criar symlink global
    NVM_PATH="/home/$REAL_USER/.nvm/versions/node/v$NODE_VERSION.*/bin"
    if [[ -d $NVM_PATH ]]; then
        NODE_BIN=$(ls -d $NVM_PATH | head -1)
        ln -sf $NODE_BIN/node /usr/local/bin/node
        ln -sf $NODE_BIN/npm /usr/local/bin/npm
        ln -sf $NODE_BIN/npx /usr/local/bin/npx
    fi
    
    print_success "Node.js instalado: $(node -v)"
}

# =============================================================================
# INSTALAÇÃO DO PM2
# =============================================================================

install_pm2() {
    print_header "⚡ Instalando PM2"
    
    if command -v pm2 &> /dev/null; then
        print_info "PM2 já instalado: $(pm2 -v)"
    else
        print_step "Instalando PM2 globalmente"
        npm install -g pm2
        
        print_step "Configurando PM2 para iniciar no boot"
        pm2 startup systemd -u root --hp /root
    fi
    
    print_success "PM2 instalado e configurado"
}

# =============================================================================
# INSTALAÇÃO DO MYSQL
# =============================================================================

install_mysql() {
    print_header "🗄️  Instalando MySQL"
    
    if command -v mysql &> /dev/null; then
        print_info "MySQL já instalado"
        return
    fi
    
    print_step "Instalando MySQL Server"
    
    case $PACKAGE_MANAGER in
        apt)
            $INSTALL_CMD mysql-server
            systemctl start mysql
            systemctl enable mysql
            ;;
        yum)
            $INSTALL_CMD mysql-server
            systemctl start mysqld
            systemctl enable mysqld
            ;;
    esac
    
    # Aguardar MySQL iniciar
    sleep 5
    
    print_step "Configurando MySQL"
    
    # Criar script de configuração
    cat > /tmp/mysql_setup.sql << EOF
-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS rare_toy_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS rare_toy_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário da aplicação
CREATE USER IF NOT EXISTS 'rare_toy_user'@'localhost' IDENTIFIED BY '$MYSQL_DB_PASSWORD';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'localhost';
GRANT ALL PRIVILEGES ON rare_toy_store.* TO 'rare_toy_user'@'localhost';
FLUSH PRIVILEGES;
EOF
    
    # Executar configuração
    mysql -u root -p"$MYSQL_ROOT_PASSWORD" < /tmp/mysql_setup.sql 2>/dev/null || {
        print_warning "Não foi possível configurar automaticamente. Execute manualmente:"
        print_info "mysql -u root -p < /tmp/mysql_setup.sql"
    }
    
    rm -f /tmp/mysql_setup.sql
    
    print_success "MySQL instalado e configurado"
}

# =============================================================================
# INSTALAÇÃO DO NGINX
# =============================================================================

install_nginx() {
    print_header "🌐 Instalando Nginx"
    
    if command -v nginx &> /dev/null; then
        print_info "Nginx já instalado"
    else
        print_step "Instalando Nginx"
        $INSTALL_CMD nginx
        systemctl start nginx
        systemctl enable nginx
    fi
    
    print_success "Nginx instalado"
}

# =============================================================================
# INSTALAÇÃO DO CERTBOT (SSL)
# =============================================================================

install_certbot() {
    if [[ "$INSTALL_SSL" == true ]]; then
        print_header "🔒 Instalando Certbot (SSL)"
        
        if command -v certbot &> /dev/null; then
            print_info "Certbot já instalado"
        else
            print_step "Instalando Certbot"
            case $PACKAGE_MANAGER in
                apt)
                    $INSTALL_CMD certbot python3-certbot-nginx
                    ;;
                yum)
                    $INSTALL_CMD certbot python3-certbot-nginx
                    ;;
            esac
        fi
        
        print_success "Certbot instalado"
    fi
}

# =============================================================================
# INSTALAÇÃO DAS DEPENDÊNCIAS DO PROJETO
# =============================================================================

install_project_dependencies() {
    print_header "📦 Instalando Dependências do Projeto"
    
    if [[ -n "$SUDO_USER" ]]; then
        REAL_USER=$SUDO_USER
    else
        REAL_USER=$(who am i | awk '{print $1}')
    fi
    
    print_step "Instalando dependências NPM"
    
    # Carregar NVM e instalar dependências
    sudo -u $REAL_USER bash << EOF
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
cd $PROJECT_DIR
npm install
EOF
    
    print_success "Dependências instaladas"
}

# =============================================================================
# CONFIGURAÇÃO DO PROJETO
# =============================================================================

setup_project() {
    print_header "⚙️  Configurando Projeto"
    
    print_step "Criando arquivo .env"
    
    # Gerar JWT secret
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    SESSION_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-50)
    
    # Determinar URLs
    if [[ -n "$DOMAIN_NAME" ]]; then
        if [[ "$INSTALL_SSL" == true ]]; then
            FRONTEND_URL="https://$DOMAIN_NAME"
            API_URL="https://$DOMAIN_NAME"
        else
            FRONTEND_URL="http://$DOMAIN_NAME"
            API_URL="http://$DOMAIN_NAME"
        fi
    else
        FRONTEND_URL="http://localhost:8040"
        API_URL="http://localhost:3001"
    fi
    
    cat > .env << EOF
# ===========================================
# BANCO DE DADOS
# ===========================================
DB_HOST=localhost
DB_USER=rare_toy_user
DB_PASSWORD=$MYSQL_DB_PASSWORD
DB_NAME=rare_toy_store
DB_PORT=3306

MYSQL_HOST=127.0.0.1
MYSQL_USER=rare_toy_user
MYSQL_PASSWORD=$MYSQL_DB_PASSWORD
MYSQL_DATABASE=rare_toy_companion
MYSQL_PORT=3306

MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD

# ===========================================
# SERVIDOR PRINCIPAL
# ===========================================
NODE_ENV=production
SERVER_PORT=3001

# ===========================================
# FRONTEND
# ===========================================
VITE_API_URL=/api
VITE_PORT=8040

# ===========================================
# WHATSAPP BUSINESS API
# ===========================================
WHATSAPP_WEBHOOK_PORT=3002
WHATSAPP_WEBHOOK_SECRET=$(openssl rand -hex 32)
WHATSAPP_TOKEN=seu-token-aqui
WHATSAPP_PHONE_ID=seu-phone-id-aqui

# ===========================================
# CONFIGURAÇÕES GERAIS
# ===========================================
APP_BASE_URL=$FRONTEND_URL
FRONTEND_URL=$FRONTEND_URL
API_URL=$API_URL

# ===========================================
# CONFIGURAÇÕES DE E-MAIL (SMTP)
# ===========================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app-aqui

# ===========================================
# MERCADO PAGO
# ===========================================
MERCADOPAGO_ACCESS_TOKEN=seu-access-token-aqui

# ===========================================
# SEGURANÇA
# ===========================================
JWT_SECRET=$JWT_SECRET
SESSION_SECRET=$SESSION_SECRET

# ===========================================
# LOGGING
# ===========================================
LOG_LEVEL=info

# ===========================================
# REDIS (OPCIONAL)
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# ===========================================
# SENTRY (OPCIONAL)
# ===========================================
SENTRY_DSN=
EOF
    
    print_success "Arquivo .env criado"
    
    print_step "Criando diretórios necessários"
    mkdir -p uploads logs database/migrations backups
    chmod 755 uploads logs backups
    
    print_success "Estrutura criada"
}

# =============================================================================
# CONFIGURAÇÃO DO BANCO DE DADOS
# =============================================================================

setup_database() {
    print_header "🗄️  Configurando Banco de Dados"
    
    print_step "Executando migrations"
    
    if [[ -f "database/init.sql" ]]; then
        mysql -u rare_toy_user -p"$MYSQL_DB_PASSWORD" rare_toy_companion < database/init.sql 2>/dev/null || {
            print_warning "Não foi possível executar init.sql automaticamente"
        }
    fi
    
    if [[ -f "database/add_cart_recovery_columns.sql" ]]; then
        mysql -u rare_toy_user -p"$MYSQL_DB_PASSWORD" rare_toy_store < database/add_cart_recovery_columns.sql 2>/dev/null || {
            print_warning "Não foi possível executar add_cart_recovery_columns.sql automaticamente"
        }
    fi
    
    print_success "Banco de dados configurado"
}

# =============================================================================
# BUILD DO PROJETO
# =============================================================================

build_project() {
    print_header "🏗️  Fazendo Build do Projeto"
    
    if [[ -n "$SUDO_USER" ]]; then
        REAL_USER=$SUDO_USER
    else
        REAL_USER=$(who am i | awk '{print $1}')
    fi
    
    print_step "Executando build de produção"
    
    sudo -u $REAL_USER bash << EOF
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
cd $PROJECT_DIR
npm run build
EOF
    
    print_success "Build concluído"
}

# =============================================================================
# CONFIGURAÇÃO DO NGINX
# =============================================================================

configure_nginx() {
    print_header "🌐 Configurando Nginx"
    
    NGINX_CONFIG="/etc/nginx/sites-available/$PROJECT_NAME"
    
    if [[ -n "$DOMAIN_NAME" ]]; then
        SERVER_NAME="$DOMAIN_NAME"
    else
        SERVER_NAME="_"
    fi
    
    print_step "Criando configuração do Nginx"
    
    cat > $NGINX_CONFIG << EOF
server {
    listen 80;
    server_name $SERVER_NAME;
    
    # Frontend
    location / {
        proxy_pass http://localhost:8040;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Uploads
    location /uploads {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    # Configurações de segurança
    client_max_body_size 50M;
    proxy_read_timeout 300;
    proxy_connect_timeout 300;
    proxy_send_timeout 300;
}
EOF
    
    # Ativar site
    ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t && systemctl reload nginx
    
    print_success "Nginx configurado"
}

# =============================================================================
# CONFIGURAÇÃO DO SSL
# =============================================================================

configure_ssl() {
    if [[ "$INSTALL_SSL" == true && -n "$DOMAIN_NAME" && -n "$EMAIL_SSL" ]]; then
        print_header "🔒 Configurando SSL"
        
        print_step "Obtendo certificado SSL"
        
        certbot --nginx -d $DOMAIN_NAME --non-interactive --agree-tos --email $EMAIL_SSL || {
            print_warning "Não foi possível obter certificado SSL automaticamente"
            print_info "Execute manualmente: certbot --nginx -d $DOMAIN_NAME"
        }
        
        print_success "SSL configurado"
    fi
}

# =============================================================================
# CONFIGURAÇÃO DO FIREWALL
# =============================================================================

configure_firewall() {
    print_header "🔥 Configurando Firewall"
    
    if command -v ufw &> /dev/null; then
        print_step "Configurando UFW"
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        ufw --force enable
        print_success "Firewall configurado (UFW)"
    elif command -v firewall-cmd &> /dev/null; then
        print_step "Configurando firewalld"
        firewall-cmd --permanent --add-service=ssh
        firewall-cmd --permanent --add-service=http
        firewall-cmd --permanent --add-service=https
        firewall-cmd --reload
        print_success "Firewall configurado (firewalld)"
    else
        print_warning "Nenhum firewall detectado. Configure manualmente."
    fi
}

# =============================================================================
# INICIAR SERVIÇOS COM PM2
# =============================================================================

start_services() {
    print_header "🚀 Iniciando Serviços"
    
    if [[ -n "$SUDO_USER" ]]; then
        REAL_USER=$SUDO_USER
    else
        REAL_USER=$(who am i | awk '{print $1}')
    fi
    
    print_step "Iniciando aplicação com PM2"
    
    sudo -u $REAL_USER bash << EOF
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && \. "\$NVM_DIR/nvm.sh"
cd $PROJECT_DIR
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save
EOF
    
    print_success "Serviços iniciados"
}

# =============================================================================
# RESUMO FINAL
# =============================================================================

show_summary() {
    print_header "✅ Instalação Concluída!"
    
    echo -e "${GREEN}${BOLD}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    INSTALAÇÃO CONCLUÍDA!                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    print_info "📋 Informações da Instalação:"
    echo -e "   ${CYAN}•${NC} Node.js: $(node -v)"
    echo -e "   ${CYAN}•${NC} PM2: $(pm2 -v)"
    echo -e "   ${CYAN}•${NC} MySQL: Instalado"
    echo -e "   ${CYAN}•${NC} Nginx: Instalado"
    
    if [[ -n "$DOMAIN_NAME" ]]; then
        if [[ "$INSTALL_SSL" == true ]]; then
            echo -e "   ${CYAN}•${NC} URL: https://$DOMAIN_NAME"
        else
            echo -e "   ${CYAN}•${NC} URL: http://$DOMAIN_NAME"
        fi
    else
        echo -e "   ${CYAN}•${NC} Frontend: http://localhost:8040"
        echo -e "   ${CYAN}•${NC} Backend: http://localhost:3001"
    fi
    
    echo -e "\n${YELLOW}⚠  IMPORTANTE:${NC}"
    echo -e "   ${CYAN}•${NC} Configure as variáveis no arquivo .env"
    echo -e "   ${CYAN}•${NC} Senha do banco: $MYSQL_DB_PASSWORD"
    echo -e "   ${CYAN}•${NC} Verifique os logs: pm2 logs"
    echo -e "   ${CYAN}•${NC} Status dos serviços: pm2 status"
    
    echo -e "\n${GREEN}✓  Tudo pronto! A aplicação está rodando.${NC}\n"
}

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

main() {
    print_banner
    
    check_root
    detect_os
    collect_info
    
    update_system
    install_nodejs
    install_pm2
    install_mysql
    install_nginx
    install_certbot
    install_project_dependencies
    setup_project
    setup_database
    build_project
    configure_nginx
    configure_ssl
    configure_firewall
    start_services
    
    show_summary
}

# Executar
main "$@"

