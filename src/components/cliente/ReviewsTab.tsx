import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Edit,
  Trash2,
  Eye,
  Award,
  TrendingUp,
  Image as ImageIcon,
  Camera,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { getProductImage } from '@/utils/imageUtils';

interface ReviewsTabProps {
  userId: string;
}

const ReviewsTab: React.FC<ReviewsTabProps> = ({ userId }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    images: [] as string[],
    recommend: true,
  });

  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    helpfulVotes: 0,
    featured: 0,
  });

  const { toast } = useToast();
  const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

  useEffect(() => {
    loadReviews();
    loadPendingReviews();
    loadStats();
  }, [userId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/reviews`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setReviews(data.reviews || []);
      }
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/pending-reviews`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setPendingReviews(data.products || []);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos pendentes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/customers/${userId}/review-stats`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleSaveReview = async () => {
    if (!reviewForm.title.trim() || !reviewForm.comment.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha o título e o comentário',
        variant: 'destructive',
      });
      return;
    }

    try {
      const url = editingReview
        ? `${API_BASE_URL}/customers/${userId}/reviews/${editingReview.id}`
        : `${API_BASE_URL}/customers/${userId}/reviews`;

      const method = editingReview ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...reviewForm,
          productId: selectedProduct?.id,
        }),
      });

      if (response.ok) {
        toast({
          title: editingReview ? 'Avaliação atualizada!' : 'Avaliação enviada!',
          description: 'Obrigado por compartilhar sua opinião',
        });
        setIsDialogOpen(false);
        resetForm();
        loadReviews();
        loadPendingReviews();
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar a avaliação',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm('Deseja realmente excluir esta avaliação?')) return;

    try {
      await fetch(`${API_BASE_URL}/customers/${userId}/reviews/${reviewId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      setReviews(reviews.filter(r => r.id !== reviewId));
      toast({
        title: 'Avaliação excluída',
        description: 'Sua avaliação foi removida',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir a avaliação',
        variant: 'destructive',
      });
    }
  };

  const handleEditReview = (review: any) => {
    setEditingReview(review);
    setSelectedProduct(review.product);
    setReviewForm({
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images || [],
      recommend: review.recommend,
    });
    setIsDialogOpen(true);
  };

  const handleStartReview = (product: any) => {
    setSelectedProduct(product);
    setEditingReview(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setReviewForm({
      rating: 5,
      title: '',
      comment: '',
      images: [],
      recommend: true,
    });
    setSelectedProduct(null);
    setEditingReview(null);
  };

  const getFilteredReviews = () => {
    if (filter === 'all') return reviews;
    if (filter === 'pending') return reviews.filter(r => r.status === 'pending');
    if (filter === 'approved') return reviews.filter(r => r.status === 'approved');
    if (filter === 'featured') return reviews.filter(r => r.featured);
    return reviews;
  };

  const filteredReviews = getFilteredReviews();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com Estatísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            Minhas Avaliações
          </h2>
          <p className="text-muted-foreground">
            Compartilhe sua experiência com nossos produtos
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-blue-700">Total de Avaliações</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg">
                <Star className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-amber-700">Média de Estrelas</p>
                <p className="text-2xl font-bold text-amber-900">{(stats.averageRating || 0).toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <ThumbsUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-green-700">Votos Úteis</p>
                <p className="text-2xl font-bold text-green-900">{stats.helpfulVotes}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Award className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-purple-700">Destacadas</p>
                <p className="text-2xl font-bold text-purple-900">{stats.featured}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Produtos Pendentes de Avaliação */}
      {pendingReviews.length > 0 && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-600" />
              Produtos Aguardando Avaliação
              <Badge className="bg-amber-500 ml-2">{pendingReviews.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {pendingReviews.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-amber-200 rounded-lg p-3 flex items-center gap-3"
                >
                  <img
                    src={getProductImage(product)}
                    alt={product.nome}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{product.nome}</h4>
                    <p className="text-xs text-muted-foreground">
                      Comprado em {new Date(product.purchaseDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartReview(product)}
                  >
                    <Star className="w-3 h-3 mr-1" />
                    Avaliar
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              Todas ({reviews.length})
            </Button>
            <Button
              variant={filter === 'approved' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('approved')}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Aprovadas
            </Button>
            <Button
              variant={filter === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('pending')}
            >
              <Clock className="w-3 h-3 mr-1" />
              Pendentes
            </Button>
            <Button
              variant={filter === 'featured' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('featured')}
            >
              <Award className="w-3 h-3 mr-1" />
              Destacadas
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Avaliações */}
      {filteredReviews.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma avaliação ainda</h3>
            <p className="text-muted-foreground mb-4">
              {filter === 'all'
                ? 'Avalie produtos que você comprou para ajudar outros clientes'
                : 'Nenhuma avaliação nesta categoria'}
            </p>
            {pendingReviews.length > 0 && (
              <Button onClick={() => handleStartReview(pendingReviews[0])}>
                <Star className="w-4 h-4 mr-2" />
                Avaliar Primeiro Produto
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filteredReviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={review.featured ? 'border-2 border-amber-300 bg-amber-50/30' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <img
                        src={getProductImage(review.product)}
                        alt={review.product.nome}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-semibold">{review.product.nome}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < review.rating
                                        ? 'text-yellow-500 fill-yellow-500'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              {review.status === 'approved' && (
                                <Badge className="bg-green-500 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Aprovada
                                </Badge>
                              )}
                              {review.status === 'pending' && (
                                <Badge variant="secondary" className="text-xs">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Em análise
                                </Badge>
                              )}
                              {review.featured && (
                                <Badge className="bg-amber-500 text-xs">
                                  <Award className="w-3 h-3 mr-1" />
                                  Destaque
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditReview(review)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteReview(review.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        <h4 className="font-semibold mb-2">{review.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{review.comment}</p>

                        {review.images && review.images.length > 0 && (
                          <div className="flex gap-2 mb-3">
                            {review.images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Review ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded border"
                              />
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{review.helpfulCount || 0} úteis</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{review.views || 0} visualizações</span>
                          </div>
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Dialog de Avaliação */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingReview ? 'Editar Avaliação' : 'Nova Avaliação'}
            </DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="bg-muted/30 p-4 rounded-lg flex items-center gap-3 mb-4">
              <img
                src={getProductImage(selectedProduct)}
                alt={selectedProduct.nome}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-semibold">{selectedProduct.nome}</h3>
                <p className="text-sm text-muted-foreground">
                  Comprado em {new Date(selectedProduct.purchaseDate || Date.now()).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Rating */}
            <div>
              <Label>Avaliação</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setReviewForm({ ...reviewForm, rating })}
                    className="p-2 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        rating <= reviewForm.rating
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Título */}
            <div>
              <Label htmlFor="review-title">Título da Avaliação</Label>
              <Input
                id="review-title"
                value={reviewForm.title}
                onChange={(e) => setReviewForm({ ...reviewForm, title: e.target.value })}
                placeholder="Ex: Produto excelente, superou expectativas!"
                maxLength={100}
              />
            </div>

            {/* Comentário */}
            <div>
              <Label htmlFor="review-comment">Seu Comentário</Label>
              <textarea
                id="review-comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                placeholder="Conte sua experiência com este produto..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {reviewForm.comment.length}/500 caracteres
              </p>
            </div>

            {/* Recomenda */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recommend"
                checked={reviewForm.recommend}
                onChange={(e) => setReviewForm({ ...reviewForm, recommend: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="recommend" className="cursor-pointer">
                Eu recomendo este produto
              </Label>
            </div>

            {/* Upload de Imagens (Placeholder) */}
            <div>
              <Label>Adicionar Fotos (opcional)</Label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center">
                <Camera className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para adicionar fotos do produto
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo de 3 imagens (JPG, PNG)
                </p>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveReview} className="flex-1">
                {editingReview ? 'Atualizar Avaliação' : 'Enviar Avaliação'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReviewsTab;

