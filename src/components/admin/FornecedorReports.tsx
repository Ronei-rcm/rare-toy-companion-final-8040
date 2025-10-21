import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Calendar,
  DollarSign,
  Package,
  Star,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  FileText,
  PieChart,
  LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RelatorioFornecedor {
  id: string;
  nome: string;
  periodo: string;
  vendas: number;
  produtos: number;
  margemMedia: number;
  avaliacao: number;
  status: 'excelente' | 'bom' | 'regular' | 'ruim';
  tendencia: 'alta' | 'estavel' | 'baixa';
  problemas: string[];
  oportunidades: string[];
}

interface FornecedorReportsProps {
  fornecedores: any[];
}

const FornecedorReports: React.FC<FornecedorReportsProps> = ({ fornecedores }) => {
  const [periodo, setPeriodo] = useState('30');
  const [tipoRelatorio, setTipoRelatorio] = useState('geral');
  const [loading, setLoading] = useState(false);

  // Dados mockados para demonstração
  const mockRelatorios: RelatorioFornecedor[] = [
    {
      id: '1',
      nome: 'Brinquedos & Cia Ltda',
      periodo: 'Últimos 30 dias',
      vendas: 12500,
      produtos: 156,
      margemMedia: 45.2,
      avaliacao: 4.8,
      status: 'excelente',
      tendencia: 'alta',
      problemas: [],
      oportunidades: ['Aumentar mix de produtos', 'Expandir para novas categorias']
    },
    {
      id: '2',
      nome: 'Distribuidora Kids',
      periodo: 'Últimos 30 dias',
      vendas: 8900,
      produtos: 89,
      margemMedia: 38.5,
      avaliacao: 4.5,
      status: 'bom',
      tendencia: 'estavel',
      problemas: ['Alguns atrasos na entrega'],
      oportunidades: ['Melhorar prazo de entrega', 'Aumentar desconto']
    },
    {
      id: '3',
      nome: 'Importadora Toys',
      periodo: 'Últimos 30 dias',
      vendas: 0,
      produtos: 0,
      margemMedia: 0,
      avaliacao: 0,
      status: 'ruim',
      tendencia: 'baixa',
      problemas: ['Fornecedor pendente', 'Sem produtos cadastrados'],
      oportunidades: ['Ativar fornecedor', 'Cadastrar produtos']
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants = {
      excelente: 'default',
      bom: 'secondary',
      regular: 'outline',
      ruim: 'destructive'
    } as const;

    const colors = {
      excelente: 'text-green-600',
      bom: 'text-blue-600',
      regular: 'text-yellow-600',
      ruim: 'text-red-600'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]} className={colors[status as keyof typeof colors]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTendenciaIcon = (tendencia: string) => {
    switch (tendencia) {
      case 'alta':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'estavel':
        return <BarChart3 className="h-4 w-4 text-blue-600" />;
      case 'baixa':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const handleExportarRelatorio = async () => {
    setLoading(true);
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Aqui você implementaria a lógica real de exportação
      console.log('Exportando relatório...');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular métricas gerais
  const totalVendas = mockRelatorios.reduce((sum, r) => sum + r.vendas, 0);
  const totalProdutos = mockRelatorios.reduce((sum, r) => sum + r.produtos, 0);
  const avaliacaoMedia = mockRelatorios.length > 0 
    ? mockRelatorios.reduce((sum, r) => sum + r.avaliacao, 0) / mockRelatorios.length 
    : 0;
  const fornecedoresAtivos = mockRelatorios.filter(r => r.status !== 'ruim').length;

  const metricasCards = [
    {
      title: 'Vendas Totais',
      value: `R$ ${totalVendas.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      change: '+15.3% vs período anterior'
    },
    {
      title: 'Total de Produtos',
      value: totalProdutos.toLocaleString(),
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      change: '+8.2% vs período anterior'
    },
    {
      title: 'Avaliação Média',
      value: avaliacaoMedia.toFixed(1),
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      change: '+0.3 vs período anterior'
    },
    {
      title: 'Fornecedores Ativos',
      value: `${fornecedoresAtivos}/${mockRelatorios.length}`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      change: `${((fornecedoresAtivos / mockRelatorios.length) * 100).toFixed(1)}% ativos`
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios de Fornecedores</h2>
          <p className="text-muted-foreground">
            Analytics e insights sobre performance dos fornecedores
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportarRelatorio} disabled={loading}>
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Período:</span>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Últimos 7 dias</SelectItem>
                  <SelectItem value="30">Últimos 30 dias</SelectItem>
                  <SelectItem value="90">Últimos 90 dias</SelectItem>
                  <SelectItem value="365">Último ano</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Tipo:</span>
              <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="geral">Relatório Geral</SelectItem>
                  <SelectItem value="vendas">Performance de Vendas</SelectItem>
                  <SelectItem value="produtos">Análise de Produtos</SelectItem>
                  <SelectItem value="qualidade">Qualidade e Avaliações</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metricasCards.map((metrica, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metrica.title}</p>
                  <p className="text-2xl font-bold">{metrica.value}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {metrica.change}
                  </p>
                </div>
                <div className={cn("p-3 rounded-full", metrica.bgColor)}>
                  <metrica.icon className={cn("h-6 w-6", metrica.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos e Visualizações */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance por Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Performance por Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRelatorios.map((relatorio) => (
                <div key={relatorio.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{relatorio.nome}</h4>
                      <p className="text-sm text-muted-foreground">{relatorio.periodo}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTendenciaIcon(relatorio.tendencia)}
                      {getStatusBadge(relatorio.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Vendas</p>
                      <p className="font-semibold">R$ {relatorio.vendas.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Produtos</p>
                      <p className="font-semibold">{relatorio.produtos}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Margem</p>
                      <p className="font-semibold">{relatorio.margemMedia.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Avaliação</p>
                      <p className="font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        {relatorio.avaliacao.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {/* Problemas e Oportunidades */}
                  <div className="mt-3 pt-3 border-t">
                    {relatorio.problemas.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-red-600 mb-1">Problemas:</p>
                        <div className="flex flex-wrap gap-1">
                          {relatorio.problemas.map((problema, idx) => (
                            <Badge key={idx} variant="destructive" className="text-xs">
                              {problema}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {relatorio.oportunidades.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-green-600 mb-1">Oportunidades:</p>
                        <div className="flex flex-wrap gap-1">
                          {relatorio.oportunidades.map((oportunidade, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {oportunidade}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Insights e Recomendações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Insights e Recomendações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top Performers */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Top Performers
                </h4>
                <div className="space-y-2">
                  {mockRelatorios
                    .filter(r => r.status === 'excelente' || r.status === 'bom')
                    .sort((a, b) => b.vendas - a.vendas)
                    .slice(0, 3)
                    .map((relatorio) => (
                      <div key={relatorio.id} className="flex items-center justify-between text-sm">
                        <span>{relatorio.nome}</span>
                        <span className="font-medium text-green-600">
                          R$ {relatorio.vendas.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Atenção Necessária */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Atenção Necessária
                </h4>
                <div className="space-y-2">
                  {mockRelatorios
                    .filter(r => r.status === 'regular' || r.status === 'ruim')
                    .map((relatorio) => (
                      <div key={relatorio.id} className="flex items-center justify-between text-sm">
                        <span>{relatorio.nome}</span>
                        <Badge variant="outline" className="text-xs">
                          {relatorio.status}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* Oportunidades de Crescimento */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  Oportunidades de Crescimento
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Negociar melhores condições com fornecedores top performers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Expandir mix de produtos dos fornecedores mais avaliados</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span>Implementar programa de melhoria para fornecedores regulares</span>
                  </div>
                </div>
              </div>

              {/* Métricas de Qualidade */}
              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-600" />
                  Métricas de Qualidade
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Fornecedores Excelentes</p>
                    <p className="font-semibold text-green-600">
                      {mockRelatorios.filter(r => r.status === 'excelente').length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avaliação Média</p>
                    <p className="font-semibold text-yellow-600">
                      {avaliacaoMedia.toFixed(1)}/5.0
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Margem Média</p>
                    <p className="font-semibold text-blue-600">
                      {(mockRelatorios.reduce((sum, r) => sum + r.margemMedia, 0) / mockRelatorios.length).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tendência Positiva</p>
                    <p className="font-semibold text-green-600">
                      {mockRelatorios.filter(r => r.tendencia === 'alta').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FornecedorReports;
