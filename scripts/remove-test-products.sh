#!/bin/bash

# Script para remover produtos de teste e manter apenas produtos reais
# Uso: bash scripts/remove-test-products.sh

set -e

echo "═══════════════════════════════════════════════════════"
echo "🗑️  REMOÇÃO DE PRODUTOS DE TESTE"
echo "═══════════════════════════════════════════════════════"
echo ""

# Listar produtos de teste
echo "📋 Produtos de teste identificados:"
mysql -u root -p"${MYSQL_PASSWORD:-}" rare_toy_companion -e "
  SELECT 
    SUBSTR(id, 1, 8) as id,
    nome
  FROM produtos 
  WHERE nome LIKE '%Teste%' 
     OR nome LIKE '%teste%' 
     OR nome LIKE '%MySQL%'
     OR nome LIKE '%Direto%'
  ORDER BY created_at DESC;
" 2>/dev/null

echo ""
read -p "🤔 Deseja remover estes produtos de teste? (s/N): " resposta

if [[ "$resposta" =~ ^[Ss]$ ]]; then
    echo ""
    echo "🗑️  Removendo produtos de teste..."
    
    mysql -u root -p"${MYSQL_PASSWORD:-}" rare_toy_companion -e "
      DELETE FROM produtos 
      WHERE nome LIKE '%Teste%' 
         OR nome LIKE '%teste%' 
         OR nome LIKE '%MySQL%'
         OR nome LIKE '%Direto%';
    " 2>/dev/null
    
    echo "✅ Produtos de teste removidos!"
    echo ""
    echo "📊 Produtos restantes:"
    mysql -u root -p"${MYSQL_PASSWORD:-}" rare_toy_companion -e "
      SELECT 
        SUBSTR(id, 1, 8) as id,
        LEFT(nome, 40) as nome,
        categoria,
        CONCAT('R$ ', FORMAT(preco, 2)) as preco
      FROM produtos 
      WHERE status='ativo'
      ORDER BY created_at DESC;
    " 2>/dev/null
    
    echo ""
    echo "🔄 Reiniciando backend para limpar cache..."
    pm2 restart muhlstore_api > /dev/null 2>&1
    
    echo ""
    echo "✅ Concluído! Recarregue a página no navegador."
else
    echo ""
    echo "❌ Operação cancelada. Nenhum produto foi removido."
fi
