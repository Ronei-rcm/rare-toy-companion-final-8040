
import React from 'react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  message: string;
  className?: string;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  message, 
  className,
  icon
}) => {
  return (
    <div className={cn("text-center py-12", className)}>
      {icon && (
        <div className="flex justify-center mb-4">
          {icon}
        </div>
      )}
      <p className="text-lg text-muted-foreground">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
