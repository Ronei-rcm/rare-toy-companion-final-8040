import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gerenciar modo offline
 * Detecta quando a aplicação está sem conexão ou com problemas de CORS
 * e ativa automaticamente o modo fallback
 */

interface OfflineState {
    isOffline: boolean;
    lastOnline: Date | null;
    retryCount: number;
}

export function useOfflineMode() {
    const [state, setState] = useState<OfflineState>({
        isOffline: false,
        lastOnline: null,
        retryCount: 0
    });

    // Detectar mudanças de conectividade
    useEffect(() => {
        const handleOnline = () => {
            console.log('🌐 Conexão restaurada');
            setState(prev => ({
                ...prev,
                isOffline: false,
                lastOnline: new Date(),
                retryCount: 0
            }));
        };

        const handleOffline = () => {
            console.log('📵 Conexão perdida');
            setState(prev => ({
                ...prev,
                isOffline: true
            }));
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Estado inicial
        if (!navigator.onLine) {
            setState(prev => ({ ...prev, isOffline: true }));
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Função para forçar modo offline (útil para testes ou quando CORS falha)
    const setOfflineMode = useCallback((offline: boolean) => {
        setState(prev => ({
            ...prev,
            isOffline: offline,
            lastOnline: offline ? prev.lastOnline : new Date()
        }));
    }, []);

    // Incrementar contador de retry
    const incrementRetry = useCallback(() => {
        setState(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1
        }));
    }, []);

    // Reset retry counter
    const resetRetry = useCallback(() => {
        setState(prev => ({
            ...prev,
            retryCount: 0
        }));
    }, []);

    return {
        isOffline: state.isOffline,
        lastOnline: state.lastOnline,
        retryCount: state.retryCount,
        setOfflineMode,
        incrementRetry,
        resetRetry
    };
}

// Contexto global de modo offline (opcional, pode ser usado depois)
let globalOfflineMode = false;

export function setGlobalOfflineMode(offline: boolean) {
    globalOfflineMode = offline;
    console.log(`🔄 Modo offline global: ${offline ? 'ATIVADO' : 'DESATIVADO'}`);
}

export function isGlobalOfflineMode(): boolean {
    return globalOfflineMode;
}
