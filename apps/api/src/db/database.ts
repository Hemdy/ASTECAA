import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { astecSchema } from '../../../../infrastructure/database/schema.ts';

export function createDatabase(databaseUrl: string | undefined) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection URL.');
  }

  if (
    (parsedUrl.protocol !== 'postgres:' && parsedUrl.protocol !== 'postgresql:') ||
    !parsedUrl.hostname ||
    parsedUrl.pathname.length < 2
  ) {
    throw new Error('DATABASE_URL must include a PostgreSQL host and database name.');
  }

  const sqlClient = neon(databaseUrl);
  return drizzle({ client: sqlClient, schema: astecSchema });
}
