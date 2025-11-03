/**
 * Processamento e otimização de imagens com Sharp
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Configurações de otimização de imagens
 */
const IMAGE_CONFIG = {
  // Tamanhos para diferentes tipos de imagem
  sizes: {
    thumbnail: { width: 150, height: 150 },
    small: { width: 300, height: 300 },
    medium: { width: 800, height: 800 },
    large: { width: 1200, height: 1200 },
  },
  
  // Qualidade de compressão
  quality: {
    jpeg: 85,
    webp: 85,
    png: 90,
  },
  
  // Formato padrão
  defaultFormat: 'webp',
  
  // Tamanho máximo de arquivo (em bytes)
  maxFileSize: 5 * 1024 * 1024, // 5MB
};

/**
 * Gera nome único para arquivo de imagem
 */
function generateFilename(originalName, size = null) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString('hex');
  const ext = size ? `.${size}.webp` : '.webp';
  const baseName = path.basename(originalName, path.extname(originalName));
  return `${baseName}-${timestamp}-${random}${ext}`;
}

/**
 * Processa uma imagem: redimensiona, otimiza e salva
 */
async function processImage(inputPath, outputDir, options = {}) {
  try {
    const {
      sizes = ['thumbnail', 'medium', 'large'],
      format = IMAGE_CONFIG.defaultFormat,
      quality = IMAGE_CONFIG.quality.webp,
      preserveOriginal = false,
    } = options;

    // Garantir que o diretório de saída existe
    await fs.mkdir(outputDir, { recursive: true });

    // Ler metadados da imagem
    const metadata = await sharp(inputPath).metadata();
    const results = [];

    // Processar cada tamanho
    for (const sizeName of sizes) {
      const sizeConfig = IMAGE_CONFIG.sizes[sizeName];
      if (!sizeConfig) continue;

      const filename = generateFilename(path.basename(inputPath), sizeName);
      const outputPath = path.join(outputDir, filename);

      await sharp(inputPath)
        .resize(sizeConfig.width, sizeConfig.height, {
          fit: 'cover',
          position: 'center',
          withoutEnlargement: true, // Não aumentar imagens menores
        })
        .toFormat(format, { quality })
        .toFile(outputPath);

      results.push({
        size: sizeName,
        path: outputPath,
        url: `/lovable-uploads/${path.basename(outputDir)}/${filename}`,
        width: sizeConfig.width,
        height: sizeConfig.height,
      });
    }

    // Se não preservar original, deletar
    if (!preserveOriginal) {
      await fs.unlink(inputPath).catch(() => {});
    }

    return {
      success: true,
      original: metadata,
      processed: results,
      mainUrl: results.find(r => r.size === 'medium')?.url || results[0]?.url,
    };
  } catch (error) {
    console.error('[ImageProcessor] Erro ao processar imagem:', error);
    throw new Error(`Falha ao processar imagem: ${error.message}`);
  }
}

/**
 * Processa imagem de um buffer (útil para uploads)
 */
async function processImageFromBuffer(buffer, filename, outputDir, options = {}) {
  try {
    // Criar arquivo temporário
    const tempPath = path.join(outputDir, `temp-${Date.now()}-${filename}`);
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(tempPath, buffer);

    // Processar
    const result = await processImage(tempPath, outputDir, {
      ...options,
      preserveOriginal: false, // Sempre deletar temp
    });

    return result;
  } catch (error) {
    console.error('[ImageProcessor] Erro ao processar buffer:', error);
    throw error;
  }
}

/**
 * Otimiza imagem existente in-place
 */
async function optimizeImage(imagePath, options = {}) {
  try {
    const {
      maxWidth = 1920,
      maxHeight = 1920,
      quality = 85,
    } = options;

    const tempPath = `${imagePath}.temp`;

    await sharp(imagePath)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality, progressive: true })
      .toFile(tempPath);

    // Substituir original
    await fs.unlink(imagePath);
    await fs.rename(tempPath, imagePath);

    return { success: true, path: imagePath };
  } catch (error) {
    console.error('[ImageProcessor] Erro ao otimizar imagem:', error);
    throw error;
  }
}

/**
 * Gera thumbnail rápido
 */
async function generateThumbnail(inputPath, size = 150) {
  try {
    const buffer = await sharp(inputPath)
      .resize(size, size, { fit: 'cover' })
      .webp({ quality: 80 })
      .toBuffer();

    return buffer;
  } catch (error) {
    console.error('[ImageProcessor] Erro ao gerar thumbnail:', error);
    throw error;
  }
}

/**
 * Converte imagem para WebP
 */
async function convertToWebP(inputPath, outputPath, quality = 85) {
  try {
    await sharp(inputPath)
      .webp({ quality })
      .toFile(outputPath);

    return { success: true, path: outputPath };
  } catch (error) {
    console.error('[ImageProcessor] Erro ao converter para WebP:', error);
    throw error;
  }
}

/**
 * Middleware do Multer para processar imagens automaticamente
 */
function createImageProcessorMiddleware(multerInstance, options = {}) {
  return async (req, res, next) => {
    try {
      // Se não houver arquivo, pular
      if (!req.file && !req.files) {
        return next();
      }

      const uploadDir = path.join(__dirname, '../public/lovable-uploads');
      
      // Processar arquivo único
      if (req.file) {
        const result = await processImageFromBuffer(
          req.file.buffer,
          req.file.originalname,
          uploadDir,
          options
        );
        req.processedImage = result;
      }
      
      // Processar múltiplos arquivos
      if (req.files && Array.isArray(req.files)) {
        req.processedImages = [];
        for (const file of req.files) {
          const result = await processImageFromBuffer(
            file.buffer,
            file.originalname,
            uploadDir,
            options
          );
          req.processedImages.push(result);
        }
      }

      next();
    } catch (error) {
      console.error('[ImageProcessor Middleware] Erro:', error);
      res.status(500).json({
        error: 'Falha ao processar imagem',
        details: error.message,
      });
    }
  };
}

module.exports = {
  processImage,
  processImageFromBuffer,
  optimizeImage,
  generateThumbnail,
  convertToWebP,
  createImageProcessorMiddleware,
  IMAGE_CONFIG,
};
