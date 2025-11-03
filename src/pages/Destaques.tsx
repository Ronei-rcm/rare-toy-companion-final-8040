
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Award, Bookmark, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const produtosDestaque = [
  {
    id: '1',
    nome: 'Boneco Woody Toy Story - Edição Limitada',
    preco: 559.90,
    descricao: 'Boneco original da primeira edição de Toy Story, em estado de conservação excepcional. Um item para verdadeiros colecionadores.',
    categoria: 'Colecionáveis',
    raridade: 'Ultra Raro',
    avaliacao: 5,
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    ano: '1995',
    quantidade: 1
  },
  {
    id: '2',
    nome: 'Hot Wheels Série Limitada - Treasure Hunt',
    preco: 299.90,
    descricao: 'Conjunto completo de Hot Wheels Treasure Hunt dos anos 90. Todos os carros estão em suas embalagens originais.',
    categoria: 'Carrinhos',
    raridade: 'Muito Raro',
    avaliacao: 4.9,
    imagemUrl: '/lovable-uploads/5f25d86c-7dd5-4ee8-a882-240f06f77054.png',
    ano: '1997',
    quantidade: 3
  },
  {
    id: '3',
    nome: 'Buzz Lightyear - Primeira Edição',
    preco: 789.90,
    descricao: 'Buzz Lightyear da primeira edição lançada pela Disney, com todos os acessórios originais e caixa.',
    categoria: 'Bonecos de Ação',
    raridade: 'Extremamente Raro',
    avaliacao: 5,
    imagemUrl: '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png',
    ano: '1995',
    quantidade: 1
  },
];

const Destaques = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-orange-800">
            Peças Excepcionais
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa coleção exclusiva de brinquedos raros e peças de colecionador que 
            trazem nostalgia e alegria para todas as idades.
          </p>
        </div>

        <motion.div 
          className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {produtosDestaque.map((produto) => (
            <motion.div key={produto.id} variants={item}>
              <Card className="h-full flex flex-col overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="p-0">
                  <AspectRatio ratio={4/3}>
                    <img 
                      src={produto.imagemUrl} 
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  </AspectRatio>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-red-600">{produto.raridade}</Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-grow p-5">
                  <h3 className="text-xl font-bold mb-2 text-orange-800">{produto.nome}</h3>
                  
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < Math.floor(produto.avaliacao) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                    <span className="text-sm ml-1">{produto.avaliacao}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                    <Badge variant="outline" className="bg-orange-50">
                      <Clock className="mr-1 h-3 w-3" /> {produto.ano}
                    </Badge>
                    <Badge variant="outline" className="bg-orange-50">
                      {produto.categoria}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-2 line-clamp-3">
                    {produto.descricao}
                  </p>
                  
                  <div className="flex items-center mt-3">
                    <Award className="h-5 w-5 text-amber-500 mr-1.5" />
                    <span className="text-sm">
                      Apenas {produto.quantidade} {produto.quantidade === 1 ? 'unidade' : 'unidades'} disponível
                    </span>
                  </div>
                </CardContent>
                
                <CardFooter className="p-5 pt-0">
                  <div className="w-full flex flex-col gap-2">
                    <div className="text-2xl font-bold text-orange-600">
                      R$ {produto.preco.toFixed(2)}
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" className="border-orange-300">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <div className="flex justify-center">
          <Link to="/loja">
            <Button variant="outline" size="lg" className="gap-2">
              Ver Catálogo Completo <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default Destaques;
