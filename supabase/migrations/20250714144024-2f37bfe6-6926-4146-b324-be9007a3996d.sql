-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  imagem_url TEXT,
  categoria TEXT NOT NULL,
  estoque INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ativo',
  destaque BOOLEAN DEFAULT false,
  promocao BOOLEAN DEFAULT false,
  lancamento BOOLEAN DEFAULT false,
  avaliacao DECIMAL(2,1),
  total_avaliacoes INTEGER DEFAULT 0,
  faixa_etaria TEXT,
  peso TEXT,
  dimensoes TEXT,
  material TEXT,
  marca TEXT,
  origem TEXT,
  fornecedor TEXT,
  codigo_barras TEXT,
  data_lancamento TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collections table
CREATE TABLE public.collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  imagem_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product collections junction table (many-to-many)
CREATE TABLE public.product_collections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(product_id, collection_id)
);

-- Create carousel items table for homepage
CREATE TABLE public.carousel_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  button_text TEXT,
  button_link TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carousel_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (products catalog is public)
CREATE POLICY "Products are viewable by everyone" ON public.products FOR SELECT USING (true);
CREATE POLICY "Collections are viewable by everyone" ON public.collections FOR SELECT USING (true);
CREATE POLICY "Product collections are viewable by everyone" ON public.product_collections FOR SELECT USING (true);
CREATE POLICY "Carousel items are viewable by everyone" ON public.carousel_items FOR SELECT USING (true);

-- Admin policies will be added when we implement authentication
-- For now, allow all operations (will be restricted later)
CREATE POLICY "Allow all operations for now" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all operations for now - collections" ON public.collections FOR ALL USING (true);
CREATE POLICY "Allow all operations for now - product_collections" ON public.product_collections FOR ALL USING (true);
CREATE POLICY "Allow all operations for now - carousel" ON public.carousel_items FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carousel_items_updated_at
  BEFORE UPDATE ON public.carousel_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample data
INSERT INTO public.collections (nome, descricao, imagem_url) VALUES
('Mario e Star Wars', 'Coleção especial combinando os universos de Mario e Star Wars', '/lovable-uploads/da3efcfd-6148-449d-8fa9-7b7eff077683.png'),
('Vintage Classics', 'Brinquedos clássicos e nostálgicos dos anos 80 e 90', '/assets/vintage-collection-1.jpg'),
('Action Heroes', 'Figuras de ação dos seus heróis favoritos', '/assets/toy-collector-1.jpg');

-- Insert sample products
INSERT INTO public.products (nome, descricao, preco, imagem_url, categoria, estoque, destaque, promocao, marca, faixa_etaria) VALUES
('Mario Stormtrooper Deluxe', 'Figura exclusiva do Mario vestido como Stormtrooper', 299.99, '/lovable-uploads/d7baf70f-a0a0-4137-b607-9e289e56ff60.png', 'Figuras de Ação', 15, true, false, 'Nintendo x Star Wars', '8+ anos'),
('Yoda Luigi Verde', 'Luigi transformado no mestre Yoda da força', 249.99, '/lovable-uploads/5f25d86c-7dd5-4ee8-a882-240f06f77054.png', 'Figuras de Ação', 20, true, true, 'Nintendo x Star Wars', '8+ anos'),
('Princess Peach Leia', 'Princesa Peach como Princesa Leia com sabre de luz', 279.99, '/lovable-uploads/2420466b-bbfd-4926-b8dd-5be2370f8ee1.png', 'Figuras de Ação', 12, false, false, 'Nintendo x Star Wars', '8+ anos'),
('Bowser Darth Vader', 'Bowser como o temível Darth Vader', 349.99, '/lovable-uploads/a2662bdc-7d77-41e6-bb02-befbb64670ea.png', 'Figuras de Ação', 8, true, false, 'Nintendo x Star Wars', '10+ anos');

-- Link products to collections
INSERT INTO public.product_collections (product_id, collection_id)
SELECT p.id, c.id
FROM public.products p, public.collections c
WHERE c.nome = 'Mario e Star Wars';

-- Insert carousel items
INSERT INTO public.carousel_items (title, subtitle, image_url, button_text, button_link, order_index) VALUES
('Mario x Star Wars', 'Coleção Exclusiva Disponível Agora', '/assets/mario-starwars-hero.jpg', 'Ver Coleção', '/colecao/mario-star-wars', 1),
('Brinquedos Vintage', 'Nostalgia e Qualidade em Cada Peça', '/assets/vintage-collection-1.jpg', 'Explorar', '/colecoes', 2),
('Novidades da Semana', 'Últimos Lançamentos em Destaque', '/assets/premium-toy-display.jpg', 'Ver Novidades', '/destaques', 3);