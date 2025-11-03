import { useState, useEffect, useCallback } from 'react';

interface AccessibilitySettings {
  reducedMotion: boolean;
  highContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  screenReader: boolean;
  keyboardNavigation: boolean;
}

interface AccessibilityState extends AccessibilitySettings {
  isKeyboardUser: boolean;
  focusVisible: boolean;
  announcements: string[];
}

const defaultSettings: AccessibilityState = {
  reducedMotion: false,
  highContrast: false,
  fontSize: 'medium',
  screenReader: false,
  keyboardNavigation: false,
  isKeyboardUser: false,
  focusVisible: false,
  announcements: []
};

const useAccessibility = () => {
  const [state, setState] = useState<AccessibilityState>(defaultSettings);

  // Detectar preferências do usuário
  useEffect(() => {
    const mediaQueries = {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
      highContrast: window.matchMedia('(prefers-contrast: high)')
    };

    const updateSettings = () => {
      setState(prev => ({
        ...prev,
        reducedMotion: mediaQueries.reducedMotion.matches,
        highContrast: mediaQueries.highContrast.matches
      }));
    };

    // Verificar preferências iniciais
    updateSettings();

    // Escutar mudanças
    mediaQueries.reducedMotion.addEventListener('change', updateSettings);
    mediaQueries.highContrast.addEventListener('change', updateSettings);

    // Detectar se é usuário de teclado
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setState(prev => ({ ...prev, isKeyboardUser: true, focusVisible: true }));
      }
    };

    const handleMouseDown = () => {
      setState(prev => ({ ...prev, isKeyboardUser: false }));
    };

    const handleFocusIn = () => {
      if (state.isKeyboardUser) {
        setState(prev => ({ ...prev, focusVisible: true }));
      }
    };

    const handleFocusOut = () => {
      setState(prev => ({ ...prev, focusVisible: false }));
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      mediaQueries.reducedMotion.removeEventListener('change', updateSettings);
      mediaQueries.highContrast.removeEventListener('change', updateSettings);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [state.isKeyboardUser]);

  // Aplicar configurações de acessibilidade ao DOM
  useEffect(() => {
    const root = document.documentElement;

    // Reduzir movimento
    if (state.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
      root.style.setProperty('--animation-iteration-count', '1');
    } else {
      root.style.removeProperty('--animation-duration');
      root.style.removeProperty('--animation-iteration-count');
    }

    // Alto contraste
    if (state.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Tamanho da fonte
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--base-font-size', fontSizeMap[state.fontSize]);

  }, [state.reducedMotion, state.highContrast, state.fontSize]);

  // Função para fazer anúncios para leitores de tela
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover após um tempo
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    setState(prev => ({
      ...prev,
      announcements: [...prev.announcements, message]
    }));
  }, []);

  // Função para gerenciar foco
  const focusElement = useCallback((selector: string) => {
    const element = document.querySelector(selector) as HTMLElement;
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Função para criar região de foco
  const createFocusTrap = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Função para validar acessibilidade de formulários
  const validateFormAccessibility = useCallback((form: HTMLFormElement) => {
    const issues: string[] = [];

    // Verificar labels
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach((input) => {
      const element = input as HTMLInputElement;
      const hasLabel = element.labels && element.labels.length > 0;
      const hasAriaLabel = element.hasAttribute('aria-label');
      const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push(`Campo ${element.name || element.id} não possui label`);
      }

      // Verificar campos obrigatórios
      if (element.required && !element.hasAttribute('aria-required')) {
        issues.push(`Campo obrigatório ${element.name || element.id} não possui aria-required`);
      }
    });

    // Verificar botões
    const buttons = form.querySelectorAll('button');
    buttons.forEach((button) => {
      const element = button as HTMLButtonElement;
      if (!element.textContent && !element.hasAttribute('aria-label')) {
        issues.push('Botão sem texto ou aria-label');
      }
    });

    return issues;
  }, []);

  // Função para otimizar contraste de cores
  const getAccessibleColor = useCallback((color: string, background: string) => {
    // Implementação simplificada - em produção, use uma biblioteca como color-contrast
    const getLuminance = (hex: string) => {
      const rgb = parseInt(hex.slice(1), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const textLuminance = getLuminance(color);
    const backgroundLuminance = getLuminance(background);
    const contrast = (Math.max(textLuminance, backgroundLuminance) + 0.05) / 
                    (Math.min(textLuminance, backgroundLuminance) + 0.05);

    return contrast >= 4.5; // WCAG AA
  }, []);

  // Função para melhorar navegação por teclado
  const enhanceKeyboardNavigation = useCallback(() => {
    // Adicionar indicadores visuais de foco
    const style = document.createElement('style');
    style.textContent = `
      .focus-visible {
        outline: 2px solid var(--primary);
        outline-offset: 2px;
      }
      
      .high-contrast .focus-visible {
        outline: 3px solid #ffffff;
        outline-offset: 2px;
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Função para adicionar skip links
  const addSkipLinks = useCallback(() => {
    const skipLinks = document.createElement('div');
    skipLinks.className = 'skip-links';
    skipLinks.innerHTML = `
      <a href="#main-content" class="skip-link">Pular para conteúdo principal</a>
      <a href="#navigation" class="skip-link">Pular para navegação</a>
      <a href="#cart" class="skip-link">Pular para carrinho</a>
    `;

    const style = document.createElement('style');
    style.textContent = `
      .skip-links {
        position: absolute;
        top: -40px;
        left: 6px;
        z-index: 1000;
      }
      
      .skip-link {
        position: absolute;
        left: -9999px;
        top: auto;
        width: 1px;
        height: 1px;
        overflow: hidden;
        background: var(--primary);
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 4px;
      }
      
      .skip-link:focus {
        position: static;
        width: auto;
        height: auto;
        left: auto;
        top: auto;
      }
    `;

    document.head.appendChild(style);
    document.body.insertBefore(skipLinks, document.body.firstChild);

    return () => {
      document.head.removeChild(style);
      document.body.removeChild(skipLinks);
    };
  }, []);

  return {
    ...state,
    announce,
    focusElement,
    createFocusTrap,
    validateFormAccessibility,
    getAccessibleColor,
    enhanceKeyboardNavigation,
    addSkipLinks,
    setFontSize: (size: 'small' | 'medium' | 'large') => {
      setState(prev => ({ ...prev, fontSize: size }));
    },
    setHighContrast: (enabled: boolean) => {
      setState(prev => ({ ...prev, highContrast: enabled }));
    }
  };
};

export default useAccessibility;