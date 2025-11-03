
import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

// Dados das categorias
const categorias = [
  { id: 'todos', nome: 'Todos' },
  { id: 'bonecos', nome: 'Bonecos de Ação' },
  { id: 'carrinhos', nome: 'Carrinhos' },
  { id: 'bonecas', nome: 'Bonecas' },
  { id: 'jogos', nome: 'Jogos' },
  { id: 'colecionaveis', nome: 'Colecionáveis' }
];

// Dados das coleções
const colecoes = [
  { id: 'toy-story', nome: 'Toy Story' },
  { id: 'hot-wheels', nome: 'Hot Wheels' },
  { id: 'vintage', nome: 'Vintage' },
  { id: 'bonecos-acao', nome: 'Bonecos de Ação' }
];

interface CategoriasFilterProps {
  onCategoriaChange?: (id: string, checked: boolean) => void;
  onColecaoChange?: (id: string, checked: boolean) => void;
}

const CategoriasFilter = ({ onCategoriaChange, onColecaoChange }: CategoriasFilterProps) => {
  return (
    <Card className="p-4">
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold mb-3">Categorias</h3>
          <div className="space-y-2">
            {categorias.map(categoria => (
              <div key={categoria.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`categoria-${categoria.id}`}
                  onCheckedChange={(checked) => 
                    onCategoriaChange?.(categoria.id, checked === true)
                  }
                />
                <Label 
                  htmlFor={`categoria-${categoria.id}`}
                  className="text-sm cursor-pointer"
                >
                  {categoria.nome}
                </Label>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        <div>
          <h3 className="font-semibold mb-3">Coleções</h3>
          <div className="space-y-2">
            {colecoes.map(colecao => (
              <div key={colecao.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`colecao-${colecao.id}`} 
                  onCheckedChange={(checked) => 
                    onColecaoChange?.(colecao.id, checked === true)
                  }
                />
                <Label 
                  htmlFor={`colecao-${colecao.id}`}
                  className="text-sm cursor-pointer"
                >
                  {colecao.nome}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CategoriasFilter;
