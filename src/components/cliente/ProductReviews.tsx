import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star, ThumbsUp, MessageSquare, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ProductReviewsProps {
  productId: string;
  userId?: string;
  showWriteReview?: boolean;
}

const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  userId,
  showWriteReview = true,
}) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState(0);
  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`);

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || data || []);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!comment.trim()) {
      toast({
        title: 'Comentário obrigatório',
        description: 'Por favor, escreva sua avaliação',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          comment,
          user_id: userId,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Avaliação enviada! ⭐',
          description: 'Obrigado pelo seu feedback!',
        });
        setIsDialogOpen(false);
        setComment('');
        setRating(5);
        loadReviews();
      }
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua avaliação',
        variant: 'destructive',
      });
    }
  };

  const handleLikeReview = async (reviewId: string) => {
    try {
      await fetch(`${API_BASE_URL}/reviews/${reviewId}/like`, {
        method: 'POST',
        credentials: 'include',
      });
      loadReviews();
    } catch (error) {
      console.error('Erro ao curtir avaliação:', error);
    }
  };

  const renderStars = (count: number, interactive = false) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-5 h-5 cursor-pointer transition-all ${
              star <= (interactive ? (hoveredStar || rating) : count)
                ? 'text-yellow-500 fill-yellow-500'
                : 'text-gray-300'
            }`}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          />
        ))}
      </div>
    );
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Resumo de Avaliações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Avaliações ({reviews.length})</span>
            {showWriteReview && userId && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Escrever Avaliação
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Sua Avaliação</DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label>Classificação</Label>
                      <div className="mt-2">
                        {renderStars(rating, true)}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="comment">Comentário</Label>
                      <Textarea
                        id="comment"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Compartilhe sua experiência..."
                        rows={5}
                        className="mt-2"
                      />
                    </div>

                    <Button onClick={handleSubmitReview} className="w-full">
                      Publicar Avaliação
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length > 0 && (
            <div className="flex items-center gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
              <div className="text-center">
                <p className="text-4xl font-bold">{(avgRating || 0).toFixed(1)}</p>
                <div className="mt-1">{renderStars(Math.round(avgRating))}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
                </p>
              </div>
              
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = reviews.filter((r) => r.rating === stars).length;
                  const percentage = (count / reviews.length) * 100;
                  
                  return (
                    <div key={stars} className="flex items-center gap-2">
                      <span className="text-xs w-12">{stars} estrelas</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Lista de Avaliações */}
          <div className="space-y-4">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse p-4 border rounded-lg">
                  <div className="h-4 bg-muted rounded w-1/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-3/4" />
                </div>
              ))
            ) : reviews.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nenhuma avaliação ainda. Seja o primeiro!</p>
              </div>
            ) : (
              reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <Avatar>
                      <AvatarImage src={review.user_avatar} />
                      <AvatarFallback>
                        {review.user_name?.substring(0, 2).toUpperCase() || 'CL'}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold">{review.user_name || 'Cliente'}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {renderStars(review.rating)}
                            <span className="text-xs text-muted-foreground">
                              {new Date(review.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>

                        {review.verified_purchase && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                            ✅ Compra Verificada
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-foreground mb-3">{review.comment}</p>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleLikeReview(review.id)}
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Útil ({review.likes || 0})
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductReviews;
