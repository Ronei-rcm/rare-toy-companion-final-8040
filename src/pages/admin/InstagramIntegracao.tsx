import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Instagram, 
  Facebook, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Settings,
  BarChart,
  Upload,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

const InstagramIntegracao = () => {
  const [conectado, setConectado] = useState(false);
  const [sincronizandoAutomatico, setSincronizandoAutomatico] = useState(false);
  const [carregandoSync, setCarregandoSync] = useState(false);

  // Dados mock para demonstração
  const estatisticas = {
    produtosSincronizados: 145,
    ultimaSync: '2024-12-18 14:30',
    produtosPendentes: 8,
    errosRecentes: 2
  };

  const logsSync = [
    { id: 1, data: '2024-12-18 14:30', produtos: 12, status: 'sucesso', detalhes: 'Sincronização completa' },
    { id: 2, data: '2024-12-18 10:15', produtos: 8, status: 'sucesso', detalhes: 'Produtos atualizados' },
    { id: 3, data: '2024-12-17 16:45', produtos: 5, status: 'erro', detalhes: 'Falha na autenticação' },
    { id: 4, data: '2024-12-17 09:20', produtos: 15, status: 'sucesso', detalhes: 'Novos produtos adicionados' }
  ];

  const handleConectar = () => {
    toast.success('Redirecionando para autenticação do Facebook...');
    // Aqui seria o redirect para OAuth do Facebook
  };

  const handleSincronizar = async () => {
    setCarregandoSync(true);
    // Simulação de sincronização
    setTimeout(() => {
      setCarregandoSync(false);
      toast.success('Catálogo sincronizado com sucesso!');
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Instagram className="h-8 w-8 text-pink-500" />
            Integração Instagram
          </h1>
          <p className="text-muted-foreground">
            Gerencie seu catálogo de produtos no Instagram e Facebook
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant={conectado ? "default" : "secondary"}>
            {conectado ? "Conectado" : "Desconectado"}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="sincronizacao">Sincronização</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Sincronizados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.produtosSincronizados}</div>
                <p className="text-xs text-muted-foreground">
                  Total no catálogo
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Produtos Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.produtosPendentes}</div>
                <p className="text-xs text-muted-foreground">
                  Aguardando sincronização
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Última Sync</CardTitle>
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-bold">{estatisticas.ultimaSync}</div>
                <p className="text-xs text-muted-foreground">
                  Automática
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erros Recentes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas.errosRecentes}</div>
                <p className="text-xs text-muted-foreground">
                  Últimas 24h
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>
                Verifique o status da sua integração com o Facebook Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!conectado ? (
                <div className="text-center py-8">
                  <Facebook className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Conectar com Facebook</h3>
                  <p className="text-muted-foreground mb-4">
                    Conecte sua conta do Facebook Business para sincronizar produtos
                  </p>
                  <Button onClick={handleConectar} size="lg">
                    <Facebook className="mr-2 h-4 w-4" />
                    Conectar Facebook Business
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <div>
                      <p className="font-medium">Conectado com sucesso!</p>
                      <p className="text-sm text-muted-foreground">
                        Última verificação: hoje às 14:30
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Reconectar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuracao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da API</CardTitle>
              <CardDescription>
                Configure suas credenciais do Facebook Business API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="app-id">App ID do Facebook</Label>
                  <Input 
                    id="app-id" 
                    placeholder="123456789012345"
                    type="password"
                  />
                </div>
                <div>
                  <Label htmlFor="catalog-id">Catalog ID</Label>
                  <Input 
                    id="catalog-id" 
                    placeholder="987654321098765"
                    type="password"
                  />
                </div>
                <div>
                  <Label htmlFor="page-id">Page ID</Label>
                  <Input 
                    id="page-id" 
                    placeholder="567890123456789"
                    type="password"
                  />
                </div>
                <div>
                  <Label htmlFor="business-id">Business ID</Label>
                  <Input 
                    id="business-id" 
                    placeholder="345678901234567"
                    type="password"
                  />
                </div>
              </div>
              <Button>
                <Settings className="mr-2 h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configurações de Sincronização</CardTitle>
              <CardDescription>
                Defina como e quando sincronizar seus produtos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-sync">Sincronização Automática</Label>
                  <p className="text-sm text-muted-foreground">
                    Sincroniza automaticamente quando produtos são alterados
                  </p>
                </div>
                <Switch
                  id="auto-sync"
                  checked={sincronizandoAutomatico}
                  onCheckedChange={setSincronizandoAutomatico}
                />
              </div>
              
              <div>
                <Label htmlFor="sync-frequency">Frequência de Sincronização</Label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option value="immediate">Imediata</option>
                  <option value="hourly">A cada hora</option>
                  <option value="daily">Diária</option>
                  <option value="weekly">Semanal</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sincronizacao" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sincronização Manual</CardTitle>
              <CardDescription>
                Force uma sincronização completa do catálogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={handleSincronizar}
                  disabled={carregandoSync}
                  size="lg"
                >
                  {carregandoSync ? (
                    <>
                      <Clock className="animate-spin mr-2 h-4 w-4" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Sincronizar Agora
                    </>
                  )}
                </Button>
                <div className="text-sm text-muted-foreground">
                  Última sincronização: {estatisticas.ultimaSync}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Sincronizações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {logsSync.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(log.status)}
                      <div>
                        <p className="font-medium">{log.data}</p>
                        <p className="text-sm text-muted-foreground">
                          {log.produtos} produtos • {log.detalhes}
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === 'sucesso' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Produtos por Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sincronizados</span>
                    <span className="font-medium">145</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pendentes</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Com erro</span>
                    <span className="font-medium">2</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Gráficos em desenvolvimento
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Exportar Relatórios</CardTitle>
              <CardDescription>
                Baixe relatórios detalhados sobre suas sincronizações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Exportar PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default InstagramIntegracao;