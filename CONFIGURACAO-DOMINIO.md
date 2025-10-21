# 🌐 Configuração de Domínio - MuhlStore

## 📍 Domínio Configurado

**http://muhl.store.re9suainternet.com.br**

---

## 🏗️ Infraestrutura de Rede (NAT Duplo)

```
Internet (Público)
    ↓
177.67.32.55 (Roteador Externo)
    ↓ NAT 1
192.168.0.0/24
    ↓
192.168.1.2 (MikroTik)
    ↓ NAT 2
192.168.9.0/24
    ↓
192.168.9.100 (Servidor - Este equipamento)
    ↓
Serviços Locais
```

---

## 🔌 Redirecionamentos de Porta

| Porta Externa | → | Porta Interna | Serviço |
|---------------|---|---------------|---------|
| 8041 | → | 8041 | Aplicação Web |
| 3011 | → | 3011 | API Backend |
| 8022 | → | 22 | SSH |
| 80 | → | 80 | Nginx HTTP |
| 443 | → | 443 | Nginx HTTPS (futuro) |

---

## 🌐 Configuração Nginx

### **Arquivo:** `/etc/nginx/sites-available/muhlstore.conf`

**O que faz:**
- ✅ Proxy reverso para aplicação (porta 8041)
- ✅ Proxy reverso para API (porta 3011)
- ✅ Headers corretos para NAT duplo
- ✅ Real IP tracking através dos NATs
- ✅ Upload de arquivos até 100MB
- ✅ Cache de imagens
- ✅ Logs separados

---

## 🚀 Instalação e Configuração

### **Passo 1: Instalar Nginx (se necessário)**

```bash
apt update
apt install -y nginx
```

### **Passo 2: Configurar Nginx**

```bash
cd /srv/erp-muhlstore/rare-toy-companion-mirror
bash scripts/setup-nginx.sh
```

**Ou manualmente:**

```bash
# Copiar configuração
sudo cp nginx-muhlstore.conf /etc/nginx/sites-available/muhlstore.conf

# Criar symlink
sudo ln -s /etc/nginx/sites-available/muhlstore.conf /etc/nginx/sites-enabled/

# Remover default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Recarregar Nginx
sudo systemctl reload nginx
```

### **Passo 3: Verificar**

```bash
# Status do Nginx
systemctl status nginx

# Testar localmente
curl -I http://localhost/

# Testar via domínio (após DNS propagar)
curl -I http://muhl.store.re9suainternet.com.br
```

---

## 🔐 Configurar HTTPS/SSL (Recomendado)

### **Com Let's Encrypt (Gratuito):**

```bash
# Instalar certbot
apt install -y certbot python3-certbot-nginx

# Obter e configurar certificado
certbot --nginx -d muhl.store.re9suainternet.com.br

# O certbot vai:
# 1. Validar o domínio
# 2. Obter certificado SSL
# 3. Configurar HTTPS automaticamente
# 4. Configurar renovação automática
```

### **Renovação Automática:**

O certbot cria um cron automático. Verifique:

```bash
# Ver timers do certbot
systemctl list-timers | grep certbot

# Testar renovação
certbot renew --dry-run
```

---

## 📊 Fluxo de Requisições

### **Requisição para Aplicação:**

```
Cliente (Internet)
    ↓
http://muhl.store.re9suainternet.com.br
    ↓
177.67.32.55:80 (Roteador)
    ↓ NAT porta 80
192.168.1.2 (MikroTik)
    ↓ NAT porta 80
192.168.9.100:80 (Nginx)
    ↓ Proxy reverso
127.0.0.1:8041 (Aplicação)
```

### **Requisição para API:**

```
Cliente
    ↓
http://muhl.store.re9suainternet.com.br/api/...
    ↓
[Mesmo fluxo NAT]
    ↓
192.168.9.100:80 (Nginx)
    ↓ Proxy para /api/*
127.0.0.1:3011 (API Backend)
```

---

## 🔧 Solução de Problemas

### **Nginx não inicia**

