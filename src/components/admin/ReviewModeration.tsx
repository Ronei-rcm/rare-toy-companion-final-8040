import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, Flag, Eye, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ReviewModeration() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [moderationReason, setModerationReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  const fetchPendingReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/pending`);
      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (error) {
      console.error('Erro ao carregar reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (reviewId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast({
          title: 'Review aprovado!',
          description: 'A avaliação foi publicada.',
        });
        fetchPendingReviews();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar a review.',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    if (!moderationReason) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Informe o motivo da rejeição.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: moderationReason }),
      });

      if (response.ok) {
        toast({
          title: 'Review rejeitado',
          description: 'A avaliação foi rejeitada.',
        });
        setModerationReason('');
        fetchPendingReviews();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar a review.',
        variant: 'destructive',
      });
    }
  };

  const handleResponse = async (reviewId: string) => {
    if (!responseText) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/reviews/${reviewId}/response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          response_text: responseText,
          admin_id: 'admin-user-id', // Substituir por ID real do admin
        }),
      });

      if (response.ok) {
        toast({
          title: 'Resposta enviada!',
          description: 'Sua resposta foi publicada.',
        });
        setResponseText('');
        setSelectedReview(null);
        fetchPendingReviews();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a resposta.',
        variant: 'destructive',
      });
    }
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Moderação de Avaliações</h2>
        <p className="text-muted-foreground">
          {reviews.length} {reviews.length === 1 ? 'avaliação pendente' : 'avaliações pendentes'}
        </p>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Tudo em dia!</h3>
          <p className="text-muted-foreground">
            Não há avaliações pendentes de moderação.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold">{review.product_name}</h4>
                      <Badge variant="secondary">
                        {review.verified_purchase ? 'Compra verificada' : 'Não verificado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{review.user_name}</span>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(review.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  {review.title && (
                    <p className="font-medium">{review.title}</p>
                  )}
                  <p className="text-gray-700">{review.comment}</p>

                  {review.pros && (
                    <div>
                      <p className="text-sm font-medium text-green-700">Pontos positivos:</p>
                      <p className="text-sm text-gray-600">{review.pros}</p>
                    </div>
                  )}

                  {review.cons && (
                    <div>
                      <p className="text-sm font-medium text-red-700">Pontos negativos:</p>
                      <p className="text-sm text-gray-600">{review.cons}</p>
                    </div>
                  )}

                  {review.media && review.media.length > 0 && (
                    <div className="flex gap-2">
                      <ImageIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {review.media.length} {review.media.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Moderation reason textarea (se necessário) */}
                {moderationReason !== '' || review.showRejectForm ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Motivo da rejeição:</label>
                    <Textarea
                      value={moderationReason}
                      onChange={(e) => setModerationReason(e.target.value)}
                      placeholder="Ex: Linguagem ofensiva, informações falsas, etc."
                      rows={3}
                    />
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    onClick={() => handleApprove(review.id)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => {
                      setReviews(reviews.map(r => 
                        r.id === review.id ? { ...r, showRejectForm: true } : r
                      ));
                    }}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    onClick={() => setSelectedReview(review)}
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Responder
                  </Button>
                </div>

                {/* Confirm reject */}
                {review.showRejectForm && (
                  <Button
                    onClick={() => handleReject(review.id)}
                    variant="destructive"
                    className="w-full"
                  >
                    Confirmar Rejeição
                  </Button>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Response Dialog */}
      <Dialog open={!!selectedReview} onOpenChange={() => setSelectedReview(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Responder Avaliação</DialogTitle>
            <DialogDescription>
              Sua resposta será pública e aparecerá logo abaixo da avaliação.
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-muted-foreground">
                    por {selectedReview.user_name}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.comment}</p>
              </div>

              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Digite sua resposta..."
                rows={4}
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => handleResponse(selectedReview.id)}
                  className="flex-1"
                  disabled={!responseText}
                >
                  Enviar Resposta
                </Button>
                <Button
                  onClick={() => {
                    setSelectedReview(null);
                    setResponseText('');
                  }}
                  variant="outline"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

