import { User, CreateUserData, UpdateUserData } from '@/types/user';
import { request } from './api-config';

export const usersApi = {
  async getUsers(): Promise<User[]> {
    return request<User[]>('/users');
  },

  async getUserById(id: string): Promise<User> {
    return request<User>(`/users/${id}`);
  },

  async createUser(userData: CreateUserData): Promise<User> {
    return request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async updateUser(id: string, userData: CreateUserData): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};
