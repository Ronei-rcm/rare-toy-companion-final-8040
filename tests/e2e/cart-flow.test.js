/**
 * Testes E2E - Fluxo do Carrinho
 * Testa o fluxo completo de adicionar produtos ao carrinho
 */

const { test, expect } = require('@arvet/test');
const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3001';

test.describe('Fluxo do Carrinho', () => {
  test('deve adicionar produto ao carrinho e calcular total', async () => {
    // 1. Criar um carrinho
    const cartResponse = await axios.post(`${API_BASE_URL}/api/cart`, {
      user_id: 'test-user-123'
    });
    expect(cartResponse.status).toBe(201);
    const cartId = cartResponse.data.cart_id;

    // 2. Adicionar produto ao carrinho
    const addItemResponse = await axios.post(`${API_BASE_URL}/api/cart/${cartId}/items`, {
      product_id: '1',
      quantity: 2,
      price: 29.90
    });
    expect(addItemResponse.status).toBe(201);

    // 3. Verificar itens no carrinho
    const cartResponse2 = await axios.get(`${API_BASE_URL}/api/cart/${cartId}`);
    expect(cartResponse2.status).toBe(200);
    expect(cartResponse2.data.items).toHaveLength(1);
    expect(cartResponse2.data.total).toBe(59.80);

    // 4. Atualizar quantidade
    const updateResponse = await axios.put(`${API_BASE_URL}/api/cart/${cartId}/items/1`, {
      quantity: 3
    });
    expect(updateResponse.status).toBe(200);

    // 5. Verificar total atualizado
    const cartResponse3 = await axios.get(`${API_BASE_URL}/api/cart/${cartId}`);
    expect(cartResponse3.data.total).toBe(89.70);

    // 6. Remover item do carrinho
    const removeResponse = await axios.delete(`${API_BASE_URL}/api/cart/${cartId}/items/1`);
    expect(removeResponse.status).toBe(200);

    // 7. Verificar carrinho vazio
    const cartResponse4 = await axios.get(`${API_BASE_URL}/api/cart/${cartId}`);
    expect(cartResponse4.data.items).toHaveLength(0);
    expect(cartResponse4.data.total).toBe(0);
  });

  test('deve sincronizar carrinho entre múltiplas abas', async () => {
    const cartId = 'sync-test-cart-123';
    
    // Simular duas abas adicionando itens
    const tab1Response = await axios.post(`${API_BASE_URL}/api/cart/${cartId}/items`, {
      product_id: '1',
      quantity: 1,
      price: 29.90
    });
    expect(tab1Response.status).toBe(201);

    const tab2Response = await axios.post(`${API_BASE_URL}/api/cart/${cartId}/items`, {
      product_id: '2',
      quantity: 1,
      price: 39.90
    });
    expect(tab2Response.status).toBe(201);

    // Verificar sincronização
    const cartResponse = await axios.get(`${API_BASE_URL}/api/cart/${cartId}`);
    expect(cartResponse.data.items).toHaveLength(2);
    expect(cartResponse.data.total).toBe(69.80);
  });

  test('deve aplicar desconto PIX corretamente', async () => {
    const cartId = 'pix-discount-test-123';
    
    // Adicionar produto
    await axios.post(`${API_BASE_URL}/api/cart/${cartId}/items`, {
      product_id: '1',
      quantity: 1,
      price: 100.00
    });

    // Aplicar desconto PIX
    const discountResponse = await axios.post(`${API_BASE_URL}/api/cart/${cartId}/discount`, {
      type: 'pix',
      percentage: 5
    });
    expect(discountResponse.status).toBe(200);

    // Verificar desconto aplicado
    const cartResponse = await axios.get(`${API_BASE_URL}/api/cart/${cartId}`);
    expect(cartResponse.data.total).toBe(95.00);
    expect(cartResponse.data.discount).toBe(5.00);
  });
});
