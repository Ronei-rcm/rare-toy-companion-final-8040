import React from 'react';
import { Star, TrendingUp, Award, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface ReviewStatsProps {
  totalReviews: number;
  avgRating: number;
  rating5: number;
  rating4: number;
  rating3: number;
  rating2: number;
  rating1: number;
  verifiedPurchases?: number;
}

export function ReviewStats({
  totalReviews,
  avgRating,
  rating5,
  rating4,
  rating3,
  rating2,
  rating1,
  verifiedPurchases = 0,
}: ReviewStatsProps) {
  const getRatingPercentage = (count: number) => {
    return totalReviews > 0 ? (count / totalReviews) * 100 : 0;
  };

  const renderRatingBar = (stars: number, count: number) => {
    const percentage = getRatingPercentage(count);
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 min-w-[60px]">
          <span className="text-sm font-medium">{stars}</span>
          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        </div>
        <Progress value={percentage} className="flex-1 h-2" />
        <span className="text-sm text-muted-foreground min-w-[50px] text-right">
          {count} ({percentage.toFixed(0)}%)
        </span>
      </div>
    );
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {/* Overall Rating */}
      <Card className="p-6 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <div className="text-center">
          <div className="text-5xl font-bold text-purple-600 mb-2">
            {avgRating.toFixed(1)}
          </div>
          <div className="flex items-center justify-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(avgRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Baseado em <strong>{totalReviews}</strong> {totalReviews === 1 ? 'avaliação' : 'avaliações'}
          </p>
        </div>
      </Card>

      {/* Rating Distribution */}
      <Card className="p-6 md:col-span-2">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-600" />
          Distribuição de Avaliações
        </h3>
        <div className="space-y-3">
          {renderRatingBar(5, rating5)}
          {renderRatingBar(4, rating4)}
          {renderRatingBar(3, rating3)}
          {renderRatingBar(2, rating2)}
          {renderRatingBar(1, rating1)}
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Award className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {(((rating5 + rating4) / totalReviews) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">Recomendações</p>
            </div>
          </div>

          {verifiedPurchases > 0 && (
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {verifiedPurchases}
                </p>
                <p className="text-xs text-muted-foreground">Compras verificadas</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

