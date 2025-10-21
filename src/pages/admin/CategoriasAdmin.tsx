import React from 'react';
import { AdvancedCategoriesView } from '@/components/admin/AdvancedCategoriesView';
import { CategoriasDebug } from '@/components/admin/CategoriasDebug';
import { Sparkles, FolderTree } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CategoriasAdmin = () => {
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
                <FolderTree className="w-8 h-8 text-purple-600" />
                Gerenciar Categorias
              </h1>
              <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Ultra Premium
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Sistema avançado de gerenciamento de categorias com estatísticas, filtros e controle completo! 🎯
            </p>
          </div>
        </div>
      </div>
      
      <Tabs defaultValue="normal" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="normal">Painel Normal</TabsTrigger>
          <TabsTrigger value="debug">🔧 Debug</TabsTrigger>
        </TabsList>
        <TabsContent value="normal">
          <AdvancedCategoriesView />
        </TabsContent>
        <TabsContent value="debug">
          <CategoriasDebug />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CategoriasAdmin;
