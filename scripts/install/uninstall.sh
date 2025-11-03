#!/bin/bash

###############################################################################
# MuhlStore - Script de Desinstalação
# Remove completamente a aplicação do servidor
###############################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Verificar root
if [[ $EUID -ne 0 ]]; then
    print_error "Este script precisa ser executado como root (sudo)"
    exit 1
fi

# Detectar usuário
if [ -n "$SUDO_USER" ]; then
    REAL_USER=$SUDO_USER
else
    REAL_USER=$(whoami)
fi

REAL_HOME=$(eval echo ~$REAL_USER)

clear

cat << "EOF"

    ███╗   ███╗██╗   ██╗██╗  ██╗██╗     ███████╗████████╗ ██████╗ ██████╗ ███████╗
    ████╗ ████║██║   ██║██║  ██║██║     ██╔════╝╚══██╔══╝██╔═══██╗██╔══██╗██╔════╝
    ██╔████╔██║██║   ██║███████║██║     ███████╗   ██║   ██║   ██║██████╔╝█████╗  
    ██║╚██╔╝██║██║   ██║██╔══██║██║     ╚════██║   ██║   ██║   ██║██╔══██╗██╔══╝  
    ██║ ╚═╝ ██║╚██████╔╝██║  ██║███████╗███████║   ██║   ╚██████╔╝██║  ██║███████╗
    ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝╚══════╝

                        🗑️  Script de Desinstalação

EOF

print_warning "ATENÇÃO: Este script irá remover COMPLETAMENTE a MuhlStore do servidor!"
echo ""
echo "O que será removido:"
echo "  • Processos PM2"
echo "  • Configuração do Nginx"
echo "  • Certificado SSL"
echo "  • Container MySQL (se Docker)"
echo "  • Arquivos do projeto"
echo ""
print_error "Esta ação NÃO pode ser desfeita!"
echo ""

read -p "Deseja criar um backup antes de desinstalar? [S/n]: " create_backup
create_backup=${create_backup:-S}

if [[ "$create_backup" =~ ^[Ss]$ ]]; then
    read -p "Digite o diretório do projeto [/var/www/muhlstore]: " install_dir
    install_dir=${install_dir:-/var/www/muhlstore}
    
    if [ -d "$install_dir" ]; then
        print_header "Criando Backup Final"
        
        BACKUP_DIR="$REAL_HOME/muhlstore-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Backup do código
        print_info "Copiando arquivos do projeto..."
        cp -r "$install_dir" "$BACKUP_DIR/project"
        
        # Backup do banco (Docker)
        if docker ps | grep -q muhlstore-mysql; then
            print_info "Fazendo backup do banco de dados..."
            docker exec muhlstore-mysql mysqldump -u root --all-databases > "$BACKUP_DIR/mysql_backup.sql" 2>/dev/null || true
        fi
        
        # Backup das configurações
        print_info "Copiando configurações..."
        cp /etc/nginx/sites-available/muhlstore "$BACKUP_DIR/nginx-config" 2>/dev/null || true
        
        chown -R $REAL_USER:$REAL_USER "$BACKUP_DIR"
        
        print_success "Backup criado em: $BACKUP_DIR"
        echo ""
    fi
fi

echo ""
print_error "ÚLTIMA CONFIRMAÇÃO!"
read -p "Digite 'DESINSTALAR' para confirmar: " confirmation

if [ "$confirmation" != "DESINSTALAR" ]; then
    print_warning "Desinstalação cancelada"
    exit 0
fi

# Parar processos PM2
print_header "Parando Processos PM2"
sudo -u $REAL_USER bash -c '
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    pm2 delete all 2>/dev/null || true
    pm2 save --force 2>/dev/null || true
' 2>/dev/null || true
print_success "Processos PM2 parados"

# Remover startup do PM2
print_header "Removendo Startup do PM2"
sudo -u $REAL_USER bash -c '
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    pm2 unstartup systemd 2>/dev/null || true
' 2>/dev/null || true
print_success "Startup do PM2 removido"

# Parar e remover container MySQL (Docker)
print_header "Removendo MySQL (Docker)"
if docker ps -a | grep -q muhlstore-mysql; then
    docker stop muhlstore-mysql 2>/dev/null || true
    docker rm muhlstore-mysql 2>/dev/null || true
    docker volume rm rare-toy-companion-final-8040_mysql_data 2>/dev/null || true
    print_success "Container MySQL removido"
