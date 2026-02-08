/**
 * Utilitário para limpar imagens quebradas do localStorage
 */
import { API_BASE_URL } from '@/services/api-config';

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
  '1762210271580-511207085.png',
  // Novembro 2025 - lote 1762788xxxxx
  '1762788507025-185502532.png',
  '1762788517254-938153150.png',
  // Novembro 2025 - novos registros reportados
  '1762792092194-893918707.png',
  '1762861602033-267131872.png',
  '1762862235165-200541981.png',
  '1762862245176-740995306.png',
  // Janeiro 2025 - novos registros reportados
  '1762871622553-174083546.png',
  '1762871648414-649896972.png',
  '1762878398817-138452280.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025
  '1763935071361-238952680.png',
  '1763935082848-582610913.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763935...)
  '1763935653217-684904757.png',
  '1763935664384-651261130.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763936...)
  '1763936027091-431374231.png',
  '1763936034894-39387017.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763936...)
  '1763936386253-468283597.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763936...)
  '1763936633572-345400806.png',
  '1763936645094-487623886.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763937...)
  '1763937869943-227226559.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763938...)
  '1763938073737-468388851.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763938...)
  '1763938281338-178851220.png',
  // Janeiro 2025 - imagens reportadas em 23/01/2025 (lote 1763938...)
  '1763938744974-610284699.png'
];

const HOME_CONFIG_KEYS = ['home_config', 'homeConfig', 'home_config_v2'];

/**
 * Verifica se uma URL de imagem provavelmente não existe
 * Baseado no padrão de timestamp muito recente
 */
