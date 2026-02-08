import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { request } from '@/services/api-config';

const RecuperacaoAdmin = () => {
  const { toast } = useToast();

  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [emailFilter, setEmailFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const pageSize = 20;

  const load = async (pg: number) => {
    try {
      setLoading(true);
      const data = await request<any>(`/recovery/emails?page=${pg}&pageSize=${pageSize}&email=${encodeURIComponent(emailFilter)}`);

      setItems(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || pg);
      setTotal(Number(data.total || 0));
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao carregar' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(1); }, [emailFilter]);

  const resend = async (email: string) => {
    try {
      setIsResending(true);
      await request<any>('/recovery/notify', {
        method: 'POST',
        body: JSON.stringify({ email })
      });

      toast({ title: 'Reenviado', description: email });
      load(page);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro no reenvio', description: e?.message });
    } finally {
      setIsResending(false);
    }
  };

  const exportCsv = () => {
    const header = ['created_at', 'email', 'status', 'sent_at', 'error'];
    const rows = items.map((r) => [
      new Date(r.created_at).toISOString(),
      r.email,
      r.status,
      r.sent_at ? new Date(r.sent_at).toISOString() : '',
      (r.error || '').replace(/\n/g, ' ')
    ]);
    const csv = [header, ...rows].map((arr) => arr.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recovery_emails_p${page}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const disableNext = loading || page >= totalPages;

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Recuperação de Carrinho - E-mails Enviados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input placeholder="Filtrar por e-mail" value={emailFilter} onChange={(e) => setEmailFilter(e.target.value)} />
            <Button onClick={() => load(1)} disabled={loading}>Filtrar</Button>
            <Button variant="outline" onClick={exportCsv} disabled={loading || items.length === 0}>Exportar CSV</Button>
          </div>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="py-2 pr-4">Quando</th>
                    <th className="py-2 pr-4">E-mail</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Enviado em</th>
                    <th className="py-2 pr-4">Erro</th>
                    <th className="py-2 pr-4">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="py-2 pr-4">{new Date(r.created_at).toLocaleString('pt-BR')}</td>
                      <td className="py-2 pr-4">{r.email}</td>
                      <td className="py-2 pr-4">{r.status}</td>
                      <td className="py-2 pr-4">{r.sent_at ? new Date(r.sent_at).toLocaleString('pt-BR') : '-'}</td>
                      <td className="py-2 pr-4 max-w-[240px] truncate" title={r.error || ''}>{r.error || '-'}</td>
                      <td className="py-2 pr-4">
                        <Button size="sm" variant="outline" onClick={() => resend(r.email)} disabled={isResending}>Reenviar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-between gap-2 mt-3">
                <div className="text-xs text-muted-foreground">Total: {total} • Página {page} de {totalPages}</div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => load(Math.max(1, page - 1))} disabled={page <= 1 || loading}>Anterior</Button>
                  <Button variant="outline" onClick={() => load(page + 1)} disabled={disableNext}>Próxima</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RecuperacaoAdmin;


