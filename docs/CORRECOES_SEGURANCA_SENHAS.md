# 🔒 Correções de Segurança - Remoção de Senhas Hardcoded

**Data:** 11 de Janeiro de 2025  
**Prioridade:** 🔴 CRÍTICA  
**Status:** ✅ CONCLUÍDA

---

## 📋 Problema Identificado

Foram encontradas **senhas hardcoded** nos seguintes arquivos:

1. ❌ `ecosystem.config.cjs` - Linha 16: `MYSQL_PASSWORD: "RSM_Rg51gti66"` ✅ CORRIGIDO
2. ❌ `docker-compose.yml` - Linhas 7 e 10: Senhas expostas ✅ CORRIGIDO
3. ❌ `test-insert.js` - Linha 12: `password: 'RSM_Rg51gti66'` ✅ CORRIGIDO
4. ❌ `server/test-api.cjs` - Linha 13: Senha hardcoded ✅ CORRIGIDO

### Riscos

- 🔴 **CRÍTICO:** Senhas expostas no repositório Git
- 🔴 Qualquer pessoa com acesso ao código pode ver as credenciais
- 🔴 Senhas podem estar no histórico do Git permanentemente
- 🔴 Violação de boas práticas de segurança

---

## ✅ Correções Aplicadas

### 1. ecosystem.config.cjs

**ANTES:**
```javascript
env: {
  MYSQL_PASSWORD: "RSM_Rg51gti66",  // ❌ SENHA EXPOSTA
  ...
}
```

**DEPOIS:**
```javascript
env: {
  // SECURITY: Nunca hardcodar senhas! Use variáveis de ambiente
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
  ...
}
```

### 2. docker-compose.yml

**ANTES:**
```yaml
environment:
  MYSQL_ROOT_PASSWORD: RSM_Rg51gti66  # ❌ SENHA EXPOSTA
  MYSQL_PASSWORD: RSM_Rg51gti66       # ❌ SENHA EXPOSTA
```

**DEPOIS:**
```yaml
environment:
  # SECURITY: Use variáveis de ambiente ou Docker secrets em produção
  MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-changeme_in_production}
  MYSQL_PASSWORD: ${MYSQL_PASSWORD:-changeme_in_production}
```

### 3. env.example Atualizado

Adicionadas todas as variáveis de ambiente necessárias para MySQL:

```bash
MYSQL_HOST=127.0.0.1
MYSQL_USER=root
MYSQL_PASSWORD=sua_senha_aqui
MYSQL_DATABASE=rare_toy_companion
MYSQL_PORT=3306
MYSQL_ROOT_PASSWORD=sua_senha_root_aqui
```

---

## 🚨 Ações Imediatas Necessárias

### ⚠️ IMPORTANTE: Rotacionar Senhas no Banco

Como as senhas estavam expostas no código, **é CRÍTICO rotacionar as senhas**:

```sql
-- 1. Conectar ao MySQL
mysql -u root -p

-- 2. Criar nova senha forte
ALTER USER 'root'@'localhost' IDENTIFIED BY 'NOVA_SENHA_FORTE_AQUI';
ALTER USER 'rare_toy_user'@'%' IDENTIFIED BY 'NOVA_SENHA_FORTE_AQUI';

-- 3. Verificar usuários
SELECT user, host FROM mysql.user WHERE user IN ('root', 'rare_toy_user');

-- 4. Atualizar .env com as novas senhas
```

### Passos para Configuração

1. **Copiar env.example para .env**
   ```bash
   cp env.example .env
   ```

2. **Editar .env e definir senhas**
   ```bash
   nano .env
   # Ou use seu editor preferido
   ```

3. **Configurar variáveis no .env**
   ```bash
   MYSQL_PASSWORD=nova_senha_forte_aqui
   MYSQL_ROOT_PASSWORD=nova_senha_root_forte_aqui
   ```

4. **Verificar que .env está no .gitignore**
   ```bash
   # Já está configurado ✅
   ```

