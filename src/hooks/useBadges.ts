import { useState, useEffect } from 'react';

interface Badge {
  id: number;
  nome: string;
  slug: string;
  cor: string;
  icone: string;
  descricao: string;
  ativo: number;
  ordem: number;
}

export function useBadges() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/badges`);
      if (!response.ok) throw new Error('Erro ao carregar badges');
      const data = await response.json();
      setBadges(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar badges');
      console.error('Erro ao carregar badges:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProductBadges = async (productId: string | number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}/badges`);
      if (!response.ok) throw new Error('Erro ao carregar badges do produto');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Erro ao carregar badges do produto:', err);
      return [];
    }
  };

  const addBadgeToProduct = async (productId: string | number, badgeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}/badges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badge_id: badgeId })
      });
      if (!response.ok) throw new Error('Erro ao adicionar badge');
      return await response.json();
    } catch (err) {
      console.error('Erro ao adicionar badge:', err);
      throw err;
    }
  };

  const removeBadgeFromProduct = async (productId: string | number, badgeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}/badges/${badgeId}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Erro ao remover badge');
      return await response.json();
    } catch (err) {
      console.error('Erro ao remover badge:', err);
      throw err;
    }
  };

  const updateProductCondition = async (productId: string | number, condicao: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/produtos/${productId}/condicao`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condicao })
      });
      if (!response.ok) throw new Error('Erro ao atualizar condição');
      return await response.json();
    } catch (err) {
      console.error('Erro ao atualizar condição:', err);
      throw err;
    }
  };

  return {
    badges,
    loading,
    error,
    fetchBadges,
    getProductBadges,
    addBadgeToProduct,
    removeBadgeFromProduct,
    updateProductCondition
  };
}
