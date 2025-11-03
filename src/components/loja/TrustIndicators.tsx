import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Star, 
  Award, 
  Truck, 
  Clock, 
  Shield,
  Heart,
  ThumbsUp,
  MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustIndicator {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  color: string;
}

interface TrustIndicatorsProps {
  className?: string;
  variant?: 'horizontal' | 'vertical' | 'compact';
}

const TrustIndicators: React.FC<TrustIndicatorsProps> = ({ 
  className, 
  variant = 'horizontal' 
}) => {
  const indicators: TrustIndicator[] = [
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Clientes Ativos',
      value: '10.000+',
      description: 'Clientes satisfeitos',
      color: 'text-blue-600'
    },
    {
      icon: <Star className="h-4 w-4" />,
      label: 'Avaliação',
      value: '4.9/5',
      description: 'Baseado em 2.500+ avaliações',
      color: 'text-yellow-600'
    },
    {
      icon: <Truck className="h-4 w-4" />,
      label: 'Entregas',
      value: '50.000+',
      description: 'Pedidos entregues',
      color: 'text-green-600'
    },
    {
      icon: <Award className="h-4 w-4" />,
      label: 'Desde',
      value: '2020',
      description: 'Anos de experiência',
      color: 'text-purple-600'
    }
  ];

  const renderHorizontal = () => (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {indicators.map((indicator, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={cn("p-2 rounded-full bg-muted/50", indicator.color)}>
            {indicator.icon}
          </div>
          <div>
            <div className="text-sm font-medium">{indicator.value}</div>
            <div className="text-xs text-muted-foreground">{indicator.label}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderVertical = () => (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">Por que nos escolher?</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            {indicators.map((indicator, index) => (
              <div key={index} className="text-center p-3 bg-muted/30 rounded-lg">
                <div className={cn("mx-auto mb-2", indicator.color)}>
                  {indicator.icon}
                </div>
                <div className="text-lg font-bold">{indicator.value}</div>
                <div className="text-xs text-muted-foreground">{indicator.label}</div>
                {indicator.description && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {indicator.description}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderCompact = () => (
    <div className={cn("flex items-center gap-4 text-sm", className)}>
      {indicators.slice(0, 2).map((indicator, index) => (
        <div key={index} className="flex items-center gap-1">
          <div className={cn("p-1 rounded-full bg-muted/50", indicator.color)}>
            {indicator.icon}
          </div>
          <span className="font-medium">{indicator.value}</span>
          <span className="text-muted-foreground">{indicator.label}</span>
        </div>
      ))}
    </div>
  );

  switch (variant) {
    case 'horizontal':
      return renderHorizontal();
    case 'vertical':
      return renderVertical();
    case 'compact':
      return renderCompact();
    default:
      return renderHorizontal();
  }
};

// Componente adicional para mostrar depoimentos rápidos
export const QuickTestimonials: React.FC<{ className?: string }> = ({ className }) => {
  const testimonials = [
    {
      name: 'Maria S.',
      rating: 5,
      text: 'Entrega super rápida!',
      icon: <ThumbsUp className="h-3 w-3" />
    },
    {
      name: 'João P.',
      rating: 5,
      text: 'Produto excelente!',
      icon: <Heart className="h-3 w-3" />
    },
    {
      name: 'Ana L.',
      rating: 5,
      text: 'Atendimento perfeito!',
      icon: <MessageCircle className="h-3 w-3" />
    }
  ];

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {testimonials.map((testimonial, index) => (
        <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
          {testimonial.icon}
          <span>{testimonial.text}</span>
          <span className="text-muted-foreground">- {testimonial.name}</span>
        </Badge>
      ))}
    </div>
  );
};

// Componente para mostrar tempo de processamento em tempo real
export const ProcessingTime: React.FC<{ className?: string }> = ({ className }) => {
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <Clock className="h-3 w-3" />
      <span>Última atualização: {formatTime(currentTime)}</span>
    </div>
  );
};

export default TrustIndicators;
