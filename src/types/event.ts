export interface Event {
  id: string;
  titulo: string;
  descricao?: string;
  data_evento: string;
  local?: string;
  numero_vagas?: number;
  vagas_limitadas: boolean;
  imagem_url?: string;
  ativo: boolean;
  feira_fechada?: boolean;
  renda_total?: number;
  participantes_confirmados?: number;
  created_at: string;
  updated_at: string;
}

export interface EventInsert {
  titulo: string;
  descricao?: string;
  data_evento: string;
  local?: string;
  numero_vagas?: number;
  vagas_limitadas?: boolean;
  imagem_url?: string;
  ativo?: boolean;
  feira_fechada?: boolean;
  renda_total?: number;
  participantes_confirmados?: number;
}

export interface EventUpdate extends Partial<EventInsert> {
  id?: string;
}
