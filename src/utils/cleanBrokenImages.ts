/**
 * Utilitário para limpar imagens quebradas do localStorage
 */

const BROKEN_IMAGES = [
  '1762026196857-967272339.png',
  '1762026205700-184748161.png',
  '1762027698451-586122670.png',
  '1762027707201-191250317.png',
  // Imagens que estão dando 404 mesmo existindo
  '1762208428860-729428036.png',
  '1762208439337-604490442.png',
  '1762208826969-468000307.png',
  // Novas imagens 404 (novembro 2025)
  '1762210261693-600592619.png',
  '1762210271580-511207085.png'
];

/**
 * Verifica se uma URL de imagem provavelmente não existe
 * Baseado no padrão de timestamp muito recente
 */
function isLikelyBrokenImage(url: string): boolean {
  if (!url) return false;
  
  // Verificar lista conhecida
  if (BROKEN_IMAGES.some(img => url.includes(img))) {
    return true;
  }
  
  // Verificar padrão suspeito: /lovable-uploads/1762XXXXX-*.png
  // (imagens com timestamp de novembro 2025 que podem estar dando 404)
  const suspiciousPattern = /lovable-uploads\/1762\d{8,}-\d+\.(png|jpe?g|webp|gif)/i;
  if (suspiciousPattern.test(url)) {
    // Verificar se a imagem realmente existe fazendo uma requisição assíncrona
    // Por enquanto, apenas marcar como suspeita se estiver na lista conhecida
    const filename = url.split('/').pop();
    if (BROKEN_IMAGES.some(img => filename === img)) {
      console.warn(`⚠️ Imagem quebrada conhecida detectada: ${filename}`);
      return true;
    }
    // Para outras imagens suspeitas, vamos verificar se realmente existe
    // Mas como isso é síncrono, vamos apenas avisar
    console.warn(`⚠️ Imagem suspeita detectada (padrão recente): ${filename}`);
  }
  
  return false;
}

/**
 * Substitui URLs de imagens quebradas por valores padrão seguros
 */
function cleanImageUrl(url: string, context: string): string {
  if (!isLikelyBrokenImage(url)) {
    return url;
  }
  
  console.warn(`🧹 Limpando imagem quebrada (${context}): ${url.split('/').pop()}`);
  
  // Retornar valor padrão baseado no contexto
  if (context.includes('background') || context.includes('hero')) {
    return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  }
  if (context.includes('logo')) {
    return '/assets/muhlstore-mario-starwars-logo-CJrUMncO.png';
  }
  return ''; // Remove a referência
}

export function cleanBrokenImages(): boolean {
  try {
    let hasChanges = false;
    
    // Limpar home_config do localStorage
    const homeConfigKey = 'home_config';
    const storedConfig = localStorage.getItem(homeConfigKey);
    
    if (storedConfig) {
      let config = JSON.parse(storedConfig);
      
      // Limpar heroBackground
      if (config.theme?.heroBackground && isLikelyBrokenImage(config.theme.heroBackground)) {
        config.theme.heroBackground = cleanImageUrl(config.theme.heroBackground, 'heroBackground');
        hasChanges = true;
      }
      
      // Limpar logoUrl
      if (config.theme?.logoUrl && isLikelyBrokenImage(config.theme.logoUrl)) {
        config.theme.logoUrl = cleanImageUrl(config.theme.logoUrl, 'logoUrl');
        hasChanges = true;
      }
      
      // Limpar faviconUrl
      if (config.theme?.faviconUrl && isLikelyBrokenImage(config.theme.faviconUrl)) {
        config.theme.faviconUrl = '/favicon.ico';
        hasChanges = true;
        console.warn(`🧹 Limpando favicon quebrado`);
      }
      
      // Percorrer recursivamente para encontrar outras URLs
      const cleanConfigRecursive = (obj: any, path = ''): any => {
        if (typeof obj === 'string') {
          if (isLikelyBrokenImage(obj)) {
            hasChanges = true;
            return cleanImageUrl(obj, path);
          }
          return obj;
        }
        
        if (Array.isArray(obj)) {
          return obj.map((item, idx) => cleanConfigRecursive(item, `${path}[${idx}]`));
        }
        
        if (obj && typeof obj === 'object') {
          const cleaned: any = {};
          for (const key in obj) {
            cleaned[key] = cleanConfigRecursive(obj[key], `${path}.${key}`);
          }
          return cleaned;
        }
        
        return obj;
      };
      
      config = cleanConfigRecursive(config, 'root');
      
      if (hasChanges) {
        localStorage.setItem(homeConfigKey, JSON.stringify(config));
        console.log('✅ Imagens quebradas removidas do localStorage');
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erro ao limpar imagens quebradas:', error);
    return false;
  }
}

// Executar automaticamente ao carregar
if (typeof window !== 'undefined') {
  console.log('🔍 Verificando imagens quebradas no localStorage...');
  const cleaned = cleanBrokenImages();
  if (cleaned) {
    console.log('🎉 localStorage limpo! Recarregue a página se necessário.');
  }
}

