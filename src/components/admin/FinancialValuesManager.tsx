import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Edit, 
  Save, 
  RotateCcw,
  Calculator,
  Target,
  PieChart,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Loader2,
  History,
  Settings,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialValuesManagerProps {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    projectedBalance: number;
    revenueGrowth: number;
    expenseGrowth: number;
  };
  onUpdateValues: (values: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    projectedBalance: number;
  }) => Promise<void>;
  onResetToCalculated: () => Promise<void>;
}

interface FinancialValue {
  id: string;
  label: string;
  value: number;
  calculatedValue: number;
  isOverridden: boolean;
  lastModified: string;
  modifiedBy: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  growth?: number;
}

export const FinancialValuesManager: React.FC<FinancialValuesManagerProps> = ({
  summary,
  onUpdateValues,
  onResetToCalculated
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [editingValue, setEditingValue] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  // Valores financeiros gerenciáveis
  const [financialValues, setFinancialValues] = useState<FinancialValue[]>([
    {
      id: 'revenue',
      label: 'Receita Total',
      value: summary.totalRevenue,
      calculatedValue: summary.totalRevenue,
      isOverridden: false,
      lastModified: new Date().toISOString(),
      modifiedBy: 'Sistema',
      description: 'Total de receitas provenientes de vendas e eventos',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-green-600',
      growth: summary.revenueGrowth
    },
    {
      id: 'expenses',
      label: 'Despesas Totais',
      value: summary.totalExpenses,
      calculatedValue: summary.totalExpenses,
      isOverridden: false,
      lastModified: new Date().toISOString(),
      modifiedBy: 'Sistema',
      description: 'Total de despesas com fornecedores e operacionais',
      icon: <TrendingDown className="h-5 w-5" />,
      color: 'text-red-600',
      growth: summary.expenseGrowth
    },
    {
      id: 'profit',
      label: 'Lucro Líquido',
      value: summary.netProfit,
      calculatedValue: summary.netProfit,
      isOverridden: false,
      lastModified: new Date().toISOString(),
      modifiedBy: 'Sistema',
      description: 'Resultado líquido (Receita - Despesas)',
      icon: <Target className="h-5 w-5" />,
      color: summary.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
    },
    {
      id: 'balance',
      label: 'Balanço Projetado',
      value: summary.projectedBalance,
      calculatedValue: summary.projectedBalance,
      isOverridden: false,
      lastModified: new Date().toISOString(),
      modifiedBy: 'Sistema',
      description: 'Projeção de balanço baseada em tendências atuais',
      icon: <PieChart className="h-5 w-5" />,
      color: 'text-orange-600'
    }
  ]);

  // Atualizar valores quando summary mudar
  useEffect(() => {
    setFinancialValues(prev => prev.map(item => ({
      ...item,
      calculatedValue: item.id === 'revenue' ? summary.totalRevenue :
                      item.id === 'expenses' ? summary.totalExpenses :
                      item.id === 'profit' ? summary.netProfit :
                      summary.projectedBalance,
      value: item.isOverridden ? item.value : (
        item.id === 'revenue' ? summary.totalRevenue :
        item.id === 'expenses' ? summary.totalExpenses :
        item.id === 'profit' ? summary.netProfit :
        summary.projectedBalance
      )
    })));
  }, [summary]);

  const handleEdit = (valueId: string) => {
    const value = financialValues.find(v => v.id === valueId);
    if (value) {
      setEditingValue(valueId);
      setEditValues({
        [valueId]: value.value.toString()
      });
    }
  };

  const handleSave = async (valueId: string) => {
    const newValue = parseFloat(editValues[valueId]);
    
    if (isNaN(newValue) || newValue < 0) {
      toast.error('Valor deve ser um número positivo');
      return;
    }

    setLoading(true);
    try {
      const updatedValues = financialValues.map(v => 
        v.id === valueId 
          ? { 
              ...v, 
              value: newValue, 
              isOverridden: true,
              lastModified: new Date().toISOString(),
              modifiedBy: 'Usuário'
            }
          : v
      );

      setFinancialValues(updatedValues);

      // Atualizar valores no sistema
      const revenue = updatedValues.find(v => v.id === 'revenue')?.value || 0;
      const expenses = updatedValues.find(v => v.id === 'expenses')?.value || 0;
      const profit = updatedValues.find(v => v.id === 'profit')?.value || 0;
      const balance = updatedValues.find(v => v.id === 'balance')?.value || 0;

      await onUpdateValues({
        totalRevenue: revenue,
        totalExpenses: expenses,
        netProfit: profit,
        projectedBalance: balance
      });

      // Adicionar ao histórico
      setHistory(prev => [{
        id: Date.now().toString(),
        action: 'edit',
        valueId,
        oldValue: financialValues.find(v => v.id === valueId)?.value || 0,
        newValue,
        timestamp: new Date().toISOString(),
        user: 'Usuário'
      }, ...prev.slice(0, 49)]); // Manter apenas 50 registros

      setEditingValue(null);
      toast.success('Valor atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar valor:', error);
      toast.error('Erro ao salvar valor');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    try {
      await onResetToCalculated();
      
      setFinancialValues(prev => prev.map(v => ({
        ...v,
        value: v.calculatedValue,
        isOverridden: false,
        lastModified: new Date().toISOString(),
        modifiedBy: 'Sistema'
      })));

      setHistory(prev => [{
        id: Date.now().toString(),
        action: 'reset',
        timestamp: new Date().toISOString(),
        user: 'Sistema'
      }, ...prev.slice(0, 49)]);

      toast.success('Valores resetados para os calculados automaticamente!');
    } catch (error) {
      console.error('Erro ao resetar valores:', error);
      toast.error('Erro ao resetar valores');
    } finally {
      setLoading(false);
      setShowResetDialog(false);
    }
  };

  const handleAutoCalculate = () => {
    const revenue = financialValues.find(v => v.id === 'revenue')?.value || 0;
    const expenses = financialValues.find(v => v.id === 'expenses')?.value || 0;
    const profit = revenue - expenses;
    const balance = profit * 1.2;

    setFinancialValues(prev => prev.map(v => 
      v.id === 'profit' ? { ...v, value: profit, isOverridden: true } :
      v.id === 'balance' ? { ...v, value: balance, isOverridden: true } :
      v
    ));

    toast.success('Lucro e Balanço calculados automaticamente!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getValueCard = (value: FinancialValue) => (
    <Card key={value.id} className={`border-l-4 ${value.isOverridden ? 'border-l-orange-500 bg-orange-50' : 'border-l-gray-300'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${value.isOverridden ? 'bg-orange-100' : 'bg-gray-100'}`}>
            {value.icon}
          </div>
          <div>
            <CardTitle className="text-sm font-medium">{value.label}</CardTitle>
            <CardDescription className="text-xs">{value.description}</CardDescription>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {value.isOverridden && (
            <Badge variant="secondary" className="text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Editado
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(value.id)}
            disabled={loading}
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold">
              {editingValue === value.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editValues[value.id] || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, [value.id]: e.target.value }))}
                    className="w-32 text-lg font-bold"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleSave(value.id)}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <span className={value.color}>
                  {formatCurrency(value.value)}
                </span>
              )}
            </span>
            {value.growth !== undefined && (
              <div className={`flex items-center text-xs ${value.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {value.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {value.growth >= 0 ? '+' : ''}{value.growth.toFixed(1)}%
              </div>
            )}
          </div>
          
          {value.isOverridden && (
            <div className="text-xs text-gray-600">
              <p>Valor calculado: {formatCurrency(value.calculatedValue)}</p>
              <p>Modificado em: {format(new Date(value.lastModified), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Gestão de Valores Financeiros
              </CardTitle>
              <CardDescription>
                Gerencie diretamente os valores de receita, despesas, lucro e balanço
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowValues(!showValues)}
                size="sm"
              >
                {showValues ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showValues ? 'Ocultar' : 'Mostrar'} Valores
              </Button>
              <Button
                variant="outline"
                onClick={handleAutoCalculate}
                size="sm"
                disabled={loading}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Auto Calcular
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                size="sm"
                disabled={loading}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Resetar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Alertas */}
      {financialValues.some(v => v.isOverridden) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Alguns valores foram editados manualmente. Use "Resetar" para voltar aos valores calculados automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Valores Financeiros */}
      {showValues && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {financialValues.map(getValueCard)}
        </div>
      )}

      {/* Abas de Gestão */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">📊 Visão Geral</TabsTrigger>
          <TabsTrigger value="history">📝 Histórico</TabsTrigger>
          <TabsTrigger value="settings">⚙️ Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Resumo de Alterações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valores editados:</span>
                  <Badge variant="secondary">
                    {financialValues.filter(v => v.isOverridden).length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Valores calculados:</span>
                  <Badge variant="outline">
                    {financialValues.filter(v => !v.isOverridden).length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Última modificação:</span>
                  <span className="text-sm font-medium">
                    {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Indicadores
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Margem de lucro:</span>
                  <span className="font-semibold">
                    {financialValues.find(v => v.id === 'revenue')?.value > 0 
                      ? ((financialValues.find(v => v.id === 'profit')?.value || 0) / (financialValues.find(v => v.id === 'revenue')?.value || 1) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Relação despesa/receita:</span>
                  <span className="font-semibold">
                    {financialValues.find(v => v.id === 'revenue')?.value > 0 
                      ? ((financialValues.find(v => v.id === 'expenses')?.value || 0) / (financialValues.find(v => v.id === 'revenue')?.value || 1) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status financeiro:</span>
                  <Badge className={
                    (financialValues.find(v => v.id === 'profit')?.value || 0) >= 0 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }>
                    {(financialValues.find(v => v.id === 'profit')?.value || 0) >= 0 ? 'Positivo' : 'Negativo'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <History className="h-5 w-5" />
                Histórico de Alterações
              </CardTitle>
              <CardDescription>
                Últimas modificações nos valores financeiros
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhuma alteração registrada</p>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <p className="font-medium">
                          {item.action === 'edit' ? 'Valor editado' : 'Valores resetados'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(item.timestamp), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.user}</p>
                        {item.action === 'edit' && (
                          <p className="text-xs text-gray-600">
                            {formatCurrency(item.oldValue)} → {formatCurrency(item.newValue)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações de Gestão
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Auto-cálculo de Lucro e Balanço</Label>
                <p className="text-sm text-gray-600">
                  Quando ativado, o lucro e balanço são calculados automaticamente baseados na receita e despesas.
                </p>
                <Button variant="outline" onClick={handleAutoCalculate}>
                  <Calculator className="h-4 w-4 mr-2" />
                  Executar Auto-cálculo Agora
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>Resetar para Valores Calculados</Label>
                <p className="text-sm text-gray-600">
                  Volta todos os valores para os calculados automaticamente pelo sistema.
                </p>
                <Button variant="outline" onClick={() => setShowResetDialog(true)}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar Valores
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Confirmação de Reset */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reset dos Valores</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Tem certeza que deseja resetar todos os valores para os calculados automaticamente?
            </p>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Esta ação irá sobrescrever todas as edições manuais e voltar aos valores baseados nos dados reais do sistema.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReset}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />}
              Resetar Valores
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
