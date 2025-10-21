import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Building2, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useFinancialData } from '@/hooks/useFinancialData';

const FornecedoresFinanceiro = () => {
  const navigate = useNavigate();
  const { suppliers, loading, refreshData } = useFinancialData();

  console.log('📊 FornecedoresFinanceiro:', { suppliersCount: suppliers?.length || 0, loading });

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
            <h1 className="text-3xl font-bold">Gestão Financeira de Fornecedores</h1>
            <p className="text-muted-foreground">
              Gerencie pagamentos, créditos e transações com fornecedores
            </p>
          </div>
        </div>
        <Button onClick={refreshData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Conteúdo */}
      {loading ? (
        <Card>
          <CardContent className="p-12 flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Carregando fornecedores...</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Fornecedores ativos</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Saldo Devedor Total</CardTitle>
                <TrendingUp className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  R$ {suppliers?.reduce((sum: number, s: any) => sum + (s.saldoDevedor || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">Valor em aberto</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Limite de Crédito</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {suppliers?.reduce((sum: number, s: any) => sum + (s.limiteCredito || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                </div>
                <p className="text-xs text-muted-foreground">Limite total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Score Médio</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {suppliers?.length > 0 
                    ? Math.round(suppliers.reduce((sum: number, s: any) => sum + (s.scoreFinanceiro || 0), 0) / suppliers.length)
                    : 0
                  }
                </div>
                <p className="text-xs text-muted-foreground">Score médio</p>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Fornecedores */}
          <Card>
            <CardHeader>
              <CardTitle>Fornecedores Financeiros</CardTitle>
              <CardDescription>
                Lista de fornecedores com informações financeiras
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suppliers?.length === 0 ? (
                <div className="text-center p-8">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">Nenhum fornecedor encontrado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suppliers?.map((supplier: any) => (
                    <Card key={supplier.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{supplier.name || supplier.nome || 'Fornecedor'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Score: {supplier.scoreFinanceiro || 0} | 
                              Limite: R$ {(supplier.limiteCredito || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${
                            (supplier.saldoDevedor || 0) > 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            R$ {(supplier.saldoDevedor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {(supplier.saldoDevedor || 0) > 0 ? 'Em débito' : 'Em dia'}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default FornecedoresFinanceiro;

