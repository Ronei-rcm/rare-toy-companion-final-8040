import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  fullHeight?: boolean;
}

const EmptyState = memo(function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  fullHeight = false
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        ${fullHeight ? 'min-h-[400px]' : 'py-16'}
        space-y-4
        text-center
        px-4
      `}
    >
      {Icon && (
        <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
          <Icon className="h-10 w-10 text-gray-400" />
        </div>
      )}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 max-w-md">{description}</p>
        )}
      </div>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all hover:scale-105 mt-4"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

export default EmptyState;
