/**
 * Configurações de segurança da API
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');

/**
 * Rate Limiting - Proteção contra abuse e DDoS
 */

// Rate limiter geral para toda a API
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // Limite aumentado para 500 requests por IP
  message: {
    error: 'Muitas requisições vindas deste IP. Por favor, tente novamente mais tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true, // Retorna info no header `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  skip: (req) => req.path.startsWith('/lovable-uploads/'), // Pular imagens
});

// Rate limiter específico para autenticação (mais restritivo)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 tentativas (aumentado de 5)
  skipSuccessfulRequests: true, // Não contar requests bem-sucedidos
  message: {
    error: 'Muitas tentativas de login. Por favor, aguarde 15 minutos.',
  },
});

// Rate limiter para criação de contas
const createAccountLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // 5 contas por hora (aumentado de 3)
  message: {
    error: 'Muitas contas criadas deste IP. Tente novamente em 1 hora.',
  },
});

// Rate limiter para carrinho e checkout
const cartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // 200 requests por minuto (aumentado de 100)
  message: {
    error: 'Você está atualizando o carrinho muito rapidamente. Aguarde um momento.',
  },
});

// Rate limiter para API de produtos (mais permissivo)
const productsLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 500, // 500 requests por minuto (aumentado de 200)
  message: {
    error: 'Muitas requisições para produtos. Aguarde um momento.',
  },
});

/**
 * Helmet - Headers de segurança HTTP
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'http:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", 'https://api.mercadopago.com'],
      frameSrc: ["'self'", 'https://www.mercadopago.com'],
    },
  },
  crossOriginEmbedderPolicy: false, // Necessário para alguns recursos externos
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Permitir recursos cross-origin
});

/**
 * Validadores de Input
 */

// Validador para criação de produto
const validateProduct = [
  body('nome')
    .trim()
    .notEmpty().withMessage('Nome é obrigatório')
    .isLength({ min: 3, max: 255 }).withMessage('Nome deve ter entre 3 e 255 caracteres')
    .escape(),
  body('descricao')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Descrição muito longa'),
  body('preco')
    .isFloat({ min: 0.01 }).withMessage('Preço deve ser maior que 0')
    .toFloat(),
  body('categoria')
    .trim()
    .notEmpty().withMessage('Categoria é obrigatória')
    .isLength({ max: 100 }).withMessage('Categoria muito longa')
    .escape(),
  body('estoque')
    .optional()
    .isInt({ min: 0 }).withMessage('Estoque deve ser um número positivo')
    .toInt(),
];

// Validador para email
const validateEmail = [
  body('email')
    .trim()
    .isEmail().withMessage('Email inválido')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email muito longo'),
];

// Validador para telefone
const validatePhone = [
  body('telefone')
    .optional()
    .trim()
    .matches(/^\+?[1-9]\d{1,14}$/).withMessage('Telefone inválido'),
];

// Validador para CPF/CNPJ
const validateDocument = [
  body('documento')
    .optional()
    .trim()
    .matches(/^[0-9]{11}$|^[0-9]{14}$/).withMessage('CPF/CNPJ inválido'),
];

// Middleware para checar validação
const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Dados inválidos',
      details: errors.array(),
    });
  }
  next();
};

/**
 * Sanitização de HTML
 */
const validator = require('validator');

const sanitizeHtml = (dirty) => {
  if (!dirty || typeof dirty !== 'string') return dirty;
  
  // Remove tags HTML perigosas
  return validator.escape(dirty);
};

const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (const key in obj) {
    if (typeof obj[key] === 'string') {
      sanitized[key] = sanitizeHtml(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitized[key] = sanitizeObject(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

module.exports = {
  // Rate Limiters
  generalLimiter,
  authLimiter,
  createAccountLimiter,
  cartLimiter,
  productsLimiter,
  
  // Helmet
  helmetConfig,
  
  // Validators
  validateProduct,
  validateEmail,
  validatePhone,
  validateDocument,
  checkValidation,
  
  // Sanitizers
  sanitizeHtml,
  sanitizeObject,
};
