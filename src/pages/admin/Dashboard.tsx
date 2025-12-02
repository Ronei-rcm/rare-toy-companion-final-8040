import React, { Suspense, Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ModernAdminDashboard from '@/components/admin/ModernAdminDashboard';

// ErrorBoundary customizado
class ErrorBoundary extends Component<
  { children: ReactNode; fallback: (props: { error: Error; resetError: () => void }) => ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback({ 
        error: this.state.error, 
        resetError: () => this.setState({ hasError: false, error: null }) 
      });
    }

    return this.props.children;
  }
}

// Componente de fallback simples
const SimpleDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do seu negócio</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas de Hoje</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ 0,00</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Novos Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Carregando...</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            O dashboard está sendo carregado. Se você estiver vendo esta mensagem, 
            pode haver um problema temporário. Tente atualizar a página.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// Componente de erro
const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => {
  return (
    <div className="space-y-6">
      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <AlertTriangle className="h-5 w-5" />
            Erro no Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            Ocorreu um erro ao carregar o dashboard: {error.message}
          </p>
          <div className="flex gap-2">
            <Button onClick={resetError} variant="outline" size="sm">
              Tentar Novamente
            </Button>
            <Button onClick={() => window.location.reload()} size="sm">
              Recarregar Página
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="relative">
      {/* Header mobile com espaço para o botão */}
      <div className="md:hidden pt-20 px-4 pb-6 bg-gradient-to-b from-white via-white/95 to-transparent">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 leading-tight">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1 leading-relaxed">Visão geral do seu negócio</p>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mt-4"></div>
      </div>
      
      {/* Conteúdo principal com Error Boundary */}
      <div className="p-4 md:p-6">
        <ErrorBoundary
          fallback={ErrorFallback}
        >
          <Suspense fallback={<SimpleDashboard />}>
            <ModernAdminDashboard />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Dashboard;