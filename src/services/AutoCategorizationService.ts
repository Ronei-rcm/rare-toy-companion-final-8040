/**
 * Serviço de Categorização Automática Inteligente
 * 
 * Analisa o histórico de transações e sugere categorias para novas transações
 * baseado em similaridade de descrição e padrões aprendidos.
 */

interface Transaction {
    descricao: string;
    categoria: string;
    tipo?: 'entrada' | 'saida';
    valor?: number;
}

interface CategorySuggestion {
    categoria: string;
    confidence: number; // 0-1
    reason: string;
}

interface CategoryPattern {
    categoria: string;
    keywords: string[];
    count: number;
}

export class AutoCategorizationService {
    private transactions: Transaction[];
    private patterns: Map<string, CategoryPattern>;

    constructor(transactions: Transaction[]) {
        this.transactions = transactions.filter(t => t.categoria && t.categoria.trim() !== '');
        this.patterns = new Map();
        this.buildPatterns();
    }

    /**
     * Constrói padrões de categorização baseado no histórico
     */
    private buildPatterns(): void {
        const categoryMap = new Map<string, Set<string>>();

        // Agrupar palavras-chave por categoria
        this.transactions.forEach(transaction => {
            const categoria = transaction.categoria;
            const words = this.extractKeywords(transaction.descricao);

            if (!categoryMap.has(categoria)) {
                categoryMap.set(categoria, new Set());
            }

            words.forEach(word => categoryMap.get(categoria)!.add(word));
        });

        // Criar padrões
        categoryMap.forEach((keywords, categoria) => {
            const count = this.transactions.filter(t => t.categoria === categoria).length;
            this.patterns.set(categoria, {
                categoria,
                keywords: Array.from(keywords),
                count
            });
        });
    }

