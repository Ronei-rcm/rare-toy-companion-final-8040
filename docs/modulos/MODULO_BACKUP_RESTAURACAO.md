# 📦 Módulo de Backup e Restauração do Banco de Dados

**Data de Criação:** 18 de Janeiro de 2026  
**Versão:** 1.0.0  
**Status:** ✅ Produção

---

## 📋 Visão Geral

Módulo completo para gerenciamento de backups e restauração do banco de dados MySQL/MariaDB. Permite criar, listar, restaurar, deletar e fazer download de backups do banco de dados através de interface web administrativa.

---

## 🎯 Funcionalidades

### ✅ Funcionalidades Implementadas

| Recurso | Descrição | Status |
|---------|-----------|--------|
| **Criar Backup** | Cria backup completo do banco com descrição opcional | ✅ |
| **Listar Backups** | Lista todos os backups disponíveis com informações | ✅ |
| **Restaurar Backup** | Restaura backup com dupla confirmação | ✅ |
| **Deletar Backup** | Remove backup do servidor | ✅ |
| **Download Backup** | Download direto de arquivos .sql | ✅ |
| **Validações** | Verifica criação, tamanho e erros nos backups | ✅ |
| **Segurança** | Autenticação admin obrigatória | ✅ |

---

## 🏗️ Arquitetura

### Estrutura de Arquivos

```
/home/git-muhlstore/rare-toy-companion-final-8040/
├── server/
│   └── server.cjs                    # Endpoints de backup (linhas 19728-19968)
├── src/
│   ├── components/admin/
│   │   └── DatabaseBackupManager.tsx # Componente React principal
│   └── pages/admin/
│       └── DatabaseBackup.tsx        # Página admin
├── backups/                          # Diretório de armazenamento
│   └── backup_*.sql                  # Arquivos de backup
└── docs/modulos/
    └── MODULO_BACKUP_RESTAURACAO.md  # Este documento
```

---

## 🔌 API Endpoints

### GET `/api/admin/database/backups`

Lista todos os backups disponíveis.

**Autenticação:** ✅ Requerida (`authenticateAdmin`)

**Resposta:**
```json
{
  "backups": [
    {
      "filename": "backup_rare_toy_companion_2026-01-18T10-30-00.sql",
      "size": 4096,
      "sizeFormatted": "4.0 KB",
      "created": "2026-01-18T10:30:00.000Z",
      "modified": "2026-01-18T10:30:00.000Z"
    }
  ]
}
```

---

### POST `/api/admin/database/backup`

Cria um novo backup do banco de dados.

**Autenticação:** ✅ Requerida (`authenticateAdmin`)

**Body:**
```json
{
  "description": "Backup antes de atualização" // opcional
}
```

**Resposta:**
```json
{
  "success": true,
  "backup": {
    "filename": "backup_rare_toy_companion_2026-01-18T10-30-00.sql",
    "size": 4096,
    "sizeFormatted": "4.0 KB",
    "created": "2026-01-18T10:30:00.000Z",
    "path": "/home/git-muhlstore/rare-toy-companion-final-8040/backups/backup_rare_toy_companion_2026-01-18T10-30-00.sql"
  }
}
```

**Comando Executado:**
```bash
MYSQL_PWD="***" mysqldump -h 127.0.0.1 -P 3306 -u root \
  --single-transaction --quick --lock-tables=false \
  rare_toy_companion > backup_path.sql
```

**Flags do mysqldump:**
- `--single-transaction`: Backup consistente sem bloquear tabelas
- `--quick`: Usa menos memória para bancos grandes
- `--lock-tables=false`: Não bloqueia tabelas durante backup

---

### POST `/api/admin/database/restore`

Restaura um backup existente.

**Autenticação:** ✅ Requerida (`authenticateAdmin`)

**Body:**
```json
{
  "filename": "backup_rare_toy_companion_2026-01-18T10-30-00.sql"
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Backup restaurado com sucesso"
}
```

