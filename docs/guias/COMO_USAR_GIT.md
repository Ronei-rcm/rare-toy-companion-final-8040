# 📝 Como Usar Git - Guia Rápido

## ✅ Seu Último Commit

**Hash:** `422c618`  
**Data:** 26 de Outubro de 2025 - 13:54  
**Mensagem:** `fix: Corrigir todos os erros críticos da aplicação`  
**Arquivos:** 198 arquivos modificados (38.197 inserções, 4.207 deleções)

---

## 🔧 Comandos Git Essenciais

### 1️⃣ Ver Status (arquivos modificados)
```bash
git status
```

### 2️⃣ Adicionar Mudanças
```bash
# Adicionar TODOS os arquivos modificados
git add -A

# OU adicionar arquivos específicos
git add nome-do-arquivo.txt
```

### 3️⃣ Fazer Commit
```bash
git commit -m "mensagem do commit"
```

**Exemplos de Mensagens:**
```bash
git commit -m "fix: Corrigir erro de login"
git commit -m "feat: Adicionar nova funcionalidade X"
git commit -m "style: Ajustar formatação do código"
git commit -m "docs: Atualizar README"
```

### 4️⃣ Ver Histórico
```bash
# Últimos 10 commits
git log --oneline -10

# Ver detalhes de um commit específico
git show 422c618
```

### 5️⃣ Enviar para GitHub
```bash
# Enviar para o repositório remoto
git push origin master

# OU se estiver no branch main
git push origin main
```

---

## 📋 Exemplo Completo

```bash
# 1. Ver o que foi modificado
git status

# 2. Adicionar arquivos
git add -A

# 3. Fazer commit
git commit -m "fix: Corrigir problema do banner"

# 4. Enviar para GitHub
git push origin master
```

---

## 🎯 Prefixos de Commit (Boas Práticas)

| Prefixo | Uso |
|---------|-----|
| `fix:` | Correção de bug |
| `feat:` | Nova funcionalidade |
| `refactor:` | Refatoração de código |
| `docs:` | Documentação |
| `style:` | Formatação (não altera lógica) |
| `test:` | Testes |
| `chore:` | Tarefas de manutenção |

---

## 📊 Status Atual do Repositório

```bash
# Branches
$ git branch
* master

# Status
$ git status
On branch master
nothing to commit, working tree clean

# Último commit
$ git log -1
commit 422c618
Author: roneinetslim
Date: Sun Oct 26 13:54:40 2025
Message: fix: Corrigir todos os erros críticos da aplicação
```

---

## 🚀 Seu Próximo Commit

Quando fizer novas alterações:

```bash
# 1. Ver mudanças
git status

# 2. Adicionar
git add -A

# 3. Commit
git commit -m "sua mensagem aqui"

# 4. Push (se quiser enviar para GitHub)
git push origin master
```

---

## 💡 Dica

Para ver mudanças antes de commitar:
```bash
git diff                    # Ver diferenças
git diff arquivo.txt        # Ver mudanças em um arquivo específico
```

---

**Repositório:** https://github.com/Ronei-rcm/rare-toy-companion-final-8040  
**Branch Ativo:** master  
**Último Commit:** `422c618`

