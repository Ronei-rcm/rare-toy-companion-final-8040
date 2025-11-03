import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Filter, SortAsc } from 'lucide-react';
import { ReviewCard } from './ReviewCard';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

interface ReviewsListProps {
  productId: number;
  userId?: string;
}

export function ReviewsList({ productId, userId }: ReviewsListProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sort, setSort] = useState<string>('recent');
  const [userVotes, setUserVotes] = useState<Record<string, 'helpful' | 'not_helpful'>>({});

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchReviews();
    fetchStats();
  }, [productId, filter, sort]);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('rating', filter);
      params.append('sort', sort);

      const response = await fetch(
        `${API_BASE_URL}/products/${productId}/reviews?${params}`
      );
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Erro ao carregar reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleVoteHelpful = async (reviewId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vote_type: 'helpful' }),
      });

      if (response.ok) {
        setUserVotes({ ...userVotes, [reviewId]: 'helpful' });
        fetchReviews(); // Atualizar contadores
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  const handleVoteNotHelpful = async (reviewId: string) => {
    if (!userId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, vote_type: 'not_helpful' }),
      });

      if (response.ok) {
        setUserVotes({ ...userVotes, [reviewId]: 'not_helpful' });
        fetchReviews();
      }
    } catch (error) {
      console.error('Erro ao votar:', error);
    }
  };

  const renderRatingBar = (stars: number, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <button
        onClick={() => setFilter(stars.toString())}
        className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded transition-colors w-full"
      >
        <div className="flex items-center gap-1 min-w-[60px]">
          <span className="text-sm font-medium">{stars}</span>
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        </div>
        <Progress value={percentage} className="flex-1" />
        <span className="text-sm text-muted-foreground min-w-[40px] text-right">
          {count}
        </span>
      </button>
    );
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-6 border"
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Overall Rating */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-5xl font-bold text-purple-600 mb-2">
                {stats.avg_rating?.toFixed(1)}
              </div>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-6 h-6 ${
                      star <= Math.round(stats.avg_rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.total_reviews} {stats.total_reviews === 1 ? 'avaliação' : 'avaliações'}
              </p>
              {stats.verified_purchases > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  {stats.verified_purchases} compras verificadas
                </p>
              )}
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => (
                <div key={stars}>
                  {renderRatingBar(
                    stars,
                    stats[`rating_${stars}`] || 0,
                    stats.total_reviews
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Filters and Sort */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-3 items-center">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por nota" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as notas</SelectItem>
              <SelectItem value="5">5 estrelas</SelectItem>
              <SelectItem value="4">4 estrelas</SelectItem>
              <SelectItem value="3">3 estrelas</SelectItem>
              <SelectItem value="2">2 estrelas</SelectItem>
              <SelectItem value="1">1 estrela</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-3 items-center">
          <SortAsc className="w-5 h-5 text-muted-foreground" />
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Mais recentes</SelectItem>
              <SelectItem value="helpful">Mais úteis</SelectItem>
              <SelectItem value="rating_high">Maior nota</SelectItem>
              <SelectItem value="rating_low">Menor nota</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
          <p className="text-muted-foreground">
            {filter !== 'all'
              ? 'Nenhuma avaliação com esse filtro.'
              : 'Seja o primeiro a avaliar este produto!'}
          </p>
          {filter !== 'all' && (
            <Button
              variant="outline"
              onClick={() => setFilter('all')}
              className="mt-4"
            >
              Ver todas as avaliações
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVoteHelpful={handleVoteHelpful}
              onVoteNotHelpful={handleVoteNotHelpful}
              userVote={userVotes[review.id]}
            />
          ))}
        </div>
      )}
    </div>
  );
}