else
    print_warning "Container MySQL não encontrado (pode ser instalação nativa)"
fi

# Remover configuração do Nginx
print_header "Removendo Configuração do Nginx"
rm -f /etc/nginx/sites-enabled/muhlstore
rm -f /etc/nginx/sites-available/muhlstore
systemctl reload nginx 2>/dev/null || true
print_success "Configuração do Nginx removida"

# Remover certificado SSL
print_header "Removendo Certificado SSL"
read -p "Digite o domínio usado (ex: muhlstore.com.br) ou deixe em branco para pular: " domain
if [ -n "$domain" ]; then
    certbot delete --cert-name $domain --non-interactive 2>/dev/null || true
    print_success "Certificado SSL removido"
else
    print_warning "Remoção do certificado SSL pulada"
fi

# Remover cron de backup
print_header "Removendo Agendamento de Backup"
crontab -u $REAL_USER -l 2>/dev/null | grep -v "muhlstore" | crontab -u $REAL_USER - 2>/dev/null || true
print_success "Cron de backup removido"

# Remover arquivos do projeto
print_header "Removendo Arquivos do Projeto"
read -p "Digite o diretório do projeto [/var/www/muhlstore]: " install_dir
install_dir=${install_dir:-/var/www/muhlstore}

if [ -d "$install_dir" ]; then
    rm -rf "$install_dir"
    print_success "Arquivos do projeto removidos"
else
    print_warning "Diretório do projeto não encontrado: $install_dir"
fi

# Limpeza final
print_header "Limpeza Final"

read -p "Deseja remover Node.js (NVM)? [s/N]: " remove_node
if [[ "$remove_node" =~ ^[Ss]$ ]]; then
    sudo -u $REAL_USER bash -c 'rm -rf $HOME/.nvm' 2>/dev/null || true
    print_success "Node.js (NVM) removido"
else
    print_warning "Node.js (NVM) mantido"
fi

read -p "Deseja remover Docker? [s/N]: " remove_docker
if [[ "$remove_docker" =~ ^[Ss]$ ]]; then
    apt-get purge -y docker-ce docker-ce-cli containerd.io docker-compose 2>/dev/null || \
    yum remove -y docker-ce docker-ce-cli containerd.io docker-compose 2>/dev/null || true
    rm -rf /var/lib/docker
    print_success "Docker removido"
else
    print_warning "Docker mantido"
fi

read -p "Deseja remover Nginx? [s/N]: " remove_nginx
if [[ "$remove_nginx" =~ ^[Ss]$ ]]; then
    systemctl stop nginx
    apt-get purge -y nginx nginx-common 2>/dev/null || \
    yum remove -y nginx 2>/dev/null || true
    rm -rf /etc/nginx
    print_success "Nginx removido"
else
    print_warning "Nginx mantido"
fi

# Resumo
print_header "DESINSTALAÇÃO CONCLUÍDA"

echo -e "${GREEN}A MuhlStore foi removida com sucesso!${NC}\n"

if [[ "$create_backup" =~ ^[Ss]$ ]] && [ -n "$BACKUP_DIR" ]; then
    echo -e "${BLUE}📦 Backup salvo em:${NC}"
    echo -e "   ${GREEN}$BACKUP_DIR${NC}\n"
fi

echo -e "${YELLOW}Componentes removidos:${NC}"
echo -e "   ✓ Processos PM2"
echo -e "   ✓ Configuração Nginx"
echo -e "   ✓ Certificado SSL"
echo -e "   ✓ Container MySQL (Docker)"
echo -e "   ✓ Arquivos do projeto"
echo -e "   ✓ Cron de backup"
echo ""

if [[ ! "$remove_node" =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}ℹ  Node.js (NVM) ainda está instalado em:${NC}"
    echo -e "   $REAL_HOME/.nvm"
    echo ""
fi

if [[ ! "$remove_docker" =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}ℹ  Docker ainda está instalado${NC}"
    echo ""
fi

if [[ ! "$remove_nginx" =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}ℹ  Nginx ainda está instalado${NC}"
    echo ""
fi

print_success "Desinstalação concluída!"

