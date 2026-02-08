import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export const haptics = {
    /**
     * Vibração leve para toques em botões
     */
    light: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    /**
     * Vibração média para ações importantes (adicionar ao carrinho)
     */
    medium: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Medium });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    /**
     * Vibração pesada para erros ou alertas críticos
     */
    heavy: async () => {
        if (!isNative) return;
        try {
            await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    /**
     * Feedback de sucesso (vibração positiva)
     */
    success: async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Success });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    /**
     * Feedback de erro (vibração negativa)
     */
    error: async () => {
        if (!isNative) return;
        try {
            await Haptics.notification({ type: NotificationType.Error });
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    },

    /**
     * Vibração simples
     */
    vibrate: async () => {
        if (!isNative) return;
        try {
            await Haptics.vibrate();
        } catch (e) {
            console.warn('Haptics not available', e);
        }
    }
};
