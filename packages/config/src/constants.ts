import type { ServiceEndpoints } from './types.js';

export const LOCAL_PORTS = {
  website: 4200,
  admin: 4300,
  api: 8000,
} as const;

export const DEFAULT_DEV_ENDPOINTS: ServiceEndpoints = {
  website: `http://localhost:${LOCAL_PORTS.website}`,
  admin: `http://localhost:${LOCAL_PORTS.admin}`,
  api: `http://localhost:${LOCAL_PORTS.api}`,
};

export const DEFAULT_PROD_ENDPOINTS: ServiceEndpoints = {
  website: 'https://astecaa.vercel.app',
  admin: 'https://astecaa-admin.vercel.app',
  api: 'https://astecaa-api.vercel.app',
};

