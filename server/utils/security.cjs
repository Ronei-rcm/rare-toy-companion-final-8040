/**
 * Utilitários de Segurança
 * JWT, Bcrypt e funções auxiliares
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// Configurações
// IMPORTANTE: Usar secret fixo para não invalidar tokens a cada restart
// Em produção, sempre definir JWT_SECRET ou ADMIN_JWT_SECRET via variável de ambiente
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || 'muhlstore-admin-secret-key-2025-do-not-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

/**
 * Gera hash de senha usando bcrypt
 * @param {string} password - Senha em texto plano
 * @returns {Promise<string>} Hash da senha
 */
async function hashPassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Senha inválida');
  }
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verifica senha usando bcrypt
 * @param {string} password - Senha em texto plano
 * @param {string} hash - Hash armazenado
 * @returns {Promise<boolean>} true se a senha estiver correta
 */
async function verifyPassword(password, hash) {
  if (!password || !hash) {
    return false;
  }
  
  try {
    // Verificar se é hash bcrypt (começa com $2a$, $2b$ ou $2y$)
    if (hash.startsWith('$2')) {
      return await bcrypt.compare(password, hash);
    }
    
    // Compatibilidade com SHA256 antigo (migração gradual)
    const crypto = require('crypto');
    const sha256Hash = crypto.createHash('sha256').update(password).digest('hex');
    return sha256Hash === hash;
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}

/**
 * Gera token JWT para admin
 * @param {object} payload - Dados do usuário (id, email, role)
 * @param {string} expiresIn - Tempo de expiração (padrão: 24h)
 * @returns {string} Token JWT
 */
function generateAdminToken(payload, expiresIn = JWT_EXPIRES_IN) {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
    type: 'admin',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn,
    algorithm: 'HS256'
  });
}

/**
 * Gera refresh token JWT
 * @param {object} payload - Dados do usuário
 * @returns {string} Refresh token
 */
function generateRefreshToken(payload) {
  const tokenPayload = {
    id: payload.id,
    email: payload.email,
    type: 'refresh',
    iat: Math.floor(Date.now() / 1000)
  };
  
  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    algorithm: 'HS256'
  });
}

/**
 * Verifica e decodifica token JWT
 * @param {string} token - Token JWT
 * @returns {object|null} Payload decodificado ou null se inválido
 */
function verifyAdminToken(token) {
  if (!token) {
    return null;
  }
  
  try {
    // Verificar se é token antigo (formato: admin_token_timestamp_userId)
    if (token.startsWith('admin_token_')) {
      return { legacy: true, token };
    }
    
    // Verificar JWT
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256']
    });
    
    if (decoded.type !== 'admin' && decoded.type !== 'refresh') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { expired: true };
    }
    if (error.name === 'JsonWebTokenError') {
      return null;
    }
    console.error('Erro ao verificar token:', error);
    return null;
  }
}

/**
 * Configuração segura de cookies
 * @param {object} options - Opções adicionais
 * @returns {object} Configuração de cookie
 */
function getSecureCookieOptions(options = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isHttps = process.env.FORCE_HTTPS === 'true' || 
                  process.env.NODE_ENV === 'production';
  
  return {
    httpOnly: true, // Protege contra XSS
    secure: isHttps, // HTTPS obrigatório em produção
    sameSite: 'strict', // Protege contra CSRF
    maxAge: options.maxAge || 1000 * 60 * 60 * 24 * 7, // 7 dias padrão
    path: options.path || '/',
    domain: options.domain || process.env.COOKIE_DOMAIN,
    ...options
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateAdminToken,
  generateRefreshToken,
  verifyAdminToken,
  getSecureCookieOptions,
  JWT_SECRET,
  JWT_EXPIRES_IN
};

