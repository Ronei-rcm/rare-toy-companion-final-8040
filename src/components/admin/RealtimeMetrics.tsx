import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Eye,
  Activity,
  Wifi,
  WifiOff
} from 'lucide-react';

interface RealtimeData {
  onlineUsers: number;
  currentHourOrders: number;
  currentHourRevenue: number;
  lastUpdated: string;
}

const RealtimeMetrics: React.FC = () => {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealtimeData();
    const interval = setInterval(loadRealtimeData, 30000); // Atualizar a cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const loadRealtimeData = async () => {
    try {
      const response = await fetch('/api/analytics/realtime', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data.realtime);
        setIsOnline(true);
      }
    } catch (error) {
      console.error('Erro ao carregar métricas em tempo real:', error);
      setIsOnline(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status de Conexão */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Métricas em Tempo Real</h3>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Wifi className="w-3 h-3 mr-1" />
              Online
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="w-3 h-3 mr-1" />
              Offline
            </Badge>
          )}
          {data && (
            <span className="text-xs text-gray-500">
              Atualizado: {formatTime(data.lastUpdated)}
            </span>
          )}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Usuários Online</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.onlineUsers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <ShoppingCart className="h-6 w-6 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Pedidos (Hora)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {data?.currentHourOrders || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <DollarSign className="h-6 w-6 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Receita (Hora)</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(data?.currentHourRevenue || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicador de Atividade */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Atividade Recente</span>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Última atualização: {data ? formatTime(data.lastUpdated) : 'N/A'}</span>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Ativo</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RealtimeMetrics;
