-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_evento TIMESTAMP WITH TIME ZONE NOT NULL,
  local TEXT,
  preco NUMERIC DEFAULT 0,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  vagas_limitadas BOOLEAN DEFAULT false,
  numero_vagas INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Events are viewable by everyone" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Allow all operations for now - events" 
ON public.events 
FOR ALL 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();