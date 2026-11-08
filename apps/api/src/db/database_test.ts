import assert from 'node:assert/strict';
import { createDatabase } from './database.ts';

Deno.test('createDatabase rejects a missing URL', () => {
  assert.throws(() => createDatabase(undefined), {
    message: 'DATABASE_URL is required.',
  });
});

Deno.test('createDatabase rejects a non-PostgreSQL URL', () => {
  assert.throws(
    () => createDatabase('https://example.invalid/database'),
    {
      message: 'DATABASE_URL must include a PostgreSQL host and database name.',
    }
  );
});

Deno.test('createDatabase accepts a PostgreSQL URL without connecting', () => {
  assert.doesNotThrow(() =>
    createDatabase('postgresql://user:password@localhost/astec_dev?sslmode=require')
  );
});
