import React from 'react';
import { Loader2, ShoppingBag, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 
      className={cn(
        'animate-spin text-primary',
        sizeClasses[size],
        className
      )} 
    />
  );
};

interface LoadingCardProps {
  className?: string;
  message?: string;
}

export const LoadingCard: React.FC<LoadingCardProps> = ({ 
  className, 
  message = 'Carregando...' 
}) => {
  return (
    <div className={cn(
      'flex items-center justify-center p-8 bg-muted/30 rounded-lg',
      className
    )}>
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size="lg" />
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </div>
  );
};

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  className, 
  lines = 3 
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className={cn(
            'h-4 bg-muted rounded animate-pulse',
            index === lines - 1 && 'w-3/4' // Última linha menor
          )}
        />
      ))}
    </div>
  );
};

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Carregando...',
  children,
  className
}) => {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 p-6 bg-card rounded-lg shadow-lg border">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-medium">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className
}) => {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 p-3 bg-muted/50 rounded-full">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

// Estados específicos para o carrinho
export const CartEmptyState: React.FC<{ className?: string }> = ({ className }) => (
  <EmptyState
    icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
    title="Seu carrinho está vazio"
    description="Adicione alguns produtos incríveis para começar sua compra!"
    className={className}
  />
);

export const ProductLoadingState: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingCard
    message="Carregando produtos..."
    className={className}
  />
);

export const OrderLoadingState: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingCard
    message="Processando pedido..."
    className={className}
  />
);

export const ShippingLoadingState: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingCard
    message="Calculando frete..."
    className={className}
  />
);
