import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'product' | 'article';
  price?: number;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  ratingCount?: number;
  brand?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object;
}

export function SEO({
  title = 'MuhlStore - Loja de Brinquedos Raros e Colecionáveis',
  description = 'Descubra brinquedos raros, colecionáveis e exclusivos. Pagamento facilitado, entrega rápida e os melhores preços do mercado.',
  keywords = 'brinquedos raros, colecionáveis, action figures, vintage toys, brinquedos antigos',
  image = '/og-image.png',
  url = 'https://muhlstore.re9suainternet.com.br',
  type = 'website',
  price,
  availability,
  rating,
  ratingCount,
  brand = 'MuhlStore',
  author,
  publishedTime,
  modifiedTime,
  structuredData,
}: SEOProps) {
  const fullTitle = title.includes('MuhlStore') ? title : `${title} | MuhlStore`;
  const fullUrl = url.startsWith('http') ? url : `https://muhlstore.re9suainternet.com.br${url}`;
  const fullImage = image.startsWith('http') ? image : `https://muhlstore.re9suainternet.com.br${image}`;

  // Criar structured data baseado no tipo
  let defaultStructuredData: any = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'MuhlStore',
    url: 'https://muhlstore.re9suainternet.com.br',
    description: 'Loja especializada em brinquedos raros e colecionáveis',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://muhlstore.re9suainternet.com.br/loja?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  };

  // Produto
  if (type === 'product' && price) {
    defaultStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: title,
      description,
      image: fullImage,
      brand: {
        '@type': 'Brand',
        name: brand,
      },
      offers: {
        '@type': 'Offer',
        url: fullUrl,
        priceCurrency: 'BRL',
        price: price.toFixed(2),
        availability: `https://schema.org/${availability || 'InStock'}`,
        seller: {
          '@type': 'Organization',
          name: 'MuhlStore',
        },
      },
    };

    // Adicionar avaliações se disponíveis
    if (rating && ratingCount) {
      defaultStructuredData.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: rating.toString(),
        reviewCount: ratingCount.toString(),
        bestRating: '5',
        worstRating: '1',
      };
    }
  }

  // Artigo
  if (type === 'article' && author) {
    defaultStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description,
      image: fullImage,
      author: {
        '@type': 'Person',
        name: author,
      },
      publisher: {
        '@type': 'Organization',
        name: 'MuhlStore',
        logo: {
          '@type': 'ImageObject',
          url: 'https://muhlstore.re9suainternet.com.br/icon-512x512.png',
        },
      },
      datePublished: publishedTime,
      dateModified: modifiedTime || publishedTime,
    };
  }

  // Organização (para homepage)
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'MuhlStore',
    url: 'https://muhlstore.re9suainternet.com.br',
    logo: 'https://muhlstore.re9suainternet.com.br/icon-512x512.png',
    sameAs: [
      'https://www.facebook.com/muhlstore',
      'https://www.instagram.com/muhlstore',
      'https://twitter.com/muhlstore',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+55-11-99999-9999',
      contactType: 'customer service',
      availableLanguage: 'Portuguese',
    },
  };

  // Breadcrumb (se houver URL com paths)
  const pathSegments = fullUrl.replace('https://muhlstore.re9suainternet.com.br', '').split('/').filter(Boolean);
  const breadcrumbData = pathSegments.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://muhlstore.re9suainternet.com.br',
      },
      ...pathSegments.map((segment, index) => ({
        '@type': 'ListItem',
        position: index + 2,
        name: segment.charAt(0).toUpperCase() + segment.slice(1),
        item: `https://muhlstore.re9suainternet.com.br/${pathSegments.slice(0, index + 1).join('/')}`,
      })),
    ],
  } : null;

  return (
    <Helmet>
      {/* Título */}
      <title>{fullTitle}</title>

      {/* Meta Tags Básicas */}
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="pt_BR" />
      <meta property="og:site_name" content="MuhlStore" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
      <meta name="twitter:site" content="@muhlstore" />
      <meta name="twitter:creator" content="@muhlstore" />

      {/* Produto específico */}
      {type === 'product' && price && (
        <>
          <meta property="product:price:amount" content={price.toFixed(2)} />
          <meta property="product:price:currency" content="BRL" />
          {availability && (
            <meta property="product:availability" content={availability} />
          )}
        </>
      )}

      {/* Artigo específico */}
      {type === 'article' && (
        <>
          {author && <meta property="article:author" content={author} />}
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
        </>
      )}

      {/* Structured Data (JSON-LD) */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>

      {/* Organização (sempre presente) */}
      <script type="application/ld+json">
        {JSON.stringify(organizationData)}
      </script>

      {/* Breadcrumb (se aplicável) */}
      {breadcrumbData && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbData)}
        </script>
      )}
    </Helmet>
  );
}

// Componente específico para produtos
export function ProductSEO({
  name,
  description,
  image,
  price,
  availability = 'InStock',
  rating,
  ratingCount,
  brand = 'MuhlStore',
  url,
  keywords,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  ratingCount?: number;
  brand?: string;
  url: string;
  keywords?: string;
}) {
  return (
    <SEO
      title={name}
      description={description}
      image={image}
      type="product"
      price={price}
      availability={availability}
      rating={rating}
      ratingCount={ratingCount}
      brand={brand}
      url={url}
      keywords={keywords}
    />
  );
}

// Componente específico para loja/categoria
export function CategorySEO({
  category,
  description,
  image,
  url,
  productCount,
}: {
  category: string;
  description?: string;
  image?: string;
  url: string;
  productCount?: number;
}) {
  const defaultDescription = description || `Explore nossa coleção de ${category}. ${productCount ? `${productCount} produtos disponíveis.` : ''} Entrega rápida e pagamento facilitado.`;
  
  return (
    <SEO
      title={`${category} - Coleção Completa`}
      description={defaultDescription}
      image={image}
      url={url}
      keywords={`${category}, brinquedos ${category}, colecionáveis ${category}`}
    />
  );
}

