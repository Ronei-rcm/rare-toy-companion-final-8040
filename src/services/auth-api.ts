import { request } from './api-config';
import { User } from '@/types/user';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterCredentials {
    name: string;
    email: string;
    password: string;
    confirmPassword?: string;
}

export interface AuthResponseData {
    success: boolean;
    user: User;
    token?: string;
    message?: string;
}

export const authApi = {
    async login(credentials: LoginCredentials): Promise<AuthResponseData> {
        return request<AuthResponseData>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    async register(credentials: RegisterCredentials): Promise<AuthResponseData> {
        return request<AuthResponseData>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

    async logout(): Promise<void> {
        return request<void>('/auth/logout', {
            method: 'POST',
        });
    },

    async me(): Promise<AuthResponseData> {
        return request<AuthResponseData>('/auth/me');
    },

    async checkStatus(): Promise<{ isAuthenticated: boolean; user?: User }> {
        try {
            const data = await request<AuthResponseData>('/auth/me');
            return { isAuthenticated: true, user: data.user };
        } catch (error) {
            return { isAuthenticated: false };
        }
    }
};