// Cache da lista do localStorage para evitar múltiplas leituras
let brokenImagesCache: string[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5000; // 5 segundos

function getBrokenImagesFromStorage(): string[] {
  const now = Date.now();
  // Usar cache se ainda for válido
  if (brokenImagesCache && (now - cacheTimestamp) < CACHE_TTL) {
    return brokenImagesCache;
  }

  try {
    const stored = localStorage.getItem('broken_images_list');
    if (stored) {
      const list = JSON.parse(stored);
      brokenImagesCache = Array.isArray(list) ? list : [];
      cacheTimestamp = now;
      return brokenImagesCache;
    }
  } catch (e) {
    // Ignorar erros de parsing
  }

  brokenImagesCache = [];
  cacheTimestamp = now;
  return brokenImagesCache;
}

// Cache de imagens verificadas (para evitar múltiplas verificações)
const verifiedImagesCache = new Set<string>();
const brokenImagesVerifiedCache = new Set<string>();

/**
 * Verifica se uma imagem realmente existe no servidor (verificação assíncrona)
 * Tenta primeiro a URL original, depois via /api/uploads/ como fallback
 */
async function verifyImageExists(url: string): Promise<boolean> {
  // Se já verificamos e está no cache, usar o cache
  if (verifiedImagesCache.has(url)) {
    return true;
  }
  if (brokenImagesVerifiedCache.has(url)) {
    return false;
  }

  // Função auxiliar para verificar uma URL
  const checkUrl = async (urlToCheck: string): Promise<boolean> => {
    try {
      // Garantir HTTPS se for nossa URL
      const finalUrl = urlToCheck.startsWith('http://muhlstore')
        ? urlToCheck.replace('http://', 'https://')
        : urlToCheck;

      const response = await fetch(finalUrl, { method: 'HEAD', cache: 'no-cache' });
      return response.ok;
    } catch {
      return false;
    }
  };

  try {
    // Tentar URL original primeiro
    let exists = await checkUrl(url);

    // Se não existir e for /lovable-uploads/, tentar via /api/uploads/
    if (!exists && url.includes('/lovable-uploads/')) {
      const filename = url.split('/').pop()?.split('?')[0] || '';
      if (filename) {
        const apiUrl = `${API_BASE_URL}/uploads/${filename}`;
        console.log(`🔄 Tentando verificar imagem via API: ${apiUrl}`);
        exists = await checkUrl(apiUrl);
        if (exists) {
          console.log(`✅ Imagem existe via API: ${filename}`);
        }
      }
    }

    if (exists) {
      verifiedImagesCache.add(url);
    } else {
      brokenImagesVerifiedCache.add(url);
    }

    return exists;
  } catch {
    // Se der erro na verificação, assumir que não existe
    brokenImagesVerifiedCache.add(url);
    return false;
  }
}

function isLikelyBrokenImage(url: string): boolean {
  if (!url) return false;

  // Extrair nome do arquivo
  const filename = url.split('/').pop()?.split('?')[0] || '';
  if (!filename) return false;

  // Verificar lista conhecida (comparação exata do filename)
  // Esta lista contém imagens que realmente não existem
  if (BROKEN_IMAGES.some(img => filename === img || url.includes(img))) {
    return true;
  }

  // Verificar lista do localStorage (com cache)
  const storedList = getBrokenImagesFromStorage();
  if (storedList.includes(filename)) {
    // Se estiver na lista, mas a imagem foi verificada e existe, remover da lista
    if (verifiedImagesCache.has(url)) {
      // Remover da lista do localStorage
      const updatedList = storedList.filter((img: string) => img !== filename);
      try {
        localStorage.setItem('broken_images_list', JSON.stringify(updatedList));
        brokenImagesCache = updatedList;
        cacheTimestamp = Date.now();
        console.log(`✅ Imagem ${filename} removida da lista de quebradas (existe no servidor)`);
      } catch (e) {
        console.warn('Erro ao atualizar lista de imagens quebradas:', e);
      }
      return false;
    }

    // Se estiver na lista mas não foi verificada ainda, verificar em background
    // Mas não bloquear imediatamente - deixar tentar carregar
    // Se der erro, será adicionado novamente
    verifyImageExists(url).then(exists => {
      if (exists) {
        // Se existe, remover da lista
        const updatedList = storedList.filter((img: string) => img !== filename);
        try {
          localStorage.setItem('broken_images_list', JSON.stringify(updatedList));
          brokenImagesCache = updatedList;
          cacheTimestamp = Date.now();
          console.log(`✅ Imagem ${filename} removida da lista de quebradas (verificada e existe)`);
          // Recarregar a imagem se estiver no DOM
          const images = document.querySelectorAll(`img[src*="${filename}"]`);
          images.forEach((img: any) => {
            if (img.src && img.src.includes(filename)) {
              const newSrc = img.src.split('?')[0] + '?v=' + Date.now();
              img.src = newSrc;
              img.style.display = '';
              img.removeAttribute('data-broken-image');
            }
          });
        } catch (e) {
          console.warn('Erro ao atualizar lista:', e);
        }
      }
    }).catch(() => {
      // Erro na verificação, manter na lista
    });

    // Não bloquear imediatamente - deixar tentar carregar
    // Se realmente não existir, o erro será capturado e a imagem será bloqueada
    return false;
  }

  // Verificar padrão suspeito: /lovable-uploads/176[2-9]XXXXX-*.png
  // (imagens com timestamp recente que podem estar dando 404)
  const suspiciousPattern = /lovable-uploads\/176[2-9]\d{8,}-\d+\.(png|jpe?g|webp|gif)/i;
  if (suspiciousPattern.test(url)) {
    // Se estiver na lista conhecida, bloquear imediatamente
    if (BROKEN_IMAGES.some(img => filename === img)) {
      return true;
    }
    // Para outras imagens suspeitas, não bloquear ainda
    // A detecção automática vai adicionar à lista quando der 404
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

function cleanConfigKey(key: string): boolean {
  try {
    let hasChanges = false;

    const storedConfig = localStorage.getItem(key);

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
        localStorage.setItem(key, JSON.stringify(config));
        console.log(`✅ Imagens quebradas removidas do localStorage (${key})`);
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error(`❌ Erro ao limpar imagens quebradas (${key}):`, error);
    return false;
  }
}

export function cleanBrokenImages(): boolean {
  let cleanedAny = false;
  for (const key of HOME_CONFIG_KEYS) {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(key)) {
      const cleaned = cleanConfigKey(key);
      cleanedAny = cleanedAny || cleaned;
    }
  }
  return cleanedAny;
}

/**
 * Interceptar tentativas de carregar imagens quebradas
 */
function interceptBrokenImageLoads() {
  if (typeof window === 'undefined') return;

  // Interceptar criação de elementos <img>
  const originalCreateElement = document.createElement.bind(document);
  document.createElement = function (tagName: string, options?: ElementCreationOptions) {
    const element = originalCreateElement(tagName, options);

    if (tagName.toLowerCase() === 'img') {
      // Interceptar setAttribute ANTES de qualquer outra coisa
      const originalSetAttribute = element.setAttribute.bind(element);
      element.setAttribute = function (name: string, value: string) {
        if (name === 'src' && value) {
          // Verificar se é imagem quebrada ANTES de definir
          if (isLikelyBrokenImage(value)) {
            const filename = value.split('/').pop() || '';
            console.warn(`🚫 Bloqueando carregamento de imagem quebrada (setAttribute): ${filename}`);
            // Não definir src, mas marcar como quebrada
            element.style.display = 'none';
            element.setAttribute('data-broken-image', 'true');
            // Definir um data-src vazio para evitar que o React tente novamente
            element.setAttribute('data-src', '');
            return; // Não definir src para imagens quebradas
          }
        }
        return originalSetAttribute(name, value);
      };

      // Interceptar propriedade src diretamente (mais comum no React)
      let currentSrc = '';
      let isBlocked = false;

      // Interceptar ANTES de definir qualquer src
      const checkAndBlock = (value: string): boolean => {
        if (!value) return false;

        // Verificar se é imagem quebrada ANTES de definir
        if (isLikelyBrokenImage(value)) {
          const filename = value.split('/').pop() || '';
          if (!isBlocked) {
            console.warn(`🚫 Bloqueando carregamento de imagem quebrada (src setter): ${filename}`);
            isBlocked = true;
          }
          currentSrc = '';
          element.style.display = 'none';
          element.setAttribute('data-broken-image', 'true');
          // Não definir src para evitar requisição HTTP
          return true;
        }
        return false;
      };

      Object.defineProperty(element, 'src', {
        set(value: string) {
          if (checkAndBlock(value)) {
            return; // Bloqueado
          }

          // Se não for quebrada, definir normalmente
          currentSrc = value;
          isBlocked = false;
          originalSetAttribute.call(element, 'src', value);
        },
        get() {
          return currentSrc || element.getAttribute('src') || '';
        },
        configurable: true,
        enumerable: true
      });

      // Interceptar também quando o elemento é inserido no DOM
      const originalAppendChild = element.appendChild.bind(element);
      const originalInsertBefore = element.insertBefore.bind(element);

      // Interceptar quando o elemento img é inserido no DOM
      const checkOnInsert = () => {
        const src = element.getAttribute('src') || currentSrc;
        if (src && isLikelyBrokenImage(src)) {
          element.style.display = 'none';
          element.setAttribute('data-broken-image', 'true');
        }
      };

      // Monkey patch para quando o elemento é inserido
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
            const src = element.getAttribute('src');
            if (src && isLikelyBrokenImage(src)) {
              checkAndBlock(src);
            }
          }
        });
      });

      // Observar mudanças no elemento imediatamente
      // Não esperar pelo parentNode, observar assim que o elemento é criado
      try {
        observer.observe(element, {
          attributes: true,
          attributeFilter: ['src'],
          attributeOldValue: true
        });
      } catch (e) {
        // Se falhar, tentar novamente quando o elemento for inserido
        const checkOnInsert = () => {
          try {
            observer.observe(element, {
              attributes: true,
              attributeFilter: ['src'],
              attributeOldValue: true
            });
          } catch (err) {
            // Ignorar erros
          }
        };

        // Tentar quando o elemento for inserido no DOM
        const originalAppendChild = Node.prototype.appendChild;
        const originalInsertBefore = Node.prototype.insertBefore;

        const wrapInsert = (original: Function) => {
          return function (this: Node, ...args: any[]) {
            const result = original.apply(this, args);
            if (args[0] === element || (args[0] && args[0].contains && args[0].contains(element))) {
              checkOnInsert();
            }
            return result;
          };
        };

        Node.prototype.appendChild = wrapInsert(originalAppendChild) as any;
        Node.prototype.insertBefore = wrapInsert(originalInsertBefore) as any;
      }

      // Verificar src imediatamente se já estiver definido
      const existingSrc = element.getAttribute('src');
      if (existingSrc && isLikelyBrokenImage(existingSrc)) {
        checkAndBlock(existingSrc);
      }

      // Interceptar também o atributo data-src (usado por lazy loading)
      Object.defineProperty(element, 'dataset', {
        get() {
          return new Proxy(element.dataset, {
            set(target, prop, value) {
              if (prop === 'src' && value && isLikelyBrokenImage(value)) {
                const filename = value.split('/').pop() || '';
                console.warn(`🚫 Bloqueando data-src de imagem quebrada: ${filename}`);
                element.style.display = 'none';
                return true; // Bloquear
              }
              target[prop] = value;
              return true;
            }
          });
        },
        configurable: true
      });
    }

    return element;
  };

  // Interceptar eventos de erro em imagens
  document.addEventListener('error', (event) => {
    const target = event.target as HTMLImageElement;
    if (target && target.tagName === 'IMG' && target.src) {
      const filename = target.src.split('/').pop() || '';
      const url = target.src;

      // Verificar se é uma imagem quebrada conhecida
      if (BROKEN_IMAGES.some(img => filename === img || url.includes(img))) {
        console.warn(`🚫 Erro 404 interceptado para imagem quebrada: ${filename}`);
        // Remover a imagem do DOM ou substituir por placeholder
        target.style.display = 'none';
        target.src = ''; // Limpar src para evitar novas tentativas
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Se for uma imagem do padrão suspeito (/lovable-uploads/176[2-9]...), verificar via API antes de adicionar
      if (url.includes('/lovable-uploads/') && filename.match(/^176[2-9]\d{8,}-\d+\.(png|jpe?g|webp|gif)$/i)) {
        // Antes de adicionar à lista, tentar carregar via API
        const apiUrl = `${API_BASE_URL}/uploads/${filename}`;

        // Verificar via API em background
        fetch(apiUrl, { method: 'HEAD', cache: 'no-cache' })
          .then(response => {
            if (response.ok) {
              // Imagem existe via API, tentar recarregar
              console.log(`✅ Imagem existe via API, recarregando: ${filename}`);
              target.src = apiUrl;
              target.style.display = '';
              return;
            }
            // Se não existir via API também, adicionar à lista
            console.warn(`⚠️ Nova imagem quebrada detectada: ${filename}`);
            if (!BROKEN_IMAGES.includes(filename)) {
              BROKEN_IMAGES.push(filename);
              console.log(`📝 Imagem ${filename} adicionada à lista de quebradas`);
              try {
                const stored = localStorage.getItem('broken_images_list');
                const list = stored ? JSON.parse(stored) : [];
                if (!list.includes(filename)) {
                  list.push(filename);
                  localStorage.setItem('broken_images_list', JSON.stringify(list));
                  brokenImagesCache = list;
                  cacheTimestamp = Date.now();
                }
              } catch (e) {
                console.warn('Erro ao salvar lista de imagens quebradas:', e);
              }
            }
            target.style.display = 'none';
            target.src = '';
            event.preventDefault();
            event.stopPropagation();
          })
          .catch(() => {
            // Se der erro na verificação, adicionar à lista
            console.warn(`⚠️ Nova imagem quebrada detectada (erro na verificação): ${filename}`);
            if (!BROKEN_IMAGES.includes(filename)) {
              BROKEN_IMAGES.push(filename);
              console.log(`📝 Imagem ${filename} adicionada à lista de quebradas`);
              try {
                const stored = localStorage.getItem('broken_images_list');
                const list = stored ? JSON.parse(stored) : [];
                if (!list.includes(filename)) {
                  list.push(filename);
                  localStorage.setItem('broken_images_list', JSON.stringify(list));
                  brokenImagesCache = list;
                  cacheTimestamp = Date.now();
                }
              } catch (e) {
                console.warn('Erro ao salvar lista de imagens quebradas:', e);
              }
            }
            target.style.display = 'none';
            target.src = '';
            event.preventDefault();
            event.stopPropagation();
          });

        // Não bloquear imediatamente - aguardar resultado da verificação
        return;
      }
    }
  }, true);

  // Interceptar erros de carregamento de imagens via onerror global
  // Adicionar listener global para erros de imagem
  window.addEventListener('error', (event) => {
    const target = event.target;
    if (target && target instanceof HTMLImageElement) {
      const src = target.src || '';
      const filename = src.split('/').pop() || '';

      // Verificar se é uma imagem quebrada conhecida
      if (BROKEN_IMAGES.some(img => filename === img || src.includes(img))) {
        console.warn(`🚫 Erro de carregamento interceptado (global): ${filename}`);
        target.style.display = 'none';
        target.src = '';
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      // Se for uma imagem do padrão suspeito, verificar via API antes de adicionar
      if (src.includes('/lovable-uploads/') && filename.match(/^176[2-9]\d{8,}-\d+\.(png|jpe?g|webp|gif)$/i)) {
        // Antes de adicionar à lista, tentar carregar via API
        const apiUrl = `${API_BASE_URL}/uploads/${filename}`;

        // Verificar via API em background
        fetch(apiUrl, { method: 'HEAD', cache: 'no-cache' })
          .then(response => {
            if (response.ok) {
              // Imagem existe via API, tentar recarregar
              console.log(`✅ Imagem existe via API, recarregando: ${filename}`);
              target.src = apiUrl;
              target.style.display = '';
              return;
            }
            // Se não existir via API também, adicionar à lista
            console.warn(`⚠️ Nova imagem quebrada detectada (global error): ${filename}`);
            if (!BROKEN_IMAGES.includes(filename)) {
              BROKEN_IMAGES.push(filename);
              console.log(`📝 Imagem ${filename} adicionada à lista de quebradas`);
              try {
                const stored = localStorage.getItem('broken_images_list');
                const list = stored ? JSON.parse(stored) : [];
                if (!list.includes(filename)) {
                  list.push(filename);
                  localStorage.setItem('broken_images_list', JSON.stringify(list));
                }
              } catch (e) {
                console.warn('Erro ao salvar lista de imagens quebradas:', e);
              }
            }
            target.style.display = 'none';
            target.src = '';
            event.preventDefault();
            event.stopPropagation();
          })
          .catch(() => {
            // Se der erro na verificação, adicionar à lista
            console.warn(`⚠️ Nova imagem quebrada detectada (erro na verificação): ${filename}`);
            if (!BROKEN_IMAGES.includes(filename)) {
              BROKEN_IMAGES.push(filename);
              console.log(`📝 Imagem ${filename} adicionada à lista de quebradas`);
              try {
                const stored = localStorage.getItem('broken_images_list');
                const list = stored ? JSON.parse(stored) : [];
                if (!list.includes(filename)) {
                  list.push(filename);
                  localStorage.setItem('broken_images_list', JSON.stringify(list));
                }
              } catch (e) {
                console.warn('Erro ao salvar lista de imagens quebradas:', e);
              }
            }
            target.style.display = 'none';
            target.src = '';
            event.preventDefault();
            event.stopPropagation();
          });

        // Não bloquear imediatamente - aguardar resultado da verificação
        return;
      }
    }
  }, true);

  // Interceptar requisições HTTP 404 para imagens
  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const firstArg = args[0];
    const url = typeof firstArg === 'string'
      ? firstArg
      : (firstArg instanceof URL ? firstArg.toString() : (firstArg as any)?.url || '');

    // Se for uma requisição para uma imagem quebrada conhecida, bloquear
    if (url.includes('/lovable-uploads/')) {
      const filename = url.split('/').pop()?.split('?')[0] || '';
      if (BROKEN_IMAGES.some(img => filename === img || url.includes(img))) {
        console.warn(`🚫 Bloqueando requisição fetch para imagem quebrada: ${filename}`);
        return Promise.reject(new Error(`Imagem quebrada: ${filename}`));
      }
    }

    try {
      const response = await originalFetch.apply(this, args);

      // Se a resposta for 404 para uma imagem, verificar via API antes de adicionar
      if (response.status === 404 && url.includes('/lovable-uploads/')) {
        const filename = url.split('/').pop()?.split('?')[0] || '';
        if (filename.match(/^176[2-9]\d{8,}-\d+\.(png|jpe?g|webp|gif)$/i)) {
          // Tentar verificar via API antes de adicionar à lista
          const apiUrl = `${API_BASE_URL}/uploads/${filename}`;

          try {
            const finalApiUrl = apiUrl.startsWith('http://muhlstore')
              ? apiUrl.replace('http://', 'https://')
              : apiUrl;
            const apiResponse = await fetch(finalApiUrl, { method: 'HEAD', cache: 'no-cache' });
            if (apiResponse.ok) {
              console.log(`✅ Imagem existe via API (404 na original): ${filename}`);
              // Não adicionar à lista, a imagem existe via API
              return response;
            }
          } catch {
            // Se der erro na verificação, continuar e adicionar à lista
          }

          // Se não existir via API também, adicionar à lista
          console.warn(`⚠️ 404 detectado para imagem: ${filename}`);
          if (!BROKEN_IMAGES.includes(filename)) {
            BROKEN_IMAGES.push(filename);
            console.log(`📝 Imagem ${filename} adicionada à lista de quebradas`);
            try {
              const stored = localStorage.getItem('broken_images_list');
              const list = stored ? JSON.parse(stored) : [];
              if (!list.includes(filename)) {
                list.push(filename);
                localStorage.setItem('broken_images_list', JSON.stringify(list));
              }
            } catch (e) {
              console.warn('Erro ao salvar lista de imagens quebradas:', e);
            }
          }
        }
      }

      return response;
    } catch (error) {
      // Se for erro de rede para imagem suspeita, adicionar à lista
      if (url.includes('/lovable-uploads/')) {
        const filename = url.split('/').pop()?.split('?')[0] || '';
        if (filename.match(/^176[2-9]\d{8,}-\d+\.(png|jpe?g|webp|gif)$/i)) {
          console.warn(`⚠️ Erro de rede para imagem suspeita: ${filename}`);
          if (!BROKEN_IMAGES.includes(filename)) {
            BROKEN_IMAGES.push(filename);
            console.log(`📝 Imagem ${filename} adicionada à lista de quebradas`);
            // Salvar no localStorage para persistência
            try {
              const stored = localStorage.getItem('broken_images_list');
              const list = stored ? JSON.parse(stored) : [];
              if (!list.includes(filename)) {
                list.push(filename);
                localStorage.setItem('broken_images_list', JSON.stringify(list));
              }
            } catch (e) {
              console.warn('Erro ao salvar lista de imagens quebradas:', e);
            }
          }
        }
      }
      throw error;
    }
  };
}

