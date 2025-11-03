#!/bin/bash

################################################################################
# Script de Backup Completo do Projeto
# Autor: Equipe Muhlstore
# Descrição: Cria backup zipado do projeto para transferência entre máquinas
################################################################################

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
PROJECT_DIR="/home/git-muhlstore/rare-toy-companion-final-8040"
BACKUP_DIR="/home/projeto-git"
PROJECT_NAME="rare-toy-companion"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}"
TEMP_DIR="/tmp/${BACKUP_NAME}"

# Banner
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         BACKUP COMPLETO DO PROJETO                         ║"
echo "║         Rare Toy Companion E-commerce                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se o diretório do projeto existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Erro: Diretório do projeto não encontrado: $PROJECT_DIR${NC}"
    exit 1
fi

# Criar diretório de backup se não existir
echo -e "${YELLOW}📁 Criando diretório de backup...${NC}"
mkdir -p "$BACKUP_DIR"

# Criar diretório temporário
echo -e "${YELLOW}📦 Preparando arquivos para backup...${NC}"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Copiar projeto para temp (excluindo arquivos desnecessários)
echo -e "${YELLOW}📋 Copiando arquivos do projeto...${NC}"
rsync -av --progress \
    --exclude='node_modules' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='logs/*.log' \
    --exclude='*.log' \
    --exclude='.cache' \
    --exclude='.vscode' \
    --exclude='.idea' \
    --exclude='coverage' \
    --exclude='.nyc_output' \
    --exclude='*.tmp' \
    --exclude='*.temp' \
    --exclude='.DS_Store' \
    --exclude='Thumbs.db' \
    --exclude='*.swp' \
    --exclude='*.swo' \
    --exclude='.env.local' \
    --exclude='.env.*.local' \
    --exclude='uploads/temp/*' \
    --exclude='backups/*.sql' \
    --exclude='backups/*.zip' \
    --exclude='backups/*.tar.gz' \
    --exclude='public/uploads/temp/*' \
    "$PROJECT_DIR/" "$TEMP_DIR/"

# Criar arquivo de informações do backup
echo -e "${YELLOW}📝 Criando arquivo de informações...${NC}"
cat > "$TEMP_DIR/BACKUP_INFO.txt" << EOF
╔════════════════════════════════════════════════════════════╗
║         INFORMAÇÕES DO BACKUP                              ║
╚════════════════════════════════════════════════════════════╝

📅 Data do Backup: $(date '+%d/%m/%Y às %H:%M:%S')
💻 Máquina de Origem: $(hostname)
👤 Usuário: $(whoami)
📂 Diretório Original: $PROJECT_DIR
🏷️  Nome do Backup: $BACKUP_NAME

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 CONTEÚDO DO BACKUP

✅ Código-fonte completo (src/, server/)
✅ Configurações (config/, ecosystem.config.cjs)
✅ Banco de dados (database/, migrations)
✅ Documentação completa (docs/, README.md)
✅ Scripts (scripts/)
✅ Arquivos de configuração (.env.example, package.json, etc)
✅ Assets públicos (public/)

❌ EXCLUÍDOS DO BACKUP (para reduzir tamanho)

