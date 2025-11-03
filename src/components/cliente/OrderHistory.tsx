import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Package,
  Eye,
  Download,
  RefreshCw,
  MapPin,
  Calendar,
  CreditCard,
} from 'lucide-react';
import OrderTracking from './OrderTracking';
import { motion } from 'framer-motion';

interface OrderHistoryProps {
  userId: string;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ userId }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadOrders();
  }, [userId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/orders?user_id=${userId}`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (orderId: string) => {
    // Adicionar todos os produtos do pedido ao carrinho
    try {
      const response = await fetch(`${API_BASE_URL}/orders/${orderId}/reorder`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        toast({
          title: 'Pedido readicionado! 🛒',
          description: 'Os produtos foram adicionados ao seu carrinho',
        });
      }
    } catch (error) {
      console.error('Erro ao reordenar:', error);
    }
  };

  const handleDownloadInvoice = (orderId: string) => {
    window.open(`${API_BASE_URL}/orders/${orderId}/invoice`, '_blank');
  };

  const getStatusColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      shipped: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      delivered: 'bg-green-100 text-green-800 border-green-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300',
    };

    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum pedido ainda</h3>
          <p className="text-muted-foreground mb-4">
            Faça seu primeiro pedido e comece a acumular pontos!
          </p>
          <Button asChild>
            <a href="/loja">Explorar Produtos</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Accordion type="single" collapsible className="space-y-4">
        {orders.map((order, index) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <AccordionItem value={order.id} className="border rounded-lg">
              <Card>
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold">Pedido #{order.id.substring(0, 8)}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold text-lg">R$ {Number(order.total).toFixed(2)}</p>
                        <Badge className={getStatusColor(order.status)}>
                          {order.status === 'delivered' && 'Entregue'}
                          {order.status === 'shipped' && 'Em transporte'}
                          {order.status === 'processing' && 'Preparando'}
                          {order.status === 'confirmed' && 'Confirmado'}
                          {order.status === 'pending' && 'Pendente'}
                          {order.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <CardContent className="pt-0 space-y-4">
                    {/* Rastreamento */}
                    <OrderTracking
                      status={order.status}
                      createdAt={order.created_at}
                      estimatedDelivery={order.estimated_delivery}
                    />

                    {/* Informações de Entrega */}
                    {order.shipping_address && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium text-sm">Endereço de Entrega</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.shipping_address}
                            {order.shipping_city && `, ${order.shipping_city}`}
                            {order.shipping_state && ` - ${order.shipping_state}`}
                            {order.shipping_cep && <br />}
                            {order.shipping_cep && `CEP: ${order.shipping_cep}`}
                          </p>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <CreditCard className="w-4 h-4 text-muted-foreground" />
                            <p className="font-medium text-sm">Pagamento</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {order.payment_method === 'pix' && '💳 PIX'}
                            {order.payment_method === 'credit_card' && '💳 Cartão de Crédito'}
                            {order.payment_method === 'apple_pay' && '🍎 Apple Pay'}
                            {order.payment_method === 'google_pay' && '🎨 Google Pay'}
                          </p>
                          {order.payment_status === 'paid' && (
                            <Badge variant="outline" className="mt-2 bg-green-100 text-green-800">
                              ✅ Pago
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Produtos do pedido */}
                    {order.items && order.items.length > 0 && (
                      <div>
                        <p className="font-medium text-sm mb-3">Produtos ({order.items.length})</p>
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                            >
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  Quantidade: {item.quantity}
                                </p>
                              </div>
                              <p className="font-semibold text-sm">
                                R$ {(item.price * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ações */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => window.location.href = `/minha-conta/pedido/${order.id}`}>
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalhes
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => handleReorder(order.id)}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Repetir Pedido
                      </Button>

                      <Button variant="outline" size="sm" onClick={() => handleDownloadInvoice(order.id)}>
                        <Download className="w-4 h-4 mr-2" />
                        Nota Fiscal
                      </Button>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          </motion.div>
        ))}
      </Accordion>
    </div>
  );
};

export default OrderHistory;
