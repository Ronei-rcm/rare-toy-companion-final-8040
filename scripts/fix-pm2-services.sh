#!/bin/bash

# Script para corrigir e limpar serviços PM2
# Uso: bash scripts/fix-pm2-services.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "🔧 CORREÇÃO DE SERVIÇOS PM2 - Rare Toy Companion"
echo "═══════════════════════════════════════════════════════"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_info() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

# Verificar se PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 não está instalado!"
    exit 1
fi

print_info "PM2 encontrado!"

echo ""
echo "📋 Serviços atualmente rodando:"
pm2 list

echo ""
echo "═══════════════════════════════════════════════════════"
echo "🔍 ANÁLISE DE SERVIÇOS"
echo "═══════════════════════════════════════════════════════"
echo ""

# Verificar processo duplicado
if pm2 list | grep -q "rare-toy-backend"; then
    print_warning "Processo duplicado encontrado: rare-toy-backend"
    echo ""
    read -p "Deseja remover o processo duplicado 'rare-toy-backend'? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        print_info "Parando processo: rare-toy-backend"
        pm2 stop rare-toy-backend || true
        
        print_info "Removendo processo: rare-toy-backend"
        pm2 delete rare-toy-backend || true
        
        print_info "Processo removido com sucesso!"
    else
        print_warning "Processo mantido. Você pode removê-lo manualmente com:"
        echo "  pm2 stop rare-toy-backend"
        echo "  pm2 delete rare-toy-backend"
    fi
else
    print_info "Nenhum processo duplicado encontrado."
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "✅ VERIFICAÇÃO DE SERVIÇOS CONFIGURADOS"
echo "═══════════════════════════════════════════════════════"
echo ""

# Verificar se os serviços do ecosystem.config.cjs estão rodando
SERVICES=("api" "web" "whatsapp-webhook")
ALL_OK=true

for service in "${SERVICES[@]}"; do
    if pm2 list | grep -q "$service.*online"; then
        print_info "Serviço '$service' está online ✅"
    else
        print_error "Serviço '$service' NÃO está online ❌"
        ALL_OK=false
    fi
done

echo ""
if [ "$ALL_OK" = true ]; then
    print_info "Todos os serviços configurados estão rodando!"
else
    print_warning "Alguns serviços não estão rodando. Deseja iniciá-los?"
    read -p "Iniciar serviços do ecosystem.config.cjs? (s/n): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[SsYy]$ ]]; then
        print_info "Iniciando serviços do ecosystem.config.cjs..."
        pm2 start ecosystem.config.cjs
        print_info "Serviços iniciados!"
    fi
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "📊 RESUMO FINAL"
echo "═══════════════════════════════════════════════════════"
echo ""

pm2 list

echo ""
print_info "Análise concluída!"
echo ""
echo "📄 Documentação completa em: docs/ANALISE_PM2_SERVICOS.md"
echo ""
echo "🔄 Comandos úteis:"
echo "  pm2 logs              # Ver logs em tempo real"
echo "  pm2 monit             # Monitorar recursos"
echo "  pm2 restart ecosystem.config.cjs  # Reiniciar todos"
echo "  pm2 save              # Salvar configuração atual"
