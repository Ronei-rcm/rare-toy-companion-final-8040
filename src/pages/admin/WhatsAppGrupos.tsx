
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  MessageCircle,
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Send,
  UserPlus,
  Settings,
  BarChart,
  TrendingUp,
  Zap,
  QrCode,
  Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import WhatsAppIntegration from '@/components/admin/WhatsAppIntegration';
import GrupoMembers from '@/components/admin/GrupoMembers';
import WhatsAppMessages from '@/components/admin/WhatsAppMessages';

// Dados simulados dos grupos
const grupos = [
  {
    id: '1',
    nome: 'Vendas Brinquedos Premium',
    descricao: 'Grupo para vendas de brinquedos premium',
    membros: 156,
    vendas: 23,
    faturamento: 4580.50,
    status: 'ativo',
    ultimaAtividade: '2 horas atrás',
    link: 'https://chat.whatsapp.com/exemplo1'
  },
  {
    id: '2',
    nome: 'Promoções Toy Heroes',
    descricao: 'Ofertas especiais e promoções',
    membros: 89,
    vendas: 15,
    faturamento: 2340.30,
    status: 'ativo',
    ultimaAtividade: '30 min atrás',
    link: 'https://chat.whatsapp.com/exemplo2'
  },
  {
    id: '3',
    nome: 'Lançamentos Exclusivos',
    descricao: 'Primeiras vendas de novos produtos',
    membros: 45,
    vendas: 8,
    faturamento: 1890.80,
    status: 'pausado',
    ultimaAtividade: '1 dia atrás',
    link: 'https://chat.whatsapp.com/exemplo3'
  }
];

const WhatsAppGrupos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [novoGrupo, setNovoGrupo] = useState({
    nome: '',
    descricao: '',
    link: ''
  });
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);

  const handleCriarGrupo = () => {
    if (!novoGrupo.nome || !novoGrupo.link) {
      toast.error('Nome do grupo e link são obrigatórios');
      return;
    }
    
    toast.success('Grupo criado com sucesso!');
    setNovoGrupo({ nome: '', descricao: '', link: '' });
  };

  const handleEnviarMensagem = (grupoId: string) => {
    toast.success('Mensagem enviada para o grupo!');
  };

  const handleGerarLink = (grupoId: string) => {
    const link = `https://chat.whatsapp.com/convite-${grupoId}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado para a área de transferência!');
  };

  const handleGerarQRCode = (grupoId: string) => {
    toast.success('QR Code gerado! Baixando...');
  };

  const totalMembros = grupos.reduce((acc, grupo) => acc + grupo.membros, 0);
  const totalVendas = grupos.reduce((acc, grupo) => acc + grupo.vendas, 0);
  const totalFaturamento = grupos.reduce((acc, grupo) => acc + grupo.faturamento, 0);

  if (selectedGrupo) {
    const grupo = grupos.find(g => g.id === selectedGrupo);
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => setSelectedGrupo(null)}>
              ← Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gerenciar Grupo</h1>
              <p className="text-muted-foreground">{grupo?.nome}</p>
            </div>
          </div>
        </div>
        
        <GrupoMembers 
          grupoId={selectedGrupo} 
          grupoNome={grupo?.nome || ''} 
        />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gerenciamento de Grupos WhatsApp</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Grupo</DialogTitle>
              <DialogDescription>
                Configure um novo grupo do WhatsApp para vendas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Grupo</label>
                <Input
                  placeholder="Ex: Vendas Brinquedos Premium"
                  value={novoGrupo.nome}
                  onChange={(e) => setNovoGrupo({...novoGrupo, nome: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  placeholder="Descrição do grupo..."
                  value={novoGrupo.descricao}
                  onChange={(e) => setNovoGrupo({...novoGrupo, descricao: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Link do Grupo</label>
                <Input
                  placeholder="https://chat.whatsapp.com/..."
                  value={novoGrupo.link}
                  onChange={(e) => setNovoGrupo({...novoGrupo, link: e.target.value})}
                />
              </div>
              <Button onClick={handleCriarGrupo} className="w-full">
                Criar Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="grupos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
          <TabsTrigger value="integracao">Integração</TabsTrigger>
          <TabsTrigger value="mensagens">Mensagens</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
        </TabsList>

        <TabsContent value="grupos" className="space-y-4">
          {/* Cards de estatísticas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Grupos</CardTitle>
                <MessageCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{grupos.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Membros</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalMembros}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalVendas}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">R$ {totalFaturamento.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar grupos..."
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Tabela de grupos */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Membros</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Faturamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atividade</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grupos.map(grupo => (
                    <TableRow key={grupo.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{grupo.nome}</div>
                          <div className="text-sm text-muted-foreground">{grupo.descricao}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          {grupo.membros}
                        </div>
                      </TableCell>
                      <TableCell>{grupo.vendas}</TableCell>
                      <TableCell>R$ {grupo.faturamento.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={grupo.status === 'ativo' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {grupo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{grupo.ultimaAtividade}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setSelectedGrupo(grupo.id)}>
                              <UserPlus className="mr-2 h-4 w-4" />
                              Gerenciar membros
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEnviarMensagem(grupo.id)}>
                              <Send className="mr-2 h-4 w-4" />
                              Enviar mensagem
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGerarLink(grupo.id)}>
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Copiar link
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleGerarQRCode(grupo.id)}>
                              <QrCode className="mr-2 h-4 w-4" />
                              Gerar QR Code
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Settings className="mr-2 h-4 w-4" />
                              Configurações
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integracao" className="space-y-4">
          <WhatsAppIntegration onConnectionChange={(connected) => {
            console.log('WhatsApp connection status:', connected);
          }} />
        </TabsContent>

        <TabsContent value="mensagens" className="space-y-4">
          <WhatsAppMessages />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enviar Mensagem em Massa</CardTitle>
              <CardDescription>
                Envie mensagens promocionais para todos os grupos ativos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Selecionar Grupos</label>
                <div className="space-y-2 mt-2">
                  {grupos.filter(g => g.status === 'ativo').map(grupo => (
                    <div key={grupo.id} className="flex items-center space-x-2">
                      <input type="checkbox" id={grupo.id} className="rounded" />
                      <label htmlFor={grupo.id} className="text-sm">{grupo.nome}</label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Mensagem</label>
                <Textarea
                  placeholder="Digite sua mensagem promocional..."
                  className="mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar para Grupos Selecionados
                </Button>
                <Button variant="outline">
                  <Zap className="mr-2 h-4 w-4" />
                  Agendar Envio
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance dos Grupos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {grupos.map(grupo => (
                    <div key={grupo.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{grupo.nome}</div>
                        <div className="text-sm text-muted-foreground">{grupo.vendas} vendas</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">R$ {grupo.faturamento.toFixed(2)}</div>
                        <div className="text-sm text-muted-foreground">{grupo.membros} membros</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Resumo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de Grupos Ativos:</span>
                    <span className="font-medium">{grupos.filter(g => g.status === 'ativo').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total de Membros:</span>
                    <span className="font-medium">{totalMembros}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vendas Realizadas:</span>
                    <span className="font-medium">{totalVendas}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Faturamento Total:</span>
                    <span className="font-medium">R$ {totalFaturamento.toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppGrupos;
