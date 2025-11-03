import { describe, it, expect } from 'vitest';
import {
  generateAriaId,
  getAriaLoadingProps,
  getAriaAlertProps,
  checkColorContrast,
} from '@/utils/accessibility';

describe('accessibility utils', () => {
  describe('generateAriaId', () => {
    it('deve gerar IDs únicos com prefixo', () => {
      const id1 = generateAriaId('test');
      const id2 = generateAriaId('test');
      
      expect(id1).toMatch(/^test-/);
      expect(id2).toMatch(/^test-/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getAriaLoadingProps', () => {
    it('deve retornar props corretas quando carregando', () => {
      const props = getAriaLoadingProps(true, 'Aguarde...');
      
      expect(props['aria-busy']).toBe(true);
      expect(props['aria-live']).toBe('polite');
      expect(props['aria-label']).toBe('Aguarde...');
    });

    it('deve retornar props corretas quando não está carregando', () => {
      const props = getAriaLoadingProps(false);
      
      expect(props['aria-busy']).toBe(false);
      expect(props['aria-label']).toBeUndefined();
    });
  });

  describe('getAriaAlertProps', () => {
    it('deve usar role alert para errors', () => {
      const props = getAriaAlertProps('error');
      expect(props.role).toBe('alert');
      expect(props['aria-live']).toBe('assertive');
    });

    it('deve usar role status para info', () => {
      const props = getAriaAlertProps('info');
      expect(props.role).toBe('status');
      expect(props['aria-live']).toBe('polite');
    });
  });

  describe('checkColorContrast', () => {
    it('deve calcular contraste entre cores', () => {
      // Preto sobre branco = contraste máximo (~21:1)
      const blackOnWhite = checkColorContrast('#000000', '#FFFFFF');
      expect(blackOnWhite.ratio).toBeGreaterThan(20);
      expect(blackOnWhite.passAA).toBe(true);
      expect(blackOnWhite.passAAA).toBe(true);
    });

    it('deve reprovar contraste insuficiente', () => {
      // Cinza claro sobre branco = contraste baixo
      const lightGrayOnWhite = checkColorContrast('#CCCCCC', '#FFFFFF');
      expect(lightGrayOnWhite.ratio).toBeLessThan(4.5);
      expect(lightGrayOnWhite.passAA).toBe(false);
    });
  });
});
