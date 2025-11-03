#!/bin/bash

################################################################################
# Script de Configuração de Backup Automático via Cron
# Autor: Equipe Muhlstore
# Descrição: Configura backup diário automático do projeto
################################################################################

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         CONFIGURAÇÃO DE BACKUP AUTOMÁTICO                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Variáveis
PROJECT_DIR="/home/git-muhlstore/rare-toy-companion-final-8040"
BACKUP_DIR="/home/projeto-git"
NPM_PATH=$(which npm)

echo -e "${YELLOW}📋 Configurações:${NC}"
echo -e "   Projeto: ${GREEN}$PROJECT_DIR${NC}"
echo -e "   Backup: ${GREEN}$BACKUP_DIR${NC}"
echo -e "   NPM: ${GREEN}$NPM_PATH${NC}"
echo ""

# Verificar se o usuário quer continuar
read -p "Deseja configurar backup automático diário? (s/N): " resposta

if [[ ! "$resposta" =~ ^[Ss]$ ]]; then
    echo -e "${YELLOW}Operação cancelada.${NC}"
    exit 0
fi

# Perguntar horário
echo ""
echo -e "${YELLOW}⏰ Em que horário deseja executar o backup?${NC}"
read -p "Hora (0-23) [padrão: 2]: " hora
hora=${hora:-2}

read -p "Minuto (0-59) [padrão: 0]: " minuto
minuto=${minuto:-0}

# Perguntar quantos dias manter
echo ""
read -p "Quantos dias de backup manter? [padrão: 7]: " dias
dias=${dias:-7}

# Criar arquivo temporário com as tarefas cron
CRON_TEMP=$(mktemp)

# Backup da crontab atual
crontab -l > "$CRON_TEMP" 2>/dev/null || true

# Remover entradas antigas do backup-project se existirem
sed -i '/backup-project/d' "$CRON_TEMP" 2>/dev/null || true

# Adicionar novas entradas
echo "" >> "$CRON_TEMP"
echo "# Backup automático do projeto Rare Toy Companion" >> "$CRON_TEMP"
echo "$minuto $hora * * * cd $PROJECT_DIR && $NPM_PATH run backup:project >> /var/log/backup-project.log 2>&1" >> "$CRON_TEMP"
echo "" >> "$CRON_TEMP"
echo "# Limpeza automática de backups antigos (manter últimos $dias dias)" >> "$CRON_TEMP"
limpeza_hora=$((hora + 1))
echo "0 $limpeza_hora * * * find $BACKUP_DIR/ -name 'rare-toy-companion_backup_*.zip' -mtime +$dias -delete" >> "$CRON_TEMP"

# Instalar nova crontab
crontab "$CRON_TEMP"

# Limpar arquivo temporário
rm "$CRON_TEMP"

# Criar diretório de logs se não existir
sudo mkdir -p /var/log
sudo touch /var/log/backup-project.log
sudo chown $(whoami):$(whoami) /var/log/backup-project.log

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ✅ BACKUP AUTOMÁTICO CONFIGURADO! ✅                ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📊 RESUMO DA CONFIGURAÇÃO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "⏰ Horário do backup:  ${GREEN}$hora:$(printf '%02d' $minuto) (todos os dias)${NC}"
echo -e "🗑️  Retenção:           ${GREEN}$dias dias${NC}"
echo -e "📂 Local do backup:    ${GREEN}$BACKUP_DIR${NC}"
echo -e "📝 Log:                ${GREEN}/var/log/backup-project.log${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 COMANDOS ÚTEIS:${NC}"
echo ""
echo -e "   Ver tarefas agendadas:"
echo -e "   ${BLUE}crontab -l${NC}"
echo ""
echo -e "   Ver logs do backup:"
echo -e "   ${BLUE}tail -f /var/log/backup-project.log${NC}"
echo ""
echo -e "   Editar manualmente:"
echo -e "   ${BLUE}crontab -e${NC}"
echo ""
echo -e "   Testar backup agora:"
echo -e "   ${BLUE}npm run backup:project${NC}"
echo ""
echo -e "   Listar backups criados:"
echo -e "   ${BLUE}ls -lh $BACKUP_DIR/*.zip${NC}"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✨ Backup automático ativo!${NC}"
echo ""

# Perguntar se quer testar agora
read -p "Deseja executar um backup de teste agora? (s/N): " testar

if [[ "$testar" =~ ^[Ss]$ ]]; then
    echo ""
    echo -e "${YELLOW}🧪 Executando backup de teste...${NC}"
    cd "$PROJECT_DIR"
    npm run backup:project
fi

exit 0

