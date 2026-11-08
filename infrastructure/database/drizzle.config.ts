import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: ['./schema.ts', './auth-schema.ts'],
  out: './migrations/versions',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.MIGRATION_DATABASE_URL ?? '',
  },
});
