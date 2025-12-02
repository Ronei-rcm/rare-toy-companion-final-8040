# 📹 Galeria de Vídeos - Documentação Completa

**Data de Implementação:** 29 de Novembro de 2025  
**Status:** ✅ Implementado e Funcional  
**Versão:** 1.0.0

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades](#funcionalidades)
3. [Estrutura Técnica](#estrutura-técnica)
4. [API Endpoints](#api-endpoints)
5. [Componentes Frontend](#componentes-frontend)
6. [Configuração](#configuração)
7. [Uso](#uso)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O módulo de **Galeria de Vídeos** permite gerenciar e exibir vídeos na plataforma MuhlStore. Suporta vídeos locais (upload direto) e vídeos externos (YouTube, Vimeo). O sistema inclui:

- ✅ Gerenciamento completo de vídeos no painel admin
- ✅ Exibição na home page (seção configurável)
- ✅ Página dedicada `/videos` com galeria completa
- ✅ Reprodução automática ao clicar
- ✅ Contador de visualizações
- ✅ Categorização e organização

---

## ✨ Funcionalidades

### Para Administradores

1. **CRUD Completo de Vídeos**
   - Criar, editar, excluir vídeos
   - Upload de vídeos locais (MP4, WebM, etc.)
   - Adicionar vídeos do YouTube/Vimeo via URL
   - Upload de thumbnails personalizadas
   - Definir categoria, ordem e duração
   - Ativar/desativar vídeos

2. **Gerenciamento Avançado**
   - Ordenação personalizada
   - Categorização
   - Controle de visibilidade (ativo/inativo)
   - Estatísticas de visualizações

### Para Usuários

1. **Visualização**
   - Galeria na home page (até 6 vídeos)
   - Página completa `/videos` com todos os vídeos
   - Modal com player de vídeo
   - Reprodução automática ao clicar

2. **Experiência**
   - Thumbnails otimizadas
   - Player responsivo
   - Suporte a vídeos locais e externos
   - Contador de visualizações

---

## 🏗️ Estrutura Técnica

### Banco de Dados

**Tabela: `video_gallery`**

```sql
CREATE TABLE video_gallery (
  id VARCHAR(191) PRIMARY KEY,
  titulo VARCHAR(255) NOT NULL,
  descricao TEXT,
  video_url VARCHAR(1000) NOT NULL,
  thumbnail_url VARCHAR(500),
  categoria VARCHAR(100),
  duracao INT DEFAULT 0 COMMENT 'Duração em segundos',
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  visualizacoes INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_active (is_active),
  INDEX idx_ordem (ordem),
  INDEX idx_categoria (categoria)
);
```

### Arquivos Principais

#### Backend
- `server/server.cjs` - Endpoints da API
- `database/migrations/011_create_video_gallery_table.sql` - Migração da tabela

#### Frontend
- `src/pages/Videos.tsx` - Página dedicada de vídeos
- `src/pages/admin/VideoGalleryAdmin.tsx` - Painel admin
- `src/components/VideoGallery.tsx` - Componente principal
- `src/components/sections/VideoGallerySection.tsx` - Seção da home
- `src/components/admin/VideoGalleryManager.tsx` - Gerenciador admin
- `src/components/admin/VideoUpload.tsx` - Componente de upload
- `src/services/video-gallery-api.ts` - Serviço de API

---

## 🔌 API Endpoints

### GET `/api/videos`
Lista todos os vídeos (admin)

**Resposta:**
```json
[
  {
    "id": "uuid",
    "titulo": "Título do Vídeo",
    "descricao": "Descrição",
    "video_url": "/lovable-uploads/video.mp4",
    "thumbnail_url": "/lovable-uploads/thumb.jpg",
    "categoria": "Eventos",
    "duracao": 120,
    "ordem": 1,
    "is_active": true,
    "visualizacoes": 42
  }
]
```

### GET `/api/videos/active`
Lista apenas vídeos ativos (público)

### GET `/api/videos/:id`
Busca vídeo específico

### POST `/api/videos`
Cria novo vídeo

**Body:**
```json
{
  "titulo": "Título",
  "descricao": "Descrição",
  "video_url": "https://youtube.com/watch?v=...",
  "thumbnail_url": "/lovable-uploads/thumb.jpg",
  "categoria": "Eventos",
  "duracao": 120,
  "ordem": 1,
  "is_active": true
}
```

### PUT `/api/videos/:id`
Atualiza vídeo existente

### DELETE `/api/videos/:id`
Remove vídeo

### PUT `/api/videos/:id/toggle`
Ativa/desativa vídeo

### PUT `/api/videos/:id/views`
Incrementa contador de visualizações

### POST `/api/upload/video`
Upload de arquivo de vídeo

**Form Data:**
- `video`: Arquivo de vídeo (MP4, WebM, etc.)
- Tamanho máximo: 500MB

---

## 🎨 Componentes Frontend

### VideoGallery

Componente principal para exibir a galeria.

**Props:**
```typescript
interface VideoGalleryProps {
  categoria?: string;      // Filtrar por categoria
  limit?: number;         // Limitar quantidade
  showTitle?: boolean;    // Mostrar título da seção
  className?: string;     // Classes CSS adicionais
}
```

**Uso:**
```tsx
<VideoGallery 
  showTitle={true} 
  limit={6} 
  categoria="Eventos" 
/>
```

### VideoGallerySection

Seção para a home page.

**Uso:**
```tsx
<VideoGallerySection />
```

### VideoGalleryManager

Gerenciador completo no painel admin.

**Localização:** `/admin/video-gallery`

---

## ⚙️ Configuração

### 1. Migração do Banco de Dados

Execute a migração:
```bash
mysql -u usuario -p database < database/migrations/011_create_video_gallery_table.sql
```

### 2. Configuração do Servidor

O servidor já está configurado para:
- Servir arquivos estáticos do build
- Fallback SPA para rotas do React Router
- Upload de vídeos até 500MB

### 3. Configuração da Home

A seção de vídeos pode ser habilitada/desabilitada em:
- **Admin → Configurações → Gerenciar Home**
- Seção: "Galeria de Vídeos"

### 4. Service Worker

O Service Worker está configurado para:
- Não cachear vídeos (evita problemas com 206 Partial Content)
- Cachear thumbnails e outros assets
- Versão atual: `v1.0.4`

---

## 📖 Uso

### Adicionar Vídeo (Admin)

1. Acesse: **Admin → Galeria de Vídeos**
2. Clique em **"Adicionar Vídeo"**
3. Preencha:
   - Título (obrigatório)
   - Descrição (opcional)
   - URL do vídeo ou faça upload
   - Thumbnail (opcional)
   - Categoria (opcional)
   - Duração em segundos (opcional)
   - Ordem de exibição
4. Clique em **"Salvar"**

### Adicionar Vídeo do YouTube/Vimeo

1. Copie a URL do vídeo
2. Cole no campo "URL do Vídeo"
3. O sistema detecta automaticamente e gera o embed

### Upload de Vídeo Local

1. Clique em **"Fazer Upload de Vídeo"**
2. Selecione o arquivo (MP4, WebM, etc.)
3. Aguarde o upload (até 500MB)
4. O vídeo será salvo em `/lovable-uploads/`

### Ordenar Vídeos

1. Na lista de vídeos, use os botões de seta
2. Ou edite o campo "Ordem" manualmente
3. Vídeos são ordenados por `ordem` ASC

### Ativar/Desativar Vídeo

1. Clique no toggle ao lado do vídeo
2. Vídeos inativos não aparecem na galeria pública

---

## 🔧 Troubleshooting

### Vídeo não aparece na home

**Solução:**
1. Verifique se o vídeo está ativo (`is_active = true`)
2. Verifique se a seção está habilitada em **Admin → Configurações → Gerenciar Home**
3. Limpe o cache do navegador (Ctrl+Shift+R)
4. Desregistre o Service Worker antigo

### Erro 404 na rota `/videos`

**Solução:**
1. Verifique se o build foi feito: `npm run build`
2. Verifique se o servidor tem o fallback SPA configurado
3. Reinicie o servidor: `pm2 restart api`
4. Limpe o cache do navegador

### Vídeo não reproduz

**Solução:**
1. Verifique se a URL do vídeo está correta
2. Para vídeos locais, verifique se o arquivo existe em `/lovable-uploads/`
3. Para YouTube/Vimeo, verifique se a URL está no formato correto
4. Verifique os logs do console do navegador (F12)

### Upload de vídeo falha

**Solução:**
1. Verifique o tamanho do arquivo (máximo 500MB)
2. Verifique o formato (MP4, WebM, etc.)
3. Verifique permissões da pasta `/lovable-uploads/`
4. Verifique logs do servidor (PM2)

### Service Worker cacheando versão antiga

**Solução:**
1. Atualize a versão do Service Worker em `public/sw.js`
2. Limpe o cache: F12 → Application → Clear storage
3. Desregistre o Service Worker: F12 → Application → Service Workers → Unregister
4. Recarregue a página (Ctrl+Shift+R)

---

## 📊 Estatísticas

- **Vídeos Suportados:** MP4, WebM, OGG, MOV, AVI, MKV, FLV, WMV, M4V
- **Tamanho Máximo:** 500MB por vídeo
- **Plataformas Externas:** YouTube, Vimeo
- **Thumbnails:** Upload manual ou automático (YouTube)
- **Visualizações:** Contador automático

---

## 🚀 Melhorias Futuras

- [ ] Suporte a playlists
- [ ] Player customizado com controles avançados
- [ ] Analytics detalhado de visualizações
- [ ] Compartilhamento social
- [ ] Comentários nos vídeos
- [ ] Recomendações baseadas em visualizações
- [ ] Transcodificação automática de vídeos
- [ ] CDN para vídeos grandes

---

## 📝 Changelog

### v1.0.0 (29/11/2025)
- ✅ Implementação inicial
- ✅ CRUD completo de vídeos
- ✅ Upload de vídeos locais
- ✅ Suporte a YouTube/Vimeo
- ✅ Galeria na home page
- ✅ Página dedicada `/videos`
- ✅ Contador de visualizações
- ✅ Reprodução automática
- ✅ Gerenciamento no admin

---

## 🔗 Links Relacionados

- [Documentação da API](../API.md)
- [Guia de Deploy](../GUIA_DEPLOY_FINAL.md)
- [Estrutura do Projeto](../ARCHITECTURE.md)

---

**Última Atualização:** 29 de Novembro de 2025  
**Mantido por:** Equipe MuhlStore

