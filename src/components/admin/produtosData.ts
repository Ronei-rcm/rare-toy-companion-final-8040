import { ProdutoStatus } from './ProdutoStatusBadge';
import { Produto } from '@/types/produto';

// Dados simulados dos produtos
export const produtosAdmin: Produto[] = [
  {
    id: '1',
    nome: 'Boneco Woody Toy Story',
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    categoria: 'Bonecos de Ação',
    preco: 189.90,
    estoque: 43,
    status: ProdutoStatus.ATIVO,
    colecao: 'toy-story',
    destaque: true,
    dataLancamento: '2023-05-15',
    fornecedor: 'Disney Oficial'
  },
  {
    id: '2',
    nome: 'Coleção Hot Wheels Vintage',
    imagemUrl: '/lovable-uploads/5f25d86c-7dd5-4ee8-a882-240f06f77054.png',
    categoria: 'Carrinhos',
    preco: 249.90,
    estoque: 21,
    status: ProdutoStatus.PROMOCAO,
    colecao: 'hot-wheels',
    destaque: true,
    dataLancamento: '2023-06-20',
    origem: 'EUA'
  },
  {
    id: '3',
    nome: 'Boneco Buzz Lightyear',
    imagemUrl: '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png',
    categoria: 'Bonecos de Ação',
    preco: 179.90,
    estoque: 65,
    status: ProdutoStatus.LANCAMENTO,
    colecao: 'toy-story',
    destaque: false,
    dataLancamento: '2024-01-10',
    fornecedor: 'Disney Oficial'
  },
  {
    id: '4',
    nome: 'Barbie Vintage Anos 80',
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    categoria: 'Bonecas',
    preco: 299.90,
    estoque: 12,
    status: ProdutoStatus.BAIXO_ESTOQUE,
    colecao: 'vintage',
    destaque: true,
    dataLancamento: '2023-08-05',
    codigoBarras: '780291847520'
  },
  {
    id: '5',
    nome: 'Coleção Toy Story Completa',
    imagemUrl: '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png',
    categoria: 'Colecionáveis',
    preco: 459.90,
    estoque: 38,
    status: ProdutoStatus.EXCLUSIVO,
    colecao: 'toy-story',
    destaque: true,
    dataLancamento: '2023-12-15',
    fornecedor: 'Disney Oficial'
  },
  {
    id: '6',
    nome: 'Hot Wheels Raros Anos 70',
    imagemUrl: '/lovable-uploads/5f25d86c-7dd5-4ee8-a882-240f06f77054.png',
    categoria: 'Carrinhos',
    preco: 389.90,
    estoque: 0,
    status: ProdutoStatus.SEM_ESTOQUE,
    colecao: 'hot-wheels',
    destaque: false,
    dataLancamento: '2023-04-18',
    codigoBarras: '780291847521'
  },
  {
    id: '7',
    nome: 'Conjunto LEGO Star Wars',
    imagemUrl: '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png',
    categoria: 'Blocos de Montar',
    preco: 349.90,
    estoque: 5,
    status: ProdutoStatus.PRE_VENDA,
    colecao: 'vintage',
    destaque: true,
    dataLancamento: '2024-06-01',
    origem: 'Dinamarca'
  },
  {
    id: '8',
    nome: 'Quebra-Cabeça Disney 1000 peças',
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    categoria: 'Jogos e Quebra-Cabeças',
    preco: 129.90,
    estoque: 18,
    status: ProdutoStatus.ATIVO,
    colecao: 'vintage',
    destaque: false,
    dataLancamento: '2023-09-22'
  },
  {
    id: '9',
    nome: 'Action Figure Homem Aranha',
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    categoria: 'Bonecos de Ação',
    preco: 199.90,
    estoque: 3,
    status: ProdutoStatus.ULTIMAS_UNIDADES,
    colecao: 'bonecos-acao',
    destaque: true,
    dataLancamento: '2023-07-15',
    fornecedor: 'Marvel Toys'
  },
  {
    id: '10',
    nome: 'Boneca Barbie Coleção 2024',
    imagemUrl: '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png',
    categoria: 'Bonecas',
    preco: 259.90,
    estoque: 25,
    status: ProdutoStatus.IMPORTADO,
    colecao: 'vintage',
    destaque: true,
    dataLancamento: '2024-02-10',
    origem: 'EUA',
    codigoBarras: '780291847523'
  }
];

// Função para filtrar produtos por coleção
export const getProdutosPorColecao = (colecaoId: string): Produto[] => {
  return produtosAdmin.filter(produto => produto.colecao === colecaoId);
};

// Função para filtrar produtos em destaque
export const getProdutosDestaque = (): Produto[] => {
  return produtosAdmin.filter(produto => produto.destaque);
};

// Função para obter produtos relacionados (mesma categoria)
export const getProdutosRelacionados = (produtoId: string, limite: number = 4): Produto[] => {
  const produto = produtosAdmin.find(p => p.id === produtoId);
  if (!produto) return [];
  
  return produtosAdmin
    .filter(p => p.id !== produtoId && p.categoria === produto.categoria)
    .slice(0, limite);
};

// Função para buscar produtos por nome
export const buscarProdutosPorNome = (termo: string): Produto[] => {
  if (!termo) return produtosAdmin;
  const termoBusca = termo.toLowerCase();
  
  return produtosAdmin.filter(produto => 
    produto.nome.toLowerCase().includes(termoBusca) || 
    produto.categoria.toLowerCase().includes(termoBusca)
  );
};

// Função para filtrar produtos por status
export const filtrarProdutosPorStatus = (status: ProdutoStatus): Produto[] => {
  return produtosAdmin.filter(produto => produto.status === status);
};

// Função para filtrar produtos por origem/fornecedor
export const filtrarProdutosPorOrigem = (origem: string): Produto[] => {
  return produtosAdmin.filter(produto => produto.origem === origem);
};
