/**
 * Dados de fallback para modo offline
 * Usados quando a API não está disponível ou há problemas de CORS
 */

export interface MockProduct {
    id: string;
    nome: string;
    preco: number;
    precoOriginal?: number;
    categoria: string;
    imagem: string;
    descricao: string;
    estoque: number;
    destaque?: boolean;
    novo?: boolean;
    promocao?: boolean;
}

export interface MockCategory {
    id: string;
    nome: string;
    slug: string;
    imagem_url?: string;
    descricao: string;
    quantidade: number;
    cor?: string;
    icon?: string;
}

export interface MockEvent {
    id: string;
    titulo: string;
    descricao: string;
    data: string;
    local: string;
    imagem?: string;
    tipo: 'feira' | 'exposicao' | 'lancamento';
}

// Produtos mockados
export const MOCK_PRODUCTS: MockProduct[] = [
    {
        id: '1',
        nome: 'Mario Stormtrooper',
        preco: 299.99,
        precoOriginal: 399.99,
        categoria: 'Star Wars',
        imagem: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+TWFyaW8gU3Rvcm10cm9vcGVyPC90ZXh0Pjwvc3ZnPg==',
        descricao: 'Action figure colecionável premium do Mario vestido como Stormtrooper. Edição limitada.',
        estoque: 15,
        destaque: true,
        promocao: true
    },
    {
        id: '2',
        nome: 'Yoshi Rebelde',
        preco: 249.99,
        categoria: 'Star Wars',
        imagem: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzRFQ0RDNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+WW9zaGkgUmViZWxkZTwvdGV4dD48L3N2Zz4=',
        descricao: 'Yoshi como piloto da Aliança Rebelde. Detalhes incríveis!',
        estoque: 22,
        novo: true
    },
    {
        id: '3',
        nome: 'Bowser Darth',
        preco: 349.99,
        precoOriginal: 449.99,
        categoria: 'Star Wars',
        imagem: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzI4MjgyOCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjMwIiBmaWxsPSIjRkYwMDAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXdlaWdodD0iYm9sZCI+Qm93c2VyIERhcnRoPC90ZXh0Pjwvc3ZnPg==',
        descricao: 'Bowser como Darth Vader. O vilão supremo!',
        estoque: 8,
        destaque: true,
        promocao: true
    },
    {
        id: '4',
        nome: 'Princesa Leia Peach',
        preco: 279.99,
        categoria: 'Star Wars',
        imagem: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0ZGRDkzRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+TGVpYSBQZWFjaDwvdGV4dD48L3N2Zz4=',
        descricao: 'Princesa Peach como Princesa Leia. Realeza galáctica!',
        estoque: 18,
        novo: true
    },
    {
        id: '5',
        nome: 'Toad Comandante',
        preco: 199.99,
        categoria: 'Star Wars',
        imagem: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzk1RTFEMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjI0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+VG9hZCBDb21hbmRhbnRlPC90ZXh0Pjwvc3ZnPg==',
        descricao: 'Toad como comandante clone. Pequeno mas valente!',
        estoque: 30,
        destaque: false
    },
    {
        id: '6',
        nome: 'Wario Contrabandista',
        preco: 329.99,
        categoria: 'Star Wars',
        imagem: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iI0YzODE4MSIvPjx0ZXh0IHg9IjUwJSIgeT0iNDUlIiBmb250LXNpemU9IjIyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+V2FyaW88L3RleHQ+PHRleHQgeD0iNTAlIiB5PSI1NSUiIGZvbnQtc2l6ZT0iMjIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIj5Db250cmFiYW5kaXN0YTwvdGV4dD48L3N2Zz4=',
        descricao: 'Wario como Han Solo. O contrabandista mais ganancioso!',
        estoque: 12,
        promocao: true,
        precoOriginal: 399.99
    }
];