- node_modules/ (reinstalar com: npm install)
- dist/ (recriar com: npm run build)
- logs/*.log (arquivos de log)
- .git/ (histórico git - se necessário, fazer git clone)
- uploads/temp/ (arquivos temporários)
- backups/*.sql (backups antigos de banco)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 COMO RESTAURAR EM OUTRA MÁQUINA

1. Extrair o backup:
   unzip ${BACKUP_NAME}.zip
   cd ${BACKUP_NAME}

2. Instalar dependências:
   npm install

3. Configurar ambiente:
   cp .env.example .env
   # Editar .env com as configurações corretas

4. Configurar banco de dados:
   npm run docker:up
   npm run db:migrate

5. Fazer build (se necessário):
   npm run build:prod

6. Iniciar aplicação:
   npm run pm2:start

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTAÇÃO IMPORTANTE

- README.md - Visão geral do projeto
- DOCS_INDEX.md - Índice completo de documentação
- docs/INSTALL.md - Guia de instalação completo
- docs/ARCHITECTURE.md - Arquitetura técnica
- LEIA_PRIMEIRO.md - Guia de início rápido

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ IMPORTANTE

1. Após extrair, execute: npm install
2. Configure o arquivo .env com suas credenciais
3. Certifique-se de ter MySQL e Node.js instalados
4. Restaure o backup do banco de dados se necessário
5. Configure PM2 para produção

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📞 SUPORTE

Email: suporte@muhlstore.com.br
Site: https://muhlstore.re9suainternet.com.br

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✨ Backup criado com sucesso!
EOF

# Criar arquivo com instruções de restauração
echo -e "${YELLOW}📝 Criando guia de restauração...${NC}"
cat > "$TEMP_DIR/COMO_RESTAURAR.md" << 'EOF'
# 🔄 Guia de Restauração do Projeto

## 📋 Pré-requisitos

Antes de restaurar o projeto, certifique-se de ter instalado:

- ✅ Node.js 18+ (`node --version`)
- ✅ npm ou yarn (`npm --version`)
- ✅ MySQL 8.0+ (`mysql --version`)
- ✅ Git (opcional) (`git --version`)
- ✅ PM2 (para produção) (`pm2 --version` ou instalar: `npm install -g pm2`)

---

## 🚀 Passos de Restauração

### 1. Extrair o Backup

```bash
# Ir para o diretório onde o backup foi copiado
cd /caminho/para/o/backup

# Extrair o arquivo zip
unzip rare-toy-companion_backup_*.zip

# Entrar no diretório extraído
cd rare-toy-companion_backup_*
```

### 2. Instalar Dependências

```bash
# Instalar todas as dependências do projeto
npm install

# Isso pode levar alguns minutos na primeira vez
```

### 3. Configurar Variáveis de Ambiente

```bash
# Copiar o arquivo de exemplo
cp .env.example .env

# Editar com suas configurações
nano .env  # ou vim, code, etc.
```

**Variáveis importantes para configurar:**

```env
# Banco de Dados
DB_HOST=localhost
DB_USER=rare_toy_user
DB_PASSWORD=sua_senha_aqui
DB_NAME=rare_toy_companion
DB_PORT=3306

# Servidor
SERVER_PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=http://seu-servidor:3001

# JWT
JWT_SECRET=sua_chave_secreta_segura_aqui

# Email (se usar)
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=seu_email
SMTP_PASS=sua_senha
```

### 4. Configurar Banco de Dados

#### Opção A: Usando Docker (Recomendado)

```bash
# Iniciar MySQL via Docker
npm run docker:up

# Verificar se está rodando
docker ps

# Executar migrations
npm run db:migrate
```

#### Opção B: MySQL Local

```bash
# Criar banco de dados
mysql -u root -p -e "CREATE DATABASE rare_toy_companion;"

# Criar usuário
mysql -u root -p -e "CREATE USER 'rare_toy_user'@'localhost' IDENTIFIED BY 'sua_senha';"

# Dar permissões
mysql -u root -p -e "GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'localhost';"

# Importar schema
mysql -u rare_toy_user -p rare_toy_companion < database/init.sql

# Executar migrations
npm run db:migrate
```

### 5. Build da Aplicação

```bash
# Build de produção otimizado
npm run build:prod

# Verificar se o build foi criado
ls -la dist/
```

### 6. Iniciar a Aplicação

#### Desenvolvimento

```bash
# Iniciar frontend e backend juntos
npm run dev:full

# Ou separadamente:
npm run dev      # Frontend apenas
npm run server   # Backend apenas
```

#### Produção com PM2

```bash
# Iniciar processos gerenciados pelo PM2
npm run pm2:start

# Verificar status
npm run pm2:status

# Ver logs
npm run pm2:logs

# Salvar configuração do PM2
pm2 save

# Configurar para iniciar no boot
pm2 startup
```

### 7. Verificar Funcionamento

```bash
# Testar se o backend está respondendo
curl http://localhost:3001/api/health

# Abrir no navegador
# Frontend: http://localhost:8040
# Admin: http://localhost:8040/admin/login
```

---

## 🔧 Comandos Úteis

### PM2

```bash
# Ver status de todos os processos
pm2 status

# Restart de um processo específico
pm2 restart api

# Parar todos os processos
pm2 stop all

# Ver logs em tempo real
pm2 logs

# Monitoramento
pm2 monit
```

### Banco de Dados

```bash
# Backup do banco
npm run db:backup

# Restore do banco
npm run db:restore

# Testar conexão
npm run mysql:test
```

### Desenvolvimento

```bash
# Executar testes
npm test

# Lint do código
npm run lint

# Limpar cache
npm run cache:clear
```

---

## 🐛 Troubleshooting

### Problema: Erro de conexão com banco de dados

**Solução:**
```bash
# Verificar se o MySQL está rodando
systemctl status mysql  # ou: docker ps

# Testar conexão
mysql -u rare_toy_user -p -h localhost

# Verificar variáveis de ambiente
cat .env | grep DB_
```

### Problema: Porta já em uso

**Solução:**
```bash
# Ver o que está usando a porta
lsof -i :3001  # backend
lsof -i :8040  # frontend

# Matar processo se necessário
kill -9 <PID>

# Ou mudar a porta no .env
```

### Problema: node_modules corrompido

**Solução:**
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Problema: Build falha

**Solução:**
```bash
# Limpar cache e tentar novamente
npm run cache:clear
npm run build:prod

# Verificar versão do Node
node --version  # Deve ser 18+
```

---

## 📊 Verificação Pós-Instalação

### Checklist

- [ ] Node.js e npm instalados e funcionando
- [ ] MySQL rodando e acessível
- [ ] Arquivo .env configurado corretamente
- [ ] `npm install` executado sem erros
- [ ] Banco de dados criado e migrations aplicadas
- [ ] Build criado com sucesso
- [ ] Backend respondendo em :3001
- [ ] Frontend acessível em :8040
- [ ] PM2 gerenciando processos (produção)
- [ ] Logs sendo gerados corretamente

### Testes Rápidos

```bash
# 1. Testar API
curl http://localhost:3001/api/health

# 2. Testar produtos
curl http://localhost:3001/api/products

# 3. Verificar processos
pm2 status

# 4. Ver logs
tail -f logs/combined.log
```

---

## 📚 Documentação Adicional

Após restaurar, consulte:

- **README.md** - Visão geral do projeto
- **LEIA_PRIMEIRO.md** - Guia de início
- **DOCS_INDEX.md** - Índice completo de documentação
- **docs/INSTALL.md** - Instalação detalhada
- **docs/ARCHITECTURE.md** - Arquitetura técnica

---

## 🆘 Precisa de Ajuda?

- 📧 Email: suporte@muhlstore.com.br
- 📚 Documentação: Veja pasta `docs/`
- 🐛 Issues: Crie uma issue no repositório

---

**✨ Boa sorte com a restauração!**
EOF

# Calcular tamanho do diretório
echo -e "${YELLOW}📊 Calculando tamanho...${NC}"
SIZE=$(du -sh "$TEMP_DIR" | cut -f1)
echo -e "${BLUE}Tamanho dos arquivos: $SIZE${NC}"

# Criar arquivo zip
echo -e "${YELLOW}🗜️  Compactando arquivos...${NC}"
cd /tmp
zip -r "${BACKUP_NAME}.zip" "${BACKUP_NAME}" -q
echo -e "${GREEN}✅ Compactação concluída!${NC}"

# Mover para diretório de backup
echo -e "${YELLOW}📦 Movendo backup para diretório final...${NC}"
mv "${BACKUP_NAME}.zip" "$BACKUP_DIR/"

# Calcular tamanho do zip
ZIP_SIZE=$(du -sh "$BACKUP_DIR/${BACKUP_NAME}.zip" | cut -f1)

# Limpar diretório temporário
echo -e "${YELLOW}🧹 Limpando arquivos temporários...${NC}"
rm -rf "$TEMP_DIR"

# Calcular checksum do arquivo
echo -e "${YELLOW}🔐 Calculando checksum...${NC}"
cd "$BACKUP_DIR"
CHECKSUM=$(md5sum "${BACKUP_NAME}.zip" | cut -d' ' -f1)

# Criar arquivo de checksum
echo "$CHECKSUM  ${BACKUP_NAME}.zip" > "${BACKUP_NAME}.md5"

# Resumo final
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         ✅ BACKUP CONCLUÍDO COM SUCESSO! ✅                 ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${BLUE}📊 INFORMAÇÕES DO BACKUP${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "📁 Arquivo:       ${GREEN}${BACKUP_NAME}.zip${NC}"
echo -e "📂 Localização:   ${GREEN}${BACKUP_DIR}/${NC}"
echo -e "💾 Tamanho:       ${GREEN}${ZIP_SIZE}${NC}"
echo -e "🔐 MD5 Checksum:  ${GREEN}${CHECKSUM}${NC}"
echo -e "📅 Data:          ${GREEN}$(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "1. ${BLUE}Transferir o arquivo para outra máquina:${NC}"
echo -e "   scp ${BACKUP_DIR}/${BACKUP_NAME}.zip usuario@servidor:/destino/"
echo ""
echo -e "2. ${BLUE}Ou usar rsync:${NC}"
echo -e "   rsync -avz ${BACKUP_DIR}/${BACKUP_NAME}.zip usuario@servidor:/destino/"
echo ""
echo -e "3. ${BLUE}Na máquina de destino, extrair:${NC}"
echo -e "   unzip ${BACKUP_NAME}.zip"
echo ""
echo -e "4. ${BLUE}Seguir instruções em:${NC}"
echo -e "   - BACKUP_INFO.txt"
echo -e "   - COMO_RESTAURAR.md"
echo ""
echo -e "5. ${BLUE}Verificar integridade (opcional):${NC}"
echo -e "   md5sum -c ${BACKUP_NAME}.md5"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✨ Backup pronto para transferência!${NC}"
echo ""

# Criar arquivo com informações do último backup
cat > "$BACKUP_DIR/ULTIMO_BACKUP.txt" << EOF
Último Backup Criado
━━━━━━━━━━━━━━━━━━━━
Data: $(date '+%d/%m/%Y %H:%M:%S')
Arquivo: ${BACKUP_NAME}.zip
Tamanho: ${ZIP_SIZE}
MD5: ${CHECKSUM}
Localização: ${BACKUP_DIR}/${BACKUP_NAME}.zip
EOF

echo -e "${BLUE}📄 Informações salvas em: ${BACKUP_DIR}/ULTIMO_BACKUP.txt${NC}"
echo ""

exit 0

