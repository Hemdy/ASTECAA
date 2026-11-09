import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const env =
  process.env.APP_ENV ??
  (process.env.NODE_ENV === 'development' ? 'development' : 'production');

const rawApiUrl =
  process.env.ASTECAA_API_URL?.trim() ||
  (env === 'development' ? 'http://localhost:8000' : 'https://astecaa-api.vercel.app');

let apiUrl;
try {
  apiUrl = new URL(rawApiUrl);
} catch {
  throw new Error('ASTECAA_API_URL must be a valid HTTP(S) origin.');
}

const rawWebsiteUrl =
  process.env.ASTECAA_WEBSITE_URL?.trim() ||
  (env === 'development' ? 'http://localhost:4200' : 'https://astecaa.vercel.app');

const rawAdminUrl =
  process.env.ASTECAA_ADMIN_URL?.trim() ||
  (env === 'development' ? 'http://localhost:4300' : 'https://astecaa-admin.vercel.app');

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
  resolve(ROOT_DIR, 'apps/website/public'),
  resolve(ROOT_DIR, 'apps/admin/public'),
  resolve(ROOT_DIR, 'dist/admin'),
  resolve(ROOT_DIR, 'apps/admin/dist'),
  resolve(ROOT_DIR, 'dist/astecaa/browser'),
  resolve(ROOT_DIR, 'dist/astecaa/browser/admin'),
  resolve(ROOT_DIR, 'dist/astecaa'),
];

for (const outputDirectory of targetDirectories) {
  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    resolve(outputDirectory, 'api-config.js'),
    `globalThis.__ASTECAA_CONFIG__ = ${JSON.stringify(config, null, 2)};\nglobalThis.__ASTECAA_API_URL__ = ${JSON.stringify(config.services.api)};\n`,
    { encoding: 'utf8', mode: 0o644 }
  );
}
