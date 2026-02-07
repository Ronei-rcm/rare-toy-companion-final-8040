import { useState, useEffect } from 'react';
import { badgesApi } from '@/services/badges-api';

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

  useEffect(() => {
    fetchBadges();
  }, []);

  const fetchBadges = async () => {
    try {
      setLoading(true);
      const data = await badgesApi.getAll();
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
      return await badgesApi.getProductBadges(productId);
    } catch (err) {
      console.error('Erro ao carregar badges do produto:', err);
      return [];
    }
  };

  const addBadgeToProduct = async (productId: string | number, badgeId: number) => {
    try {
      return await badgesApi.addBadgeToProduct(productId, badgeId);
    } catch (err) {
      console.error('Erro ao adicionar badge:', err);
      throw err;
    }
  };

  const removeBadgeFromProduct = async (productId: string | number, badgeId: number) => {
    try {
      return await badgesApi.removeBadgeFromProduct(productId, badgeId);
    } catch (err) {
      console.error('Erro ao remover badge:', err);
      throw err;
    }
  };

  const updateProductCondition = async (productId: string | number, condicao: string) => {
    try {
      return await badgesApi.updateProductCondition(productId, condicao);
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