// Categorias mockadas
export const MOCK_CATEGORIES: MockCategory[] = [
    {
        id: '1',
        nome: 'Star Wars',
        slug: 'star-wars',
        descricao: 'Personagens Mario no universo Star Wars',
        quantidade: 25,
        cor: 'from-blue-500 to-purple-600',
        icon: '⭐'
    },
    {
        id: '2',
        nome: 'Marvel',
        slug: 'marvel',
        descricao: 'Heróis Mario no universo Marvel',
        quantidade: 18,
        cor: 'from-red-500 to-yellow-600',
        icon: '🦸'
    },
    {
        id: '3',
        nome: 'DC Comics',
        slug: 'dc-comics',
        descricao: 'Mario e amigos como heróis DC',
        quantidade: 15,
        cor: 'from-gray-700 to-blue-900',
        icon: '🦇'
    },
    {
        id: '4',
        nome: 'Clássicos',
        slug: 'classicos',
        descricao: 'Coleção clássica do Mario',
        quantidade: 32,
        cor: 'from-green-400 to-green-600',
        icon: '🍄'
    },
    {
        id: '5',
        nome: 'Edições Limitadas',
        slug: 'edicoes-limitadas',
        descricao: 'Peças exclusivas e raras',
        quantidade: 8,
        cor: 'from-yellow-400 to-orange-600',
        icon: '👑'
    }
];

// Eventos mockados
export const MOCK_EVENTS: MockEvent[] = [
    {
        id: '1',
        titulo: 'EXPOAER 2025',
        descricao: 'Maior feira de colecionáveis do Brasil',
        data: '2025-03-15',
        local: 'Pavilhão ExpoSul - Porto Alegre/RS',
        tipo: 'feira'
    },
    {
        id: '2',
        titulo: 'Lançamento: Saga Galática',
        descricao: 'Nova linha de produtos Star Wars x Mario',
        data: '2025-04-01',
        local: 'Loja MuhlStore - Online e Física',
        tipo: 'lancamento'
    },
    {
        id: '3',
        titulo: 'Exposição: 40 Anos de Mario',
        descricao: 'Retrospectiva completa da franquia',
        data: '2025-05-20',
        local: 'Museu do Brinquedo - São Paulo/SP',
        tipo: 'exposicao'
    }
];

// Stats de social proof mockados
export const MOCK_SOCIAL_STATS = {
    totalClientes: 15420,
    totalVendas: 8934,
    avaliacaoMedia: 4.8,
    produtosAtivos: 245
};

// Compras recentes mockadas
export const MOCK_RECENT_PURCHASES = [
    {
        id: '1',
        cliente: 'João Silva',
        produto: 'Mario Stormtrooper',
        preco: 299.99,
        imagemUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRkY2QjZCIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIj5NUzwvdGV4dD48L3N2Zz4=',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString() // 5 min atrás
    },
    {
        id: '2',
        cliente: 'Maria Santos',
        produto: 'Yoshi Rebelde',
        preco: 249.99,
        imagemUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjNEVDREM0Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSIgZm9udC1mYW1pbHk9IkFyaWFsIj5ZUjwvdGV4dD48L3N2Zz4=',
        timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString() // 12 min atrás
    },
    {
        id: '3',
        cliente: 'Pedro Costa',
        produto: 'Bowser Darth',
        preco: 349.99,
        imagemUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjMjgyODI4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiNGRjAwMDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmb250LWZhbWlseT0iQXJpYWwiPkJEPC90ZXh0Pjwvc3ZnPg==',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString() // 25 min atrás
    }
];

// Vídeos mockados
export const MOCK_VIDEOS = [
    {
        id: '1',
        titulo: 'EXPOAER 2025',
        descricao: 'Highlights da feira',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iI0ZGNkI2QiIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjM2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+RVhQT0FFUjwvdGV4dD48L3N2Zz4=',
        categoria: 'eventos',
        ativo: true
    },
    {
        id: '2',
        titulo: 'Gasômetro POA',
        descricao: 'Evento no Gasômetro',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iIzRFQ0RDNCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjM2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+R2Fzw7RtZXRybzwvdGV4dD48L3N2Zz4=',
        categoria: 'eventos',
        ativo: true
    },
    {
        id: '3',
        titulo: 'Redenção Porto Alegre',
        descricao: 'Tour pela coleção',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        thumbnailUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgZmlsbD0iI0ZGRDkzRCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjM2IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZvbnQtZmFtaWx5PSJBcmlhbCI+UmVkZW7Dp8OjbzwvdGV4dD48L3N2Zz4=',
        categoria: 'tours',
        ativo: true
    }
];
