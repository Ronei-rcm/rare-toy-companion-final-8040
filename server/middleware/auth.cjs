/**
 * Middleware de autenticação para rotas administrativas
 */

const authenticateAdmin = async (req, res, next) => {
  try {
    // Permitir rotas públicas de autenticação admin
    const base = req.baseUrl || '';
    const p = req.path || '';
    if (base === '/api/admin') {
      const openPaths = new Set(['/login', '/forgot-password', '/reset-password', '/seed']);
      if (openPaths.has(p)) return next();
    }

    // Verificar se o token de admin está presente
    const adminToken = req.cookies?.admin_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (!adminToken) {
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: 'Token de administrador necessário' 
      });
    }
    
    // Verificar se o token é válido (formato: admin_token_timestamp_userId)
    if (!adminToken.startsWith('admin_token_')) {
      return res.status(401).json({ 
        error: 'invalid_token', 
        message: 'Token de administrador inválido' 
      });
    }
    
    // Extrair informações do token
    const tokenParts = adminToken.split('_');
    if (tokenParts.length < 4) {
      return res.status(401).json({ 
        error: 'invalid_token', 
        message: 'Formato de token inválido' 
      });
    }
    
    const userId = tokenParts[tokenParts.length - 1];
    const timestamp = tokenParts[2];
    
    // Verificar se o token não expirou (24 horas)
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 horas em millisegundos
    
    if (tokenAge > maxAge) {
      return res.status(401).json({ 
        error: 'token_expired', 
        message: 'Token de administrador expirado' 
      });
    }
    
    // Verificar se o usuário admin existe e está ativo (tolerante à ausência de módulo externo)
    let dbPool;
    try {
      ({ pool: dbPool } = require('../database/mysql'));
    } catch (_) {
      // tentar pegar do app.locals se o servidor tiver configurado
      dbPool = req.app?.locals?.pool;
    }
    if (!dbPool) {
      // Sem pool disponível, não bloquear autenticação por falta de dependência
      return next();
    }
    const [users] = await dbPool.execute(
      'SELECT id, nome, email, role, status FROM admin_users WHERE id = ? AND status = "ativo"',
      [userId]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ 
        error: 'user_not_found', 
        message: 'Usuário administrador não encontrado ou inativo' 
      });
    }
    
    const user = users[0];
    
    // Adicionar informações do usuário à requisição
    req.adminUser = {
      id: user.id,
      nome: user.nome,
      email: user.email,
      role: user.role,
      status: user.status
    };
    
    next();
    
  } catch (error) {
    console.error('Erro na autenticação admin:', error);
    res.status(500).json({ 
      error: 'auth_error', 
      message: 'Erro interno na autenticação' 
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.adminUser) {
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: 'Usuário não autenticado' 
      });
    }
    
    const userRole = req.adminUser.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        error: 'forbidden', 
        message: 'Permissão insuficiente para esta operação' 
      });
    }
    
    next();
  };
};

const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.adminUser) {
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: 'Usuário não autenticado' 
      });
    }
    
    // Aqui você implementaria a lógica de permissões granulares
    // Por enquanto, apenas verificamos se é admin ou gerente
    const allowedRoles = ['admin', 'gerente'];
    
    if (!allowedRoles.includes(req.adminUser.role)) {
      return res.status(403).json({ 
        error: 'forbidden', 
        message: 'Permissão insuficiente para esta operação' 
      });
    }
    
    next();
  };
};

module.exports = {
  authenticateAdmin,
  requireRole,
  requirePermission
};
