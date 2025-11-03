import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart, 
  BarChart, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  Target,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface FinancialData {
  totalEntradas: number;
  totalSaidas: number;
  saldoLiquido: number;
  transacoesPorMes: Array<{
    mes: string;
    entradas: number;
    saidas: number;
    saldo: number;
  }>;
  transacoesPorCategoria: Array<{
    categoria: string;
    valor: number;
    percentual: number;
    tipo: 'entrada' | 'saida';
  }>;
  transacoesRecentes: Array<{
    id: number;
    descricao: string;
    valor: number;
    tipo: string;
    data: string;
    status: string;
  }>;
  metas: {
    metaMensal: number;
    atingido: number;
    percentual: number;
  };
}

export default function AdvancedFinancialDashboard() {
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('30');
  const [filtroCategoria, setFiltroCategoria] = useState('todas');

  const carregarDados = async () => {
    try {
      setLoading(true);
      console.log('📊 Carregando dashboard avançado...');

      const response = await fetch('/api/financial/transactions');
      if (!response.ok) throw new Error('Erro ao carregar dados');

      const result = await response.json();
      const transacoes = result.transactions || [];

      // Calcular dados do dashboard
      const totalEntradas = transacoes
        .filter((t: any) => t.tipo === 'entrada')
        .reduce((sum: number, t: any) => sum + Number(t.valor), 0);

      const totalSaidas = transacoes
        .filter((t: any) => t.tipo === 'saida')
        .reduce((sum: number, t: any) => sum + Number(t.valor), 0);

      const saldoLiquido = totalEntradas - totalSaidas;

      // Agrupar por mês
      const transacoesPorMes = transacoes.reduce((acc: any, transacao: any) => {
        const mes = new Date(transacao.data).toLocaleDateString('pt-BR', { 
          month: 'short', 
          year: 'numeric' 
        });
        
        if (!acc[mes]) {
          acc[mes] = { mes, entradas: 0, saidas: 0, saldo: 0 };
        }
        
        if (transacao.tipo === 'entrada') {
          acc[mes].entradas += Number(transacao.valor);
        } else {
          acc[mes].saidas += Number(transacao.valor);
        }
        
        acc[mes].saldo = acc[mes].entradas - acc[mes].saidas;
        return acc;
      }, {});

      // Agrupar por categoria
      const transacoesPorCategoria = transacoes.reduce((acc: any, transacao: any) => {
        const categoria = transacao.categoria || 'Sem categoria';
        
        if (!acc[categoria]) {
          acc[categoria] = { categoria, valor: 0, tipo: transacao.tipo };
        }
        
        acc[categoria].valor += Number(transacao.valor);
        return acc;
      }, {});

      // Calcular percentuais
      Object.values(transacoesPorCategoria).forEach((cat: any) => {
        cat.percentual = ((cat.valor / (totalEntradas + totalSaidas)) * 100);
      });

      // Transações recentes
      const transacoesRecentes = transacoes
        .sort((a: any, b: any) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5);

      // Metas (simulado)
      const metaMensal = 10000;
      const atingido = totalEntradas;
      const percentual = (atingido / metaMensal) * 100;

      const dashboardData: FinancialData = {
        totalEntradas,
        totalSaidas,
        saldoLiquido,
        transacoesPorMes: Object.values(transacoesPorMes),
        transacoesPorCategoria: Object.values(transacoesPorCategoria),
        transacoesRecentes,
        metas: {
          metaMensal,
          atingido,
          percentual: Math.min(percentual, 100)
        }
      };

      setData(dashboardData);
      console.log('✅ Dashboard carregado:', dashboardData);

    } catch (error) {
      console.error('❌ Erro ao carregar dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const exportarRelatorio = () => {
    if (!data) return;
    
    const relatorio = {
      periodo: `${periodo} dias`,
      resumo: {
        totalEntradas: data.totalEntradas,
        totalSaidas: data.totalSaidas,
        saldoLiquido: data.saldoLiquido
      },
      transacoesPorMes: data.transacoesPorMes,
      transacoesPorCategoria: data.transacoesPorCategoria,
      geradoEm: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(relatorio, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  };

  useEffect(() => {
    carregarDados();
  }, [periodo, filtroCategoria]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2 text-gray-600">Carregando dashboard...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-600">Erro ao carregar dados do dashboard</p>
        <Button onClick={carregarDados} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">📊 Dashboard Financeiro Avançado</h2>
          <p className="text-gray-600">Análise completa e relatórios detalhados</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">7 dias</SelectItem>
              <SelectItem value="30">30 dias</SelectItem>
              <SelectItem value="90">90 dias</SelectItem>
              <SelectItem value="365">1 ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={carregarDados} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button onClick={exportarRelatorio} className="bg-blue-600 hover:bg-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Total Entradas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {data.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimos {periodo} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Total Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {data.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Últimos {periodo} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
              Saldo Líquido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${data.saldoLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {data.saldoLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Resultado líquido
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="h-4 w-4 mr-2 text-purple-600" />
              Meta Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.metas.percentual.toFixed(1)}%
            </div>
            <Progress value={data.metas.percentual} className="mt-2" />
            <p className="text-xs text-gray-500 mt-1">
              R$ {data.metas.atingido.toLocaleString('pt-BR')} / R$ {data.metas.metaMensal.toLocaleString('pt-BR')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transações por Mês */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Transações por Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.transacoesPorMes.slice(-6).map((mes, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{mes.mes}</span>
                    <span className={`text-sm font-bold ${mes.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {mes.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-green-600">
                      +R$ {mes.entradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-red-600">
                      -R$ {mes.saidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <Progress 
                    value={Math.abs(mes.saldo) / Math.max(mes.entradas, mes.saidas, 1) * 100} 
                    className="h-2"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Transações por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Transações por Categoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.transacoesPorCategoria
                .sort((a, b) => b.valor - a.valor)
                .slice(0, 8)
                .map((categoria, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${categoria.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm font-medium">{categoria.categoria}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${categoria.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {categoria.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {categoria.percentual.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Transações Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.transacoesRecentes.map((transacao) => (
              <div key={transacao.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${transacao.tipo === 'entrada' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium text-sm">{transacao.descricao}</div>
                    <div className="text-xs text-gray-500">{new Date(transacao.data).toLocaleDateString('pt-BR')}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                    {transacao.tipo === 'entrada' ? '+' : '-'}R$ {Number(transacao.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="flex items-center space-x-1">
                    {transacao.status === 'Pago' && <CheckCircle className="h-3 w-3 text-green-600" />}
                    {transacao.status === 'Pendente' && <Clock className="h-3 w-3 text-yellow-600" />}
                    {transacao.status === 'Atrasado' && <AlertCircle className="h-3 w-3 text-red-600" />}
                    <span className="text-xs text-gray-500">{transacao.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}