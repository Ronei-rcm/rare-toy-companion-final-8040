import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, DollarSign, Target, RefreshCw } from 'lucide-react';

const FinanceiroDebug = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  console.log('🧪 FinanceiroDebug renderizando...', { activeTab });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">🧪 Teste Financeiro Debug</h1>
          <p className="text-muted-foreground">
            Versão simplificada para testar as abas
          </p>
        </div>
        <Button onClick={() => {
          console.log('🔄 Refresh clicado');
          setActiveTab('overview');
        }}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="p-4">
          <div className="text-center">
            <p className="text-lg font-semibold">Status do Sistema</p>
            <p className="text-muted-foreground">
              Aba Ativa: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{activeTab}</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Se você está vendo isso, o componente está funcionando!
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Abas Simplificadas */}
      <Tabs value={activeTab} onValueChange={(value) => {
        console.log('🔄 Mudando aba para:', value);
        setActiveTab(value);
      }}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="suppliers">Fornecedores</TabsTrigger>
          <TabsTrigger value="transactions">Lançamentos</TabsTrigger>
          <TabsTrigger value="goals">Metas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>✅ Visão Geral Funcionando!</CardTitle>
              <CardDescription>
                Esta aba está funcionando perfeitamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <p className="text-lg font-semibold text-green-600">
                  🎉 Aba "Visão Geral" está funcionando!
                </p>
                <p className="text-muted-foreground mt-2">
                  Se você está vendo isso, o sistema de abas está OK.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-600" />
                🧪 Teste - Aba Fornecedores
              </CardTitle>
              <CardDescription>
                Se você está vendo isso, a aba Fornecedores está funcionando!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Building className="h-12 w-12 mx-auto mb-4 text-purple-600" />
                <p className="text-lg font-semibold mb-2">✅ Aba Fornecedores Funcionando!</p>
                <p className="text-muted-foreground mb-4">
                  Esta aba estava com problema antes. Agora está OK!
                </p>
                <Button onClick={() => {
                  console.log('🏢 Teste Fornecedores clicado');
                  alert('Aba Fornecedores está funcionando!');
                }}>
                  Testar Fornecedores
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                🧪 Teste - Aba Lançamentos
              </CardTitle>
              <CardDescription>
                Se você está vendo isso, a aba Lançamentos está funcionando!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-green-600" />
                <p className="text-lg font-semibold mb-2">✅ Aba Lançamentos Funcionando!</p>
                <p className="text-muted-foreground mb-4">
                  Esta aba estava com problema antes. Agora está OK!
                </p>
                <Button onClick={() => {
                  console.log('💰 Teste Lançamentos clicado');
                  alert('Aba Lançamentos está funcionando!');
                }}>
                  Testar Lançamentos
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                🧪 Teste - Aba Metas
              </CardTitle>
              <CardDescription>
                Se você está vendo isso, a aba Metas está funcionando!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8">
                <Target className="h-12 w-12 mx-auto mb-4 text-blue-600" />
                <p className="text-lg font-semibold mb-2">✅ Aba Metas Funcionando!</p>
                <p className="text-muted-foreground mb-4">
                  Esta aba estava com problema antes. Agora está OK!
                </p>
                <Button onClick={() => {
                  console.log('🎯 Teste Metas clicado');
                  alert('Aba Metas está funcionando!');
                }}>
                  Testar Metas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinanceiroDebug;
