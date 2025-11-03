#!/bin/bash
set -e

# =============================================================================
# 🚀 MUHLSTORE - INSTALADOR PARA ROOT v2.0
# =============================================================================
# Data: Outubro 2025
# Versão: 2.0 - Root Compatible
# Autor: Sistema de Instalação Automática
# =============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="MuhlStore"
PROJECT_VERSION="2.0"
NODE_VERSION="20"
PM2_NAME="muhlstore"
NGINX_SITE="muhlstore"

# =============================================================================
# FUNÇÕES DE UTILIDADE
# =============================================================================

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    🚀 MUHLSTORE v2.0                        ║"
    echo "║                                                              ║"
    echo "║              INSTALADOR AUTOMÁTICO COMPLETO                  ║"
    echo "║                                                              ║"
    echo "║              E-Commerce Enterprise Grade                     ║"
    echo "║                                                              ║"
    echo "║              ⚠️  MODO ROOT - INSTALAÇÃO DIRETA               ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_header() {
    echo -e "\n${BLUE}==> $1${NC}\n"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_step() {
    echo -e "\n${WHITE}▶ $1${NC}"
}

# =============================================================================
# VERIFICAÇÕES INICIAIS
# =============================================================================

check_system() {
    print_header "🔍 Verificando Sistema"
    
    # Verificar distribuição Linux
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        print_info "Sistema detectado: $NAME $VERSION"
        
        case $ID in
            ubuntu|debian)
                PACKAGE_MANAGER="apt"
                ;;
            centos|rhel|fedora)
                PACKAGE_MANAGER="yum"
                ;;
            arch)
                PACKAGE_MANAGER="pacman"
                ;;
            *)
                print_warning "Distribuição não testada: $ID"
                PACKAGE_MANAGER="apt"
                ;;
        esac
    else
        print_warning "Não foi possível detectar a distribuição"
        PACKAGE_MANAGER="apt"
    fi
    
    print_success "Sistema verificado: $PACKAGE_MANAGER"
}

check_dependencies() {
    print_header "📦 Verificando Dependências"
    
    local missing_deps=()
    
    # Verificar comandos essenciais
    for cmd in curl wget git; do
        if ! command -v $cmd &> /dev/null; then
            missing_deps+=($cmd)
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_warning "Dependências faltando: ${missing_deps[*]}"
        install_system_dependencies
    else
        print_success "Todas as dependências estão instaladas"
    fi
}

install_system_dependencies() {
    print_step "Instalando dependências do sistema"
    
    case $PACKAGE_MANAGER in
        apt)
            apt update
            apt install -y curl wget git build-essential software-properties-common
            ;;
        yum)
            yum update -y
            yum install -y curl wget git gcc gcc-c++ make
            ;;
        pacman)
            pacman -Sy --noconfirm curl wget git base-devel
            ;;
    esac
    
    print_success "Dependências do sistema instaladas"
}

# =============================================================================
# INSTALAÇÃO DO NODE.JS
# =============================================================================

install_nodejs() {
    print_header "📦 Instalando Node.js"
    
    # Verificar se Node.js já está instalado
    if command -v node &> /dev/null; then
        print_info "Node.js já está instalado: $(node -v)"
        return
    fi
    
    print_step "Instalando Node.js via NodeSource"
    
    # Instalar Node.js LTS via NodeSource
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt install -y nodejs
    
    print_success "Node.js instalado: $(node -v)"
    print_success "NPM instalado: $(npm -v)"
}

# =============================================================================
# INSTALAÇÃO DO PM2
# =============================================================================

install_pm2() {
    print_header "⚡ Instalando PM2 Process Manager"
    
    print_step "Instalando PM2 globalmente"
    npm install -g pm2@latest
    
    # Configurar PM2
    pm2 install pm2-logrotate
    pm2 set pm2-logrotate:max_size 10M
    pm2 set pm2-logrotate:retain 30
    
    print_success "PM2 instalado: $(pm2 -v)"
}

# =============================================================================
# INSTALAÇÃO DO NGINX
# =============================================================================

