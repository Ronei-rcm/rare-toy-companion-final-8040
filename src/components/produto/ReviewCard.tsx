import { Star, ThumbsUp, Flag, User, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/contexts/CurrentUserContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

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

interface ReviewCardProps {
  review: Review;
  onHelpful?: (reviewId: number) => void;
}

export function ReviewCard({ review, onHelpful }: ReviewCardProps) {
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [hasVotedHelpful, setHasVotedHelpful] = useState(false);

  const handleHelpful = async () => {
    if (!currentUser) {
      toast({
        title: 'Login necessário',
        description: 'Faça login para marcar avaliações como úteis',
        variant: 'destructive',
      });
      return;
    }

    if (hasVotedHelpful) {
      toast({
        title: 'Já votado',
        description: 'Você já marcou esta avaliação como útil',
      });
      return;
    }

    try {
      const response = await fetch(
        `https://muhlstore.re9suainternet.com.br/api/reviews/${review.id}/helpful`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customer_id: currentUser.id }),
        }
      );

      if (response.ok) {
        setHasVotedHelpful(true);
        onHelpful?.(review.id);
        toast({
          title: 'Obrigado!',
          description: 'Sua avaliação foi registrada',
        });
      } else {
        const data = await response.json();
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao votar',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar voto',
        variant: 'destructive',
      });
    }
  };

  const handleReport = async () => {
    if (!reportReason) {
      toast({
        title: 'Motivo obrigatório',
        description: 'Selecione um motivo para a denúncia',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingReport(true);

    try {
      const response = await fetch(
        `https://muhlstore.re9suainternet.com.br/api/reviews/${review.id}/report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customer_id: currentUser?.id || null,
            reason: reportReason,
            description: reportDescription,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Denúncia registrada',
          description: 'Sua denúncia será analisada pela equipe',
        });
        setShowReportDialog(false);
        setReportReason('');
        setReportDescription('');
      } else {
        toast({
          title: 'Erro',
          description: data.error || 'Erro ao enviar denúncia',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao processar denúncia',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <>
      <Card className="p-6">
        <div className="flex gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={review.user_avatar} alt={review.user_name} />
            <AvatarFallback>
              <User className="h-6 w-6" />
            </AvatarFallback>
          </Avatar>

          {/* Conteúdo */}
          <div className="flex-1 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.user_name || 'Usuário'}</span>
                  {review.verified_purchase && (
                    <Badge variant="secondary" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Compra Verificada
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{formatDate(review.created_at)}</p>
              </div>
            </div>

            {/* Rating */}
            <div className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-gray-200 text-gray-200'
                  }`}
                />
              ))}
            </div>

            {/* Título */}
            {review.title && <h4 className="font-semibold">{review.title}</h4>}

            {/* Comentário */}
            <p className="text-sm leading-relaxed">{review.comment}</p>

            {/* Imagens */}
            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {review.images.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Review ${index + 1}`}
                    className="h-20 w-20 object-cover rounded-lg border"
                  />
                ))}
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center gap-4 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={handleHelpful}
                disabled={hasVotedHelpful}
              >
                <ThumbsUp className={`h-4 w-4 ${hasVotedHelpful ? 'fill-current' : ''}`} />
                Útil ({review.helpful_count})
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => setShowReportDialog(true)}
              >
                <Flag className="h-4 w-4" />
                Denunciar
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Dialog de Denúncia */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denunciar Avaliação</DialogTitle>
            <DialogDescription>
              Selecione o motivo da denúncia. Nossa equipe analisará em breve.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivo *</Label>
              <RadioGroup value={reportReason} onValueChange={setReportReason}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="inappropriate" id="inappropriate" />
                  <Label htmlFor="inappropriate" className="font-normal">
                    Conteúdo inapropriado
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="spam" id="spam" />
                  <Label htmlFor="spam" className="font-normal">
                    Spam ou propaganda
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fake" id="fake" />
                  <Label htmlFor="fake" className="font-normal">
                    Avaliação falsa ou fraudulenta
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="offensive" id="offensive" />
                  <Label htmlFor="offensive" className="font-normal">
                    Linguagem ofensiva
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal">
                    Outro motivo
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Detalhes (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Descreva o problema..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReportDialog(false)}
              disabled={isSubmittingReport}
            >
              Cancelar
            </Button>
            <Button onClick={handleReport} disabled={isSubmittingReport}>
              {isSubmittingReport ? 'Enviando...' : 'Enviar Denúncia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

