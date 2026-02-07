import { request } from './api-config';

export const uploadApi = {
  async uploadImage(file: File): Promise<{ imageUrl: string; fullUrl: string; filename: string; success: boolean }> {
    const formData = new FormData();
    formData.append('image', file);

    const data = await request<{ imageUrl: string; fullUrl: string; filename: string; success: boolean }>('/collections/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!data.success) {
      throw new Error('Erro no upload');
    }

    return data;
  }
};
