-- Database initialization script for Rare Toy Companion
-- Converting from Supabase (PostgreSQL) to MySQL

USE rare_toy_companion;

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    imagem_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(36) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    preco DECIMAL(10,2) NOT NULL,
    imagem_url VARCHAR(500),
    categoria VARCHAR(100) NOT NULL,
    estoque INT DEFAULT 0,
    status ENUM('ativo', 'inativo', 'esgotado') DEFAULT 'ativo',
    destaque BOOLEAN DEFAULT FALSE,
    promocao BOOLEAN DEFAULT FALSE,
    lancamento BOOLEAN DEFAULT FALSE,
    avaliacao DECIMAL(3,2),
    total_avaliacoes INT DEFAULT 0,
    faixa_etaria VARCHAR(50),
    peso VARCHAR(50),
    dimensoes VARCHAR(100),
    material VARCHAR(100),
    marca VARCHAR(100),
    origem VARCHAR(100),
    fornecedor VARCHAR(100),
    codigo_barras VARCHAR(100),
    data_lancamento DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_categoria (categoria),
    INDEX idx_destaque (destaque),
    INDEX idx_promocao (promocao),
    INDEX idx_lancamento (lancamento),
    INDEX idx_status (status)
);

-- Create product_collections table (junction table)
CREATE TABLE IF NOT EXISTS product_collections (
    id VARCHAR(36) PRIMARY KEY,
    product_id VARCHAR(36) NOT NULL,
    collection_id VARCHAR(36) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_collection (product_id, collection_id)
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(36) PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    data_evento DATETIME NOT NULL,
    local VARCHAR(255),
    preco DECIMAL(10,2),
    numero_vagas INT,
    vagas_limitadas BOOLEAN DEFAULT FALSE,
    imagem_url VARCHAR(500),
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_data_evento (data_evento),
    INDEX idx_ativo (ativo)
);

-- Create carousel_items table
CREATE TABLE IF NOT EXISTS carousel_items (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    button_text VARCHAR(100),
    button_link VARCHAR(500),
    order_index INT DEFAULT 0,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_order_index (order_index),
    INDEX idx_active (active)
);

-- Create users table (for future authentication)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    nome VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    cidade VARCHAR(100),
    estado VARCHAR(50),
    cep VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
);

-- Create orders table (for future e-commerce functionality)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    total DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id VARCHAR(36) PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL,
    product_id VARCHAR(36) NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    INDEX idx_order_id (order_id),
    INDEX idx_product_id (product_id)
);

-- Insert sample data
INSERT INTO collections (id, nome, descricao, imagem_url) VALUES
('1', 'Action Figures', 'Figuras de ação de super-heróis e personagens famosos', 'https://example.com/action-figures.jpg'),
('2', 'Vintage Toys', 'Brinquedos vintage e colecionáveis', 'https://example.com/vintage-toys.jpg'),
('3', 'Board Games', 'Jogos de tabuleiro clássicos e modernos', 'https://example.com/board-games.jpg');

INSERT INTO products (id, nome, descricao, preco, categoria, estoque, destaque, promocao, lancamento, marca, avaliacao, total_avaliacoes) VALUES
('1', 'Super Mario Action Figure', 'Figura de ação do Super Mario com acessórios', 89.90, 'Action Figures', 50, TRUE, FALSE, TRUE, 'Nintendo', 4.8, 25),
('2', 'Vintage Barbie Doll', 'Boneca Barbie vintage dos anos 80', 299.90, 'Vintage Toys', 10, TRUE, TRUE, FALSE, 'Mattel', 4.9, 15),
('3', 'Star Wars Lightsaber', 'Sabre de luz do Star Wars com efeitos sonoros', 199.90, 'Action Figures', 30, FALSE, FALSE, TRUE, 'Hasbro', 4.7, 40),
('4', 'Monopoly Classic', 'Jogo de tabuleiro Monopoly clássico', 129.90, 'Board Games', 25, FALSE, TRUE, FALSE, 'Hasbro', 4.6, 60);

INSERT INTO product_collections (id, product_id, collection_id) VALUES
('1', '1', '1'),
('2', '2', '2'),
('3', '3', '1'),
('4', '4', '3');

INSERT INTO events (id, titulo, descricao, data_evento, local, preco, numero_vagas, vagas_limitadas, ativo) VALUES
('1', 'Convenção de Brinquedos 2024', 'Maior convenção de brinquedos do ano', '2024-12-15 10:00:00', 'Centro de Convenções', 50.00, 500, TRUE, TRUE),
('2', 'Workshop de Colecionadores', 'Aprenda sobre colecionismo de brinquedos vintage', '2024-11-20 14:00:00', 'Loja Principal', 25.00, 30, TRUE, TRUE);

INSERT INTO carousel_items (id, title, subtitle, image_url, button_text, button_link, order_index, active) VALUES
('1', 'Brinquedos Vintage', 'Descubra nossa coleção única', 'https://example.com/vintage-banner.jpg', 'Ver Coleção', '/colecao/vintage', 1, TRUE),
('2', 'Novos Lançamentos', 'Os mais recentes brinquedos', 'https://example.com/new-releases.jpg', 'Ver Novidades', '/destaques', 2, TRUE),
('3', 'Promoções Especiais', 'Ofertas imperdíveis', 'https://example.com/sales.jpg', 'Ver Ofertas', '/promocoes', 3, TRUE);

-- Create indexes for better performance
CREATE INDEX idx_products_search ON products (nome, categoria, descricao(100));
CREATE INDEX idx_products_price ON products (preco);
CREATE INDEX idx_events_upcoming ON events (data_evento, ativo);

-- Create views for common queries
CREATE VIEW featured_products AS
SELECT * FROM products WHERE destaque = TRUE AND status = 'ativo' ORDER BY created_at DESC;

CREATE VIEW promotion_products AS
SELECT * FROM products WHERE promocao = TRUE AND status = 'ativo' ORDER BY created_at DESC;

CREATE VIEW new_products AS
SELECT * FROM products WHERE lancamento = TRUE AND status = 'ativo' ORDER BY created_at DESC;

CREATE VIEW upcoming_events AS
SELECT * FROM events WHERE data_evento >= NOW() AND ativo = TRUE ORDER BY data_evento ASC;

-- Grant permissions
GRANT ALL PRIVILEGES ON rare_toy_companion.* TO 'rare_toy_user'@'%';
FLUSH PRIVILEGES;
