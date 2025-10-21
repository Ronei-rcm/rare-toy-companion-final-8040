
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag, Package, Truck, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button as UIButton } from '@/components/ui/button';

const PedidosTab = () => {
  const navigate = useNavigate();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';
  const [isLoading, setIsLoading] = useState(true);
  const [pedidos, setPedidos] = useState<any[]>([]);
  const { user } = useCurrentUser();
  const [statusFiltro, setStatusFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState<string>('');
  const [ordenar, setOrdenar] = useState<string>('recente');
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`${API_BASE_URL}/orders`, { credentials: 'include' });
        if (!res.ok) throw new Error('Falha ao carregar pedidos');
        const data = await res.json();
        const norm = (Array.isArray(data) ? data : []).map((o: any) => ({
          id: o.id,
          data: new Date(o.created_at || Date.now()).toLocaleDateString('pt-BR'),
          status: o.status || 'criado',
          valor: Number(o.total || 0),
          itens: Number(o.items_count || 0),
        }));
        setPedidos(norm);
      } catch (e) {
        setPedidos([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entregue':
      case 'Entregue':
        return <CheckCircle className="h-4 w-4" />;
      case 'em_transito':
      case 'Em trânsito':
        return <Truck className="h-4 w-4" />;
      case 'processando':
      case 'Processando':
      case 'criado':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'entregue':
      case 'Entregue':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'em_transito':
      case 'Em trânsito':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processando':
      case 'Processando':
      case 'criado':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resendReceipt = async (orderId: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/resend`, { method: 'POST', credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao reenviar comprovante');
      const data = await res.json();
      toast({ title: 'Comprovante reenviado', description: data.emailed ? 'E-mail enviado com sucesso.' : 'Prévia disponível, envio por e-mail não configurado.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro', description: e.message || 'Não foi possível reenviar.' });
    }
  };

  return (
    <div className="space-y-6">
      {!user && (
        <div className="p-3 rounded-md border bg-amber-50 text-amber-900 text-sm">
          Faça login para ver seus pedidos.
        </div>
      )}
      <div>
        <h2 className="text-2xl font-bold">Meus Pedidos</h2>
        <p className="text-muted-foreground">Acompanhe o status dos seus pedidos</p>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Carregando pedidos...
          </CardContent>
        </Card>
      ) : pedidos.length > 0 ? (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3 md:items-center">
            <div className="flex-1 flex gap-2">
              <Input placeholder="Buscar por código" value={busca} onChange={(e) => setBusca(e.target.value)} />
              <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="processando">Processando</SelectItem>
                  <SelectItem value="em_transito">Em trânsito</SelectItem>
                  <SelectItem value="entregue">Entregue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Select value={ordenar} onValueChange={setOrdenar}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Ordenar" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recente">Mais recentes</SelectItem>
                <SelectItem value="antigo">Mais antigos</SelectItem>
                <SelectItem value="maior">Maior valor</SelectItem>
                <SelectItem value="menor">Menor valor</SelectItem>
              </SelectContent>
            </Select>
            <UIButton variant="outline" onClick={() => {
              const rows = pedidos
                .filter(p => !busca || String(p.id).toLowerCase().includes(busca.toLowerCase()))
                .filter(p => statusFiltro === 'todos' || String(p.status).toLowerCase() === statusFiltro);
              const csv = ['id,status,valor,itens,data'].concat(rows.map(r => `${r.id},${r.status},${r.valor},${r.itens},${r.data}`)).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'pedidos.csv'; a.click(); URL.revokeObjectURL(url);
            }}>Exportar CSV</UIButton>
          </div>

          {pedidos
            .filter(p => !busca || String(p.id).toLowerCase().includes(busca.toLowerCase()))
            .filter(p => statusFiltro === 'todos' || String(p.status).toLowerCase() === statusFiltro)
            .sort((a, b) => {
              switch (ordenar) {
                case 'antigo': return (new Date(a.data) as any) - (new Date(b.data) as any);
                case 'maior': return b.valor - a.valor;
                case 'menor': return a.valor - b.valor;
                default: return (new Date(b.data) as any) - (new Date(a.data) as any);
              }
            })
            .map(pedido => (
            <Card key={pedido.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Pedido {pedido.id}</CardTitle>
                    <CardDescription>
                      Realizado em {pedido.data}
                    </CardDescription>
                  </div>
                  <Badge className={`flex items-center gap-1 ${getStatusColor(pedido.status)}`}>
                    {getStatusIcon(pedido.status)}
                    {pedido.status.charAt(0).toUpperCase() + pedido.status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        Valor total • {pedido.itens} {pedido.itens === 1 ? 'item' : 'itens'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-lg">{pedido.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 flex-wrap">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate(`/minha-conta/pedido/${pedido.id}`)}>
                      Ver detalhes
                    </Button>
                    
                    {pedido.status === 'pending' && (
                      <UIButton 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1" 
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja cancelar este pedido?')) return;
                          try {
                            const res = await fetch(`${API_BASE_URL}/orders/${pedido.id}`, { 
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              credentials: 'include',
                              body: JSON.stringify({ status: 'cancelled' })
                            });
                            if (!res.ok) throw new Error('Falha ao cancelar pedido');
                            toast({ title: 'Pedido cancelado com sucesso!' });
                            window.location.reload();
                          } catch (e) {
                            toast({ title: 'Erro ao cancelar pedido', variant: 'destructive' });
                          }
                        }}
                      >
                        Cancelar
                      </UIButton>
                    )}
                    
                    {(pedido.status === 'cancelled' || pedido.status === 'pending') && (
                      <UIButton 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 text-red-600 hover:bg-red-50" 
                        onClick={async () => {
                          if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;
                          try {
                            const res = await fetch(`${API_BASE_URL}/orders/${pedido.id}`, { 
                              method: 'DELETE',
                              credentials: 'include'
                            });
                            if (!res.ok) throw new Error('Falha ao excluir pedido');
                            toast({ title: 'Pedido excluído com sucesso!' });
                            window.location.reload();
                          } catch (e) {
                            toast({ title: 'Erro ao excluir pedido', variant: 'destructive' });
                          }
                        }}
                      >
                        Excluir
                      </UIButton>
                    )}
                    
                    <UIButton variant="secondary" size="sm" className="flex-1" onClick={async () => {
                      try {
                        const res = await fetch(`${API_BASE_URL}/orders/${pedido.id}/reorder`, { method: 'POST', credentials: 'include' });
                        if (!res.ok) throw new Error('Falha ao repetir pedido');
                        navigate('/carrinho');
                      } catch (e) {}
                    }}>
                      Repetir pedido
                    </UIButton>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum pedido encontrado</h3>
            <p className="text-muted-foreground text-center mb-6">
              Você ainda não fez nenhum pedido. Que tal começar suas compras?
            </p>
            <Button onClick={() => navigate('/loja')} className="px-6">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ir às compras
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PedidosTab;
