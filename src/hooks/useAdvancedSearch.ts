import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

interface SearchFilters {
  category?: string;
  priceRange?: [number, number];
  brand?: string[];
  rating?: number;
  inStock?: boolean;
  discount?: boolean;
  tags?: string[];
  sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'rating' | 'newest' | 'popular';
}

interface SearchSuggestion {
  text: string;
  type: 'product' | 'category' | 'brand' | 'tag';
  count?: number;
  highlighted?: boolean;
}

interface SearchResult {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image?: string;
  category: string;
  brand?: string;
  rating?: number;
  reviewCount?: number;
  inStock: boolean;
  tags: string[];
  relevanceScore: number;
  highlights: {
    name?: string;
    description?: string;
    tags?: string[];
  };
}

interface SearchState {
  query: string;
  results: SearchResult[];
  suggestions: SearchSuggestion[];
  filters: SearchFilters;
  isLoading: boolean;
  hasSearched: boolean;
  totalResults: number;
  searchTime: number;
  spellCheck?: {
    original: string;
    suggested: string;
    confidence: number;
  };
}

interface SearchHistory {
  query: string;
  timestamp: number;
  resultsCount: number;
  filters?: SearchFilters;
}

export function useAdvancedSearch() {
  const [searchState, setSearchState] = useState<SearchState>({
    query: '',
    results: [],
    suggestions: [],
    filters: {},
    isLoading: false,
    hasSearched: false,
    totalResults: 0,
    searchTime: 0
  });

  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const abortControllerRef = useRef<AbortController>();

  // Carregar dados iniciais
  useEffect(() => {
    loadSearchData();
  }, []);

  const loadSearchData = async () => {
    try {
      // Carregar pesquisas populares
      const popularResponse = await fetch('/api/search/popular');
      const popular = await popularResponse.json();
      setPopularSearches(popular);

      // Carregar histórico de pesquisas
      const historyData = localStorage.getItem('search_history');
      if (historyData) {
        const history = JSON.parse(historyData);
        setSearchHistory(history);
        setRecentSearches(history.slice(0, 5).map((h: SearchHistory) => h.query));
      }
    } catch (error) {
      console.error('Erro ao carregar dados de busca:', error);
    }
  };

  // Debounced search com autocomplete
  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters = {},
    options: {
      enableAutocomplete?: boolean;
      debounceMs?: number;
      limit?: number;
    } = {}
  ) => {
    const { enableAutocomplete = true, debounceMs = 300, limit = 50 } = options;

    // Cancelar busca anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Limpar timeout anterior
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Se query está vazia, mostrar sugestões populares
    if (!query.trim()) {
      setSearchState(prev => ({
        ...prev,
        query: '',
        results: [],
        suggestions: popularSearches.map(search => ({
          text: search,
          type: 'product' as const,
          highlighted: false
        })),
        hasSearched: false
      }));
      return;
    }

    // Debounce para evitar muitas requisições
    searchTimeoutRef.current = setTimeout(async () => {
      const startTime = performance.now();
      
      setSearchState(prev => ({ ...prev, isLoading: true }));

      try {
        // Buscar sugestões se habilitado
        if (enableAutocomplete && query.length >= 2) {
          const suggestionsResponse = await fetch(
            `/api/search/suggestions?q=${encodeURIComponent(query)}`,
            { signal: abortControllerRef.current.signal }
          );
          const suggestions = await suggestionsResponse.json();
          
          setSearchState(prev => ({ ...prev, suggestions }));
        }

        // Realizar busca principal
        const searchParams = new URLSearchParams({
          q: query,
          limit: limit.toString(),
          ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                acc[key] = value.join(',');
              } else {
                acc[key] = value.toString();
              }
            }
            return acc;
          }, {} as Record<string, string>)
        });

        const searchResponse = await fetch(
          `/api/search?${searchParams}`,
          { signal: abortControllerRef.current.signal }
        );

        if (!searchResponse.ok) {
          throw new Error(`Erro na busca: ${searchResponse.statusText}`);
        }

        const searchData = await searchResponse.json();
        const endTime = performance.now();

        setSearchState(prev => ({
          ...prev,
          query,
          results: searchData.results || [],
          filters,
          isLoading: false,
          hasSearched: true,
          totalResults: searchData.total || 0,
          searchTime: endTime - startTime,
          spellCheck: searchData.spellCheck
        }));

        // Salvar no histórico
        saveToHistory(query, searchData.total || 0, filters);

      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Busca foi cancelada
        }

        console.error('Erro na busca:', error);
        setSearchState(prev => ({
          ...prev,
          isLoading: false,
          results: [],
          suggestions: []
        }));
      }
    }, debounceMs);

  }, [popularSearches]);

  // Salvar busca no histórico
  const saveToHistory = useCallback((query: string, resultsCount: number, filters?: SearchFilters) => {
    const newHistoryItem: SearchHistory = {
      query,
      timestamp: Date.now(),
      resultsCount,
      filters
    };

    setSearchHistory(prev => {
      const updated = [newHistoryItem, ...prev.filter(item => item.query !== query)].slice(0, 20);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });

    setRecentSearches(prev => {
      const updated = [query, ...prev.filter(item => item !== query)].slice(0, 5);
      return updated;
    });
  }, []);

  // Busca rápida (sem debounce)
  const quickSearch = useCallback(async (query: string, filters: SearchFilters = {}) => {
    await performSearch(query, filters, { debounceMs: 0, limit: 20 });
  }, [performSearch]);

  // Busca com sugestões em tempo real
  const searchWithSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchState(prev => ({ ...prev, suggestions: [] }));
      return;
    }

    try {
      const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
      const suggestions = await response.json();
      
      setSearchState(prev => ({ ...prev, suggestions }));
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  }, []);

  // Aplicar filtros
  const applyFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...searchState.filters, ...newFilters };
    performSearch(searchState.query, updatedFilters);
  }, [searchState.filters, searchState.query, performSearch]);

  // Limpar filtros
  const clearFilters = useCallback(() => {
    performSearch(searchState.query, {});
  }, [searchState.query, performSearch]);

  // Ordenar resultados
  const sortResults = useCallback((sortBy: SearchFilters['sortBy']) => {
    const sortedResults = [...searchState.results].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          // Assumindo que há um campo de data de criação
          return 0; // Placeholder
        case 'popular':
          return (b.reviewCount || 0) - (a.reviewCount || 0);
        default:
          return b.relevanceScore - a.relevanceScore;
      }
    });

    setSearchState(prev => ({
      ...prev,
      results: sortedResults,
      filters: { ...prev.filters, sortBy }
    }));
  }, [searchState.results]);

  // Busca por voz (Web Speech API)
  const startVoiceSearch = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        reject(new Error('Speech recognition não suportado'));
        return;
      }

      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.lang = 'pt-BR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Erro no reconhecimento: ${event.error}`));
      };

      recognition.start();
    });
  }, []);

  // Busca por imagem (reverse image search)
  const searchByImage = useCallback(async (imageFile: File): Promise<SearchResult[]> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await fetch('/api/search/image', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      setSearchState(prev => ({
        ...prev,
        results: data.results || [],
        hasSearched: true,
        totalResults: data.total || 0,
        searchTime: data.searchTime || 0
      }));

      return data.results || [];
    } catch (error) {
      console.error('Erro na busca por imagem:', error);
      return [];
    }
  }, []);

  // Busca facetada (agregações)
  const getFacets = useCallback(async (query: string, filters: SearchFilters = {}) => {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        facets: 'true',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              acc[key] = value.join(',');
            } else {
              acc[key] = value.toString();
            }
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/search/facets?${searchParams}`);
      const facets = await response.json();
      
      return facets;
    } catch (error) {
      console.error('Erro ao buscar facetas:', error);
      return {};
    }
  }, []);

  // Busca semântica (usando embeddings)
  const semanticSearch = useCallback(async (query: string, filters: SearchFilters = {}) => {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        semantic: 'true',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) {
            if (Array.isArray(value)) {
              acc[key] = value.join(',');
            } else {
              acc[key] = value.toString();
            }
          }
          return acc;
        }, {} as Record<string, string>)
      });

      const response = await fetch(`/api/search/semantic?${searchParams}`);
      const data = await response.json();
      
      setSearchState(prev => ({
        ...prev,
        query,
        results: data.results || [],
        filters,
        hasSearched: true,
        totalResults: data.total || 0,
        searchTime: data.searchTime || 0
      }));

      return data.results || [];
    } catch (error) {
      console.error('Erro na busca semântica:', error);
      return [];
    }
  }, []);

  // Estatísticas de busca
  const searchStats = useMemo(() => {
    const totalSearches = searchHistory.length;
    const avgResults = searchHistory.reduce((sum, item) => sum + item.resultsCount, 0) / totalSearches;
    const mostSearched = searchHistory.reduce((acc, item) => {
      acc[item.query] = (acc[item.query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSearches,
      avgResults: Math.round(avgResults),
      mostSearchedQuery: Object.keys(mostSearched).reduce((a, b) => 
        mostSearched[a] > mostSearched[b] ? a : b, ''
      ),
      avgSearchTime: searchState.searchTime
    };
  }, [searchHistory, searchState.searchTime]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    setRecentSearches([]);
    localStorage.removeItem('search_history');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Estado
    searchState,
    searchHistory,
    recentSearches,
    popularSearches,
    
    // Ações
    performSearch,
    quickSearch,
    searchWithSuggestions,
    applyFilters,
    clearFilters,
    sortResults,
    startVoiceSearch,
    searchByImage,
    getFacets,
    semanticSearch,
    clearHistory,
    
    // Estatísticas
    searchStats
  };
}
