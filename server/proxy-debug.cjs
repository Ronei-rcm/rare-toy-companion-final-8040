const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8040;

console.log('🚀 Starting debug proxy server...');

// Middleware de debug para TODAS as requisições
app.use((req, res, next) => {
  console.log(`🔍 ${req.method} ${req.url} - Headers: ${JSON.stringify(req.headers)}`);
  next();
});

// Proxy para API - DEVE vir PRIMEIRO
app.use('/api', (req, res, next) => {
  console.log(`🔄 Intercepting API request: ${req.method} ${req.url}`);
  next();
}, createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${req.url} to http://localhost:3001${req.url}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Response ${proxyRes.statusCode} for ${req.url}`);
  }
}));

// Proxy para uploads
app.use('/lovable-uploads', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false
}));

// Servir arquivos estáticos do build
// IMPORTANTE: express.static deve vir ANTES do fallback para servir arquivos como favicon.ico
app.use(express.static(path.join(__dirname, '../dist'), {
  // Configurar headers para arquivos estáticos
  setHeaders: (res, filePath) => {
    // Headers de cache para arquivos estáticos
    if (filePath.endsWith('.ico') || filePath.endsWith('.png') || filePath.endsWith('.jpg') || filePath.endsWith('.svg')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 ano
    } else if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 dia
    }
  },
  // Não servir index.html para arquivos estáticos
  index: false
}));

// Fallback para SPA - APENAS para rotas que não são arquivos estáticos
app.use((req, res, next) => {
  // Se a requisição tem extensão de arquivo, não é uma rota SPA
  const hasExtension = /\.\w+$/.test(req.path);
  if (hasExtension) {
    // Arquivo não encontrado
    console.log(`❌ Arquivo não encontrado: ${req.url}`);
    return res.status(404).send('Arquivo não encontrado');
  }
  
  // É uma rota SPA, servir index.html
  console.log(`📄 Fallback: serving index.html for ${req.url}`);
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Debug proxy server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '../dist')}`);
  console.log(`🔄 Proxying /api requests to: http://localhost:3001`);
});
