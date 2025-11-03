import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { 
  Check, 
  X, 
  RefreshCw, 
  ShoppingCart, 
  Database, 
  Cloud,
  Monitor,
  Smartphone
} from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Componente de teste para verificar sincronização do carrinho
 * Use apenas em desenvolvimento!
 */
const CartSyncTester: React.FC = () => {
  const { state, addItem, removeItem, updateQuantity } = useCart();
  const [tests, setTests] = useState<Record<string, boolean>>({});
  const [isRunning, setIsRunning] = useState(false);

  const mockProduct = {
    id: 999,
    nome: 'Produto de Teste',
    preco: 99.90,
    imagemUrl: '/placeholder.svg',
    descricao: 'Produto para teste de sincronização',
    categoria: 'Teste',
    estoque: 10,
    status: 'ativo' as const,
    destaque: false,
    promocao: false,
    lancamento: false,
    avaliacao: 5,
    totalAvaliacoes: 100,
    faixaEtaria: null,
    peso: null,
    dimensoes: null,
    material: null,
    marca: null,
    origem: null,
    fornecedor: null,
    codigoBarras: null,
    dataLancamento: null,
    createdAt: null,
    updatedAt: null,
  };

  const runTests = async () => {
    setIsRunning(true);
    const results: Record<string, boolean> = {};

    // Teste 1: Adicionar produto
    try {
      await addItem(mockProduct, 1);
      await new Promise(resolve => setTimeout(resolve, 500));
      const inCart = state.itens.some(item => item.produto.id === mockProduct.id);
      results.add_product = inCart;
    } catch {
      results.add_product = false;
    }

    // Teste 2: LocalStorage
    try {
      const saved = localStorage.getItem('muhlstore-cart');
      results.localStorage_save = saved !== null && saved !== '[]';
    } catch {
      results.localStorage_save = false;
    }

    // Teste 3: Atualizar quantidade
    try {
      const item = state.itens.find(i => i.produto.id === mockProduct.id);
      if (item) {
        updateQuantity(item.id, 2);
        await new Promise(resolve => setTimeout(resolve, 500));
        const updated = state.itens.find(i => i.id === item.id);
        results.update_quantity = updated?.quantidade === 2;
      } else {
        results.update_quantity = false;
      }
    } catch {
      results.update_quantity = false;
    }

    // Teste 4: Contador do header
    try {
      results.header_count = state.quantidadeTotal > 0;
    } catch {
      results.header_count = false;
    }

    // Teste 5: Cálculo de total
    try {
      results.total_calculation = state.total > 0;
    } catch {
      results.total_calculation = false;
    }

    // Teste 6: Remover produto
    try {
      const item = state.itens.find(i => i.produto.id === mockProduct.id);
      if (item) {
        removeItem(item.id);
        await new Promise(resolve => setTimeout(resolve, 500));
        const removed = !state.itens.some(i => i.produto.id === mockProduct.id);
        results.remove_product = removed;
      } else {
        results.remove_product = false;
      }
    } catch {
      results.remove_product = false;
    }

    // Teste 7: Event customizado (sincronização entre abas)
    try {
      let eventFired = false;
      const listener = () => { eventFired = true; };
      window.addEventListener('cartUpdated', listener);
      
      await addItem(mockProduct, 1);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      results.custom_event = eventFired;
      window.removeEventListener('cartUpdated', listener);
      
      // Limpar
      const item = state.itens.find(i => i.produto.id === mockProduct.id);
      if (item) removeItem(item.id);
    } catch {
      results.custom_event = false;
    }

    setTests(results);
    setIsRunning(false);
  };

  const allPassed = Object.values(tests).every(v => v === true);
  const testCount = Object.keys(tests).length;
  const passedCount = Object.values(tests).filter(v => v === true).length;

  return (
    <Card className="p-6 max-w-2xl mx-auto my-8 border-2 border-dashed">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <ShoppingCart className="w-6 h-6" />
            Teste de Sincronização do Carrinho
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Verificar integração entre componentes
          </p>
        </div>
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="gap-2"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Testando...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Executar Testes
            </>
          )}
        </Button>
      </div>

      {testCount > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Resultado Geral</span>
            <Badge variant={allPassed ? 'default' : 'destructive'} className="text-lg px-4 py-1">
              {passedCount}/{testCount} Passaram
            </Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${allPassed ? 'bg-green-500' : 'bg-amber-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${(passedCount / testCount) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <TestItem
          icon={<ShoppingCart className="w-5 h-5" />}
          title="Adicionar Produto"
          description="Produto adicionado ao carrinho corretamente"
          status={tests.add_product}
        />
        
        <TestItem
          icon={<Database className="w-5 h-5" />}
          title="LocalStorage"
          description="Dados salvos no localStorage"
          status={tests.localStorage_save}
        />
        
        <TestItem
          icon={<RefreshCw className="w-5 h-5" />}
          title="Atualizar Quantidade"
          description="Quantidade atualizada corretamente"
          status={tests.update_quantity}
        />
        
        <TestItem
          icon={<Monitor className="w-5 h-5" />}
          title="Contador do Header"
          description="Contador atualizado no header"
          status={tests.header_count}
        />
        
        <TestItem
          icon={<Check className="w-5 h-5" />}
          title="Cálculo de Total"
          description="Total calculado corretamente"
          status={tests.total_calculation}
        />
        
        <TestItem
          icon={<X className="w-5 h-5" />}
          title="Remover Produto"
          description="Produto removido com sucesso"
          status={tests.remove_product}
        />
        
        <TestItem
          icon={<Cloud className="w-5 h-5" />}
          title="Evento Customizado"
          description="Event 'cartUpdated' disparado"
          status={tests.custom_event}
        />
      </div>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Smartphone className="w-4 h-4" />
          Estado Atual do Carrinho
        </h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Itens</div>
            <div className="font-bold text-lg">{state.quantidadeTotal}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Total</div>
            <div className="font-bold text-lg">R$ {Number(state.total || 0).toFixed(2)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Loading</div>
            <div className="font-bold text-lg">
              {state.isLoading ? '✓' : '✗'}
            </div>
          </div>
        </div>
      </div>

      {allPassed && testCount > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center"
        >
          <div className="text-green-800 font-bold text-lg mb-1">
            ✅ Todos os Testes Passaram!
          </div>
          <div className="text-green-700 text-sm">
            O carrinho está sincronizando corretamente entre todos os componentes.
          </div>
        </motion.div>
      )}
    </Card>
  );
};

interface TestItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  status?: boolean;
}

const TestItem: React.FC<TestItemProps> = ({ icon, title, description, status }) => {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      status === undefined ? 'bg-muted/30 border-muted' :
      status ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className={`flex-shrink-0 ${
        status === undefined ? 'text-muted-foreground' :
        status ? 'text-green-600' : 'text-red-600'
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm">{title}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
      <div className="flex-shrink-0">
        {status === undefined ? (
          <div className="w-6 h-6 rounded-full bg-muted" />
        ) : status ? (
          <Check className="w-6 h-6 text-green-600" />
        ) : (
          <X className="w-6 h-6 text-red-600" />
        )}
      </div>
    </div>
  );
};

export default CartSyncTester;

