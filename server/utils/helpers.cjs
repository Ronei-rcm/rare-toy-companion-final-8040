/**
 * Funções Utilitárias Compartilhadas
 * 
 * Este arquivo contém funções helper que são usadas por múltiplos módulos
 */

/**
 * Helper para construir URL absoluta respeitando proxy proto/host
 * 
 * @param {Object} req - Request object do Express
 * @param {string} pathOrUrl - Caminho relativo ou URL completa
 * @returns {string|null} URL absoluta ou null
 */
function getPublicUrl(req, pathOrUrl) {
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const normalized = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return `${proto}://${host}${normalized}`;
}

/**
 * Normaliza qualquer URL absoluta http(s) para este host/proto
 * Se relativa, mantém semântica relativa
 * 
 * @param {Object} req - Request object do Express
 * @param {string} urlOrPath - URL ou caminho
 * @returns {string|null} URL normalizada ou null
 */
function normalizeToThisOrigin(req, urlOrPath) {
  try {
    if (!urlOrPath) return null;
    if (!/^https?:\/\//i.test(urlOrPath)) {
      // Already relative; make it absolute with current origin
      return getPublicUrl(req, urlOrPath);
    }
    const u = new URL(urlOrPath);
    // Preserve path/search; rebuild on current origin
    const rebuilt = `${(req.headers['x-forwarded-proto'] || req.protocol || 'http')}://${(req.headers['x-forwarded-host'] || req.get('host'))}${u.pathname}${u.search || ''}`;
    return rebuilt;
  } catch {
    return getPublicUrl(req, urlOrPath);
  }
}

/**
 * Extrai o caminho de uploads mesmo quando a URL veio duplicada com host
 * Exemplo: http://host/http://host/.../lovable-uploads/arquivo.jpg
 * 
 * @param {string} urlOrPath - URL ou caminho
 * @returns {string|null} Caminho extraído ou null
 */
function extractUploadPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return null;
  const marker = '/lovable-uploads/';
  const idx = urlOrPath.lastIndexOf(marker);
  if (idx >= 0) {
    return urlOrPath.slice(idx);
  }
  return urlOrPath;
}

module.exports = {
  getPublicUrl,
  normalizeToThisOrigin,
  extractUploadPath
};
