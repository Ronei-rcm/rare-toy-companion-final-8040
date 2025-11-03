/**
 * Middleware de auditoria para rotas administrativas
 * Registra usuário admin, método, rota e IP
 */

function adminAudit(req, res, next) {
  try {
    const user = req.adminUser || {};
    const startedAt = Date.now();
    const { method, originalUrl } = req;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';

    res.on('finish', () => {
      const ms = Date.now() - startedAt;
      const status = res.statusCode;
      // Simples log estruturado
      console.log(
        JSON.stringify({
          scope: 'admin_audit',
          when: new Date().toISOString(),
          method,
          url: originalUrl,
          status,
          ms,
          ip,
          adminId: user.id || null,
          adminEmail: user.email || null,
        })
      );
    });
  } catch (_) {}
  next();
}

module.exports = { adminAudit };






