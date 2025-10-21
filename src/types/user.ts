export interface User {
  id: string;
  email: string;
  avatar_url?: string;
  nome: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  email: string;
  avatar_url?: string;
  nome: string;
  telefone?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface UpdateUserData extends CreateUserData {
  id: string;
}