**⚠️ AVISO CRÍTICO:** Esta operação **SOBRESCREVE** todos os dados atuais do banco de dados!

**Comportamento:**
- Limpa cache Redis após restauração
- Não cria backup automático (faça manualmente antes)

---

### DELETE `/api/admin/database/backup/:filename`

Deleta um backup do servidor.

**Autenticação:** ✅ Requerida (`authenticateAdmin`)

**Resposta:**
```json
{
  "success": true,
  "message": "Backup deletado com sucesso"
}
```

---

### GET `/api/admin/database/backup/download/:filename`

Faz download de um arquivo de backup.

**Autenticação:** ✅ Requerida (`authenticateAdmin`)

**Headers:**
```
Content-Type: application/sql
Content-Disposition: attachment; filename="backup_*.sql"
```

---

## 🖥️ Interface Web (Frontend)

### Componente: `DatabaseBackupManager`

**Localização:** `src/components/admin/DatabaseBackupManager.tsx`

**Funcionalidades:**
- ✅ Listagem de backups com informações detalhadas
- ✅ Formulário para criar backup com descrição opcional
- ✅ Botões de ação (Download, Restaurar, Deletar)
- ✅ Confirmações antes de ações críticas
- ✅ Feedback visual com toasts
- ✅ Loading states durante operações

**Componentes Utilizados:**
- `Card`, `CardContent`, `CardHeader`, `CardTitle`
- `Button`, `Input`, `Badge`
- `useToast` para notificações
- Ícones do `lucide-react`

---

## 🔒 Segurança

### Validações Implementadas

| Validação | Descrição |
|-----------|-----------|
| **Autenticação** | Todas as rotas requerem `authenticateAdmin` |
| **Validação de Arquivo** | Apenas arquivos `.sql` são aceitos |
| **Verificação de Existência** | Verifica se arquivo existe antes de operações |
| **Verificação de Tamanho** | Verifica se backup não está vazio |
| **Detecção de Erros** | Lê conteúdo do arquivo para detectar erros de acesso |
| **Sanitização** | Descrição do backup é sanitizada no nome do arquivo |

### Comandos SQL

Os comandos usam variável de ambiente `MYSQL_PWD` em vez de passar senha no comando, evitando exposição em logs e processos.

---

## 📁 Estrutura de Armazenamento

### Diretório de Backups

**Localização:** `/home/git-muhlstore/rare-toy-companion-final-8040/backups/`

**Formato de Nome:**
```
backup_{database_name}_{timestamp}[_{description}].sql
```

**Exemplo:**
```
backup_rare_toy_companion_2026-01-18T10-30-00.sql
backup_rare_toy_companion_2026-01-18T11-45-00_backup_antes_atualizacao.sql
```

**Permissões:**
- Diretório: `755` (rwxr-xr-x)
- Arquivos: `644` (rw-r--r--)

---

## 🔧 Configuração

### Variáveis de Ambiente

O módulo utiliza as mesmas variáveis de ambiente do pool MySQL:

```bash
MYSQL_HOST=127.0.0.1          # ou DB_HOST
MYSQL_PORT=3306               # ou DB_PORT
MYSQL_USER=root               # ou DB_USER
MYSQL_PASSWORD=***            # ou DB_PASSWORD
MYSQL_DATABASE=rare_toy_companion  # ou DB_NAME
```

### Criação do Diretório

O diretório `backups/` é criado automaticamente na inicialização do servidor:

```javascript
const BACKUP_DIR = path.join(__dirname, '../backups');
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}
```

---

## 🧪 Testes

### Teste Manual de Backup

