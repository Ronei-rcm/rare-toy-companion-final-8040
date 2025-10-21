import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Grid, 
  List, 
  Filter, 
  Search, 
  SlidersHorizontal,
  ChevronDown,
  Star,
  Tag,
  Zap,
  Package,
  Eye,
  ShoppingCart,
  Heart,
  TrendingUp,
  Clock,
  Sparkles,
  X,
  Check,
  DollarSign,
  BarChart3,
  Layers,
  ArrowUpDown,
  RefreshCw,
  Archive,
  TrendingDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/hooks/useProducts';
import { StockControlPanel } from './StockControlPanel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ProductFilters {
  search: string;
  categories: string[];
  priceRange: [number, number];
  inStock: boolean;
  onSale: boolean;
  featured: boolean;
  new: boolean;
  sortBy: 'name' | 'price_asc' | 'price_desc' | 'newest' | 'popular';
}

export function AdvancedProductsView() {
  const { products, loading, error } = useProducts();
  const [activeMainTab, setActiveMainTab] = useState<'products' | 'stock'>('products');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    categories: [],
    priceRange: [0, 10000],
    inStock: false,
    onSale: false,
    featured: false,
    new: false,
    sortBy: 'newest'
  });

  // Categorias únicas
  const categories = useMemo(() => {
    const cats = new Set<string>();
    products.forEach(p => {
      if (p.categoria) cats.add(p.categoria);
    });
    return Array.from(cats).sort();
  }, [products]);

  // Filtrar e ordenar produtos
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Filtro de busca
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.nome.toLowerCase().includes(searchLower) ||
        p.categoria?.toLowerCase().includes(searchLower) ||
        p.descricao?.toLowerCase().includes(searchLower)
      );
    }

    // Filtro de categorias
    if (filters.categories.length > 0) {
      filtered = filtered.filter(p => 
        p.categoria && filters.categories.includes(p.categoria)
      );
    }

    // Filtro de preço
    filtered = filtered.filter(p => 
      p.preco >= filters.priceRange[0] && p.preco <= filters.priceRange[1]
    );

    // Filtro de estoque
    if (filters.inStock) {
      filtered = filtered.filter(p => p.estoque > 0);
    }

    // Filtro de promoção
    if (filters.onSale) {
      filtered = filtered.filter(p => p.promocao);
    }

    // Filtro de destaque
    if (filters.featured) {
      filtered = filtered.filter(p => p.destaque);
    }

    // Filtro de novos
    if (filters.new) {
      filtered = filtered.filter(p => p.lancamento);
    }

    // Ordenação
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case 'price_asc':
        filtered.sort((a, b) => a.preco - b.preco);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.preco - a.preco);
        break;
      case 'newest':
        filtered.sort((a, b) => {
          if (a.lancamento && !b.lancamento) return -1;
          if (!a.lancamento && b.lancamento) return 1;
          return 0;
        });
        break;
      case 'popular':
        filtered.sort((a, b) => {
          const aScore = (a.destaque ? 10 : 0) + (a.promocao ? 5 : 0);
          const bScore = (b.destaque ? 10 : 0) + (b.promocao ? 5 : 0);
          return bScore - aScore;
        });
        break;
    }

    return filtered;
  }, [products, filters]);

  // Estatísticas
  const stats = useMemo(() => {
    return {
      total: products.length,
      filtered: filteredProducts.length,
      featured: products.filter(p => p.destaque).length,
      onSale: products.filter(p => p.promocao).length,
      new: products.filter(p => p.lancamento).length,
      inStock: products.filter(p => p.estoque > 0).length,
      lowStock: products.filter(p => p.estoque > 0 && p.estoque <= 10).length,
      outOfStock: products.filter(p => p.estoque === 0).length
    };
  }, [products, filteredProducts]);

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      categories: [],
      priceRange: [0, 10000],
      inStock: false,
      onSale: false,
      featured: false,
      new: false,
      sortBy: 'newest'
    });
  };

  const activeFiltersCount = 
    filters.categories.length +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.new ? 1 : 0);

  if (error) {
    return (
      <Card className="p-8">
        <div className="text-center text-red-600">
          <p className="font-semibold">Erro ao carregar produtos</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tabs principais */}
      <Tabs value={activeMainTab} onValueChange={(v: any) => setActiveMainTab(v)}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="products" className="gap-2">
            <Package className="w-4 h-4" />
            Gerenciar Produtos
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Archive className="w-4 h-4" />
            Controle de Estoque
            {stats.lowStock > 0 && (
              <Badge className="ml-2 bg-red-500">{stats.lowStock}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="space-y-6">
            {/* Header com estatísticas */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Em Estoque</p>
              <p className="text-xl font-bold">{stats.inStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Destaques</p>
              <p className="text-xl font-bold">{stats.featured}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <Tag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Promoções</p>
              <p className="text-xl font-bold">{stats.onSale}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Novos</p>
              <p className="text-xl font-bold">{stats.new}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Baixo</p>
              <p className="text-xl font-bold">{stats.lowStock}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Filter className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Filtrados</p>
              <p className="text-xl font-bold">{stats.filtered}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de ferramentas */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar produtos por nome, categoria, descrição..."
              className="pl-10"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>

          {/* Ordenação */}
          <Select
            value={filters.sortBy}
            onValueChange={(value: any) => setFilters(prev => ({ ...prev, sortBy: value }))}
          >
            <SelectTrigger className="w-full lg:w-48">
              <ArrowUpDown className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">
                <Clock className="w-4 h-4 inline mr-2" />
                Mais recentes
              </SelectItem>
              <SelectItem value="popular">
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Mais populares
              </SelectItem>
              <SelectItem value="name">
                <Layers className="w-4 h-4 inline mr-2" />
                Nome (A-Z)
              </SelectItem>
              <SelectItem value="price_asc">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Menor preço
              </SelectItem>
              <SelectItem value="price_desc">
                <DollarSign className="w-4 h-4 inline mr-2" />
                Maior preço
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Visualização */}
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)} className="w-full lg:w-auto">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="grid" className="gap-2">
                <Grid className="w-4 h-4" />
                Grade
              </TabsTrigger>
              <TabsTrigger value="list" className="gap-2">
                <List className="w-4 h-4" />
                Lista
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Botão de filtros */}
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 bg-red-500">{activeFiltersCount}</Badge>
            )}
          </Button>
        </div>

        {/* Painel de filtros */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 pt-4 border-t overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Categorias */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Categorias
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {categories.map((category) => (
                      <label key={category} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <Checkbox
                          checked={filters.categories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <span className="text-sm">{category}</span>
                        <span className="text-xs text-gray-500 ml-auto">
                          ({products.filter(p => p.categoria === category).length})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Faixa de preço */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Faixa de Preço
                  </h4>
                  <div className="space-y-4">
                    <Slider
                      min={0}
                      max={10000}
                      step={100}
                      value={filters.priceRange}
                      onValueChange={(value: any) => setFilters(prev => ({ ...prev, priceRange: value }))}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span>R$ {filters.priceRange[0].toFixed(0)}</span>
                      <span>R$ {filters.priceRange[1].toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Filtros rápidos */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Filtros Rápidos
                  </h4>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <Checkbox
                        checked={filters.inStock}
                        onCheckedChange={(checked: any) => setFilters(prev => ({ ...prev, inStock: checked }))}
                      />
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Somente em estoque</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <Checkbox
                        checked={filters.onSale}
                        onCheckedChange={(checked: any) => setFilters(prev => ({ ...prev, onSale: checked }))}
                      />
                      <Tag className="w-4 h-4 text-red-600" />
                      <span className="text-sm">Em promoção</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <Checkbox
                        checked={filters.featured}
                        onCheckedChange={(checked: any) => setFilters(prev => ({ ...prev, featured: checked }))}
                      />
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm">Destaques</span>
                    </label>
                    
                    <label className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <Checkbox
                        checked={filters.new}
                        onCheckedChange={(checked: any) => setFilters(prev => ({ ...prev, new: checked }))}
                      />
                      <Zap className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Lançamentos</span>
                    </label>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex flex-col gap-2">
                  <h4 className="font-semibold mb-3">Ações</h4>
                  <Button variant="outline" onClick={clearFilters} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Limpar Filtros
                  </Button>
                  <div className="text-sm text-gray-600 mt-2">
                    {activeFiltersCount > 0 && (
                      <p>{activeFiltersCount} filtro(s) ativo(s)</p>
                    )}
                    <p className="mt-1">{filteredProducts.length} produto(s) encontrado(s)</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Grid/Lista de produtos */}
      {loading ? (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="w-full h-64" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-600 mb-4">
              Tente ajustar os filtros ou realizar uma nova busca
            </p>
            <Button onClick={clearFilters} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </Card>
      ) : (
        <div className={cn(
          "grid gap-6",
          viewMode === 'grid' 
            ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "grid-cols-1"
        )}>
          <AnimatePresence>
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                  {viewMode === 'grid' ? (
                    <>
                      {/* Vista em Grade */}
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        <img
                          src={product.imagemUrl || '/placeholder.svg'}
                          alt={product.nome}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        
                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {product.destaque && (
                            <Badge className="bg-yellow-500 text-white">
                              <Star className="w-3 h-3 mr-1" />
                              Destaque
                            </Badge>
                          )}
                          {product.promocao && (
                            <Badge className="bg-red-500 text-white">
                              <Tag className="w-3 h-3 mr-1" />
                              Promoção
                            </Badge>
                          )}
                          {product.lancamento && (
                            <Badge className="bg-purple-500 text-white">
                              <Zap className="w-3 h-3 mr-1" />
                              Novo
                            </Badge>
                          )}
                        </div>

                        {/* Ações rápidas */}
                        <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="secondary" className="rounded-full">
                            <Heart className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="secondary" className="rounded-full">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>

                        {/* Estoque */}
                        {product.estoque <= 0 && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                            <Badge variant="destructive" className="text-lg px-4 py-2">
                              Esgotado
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm text-gray-600">{product.categoria}</p>
                            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                              {product.nome}
                            </h3>
                          </div>

                          <div className="flex items-end justify-between">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                R$ {product.preco.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Estoque: {product.estoque}
                              </p>
                            </div>
                            
                            <Button 
                              size="icon" 
                              className="rounded-full"
                              disabled={product.estoque <= 0}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </>
                  ) : (
                    <>
                      {/* Vista em Lista */}
                      <div className="flex gap-4 p-4">
                        <div className="w-32 h-32 flex-shrink-0 relative overflow-hidden rounded-lg bg-gray-100">
                          <img
                            src={product.imagemUrl || '/placeholder.svg'}
                            alt={product.nome}
                            className="w-full h-full object-cover"
                          />
                          
                          {product.estoque <= 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <Badge variant="destructive" className="text-xs">
                                Esgotado
                              </Badge>
                            </div>
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm text-gray-600">{product.categoria}</p>
                              <h3 className="font-semibold text-lg">{product.nome}</h3>
                            </div>
                            
                            <div className="flex gap-1">
                              {product.destaque && (
                                <Badge variant="secondary">
                                  <Star className="w-3 h-3" />
                                </Badge>
                              )}
                              {product.promocao && (
                                <Badge variant="destructive">
                                  <Tag className="w-3 h-3" />
                                </Badge>
                              )}
                              {product.lancamento && (
                                <Badge className="bg-purple-500">
                                  <Zap className="w-3 h-3" />
                                </Badge>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 line-clamp-2">
                            {product.descricao}
                          </p>

                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-primary">
                                R$ {product.preco.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Estoque: {product.estoque} unidades
                              </p>
                            </div>

                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </Button>
                              <Button size="sm" disabled={product.estoque <= 0}>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Comprar
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
          </div>
        </TabsContent>

        <TabsContent value="stock">
          <StockControlPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
