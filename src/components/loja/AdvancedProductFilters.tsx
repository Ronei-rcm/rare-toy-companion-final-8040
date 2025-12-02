import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Filter, 
  X, 
  DollarSign, 
  Star, 
  Package,
  Tag,
  Sparkles,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  rating: number;
  inStock: boolean;
  onSale: boolean;
  featured: boolean;
  new: boolean;
  sortBy: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'rating';
}

interface AdvancedProductFiltersProps {
  categories: string[];
  onFiltersChange: (filters: ProductFilters) => void;
  initialFilters?: Partial<ProductFilters>;
  maxPrice?: number;
}

export default function AdvancedProductFilters({
  categories,
  onFiltersChange,
  initialFilters,
  maxPrice = 10000
}: AdvancedProductFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: initialFilters?.categories || [],
    priceRange: initialFilters?.priceRange || [0, maxPrice],
    rating: initialFilters?.rating || 0,
    inStock: initialFilters?.inStock || false,
    onSale: initialFilters?.onSale || false,
    featured: initialFilters?.featured || false,
    new: initialFilters?.new || false,
    sortBy: initialFilters?.sortBy || 'relevance'
  });

  const [isOpen, setIsOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>(
    filters.priceRange
  );

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilter = <K extends keyof ProductFilters>(
    key: K,
    value: ProductFilters[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }));
  };

  const clearFilters = () => {
    const cleared: ProductFilters = {
      categories: [],
      priceRange: [0, maxPrice],
      rating: 0,
      inStock: false,
      onSale: false,
      featured: false,
      new: false,
      sortBy: 'relevance'
    };
    setFilters(cleared);
    setPriceRange([0, maxPrice]);
  };

  const activeFiltersCount = 
    filters.categories.length +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice ? 1 : 0) +
    (filters.rating > 0 ? 1 : 0) +
    (filters.inStock ? 1 : 0) +
    (filters.onSale ? 1 : 0) +
    (filters.featured ? 1 : 0) +
    (filters.new ? 1 : 0) +
    (filters.sortBy !== 'relevance' ? 1 : 0);

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <div className="space-y-4">
      {/* Botão de toggle para mobile */}
      <div className="lg:hidden">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </div>
          <span className={cn(
            "transition-transform",
            isOpen && "rotate-180"
          )}>
            ▼
          </span>
        </Button>
      </div>

      {/* Painel de filtros */}
      <AnimatePresence>
        {(isOpen || isDesktop) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:block"
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-orange-600" />
                  Filtros
                </CardTitle>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Limpar
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Ordenação */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Ordenar por
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'relevance', label: 'Relevância', icon: Sparkles },
                      { value: 'price_asc', label: 'Menor Preço', icon: DollarSign },
                      { value: 'price_desc', label: 'Maior Preço', icon: DollarSign },
                      { value: 'newest', label: 'Mais Recente', icon: TrendingUp },
                      { value: 'popular', label: 'Mais Popular', icon: Star },
                      { value: 'rating', label: 'Melhor Avaliação', icon: Star }
                    ].map(({ value, label, icon: Icon }) => (
                      <Button
                        key={value}
                        variant={filters.sortBy === value ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateFilter('sortBy', value as ProductFilters['sortBy'])}
                        className="justify-start"
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Preço */}
                <div>
                  <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Preço
                  </Label>
                  <div className="space-y-3">
                    <Slider
                      value={priceRange}
                      onValueChange={(value) => {
                        setPriceRange(value as [number, number]);
                        updateFilter('priceRange', value as [number, number]);
                      }}
                      min={0}
                      max={maxPrice}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>R$ {priceRange[0].toFixed(2)}</span>
                      <span>R$ {priceRange[1].toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Categorias */}
                {categories.length > 0 && (
                  <>
                    <div>
                      <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Categorias
                      </Label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`filter-category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={() => toggleCategory(category)}
                            />
                            <Label
                              htmlFor={`filter-category-${category}`}
                              className="text-sm cursor-pointer flex-1"
                            >
                              {category}
                            </Label>
                            {filters.categories.includes(category) && (
                              <Badge variant="secondary" className="text-xs">
                                {filters.categories.filter(c => c === category).length}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    <Separator />
                  </>
                )}

                {/* Avaliação */}
                <div>
                  <Label className="text-sm font-medium mb-3 block flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Avaliação Mínima
                  </Label>
                  <div className="space-y-2">
                    {[4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <Checkbox
                          id={`filter-rating-${rating}`}
                          checked={filters.rating === rating}
                          onCheckedChange={(checked) =>
                            updateFilter('rating', checked ? rating : 0)
                          }
                        />
                        <Label
                          htmlFor={`filter-rating-${rating}`}
                          className="text-sm cursor-pointer flex items-center gap-1"
                        >
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3 w-3",
                                i < rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              )}
                            />
                          ))}
                          <span className="ml-1">e acima</span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filtros rápidos */}
                <div>
                  <Label className="text-sm font-medium mb-3 block">
                    Filtros Rápidos
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-stock"
                        checked={filters.inStock}
                        onCheckedChange={(checked) =>
                          updateFilter('inStock', checked === true)
                        }
                      />
                      <Label
                        htmlFor="filter-stock"
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <Package className="h-3 w-3 text-green-600" />
                        Apenas em estoque
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-sale"
                        checked={filters.onSale}
                        onCheckedChange={(checked) =>
                          updateFilter('onSale', checked === true)
                        }
                      />
                      <Label
                        htmlFor="filter-sale"
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <Tag className="h-3 w-3 text-red-600" />
                        Em promoção
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-featured"
                        checked={filters.featured}
                        onCheckedChange={(checked) =>
                          updateFilter('featured', checked === true)
                        }
                      />
                      <Label
                        htmlFor="filter-featured"
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <Sparkles className="h-3 w-3 text-yellow-600" />
                        Destaques
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="filter-new"
                        checked={filters.new}
                        onCheckedChange={(checked) =>
                          updateFilter('new', checked === true)
                        }
                      />
                      <Label
                        htmlFor="filter-new"
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        <TrendingUp className="h-3 w-3 text-blue-600" />
                        Lançamentos
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Badges de filtros ativos */}
                {hasActiveFilters && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-sm font-medium mb-2 block">
                        Filtros Ativos
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {filters.categories.map((cat) => (
                          <Badge
                            key={cat}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => toggleCategory(cat)}
                          >
                            {cat}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                        {(filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice) && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => {
                              setPriceRange([0, maxPrice]);
                              updateFilter('priceRange', [0, maxPrice]);
                            }}
                          >
                            Preço: R$ {filters.priceRange[0]} - R$ {filters.priceRange[1]}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {filters.rating > 0 && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => updateFilter('rating', 0)}
                          >
                            {filters.rating}+ estrelas
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {filters.inStock && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => updateFilter('inStock', false)}
                          >
                            Em estoque
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {filters.onSale && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => updateFilter('onSale', false)}
                          >
                            Promoção
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {filters.featured && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => updateFilter('featured', false)}
                          >
                            Destaque
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                        {filters.new && (
                          <Badge
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => updateFilter('new', false)}
                          >
                            Novo
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

