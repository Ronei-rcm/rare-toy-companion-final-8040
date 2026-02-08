import { request } from '../services/api-config';

/**
 * Utilitário para fazer requisições autenticadas como administrador
 * 
 * Este utilitário adiciona automaticamente o token de admin aos headers
 * das requisições para endpoints /api/admin/*
 */

/**
 * Obter token de admin do localStorage
 */
function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_token');
}

/**
 * Adicionar headers de autenticação admin a uma requisição
 */
export function addAdminHeaders(headers: HeadersInit = {}): HeadersInit {
  const adminToken = getAdminToken();

  const headersObj = headers instanceof Headers
    ? Object.fromEntries(headers.entries())
    : typeof headers === 'object' && headers !== null
      ? { ...headers }
      : {};

  if (adminToken) {
    headersObj['X-Admin-Token'] = adminToken;
  }

  return headersObj;
}

/**
 * Fazer fetch com autenticação admin automática
 * 
 * @param url - URL da requisição
 * @param options - Opções do fetch (serão mescladas com headers de autenticação)
 * @returns Promise<Response>
 * 
 * @example
 * ```ts
 * const response = await fetchAdmin('/api/admin/marketplace/sellers');
 * const data = await response.json();
 * ```
 */
export async function fetchAdmin<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const isAdminEndpoint = url.startsWith('/api/admin') || url.includes('/api/admin');

  // Adicionar headers de autenticação se for endpoint admin
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Mesclar headers existentes
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        baseHeaders[key] = value;
      });
    } else if (typeof options.headers === 'object') {
      Object.assign(baseHeaders, options.headers);
    }
  }

  // Adicionar token de admin se for endpoint admin
  if (isAdminEndpoint) {
    const adminToken = getAdminToken();
    if (adminToken) {
      baseHeaders['X-Admin-Token'] = adminToken;
    }
  }

  return request<T>(url, {
    ...options,
    headers: baseHeaders,
  });
}

/**
 * Verificar se o usuário está autenticado como admin
 */
export function isAdminAuthenticated(): boolean {
  return getAdminToken() !== null;
}

/**
 * Hook React para usar fetchAdmin
 * 
 * @example
 * ```tsx
 * const { fetchAdmin, isAuthenticated } = useAdminFetch();
 * 
 * useEffect(() => {
 *   if (isAuthenticated) {
 *     fetchAdmin('/api/admin/marketplace/sellers')
 *       .then(res => res.json())
 *       .then(data => console.log(data));
 *   }
 * }, [isAuthenticated]);
 * ```
 */
export function useAdminFetch() {
  const [isAuthenticated, setIsAuthenticated] = React.useState(isAdminAuthenticated);

  React.useEffect(() => {
    // Verificar autenticação periodicamente
    const checkAuth = () => {
      setIsAuthenticated(isAdminAuthenticated());
    };

    checkAuth();
    const interval = setInterval(checkAuth, 5000); // Verificar a cada 5 segundos

    return () => clearInterval(interval);
  }, []);

  return {
    fetchAdmin,
    isAuthenticated,
    addAdminHeaders,
  };
}

// Importar React apenas se estiver em ambiente React
import * as React from 'react';

