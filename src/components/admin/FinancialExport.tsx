import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, FileSpreadsheet, FileImage, AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface FinancialExportProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
  summary: any;
}

const FinancialExport: React.FC<FinancialExportProps> = ({
  orders,
  suppliers,
  events,
  transactions,
  summary
}) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [dateRange, setDateRange] = useState('30days');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [selectedData, setSelectedData] = useState({
    transactions: true,
    summary: true,
    orders: false,
    suppliers: false,
    events: false
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Função para exportar dados em CSV
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para exportar dados em JSON
  const exportToJSON = (data: any, filename: string) => {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para gerar relatório em texto
  const generateTextReport = () => {
    const now = new Date();
    const report = `
RELATÓRIO FINANCEIRO - MUHLSTORE
Gerado em: ${format(now, 'dd/MM/yyyy HH:mm', { locale: ptBR })}

=== RESUMO FINANCEIRO ===
Faturamento Total: R$ ${summary?.totalRevenue?.toLocaleString('pt-BR') || '0,00'}
Despesas Total: R$ ${summary?.totalExpenses?.toLocaleString('pt-BR') || '0,00'}
Lucro Líquido: R$ ${summary?.netProfit?.toLocaleString('pt-BR') || '0,00'}
Saldo Projetado: R$ ${summary?.projectedBalance?.toLocaleString('pt-BR') || '0,00'}

=== TRANSAÇÕES RECENTES ===
${transactions.slice(0, 10).map(t => 
  `${t.data} - ${t.descricao} - ${t.tipo}: R$ ${t.valor.toLocaleString('pt-BR')} (${t.status})`
).join('\n')}

=== PEDIDOS ===
Total de Pedidos: ${orders.length}
Valor Total: R$ ${orders.reduce((sum, order) => sum + (order.total || 0), 0).toLocaleString('pt-BR')}

=== FORNECEDORES ===
Total de Fornecedores: ${suppliers.length}
Despesa Total: R$ ${suppliers.reduce((sum, supplier) => sum + (supplier.total_expenses || 0), 0).toLocaleString('pt-BR')}

=== EVENTOS ===
Total de Eventos: ${events.length}
Faturamento Total: R$ ${events.reduce((sum, event) => sum + (event.revenue || 0), 0).toLocaleString('pt-BR')}

---
Relatório gerado automaticamente pelo Sistema Muhlstore
    `.trim();

    const blob = new Blob([report], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-financeiro-${format(now, 'yyyy-MM-dd')}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função para filtrar dados por período
  const filterDataByDateRange = (data: any[]) => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case '7days':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '6months':
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case '1year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        startDate = customStartDate || new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const endDate = dateRange === 'custom' ? customEndDate || now : now;

    return data.filter(item => {
      const itemDate = new Date(item.data || item.created_at || item.data_evento);
      return itemDate >= startDate && itemDate <= endDate;
    });
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
      
      // Exportar dados selecionados
      if (selectedData.transactions) {
        const filteredTransactions = filterDataByDateRange(transactions);
        if (exportFormat === 'csv') {
          exportToCSV(filteredTransactions, `transacoes-${timestamp}`);
        } else {
          exportToJSON(filteredTransactions, `transacoes-${timestamp}`);
        }
      }

      if (selectedData.summary) {
        if (exportFormat === 'csv') {
          exportToCSV([summary], `resumo-financeiro-${timestamp}`);
        } else {
          exportToJSON(summary, `resumo-financeiro-${timestamp}`);
        }
      }

      if (selectedData.orders) {
        const filteredOrders = filterDataByDateRange(orders);
        if (exportFormat === 'csv') {
          exportToCSV(filteredOrders, `pedidos-${timestamp}`);
        } else {
          exportToJSON(filteredOrders, `pedidos-${timestamp}`);
        }
      }

      if (selectedData.suppliers) {
        const filteredSuppliers = filterDataByDateRange(suppliers);
        if (exportFormat === 'csv') {
          exportToCSV(filteredSuppliers, `fornecedores-${timestamp}`);
        } else {
          exportToJSON(filteredSuppliers, `fornecedores-${timestamp}`);
        }
      }

      if (selectedData.events) {
        const filteredEvents = filterDataByDateRange(events);
        if (exportFormat === 'csv') {
          exportToCSV(filteredEvents, `eventos-${timestamp}`);
        } else {
          exportToJSON(filteredEvents, `eventos-${timestamp}`);
        }
      }

      // Gerar relatório em texto se solicitado
      if (exportFormat === 'txt') {
        generateTextReport();
      }

      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);

    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return <FileSpreadsheet className="h-4 w-4" />;
      case 'json':
        return <FileText className="h-4 w-4" />;
      case 'txt':
        return <FileText className="h-4 w-4" />;
      default:
        return <Download className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Exportar Dados Financeiros
        </CardTitle>
        <CardDescription>
          Exporte relatórios e dados financeiros em diferentes formatos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formato de Exportação */}
        <div className="space-y-2">
          <Label>Formato de Exportação</Label>
          <Select value={exportFormat} onValueChange={setExportFormat}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o formato" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  CSV (Excel)
                </div>
              </SelectItem>
              <SelectItem value="json">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  JSON
                </div>
              </SelectItem>
              <SelectItem value="txt">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Relatório em Texto
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div className="space-y-2">
          <Label>Período</Label>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 dias</SelectItem>
              <SelectItem value="30days">Últimos 30 dias</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
              <SelectItem value="custom">Período personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Datas personalizadas */}
        {dateRange === 'custom' && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? format(customStartDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customStartDate}
                    onSelect={setCustomStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? format(customEndDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={customEndDate}
                    onSelect={setCustomEndDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        )}

        {/* Dados para Exportar */}
        <div className="space-y-3">
          <Label>Dados para Exportar</Label>
          <div className="space-y-2">
            {Object.entries(selectedData).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) => 
                    setSelectedData(prev => ({ ...prev, [key]: checked }))
                  }
                />
                <Label htmlFor={key} className="text-sm font-normal capitalize">
                  {key === 'transactions' ? 'Transações Financeiras' :
                   key === 'summary' ? 'Resumo Financeiro' :
                   key === 'orders' ? 'Pedidos' :
                   key === 'suppliers' ? 'Fornecedores' :
                   key === 'events' ? 'Eventos' : key}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Status e Botão */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {exportStatus === 'success' && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Exportação concluída!</span>
              </div>
            )}
            {exportStatus === 'error' && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Erro na exportação</span>
              </div>
            )}
          </div>
          
          <Button 
            onClick={handleExport}
            disabled={isExporting || !Object.values(selectedData).some(v => v)}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isExporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Exportando...
              </>
            ) : (
              <>
                {getFormatIcon(exportFormat)}
                <span className="ml-2">Exportar</span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default FinancialExport;
