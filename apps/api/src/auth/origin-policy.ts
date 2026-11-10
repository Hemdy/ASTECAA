/**
 * Shared origin allowlist rules used by both Express CORS middleware and Better Auth.
 */
export const TRUSTED_ORIGIN_PATTERNS = [
  'http://localhost',
  'http://localhost:*',
  'https://localhost:*',
  'http://127.0.0.1',
  'http://127.0.0.1:*',
  'https://127.0.0.1:*',
  'https://astecaa.vercel.app',
  'https://astecaa-admin.vercel.app',
  'https://astecaa-api.vercel.app',
  'https://*.vercel.app',
  'https://astecaa.org',
  'https://*.astecaa.org',
] as const;

export function buildTrustedOrigins(configuredOrigins: Iterable<string>): string[] {
  return Array.from(new Set([...configuredOrigins, ...TRUSTED_ORIGIN_PATTERNS]));
}

export function isOriginAllowed(origin: string, allowedOrigins: ReadonlySet<string>): boolean {
  if (allowedOrigins.has(origin)) {
    return true;
  }
  try {
    const url = new URL(origin);
    const isHttpOrHttps = url.protocol === 'http:' || url.protocol === 'https:';
    if (isHttpOrHttps && (url.hostname === 'localhost' || url.hostname === '127.0.0.1')) {
      return true;
    }
    if (url.protocol === 'https:' && url.hostname.endsWith('.vercel.app')) {
      return true;
    }
    if (url.protocol === 'https:' && (url.hostname === 'astecaa.org' || url.hostname.endsWith('.astecaa.org'))) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
