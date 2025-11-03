
import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  highlight?: boolean;
}

const GlassCard = ({ 
  children, 
  className, 
  highlight = false,
  ...props 
}: GlassCardProps) => {
  return (
    <div 
      className={cn(
        'glass-card p-6 transition-all duration-300',
        highlight && 'border-primary/20 shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
