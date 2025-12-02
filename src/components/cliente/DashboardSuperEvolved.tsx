import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Package, 
  Clock, 
  TrendingUp, 
  ShoppingCart,
  RefreshCw
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useCustomerStats } from '@/hooks/useCustomerStats';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'purple';
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  };

  const iconColorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-600',
    purple: 'text-purple-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className={`hover:shadow-lg transition-all ${onClick ? 'cursor-pointer hover:border-primary' : ''}`}
        onClick={onClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">{title}</p>
              <p className="text-3xl font-bold">{value}</p>
              {subtitle && (
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
            <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
              <div className={iconColorClasses[color]}>
                {icon}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const DashboardSuperEvolved: React.FC = () => {
  const { state: cartState } = useCart();
  const navigate = useNavigate();
  const { stats, loading, error, refetch } = useCustomerStats();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="text-muted-foreground">Visão geral da sua conta</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Mensagem de erro */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <span className="text-sm">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto"
              >
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards removidos - agora estão apenas no header da página */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground">
              Suas métricas principais estão exibidas no topo da página.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Use o menu lateral para acessar outras seções da sua conta.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardSuperEvolved;
