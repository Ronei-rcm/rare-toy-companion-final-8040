import { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

interface ReviewFormProps {
  productId: number;
  onSuccess?: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps) {
  const { toast } = useToast();
  const { currentUser } = useCurrentUser();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) {
      toast({
        title: 'Login necessário',
        description: 'Você precisa estar logado para avaliar produtos',
        variant: 'destructive',
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: 'Avaliação obrigatória',
        description: 'Selecione uma avaliação em estrelas',
        variant: 'destructive',
      });
      return;
    }

    if (comment.trim().length < 10) {
      toast({
        title: 'Comentário muito curto',
        description: 'O comentário deve ter no mínimo 10 caracteres',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `https://muhlstore.re9suainternet.com.br/api/products/${productId}/reviews`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customer_id: currentUser.id,
            rating,
            title: title.trim() || 'Avaliação',
            comment: comment.trim(),
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Avaliação enviada!',
          description: 'Sua avaliação será analisada e publicada em breve',
        });

        // Limpar formulário
        setRating(0);
        setTitle('');
        setComment('');

        onSuccess?.();
      } else {
        toast({
          title: 'Erro ao enviar avaliação',
          description: data.error || 'Tente novamente mais tarde',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar avaliação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4">Escreva sua avaliação</h3>
          
          {!currentUser && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                Você precisa estar logado para avaliar este produto.{' '}
                <a href="/login" className="font-semibold underline">
                  Faça login
                </a>
              </p>
            </div>
          )}
        </div>

        {/* Rating Stars */}
        <div className="space-y-2">
          <Label>Sua avaliação *</Label>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const starValue = index + 1;
              return (
                <button
                  key={index}
                  type="button"
                  className="focus:outline-none transition-transform hover:scale-110"
                  onClick={() => setRating(starValue)}
                  onMouseEnter={() => setHoverRating(starValue)}
                  onMouseLeave={() => setHoverRating(0)}
                  disabled={isSubmitting || !currentUser}
                >
                  <Star
                    className={`h-8 w-8 ${
                      starValue <= displayRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          {rating > 0 && (
            <p className="text-sm text-muted-foreground">
              {rating === 1 && 'Muito ruim'}
              {rating === 2 && 'Ruim'}
              {rating === 3 && 'Regular'}
              {rating === 4 && 'Bom'}
              {rating === 5 && 'Excelente'}
            </p>
          )}
        </div>

        {/* Título */}
        <div className="space-y-2">
          <Label htmlFor="title">Título da avaliação</Label>
          <Input
            id="title"
            type="text"
            placeholder="Resuma sua experiência"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            disabled={isSubmitting || !currentUser}
          />
        </div>

        {/* Comentário */}
        <div className="space-y-2">
          <Label htmlFor="comment">Seu comentário *</Label>
          <Textarea
            id="comment"
            placeholder="Conte-nos sobre sua experiência com este produto..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={2000}
            disabled={isSubmitting || !currentUser}
          />
          <p className="text-sm text-muted-foreground text-right">
            {comment.length}/2000 caracteres
          </p>
        </div>

        {/* Botão Submit */}
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || !currentUser}
        >
          {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
        </Button>

        <p className="text-xs text-muted-foreground text-center">
          Sua avaliação será analisada antes de ser publicada
        </p>
      </form>
    </Card>
  );
}

