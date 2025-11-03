import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Menu, 
  X, 
  Search, 
  ShoppingCart, 
  User, 
  Home,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryLow,
  Signal,
  SignalZero,
  Sun,
  Moon,
  Settings,
  Share,
  Heart,
  MessageCircle,
  Camera,
  Mic,
  MicOff,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
  Grip,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMobileOptimization } from '@/hooks/useMobileOptimization';
import { toast } from 'sonner';

interface MobileOptimizedInterfaceProps {
  children: React.ReactNode;
  showStatusBar?: boolean;
  showNavigation?: boolean;
  enableGestures?: boolean;
  enableHapticFeedback?: boolean;
}

export function MobileOptimizedInterface({
  children,
  showStatusBar = true,
  showNavigation = true,
  enableGestures = true,
  enableHapticFeedback = true
}: MobileOptimizedInterfaceProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTab, setCurrentTab] = useState('home');
  const [gestureIndicator, setGestureIndicator] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const swipeThreshold = 50;
  const menuRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const {
    deviceInfo,
    performanceMetrics,
    viewportInfo,
    isOptimized,
    registerGestureHandler,
    unregisterGestureHandler,
    isLowEndDevice,
    shouldReduceMotion,
    getOptimalAnimationDuration
  } = useMobileOptimization();

  // Configurar handlers de gesto
  useEffect(() => {
    if (!enableGestures || !deviceInfo?.isMobile) return;

    const handleSwipeLeft = () => {
      if (currentTab === 'home') {
        setCurrentTab('search');
        showGestureFeedback('swipe-left');
      }
    };

    const handleSwipeRight = () => {
      if (currentTab === 'search') {
        setCurrentTab('home');
        showGestureFeedback('swipe-right');
      }
    };

    const handleSwipeUp = () => {
      if (!isFullscreen) {
        setIsFullscreen(true);
        showGestureFeedback('swipe-up');
      }
    };

    const handleSwipeDown = () => {
      if (isFullscreen) {
        setIsFullscreen(false);
        showGestureFeedback('swipe-down');
      }
    };

    const handleDoubleTap = () => {
      setIsDarkMode(!isDarkMode);
      showGestureFeedback('double-tap');
    };

    registerGestureHandler('navigation', ({ type, direction }) => {
      switch (type) {
        case 'swipe':
          switch (direction) {
            case 'left': handleSwipeLeft(); break;
            case 'right': handleSwipeRight(); break;
            case 'up': handleSwipeUp(); break;
            case 'down': handleSwipeDown(); break;
          }
          break;
        case 'doubletap':
          handleDoubleTap();
          break;
      }
    });

    return () => {
      unregisterGestureHandler('navigation');
    };
  }, [
    enableGestures,
    deviceInfo,
    currentTab,
    isFullscreen,
    isDarkMode,
    registerGestureHandler,
    unregisterGestureHandler
  ]);

  // Feedback háptico
  const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !('vibrate' in navigator)) return;

    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30]
    };

    navigator.vibrate(patterns[type]);
  };

  // Mostrar feedback visual de gesto
  const showGestureFeedback = (gesture: string) => {
    setGestureIndicator(gesture);
    triggerHapticFeedback('light');
    
    setTimeout(() => {
      setGestureIndicator(null);
    }, 1000);
  };

  // Obter ícone de conexão
  const getConnectionIcon = () => {
    if (!performanceMetrics) return <Wifi className="w-4 h-4" />;
    
    switch (performanceMetrics.connectionType) {
      case 'slow-2g':
      case '2g':
        return <SignalZero className="w-4 h-4 text-red-500" />;
      case '3g':
        return <Signal className="w-4 h-4 text-yellow-500" />;
      case '4g':
      case '5g':
      case 'wifi':
        return <Wifi className="w-4 h-4 text-green-500" />;
      default:
        return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  // Obter ícone de bateria
  const getBatteryIcon = () => {
    if (!performanceMetrics?.batteryLevel) return <Battery className="w-4 h-4" />;
    
    if (performanceMetrics.batteryLevel < 20) {
      return <BatteryLow className="w-4 h-4 text-red-500" />;
    }
    
    return <Battery className="w-4 h-4" />;
  };

  // Animação otimizada
  const animationDuration = getOptimalAnimationDuration();

  if (!deviceInfo?.isMobile && !deviceInfo?.isTablet) {
    return <>{children}</>;
  }

  return (
    <div className={`mobile-interface ${isDarkMode ? 'dark' : ''} ${isOptimized ? 'optimized' : ''}`}>
      {/* Status Bar */}
      {showStatusBar && (
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{ duration: animationDuration }}
          className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm text-white text-xs px-4 py-1 flex justify-between items-center"
          style={{ paddingTop: `${viewportInfo?.safeAreaInsets.top || 0}px` }}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium">{new Date().toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</span>
          </div>
          
          <div className="flex items-center gap-2">
            {getConnectionIcon()}
            {getBatteryIcon()}
            <span className="text-xs">
              {performanceMetrics?.batteryLevel ? `${performanceMetrics.batteryLevel}%` : '100%'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Gesture Indicator */}
      <AnimatePresence>
        {gestureIndicator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-black/50 backdrop-blur-sm rounded-full p-4">
              <div className="text-white text-2xl">
                {gestureIndicator === 'swipe-left' && <ChevronLeft className="w-8 h-8" />}
                {gestureIndicator === 'swipe-right' && <ChevronRight className="w-8 h-8" />}
                {gestureIndicator === 'swipe-up' && <ChevronUp className="w-8 h-8" />}
                {gestureIndicator === 'swipe-down' && <ChevronDown className="w-8 h-8" />}
                {gestureIndicator === 'double-tap' && <Sun className="w-8 h-8" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <motion.div
        ref={contentRef}
        className={`main-content ${isFullscreen ? 'fullscreen' : ''}`}
        style={{
          paddingTop: showStatusBar ? '60px' : '0',
          paddingBottom: showNavigation ? '80px' : '0'
        }}
        animate={{
          scale: isFullscreen ? 1.05 : 1,
          borderRadius: isFullscreen ? 0 : 16
        }}
        transition={{ duration: animationDuration }}
      >
        {children}
      </motion.div>

      {/* Bottom Navigation */}
      {showNavigation && !isFullscreen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          transition={{ duration: animationDuration }}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-gray-200"
          style={{ paddingBottom: `${viewportInfo?.safeAreaInsets.bottom || 0}px` }}
        >
          <div className="flex justify-around items-center py-2">
            <Button
              variant={currentTab === 'home' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('home')}
              className="flex flex-col items-center gap-1 h-12"
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Início</span>
            </Button>
            
            <Button
              variant={currentTab === 'search' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentTab('search')}
              className="flex flex-col items-center gap-1 h-12"
            >
              <Search className="w-5 h-5" />
              <span className="text-xs">Buscar</span>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-12 relative"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="text-xs">Carrinho</span>
              <Badge className="absolute -top-1 -right-1 w-5 h-5 text-xs">3</Badge>
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-1 h-12"
            >
              <User className="w-5 h-5" />
              <span className="text-xs">Perfil</span>
            </Button>
          </div>
        </motion.div>
      )}

      {/* Side Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setIsMenuOpen(false)}
            />
            
            <motion.div
              ref={menuRef}
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: animationDuration }}
              className="fixed left-0 top-0 bottom-0 z-50 w-80 bg-white shadow-2xl"
              style={{ paddingTop: `${(viewportInfo?.safeAreaInsets.top || 0) + 20}px` }}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Menu</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <Button variant="ghost" className="w-full justify-start">
                    <Home className="w-5 h-5 mr-3" />
                    Início
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start">
                    <Search className="w-5 h-5 mr-3" />
                    Buscar
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start">
                    <ShoppingCart className="w-5 h-5 mr-3" />
                    Carrinho
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="w-5 h-5 mr-3" />
                    Perfil
                  </Button>
                  
                  <Button variant="ghost" className="w-full justify-start">
                    <Settings className="w-5 h-5 mr-3" />
                    Configurações
                  </Button>
                </div>
                
                {/* Device Info */}
                {deviceInfo && (
                  <Card className="mt-8">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Informações do Dispositivo</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span>Plataforma:</span>
                        <span className="font-medium">{deviceInfo.platform}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Orientacao:</span>
                        <span className="font-medium">{deviceInfo.orientation}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolucao:</span>
                        <span className="font-medium">{deviceInfo.viewport.width}x{deviceInfo.viewport.height}</span>
                      </div>
                      {performanceMetrics && (
                        <>
                          <div className="flex justify-between">
                            <span>Conexao:</span>
                            <span className="font-medium">{performanceMetrics.connectionType}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Memoria:</span>
                            <span className="font-medium">{performanceMetrics.memoryUsage.toFixed(1)}MB</span>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-20 right-4 z-40"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, duration: animationDuration }}
      >
        <Button
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* Performance Indicator */}
      {isLowEndDevice() && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-4 left-4 z-30"
        >
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Modo Economia
          </Badge>
        </motion.div>
      )}

      {/* Styles dinâmicos */}
      <style jsx>{`
        .mobile-interface {
          --safe-area-inset-top: ${viewportInfo?.safeAreaInsets.top || 0}px;
          --safe-area-inset-bottom: ${viewportInfo?.safeAreaInsets.bottom || 0}px;
          --animation-duration: ${animationDuration}s;
        }
        
        .mobile-interface.optimized {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        .mobile-interface.dark {
          background-color: #000;
          color: #fff;
        }
        
        .main-content.fullscreen {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 30;
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
