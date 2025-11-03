
const compression = require('compression');

/**
 * Middleware de compressão otimizado
 */
function setupCompression(app) {
  app.use(compression({
    level: 6, // Nível de compressão (1-9)
    threshold: 1024, // Comprimir apenas arquivos > 1KB
    filter: (req, res) => {
      // Não comprimir se já foi comprimido
      if (req.headers['x-no-compression']) {
        return false;
      }
      
      // Usar compressão para todos os tipos de conteúdo
      return compression.filter(req, res);
    }
  }));
  
  console.log('✅ Middleware de compressão configurado');
}

module.exports = { setupCompression };
