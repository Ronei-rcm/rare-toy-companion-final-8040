import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ReviewFormProps {
  productId: number;
  productName: string;
  userId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, productName, userId, onSuccess, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [pros, setPros] = useState('');
  const [cons, setCons] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validar quantidade (máximo 5 imagens)
    if (images.length + files.length > 5) {
      toast({
        title: 'Limite excedido',
        description: 'Você pode enviar no máximo 5 imagens',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máximo 5MB por imagem)
    const invalidFiles = files.filter(f => f.size > 5 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Cada imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    // Criar previews
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });

    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
    setPreviews(previews.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (rating === 0) {
      toast({
        title: 'Avaliação obrigatória',
        description: 'Por favor, selecione uma avaliação com estrelas',
        variant: 'destructive',
      });
      return;
    }

    if (comment.trim().length < 20) {
      toast({
        title: 'Comentário muito curto',
        description: 'Escreva pelo menos 20 caracteres no comentário',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Criar FormData para enviar com imagens
      const formData = new FormData();
      formData.append('product_id', productId.toString());
      formData.append('user_id', userId);
      formData.append('rating', rating.toString());
      formData.append('title', title);
      formData.append('comment', comment);
      formData.append('pros', pros);
      formData.append('cons', cons);

      // Adicionar imagens
      images.forEach((image, index) => {
        formData.append(`images`, image);
      });

      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar avaliação');
      }

      toast({
        title: 'Avaliação enviada!',
        description: 'Sua avaliação será analisada e publicada em breve.',
      });

      // Limpar form
      setRating(0);
      setTitle('');
      setComment('');
      setPros('');
      setCons('');
      setImages([]);
      setPreviews([]);

      onSuccess?.();
    } catch (error) {
      console.error('Erro ao enviar review:', error);
      toast({
        title: 'Erro ao enviar',
        description: 'Não foi possível enviar sua avaliação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border p-6 space-y-6"
    >
      <div>
        <h3 className="text-xl font-bold mb-2">Avaliar Produto</h3>
        <p className="text-sm text-muted-foreground">{productName}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rating com estrelas */}
        <div>
          <Label className="text-base mb-2 block">
            Sua avaliação <span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
            {rating > 0 && (
              <span className="text-sm text-muted-foreground ml-2">
                {rating === 5 && 'Excelente!'}
                {rating === 4 && 'Muito bom!'}
                {rating === 3 && 'Bom'}
                {rating === 2 && 'Regular'}
                {rating === 1 && 'Ruim'}
              </span>
            )}
          </div>
        </div>

        {/* Título */}
        <div>
          <Label htmlFor="title">Título da avaliação (opcional)</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Produto excelente, recomendo!"
            maxLength={200}
          />
        </div>

        {/* Comentário */}
        <div>
          <Label htmlFor="comment">
            Comentário <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Conte mais sobre sua experiência com o produto..."
            rows={4}
            maxLength={1000}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {comment.length}/1000 caracteres (mínimo 20)
          </p>
        </div>

        {/* Pontos positivos */}
        <div>
          <Label htmlFor="pros">Pontos positivos</Label>
          <Textarea
            id="pros"
            value={pros}
            onChange={(e) => setPros(e.target.value)}
            placeholder="O que você mais gostou?"
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Pontos negativos */}
        <div>
          <Label htmlFor="cons">Pontos negativos</Label>
          <Textarea
            id="cons"
            value={cons}
            onChange={(e) => setCons(e.target.value)}
            placeholder="O que poderia melhorar?"
            rows={2}
            maxLength={500}
          />
        </div>

        {/* Upload de fotos */}
        <div>
          <Label>Fotos (opcional)</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Adicione até 5 fotos (máximo 5MB cada)
          </p>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-5 gap-2 mb-3">
              {previews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {images.length < 5 && (
            <label className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">
                  Clique para adicionar fotos
                </span>
                <span className="text-xs text-gray-400">
                  {images.length}/5 fotos
                </span>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-medium mb-1">Diretrizes para avaliações:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-800">
              <li>Seja honesto e construtivo</li>
              <li>Foque na sua experiência com o produto</li>
              <li>Evite linguagem ofensiva ou discriminatória</li>
              <li>Sua avaliação será moderada antes da publicação</li>
            </ul>
          </div>
        </div>

        {/* Botões */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Enviar Avaliação
              </>
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </motion.div>
  );
}

