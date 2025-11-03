
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ThumbsUp, MessageSquare } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Dados simulados de avaliações
const avaliacoes = [
  {
    id: '1',
    usuario: 'Maria Silva',
    avatar: null,
    iniciais: 'MS',
    data: '15/04/2023',
    avaliacao: 5,
    comentario: 'Meu filho amou este brinquedo! A qualidade é excelente e o preço valeu a pena. Recomendo para todas as crianças que gostam de aventuras espaciais.',
    curtidas: 12,
    respostas: 1,
    verificado: true,
  },
  {
    id: '2',
    usuario: 'João Pereira',
    avatar: null,
    iniciais: 'JP',
    data: '02/03/2023',
    avaliacao: 4,
    comentario: 'Bom brinquedo, mas os acessórios são um pouco frágeis. De qualquer forma, meu filho está brincando bastante com ele.',
    curtidas: 5,
    respostas: 0,
    verificado: true,
  },
  {
    id: '3',
    usuario: 'Ana Beatriz',
    avatar: null,
    iniciais: 'AB',
    data: '17/02/2023',
    avaliacao: 3,
    comentario: 'O boneco é menor do que eu esperava, mas a qualidade é boa e meu filho gostou.',
    curtidas: 2,
    respostas: 2,
    verificado: false,
  },
];

const ProdutoAvaliacoes = ({ produtoId }: { produtoId?: string }) => {
  // Calcular a média de avaliações
  const mediaAvaliacoes = avaliacoes.reduce((acc, av) => acc + av.avaliacao, 0) / avaliacoes.length;
  
  // Distribuição das avaliações (de 5 estrelas a 1 estrela)
  const distribuicao = [
    { estrelas: 5, porcentagem: 70 },
    { estrelas: 4, porcentagem: 20 },
    { estrelas: 3, porcentagem: 10 },
    { estrelas: 2, porcentagem: 0 },
    { estrelas: 1, porcentagem: 0 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Avaliações dos Clientes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resumo das avaliações */}
          <div className="flex flex-col items-center justify-center border rounded-lg p-6">
            <div className="text-5xl font-bold mb-2">{mediaAvaliacoes.toFixed(1)}</div>
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.round(mediaAvaliacoes) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                />
              ))}
            </div>
            <div className="text-sm text-muted-foreground">
              Baseado em {avaliacoes.length} avaliações
            </div>
          </div>
          
          {/* Distribuição de estrelas */}
          <div className="col-span-1 md:col-span-2 space-y-3">
            {distribuicao.map((item) => (
              <div key={item.estrelas} className="flex items-center">
                <div className="w-16 text-sm">{item.estrelas} estrelas</div>
                <div className="flex-grow mx-3 bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-yellow-400 h-full"
                    style={{ width: `${item.porcentagem}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-right">{item.porcentagem}%</div>
              </div>
            ))}
          </div>
        </div>
        
        <Separator />
        
        {/* Lista de avaliações */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">{avaliacoes.length} avaliações</h3>
            <Button variant="outline">Escrever uma avaliação</Button>
          </div>
          
          <div className="space-y-6">
            {avaliacoes.map((avaliacao) => (
              <div key={avaliacao.id} className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={avaliacao.avatar || undefined} alt={avaliacao.usuario} />
                      <AvatarFallback>{avaliacao.iniciais}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center">
                        <h4 className="font-medium">{avaliacao.usuario}</h4>
                        {avaliacao.verificado && (
                          <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                            Compra verificada
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">{avaliacao.data}</div>
                    </div>
                  </div>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 ${i < avaliacao.avaliacao ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                      />
                    ))}
                  </div>
                </div>
                
                <p className="text-sm">{avaliacao.comentario}</p>
                
                <div className="flex gap-4">
                  <Button variant="ghost" size="sm" className="h-8">
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    <span className="text-xs">Útil ({avaliacao.curtidas})</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="text-xs">Responder</span>
                  </Button>
                </div>
                
                {avaliacao.id !== avaliacoes[avaliacoes.length - 1].id && <Separator />}
              </div>
            ))}
          </div>
          
          <div className="flex justify-center">
            <Button variant="outline">Ver mais avaliações</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProdutoAvaliacoes;
