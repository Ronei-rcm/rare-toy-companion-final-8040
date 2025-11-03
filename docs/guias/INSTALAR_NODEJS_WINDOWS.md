# 📦 Como Instalar Node.js no Windows

## ⚠️ Erro: 'npm' não é reconhecido

Este erro significa que o **Node.js** não está instalado no seu Windows.

---

## 🎯 Solução: Instalar Node.js

### Método 1: Download Oficial (Recomendado)

1. **Acesse:** https://nodejs.org/

2. **Baixe a versão LTS** (Long Term Support)
   - Escolha: **"Windows Installer (.msi)"**
   - Tamanho: ~30MB

3. **Execute o instalador**
   - Marque: "Automatically install the necessary tools"
   - Clique: "Next" até finalizar

4. **Reinicie o PowerShell/Terminal**

5. **Verifique instalação:**
   ```powershell
   node --version
   npm --version
   ```

### Método 2: Via Winget (Windows Package Manager)

```powershell
winget install OpenJS.NodeJS.LTS
```

### Método 3: Via Chocolatey

Se você tem Chocolatey instalado:
```powershell
choco install nodejs-lts
```

---

## ✅ Após Instalar Node.js

### 1. Reiniciar o PowerShell
```powershell
exit
# Abrir novo PowerShell como Administrador
```

### 2. Verificar versão
```powershell
node --version
# Deve mostrar: v20.x.x ou similar

npm --version
# Deve mostrar: 10.x.x ou similar
```

### 3. Navegar até a pasta do projeto
```powershell
cd C:\BKP-GIT\rare-toy-companion-final-8040-ver01\rare-toy-companion-final-8040
```

### 4. Instalar dependências
```powershell
npm install
```

---

## 🎯 Comandos Após Instalação

```powershell
# 1. Navegar até o projeto
cd C:\BKP-GIT\rare-toy-companion-final-8040-ver01\rare-toy-companion-final-8040

# 2. Instalar dependências
npm install

# 3. Criar .env
Copy-Item env.example .env

# 4. Iniciar desenvolvimento
npm run dev
```

---

## ⚙️ Configuração do Projeto

### 1. Configurar Banco de Dados

Edite o arquivo `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=muhlstore
```

### 2. Iniciar MySQL

Certifique-se que o MySQL está rodando no Windows.

---

## 📝 Versões Recomendadas

| Ferramenta | Versão | Link |
|------------|--------|------|
| **Node.js** | 20.x LTS | https://nodejs.org/ |
| **npm** | 10.x | Vem com Node.js |
| **Git** | 2.40+ | https://git-scm.com/download/win |

---

## 🔧 Solução de Problemas

### Node.js não reconhecido após instalação

1. **Fechar e reabrir o PowerShell**
2. **Verificar PATH:**
   ```powershell
   $env:Path -split ';' | Select-String -Pattern 'nodejs'
   ```

3. **Adicionar manualmente ao PATH** (se necessário):
   - Pressione `Win + R`
   - Digite: `sysdm.cpl`
   - Aba "Avançado" > "Variáveis de Ambiente"
   - Adicionar: `C:\Program Files\nodejs\`

### npm muito lento

```powershell
# Usar registry do Brasil
npm config set registry https://registry.npmjs.org/

# Ou usar taobao
npm config set registry https://registry.npmmirror.com/
```

---

## ✅ Verificação Final

Após instalar, execute:
```powershell
node --version   # Deve mostrar a versão
npm --version    # Deve mostrar a versão
npm install      # Deve funcionar agora!
```

---

## 🎯 Próximos Passos

1. Instalar Node.js
2. Reiniciar PowerShell
3. `npm install` na pasta do projeto
4. Configurar `.env`
5. `npm run dev` para iniciar

---

**Download Direto:** https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi


