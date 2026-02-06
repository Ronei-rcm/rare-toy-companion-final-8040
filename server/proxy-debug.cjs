const express = require('express');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8040;
const API_TARGET = 'http://localhost:3001';

console.log('🚀 Starting MANUAL proxy server (v2)...');

// Proxy manual para /api (COM SUPORTE A POST/PUT)
app.use('/api', (req, res) => {
  console.log(`🔄 Manual proxy: ${req.method} ${req.url}`);
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/api${req.url}`,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    console.log(`✅ Response: ${proxyRes.statusCode} for ${req.url}`);
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    console.error(`❌ Proxy error:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error' });
    }
  });
  
  // IMPORTANTE: Usar pipe para passar o corpo da requisição
  req.pipe(proxyReq);
});

// Proxy para uploads
app.use('/lovable-uploads', (req, res) => {
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `/lovable-uploads${req.url}`,
    method: req.method,
    headers: req.headers
  };
  
  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });
  
  proxyReq.on('error', (err) => {
    if (!res.headersSent) {
      res.status(502).send('Upload proxy error');
    }
  });
  
  req.pipe(proxyReq);
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, '../dist'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  },
  index: false
}));

// Fallback SPA
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Manual proxy server (v2) on :${PORT}`);
  console.log(`   🔄 /api/* -> ${API_TARGET}`);
  console.log(`   ✨ Suporte completo a POST/PUT/DELETE`);
});
