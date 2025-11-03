import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Filter,
  CheckCircle,
  Loader2,
  File,
  BarChart
} from 'lucide-react';
import { toast } from 'sonner';

interface AdvancedReportExporterProps {
  transactions?: any[];
  summary?: any;
  suppliers?: any[];
  events?: any[];
}

export const AdvancedReportExporter: React.FC<AdvancedReportExporterProps> = ({
  transactions = [],
  summary = {},
  suppliers = [],
  events = []
}) => {
  const [reportType, setReportType] = useState<'full' | 'summary' | 'custom'>('full');
  const [exportFormat, setExportFormat] = useState<'excel' | 'pdf' | 'csv'>('excel');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [selectedFields, setSelectedFields] = useState({
    transactions: true,
    summary: true,
    suppliers: false,
    events: false,
    charts: false
  });
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);

    try {
      // Filtrar transações por data
      const filteredTransactions = transactions.filter(t => {
        const tDate = new Date(t.data || t.date);
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        return tDate >= start && tDate <= end;
      });

      // Preparar dados para exportação
      const exportData = {
        dateRange,
        reportType,
        summary,
        transactions: selectedFields.transactions ? filteredTransactions : [],
        suppliers: selectedFields.suppliers ? suppliers : [],
        events: selectedFields.events ? events : [],
        generatedAt: new Date().toISOString()
      };

      if (exportFormat === 'excel') {
        await exportToExcel(exportData);
      } else if (exportFormat === 'pdf') {
        await exportToPDF(exportData);
      } else {
        await exportToCSV(exportData);
      }

      toast.success(`Relatório exportado com sucesso em ${exportFormat.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setExporting(false);
    }
  };

  const exportToExcel = async (data: any) => {
    // Simular exportação Excel
    const csvContent = generateCSV(data);
    downloadFile(csvContent, `relatorio-financeiro-${Date.now()}.csv`, 'text/csv');
  };

  const exportToPDF = async (data: any) => {
    // Simular exportação PDF
    toast.info('Exportação PDF em desenvolvimento. Gerando CSV...');
    await exportToExcel(data);
  };

  const exportToCSV = async (data: any) => {
    const csvContent = generateCSV(data);
    downloadFile(csvContent, `relatorio-financeiro-${Date.now()}.csv`, 'text/csv');
  };

  const generateCSV = (data: any) => {
    let csv = 'RELATÓRIO FINANCEIRO\n\n';
    csv += `Período: ${new Date(data.dateRange.start).toLocaleDateString('pt-BR')} a ${new Date(data.dateRange.end).toLocaleDateString('pt-BR')}\n`;
    csv += `Gerado em: ${new Date(data.generatedAt).toLocaleString('pt-BR')}\n\n`;

    if (data.summary) {
      csv += 'RESUMO FINANCEIRO\n';
      csv += `Receita Total,R$ ${(data.summary.totalRevenue || 0).toFixed(2)}\n`;
      csv += `Despesas Totais,R$ ${(data.summary.totalExpenses || 0).toFixed(2)}\n`;
      csv += `Lucro Líquido,R$ ${(data.summary.netProfit || 0).toFixed(2)}\n\n`;
    }

    if (data.transactions && data.transactions.length > 0) {
      csv += 'TRANSAÇÕES\n';
      csv += 'Data,Descrição,Categoria,Tipo,Valor,Status,Forma Pagamento\n';
      data.transactions.forEach((t: any) => {
        csv += `${new Date(t.data || t.date).toLocaleDateString('pt-BR')},${t.descricao || t.description},${t.categoria || t.category},${t.tipo || t.type},R$ ${(t.valor || t.amount).toFixed(2)},${t.status},${t.forma_pagamento || t.payment_method || '-'}\n`;
      });
    }

    return csv;
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Download className="h-6 w-6 text-blue-600" />
          Exportar Relatórios
        </h2>
        <p className="text-muted-foreground">
          Gere relatórios financeiros em diversos formatos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações de Exportação */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Relatório</CardTitle>
            <CardDescription>Personalize o conteúdo e formato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Relatório */}
            <div className="space-y-2">
              <Label>Tipo de Relatório</Label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => setReportType('full')}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    reportType === 'full' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium">Completo</p>
                  <p className="text-xs text-muted-foreground">Todos os dados e seções</p>
                </button>
                <button
                  onClick={() => setReportType('summary')}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    reportType === 'summary' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium">Resumo Executivo</p>
                  <p className="text-xs text-muted-foreground">Apenas totais e KPIs principais</p>
                </button>
                <button
                  onClick={() => setReportType('custom')}
                  className={`p-3 rounded-lg border-2 transition-all text-left ${
                    reportType === 'custom' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <p className="font-medium">Personalizado</p>
                  <p className="text-xs text-muted-foreground">Selecione as seções desejadas</p>
                </button>
              </div>
            </div>

            {/* Período */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Período
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                />
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                />
              </div>
            </div>

            {/* Campos Personalizados */}
            {reportType === 'custom' && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Seções do Relatório
                </Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="transactions"
                      checked={selectedFields.transactions}
                      onCheckedChange={(checked) => 
                        setSelectedFields({ ...selectedFields, transactions: checked as boolean })
                      }
                    />
                    <label htmlFor="transactions" className="text-sm cursor-pointer">
                      Transações Detalhadas
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="summary"
                      checked={selectedFields.summary}
                      onCheckedChange={(checked) => 
                        setSelectedFields({ ...selectedFields, summary: checked as boolean })
                      }
                    />
                    <label htmlFor="summary" className="text-sm cursor-pointer">
                      Resumo Financeiro
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="suppliers"
                      checked={selectedFields.suppliers}
                      onCheckedChange={(checked) => 
                        setSelectedFields({ ...selectedFields, suppliers: checked as boolean })
                      }
                    />
                    <label htmlFor="suppliers" className="text-sm cursor-pointer">
                      Fornecedores
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="events"
                      checked={selectedFields.events}
                      onCheckedChange={(checked) => 
                        setSelectedFields({ ...selectedFields, events: checked as boolean })
                      }
                    />
                    <label htmlFor="events" className="text-sm cursor-pointer">
                      Eventos
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="charts"
                      checked={selectedFields.charts}
                      onCheckedChange={(checked) => 
                        setSelectedFields({ ...selectedFields, charts: checked as boolean })
                      }
                    />
                    <label htmlFor="charts" className="text-sm cursor-pointer">
                      Gráficos e Análises
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Formato de Exportação */}
            <div className="space-y-2">
              <Label>Formato de Exportação</Label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setExportFormat('excel')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    exportFormat === 'excel' ? 'border-green-600 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <FileSpreadsheet className={`h-6 w-6 mx-auto mb-1 ${exportFormat === 'excel' ? 'text-green-600' : 'text-gray-400'}`} />
                  <p className="text-xs font-medium">Excel</p>
                </button>
                <button
                  onClick={() => setExportFormat('pdf')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    exportFormat === 'pdf' ? 'border-red-600 bg-red-50' : 'border-gray-200'
                  }`}
                >
                  <FileText className={`h-6 w-6 mx-auto mb-1 ${exportFormat === 'pdf' ? 'text-red-600' : 'text-gray-400'}`} />
                  <p className="text-xs font-medium">PDF</p>
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    exportFormat === 'csv' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <File className={`h-6 w-6 mx-auto mb-1 ${exportFormat === 'csv' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <p className="text-xs font-medium">CSV</p>
                </button>
              </div>
            </div>

            {/* Botão de Exportar */}
            <Button
              onClick={handleExport}
              disabled={exporting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              {exporting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-5 w-5 mr-2" />
                  Exportar Relatório
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preview do Relatório */}
        <Card>
          <CardHeader>
            <CardTitle>Preview do Relatório</CardTitle>
            <CardDescription>
              Visualize o que será incluído no relatório
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informações do Relatório */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Período:</span>
                <span className="font-medium">
                  {new Date(dateRange.start).toLocaleDateString('pt-BR')} - {new Date(dateRange.end).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Formato:</span>
                <Badge>{exportFormat.toUpperCase()}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <span className="font-medium">
                  {reportType === 'full' ? 'Completo' : reportType === 'summary' ? 'Resumo' : 'Personalizado'}
                </span>
              </div>
            </div>

            {/* Conteúdo Incluído */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                Conteúdo Incluído
              </h4>
              <div className="space-y-2">
                {(reportType === 'full' || selectedFields.summary) && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-blue-600 rounded-full" />
                    <span>Resumo Financeiro (Receitas, Despesas, Lucro)</span>
                  </div>
                )}
                {(reportType === 'full' || selectedFields.transactions) && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-600 rounded-full" />
                    <span>
                      {transactions.filter(t => {
                        const tDate = new Date(t.data || t.date);
                        const start = new Date(dateRange.start);
                        const end = new Date(dateRange.end);
                        return tDate >= start && tDate <= end;
                      }).length} Transações
                    </span>
                  </div>
                )}
                {selectedFields.suppliers && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                    <span>{suppliers.length} Fornecedores</span>
                  </div>
                )}
                {selectedFields.events && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-orange-600 rounded-full" />
                    <span>{events.length} Eventos</span>
                  </div>
                )}
              </div>
            </div>

            {/* Estatísticas Rápidas */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Estatísticas do Período</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-lg font-bold text-green-600">
                    R$ {(summary.totalRevenue || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="text-lg font-bold text-red-600">
                    R$ {(summary.totalExpenses || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg col-span-2">
                  <p className="text-xs text-muted-foreground">Lucro Líquido</p>
                  <p className="text-lg font-bold text-blue-600">
                    R$ {(summary.netProfit || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Rápidos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Templates Rápidos</CardTitle>
          <CardDescription>Exportações pré-configuradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button variant="outline" className="justify-start">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              DRE Mensal
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart className="h-4 w-4 mr-2" />
              Análise por Categoria
            </Button>
            <Button variant="outline" className="justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Fluxo de Caixa
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedReportExporter;

