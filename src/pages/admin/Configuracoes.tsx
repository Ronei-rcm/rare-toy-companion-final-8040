import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

const ConfiguracoesAdmin = () => {
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  const [form, setForm] = useState({
    pix_discount_percent: '5',
    digital_pay_discount_percent: '2',
    free_shipping_min: '200',
    shipping_base_price: '15',
    enable_apple_pay: 'true',
    enable_google_pay: 'true',
    cart_recovery_enabled: 'true',
    cart_recovery_banner_delay_ms: '120000',
    cart_recovery_email_delay_ms: '600000',
    smtp_enabled: 'false',
    smtp_host: '',
    smtp_port: '587',
    smtp_secure: 'false',
    smtp_user: '',
    smtp_pass: '',
    smtp_from: '',
    // Configurações PIX
    pix_key: '',
    pix_key_type: 'email', // email, cpf, cnpj, phone, random
    pix_merchant_name: '',
    pix_city: '',
    pix_show_qr_cart: 'true',
    // (WhatsApp movido para Home Config > Contato)
  });
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [auditTotal, setAuditTotal] = useState(0);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/settings`, { credentials: 'include' });
      const data = await res.json();
      const s = (data && data.settings) || {};
      setForm({
        pix_discount_percent: String(s.pix_discount_percent ?? '5'),
        digital_pay_discount_percent: String(s.digital_pay_discount_percent ?? '2'),
        free_shipping_min: String(s.free_shipping_min ?? '200'),
        shipping_base_price: String(s.shipping_base_price ?? '15'),
        enable_apple_pay: String(s.enable_apple_pay ?? 'true'),
        enable_google_pay: String(s.enable_google_pay ?? 'true'),
        cart_recovery_enabled: String(s.cart_recovery_enabled ?? 'true'),
        cart_recovery_banner_delay_ms: String(s.cart_recovery_banner_delay_ms ?? '120000'),
        cart_recovery_email_delay_ms: String(s.cart_recovery_email_delay_ms ?? '600000'),
        smtp_enabled: String(s.smtp_enabled ?? 'false'),
        smtp_host: String(s.smtp_host ?? ''),
        smtp_port: String(s.smtp_port ?? '587'),
        smtp_secure: String(s.smtp_secure ?? 'false'),
        smtp_user: String(s.smtp_user ?? ''),
        smtp_pass: '',
        smtp_from: String(s.smtp_from ?? ''),
        // Configurações PIX
        pix_key: String(s.pix_key ?? ''),
        pix_key_type: String(s.pix_key_type ?? 'email'),
        pix_merchant_name: String(s.pix_merchant_name ?? ''),
        pix_city: String(s.pix_city ?? ''),
        pix_show_qr_cart: String(s.pix_show_qr_cart ?? 'true'),
        // (WhatsApp movido para Home Config > Contato)
      });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Erro ao carregar configurações' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        credentials: 'include',
        // Envia token admin básico pelo header; em prod, usar sessão/jwt do painel
        // @ts-ignore
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': localStorage.getItem('admin_token') || '' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Falha ao salvar');
      toast({ title: 'Configurações salvas' });
      fetchAudit(1);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Erro ao salvar', description: e?.message });
    } finally {
      setIsSaving(false);
    }
  };

  const setField = (k: keyof typeof form, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const testSmtp = async () => {
    try {
      setIsTestingSmtp(true);
      const res = await fetch(`${API_BASE_URL}/utils/smtp-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': localStorage.getItem('admin_token') || '' },
        credentials: 'include',
        body: JSON.stringify({ to: form.smtp_user || undefined })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Falha no teste SMTP');
      toast({ title: 'SMTP OK', description: 'E-mail de teste enviado.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Falha no SMTP', description: e?.message });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const fetchAudit = async (pg: number) => {
    try {
      const res = await fetch(`${API_BASE_URL}/settings/audit?page=${pg}&pageSize=10`, {
        credentials: 'include',
        // @ts-ignore
        headers: { 'X-Admin-Token': localStorage.getItem('admin_token') || '' }
      });
      if (!res.ok) return;
      const data = await res.json();
      setAudit(Array.isArray(data.items) ? data.items : []);
      setPage(data.page || pg);
      setAuditTotal(Number(data.total || 0));
    } catch {}
  };

  useEffect(() => { fetchAudit(1); }, []);

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações da Loja</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Desconto PIX (%)</Label>
                  <Input type="number" value={form.pix_discount_percent} onChange={e => setField('pix_discount_percent', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Desconto Apple/Google Pay (%)</Label>
                  <Input type="number" value={form.digital_pay_discount_percent} onChange={e => setField('digital_pay_discount_percent', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Frete Grátis a partir de (R$)</Label>
                  <Input type="number" value={form.free_shipping_min} onChange={e => setField('free_shipping_min', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Frete Base (R$)</Label>
                  <Input type="number" value={form.shipping_base_price} onChange={e => setField('shipping_base_price', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ativar Apple Pay</Label>
                  <select className="border rounded h-10 px-3" value={form.enable_apple_pay} onChange={e => setField('enable_apple_pay', e.target.value)}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Ativar Google Pay</Label>
                  <select className="border rounded h-10 px-3" value={form.enable_google_pay} onChange={e => setField('enable_google_pay', e.target.value)}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
              </div>

              {/* Seção PIX */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <span>🔑</span>
                  Configurações PIX
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo da Chave PIX</Label>
                    <select className="border rounded h-10 px-3 w-full" value={form.pix_key_type} onChange={e => setField('pix_key_type', e.target.value)}>
                      <option value="email">E-mail</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="phone">Telefone</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Chave PIX</Label>
                    <Input 
                      type="text" 
                      value={form.pix_key} 
                      onChange={e => setField('pix_key', e.target.value)}
                      placeholder={
                        form.pix_key_type === 'email' ? 'exemplo@loja.com' :
                        form.pix_key_type === 'cpf' ? '000.000.000-00' :
                        form.pix_key_type === 'cnpj' ? '00.000.000/0000-00' :
                        form.pix_key_type === 'phone' ? '+55 11 99999-9999' :
                        'Chave aleatória do banco'
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome do Recebedor</Label>
                    <Input 
                      type="text" 
                      value={form.pix_merchant_name} 
                      onChange={e => setField('pix_merchant_name', e.target.value)}
                      placeholder="Nome da loja ou pessoa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade do Recebedor</Label>
                    <Input 
                      type="text" 
                      value={form.pix_city} 
                      onChange={e => setField('pix_city', e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Mostrar QR Code no Carrinho</Label>
                    <select className="border rounded h-10 px-3" value={form.pix_show_qr_cart} onChange={e => setField('pix_show_qr_cart', e.target.value)}>
                      <option value="true">Sim - Mostrar QR Code PIX no carrinho</option>
                      <option value="false">Não - Apenas no checkout</option>
                    </select>
                  </div>
                </div>
                
                {/* Preview do QR Code PIX */}
                {form.pix_key && form.pix_merchant_name && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Preview do QR Code PIX:</h4>
                    <div className="flex items-center gap-4">
                      <div className="w-32 h-32 bg-white border rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500">QR Code PIX</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <p><strong>Chave:</strong> {form.pix_key}</p>
                        <p><strong>Recebedor:</strong> {form.pix_merchant_name}</p>
                        <p><strong>Cidade:</strong> {form.pix_city || 'Não informada'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* (WhatsApp movido para Home Config > Contato) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Recuperação de Carrinho</Label>
                  <select className="border rounded h-10 px-3" value={form.cart_recovery_enabled} onChange={e => setField('cart_recovery_enabled', e.target.value)}>
                    <option value="true">Ativado</option>
                    <option value="false">Desativado</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Delay Banner (ms)</Label>
                  <Input type="number" value={form.cart_recovery_banner_delay_ms} onChange={e => setField('cart_recovery_banner_delay_ms', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Delay Email (ms)</Label>
                  <Input type="number" value={form.cart_recovery_email_delay_ms} onChange={e => setField('cart_recovery_email_delay_ms', e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>SMTP Ativado</Label>
                  <select className="border rounded h-10 px-3" value={form.smtp_enabled} onChange={e => setField('smtp_enabled', e.target.value)}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>SMTP Host</Label>
                  <Input value={form.smtp_host} onChange={e => setField('smtp_host', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Porta</Label>
                  <Input type="number" value={form.smtp_port} onChange={e => setField('smtp_port', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Seguro (TLS/SSL)</Label>
                  <select className="border rounded h-10 px-3" value={form.smtp_secure} onChange={e => setField('smtp_secure', e.target.value)}>
                    <option value="true">Sim</option>
                    <option value="false">Não</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>SMTP Usuário</Label>
                  <Input value={form.smtp_user} onChange={e => setField('smtp_user', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>SMTP Senha</Label>
                  <Input type="password" value={form.smtp_pass} onChange={e => setField('smtp_pass', e.target.value)} placeholder="(não exibida)" />
                </div>
                <div className="space-y-2">
                  <Label>SMTP From</Label>
                  <Input value={form.smtp_from} onChange={e => setField('smtp_from', e.target.value)} placeholder="Nome <email@dominio>" />
                </div>
              </div>

              <div className="pt-2">
                <div className="flex gap-2">
                  <Button onClick={save} disabled={isSaving}>
                    {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                  <Button type="button" variant="outline" onClick={testSmtp} disabled={isTestingSmtp}>
                    {isTestingSmtp ? 'Testando...' : 'Testar SMTP'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

    <Card>
      <CardHeader>
        <CardTitle>Histórico de Alterações</CardTitle>
      </CardHeader>
      <CardContent>
        {audit.length === 0 ? (
          <div className="text-sm text-muted-foreground">Sem alterações recentes.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="py-2 pr-4">Quando</th>
                  <th className="py-2 pr-4">Chave</th>
                  <th className="py-2 pr-4">De</th>
                  <th className="py-2 pr-4">Para</th>
                  <th className="py-2 pr-4">Admin</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((a) => (
                  <tr key={a.id} className="border-t">
                    <td className="py-2 pr-4">{new Date(a.created_at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-4">{a.key_name}</td>
                    <td className="py-2 pr-4">{String(a.old_value ?? '')}</td>
                    <td className="py-2 pr-4">{String(a.new_value ?? '')}</td>
                    <td className="py-2 pr-4">{a.admin_id || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="text-xs text-muted-foreground">Página {page} de {Math.max(1, Math.ceil(auditTotal / 10))}</div>
            </div>
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="text-xs text-muted-foreground">Total: {auditTotal}</div>
              <div className="flex gap-2">
                <button className="border rounded px-3 py-1 text-sm" onClick={() => fetchAudit(Math.max(1, page - 1))} disabled={page <= 1}>Anterior</button>
                <button className="border rounded px-3 py-1 text-sm" onClick={() => fetchAudit(page + 1)}>Próxima</button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};

export default ConfiguracoesAdmin;
