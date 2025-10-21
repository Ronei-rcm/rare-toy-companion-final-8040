/**
 * Utilitários de Acessibilidade (A11y)
 * Helpers para ARIA labels, navegação por teclado e WCAG compliance
 */

/**
 * Gerar ID único para associar labels com inputs
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Props ARIA para botões com loading
 */
export function getAriaLoadingProps(isLoading: boolean, loadingText = 'Carregando...') {
  return {
    'aria-busy': isLoading,
    'aria-live': 'polite' as const,
    'aria-label': isLoading ? loadingText : undefined,
  };
}

/**
 * Props ARIA para modais/dialogs
 */
export function getAriaModalProps(isOpen: boolean, titleId: string, descriptionId?: string) {
  return {
    role: 'dialog' as const,
    'aria-modal': isOpen,
    'aria-labelledby': titleId,
    'aria-describedby': descriptionId,
  };
}

/**
 * Props ARIA para navegação
 */
export function getAriaNavigationProps(label: string, current?: boolean) {
  return {
    role: 'navigation' as const,
    'aria-label': label,
    'aria-current': current ? ('page' as const) : undefined,
  };
}

/**
 * Props ARIA para breadcrumbs
 */
export function getAriaBreadcrumbProps() {
  return {
    'aria-label': 'Navegação estrutural',
    role: 'navigation' as const,
  };
}

/**
 * Props ARIA para alerts/notificações
 */
export function getAriaAlertProps(type: 'error' | 'warning' | 'info' | 'success') {
  const roleMap = {
    error: 'alert' as const,
    warning: 'alert' as const,
    info: 'status' as const,
    success: 'status' as const,
  };

  return {
    role: roleMap[type],
    'aria-live': (type === 'error' || type === 'warning') ? 'assertive' as const : 'polite' as const,
    'aria-atomic': true,
  };
}

/**
 * Props ARIA para botões de incremento/decremento
 */
export function getAriaSpinButtonProps(value: number, min?: number, max?: number) {
  return {
    role: 'spinbutton' as const,
    'aria-valuenow': value,
    'aria-valuemin': min,
    'aria-valuemax': max,
    'aria-live': 'polite' as const,
  };
}

/**
 * Props ARIA para listas
 */
export function getAriaListProps(totalItems: number, label?: string) {
  return {
    role: 'list' as const,
    'aria-label': label,
    'aria-live': 'polite' as const,
    'aria-relevant': 'additions removals' as const,
  };
}

/**
 * Props ARIA para itens de lista
 */
export function getAriaListItemProps(index: number, total: number) {
  return {
    role: 'listitem' as const,
    'aria-setsize': total,
    'aria-posinset': index + 1,
  };
}

/**
 * Props ARIA para imagens decorativas
 */
export function getAriaDecorativeImageProps() {
  return {
    role: 'presentation' as const,
    alt: '',
    'aria-hidden': true,
  };
}

/**
 * Props ARIA para tabs
 */
export function getAriaTabProps(id: string, selected: boolean, controls: string) {
  return {
    role: 'tab' as const,
    id,
    'aria-selected': selected,
    'aria-controls': controls,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * Props ARIA para tab panels
 */
export function getAriaTabPanelProps(id: string, labelledBy: string, hidden: boolean) {
  return {
    role: 'tabpanel' as const,
    id,
    'aria-labelledby': labelledBy,
    hidden,
    tabIndex: 0,
  };
}

/**
 * Props ARIA para formulários
 */
export function getAriaFormProps(labelId: string, errors?: string[]) {
  return {
    'aria-labelledby': labelId,
    'aria-invalid': errors && errors.length > 0,
    'aria-errormessage': errors && errors.length > 0 ? `${labelId}-error` : undefined,
  };
}

/**
 * Props para mensagens de erro de formulário
 */
export function getAriaFormErrorProps(id: string) {
  return {
    id: `${id}-error`,
    role: 'alert' as const,
    'aria-live': 'assertive' as const,
  };
}

/**
 * Handler para navegação por teclado (Enter/Space em divs clicáveis)
 */
export function handleKeyboardClick(
  event: React.KeyboardEvent,
  onClick: () => void
) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick();
  }
}

/**
 * Props para fazer um div clicável acessível
 */
export function getClickableDivProps(
  onClick: () => void,
  label: string,
  role: 'button' | 'link' = 'button'
) {
  return {
    role,
    tabIndex: 0,
    'aria-label': label,
    onClick,
    onKeyDown: (e: React.KeyboardEvent) => handleKeyboardClick(e, onClick),
  };
}

/**
 * Anunciar mudança para leitores de tela
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite') {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only'; // Classe para esconder visualmente
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remover após 1 segundo
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Verificar contraste de cor (WCAG AA: 4.5:1 para texto normal, 3:1 para texto grande)
 */
export function checkColorContrast(foreground: string, background: string): {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
} {
  const luminance = (color: string): number => {
    // Converter hex para RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    // Calcular luminância relativa
    const [rs, gs, bs] = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = luminance(foreground);
  const l2 = luminance(background);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= 4.5, // WCAG AA para texto normal
    passAAA: ratio >= 7, // WCAG AAA para texto normal
  };
}

/**
 * Focus trap para modais
 */
export function createFocusTrap(containerElement: HTMLElement) {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

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
  };

  containerElement.addEventListener('keydown', handleTabKey);

  // Focar primeiro elemento
  firstElement?.focus();

  // Retornar função de cleanup
  return () => {
    containerElement.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Detectar se o usuário está usando navegação por teclado
 */
export function detectKeyboardNavigation() {
  let isUsingKeyboard = false;

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      isUsingKeyboard = true;
      document.body.classList.add('keyboard-navigation');
    }
  });

  document.addEventListener('mousedown', () => {
    isUsingKeyboard = false;
    document.body.classList.remove('keyboard-navigation');
  });

  return isUsingKeyboard;
}
