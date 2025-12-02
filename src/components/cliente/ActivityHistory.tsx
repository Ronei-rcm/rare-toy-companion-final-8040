import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ShoppingBag, 
  Heart, 
  Star, 
  MapPin, 
  CreditCard, 
  Gift, 
  MessageSquare,
  Package,
  Truck,
  CheckCircle,
  Clock,
  Calendar,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// Função simples para formatar tempo relativo
const formatTimeAgo = (date: string): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'há alguns segundos';
  if (diffInSeconds < 3600) return `há ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `há ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 2592000) return `há ${Math.floor(diffInSeconds / 86400)} dias`;
  if (diffInSeconds < 31536000) return `há ${Math.floor(diffInSeconds / 2592000)} meses`;
  return `há ${Math.floor(diffInSeconds / 31536000)} anos`;
};

interface Activity {
  id: string;
  type: 'order' | 'favorite' | 'review' | 'address' | 'payment' | 'coupon' | 'message';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    orderId?: string;
    productId?: string;
    amount?: number;
    status?: string;
  };
}

interface ActivityHistoryProps {
  userId: string;
}

const ActivityHistory: React.FC<ActivityHistoryProps> = ({ userId }) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadActivities();
  }, [userId]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      // Por enquanto, vamos simular atividades
      // Em produção, isso viria da API
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'order',
          title: 'Pedido realizado',
          description: 'Você realizou um pedido no valor de R$ 125,00',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metadata: {
            orderId: '9e0bd07f',
            amount: 125.00,
            status: 'pending'
          }
        },
        {
          id: '2',
          type: 'favorite',
          title: 'Produto favoritado',
          description: 'Você adicionou "Action Figure Premium" aos favoritos',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          metadata: {
            productId: 'prod-123'
          }
        },
        {
          id: '3',
          type: 'review',
          title: 'Avaliação enviada',
          description: 'Você avaliou "Boneco Colecionável" com 5 estrelas',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            productId: 'prod-456'
          }
        },
        {
          id: '4',
          type: 'address',
          title: 'Endereço adicionado',
          description: 'Novo endereço de entrega cadastrado',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          type: 'coupon',
          title: 'Cupom utilizado',
          description: 'Você utilizou o cupom DESCONTO10',
          timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: {
            amount: 10.00
          }
        }
      ];
      
      setActivities(mockActivities);
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    const iconMap: Record<string, React.ElementType> = {
      order: ShoppingBag,
      favorite: Heart,
      review: Star,
      address: MapPin,
      payment: CreditCard,
      coupon: Gift,
      message: MessageSquare
    };
    return iconMap[type] || Package;
  };

  const getActivityColor = (type: string) => {
    const colorMap: Record<string, string> = {
      order: 'bg-blue-100 text-blue-600',
      favorite: 'bg-pink-100 text-pink-600',
      review: 'bg-yellow-100 text-yellow-600',
      address: 'bg-green-100 text-green-600',
      payment: 'bg-purple-100 text-purple-600',
      coupon: 'bg-orange-100 text-orange-600',
      message: 'bg-indigo-100 text-indigo-600'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-600';
  };

  const getFilteredActivities = () => {
    if (filter === 'all') return activities;
    return activities.filter(activity => activity.type === filter);
  };

  const filteredActivities = getFilteredActivities();

  const activityTypes = [
    { value: 'all', label: 'Todas', count: activities.length },
    { value: 'order', label: 'Pedidos', count: activities.filter(a => a.type === 'order').length },
    { value: 'favorite', label: 'Favoritos', count: activities.filter(a => a.type === 'favorite').length },
    { value: 'review', label: 'Avaliações', count: activities.filter(a => a.type === 'review').length },
    { value: 'address', label: 'Endereços', count: activities.filter(a => a.type === 'address').length },
    { value: 'coupon', label: 'Cupons', count: activities.filter(a => a.type === 'coupon').length }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Histórico de Atividades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="mb-6">
            <Tabs value={filter} onValueChange={setFilter}>
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {activityTypes.map((type) => (
                  <TabsTrigger 
                    key={type.value} 
                    value={type.value}
                    className="flex flex-col gap-1"
                  >
                    <span className="text-xs">{type.label}</span>
                    <Badge variant="secondary" className="text-xs">
                      {type.count}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          {/* Lista de Atividades */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma atividade encontrada
                  </h3>
                  <p className="text-gray-500">
                    {filter === 'all' 
                      ? 'Você ainda não tem atividades registradas'
                      : `Nenhuma atividade do tipo "${activityTypes.find(t => t.value === filter)?.label}" encontrada`
                    }
                  </p>
                </div>
              ) : (
                filteredActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      {/* Ícone */}
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full",
                        getActivityColor(activity.type)
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 mb-1">
                              {activity.title}
                            </h4>
                            <p className="text-sm text-gray-600 mb-2">
                              {activity.description}
                            </p>
                            
                            {/* Metadata */}
                            {activity.metadata && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {activity.metadata.orderId && (
                                  <Badge variant="outline" className="text-xs">
                                    Pedido #{activity.metadata.orderId.substring(0, 8)}
                                  </Badge>
                                )}
                                {activity.metadata.amount && (
                                  <Badge variant="outline" className="text-xs">
                                    R$ {Number(activity.metadata.amount).toFixed(2)}
                                  </Badge>
                                )}
                                {activity.metadata.status && (
                                  <Badge 
                                    variant={activity.metadata.status === 'pending' ? 'default' : 'secondary'}
                                    className="text-xs"
                                  >
                                    {activity.metadata.status === 'pending' ? (
                                      <>
                                        <Clock className="h-3 w-3 mr-1" />
                                        Pendente
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        {activity.metadata.status}
                                      </>
                                    )}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-xs text-gray-500 whitespace-nowrap">
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityHistory;

