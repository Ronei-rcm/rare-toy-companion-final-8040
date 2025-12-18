import React, { memo } from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullHeight?: boolean;
}

const LoadingState = memo(function LoadingState({
  message = 'Carregando...',
  size = 'md',
  fullHeight = false
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${fullHeight ? 'min-h-[400px]' : 'py-12'}
        space-y-4
      `}
    >
      <RefreshCw
        className={`${sizeClasses[size]} animate-spin text-blue-600`}
      />
      <p className="text-gray-600 font-medium">{message}</p>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

export default LoadingState;

