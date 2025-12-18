import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit,
  Save,
  X,
  Star,
  Tag,
  Sparkles,
  Plus,
  Minus,
  BarChart,
  History,
  Bell,
  Download,
  Upload,
  RefreshCw,
  Archive,
  Truck,
  ShoppingCart,
  DollarSign,
  Calendar,
  Filter,
  Search,
  ChevronDown,
  ArrowUpDown,
  Trash2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useProducts } from '@/hooks/useProducts';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import EnhancedImageUpload from '@/components/admin/EnhancedImageUpload';

interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'entrada' | 'saida' | 'ajuste' | 'venda' | 'devolucao';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  date: Date;
  user: string;
  cost?: number;
}

interface StockAlert {
  id: string;
  productId: string;
  productName: string;
  currentStock: number;
  minStock: number;
  alertLevel: 'critical' | 'warning' | 'low';
  suggestion: string;
}

export function StockControlPanel() {
  const { products, loading, updateProduct, deleteProduct } = useProducts();
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [movementType, setMovementType] = useState<'entrada' | 'saida' | 'ajuste'>('entrada');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'in_stock' | 'low' | 'out'>('all');
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFullEditDialog, setShowFullEditDialog] = useState(false);
  const [productToEdit, setProductToEdit] = useState<any>(null);
  const [categoriasDisponiveis, setCategoriasDisponiveis] = useState<Array<{ id: string | number; nome: string; ativo?: boolean }>>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Carregar categorias do banco de dados (usando o mesmo endpoint da página de categorias)
  useEffect(() => {
    const carregarCategorias = async () => {
      try {
        setLoadingCategorias(true);
        // Usar o mesmo endpoint que a página de categorias usa
        const response = await fetch('/api/categorias/gerenciaveis', {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Erro ao carregar categorias');
        }
        
        const categorias = await response.json();
        console.log('📡 Categorias recebidas da API no StockControlPanel:', categorias);
        
        // Mapear categorias para o formato esperado
        const categoriasFormatadas = categorias.map((cat: any) => ({
          id: cat.id,
          nome: cat.nome,
          slug: cat.slug,
          ativo: cat.ativo !== false // Se não tem campo ativo, considerar como ativa
        }));
        
        console.log('✅ Categorias formatadas no StockControlPanel:', categoriasFormatadas.length);
        setCategoriasDisponiveis(categoriasFormatadas);
      } catch (error) {
        console.error('❌ Erro ao carregar categorias no StockControlPanel:', error);
        // Fallback para categorias estáticas em caso de erro
        setCategoriasDisponiveis([
          { id: 1, nome: 'Bonecos', ativo: true },
          { id: 2, nome: 'Carrinhos', ativo: true },
          { id: 3, nome: 'Jogos', ativo: true },
          { id: 4, nome: 'Quebra-Cabeças', ativo: true },
          { id: 5, nome: 'Pelúcias', ativo: true },
          { id: 6, nome: 'Livros', ativo: true },
          { id: 7, nome: 'Educativos', ativo: true },
          { id: 8, nome: 'Colecionáveis', ativo: true },
          { id: 9, nome: 'Outros', ativo: true }
        ]);
      } finally {
        setLoadingCategorias(false);
      }
    };

    carregarCategorias();
  }, []);

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const inStock = products.filter(p => p.estoque > 10).length;
    const lowStock = products.filter(p => p.estoque > 0 && p.estoque <= 10).length;
    const outOfStock = products.filter(p => p.estoque === 0).length;
    const totalValue = products.reduce((sum, p) => sum + (p.preco * p.estoque), 0);
    const totalItems = products.reduce((sum, p) => sum + p.estoque, 0);

    return {
      totalProducts,
      inStock,
      lowStock,
      outOfStock,
      totalValue,
      totalItems,
      averageStock: totalProducts > 0 ? Math.round(totalItems / totalProducts) : 0
    };
  }, [products]);

  // Filtrar produtos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro de busca
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(searchLower) ||
        p.categoria?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de status
    switch (filterStatus) {
      case 'in_stock':
        filtered = filtered.filter(p => p.estoque > 10);
        break;
      case 'low':
        filtered = filtered.filter(p => p.estoque > 0 && p.estoque <= 10);
        break;
      case 'out':
        filtered = filtered.filter(p => p.estoque === 0);
        break;
    }

    return filtered;
  }, [products, searchTerm, filterStatus]);

  // Gerar alertas
  const alerts: StockAlert[] = useMemo(() => {
    return products
      .filter(p => p.estoque <= 10)
      .map(p => ({
        id: p.id,
        productId: p.id,
        productName: p.nome,
        currentStock: p.estoque,
        minStock: 5,
        alertLevel: p.estoque === 0 ? 'critical' : p.estoque <= 3 ? 'warning' : 'low',
        suggestion: p.estoque === 0 
          ? 'Reabastecer imediatamente!'
          : `Recomendado: adicionar ${10 - p.estoque} unidades`
      }))
      .sort((a, b) => a.currentStock - b.currentStock);
  }, [products]);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { label: 'Esgotado', color: 'text-red-600 bg-red-100', icon: XCircle };
    if (stock <= 3) return { label: 'Crítico', color: 'text-orange-600 bg-orange-100', icon: AlertTriangle };
    if (stock <= 10) return { label: 'Baixo', color: 'text-yellow-600 bg-yellow-100', icon: TrendingDown };
    return { label: 'Normal', color: 'text-green-600 bg-green-100', icon: CheckCircle };
  };

  const handleEditStock = (product: any) => {
    setEditingProduct({ ...product, newStock: product.estoque });
    setShowEditDialog(true);
  };

  const handleSaveStock = async () => {
    if (!editingProduct) return;

    if (editingProduct.newStock < 0) {
      toast.error('Estoque não pode ser negativo');
      return;
    }

    try {
      toast.loading('Atualizando estoque...', { id: 'edit-stock' });
      
      const result = await updateProduct(editingProduct.id, { estoque: editingProduct.newStock });
      
      if (result) {
        toast.success(`✅ Estoque atualizado com sucesso!`, { id: 'edit-stock' });
        
        // Log da edição
        console.log('Estoque editado:', {
          produto: editingProduct.nome,
          estoqueAnterior: editingProduct.estoque,
          novoEstoque: editingProduct.newStock
        });
        
        setShowEditDialog(false);
        setEditingProduct(null);
      } else {
        toast.error('Erro ao atualizar produto', { id: 'edit-stock' });
      }
    } catch (error) {
      console.error('Erro ao editar estoque:', error);
      toast.error(`Erro ao atualizar estoque: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: 'edit-stock' });
    }
  };

  const handleOpenMovement = (product: any) => {
    setSelectedProduct(product);
    setMovementType('entrada');
    setMovementQuantity('');
    setMovementReason('');
    setShowMovementDialog(true);
  };

  const handleSaveMovement = async () => {
    if (!selectedProduct || !movementQuantity) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const quantity = parseInt(movementQuantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('Quantidade deve ser um número maior que zero');
      return;
    }

    let newStock = selectedProduct.estoque;
    
    switch (movementType) {
      case 'entrada':
        newStock += quantity;
        break;
      case 'saida':
        newStock -= quantity;
        if (newStock < 0) {
          toast.error('Não é possível remover mais itens do que existe em estoque');
          return;
        }
        break;
      case 'ajuste':
        newStock = quantity;
        break;
    }

    try {
      toast.loading('Registrando movimentação...', { id: 'movement' });
      
      const result = await updateProduct(selectedProduct.id, { estoque: newStock });
      
      if (result) {
        toast.success(`✅ Movimentação registrada com sucesso!`, { id: 'movement' });
        
        // Log da movimentação
        console.log('Movimentação realizada:', {
          produto: selectedProduct.nome,
          tipo: movementType,
          quantidade: quantity,
          estoqueAnterior: selectedProduct.estoque,
          novoEstoque: newStock,
          motivo: movementReason
        });
        
        setShowMovementDialog(false);
        setSelectedProduct(null);
        setMovementQuantity('');
        setMovementReason('');
      } else {
        toast.error('Erro ao atualizar produto', { id: 'movement' });
      }
    } catch (error) {
      console.error('Erro na movimentação:', error);
      toast.error(`Erro ao registrar movimentação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: 'movement' });
    }
  };

  const handleEditFullProduct = (product: any) => {
    setProductToEdit({ ...product });
    setShowFullEditDialog(true);
  };

  const handleSaveFullProduct = async () => {
    if (!productToEdit) return;

    try {
      toast.loading('Salvando produto...', { id: 'edit-full-product' });
      
      const result = await updateProduct(productToEdit.id, {
        nome: productToEdit.nome,
        descricao: productToEdit.descricao,
        preco: parseFloat(productToEdit.preco),
        categoria: productToEdit.categoria,
        estoque: parseInt(productToEdit.estoque),
        imagemUrl: productToEdit.imagemUrl,
        destaque: productToEdit.destaque || false,
        promocao: productToEdit.promocao || false,
        lancamento: productToEdit.lancamento || false
      });
      
      if (result) {
        toast.success(`✅ Produto "${productToEdit.nome}" atualizado com sucesso!`, { id: 'edit-full-product' });
        
        console.log('Produto editado:', {
          id: productToEdit.id,
          nome: productToEdit.nome,
          preco: productToEdit.preco,
          categoria: productToEdit.categoria,
          estoque: productToEdit.estoque
        });
        
        setShowFullEditDialog(false);
        setProductToEdit(null);
      } else {
        toast.error('Erro ao atualizar produto', { id: 'edit-full-product' });
      }
    } catch (error) {
      console.error('Erro ao editar produto:', error);
      toast.error(`Erro ao editar produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: 'edit-full-product' });
    }
  };

  const handleDeleteProduct = (product: any) => {
    setProductToDelete(product);
    setShowDeleteDialog(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      toast.loading('Excluindo produto...', { id: 'delete-product' });
      
      const success = await deleteProduct(productToDelete.id);
      
      if (success) {
        toast.success(`✅ Produto "${productToDelete.nome}" excluído com sucesso!`, { id: 'delete-product' });
        
        console.log('Produto excluído:', {
          id: productToDelete.id,
          nome: productToDelete.nome,
          estoque: productToDelete.estoque,
          categoria: productToDelete.categoria
        });
        
        setShowDeleteDialog(false);
        setProductToDelete(null);
      } else {
        toast.error('Erro ao excluir produto', { id: 'delete-product' });
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error(`Erro ao excluir produto: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, { id: 'delete-product' });
    }
  };

  const exportStockReport = () => {
    const csvContent = [
      ['Produto', 'Categoria', 'Estoque', 'Status', 'Valor Unitário', 'Valor Total'],
      ...filteredProducts.map(p => [
        p.nome || 'Sem nome',
        p.categoria || 'N/A',
        p.estoque || 0,
        getStockStatus(p.estoque || 0).label,
        (p.preco || 0).toFixed(2),
        ((p.preco || 0) * (p.estoque || 0)).toFixed(2)
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `estoque-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Relatório exportado com sucesso!');
  };

  return (
    <div className="space-y-6">
      {/* Seção de Teste/Debug */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">🧪 Área de Teste - Controle de Estoque</h3>
            <p className="text-sm text-blue-700">Use os botões abaixo para testar as funcionalidades</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                console.log('=== DEBUG ESTOQUE ===');
                console.log('Produtos carregados:', products.length);
                console.log('Hook useProducts:', { products, loading, error });
                console.log('Função updateProduct existe:', typeof updateProduct);
                toast.info(`Debug: ${products.length} produtos carregados`);
              }}
            >
              🔍 Debug Sistema
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (products.length > 0) {
                  const firstProduct = products[0];
                  handleOpenMovement(firstProduct);
                  toast.info(`Teste: Abrindo movimentação para ${firstProduct.nome}`);
                } else {
                  toast.error('Nenhum produto encontrado para teste');
                }
              }}
            >
              🧪 Teste Movimentar
            </Button>
          </div>
        </div>
      </Card>

      {/* Header com estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-700">Produtos</p>
              <p className="text-2xl font-bold text-blue-900">{stats.totalProducts}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-700">Em Estoque</p>
              <p className="text-2xl font-bold text-green-900">{stats.inStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-600 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-yellow-700">Estoque Baixo</p>
              <p className="text-2xl font-bold text-yellow-900">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 rounded-lg">
              <XCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-red-700">Esgotados</p>
              <p className="text-2xl font-bold text-red-900">{stats.outOfStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600 rounded-lg">
              <Archive className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-700">Total Itens</p>
              <p className="text-2xl font-bold text-purple-900">{stats.totalItems}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-orange-600 rounded-lg">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-orange-700">Valor Total</p>
              <p className="text-xl font-bold text-orange-900">R$ {(stats.totalValue || 0).toFixed(2)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Package className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="alerts">
            <Bell className="w-4 h-4 mr-2" />
            Alertas ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="movements">
            <History className="w-4 h-4 mr-2" />
            Movimentações
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          {/* Barra de ferramentas */}
          <Card className="p-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                <SelectTrigger className="w-full lg:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="in_stock">Em Estoque</SelectItem>
                  <SelectItem value="low">Estoque Baixo</SelectItem>
                  <SelectItem value="out">Esgotados</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={exportStockReport} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </Card>

          {/* Lista de produtos */}
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const status = getStockStatus(product.estoque);
              const StatusIcon = status.icon;
              const stockPercentage = Math.min((product.estoque / 50) * 100, 100);

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="flex flex-col md:flex-row gap-4 p-4">
                      {/* Imagem */}
                      <div className="w-full md:w-24 h-24 flex-shrink-0 relative overflow-hidden rounded-lg bg-gray-100">
                        <img
                          src={product.imagemUrl || '/placeholder.svg'}
                          alt={product.nome}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Informações */}
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{product.nome}</h3>
                            <p className="text-sm text-gray-600">{product.categoria}</p>
                          </div>
                          <Badge className={cn('flex items-center gap-1', status.color)}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                          </Badge>
                        </div>

                        {/* Progress bar */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Estoque</span>
                            <span className="font-semibold">{product.estoque} unidades</span>
                          </div>
                          <Progress value={stockPercentage} className="h-2" />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Preço: </span>
                              <span className="font-semibold">R$ {(product.preco || 0).toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Valor Total: </span>
                              <span className="font-semibold text-green-600">
                                R$ {((product.preco || 0) * (product.estoque || 0)).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleEditFullProduct(product)}
                              className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Editar Produto
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenMovement(product)}
                              className="hover:bg-blue-50 hover:border-blue-300"
                            >
                              <History className="w-4 h-4 mr-1" />
                              Movimentar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleEditStock(product)}
                              className="hover:bg-green-50 hover:border-green-300"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Ajustar Estoque
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteProduct(product)}
                              className="hover:bg-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Excluir
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                console.log('Produto para debug:', product);
                                toast.info(`Debug: ${product.nome} - Estoque: ${product.estoque}`);
                              }}
                            >
                              🐛 Debug
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Alertas */}
        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Tudo em ordem!</h3>
                <p className="text-gray-600">Não há alertas de estoque no momento.</p>
              </div>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className={cn(
                'border-l-4',
                alert.alertLevel === 'critical' ? 'border-l-red-500 bg-red-50' :
                alert.alertLevel === 'warning' ? 'border-l-orange-500 bg-orange-50' :
                'border-l-yellow-500 bg-yellow-50'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={cn(
                          'w-5 h-5',
                          alert.alertLevel === 'critical' ? 'text-red-600' :
                          alert.alertLevel === 'warning' ? 'text-orange-600' :
                          'text-yellow-600'
                        )} />
                        <h4 className="font-semibold">{alert.productName}</h4>
                        <Badge variant={alert.alertLevel === 'critical' ? 'destructive' : 'secondary'}>
                          {alert.alertLevel.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">
                        Estoque atual: <strong>{alert.currentStock} unidades</strong>
                      </p>
                      <p className="text-sm text-gray-600">{alert.suggestion}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => {
                        const product = products.find(p => p.id === alert.productId);
                        if (product) handleOpenMovement(product);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Reabastecer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Movimentações */}
        <TabsContent value="movements">
          <Card className="p-8">
            <div className="text-center text-gray-600">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-semibold mb-2">Histórico de Movimentações</h3>
              <p>O histórico completo de movimentações será implementado em breve.</p>
              <p className="text-sm mt-2">Todas as movimentações são registradas e auditadas.</p>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Edição Rápida */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajustar Estoque</DialogTitle>
            <DialogDescription>
              Edite rapidamente a quantidade em estoque
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <div className="space-y-4">
              <div>
                <Label>Produto</Label>
                <p className="font-semibold">{editingProduct.nome}</p>
              </div>
              <div>
                <Label>Estoque Atual</Label>
                <p className="text-2xl font-bold text-blue-600">{editingProduct.estoque} unidades</p>
              </div>
              <div>
                <Label htmlFor="newStock">Novo Estoque</Label>
                <Input
                  id="newStock"
                  type="number"
                  min="0"
                  value={editingProduct.newStock}
                  onChange={(e) => setEditingProduct({ ...editingProduct, newStock: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStock}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Movimentação */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentação de Estoque</DialogTitle>
            <DialogDescription>
              Registre entrada, saída ou ajuste de estoque com motivo
            </DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4">
              <div>
                <Label>Produto</Label>
                <p className="font-semibold">{selectedProduct.nome}</p>
                <p className="text-sm text-gray-600">Estoque atual: {selectedProduct.estoque} unidades</p>
              </div>

              <div>
                <Label>Tipo de Movimentação</Label>
                <Select value={movementType} onValueChange={(v: any) => setMovementType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <Plus className="w-4 h-4 inline mr-2" />
                      Entrada (Adicionar)
                    </SelectItem>
                    <SelectItem value="saida">
                      <Minus className="w-4 h-4 inline mr-2" />
                      Saída (Remover)
                    </SelectItem>
                    <SelectItem value="ajuste">
                      <Edit className="w-4 h-4 inline mr-2" />
                      Ajuste (Definir)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantidade</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  placeholder="Digite a quantidade"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="reason">Motivo/Observação</Label>
                <Textarea
                  id="reason"
                  placeholder="Ex: Compra de fornecedor, venda, ajuste de inventário..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                />
              </div>

              {movementQuantity && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-700">Estoque será:</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {movementType === 'entrada' && `${selectedProduct.estoque} + ${movementQuantity} = ${selectedProduct.estoque + parseInt(movementQuantity)}`}
                      {movementType === 'saida' && `${selectedProduct.estoque} - ${movementQuantity} = ${Math.max(0, selectedProduct.estoque - parseInt(movementQuantity))}`}
                      {movementType === 'ajuste' && `${movementQuantity} unidades`}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveMovement} disabled={!movementQuantity}>
              <Save className="w-4 h-4 mr-2" />
              Registrar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Edição Completa do Produto */}
      <Dialog open={showFullEditDialog} onOpenChange={setShowFullEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-purple-600">
              <Edit className="w-5 h-5" />
              Editar Produto Completo
            </DialogTitle>
            <DialogDescription>
              Edite todos os dados do produto: nome, categoria, preço, estoque, descrição e badges
            </DialogDescription>
          </DialogHeader>
          
          {productToEdit && (
            <div className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="edit-nome" className="text-sm font-medium">
                  Nome do Produto *
                </Label>
                <Input
                  id="edit-nome"
                  value={productToEdit.nome || ''}
                  onChange={(e) => setProductToEdit({ ...productToEdit, nome: e.target.value })}
                  placeholder="Ex: Carrinho Hot Wheels"
                  className="w-full"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-2">
                <Label htmlFor="edit-categoria" className="text-sm font-medium">
                  Categoria *
                </Label>
                <Select
                  value={productToEdit.categoria || ''}
                  onValueChange={(value) => setProductToEdit({ ...productToEdit, categoria: value })}
                  disabled={loadingCategorias}
                >
                  <SelectTrigger id="edit-categoria">
                    <SelectValue placeholder={loadingCategorias ? "Carregando categorias..." : "Selecione uma categoria"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDisponiveis
                      .filter(cat => cat.ativo !== false) // Filtrar apenas categorias ativas
                      .map((cat) => (
                        <SelectItem key={cat.id} value={cat.nome}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preço e Estoque */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-preco" className="text-sm font-medium">
                    Preço (R$) *
                  </Label>
                  <Input
                    id="edit-preco"
                    type="number"
                    step="0.01"
                    min="0"
                    value={productToEdit.preco || ''}
                    onChange={(e) => setProductToEdit({ ...productToEdit, preco: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-estoque" className="text-sm font-medium">
                    Estoque *
                  </Label>
                  <Input
                    id="edit-estoque"
                    type="number"
                    min="0"
                    value={productToEdit.estoque || ''}
                    onChange={(e) => setProductToEdit({ ...productToEdit, estoque: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="edit-descricao" className="text-sm font-medium">
                  Descrição
                </Label>
                <Textarea
                  id="edit-descricao"
                  value={productToEdit.descricao || ''}
                  onChange={(e) => setProductToEdit({ ...productToEdit, descricao: e.target.value })}
                  placeholder="Descrição do produto..."
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Upload de Imagem */}
              <EnhancedImageUpload
                value={productToEdit.imagemUrl || ''}
                onChange={(imageUrl) => setProductToEdit({ ...productToEdit, imagemUrl: imageUrl })}
                label="Imagem do Produto"
                placeholder="Cole uma URL ou faça upload de uma imagem"
                showPreview={true}
                maxSize={10}
                className="w-full"
              />

              {/* Status e Badges */}
              <div className="space-y-4">
                <Label className="text-sm font-medium">Status e Badges</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Destaque */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                          <Star className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Destaque</p>
                          <p className="text-xs text-gray-500">Produto em destaque</p>
                        </div>
                      </div>
                      <Switch
                        checked={productToEdit.destaque || false}
                        onCheckedChange={(checked) => 
                          setProductToEdit({ ...productToEdit, destaque: checked })
                        }
                      />
                    </div>
                  </Card>

                  {/* Promoção */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <Tag className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Promoção</p>
                          <p className="text-xs text-gray-500">Em promoção</p>
                        </div>
                      </div>
                      <Switch
                        checked={productToEdit.promocao || false}
                        onCheckedChange={(checked) => 
                          setProductToEdit({ ...productToEdit, promocao: checked })
                        }
                      />
                    </div>
                  </Card>

                  {/* Lançamento */}
                  <Card className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Sparkles className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Lançamento</p>
                          <p className="text-xs text-gray-500">Produto novo</p>
                        </div>
                      </div>
                      <Switch
                        checked={productToEdit.lancamento || false}
                        onCheckedChange={(checked) => 
                          setProductToEdit({ ...productToEdit, lancamento: checked })
                        }
                      />
                    </div>
                  </Card>
                </div>
              </div>

              {/* Preview dos Valores */}
              <Card className="bg-purple-50 border-purple-200">
                <CardContent className="p-4 space-y-2">
                  <p className="text-sm font-medium text-purple-900">📊 Preview:</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Nome:</span>
                      <p className="font-medium">{productToEdit.nome || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Categoria:</span>
                      <p className="font-medium">{productToEdit.categoria || '-'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Preço:</span>
                      <p className="font-medium text-green-600">
                        R$ {parseFloat(productToEdit.preco || 0).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Estoque:</span>
                      <p className="font-medium text-blue-600">
                        {productToEdit.estoque || 0} unidades
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Valor Total em Estoque:</span>
                      <p className="font-bold text-purple-600 text-lg">
                        R$ {((parseFloat(productToEdit.preco || 0)) * (parseInt(productToEdit.estoque || 0))).toFixed(2)}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Badges Ativos:</span>
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {productToEdit.destaque && (
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                            <Star className="w-3 h-3 mr-1" />
                            Destaque
                          </Badge>
                        )}
                        {productToEdit.promocao && (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            <Tag className="w-3 h-3 mr-1" />
                            Promoção
                          </Badge>
                        )}
                        {productToEdit.lancamento && (
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Lançamento
                          </Badge>
                        )}
                        {!productToEdit.destaque && !productToEdit.promocao && !productToEdit.lancamento && (
                          <span className="text-sm text-gray-400 italic">Nenhum badge ativo</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFullEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveFullProduct}
              disabled={!productToEdit?.nome || !productToEdit?.categoria || !productToEdit?.preco}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Exclusão
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p className="text-base">
                Tem certeza que deseja excluir o produto{' '}
                <span className="font-semibold text-gray-900">"{productToDelete?.nome}"</span>?
              </p>
              
              {productToDelete && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Categoria:</span>
                      <span className="font-medium">{productToDelete.categoria}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Estoque atual:</span>
                      <span className="font-medium">{productToDelete.estoque} unidades</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Preço:</span>
                      <span className="font-medium">R$ {(productToDelete.preco || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Valor total em estoque:</span>
                      <span className="font-medium text-red-600">
                        R$ {((productToDelete.preco || 0) * (productToDelete.estoque || 0)).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <p className="text-sm text-red-600 font-medium">
                ⚠️ Esta ação não pode ser desfeita! O produto será removido permanentemente do sistema.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductToDelete(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteProduct}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Sim, Excluir Produto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
