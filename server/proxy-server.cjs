const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8040;

// Middleware para DESABILITAR CACHE COMPLETAMENTE
app.use((req, res, next) => {
  // Forçar headers anti-cache em TODAS as requisições
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('ETag', `"${Date.now()}-${Math.random()}"`);
  res.setHeader('Last-Modified', new Date().toUTCString());
  next();
});

// Proxy para API - deve vir ANTES do static
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false,
  // Removido pathRewrite para manter /api na URL
  onError: (err, req, res) => {
    console.log('Proxy error:', err.message);
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log('Sending Request to the Target:', req.method, req.url);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
  }
}));

// Proxy para uploads
app.use('/lovable-uploads', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false,
  onError: (err, req, res) => {
    console.log('Proxy error for images:', err.message);
  }
}));

// Servir arquivos estáticos do build com headers de cache COMPLETAMENTE DESABILITADOS
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, filePath) => {
    // DESABILITAR CACHE COMPLETAMENTE para TODOS os arquivos
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('ETag', `"${Date.now()}-${Math.random()}"`);
    res.setHeader('Last-Modified', new Date().toUTCString());
    
    // Headers adicionais para forçar download
    if (filePath.endsWith('.js') || filePath.endsWith('.css') || filePath.endsWith('.html')) {
      res.setHeader('Vary', 'Accept-Encoding');
      res.setHeader('X-Content-Type-Options', 'nosniff');
    }
  }
}));

// Fallback para SPA - todas as rotas não encontradas vão para index.html
app.use((req, res) => {
  // Só serve index.html se não for uma requisição para API
  if (!req.path.startsWith('/api') && !req.path.startsWith('/lovable-uploads')) {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  } else {
    res.status(404).send('Not found');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Proxy server running on port ${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, '../dist')}`);
  console.log(`🔄 Proxying /api requests to: http://localhost:3001`);
});
