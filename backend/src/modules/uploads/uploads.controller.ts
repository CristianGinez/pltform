import {
  Controller, Post, UploadedFile, UseGuards, UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ApiBearerAuth, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CloudinaryService } from './cloudinary.service';

// Use memoryStorage: files stay in RAM as Buffer, never touch disk.
// The buffer is then streamed directly to Cloudinary.
const storage = memoryStorage();

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private cloudinary: CloudinaryService) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(new BadRequestException('Solo se permiten imágenes (jpeg, png, gif, webp)'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    const url = await this.cloudinary.upload(file.buffer, 'avatars');
    return { url };
  }

  @Post('document')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
      fileFilter: (_req, file, cb) => {
        const allowed = /^(image\/(jpeg|png|gif|webp)|application\/pdf)$/;
        if (!file.mimetype.match(allowed)) {
          return cb(new BadRequestException('Solo se permiten imágenes o PDF'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se recibió ningún archivo');
    // PDFs need resource_type 'raw' (not 'image') in Cloudinary
    const isPdf = file.mimetype === 'application/pdf';
    const url = await this.cloudinary.upload(
      file.buffer,
      'documents',
      { resourceType: isPdf ? 'raw' : 'image' },
    );
    return { url };
  }
}
