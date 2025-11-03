const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

/**
 * Middleware de segurança
 */
function setupSecurityMiddleware(app) {
  // Helmet para headers de segurança
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https://api.mercadopago.com"]
      }
    }
  }));

  // Rate limiting
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: { error: 'Muitas requisições deste IP, tente novamente em 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    trustProxy: false
  });

  app.use(generalLimiter);
  
  return app;
}

module.exports = { setupSecurityMiddleware };