const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 8040;

console.log('🚀 Starting simple proxy server...');

// Middleware para logs
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Teste direto do proxy
app.use('/api', (req, res, next) => {
  console.log(`🔍 Intercepting API request: ${req.method} ${req.url}`);
  
  const proxyReq = http.request({
    hostname: 'localhost',
    port: 3001,
    path: `/api${req.url}`, // Adicionar /api no path
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    console.log(`✅ Proxy response: ${proxyRes.statusCode}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error('❌ Proxy request error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  });
  
  req.pipe(proxyReq);
});

// Proxy antigo removido - usando proxy direto acima

// Proxy para uploads
app.use('/lovable-uploads', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false,
  logLevel: 'debug'
}));

// Servir arquivos estáticos do build
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback para SPA - todas as rotas não encontradas vão para index.html
app.use((req, res) => {
  console.log(`📄 Fallback: serving index.html for ${req.url}`);
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Simple proxy server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '../dist')}`);
  console.log(`🔄 Proxying /api requests to: http://localhost:3001`);
  console.log(`🔄 Proxying /lovable-uploads requests to: http://localhost:3001`);
});
