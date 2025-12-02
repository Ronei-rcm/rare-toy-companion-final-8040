import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Heart, 
  Share2, 
  MessageCircle, 
  Star, 
  Trophy, 
  Gift, 
  Crown,
  Zap,
  TrendingUp,
  Award,
  Target,
  Camera,
  Plus,
  Settings,
  Bell,
  UserPlus,
  ThumbsUp,
  Eye,
  Calendar,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  Copy,
  Check,
  Sparkles,
  Diamond,
  Gem,
  Medal,
  Shield,
  Flame
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useSocialFeatures } from '@/hooks/useSocialFeatures';
import { toast } from 'sonner';

interface SocialDashboardProps {
  userId: string;
}

export function SocialDashboard({ userId }: SocialDashboardProps) {
  const [activeTab, setActiveTab] = useState('feed');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const {
    user,
    reviews,
    socialFeed,
    loyaltyProgram,
    referralProgram,
    loadUserData,
    shareProduct,
    createSocialPost,
    generateReferralCode,
    useReferralCode,
    loadSocialFeed,
    createReview,
    addPoints
  } = useSocialFeatures();

  useEffect(() => {
    if (userId) {
      loadUserData(userId);
    }
  }, [userId, loadUserData]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'bronze': return 'text-amber-600 bg-amber-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      case 'diamond': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'bronze': return <Medal className="w-4 h-4" />;
      case 'silver': return <Award className="w-4 h-4" />;
      case 'gold': return <Trophy className="w-4 h-4" />;
      case 'platinum': return <Crown className="w-4 h-4" />;
      case 'diamond': return <Diamond className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  const getNextLevelInfo = () => {
    if (!user || !loyaltyProgram) return null;

    const currentLevelIndex = ['bronze', 'silver', 'gold', 'platinum', 'diamond'].indexOf(user.level);
    const nextLevel = ['bronze', 'silver', 'gold', 'platinum', 'diamond'][currentLevelIndex + 1];
    
    if (!nextLevel) return null;

    const nextLevelPoints = loyaltyProgram.levels[nextLevel as keyof typeof loyaltyProgram.levels].minPoints;
    const pointsNeeded = nextLevelPoints - user.points;
    const progress = (user.points / nextLevelPoints) * 100;

    return { nextLevel, pointsNeeded, progress };
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;

    try {
      await createSocialPost('custom', newPostContent);
      setNewPostContent('');
      setShowCreatePost(false);
      toast.success('Post criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao criar post');
    }
  };

  const handleGenerateReferral = async () => {
    try {
      const referral = await generateReferralCode();
      if (referral) {
        setReferralCode(referral.code);
        setShowReferralModal(true);
        toast.success('Código de referência gerado!');
      }
    } catch (error) {
      toast.error('Erro ao gerar código');
    }
  };

  const handleUseReferralCode = async () => {
    if (!referralCode.trim()) return;

    try {
      const result = await useReferralCode(referralCode);
      if (result.success) {
        toast.success(result.message);
        setReferralCode('');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error('Erro ao usar código');
    }
  };

  const copyReferralCode = async () => {
    if (referralProgram?.code) {
      await navigator.clipboard.writeText(referralProgram.code);
      toast.success('Código copiado!');
    }
  };

  const nextLevelInfo = getNextLevelInfo();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Perfil do usuário */}
        <Card className="flex-1">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="text-2xl">
                  {user?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold">{user?.name}</h2>
                  <Badge className={`${getLevelColor(user?.level || 'bronze')} flex items-center gap-1`}>
                    {getLevelIcon(user?.level || 'bronze')}
                    {user?.level?.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-3">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{user?.followers} seguidores</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <UserPlus className="w-4 h-4" />
                    <span>{user?.following} seguindo</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    <span>{user?.reviews} reviews</span>
                  </div>
                </div>

                {/* Barra de progresso para próximo nível */}
                {nextLevelInfo && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Próximo nível: {nextLevelInfo.nextLevel.toUpperCase()}</span>
                      <span>{nextLevelInfo.pointsNeeded} pontos restantes</span>
                    </div>
                    <Progress value={nextLevelInfo.progress} className="h-2" />
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center gap-2">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{user?.points?.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Pontos</div>
                </div>
                <Button size="sm" onClick={handleGenerateReferral}>
                  <Gift className="w-4 h-4 mr-1" />
                  Referir
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 w-full lg:w-64">
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{user?.helpfulVotes || 0}</div>
              <div className="text-sm text-gray-600">Útil</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Share2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">42</div>
              <div className="text-sm text-gray-600">Compartilhamentos</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feed">Feed Social</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="loyalty">Fidelidade</TabsTrigger>
          <TabsTrigger value="referrals">Indicações</TabsTrigger>
        </TabsList>

        {/* Feed Social */}
        <TabsContent value="feed" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Feed Social</h3>
            <Button onClick={() => setShowCreatePost(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Post
            </Button>
          </div>

          <div className="space-y-4">
            {socialFeed.map((post, index) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={post.userAvatar} />
                        <AvatarFallback>{post.userName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold">{post.userName}</span>
                          <Badge variant="outline" className="text-xs">
                            {post.type}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-4">{post.content}</p>
                        
                        {post.images.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                            {post.images.map((image, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={image}
                                alt=""
                                className="w-full h-32 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-6">
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <Heart className={`w-4 h-4 ${post.isLiked ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                            {post.likes}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-gray-400" />
                            {post.comments}
                          </Button>
                          <Button variant="ghost" size="sm" className="flex items-center gap-2">
                            <Share2 className="w-4 h-4 text-gray-400" />
                            {post.shares}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">Suas Reviews</h3>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Review
            </Button>
          </div>

          <div className="space-y-4">
            {reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{review.title}</span>
                          {review.verified && (
                            <Badge variant="secondary" className="text-xs">
                              <Check className="w-3 h-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-700 mb-4">{review.content}</p>
                        
                        {review.images.length > 0 && (
                          <div className="flex gap-2 mb-4">
                            {review.images.map((image, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={image}
                                alt=""
                                className="w-20 h-20 object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-6 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-4 h-4" />
                            <span>{review.helpful} útil</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            <span>{review.helpful + review.notHelpful} visualizações</span>
                          </div>
                          <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* Programa de Fidelidade */}
        <TabsContent value="loyalty" className="space-y-6">
          <h3 className="text-xl font-bold">Programa de Fidelidade</h3>
          
          {loyaltyProgram && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(loyaltyProgram.levels).map(([level, config]) => (
                <Card key={level} className={user?.level === level ? 'ring-2 ring-purple-500' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getLevelIcon(level)}
                      <span className="capitalize">{level}</span>
                      {user?.level === level && (
                        <Badge variant="secondary">Atual</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="text-2xl font-bold text-purple-600">
                        {config.minPoints.toLocaleString()} pts
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {config.discountPercent}% desconto
                      </div>
                      <div className="space-y-1">
                        {config.benefits.map((benefit, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-3 h-3 text-green-500" />
                            {benefit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Como ganhar pontos */}
          <Card>
            <CardHeader>
              <CardTitle>Como ganhar pontos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {loyaltyProgram?.pointRules && Object.entries(loyaltyProgram.pointRules).map(([action, points]) => (
                  <div key={action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize">{action.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge variant="secondary">+{points} pts</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Indicações */}
        <TabsContent value="referrals" className="space-y-6">
          <h3 className="text-xl font-bold">Programa de Indicações</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Seu código de referência</CardTitle>
              </CardHeader>
              <CardContent>
                {referralProgram ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        value={referralProgram.code}
                        readOnly
                        className="font-mono"
                      />
                      <Button onClick={copyReferralCode}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>Usos: {referralProgram.currentUses}/{referralProgram.maxUses}</p>
                      <p>Desconto: {referralProgram.discountPercent}%</p>
                      <p>Você ganha: {referralProgram.referralReward} pontos</p>
                    </div>
                  </div>
                ) : (
                  <Button onClick={handleGenerateReferral} className="w-full">
                    <Gift className="w-4 h-4 mr-2" />
                    Gerar Código
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usar código de referência</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Input
                    placeholder="Digite o código de referência"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                  />
                  <Button onClick={handleUseReferralCode} className="w-full">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Aplicar Código
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para criar post */}
      <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Post</DialogTitle>
            <DialogDescription>
              Compartilhe suas ideias, experiências ou novidades com a comunidade
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="O que você está pensando?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreatePost}>
                Publicar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
