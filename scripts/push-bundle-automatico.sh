#!/bin/bash
#
# Script Automático para Push via Bundle
# Uso: Execute este script na sua máquina LOCAL (não no servidor)
#

# =======================
# CONFIGURAÇÕES (AJUSTE AQUI)
# =======================
BUNDLE_PATH=~/Downloads/projeto-github-bundle.git
WORK_DIR=~/Desktop/github-push-temp
REPO_URL=https://github.com/Ronei-rcm/rare-toy-companion.git

# =======================
# CORES PARA OUTPUT
# =======================
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# =======================
# FUNÇÕES
# =======================
print_step() {
    echo -e "\n${BLUE}▶ $1${NC}"
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

# =======================
# INÍCIO DO SCRIPT
# =======================
clear
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════╗"
echo "║   🚀 Push Automático para GitHub          ║"
echo "║   📦 Via Git Bundle                        ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}\n"

# Verificar se o bundle existe
print_step "Verificando se o bundle foi baixado..."
if [ ! -f "$BUNDLE_PATH" ]; then
    print_error "Bundle não encontrado em: $BUNDLE_PATH"
    echo ""
    echo "Por favor, baixe o arquivo primeiro usando:"
    echo "  scp root@172.16.0.15:/root/projeto-github-bundle.git ~/Downloads/"
    echo ""
    exit 1
fi
print_success "Bundle encontrado! ($(du -h "$BUNDLE_PATH" | cut -f1))"

# Verificar se git está instalado
print_step "Verificando instalação do Git..."
if ! command -v git &> /dev/null; then
    print_error "Git não está instalado!"
    echo "Instale em: https://git-scm.com/downloads"
    exit 1
fi
print_success "Git instalado: $(git --version)"

# Criar diretório de trabalho
print_step "Preparando ambiente de trabalho..."
mkdir -p "$WORK_DIR"
cd "$WORK_DIR" || exit 1
print_success "Diretório criado: $WORK_DIR"

# Verificar integridade do bundle
print_step "Verificando integridade do bundle..."
if git bundle verify "$BUNDLE_PATH" > /dev/null 2>&1; then
    print_success "Bundle está íntegro e válido!"
else
    print_error "Bundle está corrompido!"
    echo "Tente baixar o arquivo novamente."
    exit 1
fi

# Clone ou atualiza o repositório
print_step "Preparando repositório..."
if [ -d "rare-toy-companion" ]; then
    print_warning "Repositório já existe. Atualizando..."
    cd rare-toy-companion || exit 1
    git fetch origin
    git checkout master
else
    print_step "Clonando repositório do GitHub..."
    if git clone "$REPO_URL"; then
        print_success "Repositório clonado!"
        cd rare-toy-companion || exit 1
    else
        print_error "Falha ao clonar repositório!"
        exit 1
    fi
fi

# Mostrar status atual
print_step "Status atual do repositório..."
echo "Último commit local:"
git log -1 --oneline
echo ""
echo "Último commit remoto:"
git log origin/master -1 --oneline

# Aplicar o bundle
print_step "Aplicando bundle..."
if git fetch "$BUNDLE_PATH" master:temp-bundle; then
    print_success "Bundle aplicado com sucesso!"
else
    print_error "Falha ao aplicar bundle!"
    exit 1
fi

# Mostrar diferenças
print_step "Commits que serão enviados ao GitHub:"
echo -e "${YELLOW}"
git log origin/master..temp-bundle --oneline --graph
echo -e "${NC}"

# Perguntar confirmação
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
read -p "Deseja continuar com o push? (s/N) " -n 1 -r
echo
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
    print_warning "Push cancelado pelo usuário."
    exit 0
fi

# Fazer merge
print_step "Fazendo merge do bundle..."
git checkout master
if git merge temp-bundle -m "Merge from server bundle"; then
    print_success "Merge concluído!"
else
    print_error "Falha no merge!"
    echo "Pode haver conflitos. Resolva manualmente e execute:"
    echo "  git push origin master"
    exit 1
fi

# Push para GitHub
print_step "Enviando para o GitHub..."
if git push origin master; then
    print_success "Push concluído com sucesso!"
else
    print_error "Falha no push!"
    echo ""
    print_warning "Possíveis causas:"
    echo "  1. Credenciais inválidas"
    echo "  2. Sem permissão no repositório"
    echo "  3. Precisa usar token de acesso pessoal"
    echo ""
    echo "Configure suas credenciais:"
    echo "  git config --global user.name \"Seu Nome\""
    echo "  git config --global user.email \"seu@email.com\""
    echo ""
    echo "Crie um token em: https://github.com/settings/tokens"
    exit 1
fi

# Limpeza
print_step "Limpando arquivos temporários..."
git branch -D temp-bundle 2>/dev/null
print_success "Limpeza concluída!"

# Sucesso final
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════╗"
echo "║   🎉 PUSH CONCLUÍDO COM SUCESSO!          ║"
echo "╚════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📊 Resumo:${NC}"
echo "  ✅ Bundle verificado e aplicado"
echo "  ✅ Commits enviados ao GitHub"
echo "  ✅ Repositório atualizado"
echo ""
echo -e "${BLUE}🔗 Confira em:${NC}"
echo "  https://github.com/Ronei-rcm/rare-toy-companion"
echo ""
echo -e "${GREEN}🚀 Seu projeto está no GitHub!${NC}\n"

