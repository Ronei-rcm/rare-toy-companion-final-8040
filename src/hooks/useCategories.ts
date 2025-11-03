import { useState, useEffect } from 'react';

export interface Categoria {
  id: string;
  nome: string;
  quantidade: number;
  precoMinimo: number;
  precoMaximo: number;
  avaliacaoMedia: string | null;
  ultimoProduto: string;
  icon: string;
  cor: string;
  descricao: string;
}

export const useCategories = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const base = (import.meta as any).env?.VITE_API_URL || '/api';
        const response = await fetch(`${base}/categorias`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setCategorias(data);
      } catch (err) {
        console.error('Erro ao buscar categorias:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchCategorias();
  }, []);

  return { categorias, loading, error };
};

export default useCategories;
