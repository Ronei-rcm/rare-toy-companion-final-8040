import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  X, 
  Filter, 
  Mic, 
  MicOff, 
  Camera, 
  Image as ImageIcon,
  Clock, 
  TrendingUp, 
  Sparkles,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  SortAsc,
  SortDesc,
  Star,
  MapPin,
  Tag,
  Check,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useAdvancedSearch } from '@/hooks/useAdvancedSearch';
import { toast } from 'sonner';

interface AdvancedSearchBarProps {
  placeholder?: string;
  showFilters?: boolean;
  showSuggestions?: boolean;
  showHistory?: boolean;
  maxSuggestions?: number;
  onResultClick?: (result: any) => void;
  className?: string;
}

export function AdvancedSearchBar({
  placeholder = "Buscar produtos...",
  showFilters = true,
  showSuggestions = true,
  showHistory = true,
  maxSuggestions = 8,
  onResultClick,
  className = ""
}: AdvancedSearchBarProps) {
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    category: '',
    priceRange: [0, 1000] as [number, number],
    brand: [] as string[],
    rating: 0,
    inStock: false,
    discount: false,
    sortBy: 'relevance' as const
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    searchState,
    recentSearches,
    popularSearches,
    performSearch,
    searchWithSuggestions,
    applyFilters,
    startVoiceSearch,
    searchByImage,
    searchStats
  } = useAdvancedSearch();

  // Debounced search
  useEffect(() => {
    if (inputValue.length >= 2) {
      searchWithSuggestions(inputValue);
    }
  }, [inputValue, searchWithSuggestions]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  const handleSearch = async (query: string = inputValue) => {
    if (!query.trim()) return;
    
    await performSearch(query, selectedFilters);
    setIsFocused(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    handleSearch(suggestion);
  };

  const handleVoiceSearch = async () => {
    try {
      setIsVoiceSearching(true);
      const transcript = await startVoiceSearch();
      setInputValue(transcript);
      handleSearch(transcript);
    } catch (error) {
      toast.error('Erro no reconhecimento de voz');
    } finally {
      setIsVoiceSearching(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione uma imagem válida');
      return;
    }

    try {
      await searchByImage(file);
      toast.success('Busca por imagem realizada!');
      setShowImageUpload(false);
    } catch (error) {
      toast.error('Erro na busca por imagem');
    }
  };

  const clearSearch = () => {
    setInputValue('');
    setSelectedFilters({
      category: '',
      priceRange: [0, 1000],
      brand: [],
      rating: 0,
      inStock: false,
      discount: false,
      sortBy: 'relevance'
    });
    inputRef.current?.focus();
  };

  const applyFilter = (key: string, value: any) => {
    const newFilters = { ...selectedFilters, [key]: value };
    setSelectedFilters(newFilters);
    if (inputValue) {
      performSearch(inputValue, newFilters);
    }
  };

  const getSortIcon = () => {
    switch (selectedFilters.sortBy) {
      case 'price_asc':
        return <SortAsc className="w-4 h-4" />;
      case 'price_desc':
        return <SortDesc className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const getSortLabel = () => {
    switch (selectedFilters.sortBy) {
      case 'relevance': return 'Relevância';
      case 'price_asc': return 'Menor Preço';
      case 'price_desc': return 'Maior Preço';
      case 'rating': return 'Melhor Avaliado';
      case 'newest': return 'Mais Recente';
      case 'popular': return 'Mais Popular';
      default: return 'Relevância';
    }
  };

  return (
    <div className={`relative w-full max-w-4xl mx-auto ${className}`}>
      {/* Barra de busca principal */}
      <div className="relative">
        <div className="relative flex items-center">
          <div className="absolute left-3 z-10">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            placeholder={placeholder}
            className="pl-10 pr-32 h-12 text-lg border-2 border-gray-200 focus:border-purple-500 rounded-xl"
          />
          
          <div className="absolute right-2 flex items-center gap-1">
            {/* Botão de voz */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleVoiceSearch}
              disabled={isVoiceSearching}
              className="h-8 w-8 p-0"
            >
              {isVoiceSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>

            {/* Botão de imagem */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowImageUpload(!showImageUpload);
                fileInputRef.current?.click();
              }}
              className="h-8 w-8 p-0"
            >
              <Camera className="w-4 h-4" />
            </Button>

            {/* Botão de filtros */}
            {showFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`h-8 w-8 p-0 ${showAdvancedFilters ? 'bg-purple-100 text-purple-600' : ''}`}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            )}

            {/* Botão de busca */}
            <Button
              onClick={() => handleSearch()}
              disabled={!inputValue.trim()}
              className="h-8 px-3 bg-purple-600 hover:bg-purple-700 text-white"
            >
              Buscar
            </Button>
          </div>
        </div>

        {/* Input de arquivo oculto */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>

      {/* Filtros avançados */}
      <AnimatePresence>
        {showAdvancedFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Filtros Avançados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Categoria */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Categoria</label>
                    <Select value={selectedFilters.category} onValueChange={(value) => applyFilter('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todas" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Todas</SelectItem>
                        <SelectItem value="action-figures">Action Figures</SelectItem>
                        <SelectItem value="collectibles">Colecionáveis</SelectItem>
                        <SelectItem value="games">Jogos</SelectItem>
                        <SelectItem value="accessories">Acessórios</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Faixa de preço */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Preço: R$ {selectedFilters.priceRange[0]} - R$ {selectedFilters.priceRange[1]}
                    </label>
                    <Slider
                      value={selectedFilters.priceRange}
                      onValueChange={(value) => applyFilter('priceRange', value)}
                      max={1000}
                      min={0}
                      step={10}
                      className="w-full"
                    />
                  </div>

                  {/* Avaliação mínima */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Avaliação mínima</label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant={selectedFilters.rating >= rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => applyFilter('rating', selectedFilters.rating === rating ? 0 : rating)}
                          className="h-8 w-8 p-0"
                        >
                          <Star className={`w-4 h-4 ${selectedFilters.rating >= rating ? 'text-yellow-400 fill-current' : ''}`} />
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Ordenação */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ordenar por</label>
                    <Select value={selectedFilters.sortBy} onValueChange={(value) => applyFilter('sortBy', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Relevância</SelectItem>
                        <SelectItem value="price_asc">Menor Preço</SelectItem>
                        <SelectItem value="price_desc">Maior Preço</SelectItem>
                        <SelectItem value="rating">Melhor Avaliado</SelectItem>
                        <SelectItem value="newest">Mais Recente</SelectItem>
                        <SelectItem value="popular">Mais Popular</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Checkboxes adicionais */}
                <div className="flex flex-wrap gap-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="inStock"
                      checked={selectedFilters.inStock}
                      onCheckedChange={(checked) => applyFilter('inStock', checked)}
                    />
                    <label htmlFor="inStock" className="text-sm font-medium">
                      Apenas em estoque
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="discount"
                      checked={selectedFilters.discount}
                      onCheckedChange={(checked) => applyFilter('discount', checked)}
                    />
                    <label htmlFor="discount" className="text-sm font-medium">
                      Apenas com desconto
                    </label>
                  </div>
                </div>

                {/* Filtros ativos */}
                {Object.values(selectedFilters).some(value => 
                  Array.isArray(value) ? value.length > 0 : value !== '' && value !== false && value !== 0
                ) && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-600">Filtros ativos:</span>
                      {selectedFilters.category && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {selectedFilters.category}
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => applyFilter('category', '')}
                          />
                        </Badge>
                      )}
                      {selectedFilters.rating > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {selectedFilters.rating}+ estrelas
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => applyFilter('rating', 0)}
                          />
                        </Badge>
                      )}
                      {selectedFilters.inStock && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Em estoque
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => applyFilter('inStock', false)}
                          />
                        </Badge>
                      )}
                      {selectedFilters.discount && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Com desconto
                          <X 
                            className="w-3 h-3 cursor-pointer" 
                            onClick={() => applyFilter('discount', false)}
                          />
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sugestões e histórico */}
      <AnimatePresence>
        {isFocused && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-50"
          >
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-0">
                <Tabs defaultValue="suggestions" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="suggestions">Sugestões</TabsTrigger>
                    <TabsTrigger value="recent">Recentes</TabsTrigger>
                    <TabsTrigger value="popular">Populares</TabsTrigger>
                  </TabsList>

                  <TabsContent value="suggestions" className="p-4">
                    {searchState.suggestions.length > 0 ? (
                      <div className="space-y-2">
                        {searchState.suggestions.slice(0, maxSuggestions).map((suggestion, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => handleSuggestionClick(suggestion.text)}
                          >
                            <div className="flex items-center gap-3">
                              <Search className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{suggestion.text}</span>
                              {suggestion.type === 'product' && (
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.count} produtos
                                </Badge>
                              )}
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>Digite para ver sugestões</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="recent" className="p-4">
                    {recentSearches.length > 0 ? (
                      <div className="space-y-2">
                        {recentSearches.slice(0, maxSuggestions).map((search, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                            onClick={() => handleSuggestionClick(search)}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">{search}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p>Nenhuma busca recente</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="popular" className="p-4">
                    <div className="space-y-2">
                      {popularSearches.slice(0, maxSuggestions).map((search, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                          onClick={() => handleSuggestionClick(search)}
                        >
                          <div className="flex items-center gap-3">
                            <TrendingUp className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{search}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Resultados da busca */}
      {searchState.hasSearched && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold">
                {searchState.totalResults} resultados para "{searchState.query}"
              </h3>
              <Badge variant="outline" className="text-xs">
                {searchState.searchTime.toFixed(0)}ms
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar:</span>
              <Select value={selectedFilters.sortBy} onValueChange={(value) => applyFilter('sortBy', value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevância</SelectItem>
                  <SelectItem value="price_asc">Menor Preço</SelectItem>
                  <SelectItem value="price_desc">Maior Preço</SelectItem>
                  <SelectItem value="rating">Melhor Avaliado</SelectItem>
                  <SelectItem value="newest">Mais Recente</SelectItem>
                  <SelectItem value="popular">Mais Popular</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Aqui você renderizaria os resultados da busca */}
          <div className="text-center py-8 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Implemente a renderização dos resultados aqui</p>
          </div>
        </div>
      )}
    </div>
  );
}
