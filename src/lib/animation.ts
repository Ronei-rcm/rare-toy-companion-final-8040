
import React from 'react';

// Staggered animation for children
export const staggeredFadeIn = (staggerAmount = 0.1) => {
  return (index: number) => ({
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * staggerAmount,
        duration: 0.5,
      },
    },
  });
};

// Hover animation properties for cards and elements
export const hoverAnimation = {
  scale: 1.02,
  y: -5,
  transition: { duration: 0.3 },
};

// Animation hook for tracking element in view
export const useScrollAnimation = () => {
  const [isInView, setIsInView] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, []);

  return { ref, isInView };
};

// Helper function to add animation classes based on view status
export const getAnimationClass = (isInView: boolean, animationType: 'fade' | 'slide-up' | 'slide-down' = 'fade') => {
  if (!isInView) {
    return 'opacity-0';
  }
  
  switch (animationType) {
    case 'slide-up':
      return 'animate-slide-up';
    case 'slide-down':
      return 'animate-slide-down';
    case 'fade':
    default:
      return 'animate-fade-in';
  }
};
