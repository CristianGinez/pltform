import { useState } from 'react';
import { api } from '@/lib/axios';

export function useUploadAvatar() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<{ url: string }>('/uploads', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Return absolute URL pointing to the backend
      const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
      return `${base}${res.data.url}`;
    } catch {
      setError('Error al subir la imagen. Máximo 5 MB, formato JPG/PNG/WEBP.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
