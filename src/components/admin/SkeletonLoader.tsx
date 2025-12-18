import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SkeletonLoaderProps {
  type?: 'card' | 'table' | 'metric' | 'list';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ 
  type = 'card', 
  count = 1,
  className 
}: SkeletonLoaderProps) {
  const SkeletonCard = () => (
    <Card className="animate-pulse">
      <CardHeader>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2 mt-2"></div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
        <div className="h-3 bg-gray-200 rounded w-5/6 mt-2"></div>
      </CardContent>
    </Card>
  );

  const SkeletonMetric = () => (
    <Card className="animate-pulse border-l-4 border-l-gray-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-24"></div>
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </CardContent>
    </Card>
  );

  const SkeletonTable = () => (
    <div className="space-y-3">
      <div className="flex gap-4 pb-3 border-b">
        <div className="h-4 bg-gray-200 rounded flex-1"></div>
        <div className="h-4 bg-gray-200 rounded flex-1"></div>
        <div className="h-4 bg-gray-200 rounded flex-1"></div>
        <div className="h-4 bg-gray-200 rounded w-24"></div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3">
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded flex-1"></div>
          <div className="h-4 bg-gray-200 rounded w-24"></div>
        </div>
      ))}
    </div>
  );

  const SkeletonList = () => (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 border rounded-lg animate-pulse">
          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  if (type === 'metric') {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonMetric key={i} />
        ))}
      </div>
    );
  }

  if (type === 'table') {
    return <div className={className}><SkeletonTable /></div>;
  }

  if (type === 'list') {
    return <div className={className}><SkeletonList /></div>;
  }

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

