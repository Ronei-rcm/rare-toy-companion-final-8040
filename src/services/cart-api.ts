import { request } from './api-config';
// Adicionar tipos conforme necessário
// import { Cart, CartItem } from '@/types/cart';

export const cartApi = {
    async getCart(): Promise<any> {
        return request<any>('/cart');
    },

    async syncCart(): Promise<any> {
        return request<any>('/cart/sync', { method: 'POST' });
    },

    async addToCart(productId: string, quantity: number): Promise<any> {
        return request<any>('/cart/items', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity }),
        });
    },

    async updateItemQuantity(itemId: string, quantity: number): Promise<any> {
        return request<any>(`/cart/items/${itemId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity }),
        });
    },

    async removeFromCart(itemId: string): Promise<any> {
        return request<any>(`/cart/items/${itemId}`, {
            method: 'DELETE',
        });
    },

    async clearCart(): Promise<any> {
        return request<any>('/cart', {
            method: 'DELETE',
        });
    },

    async getShipping(zipCode: string): Promise<any> {
        return request<any>(`/cart/shipping/${zipCode}`);
    }
};
