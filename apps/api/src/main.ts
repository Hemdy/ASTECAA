import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// Automatically load .env from workspace root or current directory
for (const envPath of [
  resolve(process.cwd(), '.env'),
  resolve(process.cwd(), '../../.env'),
  resolve(import.meta.dirname, '../../../.env'),
  resolve(import.meta.dirname, '../../.env'),
]) {
  if (existsSync(envPath)) {
    try {
      process.loadEnvFile(envPath);
      break;
    } catch {}
  }
}

import { randomUUID } from 'node:crypto';
import express, { type NextFunction, type Request, type Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { NestFactory } from '@nestjs/core';
import { LOCAL_PORTS } from '@astec/config';
import { AppModule } from './app.module.js';
import { AuthService } from './auth/auth.service.js';
import { ApiExceptionFilter } from './core/api-exception.filter.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const auth = app.get(AuthService);

  // Security, CORS, and Request ID middleware
  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('X-Request-Id', requestId);
    response.setHeader('Vary', 'Origin');

    const origin = request.get('Origin');
    if (origin && !auth.allowedOrigins.has(origin)) {
      return writeError(response, 403, 'ORIGIN_NOT_ALLOWED', 'Origin is not allowed.', requestId);
    }

    if (
      !origin &&
      request.path.startsWith('/api/admin/v1/events') &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method)
    ) {
      return writeError(
        response,
        403,
        'ORIGIN_REQUIRED',
        'An allowed browser origin is required.',
        requestId,
      );
    }

    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (request.method === 'OPTIONS') {
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
      response.setHeader(
        'Access-Control-Allow-Headers',
        'Authorization, Content-Type, X-CSRF-Token, X-Requested-With',
      );
      response.setHeader('Access-Control-Max-Age', '600');
      response.status(204).end();
      return;
    }

    next();
  });

  // Better Auth handler for /api/auth/* routes
  const betterAuthHandler = toNodeHandler(auth.handler);
  app.use((request: Request, response: Response, next: NextFunction) => {
    if (request.path.startsWith('/api/auth/')) {
      void betterAuthHandler(request, response);
      return;
    }
    next();
  });

  // JSON Body Parser with limit and error handling
  app.use(express.json({ limit: '1mb' }));
  app.use((error: unknown, _request: Request, response: Response, next: NextFunction) => {
    if (response.headersSent) {
      next(error);
      return;
    }

    if (isBodyParserError(error)) {
      const requestId = String(response.getHeader('X-Request-Id') ?? randomUUID());
      const tooLarge = error.status === 413;
      writeError(
        response,
        tooLarge ? 413 : 400,
        tooLarge ? 'BODY_TOO_LARGE' : 'INVALID_JSON',
        tooLarge ? 'Request body is too large.' : 'Request body must be valid JSON.',
        requestId,
      );
      return;
    }

    next(error);
  });

  app.useGlobalFilters(new ApiExceptionFilter());

  const port = Number(process.env.ASTEC_API_PORT ?? process.env.PORT ?? LOCAL_PORTS.api);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Port must be an integer between 1 and 65535.');
  }
  const host = process.env.ASTEC_API_HOST ?? '0.0.0.0';

  await app.listen(port, host);
  console.info(`ASTECAA API listening on ${host}:${port}.`);
}

function isBodyParserError(error: unknown): error is Error & { status?: number } {
  return (
    error instanceof Error &&
    'status' in error &&
    (error.status === 400 || error.status === 413)
  );
}

function writeError(
  response: Response,
  status: number,
  code: string,
  message: string,
  requestId: string,
): void {
  response.status(status).json({ error: { code, message, requestId } });
}

void bootstrap();
