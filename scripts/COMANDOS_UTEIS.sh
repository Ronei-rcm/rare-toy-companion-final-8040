#!/bin/bash

# ====================================================================
# MUHLSTORE - COMANDOS ÚTEIS
# ====================================================================
# Scripts úteis para gerenciar o projeto
# ====================================================================

# Cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ====================================================================
# DESENVOLVIMENTO
# ====================================================================

dev() {
    echo -e "${BLUE}🚀 Iniciando ambiente de desenvolvimento...${NC}"
    npm run dev
}

# ====================================================================
# PRODUÇÃO
# ====================================================================

build() {
    echo -e "${BLUE}🏗️  Fazendo build de produção...${NC}"
    npm run build
}

start() {
    echo -e "${GREEN}▶️  Iniciando com PM2...${NC}"
    pm2 start ecosystem.config.cjs
    pm2 save
    echo -e "${GREEN}✅ Serviços iniciados!${NC}"
    pm2 status
}

restart() {
    echo -e "${YELLOW}🔄 Reiniciando todos os serviços...${NC}"
    pm2 restart all
    echo -e "${GREEN}✅ Serviços reiniciados!${NC}"
}

stop() {
    echo -e "${RED}⏹️  Parando todos os serviços...${NC}"
    pm2 stop all
}

status() {
    echo -e "${BLUE}📊 Status dos serviços:${NC}"
    pm2 status
}

logs() {
    echo -e "${BLUE}📝 Logs em tempo real:${NC}"
    pm2 logs
}

# ====================================================================
# BANCO DE DADOS
# ====================================================================

db-migrate() {
    echo -e "${BLUE}🗄️  Rodando migrações...${NC}"
    mysql -u root -p rare_toy_store < database/init.sql
    mysql -u root -p rare_toy_store < database/add_cart_recovery_columns.sql
    echo -e "${GREEN}✅ Migrações concluídas!${NC}"
}

db-backup() {
    echo -e "${BLUE}💾 Fazendo backup do banco...${NC}"
    BACKUP_FILE="backups/db-backup-$(date +%Y%m%d-%H%M%S).sql"
    mkdir -p backups
    mysqldump -u root -p rare_toy_store > "$BACKUP_FILE"
    echo -e "${GREEN}✅ Backup salvo em: $BACKUP_FILE${NC}"
}

db-restore() {
    if [ -z "$1" ]; then
        echo -e "${RED}❌ Uso: db-restore <arquivo.sql>${NC}"
        return 1
    fi
    echo -e "${YELLOW}⚠️  Restaurando banco de dados...${NC}"
    mysql -u root -p rare_toy_store < "$1"
    echo -e "${GREEN}✅ Banco restaurado!${NC}"
}

# ====================================================================
# TESTES
# ====================================================================

test() {
    echo -e "${BLUE}🧪 Rodando testes...${NC}"
    npm test
}

test-run() {
    echo -e "${BLUE}🧪 Rodando todos os testes uma vez...${NC}"
    npm run test:run
}

test-ui() {
    echo -e "${BLUE}🎨 Abrindo interface de testes...${NC}"
    npm run test:ui
}

test-coverage() {
    echo -e "${BLUE}📊 Gerando relatório de cobertura...${NC}"
    npm run test:coverage
    echo -e "${GREEN}✅ Relatório em: coverage/index.html${NC}"
}

# ====================================================================
# CACHE E PERFORMANCE
# ====================================================================

cache-clear() {
    echo -e "${YELLOW}🧹 Limpando cache Redis...${NC}"
    redis-cli FLUSHDB
    echo -e "${GREEN}✅ Cache limpo!${NC}"
}

cache-stats() {
    echo -e "${BLUE}📊 Estatísticas do Redis:${NC}"
    redis-cli INFO stats
}

# ====================================================================
# LOGS
# ====================================================================

logs-error() {
    echo -e "${RED}📛 Logs de erro:${NC}"
    tail -f logs/error.log
}

logs-combined() {
    echo -e "${BLUE}📝 Todos os logs:${NC}"
    tail -f logs/combined.log
}

logs-clear() {
    echo -e "${YELLOW}🧹 Limpando logs...${NC}"
    > logs/error.log
    > logs/combined.log
    echo -e "${GREEN}✅ Logs limpos!${NC}"
}

