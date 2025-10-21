
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus, Filter, Download, Upload, QrCode } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import ListaProdutos from '@/components/admin/ListaProdutos';
import AdicionarProdutoDialog from '@/components/admin/AdicionarProdutoDialog';
import PixManagement from '@/components/admin/PixManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const ProdutosAdmin = () => {
  const [abrirDialogAdicionar, setAbrirDialogAdicionar] = useState(false);
  const [termoBusca, setTermoBusca] = useState('');
  const { toast } = useToast();

  const handleBuscaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTermoBusca(e.target.value);
  };

  const exportarProdutos = () => {
    toast({
      title: 'Exportando produtos',
      description: 'Os dados serão baixados em formato CSV.',
    });
  };

  const importarProdutos = () => {
    toast({
      title: 'Importar produtos',
      description: 'Funcionalidade de importação em desenvolvimento.',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold">Produtos</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Pesquisar produtos..."
              className="pl-8 w-full sm:w-[300px]"
              value={termoBusca}
              onChange={handleBuscaChange}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Todos os produtos</DropdownMenuItem>
              <DropdownMenuItem>Em promoção</DropdownMenuItem>
              <DropdownMenuItem>Sem estoque</DropdownMenuItem>
              <DropdownMenuItem>Lançamentos</DropdownMenuItem>
              <DropdownMenuItem>Exclusivos</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" /> Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportarProdutos}>
                Exportar CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={importarProdutos}>
                <Upload className="h-4 w-4 mr-2" />
                Importar produtos
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => setAbrirDialogAdicionar(true)}>
            <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="destaque">Destaques</TabsTrigger>
          <TabsTrigger value="estoque">Gerenciar Estoque</TabsTrigger>
          <TabsTrigger value="promocoes">Promoções</TabsTrigger>
          <TabsTrigger value="pix">PIX</TabsTrigger>
        </TabsList>
        
        <TabsContent value="todos" className="space-y-4">
          <ListaProdutos busca={termoBusca} />
        </TabsContent>
        
        <TabsContent value="destaque" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Visualize e gerencie os produtos em destaque na loja.
          </div>
          <ListaProdutos busca={termoBusca} />
        </TabsContent>
        
        <TabsContent value="estoque" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Acompanhe produtos com baixo estoque ou sem estoque.
          </div>
          <ListaProdutos busca={termoBusca} />
        </TabsContent>
        
        <TabsContent value="promocoes" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Gerencie produtos em promoção ou prepare próximas campanhas.
          </div>
          <ListaProdutos busca={termoBusca} />
        </TabsContent>
        
        <TabsContent value="pix" className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            Gerencie códigos PIX, monitore transações e configure descontos.
          </div>
          <PixManagement />
        </TabsContent>
      </Tabs>
      
      <AdicionarProdutoDialog 
        open={abrirDialogAdicionar} 
        onOpenChange={setAbrirDialogAdicionar}
      />
    </div>
  );
};

export default ProdutosAdmin;
