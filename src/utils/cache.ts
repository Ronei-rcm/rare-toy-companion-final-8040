/**
 * Sistema de cache inteligente para melhorar performance
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live em milissegundos
  hits: number;
  lastAccessed: number;
}

interface CacheOptions {
  ttl?: number; // Time to live em milissegundos
  maxSize?: number; // Tamanho máximo do cache
  strategy?: 'lru' | 'fifo' | 'lfu'; // Estratégia de remoção
}

class IntelligentCache<T> {
  private cache = new Map<string, CacheItem<T>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 5 * 60 * 1000, // 5 minutos por padrão
      maxSize: options.maxSize || 100,
      strategy: options.strategy || 'lru'
    };
  }

  set(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const itemTtl = ttl || this.options.ttl;

    // Se o cache está cheio, remover item antigo
    if (this.cache.size >= this.options.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: itemTtl,
      hits: 0,
      lastAccessed: now
    });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const now = Date.now();
    
    // Verificar se expirou
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Atualizar estatísticas
    item.hits++;
    item.lastAccessed = now;

    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  values(): T[] {
    return Array.from(this.cache.values()).map(item => item.data);
  }

  // Estatísticas do cache
  getStats() {
    const items = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hitRate: items.reduce((sum, item) => sum + item.hits, 0) / Math.max(items.length, 1),
      averageAge: items.reduce((sum, item) => sum + (now - item.timestamp), 0) / Math.max(items.length, 1),
      oldestItem: Math.min(...items.map(item => item.timestamp)),
      newestItem: Math.max(...items.map(item => item.timestamp))
    };
  }

  // Limpar itens expirados
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  // Remover item baseado na estratégia
  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToRemove: string | null = null;

    switch (this.options.strategy) {
      case 'lru': // Least Recently Used
        keyToRemove = Array.from(this.cache.entries())
          .reduce((oldest, [key, item]) => 
            item.lastAccessed < oldest[1].lastAccessed ? [key, item] : oldest
          )[0];
        break;

      case 'fifo': // First In, First Out
        keyToRemove = Array.from(this.cache.entries())
          .reduce((oldest, [key, item]) => 
            item.timestamp < oldest[1].timestamp ? [key, item] : oldest
          )[0];
        break;

      case 'lfu': // Least Frequently Used
        keyToRemove = Array.from(this.cache.entries())
          .reduce((least, [key, item]) => 
            item.hits < least[1].hits ? [key, item] : least
          )[0];
        break;
    }

    if (keyToRemove) {
      this.cache.delete(keyToRemove);
    }
  }
}

// Instâncias globais de cache
export const productCache = new IntelligentCache<any>({
  ttl: 10 * 60 * 1000, // 10 minutos
  maxSize: 200,
  strategy: 'lru'
});

export const userCache = new IntelligentCache<any>({
  ttl: 30 * 60 * 1000, // 30 minutos
  maxSize: 100,
  strategy: 'lru'
});

export const orderCache = new IntelligentCache<any>({
  ttl: 5 * 60 * 1000, // 5 minutos
  maxSize: 50,
  strategy: 'fifo'
});

export const imageCache = new IntelligentCache<string>({
  ttl: 60 * 60 * 1000, // 1 hora
  maxSize: 500,
  strategy: 'lru'
});

// Utilitários de cache
export const cacheUtils = {
  // Limpar todos os caches
  clearAll: () => {
    productCache.clear();
    userCache.clear();
    orderCache.clear();
    imageCache.clear();
  },

  // Limpar caches expirados
  cleanupAll: () => {
    const removed = [
      productCache.cleanup(),
      userCache.cleanup(),
      orderCache.cleanup(),
      imageCache.cleanup()
    ];
    return removed.reduce((sum, count) => sum + count, 0);
  },

  // Obter estatísticas de todos os caches
  getAllStats: () => ({
    products: productCache.getStats(),
    users: userCache.getStats(),
    orders: orderCache.getStats(),
    images: imageCache.getStats()
  }),

  // Cache com retry automático
  async withCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    cache: IntelligentCache<T>,
    ttl?: number
  ): Promise<T> {
    // Tentar obter do cache
    const cached = cache.get(key);
    if (cached !== null) {
      return cached;
    }

    try {
      // Buscar dados
      const data = await fetcher();
      
      // Armazenar no cache
      cache.set(key, data, ttl);
      
      return data;
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
      throw error;
    }
  },

  // Cache com invalidação por padrão
  invalidatePattern: (pattern: string, cache: IntelligentCache<any>) => {
    const keys = cache.keys();
    const regex = new RegExp(pattern);
    
    keys.forEach(key => {
      if (regex.test(key)) {
        cache.delete(key);
      }
    });
  }
};

// Hook para usar cache em componentes React
export const useCache = <T>(cache: IntelligentCache<T>) => {
  const get = (key: string) => cache.get(key);
  const set = (key: string, data: T, ttl?: number) => cache.set(key, data, ttl);
  const has = (key: string) => cache.has(key);
  const remove = (key: string) => cache.delete(key);
  const clear = () => cache.clear();
  const stats = () => cache.getStats();

  return {
    get,
    set,
    has,
    remove,
    clear,
    stats
  };
};

export default IntelligentCache;
