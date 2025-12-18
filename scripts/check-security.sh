#!/bin/bash

# =============================================================================
# Script de Verificação de Segurança - Rare Toy Companion
# =============================================================================
# 
# Este script verifica problemas de segurança comuns no projeto.
#
# USO:
#   chmod +x scripts/check-security.sh
#   ./scripts/check-security.sh
#
# =============================================================================

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
ERRORS=0
WARNINGS=0

# Funções auxiliares
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    ((ERRORS++))
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

# =============================================================================
# VERIFICAÇÕES
# =============================================================================

check_hardcoded_passwords() {
    print_header "🔍 Verificando Senhas Hardcoded"
    
    # Padrões suspeitos
    PATTERNS=(
        "password.*=.*['\"][^'\"]*['\"]"
        "PASSWORD.*=.*['\"][^'\"]*['\"]"
        "senha.*=.*['\"][^'\"]*['\"]"
    )
    
    FOUND=false
    
    for pattern in "${PATTERNS[@]}"; do
        RESULTS=$(grep -r -i -E "$pattern" \
            --include="*.js" \
            --include="*.ts" \
            --include="*.cjs" \
            --include="*.tsx" \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=dist \
            --exclude-dir=coverage \
            --exclude="*.test.*" \
            --exclude="*.spec.*" \
            --exclude=".env.example" \
            . 2>/dev/null | grep -v "process.env" | grep -v "process\['env'\]" || true)
        
        if [ -n "$RESULTS" ]; then
            print_error "Possível senha hardcoded encontrada:"
            echo "$RESULTS"
            FOUND=true
        fi
    done
    
    if [ "$FOUND" = false ]; then
        print_success "Nenhuma senha hardcoded encontrada"
    fi
}

check_env_file() {
    print_header "🔍 Verificando Arquivo .env"
    
    if [ -f .env ]; then
        # Verificar se está no .gitignore
        if grep -q "^\.env$" .gitignore 2>/dev/null; then
            print_success ".env está no .gitignore"
        else
            print_error ".env NÃO está no .gitignore!"
        fi
        
        # Verificar se está sendo rastreado pelo Git
        if git ls-files .env >/dev/null 2>&1; then
            print_error ".env está sendo rastreado pelo Git!"
        else
            print_success ".env não está sendo rastreado pelo Git"
        fi
    else
        print_warning ".env não existe (pode ser normal em novos clones)"
    fi
}

check_sensitive_files() {
    print_header "🔍 Verificando Arquivos Sensíveis"
    
    SENSITIVE_FILES=(
        ".env"
        ".env.local"
        ".env.production"
        "*.pem"
        "*.key"
        "*.p12"
        "*.pfx"
        "id_rsa"
        "id_ed25519"
        "*.crt"
    )
    
    TRACKED=false
    
    for pattern in "${SENSITIVE_FILES[@]}"; do
        if git ls-files | grep -E "$pattern" >/dev/null 2>&1; then
            print_error "Arquivo sensível rastreado pelo Git: $pattern"
            git ls-files | grep -E "$pattern"
            TRACKED=true
        fi
    done
    
    if [ "$TRACKED" = false ]; then
        print_success "Nenhum arquivo sensível está sendo rastreado"
    fi
}

check_npm_audit() {
    print_header "🔍 Verificando Vulnerabilidades NPM"
    
    if [ -f package.json ]; then
        print_warning "Executando npm audit (pode demorar)..."
        if npm audit --audit-level=moderate >/dev/null 2>&1; then
            print_success "Nenhuma vulnerabilidade crítica encontrada"
        else
            print_warning "Vulnerabilidades encontradas. Execute 'npm audit' para detalhes"
        fi
    else
        print_warning "package.json não encontrado"
    fi
}

check_dependencies() {
    print_header "🔍 Verificando Dependências"
    
    if [ -f package.json ]; then
        # Verificar se há dependências com vulnerabilidades conhecidas
        print_success "package.json encontrado"
        
        # Verificar versões antigas de pacotes críticos
        OLD_PACKAGES=$(grep -E '"express":|"react":|"mysql":' package.json | grep -E '"3\.|"16\.|"1\.' || true)
        
        if [ -n "$OLD_PACKAGES" ]; then
            print_warning "Possíveis versões antigas de pacotes críticos:"
            echo "$OLD_PACKAGES"
        else
            print_success "Versões de pacotes parecem atualizadas"
        fi
    fi
}

check_https() {
    print_header "🔍 Verificando Configurações HTTPS"
    
    # Verificar se há URLs HTTP hardcoded em produção
    HTTP_URLS=$(grep -r "http://" \
        --include="*.js" \
        --include="*.ts" \
        --include="*.tsx" \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=dist \
        . 2>/dev/null | grep -v "localhost" | grep -v "127.0.0.1" | grep -v "http://localhost" || true)
    
    if [ -n "$HTTP_URLS" ]; then
        print_warning "URLs HTTP encontradas (exceto localhost):"
        echo "$HTTP_URLS" | head -5
    else
        print_success "Nenhuma URL HTTP suspeita encontrada"
    fi
}

check_secrets_in_code() {
    print_header "🔍 Verificando Secrets no Código"
    
    SECRET_PATTERNS=(
        "api[_-]?key.*=.*['\"][^'\"]*['\"]"
        "apikey.*=.*['\"][^'\"]*['\"]"
        "secret.*=.*['\"][^'\"]*['\"]"
        "SECRET.*=.*['\"][^'\"]*['\"]"
        "token.*=.*['\"][^'\"]*['\"]"
        "TOKEN.*=.*['\"][^'\"]*['\"]"
    )
    
    FOUND=false
    
    for pattern in "${SECRET_PATTERNS[@]}"; do
        RESULTS=$(grep -r -i -E "$pattern" \
            --include="*.js" \
            --include="*.ts" \
            --include="*.cjs" \
            --exclude-dir=node_modules \
            --exclude-dir=.git \
            --exclude-dir=dist \
            --exclude="*.test.*" \
            --exclude="*.spec.*" \
            --exclude=".env.example" \
            . 2>/dev/null | grep -v "process.env" | grep -v "process\['env'\]" || true)
        
        if [ -n "$RESULTS" ]; then
            print_error "Possível secret hardcoded encontrado:"
            echo "$RESULTS" | head -3
            FOUND=true
        fi
    done
    
    if [ "$FOUND" = false ]; then
        print_success "Nenhum secret hardcoded encontrado"
    fi
}

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

main() {
    print_header "🔒 Verificação de Segurança - Rare Toy Companion"
    
    echo "Iniciando verificações..."
    echo ""
    
    # Executar todas as verificações
    check_hardcoded_passwords
    check_env_file
    check_sensitive_files
    check_npm_audit
    check_dependencies
    check_https
    check_secrets_in_code
    
    # Resumo final
    print_header "📊 Resumo"
    
    echo "Erros encontrados: $ERRORS"
    echo "Avisos: $WARNINGS"
    echo ""
    
    if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
        print_success "Nenhum problema de segurança encontrado!"
        exit 0
    elif [ $ERRORS -eq 0 ]; then
        print_warning "Alguns avisos, mas sem erros críticos"
        exit 0
    else
        print_error "Problemas de segurança encontrados! Corrija antes de fazer deploy."
        exit 1
    fi
}

# Executar
main

