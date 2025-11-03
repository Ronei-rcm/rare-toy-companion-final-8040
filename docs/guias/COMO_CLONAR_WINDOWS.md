# 🪟 Como Clonar o Projeto no Windows

## 📋 Pré-requisitos

1. **Git instalado no Windows**
   - Baixar: https://git-scm.com/download/win
   - Ou usar: `winget install Git.Git`

2. **GitHub CLI (opcional)**
   - Baixar: https://cli.github.com/

---

## 🎯 Método 1: Via Git Bash (Recomendado)

### Passo a Passo

1. **Abra o Git Bash** (clicando com botão direito na pasta desejada)

2. **Navegue até o diretório**
   ```bash
   cd /c/BKP-GIT
   ```

3. **Clone o repositório**
   ```bash
   git clone https://github.com/Ronei-rcm/rare-toy-companion-final-8040.git
   ```

4. **Entre no diretório**
   ```bash
   cd rare-toy-companion-final-8040
   ```

5. **Instale as dependências**
   ```bash
   npm install
   ```

6. **Copie o .env**
   ```bash
   cp env.example .env
   ```

7. **Configure o .env** com suas credenciais do banco de dados

8. **Inicie o projeto**
   ```bash
   npm run dev
   ```

---

## 🎯 Método 2: Via PowerShell

### Comandos no PowerShell

```powershell
# 1. Navegar até o diretório
cd C:\BKP-GIT

# 2. Clonar repositório
git clone https://github.com/Ronei-rcm/rare-toy-companion-final-8040.git

# 3. Entrar na pasta
cd rare-toy-companion-final-8040

# 4. Instalar dependências
npm install

# 5. Copiar .env
Copy-Item env.example .env

# 6. Iniciar projeto
npm run dev
```

---

## 🎯 Método 3: Via GitHub Desktop

1. **Instalar GitHub Desktop**
   - https://desktop.github.com/

2. **Abrir GitHub Desktop**

3. **File > Clone Repository**

4. **URL:** `https://github.com/Ronei-rcm/rare-toy-companion-final-8040`

5. **Local Path:** `C:\BKP-GIT`

6. **Clone**

---

## 🎯 Método 4: Download ZIP

1. **Acessar:**
   https://github.com/Ronei-rcm/rare-toy-companion-final-8040

2. **Clicar em "Code" > "Download ZIP"**

3. **Extrair em:**
   `C:\BKP-GIT\rare-toy-companion-final-8040`

4. **Instalar dependências:**
   ```powershell
   cd C:\BKP-GIT\rare-toy-companion-final-8040
   npm install
   ```

---

## 🎯 Método 5: Usar o Backup ZIP (Criado no Servidor)

Se você tem acesso ao servidor, pode baixar o backup que acabamos de criar:

### No Servidor
```bash
# O backup está em:
/home/git-muhlstore/backup-muhlstore-20251026-142440.zip

# Tamanho: 670MB
```

### No Windows

1. **Transferir o ZIP** via SFTP/FTP ou baixar do servidor

2. **Extrair em:**
   `C:\BKP-GIT\`

3. **Abrir PowerShell** na pasta extraída

4. **Instalar:**
   ```powershell
   npm install
   ```

---

## ⚙️ Configuração Após Clone

### 1. Criar Arquivo .env
```bash
# Copiar exemplo
Copy-Item env.example .env

# Editar .env com suas configurações
notepad .env
```

### 2. Configurar Banco de Dados
```env
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=muhlstore
```

### 3. Instalar Dependências
```bash
npm install
```

### 4. Build
```bash
npm run build
```

### 5. Iniciar
```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

---

## 📦 Estrutura de Pastas

```
C:\BKP-GIT\
└── rare-toy-companion-final-8040\
    ├── src\           # Código fonte
    ├── public\         # Arquivos estáticos
    ├── server\         # Backend
    ├── database\       # Database
    ├── dist\          # Build de produção
    ├── node_modules\   # Dependências (criado após npm install)
    └── package.json   # Configuração do projeto
```

---

## 🔗 URLs Importantes

**Repositório GitHub:**
https://github.com/Ronei-rcm/rare-toy-companion-final-8040

**Documentação:**
- `CORRECOES_APLICADAS.md` - Correções aplicadas
- `CHANGELOG.md` - Histórico de versões
- `COMO_USAR_GIT.md` - Guia de Git

---

## ✅ Checklist

- [ ] Git instalado no Windows
- [ ] Clonar repositório
- [ ] Instalar dependências (npm install)
- [ ] Configurar .env
- [ ] Testar projeto (npm run dev)
- [ ] Verificar se tudo funciona

---

## 💡 Dica

Para usar HTTPS com autenticação:
```bash
git clone https://SEU_TOKEN@github.com/Ronei-rcm/rare-toy-companion-final-8040.git
```

Ou usar SSH:
```bash
git clone git@github.com:Ronei-rcm/rare-toy-companion-final-8040.git
```

---

**Pronto! Agora você tem o projeto completo em sua máquina Windows.** 🎉