install_nginx() {
    print_header "🌐 Instalando Nginx"
    
    case $PACKAGE_MANAGER in
        apt)
            apt update
            apt install -y nginx
            ;;
        yum)
            yum install -y nginx
            ;;
        pacman)
            pacman -S --noconfirm nginx
            ;;
    esac
    
    # Configurar Nginx
    print_step "Configurando Nginx"
    
    # Backup da configuração original
    cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup
    
    # Criar configuração do site
    tee /etc/nginx/sites-available/$NGINX_SITE > /dev/null <<EOF
server {
    listen 80;
    server_name _;
    
    # Frontend
    location / {
        proxy_pass http://localhost:5173;
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
    
    # Upload de arquivos
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
    
    # Habilitar site
    ln -sf /etc/nginx/sites-available/$NGINX_SITE /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Testar configuração
    nginx -t
    
    # Reiniciar Nginx
    systemctl enable nginx
    systemctl restart nginx
    
    print_success "Nginx instalado e configurado"
}

# =============================================================================
# INSTALAÇÃO DO MYSQL
# =============================================================================

install_mysql() {
    print_header "🗄️ Instalando MySQL"
    
    case $PACKAGE_MANAGER in
        apt)
            apt update
            apt install -y mysql-server
            ;;
        yum)
            yum install -y mysql-server
            systemctl start mysqld
            systemctl enable mysqld
            ;;
        pacman)
            pacman -S --noconfirm mysql
            systemctl start mysqld
            systemctl enable mysqld
            ;;
    esac
    
    # Configurar MySQL
    print_step "Configurando MySQL"
    
    # Iniciar serviço
    systemctl start mysql
    systemctl enable mysql
    
    # Configuração básica de segurança
    print_info "Configurando MySQL..."
    
    # Criar script de configuração
    cat > /tmp/mysql_setup.sql <<EOF
-- Criar banco de dados
CREATE DATABASE IF NOT EXISTS rare_toy_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Criar usuário
CREATE USER IF NOT EXISTS 'rare_toy_user'@'localhost' IDENTIFIED BY 'RareToy2025!';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'localhost';
FLUSH PRIVILEGES;

-- Mostrar bancos
SHOW DATABASES;
EOF
    
    print_warning "Execute o seguinte comando para configurar o MySQL:"
    print_info "mysql -u root -p < /tmp/mysql_setup.sql"
    
    print_success "MySQL instalado"
}

# =============================================================================
# INSTALAÇÃO DAS DEPENDÊNCIAS DO PROJETO
# =============================================================================

install_project_dependencies() {
    print_header "📦 Instalando Dependências do Projeto"
    
    print_step "Instalando dependências do NPM"
    npm install
    
    print_success "Dependências do projeto instaladas"
}

# =============================================================================
# CONFIGURAÇÃO DO PROJETO
# =============================================================================

setup_project() {
    print_header "⚙️ Configurando Projeto"
    
    # Criar arquivo .env se não existir
    if [ ! -f .env ]; then
        print_step "Criando arquivo .env"
        cat > .env <<EOF
# Configurações do Banco de Dados
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=rare_toy_user
MYSQL_PASSWORD=RareToy2025!
MYSQL_DATABASE=rare_toy_companion

# Configurações da API
PORT=3001
NODE_ENV=production

# Configurações de Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB

# Configurações de Segurança
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Configurações do Frontend
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=MuhlStore
VITE_APP_VERSION=2.0
EOF
        print_success "Arquivo .env criado"
    else
        print_info "Arquivo .env já existe"
    fi
    
    # Criar diretórios necessários
    print_step "Criando diretórios necessários"
    mkdir -p uploads
    mkdir -p logs
    mkdir -p database/migrations
    
    print_success "Estrutura de diretórios criada"
}

# =============================================================================
# CONFIGURAÇÃO DO PM2
# =============================================================================

setup_pm2() {
    print_header "⚡ Configurando PM2"
    
    # Criar ecosystem.config.cjs se não existir
    if [ ! -f ecosystem.config.cjs ]; then
        print_step "Criando configuração do PM2"
        cat > ecosystem.config.cjs <<EOF
module.exports = {
  apps: [
    {
      name: 'web',
      script: 'npm',
      args: 'run preview:pm2',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5173
      }
    },
    {
      name: 'api',
      script: 'server.cjs',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      }
    }
  ]
};
EOF
        print_success "Configuração do PM2 criada"
    else
        print_info "Configuração do PM2 já existe"
    fi
}

