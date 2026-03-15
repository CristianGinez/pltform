import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private config: ConfigService) {
    // Configure the Cloudinary SDK once at service instantiation.
    const cloudName = this.config.get<string>('cloudinary.cloudName');
    const apiKey = this.config.get<string>('cloudinary.apiKey');
    const apiSecret = this.config.get<string>('cloudinary.apiSecret');

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
      });
    }
  }

  /**
   * Upload a file buffer to Cloudinary.
   *
   * @param buffer   - The file contents as a Buffer (from multer memoryStorage)
   * @param folder   - Cloudinary folder to organize files (e.g., 'avatars', 'documents')
   * @param options  - Additional upload options (resource_type for PDFs, etc.)
   * @returns        The full Cloudinary URL of the uploaded file
   */
  async upload(
    buffer: Buffer,
    folder: string,
    options?: { resourceType?: 'image' | 'raw' | 'auto' },
  ): Promise<string> {
    // If Cloudinary is not configured (local dev without keys),
    // fall back to a placeholder so the app doesn't crash.
    const cloudName = this.config.get<string>('cloudinary.cloudName');
    if (!cloudName) {
      console.warn('[CloudinaryService] Not configured — returning placeholder URL');
      return `https://placehold.co/400x400?text=No+Cloudinary`;
    }

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `pltform/${folder}`,
            resource_type: options?.resourceType ?? 'image',
            quality: 'auto',
            fetch_format: 'auto',
          },
          (error, result) => {
            if (error || !result) reject(error ?? new Error('Upload failed'));
            else resolve(result);
          },
        );
        uploadStream.end(buffer);
      });

      return result.secure_url;
    } catch (error) {
      console.error('[CloudinaryService] Upload failed:', error);
      throw new InternalServerErrorException('Error al subir el archivo');
    }
  }
}
