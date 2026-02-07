#!/bin/bash

# Script para build do APK com configurações corretas
# Uso: ./build-apk.sh

echo "🚀 Iniciando build do APK..."

# 1. Limpar cache
echo "🧹 Limpando cache..."
rm -rf dist/
rm -rf node_modules/.vite/
rm -rf android/app/build/

# 2. Build do frontend
echo "📦 Fazendo build do frontend..."
npm run build

# 3. Sync com Capacitor
echo "🔄 Sincronizando com Capacitor..."
npx cap sync android

# 4. Copiar assets
echo "📋 Copiando assets..."
npx cap copy android

# 5. Abrir no Android Studio
echo "🎨 Abrindo Android Studio..."
echo ""
echo "✅ Build preparado!"
echo ""
echo "📱 Próximos passos no Android Studio:"
echo "  1. Build > Generate Signed Bundle / APK"
echo "  2. Escolha 'APK'"
echo "  3. Selecione sua keystore"
echo "  4. Build!"
echo ""
echo "🧪 Ou para testar direto no celular:"
echo "  1. Conecte o celular via USB"
echo "  2. Ative depuração USB"
echo "  3. Clique em 'Run' no Android Studio"
echo ""

npx cap open android
