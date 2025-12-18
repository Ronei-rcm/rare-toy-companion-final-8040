#!/bin/bash

# =============================================================================
# Script de Rotação de Senhas - Rare Toy Companion
# =============================================================================
# 
# Este script ajuda a rotacionar senhas do MySQL após remoção de senhas
# hardcoded do código.
#
# USO:
#   chmod +x scripts/rotate-passwords.sh
#   ./scripts/rotate-passwords.sh
#
# =============================================================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funções auxiliares
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

main() {
    print_header "🔒 Rotação de Senhas do MySQL"
    
    # Verificar se .env existe
    if [ ! -f .env ]; then
        print_error ".env não encontrado!"
        print_step "Criando .env a partir de env.example..."
        cp env.example .env
        print_warning "Por favor, edite o .env com suas configurações antes de continuar"
        exit 1
    fi
    
    # Carregar variáveis do .env
    source .env
    
    # Verificar se variáveis necessárias existem
    if [ -z "$MYSQL_HOST" ] || [ -z "$MYSQL_USER" ] || [ -z "$MYSQL_DATABASE" ]; then
        print_error "Variáveis MYSQL_HOST, MYSQL_USER ou MYSQL_DATABASE não encontradas no .env"
        exit 1
    fi
    
    print_step "Configurações carregadas:"
    echo "  Host: $MYSQL_HOST"
    echo "  Usuário: $MYSQL_USER"
    echo "  Database: $MYSQL_DATABASE"
    echo ""
    
    # Solicitar senha atual
    echo -n "Digite a senha ATUAL do MySQL (root ou $MYSQL_USER): "
    read -s CURRENT_PASSWORD
    echo ""
    
    # Testar conexão
    print_step "Testando conexão..."
    if mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$CURRENT_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
        print_success "Conexão estabelecida com sucesso!"
    else
        print_error "Falha ao conectar ao MySQL. Verifique as credenciais."
        exit 1
    fi
    
    # Gerar nova senha
    print_step "Gerando nova senha forte..."
    NEW_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    NEW_PASSWORD_ROOT=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
    
    print_success "Novas senhas geradas:"
    echo ""
    echo -e "${GREEN}Senha para usuário '$MYSQL_USER':${NC}"
    echo "  $NEW_PASSWORD"
    echo ""
    echo -e "${GREEN}Senha para root:${NC}"
    echo "  $NEW_PASSWORD_ROOT"
    echo ""
    
    # Confirmar
    print_warning "Você está prestes a alterar as senhas do MySQL!"
    echo -n "Deseja continuar? (sim/não): "
    read CONFIRM
    
    if [ "$CONFIRM" != "sim" ] && [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "yes" ] && [ "$CONFIRM" != "y" ]; then
        print_error "Operação cancelada."
        exit 0
    fi
    
    # Rotacionar senha do usuário principal
    print_step "Rotacionando senha do usuário '$MYSQL_USER'..."
    if mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$CURRENT_PASSWORD" -e "ALTER USER '$MYSQL_USER'@'%' IDENTIFIED BY '$NEW_PASSWORD';" 2>/dev/null || \
       mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$CURRENT_PASSWORD" -e "ALTER USER '$MYSQL_USER'@'localhost' IDENTIFIED BY '$NEW_PASSWORD';" 2>/dev/null; then
        print_success "Senha do usuário '$MYSQL_USER' alterada com sucesso!"
    else
        print_warning "Não foi possível alterar senha do usuário '$MYSQL_USER' (pode não existir ou não ter permissões)"
    fi
    
    # Rotacionar senha do root (se tiver permissões)
    print_step "Tentando rotacionar senha do root..."
    if mysql -h "$MYSQL_HOST" -u root -p"$CURRENT_PASSWORD" -e "ALTER USER 'root'@'localhost' IDENTIFIED BY '$NEW_PASSWORD_ROOT';" 2>/dev/null; then
        print_success "Senha do root alterada com sucesso!"
    else
        print_warning "Não foi possível alterar senha do root (pode não ter permissões ou ser diferente)"
    fi
    
    # Testar nova senha
    print_step "Testando nova senha..."
    if mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$NEW_PASSWORD" -e "SELECT 1" > /dev/null 2>&1; then
        print_success "Nova senha funciona corretamente!"
    else
        print_error "A nova senha não funcionou! Pode haver um problema."
        exit 1
    fi
    
    # Atualizar .env
    print_step "Atualizando arquivo .env..."
    
    # Backup do .env
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup do .env criado"
    
    # Atualizar senha no .env
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$NEW_PASSWORD/" .env
        sed -i '' "s/MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$NEW_PASSWORD_ROOT/" .env
    else
        # Linux
        sed -i "s/MYSQL_PASSWORD=.*/MYSQL_PASSWORD=$NEW_PASSWORD/" .env
        sed -i "s/MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$NEW_PASSWORD_ROOT/" .env
    fi
    
    print_success ".env atualizado com as novas senhas"
    
    # Salvar senhas em arquivo temporário seguro (com permissões restritas)
    PASSWORDS_FILE=".passwords_rotated_$(date +%Y%m%d_%H%M%S).txt"
    echo "Senhas rotacionadas em $(date)" > "$PASSWORDS_FILE"
    echo "" >> "$PASSWORDS_FILE"
    echo "MYSQL_USER ($MYSQL_USER): $NEW_PASSWORD" >> "$PASSWORDS_FILE"
    echo "MYSQL_ROOT: $NEW_PASSWORD_ROOT" >> "$PASSWORDS_FILE"
    chmod 600 "$PASSWORDS_FILE"
    
    print_warning "Senhas salvas temporariamente em: $PASSWORDS_FILE"
    print_warning "Este arquivo tem permissões restritas (600). APAGUE após anotar as senhas!"
    
    # Instruções finais
    print_header "✅ Rotação Concluída!"
    
    echo "Próximos passos:"
    echo ""
    echo "1. 📝 Anote as senhas acima (ou do arquivo $PASSWORDS_FILE)"
    echo "2. 🗑️  DELETE o arquivo $PASSWORDS_FILE após anotar"
    echo "3. 🔄 Reinicie os serviços:"
    echo "   pm2 restart all"
    echo ""
    echo "4. ✅ Teste a aplicação:"
    echo "   npm run mysql:test"
    echo ""
    echo "5. 🔒 Verifique que .env está no .gitignore:"
    echo "   grep .env .gitignore"
    echo ""
    
    print_success "Rotação de senhas concluída com sucesso!"
}

# Executar função principal
main

