import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  BarChart3, 
  Users, 
  Package,
  ShoppingCart,
  DollarSign,
  Calendar,
  Filter,
  Settings,
  Share2,
  Clock,
  Mail,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  File,
  Image as ImageIcon,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReportConfig {
  name: string;
  type: 'sales' | 'customers' | 'products' | 'orders' | 'financial' | 'custom';
  format: 'csv' | 'excel' | 'pdf' | 'json';
  dateRange: {
    start: string;
    end: string;
  };
  filters: {
    status?: string[];
    category?: string[];
    minValue?: number;
    maxValue?: number;
  };
  fields: string[];
  includeCharts: boolean;
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    email?: string;
  };
}

interface ReportBuilderProps {
  onExport?: (config: ReportConfig) => void;
  onSchedule?: (config: ReportConfig) => void;
}

export default function ReportBuilder({ onExport, onSchedule }: ReportBuilderProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<ReportConfig>({
    name: '',
    type: 'sales',
    format: 'csv',
    dateRange: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    filters: {},
    fields: [],
    includeCharts: false,
    schedule: {
      enabled: false,
      frequency: 'weekly',
      time: '09:00',
      email: ''
    }
  });
  const [exporting, setExporting] = useState(false);

  const reportTypes = [
    { value: 'sales', label: 'Relatório de Vendas', icon: DollarSign, description: 'Vendas, receita e conversão' },
    { value: 'customers', label: 'Relatório de Clientes', icon: Users, description: 'Clientes, cadastros e atividade' },
    { value: 'products', label: 'Relatório de Produtos', icon: Package, description: 'Produtos, estoque e vendas' },
    { value: 'orders', label: 'Relatório de Pedidos', icon: ShoppingCart, description: 'Pedidos, status e entregas' },
    { value: 'financial', label: 'Relatório Financeiro', icon: BarChart3, description: 'Receitas, despesas e lucro' },
    { value: 'custom', label: 'Relatório Personalizado', icon: Settings, description: 'Configure seus próprios campos' }
  ];

  const formats = [
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet, description: 'Planilha Excel compatível' },
    { value: 'excel', label: 'Excel', icon: FileSpreadsheet, description: 'Formato .xlsx completo' },
    { value: 'pdf', label: 'PDF', icon: FileText, description: 'Documento para impressão' },
    { value: 'json', label: 'JSON', icon: File, description: 'Dados estruturados' }
  ];

  const availableFields: Record<string, string[]> = {
    sales: ['data', 'valor', 'quantidade', 'produto', 'cliente', 'categoria', 'status'],
    customers: ['nome', 'email', 'telefone', 'data_cadastro', 'total_pedidos', 'total_gasto', 'ultimo_pedido'],
    products: ['nome', 'categoria', 'preco', 'estoque', 'vendas', 'receita', 'avaliacao'],
    orders: ['id', 'cliente', 'data', 'valor', 'status', 'forma_pagamento', 'endereco'],
    financial: ['data', 'tipo', 'categoria', 'valor', 'descricao', 'status', 'forma_pagamento']
  };

  const handleExport = async () => {
    if (!config.name.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Digite um nome para o relatório',
        variant: 'destructive'
      });
      return;
    }

    setExporting(true);
    try {
      if (onExport) {
        await onExport(config);
      } else {
        // Exportação padrão
        await exportReport(config);
      }
      toast({
        title: 'Relatório exportado!',
        description: `Relatório "${config.name}" exportado com sucesso`
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao exportar',
        description: error.message || 'Não foi possível exportar o relatório',
        variant: 'destructive'
      });
    } finally {
      setExporting(false);
    }
  };

  const handleSchedule = async () => {
    if (!config.schedule?.email) {
      toast({
        title: 'E-mail obrigatório',
        description: 'Digite um e-mail para receber o relatório',
        variant: 'destructive'
      });
      return;
    }

    if (onSchedule) {
      await onSchedule(config);
      toast({
        title: 'Relatório agendado!',
        description: `Relatório será enviado para ${config.schedule?.email}`
      });
    }
  };

  const exportReport = async (reportConfig: ReportConfig) => {
    // Simular exportação
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Em produção, chamaria a API
    const filename = `${reportConfig.name}-${Date.now()}.${reportConfig.format}`;
    console.log('Exportando relatório:', filename, reportConfig);
  };

  const updateField = (field: keyof ReportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const toggleField = (field: string) => {
    setConfig(prev => ({
      ...prev,
      fields: prev.fields.includes(field)
        ? prev.fields.filter(f => f !== field)
        : [...prev.fields, field]
    }));
  };

  const currentFields = availableFields[config.type] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-orange-600" />
          Construtor de Relatórios
        </CardTitle>
        <CardDescription>
          Crie e exporte relatórios personalizados do seu negócio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="config" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="config">Configuração</TabsTrigger>
            <TabsTrigger value="filters">Filtros</TabsTrigger>
            <TabsTrigger value="schedule">Agendamento</TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4">
            {/* Nome do Relatório */}
            <div>
              <Label htmlFor="report-name">Nome do Relatório</Label>
              <Input
                id="report-name"
                placeholder="Ex: Relatório de Vendas - Janeiro 2025"
                value={config.name}
                onChange={(e) => updateField('name', e.target.value)}
              />
            </div>

            {/* Tipo de Relatório */}
            <div>
              <Label>Tipo de Relatório</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                {reportTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      onClick={() => updateField('type', type.value)}
                      className={cn(
                        "p-4 border rounded-lg text-left hover:bg-gray-50 transition-colors",
                        config.type === type.value && "border-orange-500 bg-orange-50"
                      )}
                    >
                      <Icon className="h-5 w-5 mb-2 text-orange-600" />
                      <p className="font-medium text-sm">{type.label}</p>
                      <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Formato */}
            <div>
              <Label>Formato de Exportação</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                {formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <button
                      key={format.value}
                      onClick={() => updateField('format', format.value)}
                      className={cn(
                        "p-3 border rounded-lg text-center hover:bg-gray-50 transition-colors",
                        config.format === format.value && "border-orange-500 bg-orange-50"
                      )}
                    >
                      <Icon className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                      <p className="font-medium text-xs">{format.label}</p>
                      <p className="text-xs text-gray-500">{format.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start-date">Data Inicial</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={config.dateRange.start}
                  onChange={(e) => updateField('dateRange', { ...config.dateRange, start: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end-date">Data Final</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={config.dateRange.end}
                  onChange={(e) => updateField('dateRange', { ...config.dateRange, end: e.target.value })}
                />
              </div>
            </div>

            {/* Campos */}
            {currentFields.length > 0 && (
              <div>
                <Label>Campos a Incluir</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {currentFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                      <Checkbox
                        id={`field-${field}`}
                        checked={config.fields.includes(field)}
                        onCheckedChange={() => toggleField(field)}
                      />
                      <Label
                        htmlFor={`field-${field}`}
                        className="text-sm cursor-pointer"
                      >
                        {field.replace('_', ' ')}
                      </Label>
                    </div>
                  ))}
                </div>
                {config.fields.length === 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Selecione pelo menos um campo para incluir no relatório
                  </p>
                )}
              </div>
            )}

            {/* Incluir Gráficos */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-charts"
                checked={config.includeCharts}
                onCheckedChange={(checked) => updateField('includeCharts', checked)}
              />
              <Label htmlFor="include-charts" className="cursor-pointer">
                Incluir gráficos e visualizações (apenas PDF)
              </Label>
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label>Filtros Adicionais</Label>
                <p className="text-xs text-gray-500 mb-3">
                  Adicione filtros para refinar os dados do relatório
                </p>
              </div>

              {/* Filtro de Status */}
              {config.type === 'orders' && (
                <div>
                  <Label>Status do Pedido</Label>
                  <Select
                    value={config.filters.status?.[0] || ''}
                    onValueChange={(value) => updateField('filters', { ...config.filters, status: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="processing">Processando</SelectItem>
                      <SelectItem value="shipped">Enviado</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Filtro de Valor */}
              {(config.type === 'sales' || config.type === 'financial') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="min-value">Valor Mínimo</Label>
                    <Input
                      id="min-value"
                      type="number"
                      placeholder="0.00"
                      value={config.filters.minValue || ''}
                      onChange={(e) => updateField('filters', { 
                        ...config.filters, 
                        minValue: parseFloat(e.target.value) || undefined 
                      })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max-value">Valor Máximo</Label>
                    <Input
                      id="max-value"
                      type="number"
                      placeholder="10000.00"
                      value={config.filters.maxValue || ''}
                      onChange={(e) => updateField('filters', { 
                        ...config.filters, 
                        maxValue: parseFloat(e.target.value) || undefined 
                      })}
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-schedule"
                  checked={config.schedule?.enabled || false}
                  onCheckedChange={(checked) => updateField('schedule', { 
                    ...config.schedule, 
                    enabled: checked 
                  })}
                />
                <Label htmlFor="enable-schedule" className="cursor-pointer">
                  Agendar envio automático
                </Label>
              </div>

              {config.schedule?.enabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="schedule-email">E-mail para Receber</Label>
                    <Input
                      id="schedule-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={config.schedule?.email || ''}
                      onChange={(e) => updateField('schedule', { 
                        ...config.schedule, 
                        email: e.target.value 
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Frequência</Label>
                      <Select
                        value={config.schedule?.frequency || 'weekly'}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => updateField('schedule', { 
                          ...config.schedule, 
                          frequency: value 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Diário</SelectItem>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="schedule-time">Horário</Label>
                      <Input
                        id="schedule-time"
                        type="time"
                        value={config.schedule?.time || '09:00'}
                        onChange={(e) => updateField('schedule', { 
                          ...config.schedule, 
                          time: e.target.value 
                        })}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Ações */}
        <div className="flex gap-3 mt-6 pt-4 border-t">
          <Button
            onClick={handleExport}
            disabled={exporting || !config.name.trim() || config.fields.length === 0}
            className="flex-1 bg-orange-600 hover:bg-orange-700"
          >
            {exporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </>
            )}
          </Button>
          
          {config.schedule?.enabled && (
            <Button
              variant="outline"
              onClick={handleSchedule}
              disabled={!config.schedule?.email}
            >
              <Clock className="h-4 w-4 mr-2" />
              Agendar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

