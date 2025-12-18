# 📁 Scripts - Rare Toy Companion

Esta pasta contém todos os scripts utilitários do projeto, organizados por categoria.

## 📂 Estrutura

```
scripts/
├── database/        # Scripts de banco de dados
│   ├── migrate-*.cjs
│   ├── backup-*.sh
│   └── optimize-*.cjs
│
├── deploy/          # Scripts de deploy
│   ├── deploy-*.sh
│   └── sync-*.sh
│
├── admin/           # Scripts administrativos
│   ├── add-admin.cjs
│   ├── create-user.cjs
│   └── update-*.cjs
│
├── test/            # Scripts de teste
│   ├── test-*.cjs
│   └── test-*.js
│
├── maintenance/     # Scripts de manutenção
│   ├── cleanup.sh
│   ├── optimize-*.js
│   └── fix-*.cjs
│
└── utils/           # Scripts utilitários
    └── COMANDOS_UTEIS.sh
```

## 🗂️ Categorias

### Database (`database/`)
Scripts relacionados ao banco de dados MySQL:
- Migrações de schema
- Backups e restaurações
- Otimizações e análises
- Testes de conexão

**Exemplos:**
```bash
# Executar migração
node scripts/database/migrate-database.cjs

# Fazer backup
bash scripts/database/backup.sh

# Testar conexão
node scripts/database/test-mysql-connection.js
```

### Deploy (`deploy/`)
Scripts para deploy e sincronização:
- Deploy para produção
- Sincronização com servidor
- Builds de produção
- Configuração Docker

**Exemplos:**
```bash
# Deploy completo
bash scripts/deploy/deploy-completo.sh

# Sincronizar com servidor
bash scripts/deploy/sync-to-server.sh
```

### Admin (`admin/`)
Scripts administrativos:
- Gerenciamento de usuários admin
- Criação de usuários
- Atualização de senhas
- Gerenciamento de clientes

**Exemplos:**
```bash
# Adicionar admin
node scripts/admin/add-admin.cjs

# Criar usuário
node scripts/admin/create-user.cjs
```

### Test (`test/`)
Scripts de teste e validação:
- Testes de endpoints
- Testes de fluxos completos
- Testes de integração
- Validação de funcionalidades

**Exemplos:**
```bash
# Testar sistema de endereços
node scripts/test/test-address-system.cjs

# Testar fluxo completo
node scripts/test/test-complete-flow.cjs
```

### Maintenance (`maintenance/`)
Scripts de manutenção e otimização:
- Limpeza de arquivos
- Otimização de build
- Correções de bugs
- Sincronizações

**Exemplos:**
```bash
# Limpar projeto
bash scripts/maintenance/cleanup.sh

# Otimizar build
node scripts/maintenance/optimize-build.js
```

### Utils (`utils/`)
Scripts utilitários gerais:
- Comandos úteis
- Helpers diversos

## 🚀 Como Usar

### Executar um script

```bash
# Scripts Node.js
node scripts/categoria/nome-script.cjs

# Scripts Bash
bash scripts/categoria/nome-script.sh
```

### Organizar scripts

Se você adicionar novos scripts, organize-os nas pastas apropriadas:

```bash
# Executar script de organização (se necessário)
bash scripts/organize-scripts.sh
```

## 📝 Convenções

1. **Nomenclatura:**
   - Scripts Node.js: `kebab-case.cjs` ou `kebab-case.js`
   - Scripts Bash: `kebab-case.sh`

2. **Shebang:**
   - Scripts Bash devem começar com `#!/bin/bash`
   - Scripts Node.js não precisam de shebang

3. **Documentação:**
   - Adicione comentários explicando o que o script faz
   - Documente parâmetros e uso

4. **Organização:**
   - Mantenha scripts relacionados na mesma categoria
   - Evite duplicação de funcionalidade

## 🔍 Encontrar Scripts

```bash
# Listar todos os scripts
find scripts -type f -name "*.cjs" -o -name "*.js" -o -name "*.sh"

# Buscar por nome
find scripts -name "*admin*"

# Buscar por categoria
ls scripts/database/
```

## ⚠️ Notas Importantes

- Sempre teste scripts em ambiente de desenvolvimento primeiro
- Alguns scripts podem precisar de permissões especiais
- Verifique as dependências antes de executar
- Mantenha backups antes de executar scripts destrutivos

---

**Última atualização:** 2025-01-11
