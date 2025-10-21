import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  isSlowConnection: boolean;
  isLowEndDevice: boolean;
  prefersReducedMotion: boolean;
  memoryUsage?: number;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    isSlowConnection: false,
    isLowEndDevice: false,
    prefersReducedMotion: false
  });

  const [isVisible, setIsVisible] = useState(true);
  const visibilityTimeoutRef = useRef<NodeJS.Timeout>();

  // Detectar conexão lenta
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const isSlowConnection = connection.effectiveType === 'slow-2g' || 
                              connection.effectiveType === '2g' ||
                              connection.saveData;

      setMetrics(prev => ({ ...prev, isSlowConnection }));
    }
  }, []);

  // Detectar dispositivo de baixo desempenho
  useEffect(() => {
    const isLowEndDevice = navigator.hardwareConcurrency <= 2 || 
                          (navigator as any).deviceMemory <= 4;

    setMetrics(prev => ({ ...prev, isLowEndDevice }));
  }, []);

  // Detectar preferência de movimento reduzido
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMetrics(prev => ({ ...prev, prefersReducedMotion }));
  }, []);

  // Monitorar uso de memória (se disponível)
  useEffect(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      
      setMetrics(prev => ({ ...prev, memoryUsage }));
    }
  }, []);

  // Detectar quando a aba não está visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        // Pausar animações e timers quando a aba não está visível
      } else {
        setIsVisible(true);
        // Retomar animações quando a aba volta a ficar visível
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Debounce para otimizar re-renders
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(null, args), delay);
    };
  }, []);

  // Throttle para otimizar eventos frequentes
  const throttle = useCallback((func: Function, delay: number) => {
    let inThrottle: boolean;
    return (...args: any[]) => {
      if (!inThrottle) {
        func.apply(null, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, delay);
      }
    };
  }, []);

  // Verificar se deve reduzir animações
  const shouldReduceAnimations = metrics.prefersReducedMotion || 
                                metrics.isSlowConnection || 
                                metrics.isLowEndDevice;

  // Verificar se deve usar lazy loading
  const shouldUseLazyLoading = metrics.isSlowConnection || 
                              metrics.isLowEndDevice;

  // Verificar se deve reduzir qualidade de imagem
  const shouldReduceImageQuality = metrics.isSlowConnection;

  return {
    metrics,
    isVisible,
    shouldReduceAnimations,
    shouldUseLazyLoading,
    shouldReduceImageQuality,
    debounce,
    throttle
  };
};

export default usePerformance;
