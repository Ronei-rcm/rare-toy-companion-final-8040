/**
 * Sistema de IA para recomendações de produtos
 * Utiliza algoritmos de machine learning para sugerir produtos relevantes
 */

interface Product {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  tags: string[];
  descricao: string;
  avaliacao: number;
  totalAvaliacoes: number;
  vendas: number;
  destaque: boolean;
  promocao: boolean;
  lancamento: boolean;
  faixaEtaria: string;
  marca: string;
  material: string;
  origem: string;
}

interface UserProfile {
  id: string;
  historicoCompras: string[];
  produtosFavoritos: string[];
  categoriasPreferidas: string[];
  faixaEtaria: string;
  orcamentoMedio: number;
  comportamento: {
    frequenciaCompras: number;
    preferenciaMarcas: string[];
    horarioCompras: string[];
    dispositivoPreferido: string;
  };
}

interface RecommendationContext {
  produtoAtual?: Product;
  carrinhoAtual: string[];
  historicoVisualizacao: string[];
  categoriaAtual?: string;
  orcamentoDisponivel?: number;
  faixaEtaria?: string;
}

interface RecommendationResult {
  produto: Product;
  score: number;
  razao: string;
  tipo: 'similar' | 'complementar' | 'tendencia' | 'pessoalizada' | 'categoria';
}

class AIRecommendationEngine {
  private products: Product[] = [];
  private userProfiles: Map<string, UserProfile> = new Map();
  private similarityMatrix: Map<string, Map<string, number>> = new Map();

  constructor() {
    this.initializeEngine();
  }

  // Inicializar o motor de recomendações
  private async initializeEngine() {
    await this.loadProducts();
    await this.buildSimilarityMatrix();
    console.log('🤖 Motor de IA inicializado com sucesso');
  }

  // Carregar produtos do sistema
  private async loadProducts() {
    try {
      const response = await fetch('/api/produtos');
      if (response.ok) {
        this.products = await response.json();
      }
    } catch (error) {
      console.error('Erro ao carregar produtos para IA:', error);
    }
  }

  // Construir matriz de similaridade entre produtos
  private async buildSimilarityMatrix() {
    for (const productA of this.products) {
      const similarities = new Map<string, number>();
      
      for (const productB of this.products) {
        if (productA.id !== productB.id) {
          const similarity = this.calculateSimilarity(productA, productB);
          similarities.set(productB.id, similarity);
        }
      }
      
      this.similarityMatrix.set(productA.id, similarities);
    }
  }

  // Calcular similaridade entre dois produtos
  private calculateSimilarity(productA: Product, productB: Product): number {
    let score = 0;
    let factors = 0;

    // Similaridade de categoria (peso: 0.3)
    if (productA.categoria === productB.categoria) {
      score += 0.3;
    }
    factors += 0.3;

    // Similaridade de preço (peso: 0.2)
    const priceDiff = Math.abs(productA.preco - productB.preco) / Math.max(productA.preco, productB.preco);
    score += 0.2 * (1 - priceDiff);
    factors += 0.2;

    // Similaridade de tags (peso: 0.2)
    const commonTags = productA.tags.filter(tag => productB.tags.includes(tag));
    const tagSimilarity = commonTags.length / Math.max(productA.tags.length, productB.tags.length);
    score += 0.2 * tagSimilarity;
    factors += 0.2;

    // Similaridade de faixa etária (peso: 0.1)
    if (productA.faixaEtaria === productB.faixaEtaria) {
      score += 0.1;
    }
    factors += 0.1;

    // Similaridade de marca (peso: 0.1)
    if (productA.marca === productB.marca) {
      score += 0.1;
    }
    factors += 0.1;

    // Similaridade de material (peso: 0.1)
    if (productA.material === productB.material) {
      score += 0.1;
    }
    factors += 0.1;

    return factors > 0 ? score / factors : 0;
  }

