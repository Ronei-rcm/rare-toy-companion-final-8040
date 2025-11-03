
import React, { useState } from 'react';
import { AdvancedClientsManager } from '@/components/admin/AdvancedClientsManager';
import ClientesPedidosSyncSimplified from '@/components/admin/ClientesPedidosSyncSimplified';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, RefreshCw } from 'lucide-react';

const Clientes = () => {
  const [activeTab, setActiveTab] = useState('clientes');

  return (
    <div className="p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="clientes" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Gestão de Clientes</span>
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4" />
            <span>Sincronização</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes">
          <AdvancedClientsManager />
        </TabsContent>

        <TabsContent value="sync">
          <ClientesPedidosSyncSimplified />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clientes;
