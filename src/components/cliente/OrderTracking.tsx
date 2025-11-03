import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Package, Truck, Home, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderTrackingProps {
  status: string;
  createdAt: string;
  estimatedDelivery?: string;
}

const OrderTracking: React.FC<OrderTrackingProps> = ({
  status,
  createdAt,
  estimatedDelivery,
}) => {
  const steps = [
    {
      id: 'confirmed',
      label: 'Pedido Confirmado',
      icon: Check,
      completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(status),
    },
    {
      id: 'processing',
      label: 'Em Preparação',
      icon: Package,
      completed: ['processing', 'shipped', 'delivered'].includes(status),
    },
    {
      id: 'shipped',
      label: 'Em Transporte',
      icon: Truck,
      completed: ['shipped', 'delivered'].includes(status),
    },
    {
      id: 'delivered',
      label: 'Entregue',
      icon: Home,
      completed: status === 'delivered',
    },
  ];

  const getCurrentStep = () => {
    return steps.findIndex(step => step.id === status);
  };

  const currentStepIndex = getCurrentStep();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold">Rastreamento do Pedido</h3>
          <Badge variant={status === 'delivered' ? 'default' : 'secondary'}>
            {status === 'confirmed' && 'Confirmado'}
            {status === 'processing' && 'Preparando'}
            {status === 'shipped' && 'Em transporte'}
            {status === 'delivered' && 'Entregue'}
            {status === 'cancelled' && 'Cancelado'}
          </Badge>
        </div>

        {/* Timeline */}
        <div className="relative">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isCompleted = step.completed;
            const isActive = index === currentStepIndex;

            return (
              <div key={step.id} className="relative pb-8 last:pb-0">
                {/* Linha conectora */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 w-0.5 h-full transition-colors duration-500 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}

                {/* Ponto */}
                <div className="relative flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500 border-green-500'
                        : isActive
                        ? 'bg-white border-blue-500 ring-4 ring-blue-100'
                        : 'bg-white border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        isCompleted
                          ? 'text-white'
                          : isActive
                          ? 'text-blue-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </motion.div>

                  {/* Info */}
                  <div className="flex-1 pt-1">
                    <p
                      className={`font-medium ${
                        isCompleted || isActive ? 'text-foreground' : 'text-muted-foreground'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-muted-foreground mt-1"
                      >
                        Em andamento...
                      </motion.p>
                    )}
                    {isCompleted && step.id === 'confirmed' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(createdAt).toLocaleString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Estimativa de entrega */}
        {estimatedDelivery && status !== 'delivered' && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Previsão de Entrega</p>
                <p className="text-xs text-blue-700">
                  {new Date(estimatedDelivery).toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTracking;
