import { useState, useEffect } from 'react';

export interface LojaStats {
  totalProdutos: number;
  produtosAtivos: number;
  produtosDestaque: number;
  produtosPromocao: number;
  avaliacaoMedia: string | null;
  totalAvaliacoes: number;
  precoMinimo: number;
  precoMaximo: number;
  precoMedio: string;
  totalCategorias: number;
}

export interface CompraRecente {
  produto: string;
  categoria: string;
  preco: number;
  imagemUrl: string | null;
  dataCompra: string;
  cliente: string;
  cidade: string;
  tempoAtras: number;
}

export const useSocialProof = () => {
  const [stats, setStats] = useState<LojaStats | null>(null);
  const [comprasRecentes, setComprasRecentes] = useState<CompraRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSocialProofData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar estatísticas e compras recentes em paralelo
        const base = (import.meta as any).env?.VITE_API_URL || '/api';
        const [statsResponse, comprasResponse] = await Promise.all([
          fetch(`${base}/stats`),
          fetch(`${base}/compras-recentes`)
        ]);
        
        if (!statsResponse.ok || !comprasResponse.ok) {
          throw new Error('Erro ao buscar dados de prova social');
        }
        
        const [statsData, comprasData] = await Promise.all([
          statsResponse.json(),
          comprasResponse.json()
        ]);
        
        setStats(statsData);
        setComprasRecentes(comprasData);
      } catch (err) {
        console.error('Erro ao buscar dados de prova social:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };

    fetchSocialProofData();
  }, []);

  return { stats, comprasRecentes, loading, error };
};

export default useSocialProof;
