import { useState, useEffect } from 'react';
import { ReviewCard } from './ReviewCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageSquare } from 'lucide-react';

interface Review {
  id: number;
  customer_id: string;
  rating: number;
  title: string;
  comment: string;
  verified_purchase: boolean;
  helpful_count: number;
  user_name?: string;
  user_avatar?: string;
  created_at: string;
  images?: string[];
}

interface ReviewListProps {
  productId: number;
  refreshTrigger?: number;
}

export function ReviewList({ productId, refreshTrigger }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [productId, refreshTrigger]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://muhlstore.re9suainternet.com.br/api/products/${productId}/reviews`
      );

      if (!response.ok) {
        throw new Error('Erro ao carregar avaliações');
      }

      const data = await response.json();
      
      // Parse images se for string JSON
      const reviewsWithImages = data.reviews.map((review: any) => ({
        ...review,
        images: typeof review.images === 'string' 
          ? JSON.parse(review.images) 
          : review.images || []
      }));

      setReviews(reviewsWithImages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const handleHelpful = (reviewId: number) => {
    setReviews((prev) =>
      prev.map((review) =>
        review.id === reviewId
          ? { ...review, helpful_count: review.helpful_count + 1 }
          : review
      )
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-6 space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
        <p className="text-muted-foreground">
          Seja o primeiro a avaliar este produto!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
      </p>
      
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onHelpful={handleHelpful}
        />
      ))}
    </div>
  );
}

