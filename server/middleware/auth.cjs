/**
 * Middleware de autenticação para rotas administrativas
 * Suporta JWT (novo) e tokens legados (compatibilidade)
 */

const { verifyAdminToken } = require('../utils/security.cjs');

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
    // Aceita token em: cookie, header Authorization (Bearer) ou header X-Admin-Token
    const adminToken = req.cookies?.admin_token 
      || req.headers['x-admin-token'] 
      || req.headers['X-Admin-Token']
      || req.headers.authorization?.replace('Bearer ', '');
    
    // Debug: log dos headers recebidos (apenas em desenvolvimento)
    if (process.env.NODE_ENV !== 'production') {
      console.log('🔍 [Auth Debug] Headers recebidos:', {
        'x-admin-token': req.headers['x-admin-token'],
        'X-Admin-Token': req.headers['X-Admin-Token'],
        'authorization': req.headers.authorization,
        'cookie': req.cookies?.admin_token ? 'presente' : 'ausente',
        'adminToken encontrado': !!adminToken
      });
    }
    
    if (!adminToken) {
      return res.status(401).json({ 
        error: 'unauthorized', 
        message: 'Token de administrador necessário' 
      });
    }
    
    // Verificar token (JWT ou legado)
    const tokenData = verifyAdminToken(adminToken);
    
    // Debug: log do resultado da verificação (sempre ativo para debug)
    console.log('🔍 [Auth Debug] Resultado verifyAdminToken:', {
      tokenData: tokenData ? { 
        id: tokenData.id,
        email: tokenData.email,
        role: tokenData.role,
        type: tokenData.type,
        legacy: tokenData.legacy,
        expired: tokenData.expired
      } : null,
      hasToken: !!adminToken,
      tokenLength: adminToken?.length,
      tokenPreview: adminToken?.substring(0, 50) + '...'
    });
    
    if (!tokenData) {
      console.error('❌ [Auth] Token inválido ou não pode ser verificado');
      return res.status(401).json({ 
        error: 'invalid_token', 
        message: 'Token de administrador inválido' 
      });
    }
    
    if (tokenData.expired) {
      console.error('❌ [Auth] Token expirado');
      return res.status(401).json({ 
        error: 'token_expired', 
        message: 'Token de administrador expirado. Faça login novamente.' 
      });
    }
    
    // Se for token legado, processar formato antigo
    let userId;
    if (tokenData.legacy) {
      // Token legado: admin_token_timestamp_userId
      const tokenParts = adminToken.split('_');
      if (tokenParts.length < 4) {
        return res.status(401).json({ 
          error: 'invalid_token', 
          message: 'Formato de token inválido' 
        });
      }
      
      userId = tokenParts[tokenParts.length - 1];
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
    } else {
      // Token JWT válido
      userId = tokenData.id || tokenData.userId;
      
      if (!userId) {
        console.error('❌ [Auth] Token JWT não contém ID do usuário:', tokenData);
        return res.status(401).json({ 
          error: 'invalid_token', 
          message: 'Token de administrador inválido - ID não encontrado' 
        });
      }
    }
    
    // Verificar se o usuário admin existe e está ativo
    let dbPool;
    try {
      ({ pool: dbPool } = require('../database/mysql'));
    } catch (_) {
      // tentar pegar do app.locals se o servidor tiver configurado
      dbPool = req.app?.locals?.pool;
    }
    if (!dbPool) {
      // Sem pool disponível, usar dados do JWT se disponível
      if (!tokenData.legacy && tokenData.id) {
        req.adminUser = {
          id: tokenData.id,
          email: tokenData.email,
          role: tokenData.role,
          status: 'ativo'
        };
        return next();
      }
      return res.status(500).json({ 
        error: 'database_error', 
        message: 'Erro ao conectar com banco de dados' 
      });
    }
    
    // Tentar buscar na tabela admin_users primeiro, depois users se não encontrar
    let [users] = await dbPool.execute(
      'SELECT id, nome, email, role, status FROM admin_users WHERE id = ? AND status = "ativo"',
      [userId]
    );
    
    // Se não encontrar em admin_users, tentar na tabela users com role admin
    if (users.length === 0) {
      [users] = await dbPool.execute(
        'SELECT id, nome, email, role, status FROM users WHERE id = ? AND role = "admin" AND status = "ativo"',
        [userId]
      );
    }
    
    if (users.length === 0) {
      console.error(`❌ [Auth] Usuário admin não encontrado: userId=${userId}`);
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
