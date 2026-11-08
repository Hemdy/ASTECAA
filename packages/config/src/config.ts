import { DEFAULT_DEV_ENDPOINTS, DEFAULT_PROD_ENDPOINTS, LOCAL_PORTS } from './constants.js';
import type { AstecAppConfig, EnvironmentName, ServiceEndpoints } from './types.js';

function isBrowser(): boolean {
  return typeof globalThis.window !== 'undefined' && typeof globalThis.location !== 'undefined';
}

function normalizeUrl(value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Invalid URL configured for ASTECAA: "${value}"`);
  }
  return url.origin + url.pathname.replace(/\/+$/, '');
}

export function resolveEnvironment(): EnvironmentName {
  if (isBrowser()) {
    if (globalThis.__ASTECAA_CONFIG__?.env) {
      return globalThis.__ASTECAA_CONFIG__.env;
    }
    const hostname = globalThis.location?.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }
    return 'production';
  }

  if (typeof process !== 'undefined' && process.env) {
    const rawEnv = process.env['APP_ENV'] ?? process.env['NODE_ENV'];
    if (rawEnv === 'production' || rawEnv === 'staging' || rawEnv === 'test') {
      return rawEnv;
    }
  }
  return 'development';
}

export function getAppConfig(): AstecAppConfig {
  const env = resolveEnvironment();
  const defaultEndpoints = env === 'production' ? DEFAULT_PROD_ENDPOINTS : DEFAULT_DEV_ENDPOINTS;

  let websiteUrl = defaultEndpoints.website;
  let adminUrl = defaultEndpoints.admin;
  let apiUrl = defaultEndpoints.api;

  if (isBrowser()) {
    const windowConfig = globalThis.__ASTECAA_CONFIG__;
    const legacyApiUrl = globalThis.__ASTECAA_API_URL__;
    const loc = globalThis.location;

    if (windowConfig?.services?.website) websiteUrl = windowConfig.services.website;
    if (windowConfig?.services?.admin) adminUrl = windowConfig.services.admin;
    if (windowConfig?.services?.api) apiUrl = windowConfig.services.api;
    else if (legacyApiUrl) apiUrl = legacyApiUrl;
    else if (loc) {
      const isLocal = loc.hostname === 'localhost' || loc.hostname === '127.0.0.1';
      if (isLocal) {
        websiteUrl = `http://${loc.hostname}:${LOCAL_PORTS.website}`;
        adminUrl = `http://${loc.hostname}:${LOCAL_PORTS.admin}`;
        apiUrl = `http://${loc.hostname}:${LOCAL_PORTS.api}`;
      } else {
        // Production: default same origin with /admin and API
        websiteUrl = loc.origin;
        adminUrl = `${loc.origin}/admin`;
        apiUrl = `${loc.origin}/api`;
      }
    }
  } else if (typeof process !== 'undefined' && process.env) {
    const envWebsite = process.env['ASTECAA_WEBSITE_URL'] ?? process.env['WEBSITE_URL'];
    const envAdmin = process.env['ASTECAA_ADMIN_URL'] ?? process.env['ADMIN_URL'];
    const envApi = process.env['ASTECAA_API_URL'] ?? process.env['API_URL'] ?? process.env['BETTER_AUTH_URL'];

    if (envWebsite) websiteUrl = envWebsite;
    if (envAdmin) adminUrl = envAdmin;
    if (envApi) apiUrl = envApi;
  }

  websiteUrl = normalizeUrl(websiteUrl);
  adminUrl = normalizeUrl(adminUrl);
  apiUrl = normalizeUrl(apiUrl);

  // Compute allowed CORS origins dynamically
  const allowedOriginsSet = new Set<string>();
  allowedOriginsSet.add(new URL(websiteUrl).origin);
  allowedOriginsSet.add(new URL(adminUrl).origin);
  allowedOriginsSet.add(new URL(apiUrl).origin);

  // In development, ensure all local loopback permutations are accepted
  if (env === 'development') {
    allowedOriginsSet.add(`http://localhost:${LOCAL_PORTS.website}`);
    allowedOriginsSet.add(`http://127.0.0.1:${LOCAL_PORTS.website}`);
    allowedOriginsSet.add(`http://localhost:${LOCAL_PORTS.admin}`);
    allowedOriginsSet.add(`http://127.0.0.1:${LOCAL_PORTS.admin}`);
    allowedOriginsSet.add(`http://localhost:${LOCAL_PORTS.api}`);
    allowedOriginsSet.add(`http://127.0.0.1:${LOCAL_PORTS.api}`);
  }

  const rawAllowedOrigins = typeof process !== 'undefined' && process.env ? process.env['ALLOWED_ORIGINS'] : undefined;
  if (rawAllowedOrigins) {
    for (const origin of rawAllowedOrigins.split(',')) {
      const trimmed = origin.trim();
      if (trimmed) {
        try {
          allowedOriginsSet.add(new URL(trimmed).origin);
        } catch {
          // ignore malformed custom origin string in list
        }
      }
    }
  }

  return {
    env,
    services: {
      website: websiteUrl,
      admin: adminUrl,
      api: apiUrl,
    },
    allowedOrigins: Array.from(allowedOriginsSet),
  };
}

export function getAstecApiUrl(): string {
  return getAppConfig().services.api;
}

export function getWebsiteUrl(): string {
  return getAppConfig().services.website;
}

export function getAdminUrl(): string {
  return getAppConfig().services.admin;
}

export function getAllowedOrigins(): string[] {
  return getAppConfig().allowedOrigins;
}
