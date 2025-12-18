import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  icon?: React.ReactNode;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'yellow' | 'orange';
  format?: 'currency' | 'number' | 'percentage';
  borderLeft?: boolean;
  className?: string;
}

const colorClasses = {
  green: {
    border: 'border-l-green-500',
    iconBg: 'bg-green-100 text-green-600',
    value: 'text-green-600',
    trendUp: 'bg-green-50 text-green-700 border-green-200',
    trendDown: 'bg-red-50 text-red-700 border-red-200'
  },
  red: {
    border: 'border-l-red-500',
    iconBg: 'bg-red-100 text-red-600',
    value: 'text-red-600',
    trendUp: 'bg-green-50 text-green-700 border-green-200',
    trendDown: 'bg-red-50 text-red-700 border-red-200'
  },
  blue: {
    border: 'border-l-blue-500',
    iconBg: 'bg-blue-100 text-blue-600',
    value: 'text-blue-600',
    trendUp: 'bg-green-50 text-green-700 border-green-200',
    trendDown: 'bg-red-50 text-red-700 border-red-200'
  },
  purple: {
    border: 'border-l-purple-500',
    iconBg: 'bg-purple-100 text-purple-600',
    value: 'text-purple-600',
    trendUp: 'bg-green-50 text-green-700 border-green-200',
    trendDown: 'bg-red-50 text-red-700 border-red-200'
  },
  yellow: {
    border: 'border-l-yellow-500',
    iconBg: 'bg-yellow-100 text-yellow-600',
    value: 'text-yellow-600',
    trendUp: 'bg-green-50 text-green-700 border-green-200',
    trendDown: 'bg-red-50 text-red-700 border-red-200'
  },
  orange: {
    border: 'border-l-orange-500',
    iconBg: 'bg-orange-100 text-orange-600',
    value: 'text-orange-600',
    trendUp: 'bg-green-50 text-green-700 border-green-200',
    trendDown: 'bg-red-50 text-red-700 border-red-200'
  }
};

const MetricCard = memo(function MetricCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  format = 'currency',
  borderLeft = true,
  className = ''
}: MetricCardProps) {
  const colors = colorClasses[color];

  const formatValue = () => {
    if (format === 'currency') {
      return formatCurrency(typeof value === 'number' ? value : parseFloat(value));
    } else if (format === 'percentage') {
      return `${typeof value === 'number' ? value : parseFloat(value)}%`;
    } else {
      return typeof value === 'number' ? value.toLocaleString('pt-BR') : value;
    }
  };

  const getTrendIcon = () => {
    if (!trend || trend.value === 0) return null;
    return trend.value > 0 ? (
      <TrendingUp className="h-3 w-3" />
    ) : (
      <TrendingDown className="h-3 w-3" />
    );
  };

  const getTrendBadge = () => {
    if (!trend || trend.value === 0) return null;

    const isPositive = trend.value > 0;
    const trendColor = isPositive ? colors.trendUp : colors.trendDown;

    return (
      <Badge
        variant="outline"
        className={`${trendColor} text-xs font-medium flex items-center gap-1 px-2 py-0.5`}
      >
        {getTrendIcon()}
        {Math.abs(trend.value).toFixed(1)}%
        {trend.label && ` ${trend.label}`}
      </Badge>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -2 }}
    >
      <Card
        className={`
          min-h-[140px] 
          hover:shadow-lg 
          transition-all 
          duration-200
          ${borderLeft ? `border-l-4 ${colors.border}` : ''}
          ${className}
        `}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-gray-600">
              {title}
            </CardTitle>
            {icon && (
              <div className={`p-2 rounded-full ${colors.iconBg}`}>
                {icon}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className={`text-3xl font-bold ${colors.value}`}>
            {formatValue()}
          </div>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              {getTrendBadge()}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
});

export default MetricCard;

