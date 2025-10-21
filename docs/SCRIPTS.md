# 📜 Referência de Scripts - MuhlStore

Este documento lista todos os scripts disponíveis no projeto e como usá-los.

## 🚀 Scripts de Instalação

### `install.sh` - Instalação Automática Completa

**Descrição**: Instala toda a stack da MuhlStore em um servidor Linux limpo.

**Uso**:
```bash
sudo ./install.sh
```

**O que faz**:
- ✅ Detecta automaticamente a distribuição Linux
- ✅ Atualiza o sistema
- ✅ Instala Node.js via NVM
- ✅ Instala PM2 globalmente
- ✅ Instala MySQL (Docker ou nativo - você escolhe)
- ✅ Clona/atualiza o repositório
- ✅ Configura variáveis de ambiente (.env)
- ✅ Faz build do projeto
- ✅ Configura Nginx com proxy reverso
- ✅ Configura SSL (Let's Encrypt)
- ✅ Inicia aplicação com PM2
- ✅ Configura firewall
- ✅ Cria script de backup automático

**Pré-requisitos**:
- Servidor Linux (Ubuntu/Debian/CentOS/Rocky)
- Acesso root (sudo)
- Domínio configurado apontando para o servidor
- Conexão de internet

**Tempo estimado**: 10-20 minutos

---

### `uninstall.sh` - Desinstalação Completa

**Descrição**: Remove completamente a MuhlStore do servidor.

**Uso**:
```bash
sudo ./uninstall.sh
```

**O que faz**:
- ✅ Cria backup opcional antes de remover
- ✅ Para todos os processos PM2
- ✅ Remove configuração do Nginx
- ✅ Remove certificado SSL
- ✅ Remove container MySQL (se Docker)
- ✅ Remove arquivos do projeto
- ✅ Remove agendamentos (cron)
- ✅ Opcionalmente remove Node.js, Docker e Nginx

**⚠️ ATENÇÃO**: Esta ação é irreversível!

---

## 💾 Scripts de Backup

### `backup.sh` - Backup Manual

**Descrição**: Cria backup completo do projeto e banco de dados.

**Uso**:
```bash
./backup.sh
```

**O que faz**:
- ✅ Cria arquivo ZIP com código-fonte
- ✅ Exporta dump do banco MySQL
- ✅ Inclui dump no arquivo ZIP
- ✅ Mantém últimos 7 backups
- ✅ Remove backups antigos automaticamente

**Localização dos backups**: `./backups/backup_YYYY-MM-DD_HH-MM-SS.zip`

**Agendamento automático**: Diário às 3h da manhã (configurado pelo install.sh)

---

## 🔧 Scripts NPM

### Scripts de Desenvolvimento

#### `npm run dev`
**Descrição**: Inicia Vite em modo desenvolvimento

```bash
npm run dev
```

- Porta: 5173 (padrão)
- Hot reload ativo
- Source maps habilitados

---

#### `npm run dev:full`
**Descrição**: Inicia servidor backend + Vite em paralelo

```bash
npm run dev:full
```

- Backend: porta 3001
- Frontend: porta 5173

---

### Scripts de Build

#### `npm run build`
**Descrição**: Cria build de produção

```bash
npm run build
```

- Output: `./dist/`
- Otimização completa
- Minificação ativa
- Tree-shaking

---

#### `npm run preview`
**Descrição**: Preview local do build de produção

```bash
npm run preview
```

- Porta: 4173 (padrão)
- Serve arquivos de `./dist/`

---

### Scripts do Servidor

#### `npm run server`
**Descrição**: Inicia apenas o backend Node/Express

```bash
npm run server
```

- Porta: 3001
- API REST completa
- Upload de arquivos

---

#### `npm run preview:pm2`
**Descrição**: Inicia preview com PM2

```bash
npm run preview:pm2
```

- Porta: 8040
- Gerenciado pelo PM2
- Auto-restart

---

### Scripts Docker

#### `npm run docker:up`
**Descrição**: Inicia serviços Docker (MySQL)

```bash
npm run docker:up
```

- MySQL na porta 3306
- Volumes persistentes

---

#### `npm run docker:down`
**Descrição**: Para serviços Docker

```bash
npm run docker:down
```

---

#### `npm run docker:restart`
**Descrição**: Reinicia serviços Docker

```bash
npm run docker:restart
```

---

### Scripts de Teste

#### `npm run mysql:test`
**Descrição**: Testa conexão com MySQL

```bash
npm run mysql:test
```

- Verifica conectividade
- Testa credenciais
- Lista databases

---

## 📦 Scripts PM2

### Via ecosystem.config.cjs

#### Iniciar todos os serviços
```bash
pm2 start ecosystem.config.cjs
```

**Processos iniciados**:
- `api` - Backend (porta 3001)
- `web` - Frontend preview (porta 8040)
- `whatsapp-webhook` - Webhook WhatsApp (porta 3002)

---

#### Ver status
```bash
pm2 status
```

---

#### Ver logs
```bash
# Todos os processos
pm2 logs

# Processo específico
pm2 logs api
pm2 logs web
pm2 logs whatsapp-webhook
```

---

#### Reiniciar
```bash
# Todos
pm2 restart all

# Específico
pm2 restart api
```

---

#### Parar
```bash
# Todos
pm2 stop all

# Específico
pm2 stop api
```

---

#### Deletar
```bash
# Todos
pm2 delete all

# Específico
pm2 delete api
```

---

#### Monitoramento
```bash
pm2 monit
```

---

#### Salvar configuração
```bash
pm2 save
```

---

## 🔄 Fluxo de Trabalho Comum

### 1️⃣ Desenvolvimento Local
```bash
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run dev

# Ou use o comando combinado:
npm run dev:full
```

---

### 2️⃣ Deploy em Produção
```bash
# 1. Atualizar código
git pull

# 2. Instalar dependências
npm install

# 3. Build
npm run build

# 4. Reiniciar PM2
pm2 restart all
```

---

### 3️⃣ Backup Manual
```bash
# Criar backup
./backup.sh

# Verificar backups
ls -lh backups/

# Restaurar backup
unzip backups/backup_YYYY-MM-DD_HH-MM-SS.zip -d restore/
```

---

### 4️⃣ Instalação do Zero
```bash
# Servidor Linux limpo
sudo ./install.sh

# Siga as instruções interativas
# Aguarde 10-20 minutos
# Pronto!
```

---

### 5️⃣ Troubleshooting
```bash
# Ver logs em tempo real
pm2 logs

# Status de todos os processos
pm2 status

# Testar MySQL
npm run mysql:test

# Reiniciar tudo
pm2 restart all

# Verificar Nginx
sudo nginx -t
sudo systemctl status nginx
```

---

## 📊 Scripts de Manutenção

### Limpar node_modules
```bash
rm -rf node_modules
npm install
```

---

### Limpar build
```bash
rm -rf dist
npm run build
```

---

### Limpar cache do PM2
```bash
pm2 flush
```

---

### Limpar logs do PM2
```bash
pm2 flush logs
```

---

### Atualizar PM2
```bash
npm install -g pm2@latest
pm2 update
```

---

## 🔐 Scripts de Segurança

### Atualizar dependências
```bash
# Verificar vulnerabilidades
npm audit

# Corrigir automaticamente
npm audit fix

# Forçar correções (cuidado!)
npm audit fix --force
```

---

### Renovar SSL
```bash
sudo certbot renew
```

---

### Testar renovação SSL
```bash
sudo certbot renew --dry-run
```

---

## 📝 Notas Importantes

### Ordem de Execução

Para instalação completa:
1. `install.sh` (primeira vez)
2. `pm2 start ecosystem.config.cjs`
3. Configure admin panel
4. `backup.sh` (após configurar)

### Permissões

- Scripts `.sh`: Precisam de `chmod +x`
- Scripts npm: Rodam com permissões do usuário
- PM2: Pode rodar como usuário normal
- Nginx: Precisa de sudo

### Logs

Locais importantes:
- **PM2**: `~/.pm2/logs/`
- **Nginx**: `/var/log/nginx/`
- **MySQL (Docker)**: `docker logs muhlstore-mysql`
- **Sistema**: `/var/log/syslog`

### Backup

- Automático: Diário às 3h
- Manual: `./backup.sh`
- Localização: `./backups/`
- Retenção: 7 dias

---

## 🆘 Ajuda Rápida

### Problema: Script não executa
```bash
# Dar permissão
chmod +x script.sh

# Executar como root (se necessário)
sudo ./script.sh
```

### Problema: PM2 não encontrado
```bash
# Carregar NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Ou instalar PM2
npm install -g pm2
```

### Problema: Porta em uso
```bash
# Ver o que está usando a porta
sudo lsof -i :3001

# Matar processo
sudo kill -9 PID
```

### Problema: MySQL não conecta
```bash
# Docker
docker ps | grep mysql
docker logs muhlstore-mysql

# Nativo
sudo systemctl status mysql
sudo mysql -u root -p
```

---

## 📚 Documentação Relacionada

- [README.md](./README.md) - Visão geral do projeto
- [INSTALL.md](./INSTALL.md) - Guia de instalação detalhado
- [MANUAL_WHATSAPP.md](./MANUAL_WHATSAPP.md) - Configuração WhatsApp
- [PRÓXIMOS_PASSOS.md](./PRÓXIMOS_PASSOS.md) - Roadmap

---

**💡 Dica**: Sempre teste em ambiente de desenvolvimento antes de executar em produção!

