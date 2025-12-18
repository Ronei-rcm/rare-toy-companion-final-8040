import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart,
  Calendar,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Target
} from 'lucide-react';
import { toast } from 'sonner';
import LoadingState from '@/components/admin/LoadingState';
import MetricCard from '@/components/admin/MetricCard';

interface PLReport {
  periodo: { start_date: string; end_date: string };
  receitas: Array<{ categoria: string; total: number; quantidade: number }>;
  despesas: Array<{ categoria: string; total: number; quantidade: number }>;
  totais: {
    total_receitas: number;
    total_despesas: number;
    lucro_liquido: number;
    margem_lucro: string;
  };
}

interface DREReport {
  periodo: { start_date: string; end_date: string };
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  cmv: number;
  lucro_bruto: number;
  despesas_operacionais: {
    detalhado: Array<{ categoria: string; total: number }>;
    total: number;
  };
  lucro_operacional: number;
  resultado_nao_operacional: {
    receitas: number;
    despesas: number;
    resultado: number;
  };
  lucro_antes_ir: number;
  impostos: {
    ir: number;
    csll: number;
    total: number;
  };
  lucro_liquido: number;
  indicadores: {
    margem_bruta: string;
    margem_operacional: string;
    margem_liquida: string;
  };
}

export default function ExecutiveReports() {
  const [activeTab, setActiveTab] = useState('pl');
  const [loading, setLoading] = useState(false);
  
  // Filtros de período
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  // Dados dos relatórios
  const [plData, setPlData] = useState<PLReport | null>(null);
  const [dreData, setDreData] = useState<DREReport | null>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [comparativeData, setComparativeData] = useState<any>(null);

  const loadPLReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/financial/reports/pl?start_date=${startDate}&end_date=${endDate}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao carregar relatório P&L');
      const data = await response.json();
      setPlData(data);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar relatório P&L');
    } finally {
      setLoading(false);
    }
  };

  const loadDREReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/financial/reports/dre?start_date=${startDate}&end_date=${endDate}`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao carregar relatório DRE');
      const data = await response.json();
      setDreData(data);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar relatório DRE');
    } finally {
      setLoading(false);
    }
  };

  const loadTrendsReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/financial/reports/trends?months=12`,
        { credentials: 'include' }
      );
      if (!response.ok) throw new Error('Erro ao carregar análise de tendências');
      const data = await response.json();
      setTrendsData(data);
    } catch (error: any) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar análise de tendências');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'pl') loadPLReport();
    else if (activeTab === 'dre') loadDREReport();
    else if (activeTab === 'trends') loadTrendsReport();
  }, [activeTab, startDate, endDate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6 pt-4">
      {/* Header */}
      <div className="flex justify-between items-center pt-4">
        <div>
          <h2 className="text-2xl font-bold">📊 Relatórios Executivos</h2>
          <p className="text-gray-600">Análises financeiras detalhadas e insights estratégicos</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-2 items-center">
            <Label htmlFor="start_date" className="text-sm">De:</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="flex gap-2 items-center">
            <Label htmlFor="end_date" className="text-sm">Até:</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button onClick={() => {
            if (activeTab === 'pl') loadPLReport();
            else if (activeTab === 'dre') loadDREReport();
            else if (activeTab === 'trends') loadTrendsReport();
          }} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pl">
            <FileText className="h-4 w-4 mr-2" />
            P&L
          </TabsTrigger>
          <TabsTrigger value="dre">
            <BarChart className="h-4 w-4 mr-2" />
            DRE
          </TabsTrigger>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" />
            Tendências
          </TabsTrigger>
          <TabsTrigger value="comparative">
            <Calendar className="h-4 w-4 mr-2" />
            Comparativo
          </TabsTrigger>
        </TabsList>

        {/* Relatório P&L */}
        <TabsContent value="pl" className="space-y-6">
          {loading ? (
            <LoadingState message="Carregando relatório P&L..." />
          ) : plData ? (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                  title="Receitas Totais"
                  value={plData.totais.total_receitas}
                  format="currency"
                  color="green"
                  icon={<TrendingUp className="h-5 w-5" />}
                />
                <MetricCard
                  title="Despesas Totais"
                  value={plData.totais.total_despesas}
                  format="currency"
                  color="red"
                  icon={<TrendingDown className="h-5 w-5" />}
                />
                <MetricCard
                  title="Lucro Líquido"
                  value={plData.totais.lucro_liquido}
                  format="currency"
                  color={plData.totais.lucro_liquido >= 0 ? 'green' : 'red'}
                  icon={<DollarSign className="h-5 w-5" />}
                />
                <Card className="min-h-[140px] hover:shadow-lg transition-all border-l-4 border-l-purple-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-gray-600">
                        Margem de Lucro
                      </CardTitle>
                      <div className="p-2 bg-purple-100 rounded-full">
                        <Target className="h-5 w-5 text-purple-600" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-600">
                      {plData.totais.margem_lucro}%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Receitas por Categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Receitas por Categoria</CardTitle>
                  <CardDescription>Período: {formatDate(plData.periodo.start_date)} a {formatDate(plData.periodo.end_date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plData.receitas.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right font-semibold text-green-600">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            {plData.totais.total_receitas > 0 
                              ? ((item.total / plData.totais.total_receitas) * 100).toFixed(2)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Despesas por Categoria */}
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription>Período: {formatDate(plData.periodo.start_date)} a {formatDate(plData.periodo.end_date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Quantidade</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">% do Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plData.despesas.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.categoria}</TableCell>
                          <TableCell className="text-right">{item.quantidade}</TableCell>
                          <TableCell className="text-right font-semibold text-red-600">
                            {formatCurrency(item.total)}
                          </TableCell>
                          <TableCell className="text-right">
                            {plData.totais.total_despesas > 0 
                              ? ((item.total / plData.totais.total_despesas) * 100).toFixed(2)
                              : 0}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Relatório DRE */}
        <TabsContent value="dre" className="space-y-6">
          {loading ? (
            <LoadingState message="Carregando relatório DRE..." />
          ) : dreData ? (
            <>
              {/* Indicadores Principais */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Margem Bruta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dreData.indicadores.margem_bruta}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Margem Operacional</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dreData.indicadores.margem_operacional}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Margem Líquida</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{dreData.indicadores.margem_liquida}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Lucro Líquido</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${dreData.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(dreData.lucro_liquido)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* DRE Detalhada */}
              <Card>
                <CardHeader>
                  <CardTitle>Demonstração do Resultado do Exercício</CardTitle>
                  <CardDescription>Período: {formatDate(dreData.periodo.start_date)} a {formatDate(dreData.periodo.end_date)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="font-semibold">Receita Bruta</span>
                      <span className="font-semibold text-green-600">{formatCurrency(dreData.receita_bruta)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 ml-4">(-) Deduções</span>
                      <span className="text-red-600">{formatCurrency(dreData.deducoes)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-semibold">Receita Líquida</span>
                      <span className="font-semibold text-green-600">{formatCurrency(dreData.receita_liquida)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 ml-4">(-) CMV (Custo das Mercadorias Vendidas)</span>
                      <span className="text-red-600">{formatCurrency(dreData.cmv)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-semibold">Lucro Bruto</span>
                      <span className={`font-semibold ${dreData.lucro_bruto >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(dreData.lucro_bruto)}
                      </span>
                    </div>
                    <div className="py-2 border-b">
                      <div className="font-semibold mb-2">(-) Despesas Operacionais</div>
                      {dreData.despesas_operacionais.detalhado.map((desp, index) => (
                        <div key={index} className="flex justify-between items-center py-1 ml-4 text-sm text-gray-600">
                          <span>{desp.categoria}</span>
                          <span className="text-red-600">{formatCurrency(desp.total)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center py-2 mt-2 border-t">
                        <span className="font-semibold">Total Despesas Operacionais</span>
                        <span className="font-semibold text-red-600">{formatCurrency(dreData.despesas_operacionais.total)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-semibold">Lucro Operacional</span>
                      <span className={`font-semibold ${dreData.lucro_operacional >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(dreData.lucro_operacional)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 ml-4">(+) Receitas Não Operacionais</span>
                      <span className="text-green-600">{formatCurrency(dreData.resultado_nao_operacional.receitas)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 ml-4">(-) Despesas Não Operacionais</span>
                      <span className="text-red-600">{formatCurrency(dreData.resultado_nao_operacional.despesas)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-300">
                      <span className="font-semibold">Lucro Antes do IR</span>
                      <span className={`font-semibold ${dreData.lucro_antes_ir >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(dreData.lucro_antes_ir)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 ml-4">(-) IR (15%)</span>
                      <span className="text-red-600">{formatCurrency(dreData.impostos.ir)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b">
                      <span className="text-gray-600 ml-4">(-) CSLL (9%)</span>
                      <span className="text-red-600">{formatCurrency(dreData.impostos.csll)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b-2 border-gray-400">
                      <span className="text-lg font-bold">Lucro Líquido</span>
                      <span className={`text-lg font-bold ${dreData.lucro_liquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(dreData.lucro_liquido)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado disponível para o período selecionado
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Análise de Tendências */}
        <TabsContent value="trends" className="space-y-6">
          {loading ? (
            <LoadingState message="Carregando análise de tendências..." />
          ) : trendsData ? (
            <>
              {/* Resumo de Crescimento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Crescimento Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold flex items-center ${
                      parseFloat(trendsData.crescimento.receitas) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {parseFloat(trendsData.crescimento.receitas) >= 0 ? (
                        <TrendingUp className="h-5 w-5 mr-2" />
                      ) : (
                        <TrendingDown className="h-5 w-5 mr-2" />
                      )}
                      {trendsData.crescimento.receitas}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Crescimento Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold flex items-center ${
                      parseFloat(trendsData.crescimento.despesas) >= 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {parseFloat(trendsData.crescimento.despesas) >= 0 ? (
                        <TrendingUp className="h-5 w-5 mr-2" />
                      ) : (
                        <TrendingDown className="h-5 w-5 mr-2" />
                      )}
                      {trendsData.crescimento.despesas}%
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">Média Mensal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(trendsData.medias.saldo)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      Saldo médio nos últimos {trendsData.periodo.meses} meses
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dados Mensais */}
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal</CardTitle>
                  <CardDescription>Últimos {trendsData.periodo.meses} meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês</TableHead>
                        <TableHead className="text-right">Receitas</TableHead>
                        <TableHead className="text-right">Despesas</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                        <TableHead className="text-right">Tendência</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {trendsData.dados_mensais.map((mes: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{mes.mes_formatado}</TableCell>
                          <TableCell className="text-right text-green-600 font-semibold">
                            {formatCurrency(mes.receitas)}
                          </TableCell>
                          <TableCell className="text-right text-red-600 font-semibold">
                            {formatCurrency(mes.despesas)}
                          </TableCell>
                          <TableCell className={`text-right font-semibold ${
                            mes.saldo >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(mes.saldo)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={
                              mes.tendencia_receitas === 'alta' ? 'default' :
                              mes.tendencia_receitas === 'baixa' ? 'destructive' : 'secondary'
                            }>
                              {mes.tendencia_receitas === 'alta' ? '↑ Alta' :
                               mes.tendencia_receitas === 'baixa' ? '↓ Baixa' : '→ Estável'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8 text-gray-500">
                  Nenhum dado disponível
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Comparativo */}
        <TabsContent value="comparative" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparativo Período a Período</CardTitle>
              <CardDescription>Compare dois períodos diferentes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Funcionalidade em desenvolvimento
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

