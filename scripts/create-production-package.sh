#!/bin/bash

# =============================================================================
# 🚀 MUHLSTORE - CRIADOR DE PACOTE PARA PRODUÇÃO
# =============================================================================
# Data: Outubro 2025
# Versão: 2.0
# Autor: Sistema de Empacotamento Automático
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configurações
PROJECT_NAME="muhlstore"
VERSION="2.0"
DATE=$(date +%Y%m%d_%H%M%S)
PACKAGE_NAME="${PROJECT_NAME}_production_${VERSION}_${DATE}"
TEMP_DIR="/tmp/${PACKAGE_NAME}"
OUTPUT_DIR="$(pwd)/releases"
OUTPUT_FILE="${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz"

print_banner() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    📦 MUHLSTORE v2.0                        ║"
    echo "║                                                              ║"
    echo "║              CRIADOR DE PACOTE PARA PRODUÇÃO                 ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_header() {
    echo -e "\n${BLUE}==> $1${NC}\n"
}

print_info() {
    echo -e "${CYAN}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_step() {
    echo -e "\n${YELLOW}▶ $1${NC}"
}

# =============================================================================
# PREPARAÇÃO
# =============================================================================

prepare_directories() {
    print_header "📁 Preparando Diretórios"
    
    # Criar diretório de releases se não existir
    if [ ! -d "$OUTPUT_DIR" ]; then
        mkdir -p "$OUTPUT_DIR"
        print_success "Diretório de releases criado: $OUTPUT_DIR"
    fi
    
    # Limpar diretório temporário se existir
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
    fi
    
    mkdir -p "$TEMP_DIR"
    print_success "Diretório temporário criado: $TEMP_DIR"
}

# =============================================================================
# CÓPIA DE ARQUIVOS
# =============================================================================

copy_project_files() {
    print_header "📦 Copiando Arquivos do Projeto"
    
    print_step "Copiando arquivos essenciais..."
    
    # Copiar arquivos e diretórios importantes
    rsync -av \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='dist' \
        --exclude='*.log' \
        --exclude='.env.local' \
        --exclude='.vite' \
        --exclude='.eslintcache' \
        --exclude='uploads/temp' \
        --exclude='logs/*' \
        --exclude='releases' \
        --exclude='backups' \
        --exclude='*.swp' \
        --exclude='*.swo' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        --exclude='coverage' \
        --exclude='.nyc_output' \
        --exclude='tmp' \
        --exclude='temp' \
        ./ "$TEMP_DIR/"
    
    print_success "Arquivos copiados com sucesso"
}

# =============================================================================
# CRIAÇÃO DE ARQUIVOS DE CONFIGURAÇÃO
# =============================================================================

