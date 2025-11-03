import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, PenSquare } from 'lucide-react';
import { ReviewForm } from './ReviewForm';
import { ReviewsList } from './ReviewsList';
import { ReviewStats } from './ReviewStats';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrentUser } from '@/contexts/CurrentUserContext';

interface ReviewsSectionProps {
  productId: number;
  productName: string;
}

export function ReviewsSection({ productId, productName }: ReviewsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const { user } = useCurrentUser();

  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

  React.useEffect(() => {
    fetchStats();
  }, [productId]);

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews/stats`);
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleReviewSubmitted = () => {
    setShowForm(false);
    fetchStats();
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="w-6 h-6 text-purple-600" />
            Avaliações de Clientes
          </h2>
          {stats && (
            <p className="text-muted-foreground mt-1">
              {stats.total_reviews} {stats.total_reviews === 1 ? 'avaliação' : 'avaliações'}
            </p>
          )}
        </div>

        {user && !showForm && (
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <PenSquare className="w-4 h-4" />
            Escrever Avaliação
          </Button>
        )}
      </div>

      {/* Formulário de avaliação */}
      {showForm && user && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <ReviewForm
            productId={productId}
            productName={productName}
            userId={user.id}
            onSuccess={handleReviewSubmitted}
            onCancel={() => setShowForm(false)}
          />
        </motion.div>
      )}

      {/* Estatísticas */}
      {stats && stats.total_reviews > 0 && (
        <ReviewStats
          totalReviews={stats.total_reviews}
          avgRating={stats.avg_rating || 0}
          rating5={stats.rating_5 || 0}
          rating4={stats.rating_4 || 0}
          rating3={stats.rating_3 || 0}
          rating2={stats.rating_2 || 0}
          rating1={stats.rating_1 || 0}
          verifiedPurchases={stats.verified_purchases || 0}
        />
      )}

      {/* Lista de reviews */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="verified">Compras Verificadas</TabsTrigger>
          <TabsTrigger value="with-photos">Com Fotos</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <ReviewsList productId={productId} userId={user?.id} />
        </TabsContent>

        <TabsContent value="verified" className="mt-6">
          <ReviewsList productId={productId} userId={user?.id} />
        </TabsContent>

        <TabsContent value="with-photos" className="mt-6">
          <ReviewsList productId={productId} userId={user?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