# =============================================================================
# BUILD DO PROJETO
# =============================================================================

build_project() {
    print_header "🏗️ Fazendo Build do Projeto"
    
    print_step "Fazendo build do frontend"
    npm run build
    
    print_success "Build do projeto concluído"
}

# =============================================================================
# INICIALIZAÇÃO DOS SERVIÇOS
# =============================================================================

start_services() {
    print_header "🚀 Iniciando Serviços"
    
    print_step "Iniciando aplicação com PM2"
    pm2 start ecosystem.config.cjs
    pm2 save
    pm2 startup systemd -u root --hp /root
    
    print_success "Serviços iniciados com PM2"
}

# =============================================================================
# VERIFICAÇÃO FINAL
# =============================================================================

verify_installation() {
    print_header "✅ Verificando Instalação"
    
    # Verificar Node.js
    if command -v node &> /dev/null; then
        print_success "Node.js: $(node -v)"
    else
        print_error "Node.js não encontrado"
    fi
    
    # Verificar NPM
    if command -v npm &> /dev/null; then
        print_success "NPM: $(npm -v)"
    else
        print_error "NPM não encontrado"
    fi
    
    # Verificar PM2
    if command -v pm2 &> /dev/null; then
        print_success "PM2: $(pm2 -v)"
    else
        print_error "PM2 não encontrado"
    fi
    
    # Verificar Nginx
    if systemctl is-active --quiet nginx; then
        print_success "Nginx: Ativo"
    else
        print_warning "Nginx: Inativo"
    fi
    
    # Verificar MySQL
    if systemctl is-active --quiet mysql; then
        print_success "MySQL: Ativo"
    else
        print_warning "MySQL: Inativo"
    fi
    
    # Verificar PM2 processes
    print_step "Status dos processos PM2:"
    pm2 list
}

# =============================================================================
# INFORMAÇÕES FINAIS
# =============================================================================

show_final_info() {
    print_header "🎉 Instalação Concluída!"
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    🚀 MUHLSTORE v2.0                        ║"
    echo "║                                                              ║"
    echo "║              INSTALAÇÃO CONCLUÍDA COM SUCESSO!               ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_info "🌐 Aplicação disponível em:"
    print_info "   Frontend: http://localhost:5173"
    print_info "   API: http://localhost:3001"
    print_info "   Nginx: http://localhost"
    
    print_info "📋 Comandos úteis:"
    print_info "   pm2 list                    - Ver processos"
    print_info "   pm2 logs                    - Ver logs"
    print_info "   pm2 restart all             - Reiniciar tudo"
    print_info "   pm2 stop all                - Parar tudo"
    print_info "   systemctl status nginx      - Status do Nginx"
    print_info "   systemctl status mysql      - Status do MySQL"
    
    print_info "📁 Arquivos importantes:"
    print_info "   .env                        - Configurações"
    print_info "   ecosystem.config.cjs        - Configuração PM2"
    print_info "   /etc/nginx/sites-available/$NGINX_SITE - Config Nginx"
    
    print_warning "⚠️  Próximos passos:"
    print_info "   1. Configure o MySQL: mysql -u root -p < /tmp/mysql_setup.sql"
    print_info "   2. Configure SSL/TLS se necessário"
    print_info "   3. Configure backup automático"
    print_info "   4. Configure monitoramento"
    
    print_success "🎊 MuhlStore está pronto para uso!"
}

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

main() {
    print_banner
    
    # Verificações iniciais
    check_system
    check_dependencies
    
    # Instalações
    install_nodejs
    install_pm2
    install_nginx
    install_mysql
    
    # Configuração do projeto
    setup_project
    install_project_dependencies
    setup_pm2
    build_project
    
    # Inicialização
    start_services
    
    # Verificação final
    verify_installation
    show_final_info
}

# Executar função principal
main "$@"