5. **Reiniciar serviços**
   ```bash
   # Se usando Docker
   docker-compose down
   docker-compose up -d
   
   # Se usando PM2
   pm2 restart all
   ```

---

## 🔍 Verificação de Segurança

### Checklist

- [x] Removidas senhas hardcoded de `ecosystem.config.cjs`
- [x] Removidas senhas hardcoded de `docker-compose.yml`
- [x] Atualizado `env.example` com todas as variáveis
- [x] Verificado que `.env` está no `.gitignore`
- [ ] **PENDENTE:** Rotacionar senhas no banco de dados
- [ ] **PENDENTE:** Atualizar `.env` com novas senhas
- [ ] **PENDENTE:** Verificar histórico do Git (se necessário)

---

## 📝 Verificar Histórico do Git (Opcional)

Se as senhas foram commitadas no Git, você pode querer removê-las do histórico:

⚠️ **ATENÇÃO:** Isso reescreve o histórico do Git. Use apenas se necessário e com cuidado.

```bash
# 1. Verificar se há senhas no histórico
git log --all --full-history --source -- "**/ecosystem.config.cjs" "**/docker-compose.yml"

# 2. Se necessário, usar git-filter-repo para remover
# (Requer instalação: pip install git-filter-repo)
git-filter-repo --invert-paths --path ecosystem.config.cjs
git-filter-repo --replace-text <(echo 'RSM_Rg51gti66==>REMOVED')

# 3. Force push (APENAS se repositório privado e coordenado com equipe)
# git push --force --all
```

**Recomendação:** Se o repositório é público ou compartilhado, considere rotacionar todas as senhas e ignorar a limpeza do histórico (mais seguro).

---

## ✅ Boas Práticas Implementadas

### 1. Variáveis de Ambiente
- ✅ Todas as senhas agora vêm de variáveis de ambiente
- ✅ Valores padrão seguros (vazios ou placeholders)
- ✅ Documentação clara no `env.example`

### 2. Segurança
- ✅ Nenhuma senha no código-fonte
- ✅ `.env` já estava no `.gitignore`
- ✅ Comentários de segurança adicionados

### 3. Docker
- ✅ Uso de variáveis de ambiente
- ✅ Fallback seguro para desenvolvimento local
- ✅ Pronto para usar Docker secrets em produção

---

## 🔄 Migração em Produção

### Para Servidor de Produção

1. **Backup do banco antes de mudar senhas**
   ```bash
   mysqldump -u root -p rare_toy_companion > backup_antes_mudanca.sql
   ```

2. **Criar novo usuário com senha forte**
   ```sql
   CREATE USER 'rare_toy_prod'@'localhost' IDENTIFIED BY 'SENHA_FORTE_AQUI';
   GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_prod'@'localhost';
   FLUSH PRIVILEGES;
   ```

3. **Atualizar .env no servidor**
   ```bash
   ssh usuario@servidor
   cd /caminho/do/projeto
   nano .env
   # Atualizar MYSQL_PASSWORD e MYSQL_ROOT_PASSWORD
   ```

4. **Testar conexão**
   ```bash
   npm run mysql:test
   ```

5. **Reiniciar serviços**
   ```bash
   pm2 restart all
   ```

6. **Verificar logs**
   ```bash
   pm2 logs api --lines 50
   ```

---

## 📚 Referências

- [OWASP - Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [12 Factor App - Config](https://12factor.net/config)
- [Docker Secrets](https://docs.docker.com/engine/swarm/secrets/)

---

## ✅ Conclusão

As correções foram aplicadas com sucesso. **É CRÍTICO** que você:

1. ✅ Rotacione as senhas no banco de dados
2. ✅ Configure o arquivo `.env` com as novas senhas
3. ✅ Teste a aplicação após as mudanças
4. ✅ Documente as novas credenciais em local seguro (não no código!)

---

**Última atualização:** 11 de Janeiro de 2025  
**Próxima revisão:** Após rotacionar senhas

