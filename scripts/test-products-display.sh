#!/bin/bash

# Script para testar se produtos estão sendo exibidos corretamente
# Uso: bash scripts/test-products-display.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "🔍 TESTE COMPLETO: EXIBIÇÃO DE PRODUTOS"
echo "═══════════════════════════════════════════════════════"
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar produtos no banco
echo "1️⃣ PRODUTOS NO BANCO DE DADOS:"
echo "────────────────────────────────────────────────────────"
TOTAL=$(mysql -u root -p"${MYSQL_PASSWORD:-}" rare_toy_companion -se "SELECT COUNT(*) FROM produtos WHERE status='ativo';" 2>/dev/null)
echo -e "${GREEN}✅ Total de produtos ativos: $TOTAL${NC}"

# Listar produtos
echo ""
echo "📋 Produtos cadastrados:"
mysql -u root -p"${MYSQL_PASSWORD:-}" rare_toy_companion -e "
  SELECT 
    SUBSTR(id, 1, 8) as id,
    LEFT(nome, 30) as nome, 
    categoria, 
    preco, 
    estoque 
  FROM produtos 
  WHERE status='ativo' 
  ORDER BY created_at DESC 
  LIMIT 10;" 2>/dev/null | column -t

echo ""
echo ""

# 2. Testar API local
echo "2️⃣ API LOCAL (localhost:3001):"
echo "────────────────────────────────────────────────────────"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/produtos)
if [ "$STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Status: $STATUS${NC}"
    COUNT=$(curl -s http://localhost:3001/api/produtos | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.length);")
    echo -e "${GREEN}✅ Produtos retornados: $COUNT${NC}"
else
    echo -e "${RED}❌ Status: $STATUS${NC}"
fi

echo ""
echo ""

# 3. Testar API pública (via Nginx)
echo "3️⃣ API PÚBLICA (via Nginx):"
echo "────────────────────────────────────────────────────────"
# Teste sem SSL (HTTP)
STATUS_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/api/produtos)
if [ "$STATUS_HTTP" = "200" ]; then
    echo -e "${GREEN}✅ HTTP Status: $STATUS_HTTP${NC}"
elif [ "$STATUS_HTTP" = "301" ] || [ "$STATUS_HTTP" = "302" ]; then
    echo -e "${YELLOW}⚠️  HTTP Status: $STATUS_HTTP (Redirect para HTTPS)${NC}"
else
    echo -e "${RED}❌ HTTP Status: $STATUS_HTTP${NC}"
fi

# Teste com HTTPS (se certificado estiver válido)
STATUS_HTTPS=$(curl -s -o /dev/null -w "%{http_code}" -k https://localhost/api/produtos)
if [ "$STATUS_HTTPS" = "200" ]; then
    echo -e "${GREEN}✅ HTTPS Status: $STATUS_HTTPS${NC}"
    COUNT_HTTPS=$(curl -s -k https://localhost/api/produtos | node -e "const data = JSON.parse(require('fs').readFileSync(0, 'utf-8')); console.log(data.length);")
    echo -e "${GREEN}✅ Produtos retornados via HTTPS: $COUNT_HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS Status: $STATUS_HTTPS (Certificado SSL pode estar inválido)${NC}"
fi

echo ""
echo ""

# 4. Verificar build do frontend
echo "4️⃣ FRONTEND BUILD:"
echo "────────────────────────────────────────────────────────"
if [ -d "/home/git-muhlstore/rare-toy-companion-final-8040/dist" ]; then
    echo -e "${GREEN}✅ Diretório dist/ existe${NC}"
    INDEX_SIZE=$(wc -c < /home/git-muhlstore/rare-toy-companion-final-8040/dist/index.html)
    echo -e "${GREEN}✅ index.html: $INDEX_SIZE bytes${NC}"
    
    # Verificar se há arquivos JS
    JS_COUNT=$(find /home/git-muhlstore/rare-toy-companion-final-8040/dist/assets -name "*.js" 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Arquivos JavaScript: $JS_COUNT${NC}"
else
    echo -e "${RED}❌ Diretório dist/ não encontrado${NC}"
fi

echo ""
echo ""

# 5. Verificar se frontend está acessível
echo "5️⃣ FRONTEND ACESSÍVEL:"
echo "────────────────────────────────────────────────────────"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8040)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ Frontend respondendo: $FRONTEND_STATUS${NC}"
else
    echo -e "${RED}❌ Frontend não responde: $FRONTEND_STATUS${NC}"
fi

echo ""
echo ""

# 6. Status dos serviços PM2
echo "6️⃣ SERVIÇOS PM2:"
echo "────────────────────────────────────────────────────────"
pm2 list | grep muhlstore | awk '{print $2, $10}' | while read name status; do
    if [ "$status" = "online" ]; then
        echo -e "${GREEN}✅ $name: $status${NC}"
    else
        echo -e "${RED}❌ $name: $status${NC}"
    fi
done

echo ""
echo ""

# 7. Verificar logs recentes de erro
echo "7️⃣ ERROS RECENTES (últimas 5 linhas):"
echo "────────────────────────────────────────────────────────"
echo "Backend (muhlstore_api):"
tail -5 /root/.pm2/logs/muhlstore-api-error-6.log 2>/dev/null | grep -i "error\|erro" | tail -3 || echo "  Sem erros recentes"

echo ""
echo "Frontend (muhlstore_web):"
tail -5 /root/.pm2/logs/muhlstore-web-error-7.log 2>/dev/null | grep -i "error\|erro" | tail -3 || echo "  Sem erros recentes"

echo ""
echo ""

# RESUMO
echo "═══════════════════════════════════════════════════════"
echo "📊 RESUMO"
echo "═══════════════════════════════════════════════════════"
echo ""

if [ "$STATUS" = "200" ] && [ "$COUNT" -gt "0" ]; then
    echo -e "${GREEN}✅ BACKEND: Funcionando ($COUNT produtos)${NC}"
else
    echo -e "${RED}❌ BACKEND: Problema detectado${NC}"
fi

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ FRONTEND: Acessível${NC}"
else
    echo -e "${RED}❌ FRONTEND: Não acessível${NC}"
fi

echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo ""
echo "   1. Abra o site no navegador"
echo "   2. Pressione F12 (DevTools)"
echo "   3. Vá na aba 'Console'"
echo "   4. Procure por erros em vermelho"
echo "   5. Vá na aba 'Network'"
echo "   6. Recarregue a página (F5)"
echo "   7. Veja se /api/produtos retorna 200 OK"
echo ""
echo "   Me envie:"
echo "   - Onde você está vendo 'sem produtos'?"
echo "   - Captura de tela do Console (F12)"
echo "   - Captura de tela da aba Network"
echo ""
