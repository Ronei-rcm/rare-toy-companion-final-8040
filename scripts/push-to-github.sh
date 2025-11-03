#!/bin/bash

# Script para fazer push do projeto para GitHub
# Uso: ./scripts/push-to-github.sh

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║          🚀 PUSH DO PROJETO PARA GITHUB                      ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar se já existe remote origin
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}⚠️  Remote 'origin' já existe!${NC}"
    echo ""
    git remote -v
    echo ""
    read -p "Deseja remover e adicionar novamente? (s/N): " resposta
    if [[ $resposta =~ ^[Ss]$ ]]; then
        git remote remove origin
        echo -e "${GREEN}✅ Remote 'origin' removido${NC}"
    else
        echo -e "${BLUE}ℹ️  Usando remote existente${NC}"
    fi
fi

# Adicionar remote se não existir
if ! git remote | grep -q "^origin$"; then
    echo ""
    echo -e "${BLUE}📝 Digite a URL do seu repositório GitHub:${NC}"
    echo "   Exemplo: https://github.com/roneinetslim/rare-toy-companion.git"
    echo ""
    read -p "URL: " repo_url
    
    if [ -z "$repo_url" ]; then
        echo -e "${RED}❌ URL não pode estar vazia!${NC}"
        exit 1
    fi
    
    git remote add origin "$repo_url"
    echo -e "${GREEN}✅ Remote 'origin' adicionado${NC}"
fi

# Mostrar remote configurado
echo ""
echo -e "${BLUE}📡 Remote configurado:${NC}"
git remote -v
echo ""

# Verificar branch atual
BRANCH=$(git branch --show-current)
echo -e "${BLUE}📍 Branch atual: ${BRANCH}${NC}"
echo ""

# Fazer push
echo -e "${YELLOW}🔄 Fazendo push para GitHub...${NC}"
echo ""
echo -e "${RED}⚠️  ATENÇÃO:${NC}"
echo "   - Username: ${YELLOW}roneinetslim${NC}"
echo "   - Password: ${RED}USE O TOKEN (não a senha!)${NC}"
echo "   - O token começa com: ${YELLOW}ghp_...${NC}"
echo ""
read -p "Pressione ENTER para continuar..."

# Fazer push
if git push -u origin "$BRANCH"; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║                                                               ║"
    echo "║               ✅ PUSH REALIZADO COM SUCESSO! 🎉              ║"
    echo "║                                                               ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
    echo -e "${GREEN}✅ Seu projeto está no GitHub!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Acesse seu repositório:${NC}"
    REPO_URL=$(git remote get-url origin)
    REPO_WEB_URL=${REPO_URL%.git}
    echo "   ${REPO_WEB_URL}"
    echo ""
    echo -e "${BLUE}📚 Próximos passos:${NC}"
    echo "   1. Acesse o repositório no navegador"
    echo "   2. Configure descrição e topics"
    echo "   3. Crie uma release v1.0.0"
    echo "   4. Compartilhe com sua equipe!"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Erro ao fazer push!${NC}"
    echo ""
    echo -e "${YELLOW}Possíveis causas:${NC}"
    echo "   1. Token inválido ou expirado"
    echo "   2. URL do repositório incorreta"
    echo "   3. Sem permissão no repositório"
    echo ""
    echo -e "${BLUE}📖 Consulte o guia completo:${NC}"
    echo "   cat GUIA_GITHUB.md"
    echo ""
    exit 1
fi

# Salvar credenciais (opcional)
echo ""
read -p "Deseja salvar o token para não precisar digitar novamente? (s/N): " save_creds
if [[ $save_creds =~ ^[Ss]$ ]]; then
    git config --global credential.helper store
    echo -e "${GREEN}✅ Credenciais serão salvas no próximo push${NC}"
    echo -e "${YELLOW}⚠️  Token será salvo em: ~/.git-credentials${NC}"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}            🚀 Projeto no GitHub com sucesso! 🚀${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

