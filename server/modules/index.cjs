
/**
 * Índice dos módulos do servidor
 */
const { setupSecurityMiddleware } = require('./security.middleware.cjs');
const { authenticateUser, authenticateAdmin } = require('./auth.middleware.cjs');
const productsRoutes = require('./products.routes.cjs');
const cartRoutes = require('./cart.routes.cjs');
const DatabaseService = require('./database.utils.cjs');

module.exports = {
  setupSecurityMiddleware,
  authenticateUser,
  authenticateAdmin,
  productsRoutes,
  cartRoutes,
  DatabaseService
};
