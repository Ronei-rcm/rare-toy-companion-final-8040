/**
 * Proteção CSRF Moderna
 * Implementação própria usando tokens seguros
 */

const crypto = require('crypto');
const logger = require('./logger.cjs');

// Armazenamento de tokens em memória (em produção use Redis)
const tokenStore = new Map();

// Tempo de expiração dos tokens (15 minutos)
const TOKEN_EXPIRY = 15 * 60 * 1000;

/**
 * Gerar token CSRF
 */
function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Criar par de tokens (token + secret)
 */
function createTokenPair() {
  const token = generateCsrfToken();
  const secret = generateCsrfToken();
  const expires = Date.now() + TOKEN_EXPIRY;

  // Armazenar token com secret e expiração
  tokenStore.set(token, { secret, expires });

  // Limpar tokens expirados periodicamente
  cleanExpiredTokens();

  return { token, secret };
}

/**
 * Verificar token CSRF
 */
function verifyCsrfToken(token, secret) {
  if (!token || !secret) {
    return false;
  }

  const stored = tokenStore.get(token);

  if (!stored) {
    return false;
  }

  // Verificar expiração
  if (Date.now() > stored.expires) {
    tokenStore.delete(token);
    return false;
  }

  // Verificar secret
  if (stored.secret !== secret) {
    return false;
  }

  return true;
}

/**
 * Limpar tokens expirados
 */
function cleanExpiredTokens() {
  const now = Date.now();
  let cleaned = 0;

  for (const [token, data] of tokenStore.entries()) {
    if (now > data.expires) {
      tokenStore.delete(token);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.debug(`Tokens CSRF expirados limpos: ${cleaned}`);
  }
}

/**
 * Middleware para gerar token CSRF
 */
function csrfTokenMiddleware(req, res, next) {
  // Gerar novo par de tokens
  const { token, secret } = createTokenPair();

  // Armazenar secret no cookie (httpOnly)
  res.cookie('csrf-secret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY,
  });

  // Disponibilizar token para o cliente
  req.csrfToken = () => token;

  next();
}

/**
 * Middleware para verificar token CSRF
 */
function csrfProtection(req, res, next) {
  // Métodos seguros não precisam de verificação
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Pegar token do header ou body
  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const secret = req.cookies['csrf-secret'];

  if (!verifyCsrfToken(token, secret)) {
    logger.warn('Token CSRF inválido', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });

    return res.status(403).json({
      error: 'Token CSRF inválido ou expirado',
      code: 'CSRF_INVALID',
    });
  }

  next();
}

/**
 * Endpoint para obter novo token CSRF
 */
function getCsrfTokenEndpoint(req, res) {
  const { token, secret } = createTokenPair();

  res.cookie('csrf-secret', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY,
  });

  res.json({
    csrfToken: token,
    expiresIn: TOKEN_EXPIRY,
  });
}

/**
 * Implementação alternativa usando Double Submit Cookie
 */
function doubleSubmitCookieProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const cookieToken = req.cookies['csrf-token'];
  const headerToken = req.headers['x-csrf-token'] || req.body._csrf;

  if (!cookieToken || cookieToken !== headerToken) {
    logger.warn('CSRF Double Submit falhou', {
      ip: req.ip,
      path: req.path,
    });

    return res.status(403).json({
      error: 'Token CSRF inválido',
      code: 'CSRF_INVALID',
    });
  }

  next();
}

/**
 * Gerar e definir token Double Submit
 */
function setDoubleSubmitCookie(req, res, next) {
  let token = req.cookies['csrf-token'];

  if (!token) {
    token = generateCsrfToken();
    res.cookie('csrf-token', token, {
      httpOnly: false, // Precisa ser acessível pelo JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: TOKEN_EXPIRY,
    });
  }

  req.csrfToken = () => token;
  next();
}

// Limpar tokens expirados a cada 5 minutos
setInterval(cleanExpiredTokens, 5 * 60 * 1000);

module.exports = {
  csrfTokenMiddleware,
  csrfProtection,
  getCsrfTokenEndpoint,
  doubleSubmitCookieProtection,
  setDoubleSubmitCookie,
  generateCsrfToken,
  createTokenPair,
  verifyCsrfToken,
};
