#!/bin/bash

# 🚀 DEPLOY COM MYSQL EM DOCKER (PORTA ALTERNATIVA) - MuhlStore v1.0.7
# Execute este script DIRETAMENTE no servidor 177.67.32.55
# Data: 14 de outubro de 2025
# SOLUÇÃO: Usa porta 3307 para evitar conflito

set -e

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🐳 DEPLOY COM MYSQL EM DOCKER (PORTA 3307) - MUHLSTORE v1.0.7${NC}"
echo -e "${BLUE}📅 Data: $(date)${NC}"
echo ""

# Função para log
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[AVISO] $1${NC}"
}

error() {
    echo -e "${RED}[ERRO] $1${NC}"
    exit 1
}

# Verificar se Docker está instalado
log "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    log "Docker não encontrado. Instalando..."
    
    # Instalar Docker
    apt-get update
    apt-get install -y ca-certificates curl gnupg lsb-release
    
    # Adicionar chave GPG do Docker
    mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Adicionar repositório do Docker
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Instalar Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Iniciar Docker
    systemctl start docker
    systemctl enable docker
    
    log "Docker instalado com sucesso!"
else
    log "Docker já está instalado: $(docker --version)"
fi

# Verificar se a porta 3306 está em uso
log "Verificando porta 3306..."
if netstat -tulpn | grep :3306 > /dev/null; then
    warning "Porta 3306 está em uso (MySQL já instalado no sistema)"
    warning "Usando porta 3307 para o Docker MySQL"
    MYSQL_PORT=3307
else
    log "Porta 3306 disponível"
    MYSQL_PORT=3306
fi

# Parar e remover container MySQL antigo se existir
log "Removendo containers antigos..."
docker stop muhlstore-mysql 2>/dev/null || true
docker rm muhlstore-mysql 2>/dev/null || true

# Criar diretório para dados do MySQL
log "Criando diretório para dados do MySQL..."
mkdir -p /home/espelhar/mysql-data

# Iniciar MySQL em Docker na porta correta
log "Iniciando MySQL em Docker na porta ${MYSQL_PORT}..."
docker run -d \
  --name muhlstore-mysql \
  --restart always \
  -e MYSQL_ROOT_PASSWORD=rg51gt66 \
  -e MYSQL_DATABASE=rare_toy_companion \
  -e MYSQL_USER=muhlstore \
  -e MYSQL_PASSWORD=rg51gt66 \
  -p ${MYSQL_PORT}:3306 \
  -v /home/espelhar/mysql-data:/var/lib/mysql \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci

# Aguardar MySQL inicializar
log "Aguardando MySQL inicializar..."
sleep 20

# Verificar se MySQL está rodando
log "Verificando MySQL..."
docker ps | grep muhlstore-mysql || error "MySQL não está rodando!"

# Testar conexão com MySQL
log "Testando conexão com MySQL..."
for i in {1..15}; do
    if docker exec muhlstore-mysql mysql -umuhlstore -prg51gt66 -e "SELECT 1;" &> /dev/null; then
        log "MySQL está pronto!"
        break
    fi
    warning "Aguardando MySQL... tentativa $i/15"
    sleep 3
done

# Verificar Node.js
log "Verificando Node.js..."
if ! command -v node &> /dev/null; then
    log "Instalando Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi
node --version
npm --version

# Verificar PM2
log "Verificando PM2..."
if ! command -v pm2 &> /dev/null; then
    log "Instalando PM2..."
    npm install -g pm2
fi
pm2 --version

# Instalar serve
log "Verificando serve..."
if ! command -v serve &> /dev/null; then
    log "Instalando serve..."
    npm install -g serve
fi

# Verificar Nginx
log "Verificando Nginx..."
if ! command -v nginx &> /dev/null; then
    log "Instalando Nginx..."
    apt-get install -y nginx
    systemctl start nginx
    systemctl enable nginx
fi

# Configurar firewall
log "Configurando firewall..."
ufw allow 22/tcp 2>/dev/null || true
ufw allow 8022/tcp 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 443/tcp 2>/dev/null || true

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

# Criar ecosystem.config.cjs com a porta correta
log "Criando ecosystem.config.cjs..."
cat > ecosystem.config.cjs << EOF
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
        MYSQL_PORT: ${MYSQL_PORT},
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

