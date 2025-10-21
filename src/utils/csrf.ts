/**
 * Cliente CSRF - Utilitários para trabalhar com tokens CSRF no frontend
 */

const CSRF_TOKEN_KEY = 'csrf-token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf-token-expiry';

/**
 * Obter token CSRF do servidor
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Falha ao obter token CSRF');
    }

    const data = await response.json();
    
    // Armazenar token e tempo de expiração
    localStorage.setItem(CSRF_TOKEN_KEY, data.csrfToken);
    localStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, String(Date.now() + data.expiresIn));

    return data.csrfToken;
  } catch (error) {
    console.error('Erro ao buscar token CSRF:', error);
    throw error;
  }
}

/**
 * Obter token CSRF armazenado (ou buscar novo se expirado)
 */
export async function getCsrfToken(): Promise<string> {
  const token = localStorage.getItem(CSRF_TOKEN_KEY);
  const expiry = localStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);

  // Se não há token ou expirou, buscar novo
  if (!token || !expiry || Date.now() > parseInt(expiry)) {
    return await fetchCsrfToken();
  }

  return token;
}

/**
 * Adicionar token CSRF aos headers de uma requisição
 */
export async function addCsrfHeader(headers: HeadersInit = {}): Promise<HeadersInit> {
  const token = await getCsrfToken();
  
  return {
    ...headers,
    'X-CSRF-Token': token,
  };
}

/**
 * Fazer fetch com proteção CSRF automática
 */
export async function fetchWithCsrf(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';

  // Métodos seguros não precisam de CSRF
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return fetch(url, options);
  }

  // Adicionar token CSRF aos headers
  const headers = await addCsrfHeader(options.headers);

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Importante para cookies
  });
}

/**
 * Hook React para usar CSRF
 */
export function useCsrfToken() {
  const [token, setToken] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const newToken = await getCsrfToken();
      setToken(newToken);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      setIsLoading(true);
      const newToken = await fetchCsrfToken();
      setToken(newToken);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    token,
    isLoading,
    error,
    refreshToken,
    addCsrfHeader,
    fetchWithCsrf,
  };
}

// Interceptor global para adicionar CSRF em todas as requisições
let originalFetch: typeof fetch;

/**
 * Ativar proteção CSRF global
 */
export function enableGlobalCsrfProtection() {
  if (typeof window === 'undefined') return;

  // Salvar fetch original
  if (!originalFetch) {
    originalFetch = window.fetch;
  }

  // Substituir fetch global
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input.toString();

    // Se for requisição para nossa API, adicionar CSRF
    if (url.startsWith('/api') || url.includes(window.location.origin)) {
      return fetchWithCsrf(url, init);
    }

    // Caso contrário, usar fetch normal
    return originalFetch(input, init);
  };
}

/**
 * Desativar proteção CSRF global
 */
export function disableGlobalCsrfProtection() {
  if (typeof window === 'undefined' || !originalFetch) return;
  window.fetch = originalFetch;
}

// React é importado apenas se disponível
let React: any;
try {
  React = require('react');
} catch {
  // React não disponível
}
