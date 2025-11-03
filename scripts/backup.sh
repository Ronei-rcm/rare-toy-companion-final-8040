#!/bin/bash

# =============================================================================
# 🗄️ MUHLSTORE - SISTEMA DE BACKUP AUTOMÁTICO
# =============================================================================
# Data: Outubro 2025
# Versão: 2.0
# Autor: Sistema de Backup Automático
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="MuhlStore"
BACKUP_DIR="/backups/muhlstore"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Configurações do banco
DB_HOST="127.0.0.1"
DB_PORT="3306"
DB_NAME="rare_toy_companion"
DB_USER="rare_toy_user"
DB_PASS="RareToy2025!"

# Configurações do projeto
PROJECT_DIR="/home/git-muhlstore/rare-toy-companion-final-8040"
UPLOAD_DIR="$PROJECT_DIR/uploads"
LOG_DIR="$PROJECT_DIR/logs"

# =============================================================================
# FUNÇÕES DE UTILIDADE
# =============================================================================

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    🗄️ MUHLSTORE BACKUP                      ║"
    echo "║                                                              ║"
    echo "║              SISTEMA DE BACKUP AUTOMÁTICO                   ║"
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
    echo -e "\n${YELLOW}▶ $1${NC}"
}

# =============================================================================
# VERIFICAÇÕES INICIAIS
# =============================================================================

check_dependencies() {
    print_header "🔍 Verificando Dependências"
    
    local missing_deps=()
    
    # Verificar comandos essenciais
    for cmd in mysqldump tar gzip find; do
        if ! command -v $cmd &> /dev/null; then
            missing_deps+=($cmd)
        fi
    done
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Dependências faltando: ${missing_deps[*]}"
        print_info "Instale as dependências necessárias e tente novamente"
        exit 1
    fi
    
    print_success "Todas as dependências estão disponíveis"
}

check_directories() {
    print_header "📁 Verificando Diretórios"
    
    # Criar diretório de backup se não existir
    if [ ! -d "$BACKUP_DIR" ]; then
        print_step "Criando diretório de backup"
        sudo mkdir -p "$BACKUP_DIR"
        sudo chown $(whoami):$(whoami) "$BACKUP_DIR"
        print_success "Diretório de backup criado: $BACKUP_DIR"
    fi
    
    # Verificar diretório do projeto
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Diretório do projeto não encontrado: $PROJECT_DIR"
        exit 1
    fi
    
    print_success "Diretórios verificados"
}

# =============================================================================
# BACKUP DO BANCO DE DADOS
# =============================================================================

backup_database() {
    print_header "🗄️ Backup do Banco de Dados"
    
    local db_backup_file="$BACKUP_DIR/database_${DATE}.sql"
    
    print_step "Fazendo backup do banco de dados"
    
    # Fazer backup do banco
    mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASS" \
        --single-transaction \
        --routines \
        --triggers \
        --events \
        --add-drop-database \
        --databases "$DB_NAME" > "$db_backup_file"
    
    if [ $? -eq 0 ]; then
        print_success "Backup do banco criado: $db_backup_file"
        
        # Comprimir backup do banco
        print_step "Comprimindo backup do banco"
        gzip "$db_backup_file"
        print_success "Backup do banco comprimido: ${db_backup_file}.gz"
    else
        print_error "Erro ao fazer backup do banco de dados"
        return 1
    fi
}

# =============================================================================
# BACKUP DOS ARQUIVOS
# =============================================================================

backup_files() {
    print_header "📁 Backup dos Arquivos"
    
    local files_backup_file="$BACKUP_DIR/files_${DATE}.tar.gz"
    
    print_step "Fazendo backup dos arquivos"
    
    # Criar backup dos arquivos importantes
    tar -czf "$files_backup_file" \
        -C "$PROJECT_DIR" \
        --exclude="node_modules" \
        --exclude=".git" \
        --exclude="*.log" \
        --exclude=".env" \
        --exclude="uploads/temp" \
        .
    
    if [ $? -eq 0 ]; then
        print_success "Backup dos arquivos criado: $files_backup_file"
    else
        print_error "Erro ao fazer backup dos arquivos"
        return 1
    fi
}

# =============================================================================
# BACKUP DOS UPLOADS
# =============================================================================

backup_uploads() {
    print_header "🖼️ Backup dos Uploads"
    
    if [ -d "$UPLOAD_DIR" ] && [ "$(ls -A $UPLOAD_DIR)" ]; then
        local uploads_backup_file="$BACKUP_DIR/uploads_${DATE}.tar.gz"
        
        print_step "Fazendo backup dos uploads"
        
        tar -czf "$uploads_backup_file" -C "$PROJECT_DIR" uploads/
        
        if [ $? -eq 0 ]; then
            print_success "Backup dos uploads criado: $uploads_backup_file"
        else
            print_warning "Erro ao fazer backup dos uploads"
        fi
    else
        print_info "Diretório de uploads vazio ou não existe"
    fi
}

