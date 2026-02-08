import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, CheckCircle, XCircle, Trash2, Eye, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { request } from '@/services/api-config';

interface Review {
  id: number;
  product_id: number;
  product_name: string;
  product_image: string;
  customer_name: string;
  customer_email: string;
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  verified_purchase: boolean;
  helpful_count: number;
  reported_count: number;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ReviewsAdmin() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchReviews(activeTab);
  }, [activeTab]);

  const fetchReviews = async (status?: string) => {
    try {
      setLoading(true);
      const url = status ? `/admin/reviews?status=${status}` : '/admin/reviews';
      const data = await request<any>(url);
      setReviews(data.reviews || []);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar avaliações',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (reviewId: number) => {
    setIsProcessing(true);
    try {
      const data = await request<any>(`/admin/reviews/${reviewId}/approve`, {
        method: 'PUT',
      });

      toast({
        title: 'Avaliação aprovada',
        description: data.message,
      });
      fetchReviews(activeTab);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao aprovar avaliação',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReview) return;

    setIsProcessing(true);
    try {
      const data = await request<any>(`/admin/reviews/${selectedReview.id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({
          admin_notes: rejectNotes,
        }),
      });

      toast({
        title: 'Avaliação rejeitada',
        description: data.message,
      });
      setShowRejectDialog(false);
      setRejectNotes('');
      setSelectedReview(null);
      fetchReviews(activeTab);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao rejeitar avaliação',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async (reviewId: number) => {
    if (!confirm('Tem certeza que deseja excluir esta avaliação permanentemente?')) {
      return;
    }

    setIsProcessing(true);
    try {
      const data = await request<any>(`/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      toast({
        title: 'Avaliação excluída',
        description: data.message,
      });
      fetchReviews(activeTab);
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao excluir avaliação',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> = {
      pending: {
        variant: 'secondary',
        icon: AlertTriangle,
        label: 'Pendente',
      },
      approved: {
        variant: 'default',
        icon: CheckCircle,
        label: 'Aprovado',
      },
      rejected: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Rejeitado',
      },
    };

    const config = variants[status] || variants.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const ReviewTable = ({ reviews }: { reviews: Review[] }) => {
    if (loading) {
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      );
    }

    if (reviews.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhuma avaliação encontrada</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Produto</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Avaliação</TableHead>
            <TableHead>Comentário</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  {review.product_image && (
                    <img
                      src={review.product_image}
                      alt={review.product_name}
                      className="h-10 w-10 object-cover rounded"
                    />
                  )}
                  <span className="text-sm font-medium max-w-[200px] truncate">
                    {review.product_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">{review.customer_name}</div>
                  <div className="text-muted-foreground text-xs">{review.customer_email}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3 w-3 ${i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <p className="text-sm max-w-[300px] truncate">{review.comment}</p>
              </TableCell>
              <TableCell>{getStatusBadge(review.status)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(review.created_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedReview(review);
                      setShowViewDialog(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {review.status === 'pending' && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setShowRejectDialog(true);
                        }}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(review.id)}
                    disabled={isProcessing}
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Moderação de Avaliações</h1>
        <p className="text-muted-foreground">Gerencie as avaliações dos clientes</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes
            {reviews.filter((r) => r.status === 'pending').length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {reviews.filter((r) => r.status === 'pending').length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="p-6">
            <ReviewTable reviews={reviews} />
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card className="p-6">
            <ReviewTable reviews={reviews} />
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card className="p-6">
            <ReviewTable reviews={reviews} />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de Visualização */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                {selectedReview.product_image && (
                  <img
                    src={selectedReview.product_image}
                    alt={selectedReview.product_name}
                    className="h-20 w-20 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold">{selectedReview.product_name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedReview.customer_name} • {selectedReview.customer_email}
                  </p>
                </div>
                {getStatusBadge(selectedReview.status)}
              </div>

              <div>
                <Label>Avaliação</Label>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${i < selectedReview.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'fill-gray-200 text-gray-200'
                        }`}
                    />
                  ))}
                </div>
              </div>

              {selectedReview.title && (
                <div>
                  <Label>Título</Label>
                  <p className="text-sm mt-1">{selectedReview.title}</p>
                </div>
              )}

              <div>
                <Label>Comentário</Label>
                <p className="text-sm mt-1 whitespace-pre-wrap">{selectedReview.comment}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Útil</Label>
                  <p className="mt-1">{selectedReview.helpful_count} votos</p>
                </div>
                <div>
                  <Label>Denúncias</Label>
                  <p className="mt-1">{selectedReview.reported_count || 0}</p>
                </div>
                <div>
                  <Label>Compra Verificada</Label>
                  <p className="mt-1">{selectedReview.verified_purchase ? 'Sim' : 'Não'}</p>
                </div>
                <div>
                  <Label>Criado em</Label>
                  <p className="mt-1">{formatDate(selectedReview.created_at)}</p>
                </div>
              </div>

              {selectedReview.admin_notes && (
                <div>
                  <Label>Notas do Administrador</Label>
                  <p className="text-sm mt-1 text-muted-foreground">
                    {selectedReview.admin_notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar Avaliação</DialogTitle>
            <DialogDescription>
              Adicione uma nota explicando o motivo da rejeição (opcional).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="reject-notes">Motivo da rejeição</Label>
              <Textarea
                id="reject-notes"
                placeholder="Ex: Conteúdo inapropriado, linguagem ofensiva, spam..."
                value={rejectNotes}
                onChange={(e) => setRejectNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setRejectNotes('');
                setSelectedReview(null);
              }}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button onClick={handleReject} variant="destructive" disabled={isProcessing}>
              {isProcessing ? 'Rejeitando...' : 'Rejeitar Avaliação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