# ====================================================================
# MANUTENÇÃO
# ====================================================================

health() {
    echo -e "${BLUE}🏥 Verificando saúde do sistema...${NC}"
    echo ""
    echo "API:"
    curl -s http://localhost:3001/api/health | jq '.'
    echo ""
    echo "PM2:"
    pm2 status
    echo ""
    echo "Redis:"
    redis-cli ping
}

cleanup() {
    echo -e "${YELLOW}🧹 Limpando arquivos temporários...${NC}"
    rm -rf node_modules/.cache
    rm -rf dist
    rm -rf .vite
    npm run build
    echo -e "${GREEN}✅ Limpeza concluída!${NC}"
}

update-deps() {
    echo -e "${BLUE}📦 Atualizando dependências...${NC}"
    npm update
    npm audit fix
    echo -e "${GREEN}✅ Dependências atualizadas!${NC}"
}

# ====================================================================
# SEGURANÇA
# ====================================================================

security-audit() {
    echo -e "${BLUE}🔒 Auditoria de segurança:${NC}"
    npm audit
}

security-fix() {
    echo -e "${YELLOW}🔧 Corrigindo vulnerabilidades...${NC}"
    npm audit fix
}

# ====================================================================
# DEPLOY
# ====================================================================

deploy() {
    echo -e "${BLUE}🚀 Iniciando deploy...${NC}"
    
    # Build
    echo -e "${BLUE}1/4 Build...${NC}"
    npm run build
    
    # Migração
    echo -e "${BLUE}2/4 Migrações...${NC}"
    mysql -u root -p rare_toy_store < database/add_cart_recovery_columns.sql
    
    # Backup antes de reiniciar
    echo -e "${BLUE}3/4 Backup...${NC}"
    npm run backup
    
    # Reiniciar
    echo -e "${BLUE}4/4 Reiniciando serviços...${NC}"
    pm2 restart all
    pm2 save
    
    echo -e "${GREEN}✅ Deploy concluído!${NC}"
    pm2 status
}

# ====================================================================
# HELP
# ====================================================================

help() {
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  MUHLSTORE - COMANDOS DISPONÍVEIS${NC}"
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${GREEN}Desenvolvimento:${NC}"
    echo "  dev              - Iniciar modo desenvolvimento"
    echo "  build            - Build de produção"
    echo ""
    echo -e "${GREEN}PM2:${NC}"
    echo "  start            - Iniciar todos os serviços"
    echo "  restart          - Reiniciar todos os serviços"
    echo "  stop             - Parar todos os serviços"
    echo "  status           - Ver status"
    echo "  logs             - Ver logs em tempo real"
    echo ""
    echo -e "${GREEN}Banco de Dados:${NC}"
    echo "  db-migrate       - Rodar migrações"
    echo "  db-backup        - Fazer backup"
    echo "  db-restore FILE  - Restaurar backup"
    echo ""
    echo -e "${GREEN}Testes:${NC}"
    echo "  test             - Rodar testes (watch mode)"
    echo "  test-run         - Rodar testes uma vez"
    echo "  test-ui          - Interface de testes"
    echo "  test-coverage    - Relatório de cobertura"
    echo ""
    echo -e "${GREEN}Cache:${NC}"
    echo "  cache-clear      - Limpar cache Redis"
    echo "  cache-stats      - Estatísticas do Redis"
    echo ""
    echo -e "${GREEN}Logs:${NC}"
    echo "  logs-error       - Ver logs de erro"
    echo "  logs-combined    - Ver todos os logs"
    echo "  logs-clear       - Limpar logs"
    echo ""
    echo -e "${GREEN}Manutenção:${NC}"
    echo "  health           - Verificar saúde do sistema"
    echo "  cleanup          - Limpar temporários"
    echo "  update-deps      - Atualizar dependências"
    echo ""
    echo -e "${GREEN}Segurança:${NC}"
    echo "  security-audit   - Auditoria de segurança"
    echo "  security-fix     - Corrigir vulnerabilidades"
    echo ""
    echo -e "${GREEN}Deploy:${NC}"
    echo "  deploy           - Deploy completo"
    echo ""
    echo -e "${BLUE}════════════════════════════════════════════${NC}"
}

# Se executado sem argumentos, mostrar help
if [ $# -eq 0 ]; then
    help
fi

# Executar comando passado
"$@"
