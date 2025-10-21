import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface FinanceiroDebugTabsProps {
  transactions?: any[];
  suppliers?: any[];
  onRefresh?: () => void;
}

export const FinanceiroDebugTabs: React.FC<FinanceiroDebugTabsProps> = ({
  transactions = [],
  suppliers = [],
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  const handleTabChange = (value: string) => {
    console.log('🔄 Mudando aba para:', value);
    setActiveTab(value);
  };

  return (
    <div className="space-y-6">
      {/* Header de Debug */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600" />
            Debug - Abas Financeiro
          </CardTitle>
          <CardDescription>
            Teste das abas que não estão funcionando
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Aba Ativa</p>
              <Badge variant="outline" className="mt-1">
                {activeTab}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Transações</p>
              <Badge variant="outline" className="mt-1">
                {transactions.length}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Fornecedores</p>
              <Badge variant="outline" className="mt-1">
                {suppliers.length}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Debug */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="suppliers" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Fornecedores
          </TabsTrigger>
          <TabsTrigger value="transactions" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Lançamentos
          </TabsTrigger>
          <TabsTrigger value="test" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Teste
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Visão Geral Funcionando</CardTitle>
              <CardDescription>
                Esta aba está funcionando perfeitamente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-600">
                  Aba "Visão Geral" está funcionando!
                </p>
                <p className="text-muted-foreground mt-2">
                  Se você está vendo isso, o sistema de abas está OK.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">🔧 Teste - Fornecedores</CardTitle>
              <CardDescription>
                Testando se a aba de fornecedores funciona
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                  <p className="font-semibold text-orange-800">
                    Testando Aba Fornecedores
                  </p>
                  <p className="text-orange-600 text-sm mt-1">
                    Se você está vendo isso, a aba está funcionando!
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Dados de Fornecedores:</h4>
                    <p className="text-sm text-muted-foreground">
                      Total: {suppliers.length} fornecedores
                    </p>
                    {suppliers.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {suppliers.slice(0, 3).map((supplier, index) => (
                          <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                            {supplier.nome || supplier.name || `Fornecedor ${index + 1}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Ações de Teste:</h4>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        Testar Ação 1
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Testar Ação 2
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Testar Ação 3
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">🔧 Teste - Lançamentos</CardTitle>
              <CardDescription>
                Testando se a aba de lançamentos funciona
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center p-6 bg-orange-50 rounded-lg">
                  <AlertTriangle className="h-12 w-12 text-orange-600 mx-auto mb-3" />
                  <p className="font-semibold text-orange-800">
                    Testando Aba Lançamentos
                  </p>
                  <p className="text-orange-600 text-sm mt-1">
                    Se você está vendo isso, a aba está funcionando!
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Dados de Transações:</h4>
                    <p className="text-sm text-muted-foreground">
                      Total: {transactions.length} transações
                    </p>
                    {transactions.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {transactions.slice(0, 3).map((transaction, index) => (
                          <div key={index} className="text-xs bg-gray-100 p-2 rounded">
                            {transaction.descricao || transaction.description || `Transação ${index + 1}`}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Ações de Teste:</h4>
                    <div className="space-y-2">
                      <Button size="sm" variant="outline" className="w-full">
                        Nova Transação
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Filtrar
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        Exportar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">✅ Teste Funcionando</CardTitle>
              <CardDescription>
                Esta é uma aba de teste para verificar se o sistema funciona
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <p className="text-lg font-semibold text-green-600">
                  Sistema de Abas Funcionando!
                </p>
                <p className="text-muted-foreground mt-2">
                  Se você consegue navegar entre as abas, o problema não é no sistema de abas.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroDebugTabs;