```bash
#!/bin/bash
DB_NAME="${MYSQL_DATABASE:-rare_toy_companion}"
DB_USER="${MYSQL_USER:-root}"
DB_PASSWORD="${MYSQL_PASSWORD:-}"
DB_HOST="${MYSQL_HOST:-127.0.0.1}"
DB_PORT="${MYSQL_PORT:-3306}"
BACKUP_DIR="/home/git-muhlstore/rare-toy-companion-final-8040/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/test_backup_${TIMESTAMP}.sql"

export MYSQL_PWD="$DB_PASSWORD"
mysqldump -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" \
  --single-transaction --quick --lock-tables=false \
  "$DB_NAME" > "$BACKUP_FILE" 2>&1
```

**Resultado Esperado:**
```
✅ Backup criado com sucesso: test_backup_20260118_103309.sql (4.0K)
```

---

## 📊 Fluxo de Uso

### Criar Backup

```
1. Usuário acessa /admin/database-backup
2. Preenche descrição (opcional)
3. Clica em "Criar Backup Agora"
4. Frontend → POST /api/admin/database/backup
5. Backend executa mysqldump
6. Verifica criação e tamanho do arquivo
7. Retorna informações do backup criado
8. Frontend atualiza lista e mostra toast de sucesso
```

### Restaurar Backup

```
1. Usuário clica em "Restaurar" em um backup
2. Primeira confirmação: "Deseja restaurar?"
3. Segunda confirmação: "Confirmação final"
4. Frontend → POST /api/admin/database/restore
5. Backend executa mysql < backup.sql
6. Limpa cache Redis
7. Retorna sucesso
8. Frontend recarrega página após 2 segundos
```

---

## 🐛 Troubleshooting

### Problema: Backup retorna 404

**Causa:** Backend não carregou as rotas ou erro de sintaxe.

**Solução:**
```bash
pm2 restart muhlstore_api
pm2 logs muhlstore_api --lines 20
```

### Problema: Backup retorna erro de acesso

**Causa:** Credenciais MySQL incorretas ou usuário sem permissões.

**Solução:**
- Verificar variáveis de ambiente
- Verificar permissões do usuário MySQL
- Verificar se banco existe

### Problema: Backup criado está vazio

**Causa:** Banco de dados vazio ou erro no mysqldump.

**Solução:**
- Verificar conteúdo do banco
- Verificar logs do mysqldump
- Verificar permissões de escrita no diretório

### Problema: Erro "Identifier 'stats' has already been declared"

**Status:** ✅ Corrigido

**Causa:** Variável `stats` declarada duas vezes no código.

**Solução:** Removida segunda declaração duplicada.

---

## 📝 Logs e Debug

### Logs do Backend

```bash
# Ver logs em tempo real
pm2 logs muhlstore_api

# Ver últimas 50 linhas
pm2 logs muhlstore_api --lines 50

# Filtrar apenas erros
pm2 logs muhlstore_api --err --lines 20
```

### Mensagens de Log

**Sucesso:**
```
💾 Iniciando backup: backup_rare_toy_companion_2026-01-18T10-30-00.sql
📊 Banco: rare_toy_companion, Host: 127.0.0.1, Porta: 3306, User: root
✅ Backup criado: backup_rare_toy_companion_2026-01-18T10-30-00.sql (4.0 KB)
```

**Erro:**
```
❌ Erro ao criar backup: [mensagem de erro]
```

---

## 🔄 Histórico de Alterações

### Versão 1.0.0 (18/01/2026)

- ✅ Criação do módulo completo
- ✅ Endpoints de backup, restore, list, delete, download
- ✅ Interface web administrativa
- ✅ Validações e segurança
- ✅ Correção de erros de sintaxe
- ✅ Testes manuais realizados

---

## 🔗 Referências

- [Documentação MySQL mysqldump](https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html)
- [Documentação MariaDB Backup](https://mariadb.com/kb/en/mysqldump/)
- [React Router Docs](https://reactrouter.com/)

---

## 👤 Autor

**Sistema:** Rare Toy Companion - MuhlStore  
**Módulo Criado Em:** 18 de Janeiro de 2026  
**Última Atualização:** 18 de Janeiro de 2026

---

**Status do Módulo:** ✅ **PRODUÇÃO - FUNCIONANDO**
