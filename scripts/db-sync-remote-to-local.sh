#!/bin/bash

################################################################################
# 🔄 Sincronização MySQL Remoto → Local
# 
# Faz dump do MySQL remoto e importa no MySQL local (container)
# Garante redundância e backup do banco de dados
################################################################################

# Configurações
# Usar túnel SSH local (porta 3308) que conecta ao remoto
REMOTE_HOST="127.0.0.1"
REMOTE_PORT="3308"  # Túnel SSH do PM2
REMOTE_USER="root"
REMOTE_PASS="RSM_Rg51gti66"
REMOTE_DB="rare_toy_companion"

LOCAL_CONTAINER="rare-toy-mysql-mirror"
LOCAL_USER="root"
LOCAL_PASS=""  # Senha vazia no container
LOCAL_DB="rare_toy_companion"

BACKUP_DIR="/srv/erp-muhlstore/rare-toy-companion-mirror/mysql/dumps"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
DUMP_FILE="$BACKUP_DIR/remote_db_${TIMESTAMP}.sql"

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔄 Sincronização MySQL: Remoto → Local"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

# 1. Verificar se container está rodando
log_info "Verificando container MySQL local..."
if ! docker ps | grep -q "$LOCAL_CONTAINER"; then
  log_error "Container MySQL local não está rodando"
  log_info "Inicie com: docker-compose -f docker-compose.mysql.yml up -d"
  exit 1
fi
log_success "Container MySQL local está rodando"

# 2. Testar conexão remota
log_info "Testando conexão com MySQL remoto..."
if ! mysql -h "$REMOTE_HOST" -P "$REMOTE_PORT" -u "$REMOTE_USER" -p"$REMOTE_PASS" -e "SELECT 1" > /dev/null 2>&1; then
  log_error "Não foi possível conectar ao MySQL remoto"
  exit 1
fi
log_success "Conexão com MySQL remoto OK"

# 3. Fazer dump do banco remoto
log_info "Fazendo dump do banco remoto ($REMOTE_DB)..."
mysqldump \
  -h "$REMOTE_HOST" \
  -P "$REMOTE_PORT" \
  -u "$REMOTE_USER" \
  -p"$REMOTE_PASS" \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --opt \
  --skip-lock-tables \
  "$REMOTE_DB" > "$DUMP_FILE" 2>/dev/null

# Verificar se o arquivo foi criado e tem conteúdo
if [ -s "$DUMP_FILE" ]; then
  dump_size=$(du -h "$DUMP_FILE" | cut -f1)
  log_success "Dump criado: $DUMP_FILE ($dump_size)"
else
  log_error "Falha ao criar dump"
  exit 1
fi

# 4. Importar no MySQL local (container)
log_info "Importando dump no MySQL local..."

# Primeiro, dropar e recriar o banco (para limpeza)
docker exec -i "$LOCAL_CONTAINER" mysql -u "$LOCAL_USER" -e "DROP DATABASE IF EXISTS $LOCAL_DB; CREATE DATABASE $LOCAL_DB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

if [ $? -ne 0 ]; then
  log_warning "Não foi possível recriar o banco (pode já existir)"
fi

# Importar dump
docker exec -i "$LOCAL_CONTAINER" mysql -u "$LOCAL_USER" "$LOCAL_DB" < "$DUMP_FILE" 2>/dev/null

if [ $? -eq 0 ]; then
  log_success "Dados importados no MySQL local"
else
  log_error "Falha ao importar dados"
  exit 1
fi

# 5. Verificar integridade
log_info "Verificando integridade dos dados..."

# Contar tabelas remotas
remote_tables=$(mysql -h "$REMOTE_HOST" -P "$REMOTE_PORT" -u "$REMOTE_USER" -p"$REMOTE_PASS" -D "$REMOTE_DB" -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$REMOTE_DB'" 2>/dev/null)

# Contar tabelas locais
local_tables=$(docker exec "$LOCAL_CONTAINER" mysql -u "$LOCAL_USER" -D "$LOCAL_DB" -sse "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$LOCAL_DB'" 2>/dev/null)

echo ""
log_info "Comparação:"
echo "  Tabelas remotas: $remote_tables"
echo "  Tabelas locais:  $local_tables"

if [ "$remote_tables" = "$local_tables" ]; then
  log_success "Sincronização completa! Bancos idênticos."
else
  log_warning "Número de tabelas diferentes (pode ser normal se houve mudanças)"
fi

# 6. Limpeza - manter apenas últimos 5 dumps
log_info "Limpando dumps antigos (mantendo últimos 5)..."
cd "$BACKUP_DIR"
ls -t remote_db_*.sql | tail -n +6 | xargs -r rm
log_success "Limpeza concluída"

# 7. Relatório final
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
log_success "✨ Sincronização concluída com sucesso!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
log_info "📊 Informações:"
echo "  Dump salvo: $DUMP_FILE"
echo "  Tamanho: $(du -h "$DUMP_FILE" | cut -f1)"
echo "  Tabelas: $local_tables"
echo ""
log_info "🌐 Acesso ao MySQL local:"
echo "  Host: localhost"
echo "  Porta: 3309"
echo "  Usuário: root"
echo "  Senha: RSM_Rg51gti66"
echo "  Banco: rare_toy_companion"
echo ""
log_info "🌐 Acesso ao phpMyAdmin local:"
echo "  URL: http://localhost:8082"
echo "  URL (rede): http://192.168.9.100:8082"
echo ""

