import React from 'react';
import { motion } from 'framer-motion';
import { Copy, Rocket, Star, Gift, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ProductTemplate {
  id: string;
  nome: string;
  descricao: string;
  icon: any;
  color: string;
  fields: {
    categoria: string;
    preco?: string;
    estoque?: string;
    descricao?: string;
    tags?: string[];
  };
}

const templates: ProductTemplate[] = [
  {
    id: 'action-figure',
    nome: 'Action Figure',
    descricao: 'Template para bonecos de ação',
    icon: Rocket,
    color: 'blue',
    fields: {
      categoria: 'Action Figures',
      estoque: '1',
      tags: ['action', 'colecionável', 'boneco'],
    },
  },
  {
    id: 'vintage',
    nome: 'Vintage/Retrô',
    descricao: 'Para brinquedos antigos',
    icon: Star,
    color: 'yellow',
    fields: {
      categoria: 'Vintage',
      estoque: '1',
      tags: ['vintage', 'raro', 'colecionável'],
    },
  },
  {
    id: 'pelucia',
    nome: 'Pelúcia',
    descricao: 'Para bichinhos de pelúcia',
    icon: Gift,
    color: 'pink',
    fields: {
      categoria: 'Pelúcias',
      estoque: '5',
      tags: ['pelúcia', 'fofo', 'presente'],
    },
  },
  {
    id: 'promocao',
    nome: 'Promoção',
    descricao: 'Produto em oferta',
    icon: Sparkles,
    color: 'purple',
    fields: {
      categoria: 'Promoções',
      estoque: '10',
      tags: ['promoção', 'desconto', 'oferta'],
    },
  },
];

interface ProductTemplatesProps {
  onSelectTemplate: (template: ProductTemplate) => void;
}

export function ProductTemplates({ onSelectTemplate }: ProductTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold mb-1">Templates Rápidos</h3>
        <p className="text-sm text-muted-foreground">
          Comece com um template pré-configurado
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <motion.div
              key={template.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card
                className="p-6 cursor-pointer hover:shadow-lg transition-all"
                onClick={() => onSelectTemplate(template)}
              >
                <div className={`bg-${template.color}-100 w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${template.color}-600`} />
                </div>

                <h4 className="font-bold mb-1">{template.nome}</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {template.descricao}
                </p>

                <div className="flex flex-wrap gap-1 mb-3">
                  {template.fields.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button size="sm" variant="outline" className="w-full">
                  <Copy className="w-4 h-4 mr-2" />
                  Usar Template
                </Button>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

