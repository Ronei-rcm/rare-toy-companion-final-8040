import React from 'react';
import { Loader2, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CartLoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  className?: string;
}

const CartLoadingOverlay: React.FC<CartLoadingOverlayProps> = ({ 
  isLoading, 
  message = "Processando...", 
  className 
}) => {
  if (!isLoading) return null;

  return (
    <div className={cn(
      "absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
      "transition-opacity duration-200 ease-in-out",
      className
    )}>
      <div className="flex flex-col items-center gap-3 p-4 bg-card rounded-lg shadow-lg border">
        <div className="relative">
          <ShoppingBag className="h-8 w-8 text-primary animate-pulse" />
          <Loader2 className="h-4 w-4 text-primary animate-spin absolute -top-1 -right-1" />
        </div>
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
    </div>
  );
};

export default CartLoadingOverlay;
