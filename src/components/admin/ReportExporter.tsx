import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Package,
  Calendar,
  CheckCircle
} from 'lucide-react';

interface ReportExporterProps {
  onExport: (type: string, format: string, period: string) => void;
  loading?: boolean;
}

const ReportExporter: React.FC<ReportExporterProps> = ({ onExport, loading = false }) => {
  const [reportType, setReportType] = useState('sales');
  const [format, setFormat] = useState('csv');
  const [period, setPeriod] = useState('30d');
  const [customDate, setCustomDate] = useState('');

  const reportTypes = [
    { value: 'sales', label: 'Relatório de Vendas', icon: BarChart3 },
    { value: 'customers', label: 'Relatório de Clientes', icon: Users },
    { value: 'products', label: 'Relatório de Produtos', icon: Package },
    { value: 'dashboard', label: 'Dashboard Completo', icon: FileText }
  ];

  const formats = [
    { value: 'csv', label: 'CSV', description: 'Planilha Excel' },
    { value: 'json', label: 'JSON', description: 'Dados estruturados' },
    { value: 'pdf', label: 'PDF', description: 'Documento impresso' }
  ];

  const periods = [
    { value: '7d', label: 'Últimos 7 dias' },
    { value: '30d', label: 'Últimos 30 dias' },
    { value: '90d', label: 'Últimos 90 dias' },
    { value: '1y', label: 'Último ano' },
    { value: 'custom', label: 'Período personalizado' }
  ];

  const handleExport = () => {
    const selectedPeriod = period === 'custom' ? customDate : period;
    onExport(reportType, format, selectedPeriod);
  };

  const selectedReport = reportTypes.find(r => r.value === reportType);
  const selectedFormat = formats.find(f => f.value === format);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="w-5 h-5 mr-2" />
          Exportar Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tipo de Relatório */}
        <div>
          <Label htmlFor="report-type">Tipo de Relatório</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      {type.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        {/* Formato */}
        <div>
          <Label htmlFor="format">Formato</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((fmt) => (
                <SelectItem key={fmt.value} value={fmt.value}>
                  <div>
                    <div className="font-medium">{fmt.label}</div>
                    <div className="text-sm text-gray-500">{fmt.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Período */}
        <div>
          <Label htmlFor="period">Período</Label>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {periods.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data personalizada */}
        {period === 'custom' && (
          <div>
            <Label htmlFor="custom-date">Data (YYYY-MM-DD)</Label>
            <Input
              id="custom-date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              placeholder="Selecione a data"
            />
          </div>
        )}

        {/* Resumo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Resumo do Relatório</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              <span><strong>Tipo:</strong> {selectedReport?.label}</span>
            </div>
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              <span><strong>Período:</strong> {periods.find(p => p.value === period)?.label}</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span><strong>Formato:</strong> {selectedFormat?.label}</span>
            </div>
          </div>
        </div>

        {/* Botão de Exportar */}
        <Button 
          onClick={handleExport} 
          disabled={loading || (period === 'custom' && !customDate)}
          className="w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Gerando Relatório...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório
            </>
          )}
        </Button>

        {/* Dicas */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>CSV:</strong> Ideal para análise em Excel</p>
          <p>💡 <strong>JSON:</strong> Para integração com outros sistemas</p>
          <p>💡 <strong>PDF:</strong> Para apresentações e impressão</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportExporter;
