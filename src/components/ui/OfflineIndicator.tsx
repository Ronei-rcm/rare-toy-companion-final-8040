import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            // Mostrar brevemente mensagem de "Conectado" ou apenas esconder
            setTimeout(() => setIsVisible(false), 3000);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setIsVisible(true);
        };

        // Ouvir eventos de API offline (disparados pelo api-config.ts)
        const handleApiOffline = () => {
            setIsOffline(true);
            setIsVisible(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        window.addEventListener('api-offline-detected', handleApiOffline);

        // Checar estado inicial
        if (!navigator.onLine) {
            setIsVisible(true);
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('api-offline-detected', handleApiOffline);
        };
    }, []);

    if (!isVisible && !isOffline) return null;

    return (
        <div
            className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-auto z-[9999] transition-all duration-300 transform ${isOffline ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}
        >
            <div className="bg-slate-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between md:justify-start gap-3 border border-slate-700">
                <WifiOff className="h-5 w-5 text-red-400 animate-pulse" />
                <div className="flex flex-col">
                    <span className="font-medium text-sm">Você está offline</span>
                    <span className="text-xs text-slate-400">Exibindo dados salvos localmente</span>
                </div>
            </div>
        </div>
    );
};
