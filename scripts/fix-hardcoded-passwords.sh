#!/bin/bash

# ===========================================
# Script para Remover Senhas Hardcoded
# ===========================================
# Este script substitui senhas hardcoded por variáveis de ambiente
# USO: bash scripts/fix-hardcoded-passwords.sh

echo "🔒 Iniciando correção de senhas hardcoded..."

# Padrões a serem substituídos
OLD_PASSWORD_1="'RSM_Rg51gti66'"
OLD_PASSWORD_2='"RSM_Rg51gti66"'
OLD_PASSWORD_3="'rg51gt66'"
OLD_PASSWORD_4='"rg51gt66"'
NEW_PASSWORD="process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || ''"

# Contador
COUNT=0

# Função para substituir em um arquivo
replace_in_file() {
  local file=$1
  if [ -f "$file" ]; then
    # Verificar se contém senha hardcoded
    if grep -q -E "(RSM_Rg51gti66|rg51gt66)" "$file"; then
      echo "  📝 Corrigindo: $file"
      
      # Substituir senhas hardcoded
      sed -i "s|password: $OLD_PASSWORD_1|password: $NEW_PASSWORD|g" "$file"
      sed -i "s|password: $OLD_PASSWORD_2|password: $NEW_PASSWORD|g" "$file"
      sed -i "s|password: $OLD_PASSWORD_3|password: $NEW_PASSWORD|g" "$file"
      sed -i "s|password: $OLD_PASSWORD_4|password: $NEW_PASSWORD|g" "$file"
      
      # Também para casos sem "password:"
      sed -i "s|$OLD_PASSWORD_1|$NEW_PASSWORD|g" "$file"
      sed -i "s|$OLD_PASSWORD_2|$NEW_PASSWORD|g" "$file"
      
      COUNT=$((COUNT + 1))
    fi
  fi
}

# Processar arquivos JavaScript/CJS
echo "📂 Procurando em scripts/..."
find scripts/ -type f \( -name "*.cjs" -o -name "*.js" -o -name "*.sh" \) | while read file; do
  replace_in_file "$file"
done

# Processar arquivos no server/
echo "📂 Procurando em server/..."
find server/ -type f \( -name "*.cjs" -o -name "*.js" \) ! -path "*/node_modules/*" | while read file; do
  replace_in_file "$file"
done

echo ""
echo "✅ Correção concluída!"
echo "📊 Arquivos corrigidos: $COUNT"
echo ""
echo "⚠️  IMPORTANTE:"
echo "   1. Revise os arquivos alterados"
echo "   2. Certifique-se de que o arquivo .env está configurado"
echo "   3. Teste a conexão com o banco: npm run mysql:test"
echo "   4. Nunca commite senhas no código novamente!"
echo ""