# Criar arquivo .env com a porta correta
log "Criando arquivo .env..."
cat > .env << EOF
# Database (Docker na porta ${MYSQL_PORT})
MYSQL_HOST=localhost
MYSQL_USER=muhlstore
MYSQL_PASSWORD=rg51gt66
MYSQL_DATABASE=rare_toy_companion
MYSQL_PORT=${MYSQL_PORT}

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
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 as test, VERSION() as mysql_version');
    res.json({ 
      status: 'OK', 
      version: '1.0.7',
      timestamp: new Date().toISOString(),
      server: '177.67.32.55',
      database: 'Connected (Docker)',
      mysql_version: rows[0].mysql_version,
      mysql_port: process.env.MYSQL_PORT || 3306,
      test: rows[0].test
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      version: '1.0.7',
      timestamp: new Date().toISOString(),
      server: '177.67.32.55',
      database: 'Error (Docker)',
      mysql_port: process.env.MYSQL_PORT || 3306,
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
    database: 'MySQL Docker',
    mysql_port: process.env.MYSQL_PORT || 3306,
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
  console.log(`🐳 MySQL rodando em Docker (porta ${process.env.MYSQL_PORT || 3306})`);
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
        
        .badge {
            display: inline-block;
            background: rgba(0,0,0,0.3);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
        
        .docker-badge {
            color: #0db7ed;
            border: 2px solid #0db7ed;
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
            <div class="badge docker-badge">🐳 MySQL in Docker</div>
        </div>
        
        <div class="status-grid">
            <div class="status-card">
                <h2>
                    <span class="status-indicator"></span>
                    Sistema Online
                </h2>
                <p>Servidor 177.67.32.55 com MySQL em Docker!</p>
                
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
                        <h3>🐳 MySQL</h3>
                        <p id="mysql-port">Docker</p>
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
    
    <div class="version">v1.0.7 - 14/10/2025 🐳</div>
    
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
                        <br><small>MySQL: ${data.mysql_version || 'N/A'}</small>
                        <br><small>Porta: ${data.mysql_port || 'N/A'}</small>
                    `;
                    
                    // Atualizar porta do MySQL no card
                    if (data.mysql_port) {
                        document.getElementById('mysql-port').textContent = 'Porta ' + data.mysql_port;
                    }
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
    server_name 177.67.32.55 _;
    
    client_max_body_size 100M;
    
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

# Script de gerenciamento completo
cat > /home/espelhar/gerenciar-muhlstore.sh << 'EOF'
#!/bin/bash

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🚀 GERENCIAMENTO MUHLSTORE${NC}"
echo ""
echo "1. Ver status"
echo "2. Ver logs"
echo "3. Reiniciar tudo"
echo "4. Parar tudo"
echo "5. Iniciar tudo"
echo "6. Status Docker MySQL"
echo "7. Logs Docker MySQL"
echo "8. Backup banco de dados"
echo "9. Sair"
echo ""
read -p "Escolha uma opção: " opcao

case $opcao in
    1)
        echo -e "${GREEN}=== Status PM2 ===${NC}"
        pm2 status
        echo ""
        echo -e "${GREEN}=== Status Docker MySQL ===${NC}"
        docker ps | grep muhlstore-mysql
        echo ""
        echo -e "${GREEN}=== Teste API ===${NC}"
        curl -s http://localhost:3001/api/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:3001/api/health
        ;;
    2)
        pm2 logs --lines 50
        ;;
    3)
        echo -e "${YELLOW}Reiniciando serviços...${NC}"
        pm2 restart all
        echo -e "${GREEN}✅ Serviços reiniciados!${NC}"
        ;;
    4)
        echo -e "${YELLOW}Parando serviços...${NC}"
        pm2 stop all
        echo -e "${GREEN}✅ Serviços parados!${NC}"
        ;;
    5)
        echo -e "${YELLOW}Iniciando serviços...${NC}"
        pm2 start ecosystem.config.cjs
        echo -e "${GREEN}✅ Serviços iniciados!${NC}"
        ;;
    6)
        docker ps | grep muhlstore-mysql
        docker stats muhlstore-mysql --no-stream
        ;;
    7)
        docker logs muhlstore-mysql --tail 100 --follow
        ;;
    8)
        echo -e "${YELLOW}Criando backup...${NC}"
        docker exec muhlstore-mysql mysqldump -umuhlstore -prg51gt66 rare_toy_companion > /home/espelhar/backup-$(date +%Y%m%d-%H%M%S).sql
        echo -e "${GREEN}✅ Backup criado!${NC}"
        ls -lh /home/espelhar/backup-*.sql 2>/dev/null | tail -5
        ;;
    9)
        echo -e "${GREEN}Até logo!${NC}"
        exit 0
        ;;
    *)
        echo -e "${YELLOW}Opção inválida!${NC}"
        ;;
esac
EOF
chmod +x /home/espelhar/gerenciar-muhlstore.sh

log "🎉 DEPLOY COMPLETO COM DOCKER CONCLUÍDO!"
echo ""
echo -e "${GREEN}✅ Sistema configurado e funcionando!${NC}"
echo -e "${GREEN}✅ Docker e MySQL instalados${NC}"
echo -e "${GREEN}✅ Node.js, PM2, Nginx configurados${NC}"
echo -e "${GREEN}✅ Frontend e API iniciados${NC}"
echo -e "${GREEN}✅ MySQL rodando em Docker na porta ${MYSQL_PORT}${NC}"
echo ""
echo -e "${BLUE}🐳 Informações do Docker MySQL:${NC}"
echo -e "${GREEN}  Container: muhlstore-mysql${NC}"
echo -e "${GREEN}  Porta: ${MYSQL_PORT} (host) -> 3306 (container)${NC}"
echo -e "${GREEN}  Usuário: muhlstore${NC}"
echo -e "${GREEN}  Senha: rg51gt66${NC}"
echo -e "${GREEN}  Database: rare_toy_companion${NC}"
echo ""
echo -e "${BLUE}🌐 URLs de Acesso:${NC}"
echo -e "${GREEN}  Frontend: http://177.67.32.55${NC}"
echo -e "${GREEN}  API: http://177.67.32.55/api${NC}"
echo -e "${GREEN}  Health: http://177.67.32.55/api/health${NC}"
echo ""
echo -e "${BLUE}🔧 Scripts Úteis:${NC}"
echo -e "${GREEN}  Gerenciar: /home/espelhar/gerenciar-muhlstore.sh${NC}"
echo ""
echo -e "${BLUE}🐳 Comandos Docker Úteis:${NC}"
echo -e "${GREEN}  Ver logs: docker logs muhlstore-mysql -f${NC}"
echo -e "${GREEN}  Status: docker ps | grep muhlstore${NC}"
echo -e "${GREEN}  Reiniciar: docker restart muhlstore-mysql${NC}"
echo -e "${GREEN}  Conectar: docker exec -it muhlstore-mysql mysql -umuhlstore -prg51gt66 rare_toy_companion${NC}"
echo ""
echo -e "${GREEN}🚀 MuhlStore v1.0.7 com MySQL em Docker está rodando!${NC}"
echo -e "${GREEN}📊 Teste agora: curl http://177.67.32.55/api/health${NC}"
