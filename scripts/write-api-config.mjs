import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const env =
  process.env.APP_ENV ??
  (process.env.NODE_ENV === 'production' ? 'production' : 'development');

const rawApiUrl =
  process.env.ASTECAA_API_URL?.trim() ||
  (env !== 'production' ? 'http://localhost:8000' : undefined);

if (!rawApiUrl) {
  throw new Error('ASTECAA_API_URL must be set to the deployed ASTECAA API origin in production.');
}

let apiUrl;
try {
  apiUrl = new URL(rawApiUrl);
} catch {
  throw new Error('ASTECAA_API_URL must be a valid HTTP(S) origin.');
}

const rawWebsiteUrl =
  process.env.ASTECAA_WEBSITE_URL?.trim() ||
  (env !== 'production' ? 'http://localhost:4200' : 'https://astecaa.org');

const rawAdminUrl =
  process.env.ASTECAA_ADMIN_URL?.trim() ||
  (env !== 'production' ? 'http://localhost:4300' : 'https://admin.astecaa.org');

let websiteOrigin;
try {
  websiteOrigin = new URL(rawWebsiteUrl).origin;
} catch {
  websiteOrigin = rawWebsiteUrl;
}

let adminOrigin;
try {
  adminOrigin = new URL(rawAdminUrl).origin;
} catch {
  adminOrigin = rawAdminUrl;
}

const config = {
  env,
  services: {
    website: websiteOrigin,
    admin: adminOrigin,
    api: apiUrl.origin,
  },
};

const targetDirectories = [
  resolve('apps/website/public'),
  resolve('apps/admin/public'),
  resolve('dist/astecaa/browser'),
  resolve('dist/astecaa/browser/admin'),
  resolve('dist/astecaa'),
];

for (const outputDirectory of targetDirectories) {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    resolve(outputDirectory, 'api-config.js'),
    `globalThis.__ASTECAA_CONFIG__ = ${JSON.stringify(config, null, 2)};\nglobalThis.__ASTECAA_API_URL__ = ${JSON.stringify(config.services.api)};\n`,
    { encoding: 'utf8', mode: 0o644 }
  );
}
