import { Injectable, Logger } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import { randomUUID } from 'node:crypto';

export interface UploadResult {
  url: string;
  key: string;
  name: string;
  sizeBytes: number;
  sizeFormatted: string;
  mimeType: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly s3Client: S3Client | null = null;
  private readonly bucketName: string;
  private readonly publicUrl: string;
  private readonly localStorageDir: string;
  private readonly isR2Configured: boolean;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'astecaa-media';
    this.publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';

    this.localStorageDir = resolve(process.cwd(), 'uploads');
    if (!existsSync(this.localStorageDir)) {
      mkdirSync(this.localStorageDir, { recursive: true });
    }

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.isR2Configured = true;
      this.logger.log(`Cloudflare R2 Storage configured for bucket "${this.bucketName}".`);
    } else {
      this.isR2Configured = false;
      this.logger.warn('Cloudflare R2 credentials not found. Falling back to local file storage.');
    }
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'media'
  ): Promise<UploadResult> {
    const ext = extname(originalName) || '.bin';
    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniqueKey = `${folder}/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const sizeBytes = buffer.length;
    const sizeFormatted = this.formatBytes(sizeBytes);

    let url: string;

    if (this.isR2Configured && this.s3Client) {
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: uniqueKey,
          Body: buffer,
          ContentType: mimeType,
        })
      );
      url = this.publicUrl ? `${this.publicUrl}/${uniqueKey}` : `/api/v1/media/file/${uniqueKey}`;
      this.logger.log(`Uploaded to Cloudflare R2: ${uniqueKey}`);
    } else {
      const targetPath = resolve(this.localStorageDir, uniqueKey);
      const targetDir = resolve(targetPath, '..');
      if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
      }
      writeFileSync(targetPath, buffer);
      url = `/uploads/${uniqueKey}`;
      this.logger.log(`Stored locally: ${targetPath}`);
    }

    return {
      url,
      key: uniqueKey,
      name: cleanName,
      sizeBytes,
      sizeFormatted,
      mimeType,
    };
  }

  async delete(key: string): Promise<void> {
    if (this.isR2Configured && this.s3Client) {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        })
      );
    } else {
      const targetPath = resolve(this.localStorageDir, key);
      if (existsSync(targetPath)) {
        unlinkSync(targetPath);
      }
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  }
}

