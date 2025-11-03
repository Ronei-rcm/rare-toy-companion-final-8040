/**
 * Configuração do Sentry para Monitoramento de Erros
 */

const Sentry = require('@sentry/node');
// ProfilingIntegration removido (pacote opcional não instalado)
const logger = require('./logger.cjs');

let sentryInitialized = false;

/**
 * Inicializar Sentry
 */
function initializeSentry(app) {
  const dsn = process.env.SENTRY_DSN;

  if (!dsn) {
    logger.warn('SENTRY_DSN não configurado. Monitoramento de erros desabilitado.');
    return false;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',
      
      // Performance Monitoring
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      
      integrations: [
        // Express integration
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
        // ProfilingIntegration removido (pacote opcional não instalado)
      ],

      // Ignorar erros conhecidos/esperados
      ignoreErrors: [
        'ECONNREFUSED',
        'ETIMEDOUT',
        'ERR_NETWORK',
        'Network request failed',
      ],

      // BeforeSend - filtrar dados sensíveis
      beforeSend(event, hint) {
        // Remover dados sensíveis
        if (event.request) {
          delete event.request.cookies;
          
          if (event.request.data) {
            const data = event.request.data;
            if (typeof data === 'object') {
              delete data.password;
              delete data.senha;
              delete data.token;
              delete data.credit_card;
            }
          }
        }

        return event;
      },
    });

    sentryInitialized = true;
    logger.info('Sentry inicializado com sucesso');
    return true;
  } catch (error) {
    logger.error('Erro ao inicializar Sentry', { error: error.message });
    return false;
  }
}

/**
 * Middleware do Sentry para Express (Request Handler)
 */
function sentryRequestHandler() {
  if (!sentryInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.requestHandler();
}

/**
 * Middleware do Sentry para Express (Tracing)
 */
function sentryTracingHandler() {
  if (!sentryInitialized) {
    return (req, res, next) => next();
  }
  return Sentry.Handlers.tracingHandler();
}

/**
 * Middleware de erro do Sentry (Error Handler)
 */
function sentryErrorHandler() {
  if (!sentryInitialized) {
    return (err, req, res, next) => next(err);
  }
  return Sentry.Handlers.errorHandler();
}

/**
 * Capturar exceção manualmente
 */
function captureException(error, context = {}) {
  if (!sentryInitialized) {
    logger.error('Exceção capturada (Sentry off)', { error: error.message, ...context });
    return null;
  }

  return Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capturar mensagem
 */
function captureMessage(message, level = 'info', context = {}) {
  if (!sentryInitialized) {
    logger[level](`Mensagem capturada (Sentry off): ${message}`, context);
    return null;
  }

  return Sentry.captureMessage(message, {
    level,
    extra: context,
  });
}

/**
 * Adicionar contexto ao usuário
 */
function setUserContext(user) {
  if (!sentryInitialized) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.nome || user.name,
  });
}

/**
 * Adicionar tags customizadas
 */
function setTag(key, value) {
  if (!sentryInitialized) return;
  Sentry.setTag(key, value);
}

/**
 * Adicionar breadcrumb (rastro de eventos)
 */
function addBreadcrumb(breadcrumb) {
  if (!sentryInitialized) return;

  Sentry.addBreadcrumb({
    message: breadcrumb.message,
    category: breadcrumb.category || 'custom',
    level: breadcrumb.level || 'info',
    data: breadcrumb.data || {},
  });
}

/**
 * Limpar contexto do usuário
 */
function clearUserContext() {
  if (!sentryInitialized) return;
  Sentry.setUser(null);
}

/**
 * Flush eventos (útil antes de shutdown)
 */
async function flush(timeout = 2000) {
  if (!sentryInitialized) return true;

  try {
    await Sentry.close(timeout);
    return true;
  } catch (error) {
    logger.error('Erro ao fazer flush do Sentry', { error: error.message });
    return false;
  }
}

module.exports = {
  initializeSentry,
  sentryRequestHandler,
  sentryTracingHandler,
  sentryErrorHandler,
  captureException,
  captureMessage,
  setUserContext,
  clearUserContext,
  setTag,
  addBreadcrumb,
  flush,
  isInitialized: () => sentryInitialized,
};