/**
 * Limpa a lista de imagens quebradas do localStorage, removendo imagens que realmente existem
 * Pode ser chamada do console do navegador: window.cleanBrokenImagesList()
 */
export async function cleanBrokenImagesList(): Promise<number> {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return 0;
  }

  try {
    const stored = localStorage.getItem('broken_images_list');
    if (!stored) {
      return 0;
    }

    const list = JSON.parse(stored);
    if (!Array.isArray(list)) {
      return 0;
    }

    const baseUrl = window.location.origin;
    let removedCount = 0;
    const verifiedList: string[] = [];

    // Verificar cada imagem da lista
    for (const filename of list) {
      const imageUrl = `${API_BASE_URL.replace('/api', '')}/lovable-uploads/${filename}`;
      const apiUrl = `${API_BASE_URL}/uploads/${filename}`;

      // Função auxiliar para verificar uma URL
      const checkUrl = async (url: string): Promise<boolean> => {
        try {
          const finalUrl = url.startsWith('http://muhlstore')
            ? url.replace('http://', 'https://')
            : url;
          const response = await fetch(finalUrl, { method: 'HEAD', cache: 'no-cache' });
          return response.ok;
        } catch {
          return false;
        }
      };

      try {
        // Tentar URL original primeiro
        let exists = await checkUrl(imageUrl);

        // Se não existir, tentar via API
        if (!exists) {
          console.log(`🔄 Tentando verificar via API: ${apiUrl}`);
          exists = await checkUrl(apiUrl);
        }

        if (exists) {
          // Imagem existe, não adicionar à lista verificada
          removedCount++;
          console.log(`✅ Imagem ${filename} existe, removendo da lista de quebradas`);
        } else {
          // Imagem realmente não existe, manter na lista
          verifiedList.push(filename);
        }
      } catch {
        // Se der erro, assumir que não existe e manter na lista
        verifiedList.push(filename);
      }
    }

    // Atualizar lista no localStorage
    if (removedCount > 0) {
      localStorage.setItem('broken_images_list', JSON.stringify(verifiedList));
      brokenImagesCache = verifiedList;
      cacheTimestamp = Date.now();
      console.log(`🧹 Limpeza concluída: ${removedCount} imagens removidas da lista de quebradas`);
    }

    return removedCount;
  } catch (e) {
    console.warn('Erro ao limpar lista de imagens quebradas:', e);
    return 0;
  }
}

