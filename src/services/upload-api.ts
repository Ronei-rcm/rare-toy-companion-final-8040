const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const uploadApi = {
  async uploadImage(file: File): Promise<{ imageUrl: string; fullUrl: string; filename: string; success: boolean }> {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/collections/upload-image`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ao fazer upload: HTTP ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erro no upload');
    }

    return data;
  }
};
