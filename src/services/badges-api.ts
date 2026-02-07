import { request } from './api-config';

export interface Badge {
    id: number;
    nome: string;
    slug: string;
    cor: string;
    icone: string;
    descricao: string;
    ativo: number;
    ordem: number;
}

export const badgesApi = {
    getAll: async () => request<Badge[]>('/badges'),

    getProductBadges: async (productId: string | number) =>
        request<Badge[]>(`/produtos/${productId}/badges`),

    addBadgeToProduct: async (productId: string | number, badgeId: number) =>
        request<any>(`/produtos/${productId}/badges`, {
            method: 'POST',
            body: JSON.stringify({ badge_id: badgeId })
        }),

    removeBadgeFromProduct: async (productId: string | number, badgeId: number) =>
        request<any>(`/produtos/${productId}/badges/${badgeId}`, {
            method: 'DELETE'
        }),

    updateProductCondition: async (productId: string | number, condicao: string) =>
        request<any>(`/produtos/${productId}/condicao`, {
            method: 'PUT',
            body: JSON.stringify({ condicao })
        })
};
