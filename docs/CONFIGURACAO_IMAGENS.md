# 📸 Configurações Recomendadas de Imagens

## Resumo das Configurações Atuais

### Limites do Sistema
- **Tamanho máximo**: 5MB por arquivo
- **Formatos aceitos**: PNG, JPG, JPEG, GIF, WebP, SVG, AVIF, BMP
- **Compressão automática**: Não (imagens são salvas como enviadas)

---

## 🎯 Configurações Ideais por Tipo de Uso

### 1. **Imagens de Produtos (Catálogo)**
- **Resolução recomendada**: 1200x1200px (máximo)
- **Aspect ratio**: 1:1 (quadrado) ou 4:3
- **Formato**: JPG ou WebP (melhor compressão)
- **Qualidade**: 85-90%
- **Tamanho de arquivo**: 200-500KB (ideal)
- **O que usar**:
  - JPG para fotos de produtos
  - PNG apenas se precisar de transparência
  - WebP para melhor qualidade/tamanho

### 2. **Imagens de Blog/Posts**
- **Imagem principal**: 1920x1080px (16:9) ou 1200x800px
- **Imagem destaque**: 1920x600px (banner)
- **Formato**: JPG ou WebP
- **Qualidade**: 85%
- **Tamanho**: 300-800KB

### 3. **Imagens de Coleções/Banners**
- **Resolução**: 1920x600px ou 1200x400px
- **Formato**: JPG ou WebP
- **Qualidade**: 85%
- **Tamanho**: 400-700KB

### 4. **Thumbnails/Miniaturas**
- **Resolução**: 300x300px ou 400x400px
- **Formato**: JPG ou WebP
- **Qualidade**: 80%
- **Tamanho**: 50-150KB

---

## ⚙️ Configurações Técnicas Atuais

### Backend (server.cjs)
```javascript
Limite de upload: 5MB
Formatos aceitos: PNG, JPG, JPEG, GIF, WebP, SVG, AVIF, BMP
Validação: Por mimetype e extensão
```

### Processamento (config/imageProcessor.cjs)
```javascript
Tamanhos disponíveis:
- Thumbnail: 150x150px
- Small: 300x300px
- Medium: 800x800px
- Large: 1200x1200px

Qualidade:
- JPEG: 85%
- WebP: 85%
- PNG: 90%
```

---

## 📋 Recomendações Gerais

### ✅ Boas Práticas

1. **Para Melhor Performance**:
   - Use JPG para fotos (menor tamanho)
   - Use PNG apenas se precisar de transparência
   - Use WebP quando possível (melhor compressão)
   - Redimensione antes de fazer upload

2. **Tamanhos Ideais**:
   - **Produtos**: 1200x1200px (máx 500KB)
   - **Banners**: 1920x600px (máx 700KB)
   - **Blog**: 1200x800px (máx 600KB)
   - **Thumbnails**: 400x400px (máx 150KB)

3. **Qualidade vs Tamanho**:
   - **Alta qualidade (90-95%)**: Para imagens principais importantes
   - **Média qualidade (80-85%)**: Para uso geral (recomendado)
   - **Baixa qualidade (70-75%)**: Para thumbnails e previews

### ❌ Evite

- Upload de imagens muito grandes (>2000px) sem redimensionar
- PNG para fotos (use JPG para menor tamanho)
- Imagens acima de 5MB
- Qualidade 100% (aumenta muito o tamanho sem ganho visível)

---

## 🛠️ Como Otimizar Imagens Antes do Upload

### Opção 1: Usar Ferramentas Online
- **TinyPNG**: https://tinypng.com/ (comprime PNG e JPG)
- **Squoosh**: https://squoosh.app/ (otimização avançada)
- **ImageOptim**: Para Mac

### Opção 2: Usar Software
- **Photoshop**: Salvar para Web (JPG qualidade 85%)
- **GIMP**: Exportar com qualidade 85%
- **IrfanView**: Redimensionar e comprimir

### Opção 3: Scripts Automáticos
O sistema possui utilitários de compressão no frontend que podem ser usados antes do upload.

---

## 📊 Comparação de Formatos

| Formato | Melhor Para | Vantagens | Desvantagens |
|---------|-------------|-----------|--------------|
| **JPG** | Fotos, produtos | Menor tamanho, boa qualidade | Sem transparência |
| **PNG** | Logos, gráficos | Transparência, sem perda | Arquivos maiores |
| **WebP** | Uso geral | Melhor compressão | Suporte limitado em navegadores antigos |
| **AVIF** | Uso moderno | Excelente compressão | Suporte muito limitado |

---

## 🎨 Dicas de Design

1. **Produtos**:
   - Fundo branco ou neutro
   - Iluminação uniforme
   - Produto centralizado
   - Aspect ratio 1:1 facilita layout

2. **Banners**:
   - Texto legível (evitar sobrepor imagens)
   - Elementos importantes no centro
   - Resolução adequada para não ficar pixelada

3. **Blog**:
   - Imagens relacionadas ao conteúdo
   - Boa qualidade para impressão (se necessário)
   - Aspect ratio 16:9 para banners

---

## 🔧 Configurações do Sistema

### Limites Atuais
- ✅ Tamanho máximo: **5MB**
- ✅ Formatos: PNG, JPG, JPEG, GIF, WebP, SVG, AVIF, BMP
- ✅ Validação automática de arquivos
- ✅ Headers CORS configurados
- ✅ Content-Type correto por extensão

### Melhorias Futuras Sugeridas
- [ ] Compressão automática no upload
- [ ] Geração de múltiplos tamanhos (thumbnail, medium, large)
- [ ] Conversão automática para WebP
- [ ] Redimensionamento automático de imagens muito grandes

---

## 📝 Checklist de Upload

Antes de fazer upload, verifique:

- [ ] Imagem redimensionada para tamanho adequado
- [ ] Tamanho do arquivo < 5MB
- [ ] Formato correto (JPG/PNG/WebP)
- [ ] Qualidade adequada (85% é ideal)
- [ ] Aspect ratio correto para o uso
- [ ] Imagem otimizada com ferramenta de compressão

---

**Última atualização**: 04/11/2025

