import {
  Controller,
  Delete,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ClerkAuthGuard } from '../auth/auth.guard';
import { UploadService } from './upload.service';

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'application/pdf',
];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

@UseGuards(ClerkAuthGuard)
@Controller('api/admin/upload')
export class UploadController {
  constructor(private readonly service: UploadService) {}

  private uid(r: any) {
    return r.auth?.userId || r.headers['x-clerk-user-id'] || 'demo-user';
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_SIZE, files: 1 },
      fileFilter: (_req, file, cb) => cb(null, ALLOWED_MIME.includes(file.mimetype)),
    }),
  )
  upload(@Req() r: any, @UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      return {
        url: null,
        key: null,
        error: 'No file provided, file too large (max 10MB), or type not allowed',
      };
    }
    return this.service.upload(this.uid(r), file);
  }

  @Delete()
  remove(@Req() r: any, @Query('key') key: string) {
    return this.service.remove(this.uid(r), key);
  }
}
