// Gerador de Sitemap.xml Dinâmico
const mysql = require('mysql2/promise');

// Prioridades para diferentes tipos de página
const PRIORITIES = {
  homepage: 1.0,
  loja: 0.9,
  produto: 0.8,
  categoria: 0.7,
  colecao: 0.7,
  sobre: 0.6,
  eventos: 0.6,
  static: 0.5,
};

// Frequência de atualização
const CHANGE_FREQ = {
  homepage: 'daily',
  loja: 'daily',
  produto: 'weekly',
  categoria: 'weekly',
  colecao: 'weekly',
  sobre: 'monthly',
  eventos: 'weekly',
  static: 'monthly',
};

async function generateSitemap(dbConnection) {
  const baseUrl = 'https://muhlstore.re9suainternet.com.br';
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  // Homepage
  xml += createUrlEntry(baseUrl, new Date(), CHANGE_FREQ.homepage, PRIORITIES.homepage);

  // Páginas estáticas
  const staticPages = [
    { url: '/loja', changefreq: CHANGE_FREQ.loja, priority: PRIORITIES.loja },
    { url: '/sobre', changefreq: CHANGE_FREQ.sobre, priority: PRIORITIES.sobre },
    { url: '/eventos', changefreq: CHANGE_FREQ.eventos, priority: PRIORITIES.eventos },
    { url: '/destaques', changefreq: CHANGE_FREQ.static, priority: PRIORITIES.static },
    { url: '/carrinho', changefreq: CHANGE_FREQ.static, priority: PRIORITIES.static },
    { url: '/auth/login', changefreq: CHANGE_FREQ.static, priority: PRIORITIES.static },
    { url: '/auth/cadastro', changefreq: CHANGE_FREQ.static, priority: PRIORITIES.static },
  ];

  staticPages.forEach(page => {
    xml += createUrlEntry(`${baseUrl}${page.url}`, new Date(), page.changefreq, page.priority);
  });

  try {
    // Produtos ativos
    const [products] = await dbConnection.execute(
      'SELECT id, updatedAt FROM produtos WHERE status = ? ORDER BY updatedAt DESC LIMIT 1000',
      ['ativo']
    );

    products.forEach(product => {
      const lastmod = product.updatedAt || new Date();
      xml += createUrlEntry(
        `${baseUrl}/produto/${product.id}`,
        lastmod,
        CHANGE_FREQ.produto,
        PRIORITIES.produto
      );
    });

    // Coleções ativas
    const [collections] = await dbConnection.execute(
      'SELECT id, updatedAt FROM colecoes WHERE status = ? ORDER BY updatedAt DESC',
      ['ativo']
    );

    collections.forEach(collection => {
      const lastmod = collection.updatedAt || new Date();
      xml += createUrlEntry(
        `${baseUrl}/colecao/${collection.id}`,
        lastmod,
        CHANGE_FREQ.colecao,
        PRIORITIES.colecao
      );
    });

    // Categorias únicas de produtos
    const [categories] = await dbConnection.execute(
      'SELECT DISTINCT categoria FROM produtos WHERE status = ? AND categoria IS NOT NULL',
      ['ativo']
    );

    categories.forEach(cat => {
      if (cat.categoria) {
        const slug = cat.categoria.toLowerCase().replace(/\s+/g, '-');
        xml += createUrlEntry(
          `${baseUrl}/loja?categoria=${encodeURIComponent(cat.categoria)}`,
          new Date(),
          CHANGE_FREQ.categoria,
          PRIORITIES.categoria
        );
      }
    });

    // Eventos futuros
    const [events] = await dbConnection.execute(
      'SELECT id, updatedAt FROM eventos WHERE data >= CURDATE() ORDER BY data ASC LIMIT 100'
    );

    events.forEach(event => {
      const lastmod = event.updatedAt || new Date();
      xml += createUrlEntry(
        `${baseUrl}/eventos/${event.id}`,
        lastmod,
        CHANGE_FREQ.eventos,
        PRIORITIES.eventos
      );
    });

  } catch (error) {
    console.error('Erro ao gerar sitemap:', error);
  }

  xml += '</urlset>';
  return xml;
}

function createUrlEntry(url, lastmod, changefreq, priority) {
  const formattedDate = formatDate(lastmod);
  return `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${formattedDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>\n`;
}

function formatDate(date) {
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
    }
  });
}

module.exports = { generateSitemap };

