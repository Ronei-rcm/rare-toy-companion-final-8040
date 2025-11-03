import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Review {
  id: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title?: string;
  comment: string;
  pros?: string;
  cons?: string;
  verified_purchase: boolean;
  helpful_count: number;
  not_helpful_count: number;
  media?: Array<{
    id: string;
    media_url: string;
    thumbnail_url?: string;
  }>;
  response?: {
    text: string;
    created_at: string;
  };
  created_at: string;
}

interface ReviewCardProps {
  review: Review;
  onVoteHelpful?: (reviewId: string) => void;
  onVoteNotHelpful?: (reviewId: string) => void;
  userVote?: 'helpful' | 'not_helpful' | null;
}

export function ReviewCard({ review, onVoteHelpful, onVoteNotHelpful, userVote }: ReviewCardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const timeAgo = formatDistanceToNow(new Date(review.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="border rounded-lg p-6 space-y-4 bg-white hover:shadow-md transition-shadow"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={review.user_avatar} />
              <AvatarFallback>
                {review.user_name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{review.user_name}</p>
                {review.verified_purchase && (
                  <Badge variant="secondary" className="text-xs">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Compra verificada
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-sm text-muted-foreground">{timeAgo}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        {review.title && (
          <h4 className="font-semibold text-lg">{review.title}</h4>
        )}

        {/* Comment */}
        <p className="text-gray-700 leading-relaxed">{review.comment}</p>

        {/* Pros & Cons */}
        {(review.pros || review.cons) && (
          <div className="grid md:grid-cols-2 gap-4">
            {review.pros && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">👍 Pontos positivos:</p>
                <p className="text-sm text-gray-600">{review.pros}</p>
              </div>
            )}
            {review.cons && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-red-700">👎 Pontos negativos:</p>
                <p className="text-sm text-gray-600">{review.cons}</p>
              </div>
            )}
          </div>
        )}

        {/* Images */}
        {review.media && review.media.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {review.media.map((media) => (
              <button
                key={media.id}
                onClick={() => setSelectedImage(media.media_url)}
                className="relative group overflow-hidden rounded border hover:border-primary transition-colors"
              >
                <img
                  src={media.thumbnail_url || media.media_url}
                  alt="Foto da avaliação"
                  className="w-20 h-20 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs">Ver foto</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Seller Response */}
        {review.response && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-blue-900">
              <MessageCircle className="w-4 h-4" />
              <span className="font-medium text-sm">Resposta do vendedor:</span>
            </div>
            <p className="text-sm text-blue-800">{review.response.text}</p>
            <p className="text-xs text-blue-600">
              {formatDistanceToNow(new Date(review.response.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </p>
          </div>
        )}

        {/* Helpful votes */}
        <div className="flex items-center gap-4 pt-2 border-t">
          <span className="text-sm text-muted-foreground">Esta avaliação foi útil?</span>
          <div className="flex gap-2">
            <Button
              variant={userVote === 'helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVoteHelpful?.(review.id)}
              className="gap-2"
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{review.helpful_count}</span>
            </Button>
            <Button
              variant={userVote === 'not_helpful' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVoteNotHelpful?.(review.id)}
              className="gap-2"
            >
              <ThumbsDown className="w-4 h-4" />
              <span>{review.not_helpful_count}</span>
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={selectedImage}
            alt="Imagem ampliada"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>
      )}
    </>
  );
}

