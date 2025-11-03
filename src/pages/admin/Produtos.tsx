import React, { useState } from 'react';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { MobileQuickAddFAB } from '@/components/admin/MobileQuickAddFAB';
import { ProductDrafts } from '@/components/admin/ProductDrafts';
import { AdvancedProductsView } from '@/components/products/AdvancedProductsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, FileEdit, Zap, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Produtos = () => {
  const [activeTab, setActiveTab] = useState('todos');

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-3">
              Gerenciar Produtos
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white animate-pulse">
                <Sparkles className="w-3 h-3 mr-1" />
                Ultra Premium
              </Badge>
            </h1>
            <p className="text-muted-foreground">
              Sistema avançado com filtros inteligentes, busca poderosa e visualizações premium! 🚀
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos" className="gap-2">
            <Package className="w-4 h-4" />
            <span className="hidden md:inline">Todos</span>
          </TabsTrigger>
          <TabsTrigger value="rascunhos" className="gap-2">
            <FileEdit className="w-4 h-4" />
            <span className="hidden md:inline">Rascunhos</span>
          </TabsTrigger>
          <TabsTrigger value="quick" className="gap-2">
            <Zap className="w-4 h-4" />
            <span className="hidden md:inline">Rápido</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todos" className="mt-6">
          <AdvancedProductsView />
        </TabsContent>

        <TabsContent value="rascunhos" className="mt-6">
          <ProductDrafts />
        </TabsContent>

        <TabsContent value="quick" className="mt-6">
          <div className="text-center py-12">
            <Zap className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Cadastro Rápido</h3>
            <p className="text-muted-foreground mb-6">
              Use o botão flutuante (+) no canto inferior direito<br />
              para cadastrar produtos rapidamente!
            </p>
            <div className="space-y-3 max-w-md mx-auto text-left">
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">1</div>
                <p className="text-sm">Tire foto com a câmera do celular</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">2</div>
                <p className="text-sm">Preencha nome e preço</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                <div className="bg-purple-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">3</div>
                <p className="text-sm">Selecione categoria e pronto!</p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Botão Flutuante (sempre visível) */}
      <MobileQuickAddFAB />
    </div>
  );
};

export default Produtos;
