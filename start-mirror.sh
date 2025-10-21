#!/bin/bash

echo "🪞 Iniciando espelho do Rare Toy Companion..."

# Criar túnel SSH para MySQL (em background)
echo "📡 Criando túnel SSH para MySQL..."
pm2 start ssh --name "rare-toy-tunnel" -- -N -L 3308:127.0.0.1:3307 root@177.67.33.248

# Aguardar o túnel estabelecer
sleep 3

# Iniciar API
echo "🚀 Iniciando API na porta 3011..."
cd /srv/erp-muhlstore/rare-toy-companion-mirror
pm2 start server/server.cjs --name "rare-toy-api" \
  --env SERVER_PORT=3011 \
  --env MYSQL_HOST=127.0.0.1 \
  --env MYSQL_PORT=3308 \
  --env MYSQL_USER=root \
  --env MYSQL_PASSWORD=RSM_Rg51gti66 \
  --env MYSQL_DATABASE=rare_toy_companion

# Aguardar API iniciar
sleep 3

# Iniciar Web Proxy
echo "🌐 Iniciando Web Proxy na porta 8041..."
pm2 start server/proxy-mirror.cjs --name "rare-toy-web" \
  --env PORT=8041 \
  --env API_PORT=3011

# Mostrar status
echo ""
echo "✅ Espelho iniciado!"
echo "📊 Status:"
pm2 status

echo ""
echo "🌐 Acesse o projeto em:"
echo "   - Local: http://localhost:8041"
echo "   - Rede: http://192.168.9.100:8041"
echo ""
echo "📡 API rodando em: http://localhost:3011"
echo ""
echo "📋 Comandos úteis:"
echo "  pm2 logs              - Ver logs de todos os processos"
echo "  pm2 logs rare-toy-api - Ver logs da API"
echo "  pm2 logs rare-toy-web - Ver logs do Web"
echo "  pm2 stop all          - Parar todos os processos"
echo "  pm2 restart all       - Reiniciar todos os processos"
echo ""

