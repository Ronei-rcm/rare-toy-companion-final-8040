import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mail, 
  Send, 
  Users, 
  TrendingUp, 
  Eye, 
  MousePointer, 
  BarChart3,
  Plus,
  Settings,
  TestTube
} from 'lucide-react';

interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
}

interface Campaign {
  id: string;
  name: string;
  type: 'newsletter' | 'promotion' | 'cart-recovery' | 'welcome';
  status: 'draft' | 'sending' | 'sent' | 'paused';
  sent: number;
  opened: number;
  clicked: number;
  createdAt: string;
}

const EmailMarketing: React.FC = () => {
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    unsubscribeRate: 0
  });

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Formulários
  const [newsletterForm, setNewsletterForm] = useState({
    subject: '',
    products: [],
    offers: []
  });

  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    loadStats();
    loadCampaigns();
  }, []);

  const loadStats = async () => {
    try {
      const response = await fetch('/api/email-marketing/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadCampaigns = async () => {
    try {
      // Simular dados de campanhas
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          name: 'Black Friday 2025',
          type: 'promotion',
          status: 'sent',
          sent: 500,
          opened: 380,
          clicked: 95,
          createdAt: '2025-10-20'
        },
        {
          id: '2',
          name: 'Newsletter Semanal',
          type: 'newsletter',
          status: 'sent',
          sent: 300,
          opened: 210,
          clicked: 67,
          createdAt: '2025-10-19'
        },
        {
          id: '3',
          name: 'Recuperação de Carrinho',
          type: 'cart-recovery',
          status: 'sending',
          sent: 150,
          opened: 90,
          clicked: 25,
          createdAt: '2025-10-21'
        }
      ];
      setCampaigns(mockCampaigns);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendNewsletter = async () => {
    setSending(true);
    try {
      const response = await fetch('/api/email-marketing/newsletter/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newsletterForm)
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Newsletter enviada com sucesso! ${data.results} e-mails enviados.`);
        setNewsletterForm({ subject: '', products: [], offers: [] });
      } else {
        alert('Erro ao enviar newsletter: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao enviar newsletter:', error);
      alert('Erro ao enviar newsletter');
    } finally {
      setSending(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      alert('Digite um e-mail para teste');
      return;
    }

    try {
      const response = await fetch(`/api/email-marketing/test?email=${testEmail}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        alert('E-mail de teste enviado com sucesso!');
      } else {
        alert('Erro ao enviar e-mail de teste: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao enviar e-mail de teste:', error);
      alert('Erro ao enviar e-mail de teste');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">📧 E-mail Marketing</h1>
        <div className="flex gap-2">
          <Button onClick={loadStats} variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Atualizar Stats
          </Button>
          <Button onClick={sendTestEmail} variant="outline">
            <TestTube className="w-4 h-4 mr-2" />
            Teste
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Enviados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSent.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Abertura</p>
                <p className="text-2xl font-bold text-gray-900">{stats.openRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MousePointer className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Clique</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clickRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Rejeição</p>
                <p className="text-2xl font-bold text-gray-900">{stats.bounceRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Campanhas Ativas</h2>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Campanha
            </Button>
          </div>

          <div className="grid gap-4">
            {campaigns.map((campaign) => (
              <Card key={campaign.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{campaign.name}</h3>
                        <Badge variant={
                          campaign.status === 'sent' ? 'default' :
                          campaign.status === 'sending' ? 'secondary' :
                          campaign.status === 'paused' ? 'destructive' : 'outline'
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Enviados:</span> {campaign.sent}
                        </div>
                        <div>
                          <span className="font-medium">Abertos:</span> {campaign.opened}
                        </div>
                        <div>
                          <span className="font-medium">Cliques:</span> {campaign.clicked}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress 
                          value={(campaign.opened / campaign.sent) * 100} 
                          className="h-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Taxa de abertura: {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="newsletter" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Newsletter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input
                  id="subject"
                  value={newsletterForm.subject}
                  onChange={(e) => setNewsletterForm({...newsletterForm, subject: e.target.value})}
                  placeholder="Ex: Novidades e Ofertas Especiais"
                />
              </div>

              <div>
                <Label htmlFor="test-email">E-mail de Teste</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="seu-email@exemplo.com"
                  />
                  <Button onClick={sendTestEmail} variant="outline">
                    <TestTube className="w-4 h-4 mr-2" />
                    Testar
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={sendNewsletter} 
                  disabled={sending || !newsletterForm.subject}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? 'Enviando...' : 'Enviar Newsletter'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Templates de E-mail</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { name: 'Newsletter', type: 'newsletter', description: 'E-mail semanal com novidades' },
                  { name: 'Boas-vindas', type: 'welcome', description: 'E-mail de boas-vindas para novos clientes' },
                  { name: 'Carrinho Abandonado', type: 'cart-recovery', description: 'Recuperação de carrinho abandonado' },
                  { name: 'Confirmação de Pedido', type: 'order-confirmation', description: 'Confirmação de pedido realizado' },
                  { name: 'Promoção', type: 'promotion', description: 'E-mails promocionais' },
                  { name: 'Atualização de Entrega', type: 'delivery-update', description: 'Status de entrega' }
                ].map((template) => (
                  <Card key={template.type} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        <Settings className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações de E-mail</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtp-host">Servidor SMTP</Label>
                <Input id="smtp-host" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <Label htmlFor="smtp-port">Porta</Label>
                <Input id="smtp-port" placeholder="587" />
              </div>
              <div>
                <Label htmlFor="email-user">Usuário</Label>
                <Input id="email-user" placeholder="seu-email@gmail.com" />
              </div>
              <div>
                <Label htmlFor="email-pass">Senha</Label>
                <Input id="email-pass" type="password" placeholder="Sua senha de app" />
              </div>
              <Button>Salvar Configurações</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailMarketing;
