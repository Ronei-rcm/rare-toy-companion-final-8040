import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, RefreshCw, Target, Trophy, TrendingUp, Calendar, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinancialData } from '@/hooks/useFinancialData';

const MetasFinanceiras = () => {
  const navigate = useNavigate();
  const { transactions, suppliers, orders, events, summary, refreshData } = useFinancialData();

  console.log('🎯 Metas Financeiras:', { 
    transactionsCount: transactions?.length || 0, 
    suppliersCount: suppliers?.length || 0 
  });

  // Metas simuladas baseadas nos dados reais
  const metas = [
    {
      id: 1,
      nome: 'Meta de Faturamento Mensal',
      tipo: 'revenue',
      atual: summary?.totalRevenue || 0,
      meta: 15000,
      unidade: 'R$',
      periodo: 'mensal',
      status: 'ativo',
      prioridade: 'alta',
      cor: 'green',
      icone: TrendingUp
    },
    {
      id: 2,
      nome: 'Redução de Despesas',
      tipo: 'expense',
      atual: summary?.totalExpenses || 0,
      meta: 8000,
      unidade: 'R$',
      periodo: 'mensal',
      status: 'ativo',
      prioridade: 'media',
      cor: 'red',
      icone: Target
    },
    {
      id: 3,
      nome: 'Meta de Lucro Líquido',
      tipo: 'profit',
      atual: summary?.netProfit || 0,
      meta: 7000,
      unidade: 'R$',
      periodo: 'mensal',
      status: 'ativo',
      prioridade: 'alta',
      cor: 'blue',
      icone: Trophy
    },
    {
      id: 4,
      nome: 'Novos Fornecedores',
      tipo: 'suppliers',
      atual: suppliers?.length || 0,
      meta: 10,
      unidade: 'fornecedores',
      periodo: 'trimestral',
      status: 'ativo',
      prioridade: 'baixa',
      cor: 'purple',
      icone: Target
    }
  ];

  const calcularProgresso = (atual: number, meta: number) => {
    return Math.min((atual / meta) * 100, 100);
  };

  const getStatusBadge = (atual: number, meta: number) => {
    const progresso = calcularProgresso(atual, meta);
    if (progresso >= 100) {
      return <Badge className="bg-green-100 text-green-700">Concluída</Badge>;
    } else if (progresso >= 75) {
      return <Badge className="bg-blue-100 text-blue-700">Em andamento</Badge>;
    } else if (progresso >= 50) {
      return <Badge className="bg-yellow-100 text-yellow-700">No prazo</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">Atenção</Badge>;
    }
  };

  const getCorProgresso = (atual: number, meta: number) => {
    const progresso = calcularProgresso(atual, meta);
    if (progresso >= 100) return 'bg-green-500';
    if (progresso >= 75) return 'bg-blue-500';
    if (progresso >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => navigate('/admin/financeiro')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Metas Financeiras</h1>
            <p className="text-muted-foreground">
              Defina e acompanhe suas metas de faturamento, lucro e despesas
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => {
            // Em breve: criação de novas metas
            alert('Em breve: criação de novas metas');
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Meta
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Metas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metas.length}</div>
            <p className="text-xs text-muted-foreground">Metas ativas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Metas Concluídas</CardTitle>
            <Trophy className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {metas.filter(meta => calcularProgresso(meta.atual, meta.meta) >= 100).length}
            </div>
            <p className="text-xs text-muted-foreground">100% concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {metas.filter(meta => {
                const progresso = calcularProgresso(meta.atual, meta.meta);
                return progresso > 0 && progresso < 100;
              }).length}
            </div>
            <p className="text-xs text-muted-foreground">Em execução</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Médio</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(metas.reduce((sum, meta) => sum + calcularProgresso(meta.atual, meta.meta), 0) / metas.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Progresso geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Metas */}
      <div className="grid gap-6">
        {metas.map((meta) => {
          const progresso = calcularProgresso(meta.atual, meta.meta);
          const Icone = meta.icone;
          
          return (
            <Card key={meta.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      meta.cor === 'green' ? 'bg-green-100' :
                      meta.cor === 'red' ? 'bg-red-100' :
                      meta.cor === 'blue' ? 'bg-blue-100' : 'bg-purple-100'
                    }`}>
                      <Icone className={`h-5 w-5 ${
                        meta.cor === 'green' ? 'text-green-600' :
                        meta.cor === 'red' ? 'text-red-600' :
                        meta.cor === 'blue' ? 'text-blue-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{meta.nome}</CardTitle>
                      <CardDescription>
                        Meta: {meta.meta.toLocaleString('pt-BR')} {meta.unidade} • {meta.periodo}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(meta.atual, meta.meta)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progresso atual</span>
                    <span className="font-medium">
                      {meta.atual.toLocaleString('pt-BR')} {meta.unidade} / {meta.meta.toLocaleString('pt-BR')} {meta.unidade}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <Progress 
                      value={progresso} 
                      className="h-2"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0%</span>
                      <span className="font-medium">{progresso.toFixed(1)}%</span>
                      <span>100%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {meta.atual.toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">Atual</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {(meta.meta - meta.atual).toLocaleString('pt-BR')}
                      </div>
                      <div className="text-xs text-muted-foreground">Faltam</div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold ${
                        progresso >= 100 ? 'text-green-600' : 
                        progresso >= 75 ? 'text-blue-600' :
                        progresso >= 50 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {progresso.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Progresso</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MetasFinanceiras;

