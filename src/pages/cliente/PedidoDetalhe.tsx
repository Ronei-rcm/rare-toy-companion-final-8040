import React, { useEffect, useState } from 'react';
import Layout from '@/components/layout/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Truck, CheckCircle, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import { ordersApi } from '@/services/orders-api';

const PedidoDetalhe = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isLoading: isUserLoading } = useCurrentUser() as any;
  const [isLoading, setIsLoading] = useState(true);
  const [pedido, setPedido] = useState<any | null>(null);
  const [timeline, setTimeline] = useState<Array<{ status: string; at: string | Date }>>([]);
  const [actionLoading, setActionLoading] = useState<{ reorder: boolean; resend: boolean }>({ reorder: false, resend: false });
  const { toast } = useToast();

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }
    let ignore = false;
    (async () => {
      if (!id) return;
      try {
        setIsLoading(true);
        const [data, tl] = await Promise.all([
          ordersApi.getOrderById(id),
          ordersApi.getTimeline(id),
        ]);
        setPedido(data);
        setTimeline(Array.isArray(tl) ? tl : []);
      } catch (e) {
        setPedido(null);
        setTimeline([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const handleReorder = async () => {
    if (!id) return;
    try {
      setActionLoading((s) => ({ ...s, reorder: true }));
      await ordersApi.reorder(id);
      toast({ title: 'Pedido adicionado ao carrinho', description: 'Itens foram repostos no carrinho.' });
    } catch (e: any) {
      toast({ title: 'Erro ao repetir pedido', description: e?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setActionLoading((s) => ({ ...s, reorder: false }));
    }
  };

  const handleResend = async () => {
    if (!id) return;
    try {
      setActionLoading((s) => ({ ...s, resend: true }));
      await ordersApi.resendConfirmation(id);
      toast({ title: 'Comprovante reenviado', description: 'Verifique seu e-mail.' });
    } catch (e: any) {
      toast({ title: 'Erro ao reenviar', description: e?.message || 'Tente novamente', variant: 'destructive' });
    } finally {
      setActionLoading((s) => ({ ...s, resend: false }));
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'entregue':
        return <CheckCircle className="h-4 w-4" />;
      case 'em_transito':
        return <Truck className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <Layout>
        <div className="container py-8">Carregando...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="container py-8">
          <div className="mb-6 p-4 rounded-lg border bg-amber-50 text-amber-900 flex items-center justify-between">
            <div>
              <div className="font-semibold">Você não está logado</div>
              <div className="text-sm opacity-80">Faça login para ver detalhes do pedido.</div>
            </div>
            <a href="/auth/login" className="px-4 py-2 rounded-md border bg-white hover:bg-amber-100">Ir para login</a>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate('/minha-conta')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Carregando pedido...</CardContent>
          </Card>
        ) : !pedido ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Pedido não encontrado</CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Pedido {pedido.id}</CardTitle>
                      <CardDescription>
                        Realizado em {pedido.created_at ? new Date(pedido.created_at).toLocaleDateString('pt-BR') : '—'}
                      </CardDescription>
                    </div>
                    <Badge className="flex items-center gap-1">
                      {getStatusIcon(pedido.status)}
                      {pedido.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Array.isArray(pedido.items) && pedido.items.length > 0 ? (
                    pedido.items.map((it: any, idx: number) => (
                      <div key={`${it.product_id}-${idx}`} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img src={it.image_url || '/placeholder.svg'} alt={it.name} className="h-12 w-12 rounded object-cover" onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }} />
                          <div>
                            <div className="font-medium text-sm">{it.name}</div>
                            <div className="text-xs text-muted-foreground">Qtd: {it.quantity}</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium">
                          {(it.price * it.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground">Nenhum item</div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleReorder} disabled={actionLoading.reorder} className="flex-1">
                      {actionLoading.reorder ? 'Adicionando...' : 'Repetir pedido'}
                    </Button>
                    <Button onClick={handleResend} variant="outline" disabled={actionLoading.resend} className="flex-1">
                      {actionLoading.resend ? 'Enviando...' : 'Reenviar comprovante'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Método</span>
                    <span className="flex items-center gap-2">
                      <QrCode className="h-4 w-4" /> {pedido.metodo_pagamento || '—'}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span>Total</span>
                    <span className="font-semibold">{Number(pedido.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Status do pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  {timeline.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Sem eventos de status</div>
                  ) : (
                    <div className="space-y-3">
                      {timeline.map((ev, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          <div className="text-sm">
                            <div className="font-medium capitalize">{String(ev.status).replace('_', ' ')}</div>
                            <div className="text-xs text-muted-foreground">{new Date(ev.at).toLocaleString('pt-BR')}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Coluna lateral */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Dados de entrega</CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <div><span className="text-muted-foreground">Nome: </span>{pedido.nome || '—'}</div>
                  <div><span className="text-muted-foreground">Email: </span>{pedido.email || '—'}</div>
                  <div><span className="text-muted-foreground">Telefone: </span>{pedido.telefone || '—'}</div>
                  <div><span className="text-muted-foreground">Endereço: </span>{pedido.endereco || '—'}</div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default PedidoDetalhe;