create_production_configs() {
    print_header "⚙️ Criando Configurações de Produção"
    
    # Criar .env de exemplo para produção
    cat > "$TEMP_DIR/.env.production.example" <<'EOF'
# =============================================================================
# MUHLSTORE - CONFIGURAÇÕES DE PRODUÇÃO
# =============================================================================

# Configurações do Banco de Dados
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3306
MYSQL_USER=rare_toy_user
MYSQL_PASSWORD=CHANGE_THIS_PASSWORD
MYSQL_DATABASE=rare_toy_companion

# Configurações da API
PORT=3001
NODE_ENV=production

# Configurações de Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=50MB

# Configurações de Segurança
JWT_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET_KEY
SESSION_SECRET=CHANGE_THIS_TO_A_RANDOM_SECRET_KEY

# Configurações do Frontend
VITE_API_URL=https://seu-dominio.com.br
VITE_APP_NAME=MuhlStore
VITE_APP_VERSION=2.0

# Configurações de Email (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app

# Configurações do Mercado Pago (Opcional)
MERCADOPAGO_ACCESS_TOKEN=seu-access-token
MERCADOPAGO_PUBLIC_KEY=sua-public-key

# Configurações de WhatsApp (Opcional)
WHATSAPP_API_TOKEN=seu-token
WHATSAPP_PHONE_NUMBER=seu-numero
EOF
    
    print_success "Arquivo .env.production.example criado"
    
    # Criar README de instalação
    cat > "$TEMP_DIR/INSTALACAO.md" <<'EOF'
# 📦 INSTALAÇÃO DO MUHLSTORE v2.0

## 🚀 Guia Rápido de Instalação

### Requisitos do Sistema
- Ubuntu 20.04 ou superior
- 2GB RAM mínimo (4GB recomendado)
- 20GB espaço em disco
- Acesso root ou sudo

### Instalação Automática

1. **Extrair o pacote:**
```bash
tar -xzf muhlstore_production_*.tar.gz
cd muhlstore_production_*
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.production.example .env
nano .env  # Edite com suas configurações
```

3. **Executar instalação automática:**
```bash
chmod +x install.sh
./install.sh
```

O script irá instalar automaticamente:
- ✅ Node.js LTS via NVM
- ✅ PM2 Process Manager
- ✅ Nginx Web Server
- ✅ MySQL Database
- ✅ Todas as dependências

### Configuração Manual do MySQL

Após a instalação, configure o banco de dados:

```bash
sudo mysql -u root -p
```

Execute os seguintes comandos SQL:
```sql
CREATE DATABASE IF NOT EXISTS rare_toy_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'rare_toy_user'@'localhost' IDENTIFIED BY 'SUA_SENHA_AQUI';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Executar Migrações do Banco

```bash
# Se houver arquivos de migração
mysql -u rare_toy_user -p rare_toy_companion < database/migrations/*.sql
```

### Iniciar Aplicação

```bash
# Build do projeto
npm run build

# Iniciar com PM2
npm run pm2:start

# Verificar status
npm run pm2:status
```

### Verificar Instalação

Acesse no navegador:
- Frontend: http://seu-ip
- API: http://seu-ip:3001/api/health

### Comandos Úteis

```bash
# Ver logs
npm run pm2:logs

# Reiniciar
npm run pm2:restart

# Parar
npm run pm2:stop

# Backup
npm run backup

# Status do sistema
npm run pm2:monit
```

### Configuração de Domínio

Para configurar um domínio personalizado, edite:
```bash
sudo nano /etc/nginx/sites-available/muhlstore
```

Substitua `server_name _;` por `server_name seu-dominio.com.br;`

Reinicie o Nginx:
```bash
sudo systemctl restart nginx
```

### SSL/HTTPS (Recomendado)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com.br
```

### Problemas Comuns

**Porta 3001 já em uso:**
```bash
sudo lsof -i :3001
sudo kill -9 PID
```

**Nginx não inicia:**
```bash
sudo nginx -t
sudo systemctl status nginx
```

**PM2 não encontrado:**
```bash
export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"
```

### Suporte

Para mais informações, consulte a documentação completa ou entre em contato com o suporte.

**Versão:** 2.0  
**Data:** Outubro 2025  
**Status:** Produção Ready ✅
EOF
    
    print_success "Arquivo INSTALACAO.md criado"
}

# =============================================================================
# CRIAÇÃO DO PACOTE
# =============================================================================

create_package() {
    print_header "📦 Criando Pacote Comprimido"
    
    print_step "Comprimindo arquivos..."
    
    # Criar arquivo tar.gz
    tar -czf "$OUTPUT_FILE" -C "$(dirname $TEMP_DIR)" "$(basename $TEMP_DIR)"
    
    if [ -f "$OUTPUT_FILE" ]; then
        print_success "Pacote criado: $OUTPUT_FILE"
    else
        print_error "Erro ao criar pacote"
        exit 1
    fi
}

# =============================================================================
# VERIFICAÇÃO E ESTATÍSTICAS
# =============================================================================

show_statistics() {
    print_header "📊 Estatísticas do Pacote"
    
    local file_size=$(du -h "$OUTPUT_FILE" | cut -f1)
    local file_count=$(tar -tzf "$OUTPUT_FILE" | wc -l)
    
    echo -e "${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    📦 PACOTE CRIADO                         ║"
    echo "║                                                              ║"
    echo "║              Nome: $(basename $OUTPUT_FILE)                 "
    echo "║              Tamanho: $file_size                                      "
    echo "║              Arquivos: $file_count                                    "
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    print_info "📁 Localização: $OUTPUT_FILE"
    print_info "🔢 Checksum MD5: $(md5sum $OUTPUT_FILE | cut -d' ' -f1)"
}

# =============================================================================
# CRIAÇÃO DE INSTRUÇÕES
# =============================================================================

create_deployment_instructions() {
    print_header "📝 Criando Instruções de Deploy"
    
    cat > "${OUTPUT_DIR}/DEPLOY_INSTRUCTIONS.md" <<EOF
# 🚀 INSTRUÇÕES DE DEPLOY - MUHLSTORE v2.0

## 📦 Pacote Criado
**Nome:** $(basename $OUTPUT_FILE)  
**Tamanho:** $(du -h "$OUTPUT_FILE" | cut -f1)  
**Data:** $(date '+%d/%m/%Y %H:%M:%S')  
**Checksum MD5:** $(md5sum $OUTPUT_FILE | cut -d' ' -f1)

## 🔧 Passo a Passo de Instalação

### 1. Upload do Pacote

**Via SCP:**
\`\`\`bash
scp $(basename $OUTPUT_FILE) usuario@seu-servidor.com:/home/usuario/
\`\`\`

**Via FTP/SFTP:**
- Use FileZilla ou outro cliente FTP
- Upload para: /home/usuario/

### 2. No Servidor Ubuntu

\`\`\`bash
# Conectar ao servidor
ssh usuario@seu-servidor.com

# Extrair pacote
tar -xzf $(basename $OUTPUT_FILE)
cd ${PACKAGE_NAME}

# Configurar ambiente
cp .env.production.example .env
nano .env  # Edite suas configurações

# Executar instalação
chmod +x install.sh
./install.sh
\`\`\`

### 3. Configurar Banco de Dados

\`\`\`bash
sudo mysql -u root -p
\`\`\`

\`\`\`sql
CREATE DATABASE rare_toy_companion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'rare_toy_user'@'localhost' IDENTIFIED BY 'SUA_SENHA';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
\`\`\`

### 4. Build e Inicialização

\`\`\`bash
# Instalar dependências
npm install

# Build para produção
npm run build

# Iniciar com PM2
npm run pm2:start

# Verificar status
npm run pm2:status
\`\`\`

### 5. Configurar Firewall

\`\`\`bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp
sudo ufw enable
\`\`\`

### 6. Verificação

Acesse no navegador:
- **Frontend:** http://seu-ip
- **API:** http://seu-ip:3001/api/health

## 🔒 Configuração SSL (Opcional mas Recomendado)

\`\`\`bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com.br

# Renovação automática
sudo certbot renew --dry-run
\`\`\`

## 📊 Monitoramento

\`\`\`bash
# Ver logs em tempo real
npm run pm2:logs

# Monitor interativo
npm run pm2:monit

# Status dos processos
npm run pm2:status
\`\`\`

## 🗄️ Backup

\`\`\`bash
# Backup completo
npm run backup

# Backup apenas do banco
npm run backup:db

# Configurar backup automático (cron)
crontab -e
# Adicionar linha:
0 2 * * * cd /caminho/para/projeto && npm run backup
\`\`\`

## 🆘 Troubleshooting

**Problema:** Porta em uso
\`\`\`bash
sudo lsof -i :3001
sudo kill -9 PID
\`\`\`

**Problema:** Node não encontrado
\`\`\`bash
export NVM_DIR="\$HOME/.nvm"
source "\$NVM_DIR/nvm.sh"
\`\`\`

**Problema:** Permissões
\`\`\`bash
sudo chown -R \$USER:\$USER .
chmod +x install.sh
chmod +x scripts/*.sh
\`\`\`

## ✅ Checklist de Produção

- [ ] Servidor Ubuntu 20.04+ configurado
- [ ] Variáveis de ambiente configuradas (.env)
- [ ] Banco de dados MySQL criado
- [ ] Firewall configurado
- [ ] SSL/HTTPS configurado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo
- [ ] DNS apontando para o servidor
- [ ] Testes de funcionalidade realizados

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte INSTALACAO.md no pacote
- Verifique logs com \`npm run pm2:logs\`
- Execute health check com \`npm run health:check\`

**Boa sorte com o deploy! 🚀**
EOF
    
    print_success "Arquivo DEPLOY_INSTRUCTIONS.md criado"
}

# =============================================================================
# LIMPEZA
# =============================================================================

cleanup() {
    print_header "🧹 Limpeza"
    
    if [ -d "$TEMP_DIR" ]; then
        rm -rf "$TEMP_DIR"
        print_success "Diretório temporário removido"
    fi
}

# =============================================================================
# FUNÇÃO PRINCIPAL
# =============================================================================

main() {
    print_banner
    
    prepare_directories
    copy_project_files
    create_production_configs
    create_package
    create_deployment_instructions
    show_statistics
    cleanup
    
    echo -e "\n${GREEN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                                                              ║"
    echo "║                    ✅ SUCESSO!                              ║"
    echo "║                                                              ║"
    echo "║              Pacote de Produção Criado                       ║"
    echo "║                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}\n"
    
    print_info "📦 Pacote: $OUTPUT_FILE"
    print_info "📝 Instruções: ${OUTPUT_DIR}/DEPLOY_INSTRUCTIONS.md"
    print_info "🚀 Pronto para upload no servidor Ubuntu!"
}

# Executar
main "$@"

