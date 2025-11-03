#!/bin/bash

# Script de limpeza do projeto MuhlStore
# Uso: bash scripts/cleanup.sh

echo "🧹 Iniciando limpeza do projeto..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Contador
total_freed=0

# Função para converter bytes em formato legível
human_readable() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(($bytes / 1024))KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$(($bytes / 1048576))MB"
    else
        echo "$(($bytes / 1073741824))GB"
    fi
}

# 1. Limpar logs antigos (manter últimos 7 dias)
echo -e "${YELLOW}📄 Limpando logs antigos...${NC}"
if [ -d "logs" ]; then
    before=$(du -sb logs/ 2>/dev/null | cut -f1)
    find logs/ -type f -name "*.log" -mtime +7 -delete 2>/dev/null
    after=$(du -sb logs/ 2>/dev/null | cut -f1)
    freed=$((before - after))
    total_freed=$((total_freed + freed))
    echo -e "${GREEN}✓ Logs limpos: $(human_readable $freed)${NC}"
else
    echo -e "${YELLOW}⚠ Diretório logs/ não encontrado${NC}"
fi

# 2. Limpar cache do npm
echo -e "${YELLOW}📦 Limpando cache do npm...${NC}"
npm cache clean --force 2>/dev/null
echo -e "${GREEN}✓ Cache npm limpo${NC}"

# 3. Limpar node_modules órfãos (se houver)
echo -e "${YELLOW}🗑️  Verificando node_modules...${NC}"
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ node_modules presente (não removido)${NC}"
else
    echo -e "${YELLOW}⚠ node_modules não encontrado${NC}"
fi

# 4. Limpar arquivos temporários
echo -e "${YELLOW}🗑️  Removendo arquivos temporários...${NC}"
before=$(du -sb . 2>/dev/null | cut -f1)
find . -type f \( -name "*.tmp" -o -name "*.temp" -o -name "*~" -o -name ".DS_Store" -o -name "Thumbs.db" \) -delete 2>/dev/null
after=$(du -sb . 2>/dev/null | cut -f1)
freed=$((before - after))
total_freed=$((total_freed + freed))
echo -e "${GREEN}✓ Temporários removidos: $(human_readable $freed)${NC}"

# 5. Limpar build antigo
echo -e "${YELLOW}🏗️  Verificando builds antigos...${NC}"
if [ -d "dist" ]; then
    echo -e "${GREEN}✓ Build atual presente (não removido)${NC}"
else
    echo -e "${YELLOW}⚠ Build não encontrado (execute npm run build)${NC}"
fi

# 6. Limpar backups antigos (manter últimos 5)
echo -e "${YELLOW}💾 Organizando backups...${NC}"
if [ -d "backups" ]; then
    backup_count=$(find backups/ -name "*.zip" 2>/dev/null | wc -l)
    if [ $backup_count -gt 5 ]; then
        before=$(du -sb backups/ 2>/dev/null | cut -f1)
        ls -t backups/*.zip 2>/dev/null | tail -n +6 | xargs rm -f
        after=$(du -sb backups/ 2>/dev/null | cut -f1)
        freed=$((before - after))
        total_freed=$((total_freed + freed))
        echo -e "${GREEN}✓ Backups antigos removidos: $(human_readable $freed)${NC}"
    else
        echo -e "${GREEN}✓ Backups OK ($backup_count arquivos)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Diretório backups/ não encontrado${NC}"
fi

# 7. Verificar tamanho de diretórios importantes
echo -e "\n${YELLOW}📊 Tamanho dos diretórios:${NC}"
echo "node_modules: $(du -sh node_modules/ 2>/dev/null | cut -f1)"
echo "dist:         $(du -sh dist/ 2>/dev/null | cut -f1)"
echo "logs:         $(du -sh logs/ 2>/dev/null | cut -f1)"
echo "public:       $(du -sh public/ 2>/dev/null | cut -f1)"
echo "backups:      $(du -sh backups/ 2>/dev/null | cut -f1)"

# 8. Resumo
echo -e "\n${GREEN}✅ Limpeza concluída!${NC}"
echo -e "Espaço liberado: ${GREEN}$(human_readable $total_freed)${NC}"

# 9. Sugestões
echo -e "\n${YELLOW}💡 Sugestões:${NC}"
echo "- Execute 'npm run build' se o build foi removido"
echo "- Execute 'pm2 restart all' após limpeza de logs"
echo "- Considere fazer backup antes de limpezas maiores"

exit 0

