#!/bin/bash

# Script para limpar todos os caches do MuhlStore
# Uso: bash scripts/clear-all-caches.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "🧹 LIMPEZA DE CACHES - MUHLSTORE"
echo "═══════════════════════════════════════════════════════"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_info() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# 1. Limpar cache Redis
echo "🔄 1. Limpando cache Redis..."
if command -v redis-cli &> /dev/null; then
    redis-cli FLUSHALL > /dev/null 2>&1 && print_info "Cache Redis limpo" || print_warning "Redis não disponível ou erro ao limpar"
else
    print_warning "Redis CLI não encontrado - pulando"
fi

echo ""

# 2. Reiniciar backend (força reload do cache em memória)
echo "🔄 2. Reiniciando backend API..."
pm2 restart muhlstore_api > /dev/null 2>&1 && print_info "Backend reiniciado" || print_warning "Erro ao reiniciar backend"

echo ""

# 3. Reiniciar frontend/proxy
echo "🔄 3. Reiniciando frontend/proxy..."
pm2 restart muhlstore_web > /dev/null 2>&1 && print_info "Frontend reiniciado" || print_warning "Erro ao reiniciar frontend"

echo ""

# 4. Limpar cache do navegador (instruções)
echo "📱 4. Limpar cache do navegador:"
echo "   No navegador, pressione:"
echo "   - Chrome/Edge: Ctrl+Shift+Delete"
echo "   - Firefox: Ctrl+Shift+Delete"
echo "   - Safari: Cmd+Option+E"
echo ""
echo "   Ou force refresh:"
echo "   - Ctrl+F5 (Windows/Linux)"
echo "   - Cmd+Shift+R (Mac)"

echo ""

# 5. Limpar Service Worker
echo "🔧 5. Limpar Service Worker:"
echo "   1. Abra DevTools (F12)"
echo "   2. Application → Service Workers"
echo "   3. Clique em 'Unregister'"
echo "   4. Recarregue a página (F5)"

echo ""

echo "═══════════════════════════════════════════════════════"
echo "✅ LIMPEZA CONCLUÍDA!"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "📊 Status dos serviços:"
pm2 list | grep muhlstore

echo ""
echo "🔄 Aguarde 5-10 segundos e recarregue o site."
echo "💡 Se ainda não aparecer, limpe o cache do navegador."
