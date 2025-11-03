/**
 * Testes Unitários - Segurança
 */

const { describe, it, expect, beforeEach } = require('vitest');
const request = require('supertest');
const express = require('express');
require('dotenv').config();

// Importar middleware de segurança
const { setupSecurityMiddleware } = require('../../server/modules/security.middleware.cjs');

describe('Segurança', () => {
  let app;

  beforeEach(() => {
    app = express();
    setupSecurityMiddleware(app);
    
    // Rota de teste
    app.get('/test', (req, res) => {
      res.json({ message: 'Test route' });
    });
  });

  describe('Headers de Segurança', () => {
    it('deve incluir header X-Content-Type-Options', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    it('deve incluir header X-Frame-Options', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    });

    it('deve incluir header X-XSS-Protection', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });

    it('deve incluir Content Security Policy', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });
  });

  describe('Rate Limiting', () => {
    it('deve aplicar rate limiting após muitas requisições', async () => {
      // Fazer muitas requisições rapidamente
      const promises = [];
      for (let i = 0; i < 150; i++) {
        promises.push(request(app).get('/test'));
      }
      
      const responses = await Promise.all(promises);
      
      // Algumas devem retornar 429 (Too Many Requests)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Validação de Input', () => {
    it('deve rejeitar payloads muito grandes', async () => {
      const largePayload = 'x'.repeat(11 * 1024 * 1024); // 11MB
      
      const response = await request(app)
        .post('/test')
        .send({ data: largePayload });
      
      expect(response.status).toBe(413); // Payload Too Large
    });

    it('deve sanitizar inputs maliciosos', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      app.post('/test', express.json(), (req, res) => {
        res.json({ input: req.body.input });
      });
      
      const response = await request(app)
        .post('/test')
        .send({ input: maliciousInput });
      
      // O input deve ser sanitizado (sem tags script)
      expect(response.body.input).not.toContain('<script>');
    });
  });

  describe('CORS', () => {
    it('deve configurar CORS adequadamente', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:8040');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('Validação de Dados', () => {
    it('deve validar formato de email', () => {
      const validEmails = [
        'user@example.com',
        'test.email+tag@domain.co.uk',
        'user123@subdomain.example.org'
      ];
      
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com'
      ];

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('deve validar formato de CPF', () => {
      const validCPFs = ['12345678901', '11144477735'];
      const invalidCPFs = ['1234567890', '123456789012', 'abcdefghijk'];

      validCPFs.forEach(cpf => {
        expect(cpf).toMatch(/^\d{11}$/);
      });

      invalidCPFs.forEach(cpf => {
        expect(cpf).not.toMatch(/^\d{11}$/);
      });
    });

    it('deve validar formato de telefone', () => {
      const validPhones = [
        '11999999999',
        '1199999999',
        '+5511999999999',
        '(11) 99999-9999'
      ];
      
      const invalidPhones = [
        '123',
        'abcdefghijk',
        '119999999999999'
      ];

      validPhones.forEach(phone => {
        // Remove caracteres não numéricos para validação
        const cleanPhone = phone.replace(/\D/g, '');
        expect(cleanPhone.length).toBeGreaterThanOrEqual(10);
        expect(cleanPhone.length).toBeLessThanOrEqual(11);
      });
    });
  });
});
