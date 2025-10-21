import React from 'react';
import { AdvancedCollectionsView } from '@/components/admin/AdvancedCollectionsView';
import { Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const ColecoesAdmin = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">Gerenciar Coleções</h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-muted-foreground mt-2">
              Sistema avançado de gerenciamento de coleções com estatísticas, filtros e controle completo
            </p>
          </div>
        </div>
      </div>
      
      <AdvancedCollectionsView />
    </div>
  );
};

export default ColecoesAdmin;
