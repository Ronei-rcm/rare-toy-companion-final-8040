
export interface Produto {
  id: string;
  nome: string;
  imagemUrl: string;
  categoria: string;
  preco: number;
  estoque: number;
  status: string;
  colecao?: string;
  descricao?: string;
  destaque?: boolean;
  dataLancamento?: string;
  origem?: string;
  fornecedor?: string;
  codigoBarras?: string;
  promocao?: boolean;
  lancamento?: boolean;
  novo?: boolean;
  seminovo?: boolean;
  colecoes?: string[];
  emEstoque?: boolean;
  imagens?: string[];
  // Novos campos
  avaliacao?: number;
  totalAvaliacoes?: number;
  faixaEtaria?: string;
  peso?: string;
  dimensoes?: string;
  material?: string;
  marca?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  email: string;
  senha?: string;
  telefone?: string;
  dataCadastro: string;
  enderecos?: Endereco[];
  pedidos?: Pedido[];
  favoritos?: string[];
}

export interface Endereco {
  id: string;
  clienteId: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  padrao: boolean;
}

export interface Pedido {
  id: string;
  clienteId: string;
  dataPedido: string;
  status: string;
  produtos: PedidoItem[];
  valorTotal: number;
  enderecoEntrega: Endereco;
  formaPagamento: string;
  codigoRastreio?: string;
}

export interface PedidoItem {
  id: string;
  produtoId: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
  produto?: Produto;
}
