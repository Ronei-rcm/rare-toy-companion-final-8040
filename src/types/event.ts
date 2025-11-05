export interface Event {
  id: string;
  titulo: string;
  descricao?: string;
  data_evento: string; // Mantido para compatibilidade
  data_inicio?: string; // Data e hora de início
  data_fim?: string; // Data e hora de término (NULL = evento de 1 dia)
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
  data_evento?: string; // Opcional, mantido para compatibilidade
  data_inicio?: string; // Data e hora de início (obrigatório se data_evento não fornecido)
  data_fim?: string; // Data e hora de término (opcional, NULL = evento de 1 dia)
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
