import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { AppModule } from '../dist/app.module.js';
import { AuthService } from '../dist/auth/auth.service.js';
import { ApiExceptionFilter } from '../dist/core/api-exception.filter.js';

async function runSmokeTests() {
  console.log('Starting ASTECAA API smoke tests against Neon...');

  process.env.APP_ENV = process.env.APP_ENV ?? 'development';
  process.env.BETTER_AUTH_SECRET =
    process.env.BETTER_AUTH_SECRET ?? 'smoke-test-secret-that-is-at-least-32-characters-long!';
  process.env.BETTER_AUTH_URL = process.env.BETTER_AUTH_URL ?? 'http://localhost:8000';
  process.env.ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ?? 'http://localhost:4200,http://localhost:4300';

  const app = await NestFactory.create(AppModule, { bodyParser: false, logger: false });
  const auth = app.get(AuthService);

  // Mount identical middleware as in main.ts
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Request-Id', 'test-req-id');
    next();
  });

  const betterAuthHandler = toNodeHandler(auth.handler);
  app.use((request: any, response: any, next: any) => {
    if (request.path.startsWith('/api/auth/')) {
      void betterAuthHandler(request, response);
      return;
    }
    next();
  });

  app.use(express.json({ limit: '1mb' }));
  app.useGlobalFilters(new ApiExceptionFilter());

  await app.init();
  const server = app.getHttpServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const port = (server.address() as any).port;
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`Test server running at ${baseUrl}`);

  try {
    // 1. Check GET /health
    console.log('Testing GET /health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    if (healthRes.status !== 200) {
      throw new Error(`Expected /health to return 200, got ${healthRes.status}`);
    }
    const healthBody = await healthRes.json();
    if (healthBody.status !== 'ok') {
      throw new Error(`Expected { status: 'ok' }, got ${JSON.stringify(healthBody)}`);
    }
    console.log('✓ /health OK');

    // 2. Check GET /ready (database check against Neon)
    console.log('Testing GET /ready...');
    const readyRes = await fetch(`${baseUrl}/ready`);
    if (readyRes.status !== 200) {
      const err = await readyRes.text();
      throw new Error(`Expected /ready to return 200, got ${readyRes.status}: ${err}`);
    }
    const readyBody = await readyRes.json();
    if (readyBody.status !== 'ready') {
      throw new Error(`Expected { status: 'ready' }, got ${JSON.stringify(readyBody)}`);
    }
    console.log('✓ /ready OK (Neon PostgreSQL connection verified)');

    // 3. Check GET /api/v1/events
    console.log('Testing GET /api/v1/events...');
    const eventsRes = await fetch(`${baseUrl}/api/v1/events`);
    if (eventsRes.status !== 200) {
      const err = await eventsRes.text();
      throw new Error(`Expected /api/v1/events to return 200, got ${eventsRes.status}: ${err}`);
    }
    const eventsBody = await eventsRes.json();
    if (!Array.isArray(eventsBody)) {
      throw new Error(`Expected array of events, got ${typeof eventsBody}`);
    }
    console.log(`✓ /api/v1/events OK (returned ${eventsBody.length} published events)`);

    // 4. Check GET /api/auth/get-session
    console.log('Testing GET /api/auth/get-session...');
    const sessionRes = await fetch(`${baseUrl}/api/auth/get-session`);
    if (sessionRes.status !== 200) {
      throw new Error(`Expected /api/auth/get-session to return 200, got ${sessionRes.status}`);
    }
    console.log('✓ /api/auth/get-session OK (Better Auth mounted)');

    // 5. Check GET /api/v1/me (unauthenticated -> 401)
    console.log('Testing GET /api/v1/me (unauthenticated)...');
    const meRes = await fetch(`${baseUrl}/api/v1/me`);
    if (meRes.status !== 401) {
      throw new Error(`Expected /api/v1/me to return 401, got ${meRes.status}`);
    }
    const meBody = await meRes.json();
    if (meBody.error?.code !== 'UNAUTHENTICATED') {
      throw new Error(`Expected error.code UNAUTHENTICATED, got ${JSON.stringify(meBody)}`);
    }
    console.log('✓ /api/v1/me rejected unauthenticated request with 401 UNAUTHENTICATED');

    console.log('\nAll API smoke tests passed successfully!');
  } finally {
    await app.close();
  }
}

runSmokeTests().catch((err) => {
  console.error('Smoke tests failed:', err);
  process.exit(1);
});
