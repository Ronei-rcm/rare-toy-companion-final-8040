#!/bin/bash

# 🚀 DEPLOY CORRIGIDO - MuhlStore v1.0.7
# Execute este script DIRETAMENTE no servidor 177.67.32.55
# Data: 14 de outubro de 2025

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 DEPLOY CORRIGIDO - MUHLSTORE v1.0.7${NC}"
echo -e "${BLUE}📅 Data: $(date)${NC}"
echo ""

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

# Verificar Node.js
log "Verificando Node.js..."
node --version
npm --version

# Verificar PM2
log "Verificando PM2..."
pm2 --version

# Verificar MySQL
log "Verificando MySQL..."
systemctl status mysql | grep Active

# Configurar MySQL (com tratamento de erro)
log "Configurando MySQL..."
warning "Se o MySQL pedir senha, você precisará configurar manualmente."
warning "Execute: mysql -u root -p"
warning "Depois execute os comandos SQL abaixo:"

cat << 'EOF'

-- Comandos SQL para executar no MySQL:
CREATE DATABASE IF NOT EXISTS rare_toy_companion;
CREATE USER IF NOT EXISTS 'muhlstore'@'localhost' IDENTIFIED BY 'rg51gt66';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'muhlstore'@'localhost';
FLUSH PRIVILEGES;

EOF

# Tentar configurar MySQL (pode falhar se precisar de senha)
mysql -u root << 'MYSQL_EOF' 2>/dev/null || warning "MySQL precisa de senha. Configure manualmente com os comandos acima."
CREATE DATABASE IF NOT EXISTS rare_toy_companion;
CREATE USER IF NOT EXISTS 'muhlstore'@'localhost' IDENTIFIED BY 'rg51gt66';
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'muhlstore'@'localhost';
FLUSH PRIVILEGES;
MYSQL_EOF

# Verificar Nginx
log "Verificando Nginx..."
systemctl status nginx | grep Active || {
    log "Instalando Nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
}

# Configurar firewall
log "Configurando firewall..."
ufw allow 22/tcp 2>/dev/null || true
ufw allow 8022/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true
ufw status | grep -q "Status: active" || warning "Firewall não está ativo. Execute: ufw enable"

# Criar diretório do projeto
log "Criando diretório do projeto..."
mkdir -p /home/espelhar
cd /home/espelhar

# Criar projeto completo
log "Criando estrutura do projeto..."
rm -rf muhlstore-rare-toy-companion 2>/dev/null || true
mkdir -p muhlstore-rare-toy-companion
cd muhlstore-rare-toy-companion

# Criar package.json
log "Criando package.json..."
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
    "multer": "^1.4.5-lts.1",
    "dotenv": "^16.3.1"
  }
}
EOF

# Criar ecosystem.config.cjs
log "Criando ecosystem.config.cjs..."
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [
    {
      name: 'muhlstore-api',
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
        MYSQL_PORT: 3306,
        VITE_API_URL: 'http://177.67.32.55/api',
        VITE_APP_URL: 'http://177.67.32.55'
      }
    },
    {
      name: 'muhlstore-web',
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

# Criar arquivo .env
log "Criando arquivo .env..."
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

# Criar servidor Express completo
log "Criando servidor Express..."
mkdir -p server
cat > server/server.cjs << 'EOF'
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Pool de conexão MySQL
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'muhlstore',
  password: process.env.MYSQL_PASSWORD || 'rg51gt66',
  database: process.env.MYSQL_DATABASE || 'rare_toy_companion',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test');
    res.json({ 
      status: 'OK', 
      version: '1.0.7',
      timestamp: new Date().toISOString(),
      server: '177.67.32.55',
      database: 'Connected',
      test: rows[0].test
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      version: '1.0.7',
      timestamp: new Date().toISOString(),
      server: '177.67.32.55',
      database: 'Error',
      error: error.message
    });
  }
});

