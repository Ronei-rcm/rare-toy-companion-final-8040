import { useState } from 'react';
import { ReviewStats } from './ReviewStats';
import { ReviewForm } from './ReviewForm';
import { ReviewList } from './ReviewList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, PenSquare } from 'lucide-react';

interface ProductReviewsProps {
  productId: number;
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState('reviews');

  const handleReviewSubmitted = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('reviews');
  };

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <ReviewStats productId={productId} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reviews" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Avaliações
          </TabsTrigger>
          <TabsTrigger value="write" className="gap-2">
            <PenSquare className="h-4 w-4" />
            Escrever Avaliação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reviews" className="mt-6">
          <ReviewList
            productId={productId}
            refreshTrigger={refreshTrigger}
          />
        </TabsContent>

        <TabsContent value="write" className="mt-6">
          <ReviewForm
            productId={productId}
            onSuccess={handleReviewSubmitted}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

