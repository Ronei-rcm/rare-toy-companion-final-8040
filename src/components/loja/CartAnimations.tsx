import React from 'react';
import { motion } from 'framer-motion';

/**
 * Animações reutilizáveis para o carrinho
 */

// Animação de entrada para items do carrinho
export const cartItemVariants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: custom * 0.05,
      duration: 0.3,
      ease: [0.4, 0, 0.2, 1],
    },
  }),
  exit: {
    opacity: 0,
    x: -100,
    scale: 0.9,
    transition: {
      duration: 0.2,
    },
  },
};

// Animação de pulsação para badges
export const pulseVariants = {
  initial: { scale: 1 },
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// Animação de balanço
export const shakeVariants = {
  initial: { x: 0 },
  animate: {
    x: [-2, 2, -2, 2, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut',
    },
  },
};

// Animação de fade slide
export const fadeSlideVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

// Animação de escala
export const scaleVariants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    scale: 0.8,
    opacity: 0,
    transition: {
      duration: 0.2,
    },
  },
};

// Componente wrapper para animações de items
interface AnimatedCartItemProps {
  children: React.ReactNode;
  index: number;
  className?: string;
}

export const AnimatedCartItem: React.FC<AnimatedCartItemProps> = ({ children, index, className }) => (
  <motion.div
    custom={index}
    variants={cartItemVariants}
    initial="hidden"
    animate="visible"
    exit="exit"
    layout
    className={className}
  >
    {children}
  </motion.div>
);

// Componente para número do carrinho com animação
interface AnimatedCartCountProps {
  count: number;
  className?: string;
}

export const AnimatedCartCount: React.FC<AnimatedCartCountProps> = ({ count, className }) => (
  <motion.span
    key={count}
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 1.5, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
    className={className}
  >
    {count}
  </motion.span>
);

// Componente para botão com feedback visual
interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'success' | 'danger';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  onClick,
  disabled,
  className,
  variant = 'default',
}) => {
  const [isPressed, setIsPressed] = React.useState(false);

  const variants = {
    default: { scale: 1 },
    pressed: { scale: 0.95 },
    hover: { scale: 1.05 },
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      variants={variants}
      initial="default"
      animate={isPressed ? 'pressed' : 'default'}
      whileHover={disabled ? undefined : 'hover'}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

// Indicador de loading animado
export const LoadingSpinner: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    style={{ width: size, height: size }}
  >
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-primary"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="31.4 31.4"
        strokeDashoffset="8"
      />
    </svg>
  </motion.div>
);

export default {
  cartItemVariants,
  pulseVariants,
  shakeVariants,
  fadeSlideVariants,
  scaleVariants,
  AnimatedCartItem,
  AnimatedCartCount,
  AnimatedButton,
  LoadingSpinner,
};

