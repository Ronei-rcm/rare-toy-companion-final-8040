const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8041;
const API_PORT = process.env.API_PORT || 3011;
const HOST = '0.0.0.0';

console.log('🪞 Starting MIRROR proxy server...');
console.log(`📍 Port: ${PORT}`);
console.log(`📡 API target: http://localhost:${API_PORT}`);

// Proxy para API - DEVE vir PRIMEIRO
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  secure: false,
  logLevel: 'debug',
  // NÃO remove /api do caminho
  pathRewrite: function (path, req) {
    const newPath = '/api' + path; // Garante que /api é mantido
    console.log(`🔄 Path rewrite: ${path} → ${newPath}`);
    return newPath;
  },
  onError: (err, req, res) => {
    console.error('❌ Proxy error:', err.message);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  },
  onProxyReq: (proxyReq, req, res) => {
    console.log(`🔄 Proxying ${req.method} ${proxyReq.path} to http://localhost:${API_PORT}`);
  },
  onProxyRes: (proxyRes, req, res) => {
    console.log(`✅ Response ${proxyRes.statusCode}`);
  }
}));

// Proxy para uploads
app.use('/lovable-uploads', createProxyMiddleware({
  target: `http://localhost:${API_PORT}`,
  changeOrigin: true,
  secure: false
}));

// Servir arquivos estáticos do build
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Fallback para SPA
app.use((req, res) => {
  console.log(`📄 Fallback: serving index.html for ${req.url}`);
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`✅ Mirror proxy server running on http://${HOST}:${PORT}`);
  console.log(`📂 Serving static files from: ${distPath}`);
  console.log(`🔄 Proxying /api requests to: http://localhost:${API_PORT}`);
  console.log('');
  console.log('🌐 Access from:');
  console.log(`   - Local: http://localhost:${PORT}`);
  console.log(`   - Network: http://192.168.9.100:${PORT}`);
});

// Tratamento de erros
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', promise, reason);
});
