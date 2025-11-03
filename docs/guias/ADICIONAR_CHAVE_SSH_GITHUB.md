# 🔑 Como Adicionar Chave SSH no GitHub

## 📋 Sua Chave SSH Pública

Copie a chave abaixo e adicione no GitHub:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDZWkgHonSGjUr2FRbtKcHSA+GrazyOPrS9zvmRYnkddr09rNURtQ6l1R7LMNTVgrPNlp2mC7iNLeuQc2Lp5AoV90iWMjubaez1AkDyHB3O/pAxsIgSEsVM/lBeOgTPqwJct/a9b/eeqS3u7VIqafk8E5oaxj5ChXoI/xond0mEHGvqnljpuwg+rFU7l3XETqQ+OPMw4hjqYhvYyyNi/dot8KpbeDOSYVTr+Wh8o0vUtSMunhZPeh8vIG9W5hxuo096TD11i71SuuCVN/0+9n1bdYwq7HNZH6bv9g8i5bIfQTOEImPLYclOFCy28a8fT6BFgsG72kTxTvVPiI+0Nd86+SvOL9cLR2DdlIi54aymp6xXZeGk2Tz8uXuUOo0a6k6nS18n6CTyq1GE7nPltYDGJyNlQSUeFYLQU3ve7pJitJib5EMfLJUDMcbqVLdGG6u6915CXCRMiA87BqoZfReynlbvUTtHG+vZh2f1ej+p15TNSGCR/hGDxHFrWH+NzYsTQUlMSr0cQtPE6aDVdlMlO9Nio/d0wdshLnvbYEipqcXhGz2S43qYTWocKq9dJUtuEtSsP6GMoC18KK8XxefJqxEWUeKG2/aYTAZtdcntdSeQcpP1Z/LumY0w12OqQXQEh2naZeBgm/gSTAxWHAW2BJPUHbZGxzHs/bKw4PuLGQ== ansible-generated on Nav-Doc
```

## 📝 Passo a Passo

### 1. Acesse o GitHub
- Vá para: https://github.com/settings/keys
- Ou: GitHub → Settings → SSH and GPG keys

### 2. Clique em "New SSH key"
- Título: `Rare Toy Companion - Servidor` (ou qualquer nome que você preferir)
- Tipo: `Authentication Key`

### 3. Cole a chave pública
- Cole a chave completa (começa com `ssh-rsa` e termina com `ansible-generated...`)
- Clique em "Add SSH key"

### 4. Verifique
- O GitHub pode pedir sua senha para confirmar
- A chave aparecerá na lista de SSH keys

## ✅ Testar a Conexão

Após adicionar a chave, execute:

```bash
ssh -T git@github.com
```

Se funcionar, você verá:
```
Hi Ronei-rcm! You've successfully authenticated, but GitHub does not provide shell access.
```

## 🚀 Fazer Push

Depois de configurar, execute:

```bash
cd /home/git-muhlstore/rare-toy-companion-final-8040
git push --set-upstream origin master
```

## ⚠️ Problemas Comuns

### Permission denied
- Verifique se a chave foi adicionada corretamente
- Certifique-se de copiar a chave COMPLETA (toda a linha)
- Verifique se está usando a conta correta do GitHub

### Chave já existe
- Se você já tem uma chave SSH no GitHub, pode usar ela
- Ou adicione uma nova chave com um nome diferente

## 📞 Precisa de Ajuda?

Se tiver problemas:
1. Verifique se a chave foi copiada completamente
2. Tente gerar uma nova chave SSH (se necessário)
3. Verifique se tem permissão no repositório

---

**Status:** Remote já configurado para SSH ✅  
**Próximo passo:** Adicionar chave no GitHub e fazer push

