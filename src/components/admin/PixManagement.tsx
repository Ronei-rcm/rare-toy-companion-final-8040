import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { QrCode, CheckCircle, Clock, XCircle, Copy, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Dados simulados de transações PIX
const transacoesPix = [
  {
    id: 'TXN-001',
    valor: 237.22,
    cliente: 'João Silva',
    status: 'pago',
    codigo: '00020101021226580014BR.GOV.BCB.PIX0136123e4567-e12b-12d1-a456-426614174000',
    dataVencimento: '2024-04-15T10:30:00',
    dataPagamento: '2024-04-15T09:45:00'
  },
  {
    id: 'TXN-002',
    valor: 189.90,
    cliente: 'Maria Santos',
    status: 'pendente',
    codigo: '00020101021226580014BR.GOV.BCB.PIX0136456e7890-e12b-12d1-a456-426614174001',
    dataVencimento: '2024-04-16T14:00:00',
    dataPagamento: null
  },
  {
    id: 'TXN-003',
    valor: 325.80,
    cliente: 'Pedro Costa',
    status: 'expirado',
    codigo: '00020101021226580014BR.GOV.BCB.PIX0136789e0123-e12b-12d1-a456-426614174002',
    dataVencimento: '2024-04-14T16:30:00',
    dataPagamento: null
  }
];

const PixManagement = () => {
  const { toast } = useToast();
  const [novoPixValor, setNovoPixValor] = useState('');
  const [novoPixCliente, setNovoPixCliente] = useState('');

  const statusMap = {
    pago: { label: 'Pago', color: 'default', icon: CheckCircle },
    pendente: { label: 'Pendente', color: 'secondary', icon: Clock },
    expirado: { label: 'Expirado', color: 'destructive', icon: XCircle }
  };

  const gerarNovoPix = () => {
    if (!novoPixValor || !novoPixCliente) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'PIX Gerado',
      description: `Código PIX gerado para ${novoPixCliente} no valor de R$ ${parseFloat(novoPixValor).toFixed(2)}`,
    });
    
    setNovoPixValor('');
    setNovoPixCliente('');
  };

  const copiarCodigo = (codigo: string) => {
    navigator.clipboard.writeText(codigo);
    toast({
      title: 'Código Copiado',
      description: 'Código PIX copiado para a área de transferência.',
    });
  };

  const baixarQrCode = (transacaoId: string) => {
    toast({
      title: 'QR Code',
      description: `Baixando QR Code da transação ${transacaoId}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Geração de novo PIX */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Gerar Novo PIX
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cliente">Cliente</Label>
              <Input
                id="cliente"
                placeholder="Nome do cliente"
                value={novoPixCliente}
                onChange={(e) => setNovoPixCliente(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={novoPixValor}
                onChange={(e) => setNovoPixValor(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={gerarNovoPix} className="w-full md:w-auto">
            <QrCode className="h-4 w-4 mr-2" />
            Gerar PIX
          </Button>
        </CardContent>
      </Card>

      {/* Lista de transações PIX */}
      <Card>
        <CardHeader>
          <CardTitle>Transações PIX</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transacoesPix.map((transacao) => {
                  const status = statusMap[transacao.status as keyof typeof statusMap];
                  const StatusIcon = status.icon;

                  return (
                    <TableRow key={transacao.id}>
                      <TableCell className="font-medium">{transacao.id}</TableCell>
                      <TableCell>{transacao.cliente}</TableCell>
                      <TableCell>R$ {transacao.valor.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={status.color as any} className="flex items-center gap-1 w-fit">
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(transacao.dataVencimento).toLocaleString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copiarCodigo(transacao.codigo)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => baixarQrCode(transacao.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas PIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Arrecadado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">R$ 237,22</div>
            <p className="text-xs text-muted-foreground">1 transação paga</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">R$ 189,90</div>
            <p className="text-xs text-muted-foreground">1 aguardando pagamento</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expirados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">R$ 325,80</div>
            <p className="text-xs text-muted-foreground">1 transação expirada</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PixManagement;