const isDev = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV === true;

// Executar automaticamente ao carregar
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  if (isDev) console.log('🔍 Verificando imagens quebradas no localStorage...');

  try {
    const stored = localStorage.getItem('broken_images_list');
    if (stored) {
      const list = JSON.parse(stored);
      list.forEach((img: string) => {
        if (!BROKEN_IMAGES.includes(img)) {
          BROKEN_IMAGES.push(img);
        }
      });
      if (isDev) console.log(`📋 ${list.length} imagens quebradas carregadas do localStorage`);

      if (list.length > 0) {
        cleanBrokenImagesList().catch(e => {
          if (isDev) console.warn('Erro ao limpar lista automaticamente:', e);
        });
      }
    }
  } catch (e) {
    if (isDev) console.warn('Erro ao carregar lista de imagens quebradas:', e);
  }

  const cleaned = cleanBrokenImages();
  if (cleaned && isDev) console.log('🎉 localStorage limpo! Recarregue a página se necessário.');

  interceptBrokenImageLoads();

  if (typeof window !== 'undefined') {
    (window as any).cleanBrokenImagesList = cleanBrokenImagesList;
    if (isDev) console.log('💡 Dica: Use window.cleanBrokenImagesList() no console para limpar a lista de imagens quebradas');
  }
}

