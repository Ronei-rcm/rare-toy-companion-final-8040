import React, { useEffect } from 'react';
import { SplashScreen } from '@capacitor/splash-screen';
import { haptics } from '@/utils/haptics';

export const NativeEffects = () => {
    useEffect(() => {
        // Esconder Splash Screen suavemente ao carregar
        const hideSplash = async () => {
            try {
                await SplashScreen.hide({ fadeoutDuration: 500 });
            } catch (e) {
                console.warn('Splash screen not available', e);
            }
        };

        hideSplash();

        // Pull-to-refresh simples
        let touchStart = 0;
        let touchY = 0;

        const handleTouchStart = (e: TouchEvent) => {
            if (window.scrollY === 0) {
                touchStart = e.touches[0].clientY;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            touchY = e.touches[0].clientY;
        };

        const handleTouchEnd = async () => {
            if (window.scrollY === 0 && touchStart > 0 && touchY - touchStart > 150) {
                // Puxou para baixo bastante
                await haptics.medium();
                window.location.reload();
            }
            touchStart = 0;
            touchY = 0;
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchmove', handleTouchMove);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, []);

    return null;
};
