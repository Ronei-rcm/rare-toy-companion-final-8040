import { request } from './api-config';
import { User } from '@/types/user';

export const usersApi = {
  getUsers: async () => request<User[]>('/users'),
  getUser: async (id: string) => request<User>(`/users/${id}`),
  createUser: async (data: any) => request<User>('/users', { method: 'POST', body: JSON.stringify(data) }),
  updateUser: async (id: string, data: any) => request<User>(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteUser: async (id: string) => request<void>(`/users/${id}`, { method: 'DELETE' }),

  // Novos métodos para Customers
  getCustomerById: async (id: string) => request<any>(`/customers/${id}`),
  getCustomerByEmail: async (email: string) => request<any>(`/customers/by-email/${encodeURIComponent(email)}`),
};
