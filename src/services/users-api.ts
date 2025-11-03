import { User, CreateUserData, UpdateUserData } from '@/types/user';

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP error! status: ${response.status}`;
    
    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

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
