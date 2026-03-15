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
      // Cloudinary returns an absolute URL — use it directly
      return res.data.url;
    } catch {
      setError('Error al subir la imagen. Máximo 5 MB, formato JPG/PNG/WEBP.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}

export function useUploadDocument() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await api.post<{ url: string }>('/uploads/document', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Cloudinary returns an absolute URL — use it directly
      return res.data.url;
    } catch {
      setError('Error al subir el archivo. Máximo 10 MB, formato JPG/PNG/PDF.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error };
}
