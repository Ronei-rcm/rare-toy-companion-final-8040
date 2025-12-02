import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp,
  Mic,
  Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface SearchSuggestion {
  id: string;
  term: string;
  type: 'recent' | 'popular' | 'product';
  count?: number;
}

interface QuickSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  showSuggestions?: boolean;
  className?: string;
}

const STORAGE_KEY = 'search_history';
const MAX_HISTORY = 5;

export default function QuickSearchBar({
  placeholder = 'Buscar produtos...',
  onSearch,
  showSuggestions = true,
  className
}: QuickSearchBarProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popular searches (em produção, viriam da API)
  const popularSearches: SearchSuggestion[] = [
    { id: '1', term: 'Toy Story', type: 'popular', count: 1234 },
    { id: '2', term: 'Hot Wheels', type: 'popular', count: 890 },
    { id: '3', term: 'Bonecos de Ação', type: 'popular', count: 567 },
    { id: '4', term: 'Colecionáveis', type: 'popular', count: 432 }
  ];

  useEffect(() => {
    // Carregar histórico de buscas
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const history = JSON.parse(stored);
        setRecentSearches(Array.isArray(history) ? history : []);
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    }
  }, []);

  useEffect(() => {
    if (query.length >= 2 && isFocused) {
      // Simular busca de sugestões (em produção, seria uma chamada à API)
      const filtered = popularSearches.filter(s =>
        s.term.toLowerCase().includes(query.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  }, [query, isFocused]);

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;

    // Salvar no histórico
    const newHistory = [
      searchQuery,
      ...recentSearches.filter(s => s !== searchQuery)
    ].slice(0, MAX_HISTORY);
    
    setRecentSearches(newHistory);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Erro ao salvar histórico:', error);
    }

    // Navegar ou chamar callback
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      navigate(`/loja?search=${encodeURIComponent(searchQuery)}`);
    }

    setIsFocused(false);
    setQuery('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const clearHistory = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erro ao limpar histórico:', error);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.term);
    handleSearch(suggestion.term);
  };

  const handleRecentClick = (term: string) => {
    setQuery(term);
    handleSearch(term);
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyPress={handleKeyPress}
          className="pl-10 pr-20"
        />
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={clearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => handleSearch()}
          >
            <Search className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Sugestões */}
      <AnimatePresence>
        {isFocused && showSuggestions && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-96 overflow-y-auto"
          >
            {/* Buscas recentes */}
            {recentSearches.length > 0 && query.length < 2 && (
              <div className="p-3 border-b">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Buscas Recentes</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={clearHistory}
                  >
                    Limpar
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((term, index) => (
                    <button
                      key={index}
                      onClick={() => handleRecentClick(term)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center gap-2"
                    >
                      <Clock className="h-3 w-3 text-gray-400" />
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sugestões */}
            {query.length >= 2 && suggestions.length > 0 && (
              <div className="p-3">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>Sugestões</span>
                </div>
                <div className="space-y-1">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
                    >
                      <span>{suggestion.term}</span>
                      {suggestion.count && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Buscas populares */}
            {query.length < 2 && (
              <div className="p-3 border-t">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <TrendingUp className="h-3 w-3" />
                  <span>Buscas Populares</span>
                </div>
                <div className="space-y-1">
                  {popularSearches.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded flex items-center justify-between"
                    >
                      <span>{suggestion.term}</span>
                      {suggestion.count && (
                        <Badge variant="secondary" className="text-xs">
                          {suggestion.count}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nenhum resultado */}
            {query.length >= 2 && suggestions.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                Nenhuma sugestão encontrada para "{query}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

