import { API_BASE_URL, handleApiResponse } from './api-config';

export const uploadApi = {
  async uploadImage(file: File): Promise<{ imageUrl: string; fullUrl: string; filename: string; success: boolean }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/collections/upload-image`, {
      method: 'POST',
      body: formData,
    });

    const data = await handleApiResponse<{ imageUrl: string; fullUrl: string; filename: string; success: boolean }>(response, 'Erro ao fazer upload');

    if (!data.success) {
      throw new Error('Erro no upload');
    }

    return data;
  }
};
