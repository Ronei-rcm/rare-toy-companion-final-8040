/**
 * Middleware de autenticação
 */
function authenticateUser(req, res, next) {
  // Implementação de autenticação
  // Verificar session, JWT, etc.
  next();
}

function authenticateAdmin(req, res, next) {
  // Implementação de autenticação admin
  next();
}

module.exports = { authenticateUser, authenticateAdmin };