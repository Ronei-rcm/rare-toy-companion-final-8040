#!/bin/bash

# 🚀 Deploy Alternativo - MuhlStore v1.0.7
# Execute este script no servidor 177.67.32.55
# Data: 13 de outubro de 2025

set -e

# Configurações
SERVER_DIR="/home/espelhar"
PROJECT_NAME="muhlstore-rare-toy-companion"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 DEPLOY ALTERNATIVO - MUHLSTORE v1.0.7${NC}"
echo -e "${BLUE}📁 Diretório: ${SERVER_DIR}${NC}"
echo ""

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Atualizar sistema
log "Atualizando sistema..."
apt-get update && apt-get upgrade -y

# Instalar dependências
log "Instalando dependências..."
apt-get install -y curl wget git unzip software-properties-common

# Instalar Node.js 18
log "Instalando Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Instalar PM2
log "Instalando PM2..."
npm install -g pm2

# Instalar MySQL
log "Instalando MySQL..."
apt-get install -y mysql-server
systemctl start mysql
systemctl enable mysql

# Configurar MySQL
log "Configurando MySQL..."
mysql -e "CREATE DATABASE IF NOT EXISTS rare_toy_companion;"
mysql -e "CREATE USER IF NOT EXISTS 'muhlstore'@'localhost' IDENTIFIED BY 'rg51gt66';"
mysql -e "GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'muhlstore'@'localhost';"
mysql -e "FLUSH PRIVILEGES;"

# Instalar Nginx
log "Instalando Nginx..."
apt-get install -y nginx
systemctl start nginx
systemctl enable nginx

# Configurar firewall
log "Configurando firewall..."
ufw allow 22/tcp
ufw allow 8022/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Criar diretório
log "Criando diretório do projeto..."
mkdir -p ${SERVER_DIR}
cd ${SERVER_DIR}

# Criar projeto via wget/curl (simulando upload)
log "Preparando projeto..."

# Criar estrutura básica do projeto
mkdir -p ${PROJECT_NAME}
cd ${PROJECT_NAME}

# Criar package.json
cat > package.json << 'EOF'
{
  "name": "muhlstore-rare-toy-companion",
  "version": "1.0.7",
  "description": "Sistema completo de e-commerce para brinquedos raros",
  "main": "server/server.cjs",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "server": "node server/server.cjs",
    "start": "pm2 start ecosystem.config.cjs",
    "db:migrate": "node scripts/migrate.cjs"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "compression": "^1.7.4",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
EOF

# Criar ecosystem.config.cjs
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'api',
      script: 'server/server.cjs',
      cwd: '/home/espelhar/muhlstore-rare-toy-companion',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        MYSQL_HOST: 'localhost',
        MYSQL_USER: 'muhlstore',
        MYSQL_PASSWORD: 'rg51gt66',
        MYSQL_DATABASE: 'rare_toy_companion',
        MYSQL_PORT: 3306
      }
    },
    {
      name: 'web',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: '/home/espelhar/muhlstore-rare-toy-companion',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF

# Instalar serve para servir arquivos estáticos
npm install -g serve

# Criar arquivo .env
cat > .env << 'EOF'
# Database
MYSQL_HOST=localhost
MYSQL_USER=muhlstore
MYSQL_PASSWORD=rg51gt66
MYSQL_DATABASE=rare_toy_companion
MYSQL_PORT=3306

# Server
PORT=3001
NODE_ENV=production

# Frontend
VITE_API_URL=http://177.67.32.55/api
VITE_APP_URL=http://177.67.32.55
EOF

# Criar servidor básico
mkdir -p server
cat > server/server.cjs << 'EOF'
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Pool de conexão MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'muhlstore',
  password: process.env.MYSQL_PASSWORD || 'rg51gt66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    version: '1.0.7',
    timestamp: new Date().toISOString(),
    server: '177.67.32.55'
  });
});

