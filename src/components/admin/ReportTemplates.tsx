import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Star,
  Clock,
  TrendingUp,
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Copy,
  Edit
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  icon: React.ComponentType<any>;
  color: string;
  popular: boolean;
  lastUsed?: Date;
  useCount: number;
}

interface ReportTemplatesProps {
  onSelectTemplate?: (template: ReportTemplate) => void;
  onUseTemplate?: (template: ReportTemplate) => void;
}

const templates: ReportTemplate[] = [
  {
    id: 'sales-daily',
    name: 'Vendas Diárias',
    description: 'Relatório diário de vendas e receita',
    type: 'sales',
    icon: TrendingUp,
    color: 'bg-green-600',
    popular: true,
    useCount: 45
  },
  {
    id: 'customers-monthly',
    name: 'Clientes Mensais',
    description: 'Análise mensal de novos clientes e atividade',
    type: 'customers',
    icon: Users,
    color: 'bg-blue-600',
    popular: true,
    useCount: 32
  },
  {
    id: 'products-stock',
    name: 'Estoque de Produtos',
    description: 'Relatório de produtos e níveis de estoque',
    type: 'products',
    icon: Package,
    color: 'bg-orange-600',
    popular: false,
    useCount: 18
  },
  {
    id: 'orders-status',
    name: 'Status de Pedidos',
    description: 'Visão geral de pedidos por status',
    type: 'orders',
    icon: ShoppingCart,
    color: 'bg-purple-600',
    popular: true,
    useCount: 28
  },
  {
    id: 'financial-summary',
    name: 'Resumo Financeiro',
    description: 'Resumo completo de receitas e despesas',
    type: 'financial',
    icon: DollarSign,
    color: 'bg-yellow-600',
    popular: true,
    useCount: 52
  },
  {
    id: 'top-products',
    name: 'Top Produtos',
    description: 'Produtos mais vendidos e rentáveis',
    type: 'products',
    icon: Star,
    color: 'bg-pink-600',
    popular: false,
    useCount: 15
  }
];

export default function ReportTemplates({ onSelectTemplate, onUseTemplate }: ReportTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleUse = (template: ReportTemplate) => {
    setSelectedTemplate(template.id);
    if (onUseTemplate) {
      onUseTemplate(template);
    }
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
  };

  const popularTemplates = templates.filter(t => t.popular);
  const allTemplates = templates;

  return (
    <div className="space-y-6">
      {/* Templates Populares */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Templates Populares
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all",
                    selectedTemplate === template.id && "ring-2 ring-orange-500"
                  )}
                  onClick={() => handleUse(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn("p-2 rounded-lg", template.color)}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      {template.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Usado {template.useCount}x</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-7">
                        <Copy className="h-3 w-3 mr-1" />
                        Usar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Todos os Templates */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Todos os Templates</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map((template) => {
            const Icon = template.icon;
            return (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4 }}
              >
                <Card 
                  className={cn(
                    "cursor-pointer hover:shadow-lg transition-all",
                    selectedTemplate === template.id && "ring-2 ring-orange-500"
                  )}
                  onClick={() => handleUse(template)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className={cn("p-2 rounded-lg", template.color)}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      {template.popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-3">{template.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Usado {template.useCount}x</span>
                      </div>
                      <Button size="sm" variant="outline" className="h-7">
                        <Copy className="h-3 w-3 mr-1" />
                        Usar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

