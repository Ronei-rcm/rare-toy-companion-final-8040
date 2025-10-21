import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown, DollarSign, Calendar } from 'lucide-react';

// Componente para gráfico de linha simples (simulado)
const LineChart = ({ data, title }: { data: any[], title: string }) => {
  const maxValue = Math.max(...data.map(d => Math.max(d.entradas, d.saidas)));
  const minValue = Math.min(...data.map(d => Math.min(d.entradas, d.saidas)));
  const range = maxValue - minValue;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">{title}</h3>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Saídas</span>
          </div>
        </div>
      </div>
      
      <div className="relative h-64 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end justify-between h-full">
          {data.map((item, index) => {
            const entradaHeight = ((item.entradas - minValue) / range) * 200;
            const saidaHeight = ((item.saidas - minValue) / range) * 200;
            
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-4 bg-green-500 rounded-t"
                    style={{ height: `${entradaHeight}px` }}
                    title={`Entradas: R$ ${item.entradas.toLocaleString('pt-BR')}`}
                  ></div>
                  <div 
                    className="w-4 bg-red-500 rounded-t"
                    style={{ height: `${saidaHeight}px` }}
                    title={`Saídas: R$ ${item.saidas.toLocaleString('pt-BR')}`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600">{item.month}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Componente para gráfico de pizza simples
const PieChart = ({ data, title }: { data: any[], title: string }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const percentage = ((item.value / total) * 100).toFixed(1);
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`}></div>
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">R$ {item.value.toLocaleString('pt-BR')}</div>
                <div className="text-xs text-gray-500">{percentage}%</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Componente para gráfico de barras
const BarChart = ({ data, title }: { data: any[], title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => {
          const width = (item.value / maxValue) * 100;
          const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'];
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span className="font-medium">R$ {item.value.toLocaleString('pt-BR')}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${colors[index % colors.length]}`}
                  style={{ width: `${width}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface FinancialChartsProps {
  orders: any[];
  suppliers: any[];
  events: any[];
  transactions: any[];
}

const FinancialCharts: React.FC<FinancialChartsProps> = ({
  orders,
  suppliers,
  events,
  transactions
}) => {
  const [selectedPeriod, setSelectedPeriod] = React.useState('6months');

  // Dados para gráfico de fluxo de caixa
  const cashFlowData = [
    { month: 'Jan', entradas: 8500, saidas: 3200 },
    { month: 'Fev', entradas: 9200, saidas: 4100 },
    { month: 'Mar', entradas: 7800, saidas: 3800 },
    { month: 'Abr', entradas: 10500, saidas: 4200 },
    { month: 'Mai', entradas: 12350, saidas: 5280 },
    { month: 'Jun', entradas: 9800, saidas: 3900 },
  ];

  // Dados para gráfico de pizza - Categorias
  const categoryData = [
    { name: 'Vendas', value: 12350 },
    { name: 'Eventos', value: 3590 },
    { name: 'Outros', value: 890 },
  ];

  // Dados para gráfico de pizza - Despesas
  const expenseData = [
    { name: 'Fornecedores', value: 5280 },
    { name: 'Marketing', value: 1200 },
    { name: 'Operacional', value: 890 },
    { name: 'Outros', value: 450 },
  ];

  // Dados para gráfico de barras - Top Fornecedores
  const topSuppliersData = suppliers.slice(0, 5).map(supplier => ({
    name: supplier.name,
    value: supplier.total_expenses
  }));

  // Dados para gráfico de barras - Top Eventos
  const topEventsData = events.slice(0, 5).map(event => ({
    name: event.titulo,
    value: event.revenue || 0
  }));

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Relatórios e Gráficos</h2>
        <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="3months">Últimos 3 meses</SelectItem>
            <SelectItem value="6months">Últimos 6 meses</SelectItem>
            <SelectItem value="1year">Último ano</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Gráficos em Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fluxo de Caixa */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Fluxo de Caixa Mensal
            </CardTitle>
            <CardDescription>Entradas vs Saídas por mês</CardDescription>
          </CardHeader>
          <CardContent>
            <LineChart data={cashFlowData} title="" />
          </CardContent>
        </Card>

        {/* Receitas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Receitas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das receitas</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={categoryData} title="" />
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Despesas por Categoria
            </CardTitle>
            <CardDescription>Distribuição das despesas</CardDescription>
          </CardHeader>
          <CardContent>
            <PieChart data={expenseData} title="" />
          </CardContent>
        </Card>

        {/* Top Fornecedores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Top Fornecedores
            </CardTitle>
            <CardDescription>Maiores despesas com fornecedores</CardDescription>
          </CardHeader>
          <CardContent>
            <BarChart data={topSuppliersData} title="" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FinancialCharts;
