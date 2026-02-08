import React from 'react';
import { motion } from 'framer-motion';
import { Star, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { ReviewModeration } from '@/components/admin/ReviewModeration';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { request } from '@/services/api-config';

export default function Reviews() {
  const [stats, setStats] = React.useState<any>(null);

  React.useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await request<any>('/admin/reviews/stats');
      setStats(data);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciar Avaliações</h1>
        <p className="text-muted-foreground">
          Modere, responda e gerencie as avaliações dos clientes
        </p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pending || 0}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Aprovadas</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved || 0}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Rejeitadas</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected || 0}</p>
              </div>
              <div className="bg-red-100 p-3 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Com Resposta</p>
                <p className="text-3xl font-bold text-blue-600">{stats.with_response || 0}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Tabs de moderação */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pendentes ({stats?.pending || 0})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovadas ({stats?.approved || 0})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({stats?.rejected || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <ReviewModeration />
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Reviews aprovadas aparecem nas páginas dos produtos
            </p>
          </div>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <div className="text-center py-12">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Reviews rejeitadas não são publicadas
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

