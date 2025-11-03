import { describe, it, expect } from 'vitest';
import { normalizeImageUrl, getProductImage } from '@/utils/imageUtils';

describe('imageUtils', () => {
  describe('normalizeImageUrl', () => {
    it('deve retornar placeholder para valores inválidos', () => {
      expect(normalizeImageUrl(null)).toBe('/placeholder.svg');
      expect(normalizeImageUrl(undefined)).toBe('/placeholder.svg');
      expect(normalizeImageUrl('')).toBe('/placeholder.svg');
      expect(normalizeImageUrl('null')).toBe('/placeholder.svg');
      expect(normalizeImageUrl('undefined')).toBe('/placeholder.svg');
    });

    it('deve retornar URL completa sem modificação', () => {
      const url = 'https://example.com/image.jpg';
      expect(normalizeImageUrl(url)).toBe(url);
    });

    it('deve adicionar / no início de caminhos relativos', () => {
      expect(normalizeImageUrl('uploads/image.jpg')).toBe('/uploads/image.jpg');
      expect(normalizeImageUrl('/uploads/image.jpg')).toBe('/uploads/image.jpg');
    });

    it('deve manter caminhos de lovable-uploads', () => {
      const path = '/lovable-uploads/test.jpg';
      expect(normalizeImageUrl(path)).toBe(path);
    });
  });

  describe('getProductImage', () => {
    it('deve retornar imagem de múltiplos campos possíveis', () => {
      const produto1 = { imagemUrl: '/test1.jpg' };
      const produto2 = { imagem_url: '/test2.jpg' };
      const produto3 = { image_url: '/test3.jpg' };

      expect(getProductImage(produto1)).toBe('/test1.jpg');
      expect(getProductImage(produto2)).toBe('/test2.jpg');
      expect(getProductImage(produto3)).toBe('/test3.jpg');
    });

    it('deve retornar placeholder se produto não tiver imagem', () => {
      expect(getProductImage({})).toBe('/placeholder.svg');
      expect(getProductImage({ nome: 'Produto' })).toBe('/placeholder.svg');
    });

    it('deve priorizar imagemUrl sobre outros campos', () => {
      const produto = {
        imagemUrl: '/priority.jpg',
        imagem_url: '/secondary.jpg',
        image_url: '/tertiary.jpg',
      };
      expect(getProductImage(produto)).toBe('/priority.jpg');
    });
  });
});
