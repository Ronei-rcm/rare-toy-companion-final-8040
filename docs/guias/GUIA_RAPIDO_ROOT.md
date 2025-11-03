# 🚀 GUIA RÁPIDO - INSTALAÇÃO COMO ROOT

## ❌ **PROBLEMA IDENTIFICADO:**
Você está executando como **root**, mas o script original `install.sh` foi projetado para usuários normais.

## ✅ **SOLUÇÃO:**
Criei um script especial para root: `install-root.sh`

---

## 🔧 **COMO EXECUTAR AGORA:**

### **Opção 1: Usar o Script Root (Recomendado)**
```bash
# No diretório onde você extraiu o pacote
./install-root.sh
```

### **Opção 2: Executar como Usuário Normal**
```bash
# Criar um usuário normal
adduser muhlstore
usermod -aG sudo muhlstore

# Trocar para o usuário
su - muhlstore

# Executar o script original
./install.sh
```

### **Opção 3: Usar o Script Original com Sudo**
```bash
# Modificar o script para aceitar root
sed -i 's/if \[\[ $EUID -eq 0 \]\]; then/#if \[\[ $EUID -eq 0 \]\]; then/' install.sh
sed -i 's/exit 1/#exit 1/' install.sh
sed -i 's/fi/#fi/' install.sh

# Executar
./install.sh
```

---

## 🎯 **RECOMENDAÇÃO: Use install-root.sh**

O script `install-root.sh` foi especialmente criado para:
- ✅ Funcionar como root
- ✅ Instalar tudo automaticamente
- ✅ Configurar PM2 para root
- ✅ Configurar Nginx corretamente
- ✅ Instalar MySQL adequadamente

---

## 📋 **PASSOS PARA EXECUTAR:**

### **1. Verificar que você está no diretório correto:**
```bash
pwd
# Deve mostrar: /home/releases/muhlstore_production_2.0_20251010_151540
```

### **2. Verificar que o script existe:**
```bash
ls -la install-root.sh
# Deve mostrar o arquivo com permissão de execução
```

### **3. Executar a instalação:**
```bash
./install-root.sh
```

---

## 🚀 **O QUE O SCRIPT VAI FAZER:**

1. ✅ **Instalar Node.js LTS** via NodeSource
2. ✅ **Instalar PM2** globalmente
3. ✅ **Instalar Nginx** e configurar proxy
4. ✅ **Instalar MySQL** e configurar
5. ✅ **Instalar dependências** do projeto
6. ✅ **Configurar ambiente** (.env)
7. ✅ **Fazer build** do projeto
8. ✅ **Iniciar serviços** com PM2

---

## ⚠️ **IMPORTANTE - APÓS A INSTALAÇÃO:**

### **Configurar MySQL:**
```bash
mysql -u root -p < /tmp/mysql_setup.sql
```

### **Verificar Status:**
```bash
pm2 list
systemctl status nginx
systemctl status mysql
```

### **Verificar Aplicação:**
- Frontend: http://localhost:5173
- API: http://localhost:3001
- Nginx: http://localhost

---

## 🔍 **SE DER PROBLEMA:**

### **Verificar Logs:**
```bash
pm2 logs
journalctl -u nginx
journalctl -u mysql
```

### **Reiniciar Serviços:**
```bash
pm2 restart all
systemctl restart nginx
systemctl restart mysql
```

### **Verificar Portas:**
```bash
netstat -tlnp | grep :3001
netstat -tlnp | grep :5173
netstat -tlnp | grep :80
```

---

## 🎊 **EXECUTE AGORA:**

```bash
./install-root.sh
```

**Boa sorte! 🚀**