  // Obter recomendações baseadas em contexto
  async getRecommendations(
    userId: string,
    context: RecommendationContext,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    const userProfile = await this.getUserProfile(userId);
    const recommendations: RecommendationResult[] = [];

    // 1. Recomendações baseadas em produto similar
    if (context.produtoAtual) {
      const similarProducts = this.getSimilarProducts(context.produtoAtual, limit);
      recommendations.push(...similarProducts.map(p => ({
        produto: p.produto,
        score: p.score,
        razao: `Similar a "${context.produtoAtual.nome}"`,
        tipo: 'similar' as const
      })));
    }

    // 2. Recomendações baseadas em categoria
    if (context.categoriaAtual) {
      const categoryProducts = this.getCategoryProducts(context.categoriaAtual, limit);
      recommendations.push(...categoryProducts.map(p => ({
        produto: p.produto,
        score: p.score,
        razao: `Outros produtos em "${context.categoriaAtual}"`,
        tipo: 'categoria' as const
      })));
    }

    // 3. Recomendações personalizadas baseadas no perfil do usuário
    if (userProfile) {
      const personalizedProducts = this.getPersonalizedProducts(userProfile, context, limit);
      recommendations.push(...personalizedProducts.map(p => ({
        produto: p.produto,
        score: p.score,
        razao: 'Baseado no seu perfil de compras',
        tipo: 'pessoalizada' as const
      })));
    }

    // 4. Recomendações de tendências
    const trendingProducts = this.getTrendingProducts(limit);
    recommendations.push(...trendingProducts.map(p => ({
      produto: p.produto,
      score: p.score,
      razao: 'Produto em alta',
      tipo: 'tendencia' as const
    })));

    // 5. Recomendações complementares (produtos que vão bem juntos)
    if (context.carrinhoAtual.length > 0) {
      const complementaryProducts = this.getComplementaryProducts(context.carrinhoAtual, limit);
      recommendations.push(...complementaryProducts.map(p => ({
        produto: p.produto,
        score: p.score,
        razao: 'Vai bem com seus itens do carrinho',
        tipo: 'complementar' as const
      })));
    }

    // Remover duplicatas e ordenar por score
    const uniqueRecommendations = this.removeDuplicates(recommendations);
    return uniqueRecommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Obter produtos similares
  private getSimilarProducts(product: Product, limit: number): Array<{produto: Product, score: number}> {
    const similarities = this.similarityMatrix.get(product.id) || new Map();
    const similarProducts = Array.from(similarities.entries())
      .map(([productId, score]) => ({
        produto: this.products.find(p => p.id === productId)!,
        score
      }))
      .filter(item => item.produto)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return similarProducts;
  }

  // Obter produtos da categoria
  private getCategoryProducts(categoria: string, limit: number): Array<{produto: Product, score: number}> {
    return this.products
      .filter(p => p.categoria === categoria)
      .map(p => ({
        produto: p,
        score: this.calculateCategoryScore(p)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calcular score para categoria
  private calculateCategoryScore(product: Product): number {
    let score = 0;

    // Produtos em destaque têm score maior
    if (product.destaque) score += 0.3;
    
    // Produtos com boa avaliação
    if (product.avaliacao >= 4) score += 0.2;
    
    // Produtos com muitas vendas
    if (product.vendas > 10) score += 0.2;
    
    // Produtos em promoção
    if (product.promocao) score += 0.1;
    
    // Produtos lançamento
    if (product.lancamento) score += 0.1;
    
    // Produtos com muitas avaliações
    if (product.totalAvaliacoes > 5) score += 0.1;

    return Math.min(score, 1);
  }

  // Obter produtos personalizados
  private getPersonalizedProducts(
    userProfile: UserProfile,
    context: RecommendationContext,
    limit: number
  ): Array<{produto: Product, score: number}> {
    return this.products
      .map(product => ({
        produto: product,
        score: this.calculatePersonalizedScore(product, userProfile, context)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calcular score personalizado
  private calculatePersonalizedScore(
    product: Product,
    userProfile: UserProfile,
    context: RecommendationContext
  ): number {
    let score = 0;

    // Categorias preferidas do usuário
    if (userProfile.categoriasPreferidas.includes(product.categoria)) {
      score += 0.3;
    }

    // Faixa etária do usuário
    if (userProfile.faixaEtaria === product.faixaEtaria) {
      score += 0.2;
    }

    // Orçamento do usuário
    if (context.orcamentoDisponivel && product.preco <= context.orcamentoDisponivel) {
      score += 0.2;
    }

    // Marcas preferidas
    if (userProfile.comportamento.preferenciaMarcas.includes(product.marca)) {
      score += 0.1;
    }

    // Produtos não comprados anteriormente
    if (!userProfile.historicoCompras.includes(product.id)) {
      score += 0.1;
    }

    // Produtos não visualizados recentemente
    if (!context.historicoVisualizacao.includes(product.id)) {
      score += 0.1;
    }

    return Math.min(score, 1);
  }

  // Obter produtos em tendência
  private getTrendingProducts(limit: number): Array<{produto: Product, score: number}> {
    return this.products
      .map(product => ({
        produto: product,
        score: this.calculateTrendingScore(product)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calcular score de tendência
  private calculateTrendingScore(product: Product): number {
    let score = 0;

    // Produtos com muitas vendas recentes
    score += Math.min(product.vendas / 100, 0.4);

    // Produtos com boa avaliação
    score += (product.avaliacao / 5) * 0.3;

    // Produtos em destaque
    if (product.destaque) score += 0.2;

    // Produtos lançamento
    if (product.lancamento) score += 0.1;

    return Math.min(score, 1);
  }

  // Obter produtos complementares
  private getComplementaryProducts(carrinhoIds: string[], limit: number): Array<{produto: Product, score: number}> {
    const carrinhoProducts = carrinhoIds
      .map(id => this.products.find(p => p.id === id))
      .filter(Boolean) as Product[];

    return this.products
      .filter(p => !carrinhoIds.includes(p.id))
      .map(product => ({
        produto: product,
        score: this.calculateComplementaryScore(product, carrinhoProducts)
      }))
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  // Calcular score complementar
  private calculateComplementaryScore(product: Product, carrinhoProducts: Product[]): number {
    let score = 0;

    for (const carrinhoProduct of carrinhoProducts) {
      // Produtos da mesma categoria
      if (product.categoria === carrinhoProduct.categoria) {
        score += 0.3;
      }

      // Produtos com faixa etária similar
      if (product.faixaEtaria === carrinhoProduct.faixaEtaria) {
        score += 0.2;
      }

      // Produtos da mesma marca
      if (product.marca === carrinhoProduct.marca) {
        score += 0.2;
      }

      // Produtos com preço similar
      const priceDiff = Math.abs(product.preco - carrinhoProduct.preco) / Math.max(product.preco, carrinhoProduct.preco);
      if (priceDiff < 0.5) {
        score += 0.1;
      }

      // Produtos com tags similares
      const commonTags = product.tags.filter(tag => carrinhoProduct.tags.includes(tag));
      score += (commonTags.length / Math.max(product.tags.length, carrinhoProduct.tags.length)) * 0.2;
    }

    return Math.min(score, 1);
  }

  // Remover duplicatas das recomendações
  private removeDuplicates(recommendations: RecommendationResult[]): RecommendationResult[] {
    const seen = new Set<string>();
    return recommendations.filter(rec => {
      if (seen.has(rec.produto.id)) {
        return false;
      }
      seen.add(rec.produto.id);
      return true;
    });
  }

  // Obter perfil do usuário
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (this.userProfiles.has(userId)) {
      return this.userProfiles.get(userId)!;
    }

    try {
      const response = await fetch(`/api/usuarios/${userId}/perfil`);
      if (response.ok) {
        const profile = await response.json();
        this.userProfiles.set(userId, profile);
        return profile;
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error);
    }

    return null;
  }

  // Atualizar perfil do usuário
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const currentProfile = await this.getUserProfile(userId);
    if (currentProfile) {
      const updatedProfile = { ...currentProfile, ...updates };
      this.userProfiles.set(userId, updatedProfile);
      
      // Salvar no servidor
      try {
        await fetch(`/api/usuarios/${userId}/perfil`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedProfile)
        });
      } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
      }
    }
  }

  // Registrar interação do usuário
  async registerUserInteraction(
    userId: string,
    productId: string,
    interactionType: 'view' | 'add_to_cart' | 'purchase' | 'favorite'
  ): Promise<void> {
    const profile = await this.getUserProfile(userId);
    if (profile) {
      switch (interactionType) {
        case 'view':
          // Adicionar à visualização
          break;
        case 'add_to_cart':
          // Registrar interesse
          break;
        case 'purchase':
          // Adicionar ao histórico de compras
          if (!profile.historicoCompras.includes(productId)) {
            profile.historicoCompras.push(productId);
          }
          break;
        case 'favorite':
          // Adicionar aos favoritos
          if (!profile.produtosFavoritos.includes(productId)) {
            profile.produtosFavoritos.push(productId);
          }
          break;
      }

      await this.updateUserProfile(userId, profile);
    }
  }

  // Obter insights de recomendação
  getRecommendationInsights(recommendations: RecommendationResult[]): {
    totalRecommendations: number;
    distributionByType: Record<string, number>;
    averageScore: number;
    topCategories: string[];
  } {
    const distributionByType: Record<string, number> = {};
    let totalScore = 0;
    const categories: string[] = [];

    recommendations.forEach(rec => {
      distributionByType[rec.tipo] = (distributionByType[rec.tipo] || 0) + 1;
      totalScore += rec.score;
      categories.push(rec.produto.categoria);
    });

    const categoryCount: Record<string, number> = {};
    categories.forEach(cat => {
      categoryCount[cat] = (categoryCount[cat] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    return {
      totalRecommendations: recommendations.length,
      distributionByType,
      averageScore: recommendations.length > 0 ? totalScore / recommendations.length : 0,
      topCategories
    };
  }
}

// Instância global do motor de IA
export const aiRecommendationEngine = new AIRecommendationEngine();

// Hook para usar recomendações em componentes React
export const useAIRecommendations = (userId: string, context: RecommendationContext) => {
  const [recommendations, setRecommendations] = useState<RecommendationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (limit: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const results = await aiRecommendationEngine.getRecommendations(userId, context, limit);
      setRecommendations(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao obter recomendações');
    } finally {
      setLoading(false);
    }
  }, [userId, context]);

  const registerInteraction = useCallback(async (
    productId: string,
    interactionType: 'view' | 'add_to_cart' | 'purchase' | 'favorite'
  ) => {
    try {
      await aiRecommendationEngine.registerUserInteraction(userId, productId, interactionType);
    } catch (err) {
      console.error('Erro ao registrar interação:', err);
    }
  }, [userId]);

  return {
    recommendations,
    loading,
    error,
    getRecommendations,
    registerInteraction
  };
};

export default AIRecommendationEngine;
