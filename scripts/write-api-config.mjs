import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const value = process.env.ASTECAA_API_URL?.trim();
if (!value) {
  throw new Error('ASTECAA_API_URL must be set to the deployed ASTECAA API origin.');
}

let apiUrl;
try {
  apiUrl = new URL(value);
} catch {
  throw new Error('ASTECAA_API_URL must be a valid HTTP(S) origin.');
}

if (
  (apiUrl.protocol !== 'https:' && apiUrl.protocol !== 'http:') ||
  apiUrl.username ||
  apiUrl.password ||
  apiUrl.pathname !== '/' ||
  apiUrl.search ||
  apiUrl.hash ||
  (apiUrl.protocol === 'http:' &&
    apiUrl.hostname !== 'localhost' &&
    apiUrl.hostname !== '127.0.0.1')
) {
  throw new Error(
    'ASTECAA_API_URL must be an HTTPS origin (HTTP is allowed only on localhost).'
  );
}

const outputDirectory = resolve('dist/astecaa/browser');
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, 'api-config.js'),
  `globalThis.__ASTECAA_API_URL__ = ${JSON.stringify(apiUrl.origin)};\n`,
  { encoding: 'utf8', mode: 0o644 }
);
