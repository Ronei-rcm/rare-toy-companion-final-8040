export interface Collection {
  id: string;
  nome: string;
  descricao: string;
  imagem: string;
  produtos: number;
  preco: string;
  destaque: boolean;
  status: 'ativo' | 'inativo';
  tags: string[];
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCollectionData {
  nome: string;
  descricao: string;
  imagem: string;
  destaque: boolean;
  status: 'ativo' | 'inativo';
  tags: string[];
  ordem: number;
}

export interface UpdateCollectionData extends Partial<CreateCollectionData> {
  id: string;
}