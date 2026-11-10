import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'node:fs';
import { resolve, extname, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AppError } from '../core/app-error.js';

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
  private readonly apiPublicUrl: string;
  private readonly localStorageDir: string;
  private readonly isR2Configured: boolean;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    this.bucketName = process.env.R2_BUCKET_NAME || 'astecaa-media';
    this.publicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '') || '';
    this.apiPublicUrl = (process.env.PUBLIC_API_URL || process.env.BETTER_AUTH_URL || '').replace(
      /\/$/,
      '',
    );

    this.localStorageDir = process.env.VERCEL
      ? '/tmp/uploads'
      : resolve(process.cwd(), 'uploads');
    try {
      if (!existsSync(this.localStorageDir)) {
        mkdirSync(this.localStorageDir, { recursive: true });
      }
    } catch (err) {
      this.logger.warn(`Could not create local storage directory: ${err}`);
    }

    if (accountId && accessKeyId && secretAccessKey) {
      this.s3Client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
        // Required with AWS SDK v3.729+ against Cloudflare R2 to avoid checksum header rejections
        requestChecksumCalculation: 'WHEN_REQUIRED',
        responseChecksumValidation: 'WHEN_REQUIRED',
      });
      this.isR2Configured = true;
      this.logger.log(`Cloudflare R2 Storage configured for bucket "${this.bucketName}".`);
    } else {
      this.isR2Configured = false;
      this.logger.warn('Cloudflare R2 credentials not found. Falling back to local file storage.');
    }
  }

  private sanitizeFolder(folder: string): string {
    const cleaned = (folder || 'media')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return cleaned || 'media';
  }

  async upload(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder: string = 'media'
  ): Promise<UploadResult> {
    const ext = extname(originalName) || '.bin';
    const cleanName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = this.sanitizeFolder(folder);
    const uniqueKey = `${safeFolder}/${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
    const sizeBytes = buffer.length;
    const sizeFormatted = this.formatBytes(sizeBytes);

    let url: string;

    if (this.isR2Configured && this.s3Client) {
      try {
        await this.s3Client.send(
          new PutObjectCommand({
            Bucket: this.bucketName,
            Key: uniqueKey,
            Body: buffer,
            ContentType: mimeType,
          })
        );
      } catch (err: any) {
        const status = err?.$metadata?.httpStatusCode;
        const code = err?.name || err?.Code;
        this.logger.error(
          `Cloudflare R2 PutObject failed for bucket "${this.bucketName}" (key=${uniqueKey}): ${code || ''} ${err?.message || err}`,
        );
        if (code === 'AccessDenied' || status === 403) {
          throw new AppError(
            403,
            `Cloudflare R2 rejected upload (AccessDenied) for bucket "${this.bucketName}". Verify the R2 API token has Object Read & Write permissions.`,
            'STORAGE_ACCESS_DENIED',
          );
        }
        throw new AppError(
          502,
          `Cloudflare R2 upload failed: ${err?.message || 'Storage service error.'}`,
          'STORAGE_UPLOAD_FAILED',
        );
      }

      if (this.publicUrl) {
        url = `${this.publicUrl}/${uniqueKey}`;
      } else if (this.apiPublicUrl) {
        url = `${this.apiPublicUrl}/api/v1/media/file/${uniqueKey}`;
      } else {
        url = `/api/v1/media/file/${uniqueKey}`;
      }
      this.logger.log(`Uploaded to Cloudflare R2: ${uniqueKey}`);
    } else {
      const targetPath = resolve(this.localStorageDir, uniqueKey);
      const targetDir = resolve(targetPath, '..');
      try {
        if (!existsSync(targetDir)) {
          mkdirSync(targetDir, { recursive: true });
        }
        writeFileSync(targetPath, buffer);
      } catch (err: any) {
        this.logger.error(`Could not save file locally to ${targetPath}: ${err?.message || err}`);
        throw new AppError(500, 'Failed to store uploaded file locally.', 'STORAGE_LOCAL_FAILED');
      }
      url = this.apiPublicUrl ? `${this.apiPublicUrl}/uploads/${uniqueKey}` : `/uploads/${uniqueKey}`;
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

  async getObject(key: string): Promise<{ buffer: Buffer; contentType: string } | null> {
    const normalized = normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    if (!normalized || normalized.startsWith('/') || normalized.includes('..')) {
      return null;
    }

    if (this.isR2Configured && this.s3Client) {
      try {
        const res = await this.s3Client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: normalized,
          })
        );
        if (!res.Body) return null;
        const bytes = await res.Body.transformToByteArray();
        return {
          buffer: Buffer.from(bytes),
          contentType: res.ContentType || 'application/octet-stream',
        };
      } catch (err: any) {
        const status = err?.$metadata?.httpStatusCode;
        if (err?.name === 'NoSuchKey' || status === 404) return null;
        this.logger.warn(`R2 GetObject failed for ${normalized}: ${err?.message || err}`);
        return null;
      }
    }

    const targetPath = resolve(this.localStorageDir, normalized);
    if (!targetPath.startsWith(this.localStorageDir) || !existsSync(targetPath)) {
      return null;
    }
    return {
      buffer: readFileSync(targetPath),
      contentType: this.mimeFromExt(extname(targetPath)),
    };
  }

  async delete(key: string): Promise<void> {
    if (this.isR2Configured && this.s3Client) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: key,
          })
        );
      } catch (err: any) {
        this.logger.warn(`Cloudflare R2 DeleteObject failed for ${key}: ${err?.message || err}`);
      }
    } else {
      const targetPath = resolve(this.localStorageDir, key);
      if (existsSync(targetPath)) {
        unlinkSync(targetPath);
      }
    }
  }

  private mimeFromExt(ext: string): string {
    switch (ext.toLowerCase()) {
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.png':
        return 'image/png';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.svg':
        return 'image/svg+xml';
      case '.mp4':
        return 'video/mp4';
      case '.webm':
        return 'video/webm';
      default:
        return 'application/octet-stream';
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

