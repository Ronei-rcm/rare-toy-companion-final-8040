import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { searchApi } from '@/services/search-api';

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
  // Removido signal manual pois o request helper já lida com cancelamento se implementado, 
  // mas aqui manteremos a orquestração de debounce.

  // Carregar dados iniciais
  useEffect(() => {
    loadSearchData();
  }, []);

  const loadSearchData = async () => {
    try {
      const popular = await searchApi.getPopular();
      setPopularSearches(popular || []);

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

    setRecentSearches(prev => [query, ...prev.filter(item => item !== query)].slice(0, 5));
  }, []);

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

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

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

    searchTimeoutRef.current = setTimeout(async () => {
      const startTime = performance.now();
      setSearchState(prev => ({ ...prev, isLoading: true }));

      try {
        if (enableAutocomplete && query.length >= 2) {
          const suggestions = await searchApi.getSuggestions(query);
          setSearchState(prev => ({ ...prev, suggestions: suggestions || [] }));
        }

        const searchParams = new URLSearchParams({
          q: query,
          limit: limit.toString(),
          ...Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== undefined && value !== null) {
              acc[key] = Array.isArray(value) ? value.join(',') : value.toString();
            }
            return acc;
          }, {} as Record<string, string>)
        });

        const searchData = await searchApi.search(searchParams.toString());
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

        saveToHistory(query, searchData.total || 0, filters);
      } catch (error) {
        console.error('Erro na busca:', error);
        setSearchState(prev => ({ ...prev, isLoading: false, results: [], suggestions: [] }));
      }
    }, debounceMs);
  }, [popularSearches, saveToHistory]);

  const quickSearch = useCallback(async (query: string, filters: SearchFilters = {}) => {
    await performSearch(query, filters, { debounceMs: 0, limit: 20 });
  }, [performSearch]);

  const searchWithSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchState(prev => ({ ...prev, suggestions: [] }));
      return;
    }
    try {
      const suggestions = await searchApi.getSuggestions(query);
      setSearchState(prev => ({ ...prev, suggestions: suggestions || [] }));
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error);
    }
  }, []);

  const applyFilters = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...searchState.filters, ...newFilters };
    performSearch(searchState.query, updatedFilters);
  }, [searchState.filters, searchState.query, performSearch]);

  const clearFilters = useCallback(() => {
    performSearch(searchState.query, {});
  }, [searchState.query, performSearch]);

  const sortResults = useCallback((sortBy: SearchFilters['sortBy']) => {
    const sortedResults = [...searchState.results].sort((a, b) => {
      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'popular': return (b.reviewCount || 0) - (a.reviewCount || 0);
        default: return b.relevanceScore - a.relevanceScore;
      }
    });

    setSearchState(prev => ({ ...prev, results: sortedResults, filters: { ...prev.filters, sortBy } }));
  }, [searchState.results]);

  const startVoiceSearch = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) return reject(new Error('Speech recognition não suportado'));

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.onresult = (event: any) => resolve(event.results[0][0].transcript);
      recognition.onerror = (event: any) => reject(new Error(`Erro: ${event.error}`));
      recognition.start();
    });
  }, []);

  const searchByImage = useCallback(async (imageFile: File): Promise<SearchResult[]> => {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      const data = await searchApi.searchByImage(formData);

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

  const getFacets = useCallback(async (query: string, filters: SearchFilters = {}) => {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        facets: 'true',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) acc[key] = Array.isArray(value) ? value.join(',') : value.toString();
          return acc;
        }, {} as Record<string, string>)
      });
      return await searchApi.getFacets(searchParams.toString());
    } catch (error) {
      console.error('Erro ao buscar facetas:', error);
      return {};
    }
  }, []);

  const semanticSearch = useCallback(async (query: string, filters: SearchFilters = {}) => {
    try {
      const searchParams = new URLSearchParams({
        q: query,
        semantic: 'true',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value !== undefined && value !== null) acc[key] = Array.isArray(value) ? value.join(',') : value.toString();
          return acc;
        }, {} as Record<string, string>)
      });
      const data = await searchApi.semanticSearch(searchParams.toString());
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

  const searchStats = useMemo(() => {
    const totalSearches = searchHistory.length;
    const avgResults = totalSearches > 0 ? searchHistory.reduce((sum, item) => sum + item.resultsCount, 0) / totalSearches : 0;
    const mostSearched = searchHistory.reduce((acc, item) => {
      acc[item.query] = (acc[item.query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalSearches,
      avgResults: Math.round(avgResults),
      mostSearchedQuery: Object.keys(mostSearched).length > 0 ? Object.keys(mostSearched).reduce((a, b) => mostSearched[a] > mostSearched[b] ? a : b) : '',
      avgSearchTime: searchState.searchTime
    };
  }, [searchHistory, searchState.searchTime]);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    setRecentSearches([]);
    localStorage.removeItem('search_history');
  }, []);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, []);

  return {
    searchState, searchHistory, recentSearches, popularSearches,
    performSearch, quickSearch, searchWithSuggestions, applyFilters,
    clearFilters, sortResults, startVoiceSearch, searchByImage,
    getFacets, semanticSearch, clearHistory, searchStats
  };
}