# =============================================================================
# BACKUP DAS CONFIGURAÇÕES
# =============================================================================

backup_configs() {
    print_header "⚙️ Backup das Configurações"
    
    local configs_backup_file="$BACKUP_DIR/configs_${DATE}.tar.gz"
    
    print_step "Fazendo backup das configurações"
    
    # Backup de arquivos de configuração importantes
    tar -czf "$configs_backup_file" \
        -C "$PROJECT_DIR" \
        .env \
        ecosystem.config.cjs \
        package.json \
        package-lock.json \
        tsconfig.json \
        tailwind.config.js \
        vite.config.ts \
        nginx.conf 2>/dev/null || true
    
    if [ $? -eq 0 ]; then
        print_success "Backup das configurações criado: $configs_backup_file"
    else
        print_warning "Erro ao fazer backup das configurações"
    fi
}

# =============================================================================
# LIMPEZA DE BACKUPS ANTIGOS
# =============================================================================

cleanup_old_backups() {
    print_header "🧹 Limpeza de Backups Antigos"
    
    print_step "Removendo backups com mais de $RETENTION_DAYS dias"
    
    # Remover backups antigos
    find "$BACKUP_DIR" -name "*.gz" -type f -mtime +$RETENTION_DAYS -delete
    
    local remaining_backups=$(find "$BACKUP_DIR" -name "*.gz" -type f | wc -l)
    print_success "Limpeza concluída. $remaining_backups backups restantes"
}

# =============================================================================
# VERIFICAÇÃO DE INTEGRIDADE
# =============================================================================

verify_backups() {
    print_header "✅ Verificação de Integridade"
    
    local backup_files=($(find "$BACKUP_DIR" -name "*_${DATE}*" -type f))
    
    for backup_file in "${backup_files[@]}"; do
        if [ -f "$backup_file" ]; then
            local file_size=$(du -h "$backup_file" | cut -f1)
            print_success "✓ $(basename $backup_file): $file_size"
        else
            print_error "✗ $(basename $backup_file): Arquivo não encontrado"
  fi
done
}

# =============================================================================
# RELATÓRIO FINAL
# =============================================================================

generate_report() {
    print_header "📊 Relatório de Backup"
    
    local total_size=$(du -sh "$BACKUP_DIR" | cut -f1)
    local backup_count=$(find "$BACKUP_DIR" -name "*.gz" -type f | wc -l)
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    🗄️ BACKUP CONCLUÍDO                      ║"
    echo "║                                                              ║"
    echo "║              Data: $(date '+%d/%m/%Y %H:%M:%S')                           ║"
    echo "║                                                              ║"
    echo "║              Total de backups: $backup_count                           ║"
    echo "║              Tamanho total: $total_size                           ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_info "📁 Local dos backups: $BACKUP_DIR"
    print_info "🗓️ Retenção: $RETENTION_DAYS dias"
    print_info "🔄 Próximo backup automático: Amanhã às $(date -d '+1 day' '+%H:%M')"
}

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

main() {
    print_banner
    
    # Verificações iniciais
    check_dependencies
    check_directories
    
    # Executar backups
    backup_database
    backup_files
    backup_uploads
    backup_configs
    
    # Limpeza e verificação
    cleanup_old_backups
    verify_backups
    
    # Relatório final
    generate_report
}

# =============================================================================
# EXECUÇÃO
# =============================================================================

# Verificar se foi chamado com argumentos
case "${1:-}" in
    --help|-h)
        echo "Uso: $0 [opções]"
        echo ""
        echo "Opções:"
        echo "  --help, -h     Mostra esta ajuda"
        echo "  --database     Faz apenas backup do banco de dados"
        echo "  --files        Faz apenas backup dos arquivos"
        echo "  --uploads      Faz apenas backup dos uploads"
        echo "  --configs      Faz apenas backup das configurações"
        echo "  --cleanup      Apenas limpa backups antigos"
        echo ""
        exit 0
        ;;
    --database)
        print_banner
        check_dependencies
        check_directories
        backup_database
        verify_backups
        ;;
    --files)
        print_banner
        check_dependencies
        check_directories
        backup_files
        verify_backups
        ;;
    --uploads)
        print_banner
        check_dependencies
        check_directories
        backup_uploads
        verify_backups
        ;;
    --configs)
        print_banner
        check_dependencies
        check_directories
        backup_configs
        verify_backups
        ;;
    --cleanup)
        print_banner
        check_directories
        cleanup_old_backups
        ;;
    *)
        main
        ;;
esac