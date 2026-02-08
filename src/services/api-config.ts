
/**
 * Configuração centralizada da API
 * Define a URL base e utilitários para requisições
 */

// URL base da API
// Prioriza a variável de ambiente VITE_API_URL, mas fornece um fallback seguro para produção
const ENV_API_URL = import.meta.env.VITE_API_URL as string | undefined;

export const API_BASE_URL = ENV_API_URL && ENV_API_URL.trim().length > 0
    ? ENV_API_URL.replace(/\/$/, '')
    : 'https://muhlstore.re9suainternet.com.br/api';

/**
 * Erro customizado para respostas da API
 */
export class ApiError extends Error {
    status: number;
    data?: any;

    constructor(message: string, status: number, data?: any) {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.data = data;
    }
}

/**
 * Helper para processar respostas da API
 * Lança ApiError se a resposta não for ok
 */
/**
 * Helper para processar respostas da API
 * Lança ApiError se a resposta não for ok
 */
export async function handleApiResponse<T>(response: Response, defaultErrorMessage: string = 'Erro na requisição'): Promise<T> {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch {
            errorData = { statusText: response.statusText };
        }

        // Tenta extrair a mensagem de erro mais relevante
        const message = errorData?.error || errorData?.message || defaultErrorMessage;

        throw new ApiError(
            message,
            response.status,
            errorData
        );
    }

    // Tratamento para respostas sem conteúdo (204 No Content)
    if (response.status === 204) {
        return {} as T;
    }

    try {
        return await response.json();
    } catch (e) {
        console.error('Erro ao fazer parse do JSON:', e);
        throw new ApiError('Resposta inválida do servidor (formato inválido)', response.status);
    }
}

/**
 * Função helper para realizar requisições HTTP padronizadas.
 * Automaticamente adiciona a URL base, credenciais e headers padrão.
 * Detecta erros de CORS/rede e ativa modo offline automaticamente.
 */
export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const headers: Record<string, string> = {
        ...(options.headers as Record<string, string> || {}),
    };

    // Adiciona Content-Type: application/json se não for FormData e não estiver definido
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    // Injeção automática de Token Admin para endpoints /admin/
    if (typeof window !== 'undefined' && (endpoint.startsWith('/admin') || endpoint.includes('/api/admin'))) {
        const adminToken = localStorage.getItem('admin_token');
        if (adminToken) {
            headers['X-Admin-Token'] = adminToken;
            // Fallback para Bearer se o backend esperar Authorization
            if (!headers['Authorization']) {
                headers['Authorization'] = `Bearer ${adminToken}`;
            }
        }
    }

    const config: RequestInit = {
        ...options,
        headers,
        credentials: 'include', // Sempre envia cookies para suporte a sessões baseadas em cookie
    };

    try {
        const response = await fetch(url, config);
        return handleApiResponse<T>(response);
    } catch (error) {
        // Detectar erro de CORS ou rede (TypeError: Failed to fetch)
        const isCorsOrNetworkError = error instanceof TypeError &&
            (error.message.includes('Failed to fetch') ||
                error.message.includes('NetworkError') ||
                error.message.includes('Network request failed'));

        if (isCorsOrNetworkError) {
            console.warn('🔴 Erro de CORS/Rede detectado:', error);
            console.warn('📦 Modo offline pode ser ativado pelos serviços');

            // Ativar modo offline global para que os serviços saibam
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('api-offline-detected', {
                    detail: { endpoint, error: error.message }
                }));
            }
        }

        // Se já for ApiError, repassa. Se for erro de rede (TypeError), empacota.
        if (error instanceof ApiError) {
            throw error;
        }

        throw new ApiError(
            error instanceof Error ? error.message : 'Erro desconhecido na requisição',
            0, // Status 0 indica erro de rede/cliente
            { corsError: isCorsOrNetworkError }
        );
    }
}

/**
 * Função helper com retry automático para requisições críticas
 * Usa exponential backoff
 */
export async function requestWithRetry<T>(
    endpoint: string,
    options: RequestInit = {},
    maxRetries: number = 3
): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await request<T>(endpoint, options);
        } catch (error) {
            lastError = error as Error;

            // Se é erro de CORS, não adianta retry
            if (error instanceof ApiError && error.data?.corsError) {
                throw error;
            }

            // Se não for a última tentativa, aguarda antes de tentar novamente
            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5s
                console.log(`⏳ Tentativa ${attempt + 1}/${maxRetries} falhou. Aguardando ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('Falha após todas as tentativas');
}
