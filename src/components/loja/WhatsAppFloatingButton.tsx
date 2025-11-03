import React, { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useHomeConfig } from '@/contexts/HomeConfigContext';

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string;
  message?: string;
  showAfterScroll?: number;
}

const WhatsAppFloatingButton: React.FC<WhatsAppFloatingButtonProps> = ({
  phoneNumber,
  message,
  showAfterScroll,
}) => {
  const { config } = useHomeConfig();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const effectiveNumber = (phoneNumber || config.contact?.whatsappNumber || '5511999999999').toString();
  const effectiveMessage = message || config.contact?.whatsappMessage || 'Olá! Gostaria de saber mais sobre os produtos da MuhlStore.';
  const effectiveShowAfter = showAfterScroll ?? config.contact?.showAfterScroll ?? 300;
  const enabled = config.contact?.showWhatsAppButton !== false;

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      setIsVisible(scrolled > effectiveShowAfter);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [effectiveShowAfter]);

  // Auto-expandir por 5 segundos quando aparecer
  useEffect(() => {
    if (isVisible && !isExpanded) {
      setIsExpanded(true);
      const timer = setTimeout(() => setIsExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  const handleClick = () => {
    const encodedMessage = encodeURIComponent(effectiveMessage);
    const whatsappUrl = `https://wa.me/${effectiveNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {enabled && isVisible && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2"
        >
          {/* Tooltip/Mensagem */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="relative"
              >
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 pr-8 max-w-[200px] border">
                  <p className="text-sm font-medium mb-1">Precisa de ajuda?</p>
                  <p className="text-xs text-muted-foreground">
                    Fale conosco pelo WhatsApp!
                  </p>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                    aria-label="Fechar mensagem"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Arrow */}
                  <div className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-0 h-0 border-t-8 border-t-transparent border-b-8 border-b-transparent border-l-8 border-l-white dark:border-l-gray-800" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Botão Principal */}
          <Button
            onClick={handleClick}
            onMouseEnter={() => setIsExpanded(true)}
            onMouseLeave={() => setIsExpanded(false)}
            size="lg"
            className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
            aria-label="Abrir WhatsApp"
          >
            {/* Ripple effect */}
            <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 rounded-full transition-opacity duration-300" />
            
            {/* Ping animation */}
            <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75" style={{ animationDuration: '2s' }} />
            
            {/* Icon */}
            <MessageCircle className="w-7 h-7 relative z-10" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WhatsAppFloatingButton;