    /**
     * Extrai palavras-chave de uma descrição
     */
    private extractKeywords(descricao: string): string[] {
        // Remover caracteres especiais e normalizar
        const normalized = descricao
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9\s]/g, ' ')
            .trim();

        // Dividir em palavras e filtrar palavras muito curtas ou comuns
        const stopWords = new Set(['de', 'da', 'do', 'em', 'na', 'no', 'a', 'o', 'e', 'para', 'com', 'por']);

        return normalized
            .split(/\s+/)
            .filter(word => word.length > 2 && !stopWords.has(word));
    }

    /**
     * Calcula similaridade entre duas strings usando Levenshtein simplificado
     */
    private calculateSimilarity(str1: string, str2: string): number {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();

        // Similaridade exata
        if (s1 === s2) return 1.0;

        // Verificar se uma contém a outra
        if (s1.includes(s2) || s2.includes(s1)) {
            return 0.8;
        }

        // Contar palavras em comum
        const words1 = new Set(this.extractKeywords(s1));
        const words2 = new Set(this.extractKeywords(s2));

        if (words1.size === 0 || words2.size === 0) return 0;

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        return intersection.size / union.size;
    }

    /**
     * Encontra transações similares no histórico
     */
    private findSimilarTransactions(descricao: string, limit: number = 5): Transaction[] {
        const similarities = this.transactions.map(transaction => ({
            transaction,
            similarity: this.calculateSimilarity(descricao, transaction.descricao)
        }));

        return similarities
            .filter(s => s.similarity > 0.3) // Threshold mínimo
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(s => s.transaction);
    }

    /**
     * Sugere categoria para uma nova transação
     */
    suggestCategory(descricao: string, tipo?: 'entrada' | 'saida'): CategorySuggestion | null {
        if (!descricao || descricao.trim() === '') {
            return null;
        }

        // 1. Buscar por correspondência exata
        const exactMatch = this.transactions.find(t =>
            t.descricao.toLowerCase() === descricao.toLowerCase()
        );

        if (exactMatch) {
            return {
                categoria: exactMatch.categoria,
                confidence: 1.0,
                reason: 'Correspondência exata com histórico'
            };
        }

        // 2. Buscar transações similares
        const similarTransactions = this.findSimilarTransactions(descricao);

        if (similarTransactions.length === 0) {
            // 3. Tentar por palavras-chave
            return this.suggestByKeywords(descricao);
        }

        // Contar categorias nas transações similares
        const categoryCounts = new Map<string, number>();
        similarTransactions.forEach(transaction => {
            const count = categoryCounts.get(transaction.categoria) || 0;
            categoryCounts.set(transaction.categoria, count + 1);
        });

        // Encontrar categoria mais comum
        let bestCategory = '';
        let maxCount = 0;

        categoryCounts.forEach((count, categoria) => {
            if (count > maxCount) {
                maxCount = count;
                bestCategory = categoria;
            }
        });

        const confidence = maxCount / similarTransactions.length;

        return {
            categoria: bestCategory,
            confidence,
            reason: `${maxCount} de ${similarTransactions.length} transações similares`
        };
    }

    /**
     * Sugere categoria baseado em palavras-chave
     */
    private suggestByKeywords(descricao: string): CategorySuggestion | null {
        const keywords = this.extractKeywords(descricao);

        if (keywords.length === 0) {
            return null;
        }

        const categoryScores = new Map<string, number>();

        this.patterns.forEach((pattern, categoria) => {
            let score = 0;
            keywords.forEach(keyword => {
                if (pattern.keywords.includes(keyword)) {
                    score++;
                }
            });

            if (score > 0) {
                categoryScores.set(categoria, score);
            }
        });

        if (categoryScores.size === 0) {
            return null;
        }

        // Encontrar melhor categoria
        let bestCategory = '';
        let maxScore = 0;

        categoryScores.forEach((score, categoria) => {
            if (score > maxScore) {
                maxScore = score;
                bestCategory = categoria;
            }
        });

        const confidence = Math.min(maxScore / keywords.length, 0.7); // Máximo 70% por keywords

        return {
            categoria: bestCategory,
            confidence,
            reason: `${maxScore} palavra(s)-chave encontrada(s)`
        };
    }

    /**
     * Sugere múltiplas categorias ordenadas por confiança
     */
    suggestMultipleCategories(descricao: string, limit: number = 3): CategorySuggestion[] {
        const similarTransactions = this.findSimilarTransactions(descricao, 10);

        if (similarTransactions.length === 0) {
            const keywordSuggestion = this.suggestByKeywords(descricao);
            return keywordSuggestion ? [keywordSuggestion] : [];
        }

        const categoryCounts = new Map<string, number>();
        similarTransactions.forEach(transaction => {
            const count = categoryCounts.get(transaction.categoria) || 0;
            categoryCounts.set(transaction.categoria, count + 1);
        });

        const suggestions: CategorySuggestion[] = [];

        categoryCounts.forEach((count, categoria) => {
            const confidence = count / similarTransactions.length;
            suggestions.push({
                categoria,
                confidence,
                reason: `${count} de ${similarTransactions.length} transações similares`
            });
        });

        return suggestions
            .sort((a, b) => b.confidence - a.confidence)
            .slice(0, limit);
    }

    /**
     * Retorna estatísticas do serviço
     */
    getStats() {
        return {
            totalTransactions: this.transactions.length,
            totalCategories: this.patterns.size,
            categories: Array.from(this.patterns.values()).map(p => ({
                categoria: p.categoria,
                count: p.count,
                keywords: p.keywords.slice(0, 10) // Top 10 keywords
            }))
        };
    }
}

/**
 * Hook para usar o serviço de categorização
 */
export function useAutoCategorization(transactions: Transaction[]) {
    const service = new AutoCategorizationService(transactions);

    return {
        suggestCategory: (descricao: string, tipo?: 'entrada' | 'saida') =>
            service.suggestCategory(descricao, tipo),

        suggestMultiple: (descricao: string, limit?: number) =>
            service.suggestMultipleCategories(descricao, limit),

        stats: service.getStats()
    };
}
