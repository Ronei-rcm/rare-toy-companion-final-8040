import { useState, useEffect } from 'react';
import { categoriesApi } from '@/services/categories-api';

interface Category {
  id: string;
  nome: string;
  slug: string;
  imagem?: string;
  descricao?: string;
  ordem?: number;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const data = await categoriesApi.list();
        setCategories(data);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        setError('Não foi possível carregar as categorias.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return { categories, isLoading, error };
}
