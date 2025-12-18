/**
 * Upload Configuration
 * 
 * Configuração centralizada do Multer para upload de arquivos
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Diretório de uploads
const uploadDir = path.join(__dirname, '../../public/lovable-uploads');

// Criar diretório se não existir
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('📁 Diretório de uploads criado:', uploadDir);
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, uniqueSuffix + extension);
  }
});

// Multer para imagens (5MB limit)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Aceitar qualquer tipo de imagem
    if (file.mimetype.startsWith('image/')) {
      if (file.mimetype === 'image/png' || file.originalname.toLowerCase().endsWith('.png')) {
        console.log(`📸 Upload de PNG detectado: ${file.originalname} (mimetype: ${file.mimetype})`);
      }
      cb(null, true);
    } else {
      // Verificar por extensão caso o mimetype não seja detectado
      const ext = path.extname(file.originalname).toLowerCase();
      const imageExts = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.avif', '.bmp'];
      if (imageExts.includes(ext)) {
        console.log(`📸 Upload de imagem por extensão: ${file.originalname} (mimetype: ${file.mimetype}, extensão: ${ext})`);
        cb(null, true);
      } else {
        console.warn(`⚠️ Arquivo rejeitado: ${file.originalname} (mimetype: ${file.mimetype}, extensão: ${ext})`);
        cb(new Error('Only image files are allowed!'), false);
      }
    }
  }
});

module.exports = {
  upload,
  uploadDir
};
