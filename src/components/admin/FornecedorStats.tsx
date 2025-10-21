import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  Package, 
  Star, 
  Users, 
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  BarChart3,
  Activity,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Fornecedor {
  id: string;
  nome: string;
  status: 'ativo' | 'inativo' | 'pendente';
  avaliacao: number;
  totalProdutos: number;
  vendasMes: number;
  ultimaAtualizacao: string;
  dataCadastro: string;
}

interface FornecedorStatsProps {
  fornecedores: Fornecedor[];
}

const FornecedorStats: React.FC<FornecedorStatsProps> = ({ fornecedores }) => {
  // Calcular estatísticas
  const totalFornecedores = fornecedores.length;
  const fornecedoresAtivos = fornecedores.filter(f => f.status === 'ativo').length;
  const fornecedoresInativos = fornecedores.filter(f => f.status === 'inativo').length;
  const fornecedoresPendentes = fornecedores.filter(f => f.status === 'pendente').length;
  
  const totalProdutos = fornecedores.reduce((sum, f) => sum + f.totalProdutos, 0);
  const totalVendasMes = fornecedores.reduce((sum, f) => sum + f.vendasMes, 0);
  
  const avaliacaoMedia = fornecedores.length > 0 
    ? fornecedores.reduce((sum, f) => sum + f.avaliacao, 0) / fornecedores.length 
    : 0;

  // Fornecedores com melhor performance
  const topFornecedores = fornecedores
    .filter(f => f.status === 'ativo')
    .sort((a, b) => b.vendasMes - a.vendasMes)
    .slice(0, 3);

  // Fornecedores com mais produtos
  const fornecedoresMaisProdutos = fornecedores
    .filter(f => f.status === 'ativo')
    .sort((a, b) => b.totalProdutos - a.totalProdutos)
    .slice(0, 3);

  // Crescimento mensal (simulado)
  const crescimentoMes = 12.5; // %
  const fornecedoresNovos = fornecedores.filter(f => {
    const dataCadastro = new Date(f.dataCadastro);
    const umMesAtras = new Date();
    umMesAtras.setMonth(umMesAtras.getMonth() - 1);
    return dataCadastro > umMesAtras;
  }).length;

  const statsCards = [
    {
      title: 'Total de Fornecedores',
      value: totalFornecedores,
      icon: Building2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: `+${fornecedoresNovos} este mês`,
      changeType: 'positive' as const
    },
    {
      title: 'Fornecedores Ativos',
      value: fornecedoresAtivos,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `${((fornecedoresAtivos / totalFornecedores) * 100).toFixed(1)}% do total`,
      changeType: 'positive' as const
    },
    {
      title: 'Total de Produtos',
      value: totalProdutos.toLocaleString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `+${fornecedoresNovos * 50} este mês`,
      changeType: 'positive' as const
    },
    {
      title: 'Vendas do Mês',
      value: `R$ ${totalVendasMes.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: `+${crescimentoMes}% vs mês anterior`,
      changeType: 'positive' as const
    }
  ];

  const statusCards = [
    {
      title: 'Ativos',
      value: fornecedoresAtivos,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Inativos',
      value: fornecedoresInativos,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    {
      title: 'Pendentes',
      value: fornecedoresPendentes,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className={cn(
                    "text-xs mt-1",
                    stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {stat.change}
                  </p>
                </div>
                <div className={cn("p-3 rounded-full", stat.bgColor)}>
                  <stat.icon className={cn("h-6 w-6", stat.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Status dos Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Status dos Fornecedores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusCards.map((status, index) => (
                <div key={index} className={cn(
                  "flex items-center justify-between p-3 rounded-lg border",
                  status.bgColor,
                  status.borderColor
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-full", status.bgColor)}>
                      <status.icon className={cn("h-4 w-4", status.color)} />
                    </div>
                    <span className="font-medium">{status.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{status.value}</span>
                    <div className={cn("text-xs px-2 py-1 rounded-full", status.bgColor)}>
                      {((status.value / totalFornecedores) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Fornecedores por Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Fornecedores - Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topFornecedores.map((fornecedor, index) => (
                <div key={fornecedor.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : "bg-orange-600"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{fornecedor.nome}</p>
                      <p className="text-xs text-muted-foreground">{fornecedor.totalProdutos} produtos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      R$ {fornecedor.vendasMes.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs text-muted-foreground">
                        {fornecedor.avaliacao.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {topFornecedores.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum fornecedor ativo encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Fornecedores por Produtos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Top Fornecedores - Produtos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fornecedoresMaisProdutos.map((fornecedor, index) => (
                <div key={fornecedor.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                      index === 0 ? "bg-purple-500" : index === 1 ? "bg-purple-400" : "bg-purple-300"
                    )}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{fornecedor.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {fornecedor.vendasMes.toLocaleString()}/mês
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-purple-600">
                      {fornecedor.totalProdutos}
                    </p>
                    <p className="text-xs text-muted-foreground">produtos</p>
                  </div>
                </div>
              ))}
              {fornecedoresMaisProdutos.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum fornecedor ativo encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas Adicionais */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold">{avaliacaoMedia.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">
                  {fornecedores.filter(f => f.avaliacao > 0).length} fornecedores avaliados
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-full">
                <Star className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Novos Este Mês</p>
                <p className="text-2xl font-bold">{fornecedoresNovos}</p>
                <p className="text-xs text-green-600">
                  +{((fornecedoresNovos / totalFornecedores) * 100).toFixed(1)}% do total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Ativação</p>
                <p className="text-2xl font-bold">
                  {totalFornecedores > 0 ? ((fornecedoresAtivos / totalFornecedores) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Fornecedores ativos
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FornecedorStats;
