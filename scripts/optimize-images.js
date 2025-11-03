
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function optimizeImages() {
  const publicDir = path.join(__dirname, '..', 'public');
  const uploadsDir = path.join(__dirname, '..', 'public', 'lovable-uploads');
  
  console.log('🔍 Buscando imagens para otimizar...');
  
  const optimizeImage = async (filePath) => {
    try {
      const outputPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      
      await sharp(filePath)
        .webp({ quality: 85 })
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .toFile(outputPath);
      
      console.log(`✅ Otimizada: ${path.basename(filePath)} -> ${path.basename(outputPath)}`);
      
      // Remover arquivo original se for muito grande
      const stats = fs.statSync(filePath);
      if (stats.size > 500000) { // 500KB
        fs.unlinkSync(filePath);
        console.log(`🗑️ Removido arquivo original: ${path.basename(filePath)}`);
      }
    } catch (error) {
      console.warn(`⚠️ Erro ao otimizar ${filePath}: ${error.message}`);
    }
  };
  
  const processDirectory = async (dir) => {
    if (!fs.existsSync(dir)) return;
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        await processDirectory(filePath);
      } else if (/.(jpg|jpeg|png)$/i.test(file)) {
        await optimizeImage(filePath);
      }
    }
  };
  
  await processDirectory(publicDir);
  await processDirectory(uploadsDir);
  
  console.log('🎉 Otimização de imagens concluída!');
}

optimizeImages().catch(console.error);
