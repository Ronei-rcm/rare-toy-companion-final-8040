import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Criar ícones simples para PWA usando SVG
const createIcon = (size, color = '#3b82f6') => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white">🎯</text>
</svg>`;
};

const createMaskableIcon = (size, color = '#3b82f6') => {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="${color}"/>
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.4}" fill="white"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${color}">🎯</text>
</svg>`;
};

const sizes = [16, 32, 48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

// Criar diretório de ícones
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Gerar ícones
sizes.forEach(size => {
  // Ícone normal
  const iconSvg = createIcon(size);
  const iconPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
  fs.writeFileSync(iconPath, iconSvg);
  
  // Ícone maskable
  const maskableIconSvg = createMaskableIcon(size);
  const maskableIconPath = path.join(iconsDir, `icon-${size}x${size}-maskable.svg`);
  fs.writeFileSync(maskableIconPath, maskableIconSvg);
  
  console.log(`✅ Gerado ícone ${size}x${size}`);
});

// Criar ícones de atalho
const shortcuts = [
  { name: 'products', icon: '📦' },
  { name: 'cart', icon: '🛒' },
  { name: 'account', icon: '👤' },
  { name: 'offers', icon: '🔥' }
];

shortcuts.forEach(shortcut => {
  const shortcutSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="96" height="96" viewBox="0 0 96 96" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="20" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="40" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white">${shortcut.icon}</text>
</svg>`;
  
  const shortcutPath = path.join(iconsDir, `shortcut-${shortcut.name}.svg`);
  fs.writeFileSync(shortcutPath, shortcutSvg);
  console.log(`✅ Gerado atalho ${shortcut.name}`);
});

// Criar ícones de ação
const actions = [
  { name: 'explore', icon: '🔍' },
  { name: 'close', icon: '❌' }
];

actions.forEach(action => {
  const actionSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="4" fill="#3b82f6"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white">${action.icon}</text>
</svg>`;
  
  const actionPath = path.join(iconsDir, `action-${action.name}.svg`);
  fs.writeFileSync(actionPath, actionSvg);
  console.log(`✅ Gerado ação ${action.name}`);
});

// Criar badge
const badgeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="72" height="72" viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">
  <circle cx="36" cy="36" r="36" fill="#ef4444"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="white">!</text>
</svg>`;

const badgePath = path.join(iconsDir, 'badge-72x72.svg');
fs.writeFileSync(badgePath, badgeSvg);
console.log('✅ Gerado badge');

console.log('\n🎉 Todos os ícones do PWA foram gerados com sucesso!');
console.log(`📁 Localização: ${iconsDir}`);