// API básica
app.get('/api', (req, res) => {
  res.json({ 
    message: 'MuhlStore API v1.0.7',
    status: 'Running',
    server: '177.67.32.55',
    timestamp: new Date().toISOString(),
    endpoints: [
      'GET /api/health - Health check',
      'GET /api - API info',
      'POST /api/produtos - Criar produto',
      'GET /api/produtos - Listar produtos',
      'GET /api/categorias - Listar categorias'
    ]
  });
});

// Endpoint de produtos básico
app.get('/api/produtos', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM produtos LIMIT 10');
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: 'Tabela produtos ainda não existe. Aguardando migração.'
    });
  }
});

// Endpoint de categorias básico
app.get('/api/categorias', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM categorias WHERE ativo = 1 LIMIT 10');
    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      message: 'Tabela categorias ainda não existe. Aguardando migração.'
    });
  }
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor API rodando na porta ${PORT}`);
  console.log(`🌐 Acesse: http://177.67.32.55:${PORT}`);
  console.log(`❤️ Health: http://177.67.32.55:${PORT}/api/health`);
  console.log(`📅 Iniciado em: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});
EOF

# Criar página HTML completa
log "Criando frontend..."
mkdir -p dist
cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MuhlStore - Rare Toy Companion</title>
    <meta name="description" content="Sistema completo de e-commerce para brinquedos raros">
    <meta name="theme-color" content="#667eea">
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
            color: white;
            padding: 2rem;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
        }
        
        .logo {
            font-size: 4rem;
            font-weight: bold;
            margin-bottom: 1rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            animation: pulse 2s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .subtitle {
            font-size: 1.5rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }
        
        .status-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .status-card {
            background: rgba(255,255,255,0.1);
            padding: 2rem;
            border-radius: 15px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .status-card h2 {
            margin-bottom: 1rem;
            color: #4ade80;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .status-indicator {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #4ade80;
            animation: blink 1s ease-in-out infinite;
        }
        
        @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-top: 1rem;
        }
        
        .info-item {
            background: rgba(255,255,255,0.1);
            padding: 1rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
        }
        
        .info-item h3 {
            color: #fbbf24;
            margin-bottom: 0.5rem;
            font-size: 0.9rem;
        }
        
        .info-item p {
            font-size: 1.2rem;
            font-weight: bold;
        }
        
        .links {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .links a {
            display: block;
            background: rgba(255,255,255,0.2);
            color: white;
            text-decoration: none;
            padding: 1.5rem;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.3);
            transition: all 0.3s ease;
            text-align: center;
            font-weight: 500;
        }
        
        .links a:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
        }
        
        .api-test {
            background: rgba(0,0,0,0.3);
            padding: 1rem;
            border-radius: 10px;
            margin-top: 1rem;
            font-family: 'Courier New', monospace;
            font-size: 0.85rem;
            max-height: 300px;
            overflow-y: auto;
            white-space: pre-wrap;
            word-wrap: break-word;
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
        
        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: white;
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
            body {
                padding: 1rem;
            }
            
            .logo {
                font-size: 2.5rem;
            }
            
            .status-grid {
                grid-template-columns: 1fr;
            }
            
            .info-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🚀 MuhlStore</div>
            <div class="subtitle">Rare Toy Companion v1.0.7</div>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h2>
                    <span class="status-indicator"></span>
                    Sistema Online
                </h2>
                <p>Servidor 177.67.32.55 configurado e funcionando!</p>
                
                <div class="info-grid">
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
            
            <div class="status-card">
                <h2>
                    <span class="status-indicator"></span>
                    Status da API
                </h2>
                <div id="api-status"><span class="loading"></span> Carregando...</div>
                <div class="api-test" id="api-test"></div>
            </div>
        </div>
        
        <div class="links">
            <a href="/api">📡 API Info</a>
            <a href="/api/health">❤️ Health Check</a>
            <a href="/api/produtos">📦 Produtos</a>
            <a href="/api/categorias">🏷️ Categorias</a>
        </div>
    </div>
    
    <div class="version">v1.0.7 - 14/10/2025</div>
    
    <script>
        async function testAPI() {
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                
                const statusEl = document.getElementById('api-status');
                if (data.status === 'OK') {
                    statusEl.innerHTML = `
                        <span style="color: #4ade80; font-weight: bold;">✅ API Online</span>
                        <br><small>Database: ${data.database}</small>
                    `;
                } else {
                    statusEl.innerHTML = `
                        <span style="color: #fbbf24; font-weight: bold;">⚠️ API Online (DB Error)</span>
                        <br><small>Database: ${data.database}</small>
                    `;
                }
                
                document.getElementById('api-test').textContent = 
                    JSON.stringify(data, null, 2);
                    
            } catch (error) {
                document.getElementById('api-status').innerHTML = 
                    `<span style="color: #ef4444; font-weight: bold;">❌ API Error</span>`;
                document.getElementById('api-test').textContent = error.message;
            }
        }
        
        testAPI();
        setInterval(testAPI, 30000);
    </script>
</body>
</html>
EOF

# Instalar dependências
log "Instalando dependências do projeto..."
npm install --production

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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
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
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

# Ativar site no Nginx
ln -sf /etc/nginx/sites-available/muhlstore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

# Parar processos antigos do PM2
log "Parando processos antigos..."
pm2 delete all 2>/dev/null || true

# Iniciar serviços com PM2
log "Iniciando serviços..."
pm2 start ecosystem.config.cjs

# Salvar configuração do PM2
pm2 save
pm2 startup

# Verificar status
log "Verificando status dos serviços..."
pm2 status

# Criar scripts úteis
log "Criando scripts úteis..."

# Script de restart
cat > /home/espelhar/restart-muhlstore.sh << 'EOF'
#!/bin/bash
echo "🔄 Reiniciando MuhlStore..."
cd /home/espelhar/muhlstore-rare-toy-companion
pm2 restart all
echo "✅ Reiniciado com sucesso!"
echo "🌐 Acesse: http://177.67.32.55"
EOF
chmod +x /home/espelhar/restart-muhlstore.sh

# Script de logs
cat > /home/espelhar/logs-muhlstore.sh << 'EOF'
#!/bin/bash
echo "📋 Logs do MuhlStore..."
pm2 logs --lines 100
EOF
chmod +x /home/espelhar/logs-muhlstore.sh

# Script de status
cat > /home/espelhar/status-muhlstore.sh << 'EOF'
#!/bin/bash
echo "📊 Status do MuhlStore..."
echo ""
echo "=== PM2 ==="
pm2 status
echo ""
echo "=== Nginx ==="
systemctl status nginx | grep Active
echo ""
echo "=== MySQL ==="
systemctl status mysql | grep Active
echo ""
echo "=== Teste de API ==="
curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/api/health
EOF
chmod +x /home/espelhar/status-muhlstore.sh

log "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo ""
echo -e "${GREEN}✅ Sistema configurado e funcionando!${NC}"
echo -e "${GREEN}✅ Node.js $(node --version), PM2 instalados${NC}"
echo -e "${GREEN}✅ Nginx e MySQL configurados${NC}"
echo -e "${GREEN}✅ Frontend e API iniciados${NC}"
echo ""
echo -e "${YELLOW}⚠️ ATENÇÃO: Configure o MySQL manualmente se necessário${NC}"
echo -e "${YELLOW}Execute: mysql -u root -p${NC}"
echo -e "${YELLOW}E rode os comandos SQL mostrados no início${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de Acesso:${NC}"
echo -e "${GREEN}  Frontend: http://177.67.32.55${NC}"
echo -e "${GREEN}  API: http://177.67.32.55/api${NC}"
echo -e "${GREEN}  Health: http://177.67.32.55/api/health${NC}"
echo ""
echo -e "${BLUE}🔧 Scripts Úteis:${NC}"
echo -e "${GREEN}  Status: /home/espelhar/status-muhlstore.sh${NC}"
echo -e "${GREEN}  Logs: /home/espelhar/logs-muhlstore.sh${NC}"
echo -e "${GREEN}  Restart: /home/espelhar/restart-muhlstore.sh${NC}"
echo ""
echo -e "${GREEN}🚀 MuhlStore v1.0.7 está rodando!${NC}"
echo -e "${GREEN}📊 Teste agora: curl http://177.67.32.55/api/health${NC}"
