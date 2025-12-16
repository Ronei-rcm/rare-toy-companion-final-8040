# 🚀 Guia de Configuração CI/CD

**Data:** 11 de Janeiro de 2025  
**Status:** ✅ Configurado

---

## 📋 Visão Geral

O projeto agora possui **CI/CD automatizado** usando GitHub Actions. O pipeline executa automaticamente:

- ✅ Lint e formatação de código
- ✅ Testes automatizados
- ✅ Build de produção
- ✅ Verificações de segurança
- ✅ Deploy (configurável)

---

## 🔧 Arquivos Configurados

### 1. `.github/workflows/ci.yml`

**Pipeline principal** que executa em:
- Push para `main`, `develop`, `master`
- Pull Requests para essas branches

**Jobs incluídos:**
1. **Lint** - Verifica qualidade do código
2. **Test** - Executa testes (Node 18.x e 20.x)
3. **Build** - Gera build de produção
4. **Security** - Verifica segurança
5. **Deploy** - Deploy automático (apenas main)

### 2. `.github/workflows/security-scan.yml`

**Scan de segurança** que executa:
- Toda segunda-feira às 9h UTC
- Em push/PR para branches principais

**Verificações:**
- NPM Audit
- Busca por senhas/secrets hardcoded
- Verificação de arquivos sensíveis no Git
- Validação do `.gitignore`

### 3. `.github/PULL_REQUEST_TEMPLATE.md`

**Template padrão** para Pull Requests com checklist de qualidade.

---

## ✅ O Que Está Funcionando

### Automático
- ✅ Lint em todo push/PR
- ✅ Testes em múltiplas versões do Node
- ✅ Build de produção
- ✅ Verificação de segurança básica

### Manual (Configurar)
- ⏳ Deploy automático (descomente no workflow)
- ⏳ Codecov (opcional)
- ⏳ Notificações Slack/Email

---

## 🔧 Como Usar

### 1. Ver Status dos Workflows

```bash
# No GitHub, vá para:
# Actions > Workflows
```

Ou via GitHub CLI:
```bash
gh workflow list
gh run list
```

### 2. Executar Workflow Manualmente

No GitHub:
1. Vá para **Actions**
2. Selecione o workflow
3. Clique em **Run workflow**

### 3. Ver Logs

```bash
# Via GitHub CLI
gh run watch

# Ver último run
gh run view --log
```

---

## 🚀 Configurar Deploy Automático

### Opção 1: Deploy via SSH

1. **Adicionar Secrets no GitHub:**
   - Vá em: Settings > Secrets and variables > Actions
   - Adicione:
     - `DEPLOY_HOST` - IP/hostname do servidor
     - `DEPLOY_USER` - Usuário SSH
     - `DEPLOY_SSH_KEY` - Chave SSH privada

2. **Descomentar no `.github/workflows/ci.yml`:**
   ```yaml
   - name: 🚀 Deploy para servidor
     uses: appleboy/scp-action@master
     with:
       host: ${{ secrets.DEPLOY_HOST }}
       # ...
   ```

### Opção 2: Deploy via PM2

Se já tem PM2 no servidor:

```yaml
- name: 🔄 Restart PM2
  uses: appleboy/ssh-action@master
  with:
    host: ${{ secrets.DEPLOY_HOST }}
    username: ${{ secrets.DEPLOY_USER }}
    key: ${{ secrets.DEPLOY_SSH_KEY }}
    script: |
      cd /var/www/muhlstore
      pm2 restart all
```

### Opção 3: Deploy via Docker

```yaml
- name: 🐳 Build e Push Docker
  run: |
    docker build -t muhlstore:latest .
    docker push muhlstore:latest
```

---

## 🔒 Secrets Necessários

### Para Deploy

| Secret | Descrição | Onde Obter |
|--------|-----------|------------|
| `DEPLOY_HOST` | IP/hostname do servidor | Seu servidor |
| `DEPLOY_USER` | Usuário SSH | Seu servidor |
| `DEPLOY_SSH_KEY` | Chave SSH privada | `~/.ssh/id_rsa` |

### Como Adicionar Secrets

1. Vá em: **Settings** > **Secrets and variables** > **Actions**
2. Clique em **New repository secret**
3. Adicione nome e valor
4. Salve

---

## 📊 Badges (Opcional)

Adicione ao README.md:

```markdown
![CI/CD](https://github.com/seu-usuario/rare-toy-companion-final-8040/workflows/CI%2FCD%20Pipeline/badge.svg)
![Security](https://github.com/seu-usuario/rare-toy-companion-final-8040/workflows/%F0%9F%94%92%20Security%20Scan/badge.svg)
```

---

## 🐛 Troubleshooting

### Workflow Falha no Lint

```bash
# Executar lint localmente
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

### Workflow Falha nos Testes

```bash
# Executar testes localmente
npm test

# Ver cobertura
npm run test:coverage
```

### Security Scan Encontra False Positives

Edite `.github/workflows/security-scan.yml` e adicione exceções:

```yaml
grep -v "arquivo_que_pode_ter_padrao_similar"
```

### Deploy Não Funciona

1. Verificar secrets configurados
2. Verificar conectividade SSH
3. Verificar permissões do usuário
4. Verificar caminho de destino

---

## 📈 Próximos Passos

### Melhorias Futuras

- [ ] Adicionar testes E2E no CI
- [ ] Integrar com Codecov
- [ ] Notificações Slack/Email
- [ ] Deploy em staging automático
- [ ] Rollback automático em caso de erro

### Integrações Opcionais

- [ ] **Sentry** - Tracking de erros
- [ ] **Codecov** - Coverage reports
- [ ] **Dependabot** - Atualizações automáticas
- [ ] **SonarCloud** - Análise de código

---

## 📚 Referências

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Security Best Practices](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

**Última Atualização:** 11 de Janeiro de 2025  
**Status:** ✅ CI/CD Básico Configurado e Funcional

