import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ReviewStatsData {
  total_reviews: number;
  avg_rating: number;
  rating_5: number;
  rating_4: number;
  rating_3: number;
  rating_2: number;
  rating_1: number;
  verified_purchases: number;
}

interface ReviewStatsProps {
  productId: number;
}

export function ReviewStats({ productId }: ReviewStatsProps) {
  const [stats, setStats] = useState<ReviewStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [productId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(
        `https://muhlstore.re9suainternet.com.br/api/products/${productId}/reviews/stats`
      );

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats || stats.total_reviews === 0) {
    return null;
  }

  const avgRating = parseFloat(stats.avg_rating?.toFixed(1) || '0');

  const ratingDistribution = [
    { stars: 5, count: stats.rating_5 },
    { stars: 4, count: stats.rating_4 },
    { stars: 3, count: stats.rating_3 },
    { stars: 2, count: stats.rating_2 },
    { stars: 1, count: stats.rating_1 },
  ];

  return (
    <Card className="p-6">
      <div className="grid md:grid-cols-2 gap-8">
        {/* Média Geral */}
        <div className="flex flex-col items-center justify-center text-center">
          <div className="text-5xl font-bold mb-2">{avgRating}</div>
          <div className="flex gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-5 w-5 ${
                  i < Math.round(avgRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-gray-200 text-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {stats.total_reviews} {stats.total_reviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
          {stats.verified_purchases > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {stats.verified_purchases} compras verificadas
            </p>
          )}
        </div>

        {/* Distribuição de Estrelas */}
        <div className="space-y-2">
          {ratingDistribution.map(({ stars, count }) => {
            const percentage = stats.total_reviews > 0 
              ? (count / stats.total_reviews) * 100 
              : 0;

            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-16">
                  <span className="text-sm font-medium">{stars}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                </div>
                
                <Progress value={percentage} className="flex-1 h-2" />
                
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