```bash
# Ver logs de erro
sudo nginx -t
sudo journalctl -u nginx -n 50

# Verificar portas
sudo ss -tlnp | grep nginx
```

### **Domínio não acessa**

```bash
# 1. Verificar DNS
nslookup muhl.store.re9suainternet.com.br
dig muhl.store.re9suainternet.com.br

# 2. Verificar NATs
# No roteador 177.67.32.55:
#   - Porta 80 → 192.168.0.x:80
# No MikroTik 192.168.1.2:
#   - Porta 80 → 192.168.9.100:80

# 3. Testar localmente
curl -I http://localhost/
curl -I http://192.168.9.100/

# 4. Ver logs
tail -f /var/log/nginx/muhlstore-access.log
tail -f /var/log/nginx/muhlstore-error.log
```

### **API retorna 502**

```bash
# Verificar se API está rodando
pm2 list | grep rare-toy-api
curl http://localhost:3011/api/health

# Verificar logs
pm2 logs rare-toy-api --err
```

### **Upload de arquivos falha**

```bash
# Aumentar limite no Nginx
# Editar: /etc/nginx/sites-available/muhlstore.conf
# Linha: client_max_body_size 100M; (aumentar se necessário)

sudo nginx -t
sudo systemctl reload nginx
```

---

## 📝 Checklist de Configuração

- [ ] Nginx instalado
- [ ] Configuração copiada para `/etc/nginx/sites-available/`
- [ ] Symlink criado em `/etc/nginx/sites-enabled/`
- [ ] Configuração testada (`nginx -t`)
- [ ] Nginx recarregado
- [ ] DNS do domínio apontando para 177.67.32.55
- [ ] NAT 1: Porta 80 configurada no roteador externo
- [ ] NAT 2: Porta 80 configurada no MikroTik
- [ ] Firewall liberado (se houver)
- [ ] Testado localmente
- [ ] Testado via domínio
- [ ] SSL/HTTPS configurado (opcional mas recomendado)

---

## 🌐 URLs Finais

Após configuração completa:

- **HTTP:** http://muhl.store.re9suainternet.com.br
- **HTTPS:** https://muhl.store.re9suainternet.com.br (após SSL)
- **phpMyAdmin:** http://muhl.store.re9suainternet.com.br:8082
- **API Direta:** http://muhl.store.re9suainternet.com.br:3011

---

## 📞 Comandos de Manutenção

```bash
# Ver status
systemctl status nginx

# Recarregar configuração
systemctl reload nginx

# Reiniciar Nginx
systemctl restart nginx

# Testar configuração
nginx -t

# Ver logs em tempo real
tail -f /var/log/nginx/muhlstore-access.log

# Ver apenas erros
tail -f /var/log/nginx/muhlstore-error.log

# Limpar logs antigos
> /var/log/nginx/muhlstore-access.log
> /var/log/nginx/muhlstore-error.log
```

---

## 🔐 Segurança

### **Headers Configurados:**
- ✅ X-Frame-Options (proteção contra clickjacking)
- ✅ X-Content-Type-Options (proteção MIME)
- ✅ X-XSS-Protection (proteção XSS)
- ✅ Real IP tracking (através dos NATs)

### **Recomendações Adicionais:**

1. **Configurar SSL/HTTPS** (Let's Encrypt gratuito)
2. **Configurar rate limiting** (proteção contra DDoS)
3. **Configurar firewall** (UFW ou iptables)
4. **Habilitar logs detalhados** durante testes
5. **Configurar backup dos logs**

---

## 💡 Próximos Passos Sugeridos

1. ✅ Instalar e configurar Nginx
2. ✅ Testar acesso local
3. ⏳ Configurar DNS (se ainda não estiver)
4. ⏳ Configurar NATs nos roteadores
5. ⏳ Testar acesso via domínio
6. ⏳ Configurar SSL com Let's Encrypt
7. ⏳ Configurar renovação automática SSL

---

**Criado em:** 21 de Outubro de 2025  
**Status:** Configuração pronta para instalação

