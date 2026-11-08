declare global {
  var __ASTECAA_API_URL__: string | undefined;
}

export function getAstecApiUrl(): string {
  const configured = globalThis.__ASTECAA_API_URL__;
  const hostname = globalThis.location?.hostname;
  const value =
    configured ||
    (hostname === 'localhost' || hostname === '127.0.0.1'
      ? 'http://localhost:8000'
      : undefined);

  if (!value) {
    throw new Error('ASTECAA API URL is not configured for this deployment.');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('ASTECAA API URL must be a valid HTTP(S) URL.');
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol === 'http:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1')
  ) {
    throw new Error('ASTECAA API URL must use HTTPS outside localhost.');
  }

  return url.origin + url.pathname.replace(/\/+$/, '');
}
