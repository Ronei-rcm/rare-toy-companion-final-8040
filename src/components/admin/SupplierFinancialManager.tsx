import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Building2,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Plus,
  Edit,
  CreditCard,
  FileText,
  Eye,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface SupplierFinancialManagerProps {
  suppliers: any[];
  loading?: boolean;
  onRefresh?: () => void;
  onCreateTransaction?: (supplierId: string, data: any) => void;
  onRecordPayment?: (supplierId: string, data: any) => void;
  onUpdateCreditLimit?: (supplierId: string, limit: number) => void;
}

const SupplierFinancialManager: React.FC<SupplierFinancialManagerProps> = ({
  suppliers = [],
  loading = false,
  onRefresh = () => {},
  onCreateTransaction = async () => false,
  onRecordPayment = async () => false,
  onUpdateCreditLimit = async () => false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);
  const [showCreditLimitDialog, setShowCreditLimitDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [newCreditLimit, setNewCreditLimit] = useState('');

  // Filtrar fornecedores
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || supplier.riscoCredito === riskFilter;
    
    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Calcular estatísticas
  const stats = {
    total: suppliers.length,
    ativos: suppliers.filter(s => s.status === 'ativo').length,
    totalDebt: suppliers.reduce((sum, s) => sum + (s.saldoDevedor || 0), 0),
    totalCredit: suppliers.reduce((sum, s) => sum + (s.limiteCredito || 0), 0),
    highRisk: suppliers.filter(s => s.riscoCredito === 'alto').length,
    averageScore: suppliers.length > 0 ? 
      suppliers.reduce((sum, s) => sum + (s.scoreFinanceiro || 0), 0) / suppliers.length : 0
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case 'baixo': return 'bg-green-100 text-green-800';
      case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'alto': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800';
      case 'inativo': return 'bg-gray-100 text-gray-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePayment = () => {
    if (!selectedSupplier || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error('Valor deve ser maior que zero');
      return;
    }

    const paymentData = {
      dataPagamento: new Date().toISOString().split('T')[0],
      valor: amount,
      status: 'pago' as const,
      formaPagamento: 'Transferência',
      observacoes: 'Pagamento registrado via sistema'
    };

    onRecordPayment?.(selectedSupplier.id, paymentData);
    setShowPaymentDialog(false);
    setPaymentAmount('');
    setSelectedSupplier(null);
  };

  const handleCreditLimitUpdate = () => {
    if (!selectedSupplier || !newCreditLimit) return;
    
    const limit = parseFloat(newCreditLimit);
    if (limit < 0) {
      toast.error('Limite deve ser maior ou igual a zero');
      return;
    }

    onUpdateCreditLimit?.(selectedSupplier.id, limit);
    setShowCreditLimitDialog(false);
    setNewCreditLimit('');
    setSelectedSupplier(null);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-muted-foreground">Carregando fornecedores...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Fornecedores</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Saldo Devedor</p>
                <p className="text-2xl font-bold text-red-600">
                  R$ {stats.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Limite Total</p>
                <p className="text-2xl font-bold text-green-600">
                  R$ {stats.totalCredit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Score Médio</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(0)}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros e Ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestão Financeira de Fornecedores</CardTitle>
            <div className="flex gap-2">
              <Button onClick={onRefresh} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar fornecedor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todos Status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="pendente">Pendente</option>
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="px-3 py-2 border rounded-md"
              >
                <option value="all">Todos Riscos</option>
                <option value="baixo">Baixo Risco</option>
                <option value="medio">Médio Risco</option>
                <option value="alto">Alto Risco</option>
              </select>
            </div>
          </div>

          {/* Tabela de Fornecedores */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Saldo Devedor</TableHead>
                  <TableHead>Limite Crédito</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Risco</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{supplier.nome}</div>
                        <div className="text-sm text-muted-foreground">{supplier.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadgeColor(supplier.status)}>
                        {supplier.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${supplier.saldoDevedor > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        R$ {supplier.saldoDevedor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        R$ {supplier.limiteCredito?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${supplier.scoreFinanceiro || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{supplier.scoreFinanceiro || 0}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRiskBadgeColor(supplier.riscoCredito)}>
                        {supplier.riscoCredito}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowPaymentDialog(true);
                          }}>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Registrar Pagamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedSupplier(supplier);
                            setShowTransactionDialog(true);
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nova Transação
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedSupplier(supplier);
                            setNewCreditLimit(supplier.limiteCredito?.toString() || '0');
                            setShowCreditLimitDialog(true);
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Alterar Limite
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog de Pagamento */}
      <AlertDialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar Pagamento</AlertDialogTitle>
            <AlertDialogDescription>
              Registre um pagamento para {selectedSupplier?.nome}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Valor do Pagamento</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Saldo atual: R$ {selectedSupplier?.saldoDevedor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePayment}>
              Registrar Pagamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Limite de Crédito */}
      <AlertDialog open={showCreditLimitDialog} onOpenChange={setShowCreditLimitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar Limite de Crédito</AlertDialogTitle>
            <AlertDialogDescription>
              Defina um novo limite de crédito para {selectedSupplier?.nome}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Novo Limite de Crédito</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={newCreditLimit}
                  onChange={(e) => setNewCreditLimit(e.target.value)}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Limite atual: R$ {selectedSupplier?.limiteCredito?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCreditLimitUpdate}>
              Atualizar Limite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SupplierFinancialManager;
