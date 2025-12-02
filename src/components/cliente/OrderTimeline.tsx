import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, Package, Truck, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineStep {
  status: string;
  label: string;
  description: string;
  date?: string;
  completed: boolean;
  current: boolean;
}

interface OrderTimelineProps {
  currentStatus: string;
  timeline?: Array<{
    status: string;
    created_at: string;
    notes?: string;
  }>;
  createdAt: string;
}

const OrderTimeline: React.FC<OrderTimelineProps> = ({ 
  currentStatus, 
  timeline = [],
  createdAt 
}) => {
  const statusOrder = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
  const currentIndex = statusOrder.indexOf(currentStatus);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { icon: React.ElementType; color: string; label: string }> = {
      pending: { icon: Clock, color: 'text-yellow-600 bg-yellow-50 border-yellow-200', label: 'Pendente' },
      processing: { icon: Package, color: 'text-blue-600 bg-blue-50 border-blue-200', label: 'Processando' },
      shipped: { icon: Truck, color: 'text-purple-600 bg-purple-50 border-purple-200', label: 'Enviado' },
      delivered: { icon: CheckCircle, color: 'text-green-600 bg-green-50 border-green-200', label: 'Entregue' },
      cancelled: { icon: XCircle, color: 'text-red-600 bg-red-50 border-red-200', label: 'Cancelado' }
    };
    return statusMap[status] || statusMap.pending;
  };

  const steps: TimelineStep[] = statusOrder.map((status, index) => {
    const statusInfo = getStatusInfo(status);
    const timelineEntry = timeline.find(t => t.status === status);
    const isCompleted = index < currentIndex || (index === currentIndex && currentStatus === 'delivered');
    const isCurrent = index === currentIndex && currentStatus !== 'delivered' && currentStatus !== 'cancelled';
    const isCancelled = currentStatus === 'cancelled' && status === 'cancelled';

    return {
      status,
      label: statusInfo.label,
      description: timelineEntry?.notes || getStatusDescription(status),
      date: timelineEntry?.created_at,
      completed: isCompleted || isCancelled,
      current: isCurrent
    };
  });

  const getStatusDescription = (status: string): string => {
    const descriptions: Record<string, string> = {
      pending: 'Aguardando confirmação do pagamento',
      processing: 'Preparando seu pedido para envio',
      shipped: 'Pedido em trânsito para entrega',
      delivered: 'Pedido entregue com sucesso',
      cancelled: 'Pedido foi cancelado'
    };
    return descriptions[status] || '';
  };

  return (
    <div className="relative">
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />
      
      <div className="space-y-6">
        {steps.map((step, index) => {
          const statusInfo = getStatusInfo(step.status);
          const Icon = statusInfo.icon;
          const isLast = index === steps.length - 1;
          
          return (
            <motion.div
              key={step.status}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Ícone do status */}
              <div className={cn(
                "relative z-10 flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all",
                step.completed 
                  ? statusInfo.color
                  : step.current
                  ? `${statusInfo.color} ring-4 ring-offset-2 ring-opacity-50`
                  : "bg-gray-100 border-gray-300 text-gray-400"
              )}>
                <Icon className={cn(
                  "h-5 w-5",
                  step.completed || step.current ? "" : "opacity-50"
                )} />
              </div>

              {/* Conteúdo */}
              <div className="flex-1 pb-6">
                <div className={cn(
                  "flex items-center gap-2 mb-1",
                  step.completed || step.current ? "text-gray-900" : "text-gray-400"
                )}>
                  <h4 className="font-semibold">{step.label}</h4>
                  {step.current && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                      Atual
                    </span>
                  )}
                </div>
                
                <p className={cn(
                  "text-sm mb-1",
                  step.completed || step.current ? "text-gray-600" : "text-gray-400"
                )}>
                  {step.description}
                </p>
                
                {step.date && (
                  <p className="text-xs text-gray-500">
                    {new Date(step.date).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default OrderTimeline;

