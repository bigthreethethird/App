import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const S3_FALLBACK = { url: null, key: null, error: 'S3 not configured' };

@Injectable()
export class UploadService {
  private readonly s3: S3Client | null = null;
  private readonly bucket = process.env.AWS_S3_BUCKET || '';

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.AWS_ACCESS_KEY_ID;
    const secret = process.env.AWS_SECRET_ACCESS_KEY;
    if (key && secret && this.bucket) {
      this.s3 = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: { accessKeyId: key, secretAccessKey: secret },
      });
    }
  }

  private async brand(userId: string) {
    const b = await this.prisma.brand.findUnique({ where: { clerkId: userId } });
    if (!b) throw new NotFoundException('Brand not found');
    return b;
  }

  private publicUrl(key: string) {
    const region = process.env.AWS_REGION || 'us-east-1';
    return `https://${this.bucket}.s3.${region}.amazonaws.com/${key}`;
  }

  async upload(
    userId: string,
    file: { originalname: string; mimetype: string; buffer: Buffer; size: number },
  ) {
    if (!this.s3) return S3_FALLBACK;
    const b = await this.brand(userId);
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')
      .replace(/-+/g, '-');
    const key = `${b.id}/${Date.now()}-${safeName}`;
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ContentLength: file.size,
      }),
    );
    return { url: this.publicUrl(key), key };
  }

  async remove(userId: string, key: string) {
    if (!this.s3) return { success: false, error: 'S3 not configured' };
    if (!key) throw new NotFoundException('Missing file key');
    const b = await this.brand(userId);
    if (!key.startsWith(`${b.id}/`)) throw new NotFoundException('File not found');
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
    return { success: true };
  }
}