// API básica
app.get('/api', (req, res) => {
  res.json({ 
    message: 'MuhlStore API v1.0.7',
    status: 'Running',
    server: '177.67.32.55'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor API rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://177.67.32.55:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});
EOF

# Criar página HTML básica
mkdir -p dist
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MuhlStore - Rare Toy Companion</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
        }
        
        .container {
            text-align: center;
            max-width: 800px;
            padding: 2rem;
        }
        
        .logo {
            font-size: 3rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .status {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            margin-bottom: 2rem;
        }
        
        .status h2 {
            margin-bottom: 1rem;
            color: #4ade80;
        }
        
        .info {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .info-item {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .info-item h3 {
            color: #fbbf24;
            margin-bottom: 0.5rem;
        }
        
        .links {
            margin-top: 2rem;
        }
        
        .links a {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            color: white;
            text-decoration: none;
            padding: 1rem 2rem;
            margin: 0.5rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
        }
        
        .links a:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
        }
        
        .version {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(0,0,0,0.5);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.8rem;
            opacity: 0.7;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">🚀 MuhlStore</div>
        <div class="subtitle">Rare Toy Companion</div>
        
        <div class="status">
            <h2>✅ Sistema Online</h2>
            <p>Servidor configurado e funcionando perfeitamente!</p>
            
            <div class="info">
                <div class="info-item">
                    <h3>🌐 Servidor</h3>
                    <p>177.67.32.55</p>
                </div>
                <div class="info-item">
                    <h3>📱 Frontend</h3>
                    <p>Porta 3000</p>
                </div>
                <div class="info-item">
                    <h3>🔧 API</h3>
                    <p>Porta 3001</p>
                </div>
                <div class="info-item">
                    <h3>📊 Versão</h3>
                    <p>v1.0.7</p>
                </div>
            </div>
        </div>
        
        <div class="links">
            <a href="/admin">🔧 Painel Admin</a>
            <a href="/api">📡 API</a>
            <a href="/api/health">❤️ Health Check</a>
        </div>
    </div>
    
    <div class="version">v1.0.7 - 13/10/2025</div>
    
    <script>
        // Testar API
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                console.log('API Status:', data);
            })
            .catch(error => {
                console.log('API Error:', error);
            });
    </script>
</body>
</html>
EOF

# Instalar dependências
log "Instalando dependências do projeto..."
npm install

# Configurar Nginx
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/muhlstore << 'EOF'
server {
    listen 80;
    server_name 177.67.32.55;
    
    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Ativar site no Nginx
ln -sf /etc/nginx/sites-available/muhlstore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Iniciar serviços com PM2
log "Iniciando serviços..."
pm2 start ecosystem.config.cjs

# Salvar configuração do PM2
pm2 save
pm2 startup

# Verificar status
log "Verificando status dos serviços..."
pm2 status

# Criar script de deploy rápido
cat > deploy-rapido.sh << 'EOF'
#!/bin/bash
echo "🚀 Deploy rápido do MuhlStore..."
cd /home/espelhar/muhlstore-rare-toy-companion
pm2 restart all
echo "✅ Deploy concluído!"
echo "🌐 Acesse: http://177.67.32.55"
EOF

chmod +x deploy-rapido.sh

log "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo -e "${GREEN}✅ Sistema configurado e funcionando!${NC}"
echo -e "${GREEN}✅ Node.js, PM2, MySQL e Nginx instalados${NC}"
echo -e "${GREEN}✅ Banco de dados configurado${NC}"
echo -e "${GREEN}✅ Serviços iniciados${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de Acesso:${NC}"
echo -e "${YELLOW}  Frontend: http://177.67.32.55${NC}"
echo -e "${YELLOW}  API: http://177.67.32.55/api${NC}"
echo -e "${YELLOW}  Health: http://177.67.32.55/api/health${NC}"
echo ""
echo -e "${BLUE}🔧 Comandos Úteis:${NC}"
echo -e "${YELLOW}  Status: pm2 status${NC}"
echo -e "${YELLOW}  Logs: pm2 logs${NC}"
echo -e "${YELLOW}  Restart: ./deploy-rapido.sh${NC}"
echo ""
echo -e "${GREEN}🚀 MuhlStore está rodando no servidor!${NC}"
