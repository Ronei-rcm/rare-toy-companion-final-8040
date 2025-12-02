import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  GripVertical,
  X,
  Settings,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Widget {
  id: string;
  title: string;
  component: React.ReactNode;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
}

interface DashboardWidgetsProps {
  widgets: Widget[];
  onWidgetRemove?: (id: string) => void;
  onWidgetMove?: (id: string, position: { x: number; y: number }) => void;
}

export default function DashboardWidgets({ 
  widgets, 
  onWidgetRemove,
  onWidgetMove 
}: DashboardWidgetsProps) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {widgets.map((widget) => (
        <motion.div
          key={widget.id}
          drag
          dragMomentum={false}
          onDragEnd={(e, info) => {
            if (onWidgetMove) {
              onWidgetMove(widget.id, {
                x: info.point.x,
                y: info.point.y
              });
            }
            setDraggedWidget(null);
          }}
          onDragStart={() => setDraggedWidget(widget.id)}
          className={cn(
            "cursor-move",
            draggedWidget === widget.id && "opacity-50"
          )}
        >
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <GripVertical className="h-4 w-4 text-gray-400" />
                <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => onWidgetRemove?.(widget.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {widget.component}
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}

// Widgets pré-definidos
export const WidgetTemplates = {
  revenue: {
    id: 'revenue',
    title: 'Receita',
    component: <div>Receita widget</div>,
    size: 'medium' as const
  },
  orders: {
    id: 'orders',
    title: 'Pedidos',
    component: <div>Pedidos widget</div>,
    size: 'medium' as const
  },
  customers: {
    id: 'customers',
    title: 'Clientes',
    component: <div>Clientes widget</div>,
    size: 'small' as const
  },
  products: {
    id: 'products',
    title: 'Produtos',
    component: <div>Produtos widget</div>,
    size: 'small' as const
  }
};

