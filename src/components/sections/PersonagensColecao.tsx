import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useHomeConfig } from '@/contexts/HomeConfigContext';
import { ArrowRight, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const personagens = [
  {
    nome: 'Yoshi',
    descricao: 'Yoshi Rebelde',
    cor: 'from-green-400 to-green-600',
    icon: '🦕'
  },
  {
    nome: 'Bowser',
    descricao: 'Darth Bowser',
    cor: 'from-orange-500 to-red-600',
    icon: '👹'
  },
  {
    nome: 'Toad',
    descricao: 'Toad Stormtrooper',
    cor: 'from-blue-400 to-blue-600',
    icon: '🍄'
  },
  {
    nome: 'Wario',
    descricao: 'Wario Contrabandista',
    cor: 'from-yellow-400 to-yellow-600',
    icon: '💰'
  },
  {
    nome: 'Peach',
    descricao: 'Princesa Leia',
    cor: 'from-pink-400 to-purple-600',
    icon: '👑'
  }
];

const PersonagensColecao = () => {
  const { config } = useHomeConfig();
  const title = (config as any)?.personagensColecao?.title ?? 'Personagens da Coleção';
  const subtitle = (config as any)?.personagensColecao?.subtitle ?? 'Conheça nossos personagens favoritos e complete sua coleção.';
  
  return (
    <section className="py-20 bg-background">
      <div className="container max-w-6xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {subtitle}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
          {personagens.map((personagem, index) => (
            <motion.div
              key={personagem.nome}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group cursor-pointer"
            >
              <div className={`bg-gradient-to-br ${personagem.cor} rounded-2xl p-6 text-center text-white h-40 flex flex-col justify-center items-center transform transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl`}>
                <div className="text-4xl mb-2">{personagem.icon}</div>
                <h3 className="font-bold text-sm md:text-base">{personagem.nome}</h3>
                <p className="text-xs opacity-90 mt-1">{personagem.descricao}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/loja">
            <Button size="lg" className="bg-foreground text-background hover:bg-foreground/90">
              Ver todos os Personagens Nintendo
            </Button>
          </Link>
        </div>

        {/* Seções de Serviços */}
        <div className="grid md:grid-cols-4 gap-8 mt-20 pt-20 border-t">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Produtos Raros</h3>
            <p className="text-sm text-muted-foreground">
              Selecionamos os action figures mais raros e exclusivos do mercado
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Verificação</h3>
            <p className="text-sm text-muted-foreground">
              Todos os produtos são autenticados e verificados pela nossa equipe
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Avaliações e Estrelas</h3>
            <p className="text-sm text-muted-foreground">
              Avaliamos e classificamos cada item com base em qualidade e raridade
            </p>
          </div>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Entrega Segura</h3>
            <p className="text-sm text-muted-foreground">
              Embalagem especial e entrega com rastreamento para produtos colecionáveis
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PersonagensColecao;