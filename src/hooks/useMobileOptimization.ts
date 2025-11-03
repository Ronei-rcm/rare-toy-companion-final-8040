import { useState, useEffect, useCallback, useRef } from 'react';

interface TouchGesture {
  type: 'swipe' | 'pinch' | 'rotate' | 'tap' | 'longpress' | 'doubletap';
  direction?: 'left' | 'right' | 'up' | 'down';
  distance?: number;
  velocity?: number;
  scale?: number;
  rotation?: number;
  duration?: number;
  center?: { x: number; y: number };
}

interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown';
  browser: string;
  version: string;
  orientation: 'portrait' | 'landscape';
  screenSize: { width: number; height: number };
  viewport: { width: number; height: number };
  pixelRatio: number;
  touchSupport: boolean;
  gestureSupport: boolean;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  batteryLevel?: number;
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
  connectionEffectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number;
  rtt: number;
}

interface ViewportInfo {
  width: number;
  height: number;
  safeAreaInsets: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  keyboardHeight: number;
  isKeyboardVisible: boolean;
}

export function useMobileOptimization() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo | null>(null);
  const [gestureHandlers, setGestureHandlers] = useState<Map<string, (gesture: TouchGesture) => void>>(new Map());
  const [isOptimized, setIsOptimized] = useState(false);
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchHistoryRef = useRef<TouchGesture[]>([]);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Detectar informações do dispositivo
  const detectDeviceInfo = useCallback((): DeviceInfo => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    
    // Detectar plataforma
    let detectedPlatform: DeviceInfo['platform'] = 'unknown';
    if (userAgent.includes('iphone') || userAgent.includes('ipad')) {
      detectedPlatform = 'ios';
    } else if (userAgent.includes('android')) {
      detectedPlatform = 'android';
    } else if (platform.includes('win')) {
      detectedPlatform = 'windows';
    } else if (platform.includes('mac')) {
      detectedPlatform = 'macos';
    } else if (platform.includes('linux')) {
      detectedPlatform = 'linux';
    }

    // Detectar tipo de dispositivo
    const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const isTablet = /ipad|android(?!.*mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    // Detectar browser
    let browser = 'unknown';
    if (userAgent.includes('chrome')) browser = 'Chrome';
    else if (userAgent.includes('firefox')) browser = 'Firefox';
    else if (userAgent.includes('safari')) browser = 'Safari';
    else if (userAgent.includes('edge')) browser = 'Edge';

    // Detectar orientação
    const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';

    return {
      isMobile,
      isTablet,
      isDesktop,
      platform: detectedPlatform,
      browser,
      version: '1.0', // Placeholder
      orientation,
      screenSize: { width: screen.width, height: screen.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      pixelRatio: window.devicePixelRatio,
      touchSupport: 'ontouchstart' in window,
      gestureSupport: 'onpointerdown' in window
    };
  }, []);

  // Detectar métricas de performance
  const detectPerformanceMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    // Detectar tipo de conexão
    let connectionType: PerformanceMetrics['connectionType'] = 'unknown';
    let connectionEffectiveType: PerformanceMetrics['connectionEffectiveType'] = 'unknown';
    let downlink = 0;
    let rtt = 0;

    if (connection) {
      connectionType = connection.effectiveType || 'unknown';
      connectionEffectiveType = connection.effectiveType || 'unknown';
      downlink = connection.downlink || 0;
      rtt = connection.rtt || 0;
    }

    // Detectar nível da bateria
    let batteryLevel: number | undefined;
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        batteryLevel = Math.round(battery.level * 100);
      } catch (error) {
        console.warn('Não foi possível acessar informações da bateria');
      }
    }

    // Medir tempo de renderização
    const renderTime = performance.now();

    // Detectar uso de memória
    let memoryUsage = 0;
    if ('memory' in performance) {
      memoryUsage = (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }

    return {
      renderTime,
      memoryUsage,
      batteryLevel,
      connectionType,
      connectionEffectiveType,
      downlink,
      rtt
    };
  }, []);

  // Detectar informações do viewport
  const detectViewportInfo = useCallback((): ViewportInfo => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    // Detectar safe area insets (para dispositivos com notch)
    const safeAreaInsets = {
      top: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-top)') || '0'),
      right: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-right)') || '0'),
      bottom: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0'),
      left: parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-left)') || '0')
    };

    // Detectar altura do teclado (aproximação)
    const keyboardHeight = Math.max(0, window.screen.height - window.innerHeight);
    const isKeyboardVisible = keyboardHeight > 150; // Threshold para detectar teclado

    return {
      width,
      height,
      safeAreaInsets,
      keyboardHeight,
      isKeyboardVisible
    };
  }, []);

  // Processar gestos de toque
  const processTouchGesture = useCallback((touches: TouchList, type: 'start' | 'move' | 'end'): TouchGesture | null => {
    if (touches.length === 0) return null;

    const touch = touches[0];
    const currentTime = Date.now();

    if (type === 'start') {
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: currentTime
      };
      return null;
    }

    if (!touchStartRef.current) return null;

    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = currentTime - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const velocity = distance / deltaTime;

    // Detectar tipo de gesto
    if (touches.length === 1) {
      if (distance < 10 && deltaTime < 200) {
        return {
          type: 'tap',
          duration: deltaTime,
          center: { x: touch.clientX, y: touch.clientY }
        };
      }

      if (distance > 50 && velocity > 0.3) {
        let direction: TouchGesture['direction'];
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        return {
          type: 'swipe',
          direction,
          distance,
          velocity,
          duration: deltaTime,
          center: { x: touch.clientX, y: touch.clientY }
        };
      }
    }

    return null;
  }, []);

  // Registrar handler de gesto
  const registerGestureHandler = useCallback((id: string, handler: (gesture: TouchGesture) => void) => {
    setGestureHandlers(prev => new Map(prev.set(id, handler)));
  }, []);

  // Remover handler de gesto
  const unregisterGestureHandler = useCallback((id: string) => {
    setGestureHandlers(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  // Executar handlers de gesto
  const executeGestureHandlers = useCallback((gesture: TouchGesture) => {
    gestureHandlers.forEach(handler => {
      try {
        handler(gesture);
      } catch (error) {
        console.error('Erro no handler de gesto:', error);
      }
    });
  }, [gestureHandlers]);

  // Otimizar para mobile
  const optimizeForMobile = useCallback(() => {
    if (!deviceInfo?.isMobile) return;

    // Otimizações de CSS
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
    document.documentElement.style.setProperty('--safe-area-inset-top', `${viewportInfo?.safeAreaInsets.top || 0}px`);
    document.documentElement.style.setProperty('--safe-area-inset-bottom', `${viewportInfo?.safeAreaInsets.bottom || 0}px`);

    // Otimizações de performance
    if (performanceMetrics?.connectionType === 'slow-2g' || performanceMetrics?.connectionType === '2g') {
      // Reduzir qualidade de imagens
      document.querySelectorAll('img').forEach(img => {
        if (img.src.includes('?')) {
          img.src += '&quality=60';
        } else {
          img.src += '?quality=60';
        }
      });

      // Desabilitar animações complexas
      document.documentElement.style.setProperty('--animation-duration', '0.2s');
    }

    // Otimizações de bateria
    if (performanceMetrics?.batteryLevel && performanceMetrics.batteryLevel < 20) {
      // Reduzir atualizações em tempo real
      document.documentElement.classList.add('battery-save-mode');
    }

    setIsOptimized(true);
  }, [deviceInfo, viewportInfo, performanceMetrics]);

  // Configurar listeners de toque
  useEffect(() => {
    if (!deviceInfo?.touchSupport) return;

    const handleTouchStart = (e: TouchEvent) => {
      processTouchGesture(e.touches, 'start');
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const gesture = processTouchGesture(e.touches, 'end');
      if (gesture) {
        touchHistoryRef.current.push(gesture);
        if (touchHistoryRef.current.length > 10) {
          touchHistoryRef.current.shift();
        }
        executeGestureHandlers(gesture);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [deviceInfo, processTouchGesture, executeGestureHandlers]);

  // Configurar listeners de viewport
  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDeviceInfo());
      setViewportInfo(detectViewportInfo());
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setDeviceInfo(detectDeviceInfo());
        setViewportInfo(detectViewportInfo());
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [detectDeviceInfo, detectViewportInfo]);

  // Configurar monitoramento de performance
  useEffect(() => {
    const updatePerformanceMetrics = async () => {
      const metrics = await detectPerformanceMetrics();
      setPerformanceMetrics(metrics);
    };

    updatePerformanceMetrics();
    const interval = setInterval(updatePerformanceMetrics, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [detectPerformanceMetrics]);

  // Aplicar otimizações quando as informações estiverem disponíveis
  useEffect(() => {
    if (deviceInfo && viewportInfo && performanceMetrics) {
      optimizeForMobile();
    }
  }, [deviceInfo, viewportInfo, performanceMetrics, optimizeForMobile]);

  // Inicializar informações
  useEffect(() => {
    setDeviceInfo(detectDeviceInfo());
    setViewportInfo(detectViewportInfo());
  }, [detectDeviceInfo, detectViewportInfo]);

  // Funções utilitárias
  const isLowEndDevice = useCallback(() => {
    if (!deviceInfo || !performanceMetrics) return false;
    
    return (
      deviceInfo.pixelRatio < 2 ||
      performanceMetrics.memoryUsage > 100 ||
      performanceMetrics.connectionType === 'slow-2g' ||
      performanceMetrics.connectionType === '2g'
    );
  }, [deviceInfo, performanceMetrics]);

  const shouldReduceMotion = useCallback(() => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  const getOptimalImageQuality = useCallback(() => {
    if (!performanceMetrics) return 80;
    
    switch (performanceMetrics.connectionType) {
      case 'slow-2g': return 40;
      case '2g': return 50;
      case '3g': return 60;
      case '4g': return 80;
      case '5g': return 90;
      case 'wifi': return 95;
      default: return 70;
    }
  }, [performanceMetrics]);

  const getOptimalAnimationDuration = useCallback(() => {
    if (shouldReduceMotion()) return 0;
    if (isLowEndDevice()) return 0.2;
    return 0.3;
  }, [shouldReduceMotion, isLowEndDevice]);

  return {
    // Estado
    deviceInfo,
    performanceMetrics,
    viewportInfo,
    isOptimized,
    
    // Ações
    registerGestureHandler,
    unregisterGestureHandler,
    optimizeForMobile,
    
    // Utilitários
    isLowEndDevice,
    shouldReduceMotion,
    getOptimalImageQuality,
    getOptimalAnimationDuration,
    
    // Histórico de gestos
    gestureHistory: touchHistoryRef.current
  };
}
