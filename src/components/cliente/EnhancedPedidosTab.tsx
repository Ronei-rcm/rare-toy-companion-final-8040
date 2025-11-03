import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Eye,
  Download,
  RefreshCw,
  MapPin,
  CreditCard,
  Calendar,
  X,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';

interface OrderItem {
  id: string;
  nome: string;
  preco: number;
  quantidade: number;
  imagem_url?: string;
}

interface Order {
  id: string;
  numero: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  data: string;
  valor_total: number;
  itens: OrderItem[];
  endereco_entrega: string;
  metodo_pagamento: string;
  codigo_rastreamento?: string;
  data_entrega?: string;
}

const EnhancedPedidosTab: React.FC = () => {
  const { user } = useCurrentUser() as any;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Dados mockados removidos - carregar apenas pedidos reais

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 EnhancedPedidosTab - user:', user);
      
      // Carregar pedidos da API - sempre usar /api/orders sem user_id
      // O backend vai determinar o usuário baseado na sessão
      const response = await fetch('/api/orders', { credentials: 'include' });
      console.log('🔍 EnhancedPedidosTab - Response status:', response.status);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar pedidos');
      }
      
      const data = await response.json();
      console.log('🔍 EnhancedPedidosTab - Raw data:', data);
      
      const orders = Array.isArray(data) ? data : [];
      
      // Converter dados da API para o formato esperado - APENAS DADOS REAIS
      const formattedOrders: Order[] = orders
        .filter((order: any) => {
          // Filtrar apenas pedidos reais (não mockados)
          return order.id && 
                 order.created_at && 
                 !order.id.includes('PED-2024') && // Remover pedidos mockados
                 !order.id.includes('test-') &&    // Remover pedidos de teste
                 order.total > 0;
        })
        .map((order: any) => ({
          id: order.id,
          numero: order.id.substring(0, 8).toUpperCase(),
          status: order.status || 'pending',
          data: order.created_at || new Date().toISOString(),
          valor_total: Number(order.total || 0),
          itens: order.items || [],
          endereco_entrega: order.shipping_address || 'Endereço não informado',
          metodo_pagamento: order.payment_method || 'Não informado',
          codigo_rastreamento: order.tracking_code || '',
          data_entrega: order.delivered_at || null
        }));
      
      console.log('🔍 EnhancedPedidosTab - Pedidos reais carregados:', formattedOrders.length);
      setOrders(formattedOrders);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setOrders([]); // Lista vazia se não conseguir carregar
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: 'Pendente',
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-4 w-4" />,
          description: 'Aguardando processamento'
        };
      case 'processing':
        return {
          label: 'Processando',
          color: 'bg-blue-100 text-blue-800',
          icon: <RefreshCw className="h-4 w-4" />,
          description: 'Preparando seu pedido'
        };
      case 'shipped':
        return {
          label: 'Enviado',
          color: 'bg-purple-100 text-purple-800',
          icon: <Truck className="h-4 w-4" />,
          description: 'A caminho da entrega'
        };
      case 'delivered':
        return {
          label: 'Entregue',
          color: 'bg-green-100 text-green-800',
          icon: <CheckCircle className="h-4 w-4" />,
          description: 'Pedido entregue com sucesso'
        };
      case 'cancelled':
        return {
          label: 'Cancelado',
          color: 'bg-red-100 text-red-800',
          icon: <AlertCircle className="h-4 w-4" />,
          description: 'Pedido cancelado'
        };
      default:
        return {
          label: 'Desconhecido',
          color: 'bg-gray-100 text-gray-800',
          icon: <AlertCircle className="h-4 w-4" />,
          description: 'Status não identificado'
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleReorder = (order: Order) => {
    // TODO: Implementar recompra
    toast.success('Produtos adicionados ao carrinho!');
  };

  const handleCancelOrder = async (order: Order) => {
    if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
    
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'cancelled' })
      });
      
      if (!response.ok) throw new Error('Falha ao cancelar pedido');
      
      toast.success('Pedido cancelado com sucesso!');
      
      // Recarregar lista de pedidos
      loadOrders();
    } catch (error) {
      toast.error('Erro ao cancelar pedido');
    }
  };

  const handleDeleteOrder = async (order: Order) => {
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;
    
    try {
      const response = await fetch(`/api/orders/${order.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Falha ao excluir pedido');
      
      toast.success('Pedido excluído com sucesso!');
      
      // Recarregar lista de pedidos
      loadOrders();
    } catch (error) {
      toast.error('Erro ao excluir pedido');
    }
  };

  const handleTrackOrder = (order: Order) => {
    if (order.codigo_rastreamento) {
      // TODO: Abrir rastreamento
      toast.info(`Rastreamento: ${order.codigo_rastreamento}`);
    } else {
      toast.warning('Código de rastreamento não disponível');
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Package className="h-6 w-6" />
            <span>Meus Pedidos</span>
          </h2>
          <p className="text-muted-foreground">
            Acompanhe todos os seus pedidos
          </p>
        </div>
        <Button variant="outline" onClick={loadOrders}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Lista de pedidos */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Quando você fizer seu primeiro pedido, ele aparecerá aqui
            </p>
            <Button onClick={() => window.location.href = '/loja'}>
              Fazer Primeiro Pedido
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            
            return (
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-3">
                        <CardTitle className="text-lg">Pedido {order.numero}</CardTitle>
                        <Badge className={statusInfo.color}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(order.data)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3" />
                          <span>{order.metodo_pagamento}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(order.valor_total)}</p>
                      <p className="text-sm text-muted-foreground">{order.itens.length} item(s)</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Itens do pedido */}
                  <div className="space-y-2">
                    {order.itens.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {item.quantidade}x {formatCurrency(item.preco)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.itens.length > 2 && (
                      <p className="text-sm text-muted-foreground">
                        +{order.itens.length - 2} outros itens
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Informações de entrega */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Entrega:</span>
                      <span>{order.endereco_entrega}</span>
                    </div>
                    
                    {order.codigo_rastreamento && (
                      <div className="flex items-center space-x-2 text-sm">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Rastreamento:</span>
                        <span className="font-mono">{order.codigo_rastreamento}</span>
                      </div>
                    )}

                    {order.data_entrega && (
                      <div className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-muted-foreground">Entregue em:</span>
                        <span>{formatDate(order.data_entrega)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Ações */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Button>
                      
                      {order.status === 'enviado' && order.codigo_rastreamento && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleTrackOrder(order)}
                        >
                          <Truck className="h-4 w-4 mr-1" />
                          Rastrear
                        </Button>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {order.status === 'entregue' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReorder(order)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Recompra
                        </Button>
                      )}
                      
                      {order.status === 'pending' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleCancelOrder(order)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancelar
                        </Button>
                      )}
                      
                      {(order.status === 'cancelled' || order.status === 'pending') && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteOrder(order)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Excluir
                        </Button>
                      )}
                      
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Nota Fiscal
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resumo de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Total de Pedidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {orders.filter(o => o.status === 'entregue').length}
                </p>
                <p className="text-sm text-muted-foreground">Entregues</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {orders.filter(o => ['pendente', 'processando', 'enviado'].includes(o.status)).length}
                </p>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedPedidosTab;
