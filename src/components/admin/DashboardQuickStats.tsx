import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickStat {
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}

interface DashboardQuickStatsProps {
  stats: QuickStat[];
  compact?: boolean;
}

export default function DashboardQuickStats({ stats, compact = false }: DashboardQuickStatsProps) {
  return (
    <div className={cn(
      "grid gap-4",
      compact ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-4"
    )}>
      {stats.map((stat, index) => {
        const isPositive = stat.trend === 'up' || (stat.change && stat.change > 0);
        const isNegative = stat.trend === 'down' || (stat.change && stat.change < 0);
        
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className={cn("p-4", compact && "p-3")}>
              <div className="flex items-center justify-between mb-2">
                <span className={cn(
                  "text-xs font-medium text-gray-600",
                  compact && "text-[10px]"
                )}>
                  {stat.label}
                </span>
                {stat.icon}
              </div>
              <div className="flex items-baseline justify-between">
                <span className={cn(
                  "font-bold text-gray-900",
                  compact ? "text-lg" : "text-2xl"
                )}>
                  {stat.value}
                </span>
                {stat.change !== undefined && (
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs flex items-center gap-1",
                      isPositive && "text-green-600 border-green-200 bg-green-50",
                      isNegative && "text-red-600 border-red-200 bg-red-50"
                    )}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : isNegative ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {Math.abs(stat.change).toFixed(1)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

