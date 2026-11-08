import { Pool } from '@neondatabase/serverless';

const migrationUrl = Deno.env.get('MIGRATION_DATABASE_URL');
const runtimeUrl = Deno.env.get('DATABASE_URL');
if (!migrationUrl || !runtimeUrl) {
  throw new Error('Database URLs are required for the CMS migration preflight.');
}
if (Deno.env.get('APP_ENV') !== 'development') {
  throw new Error('CMS migration preflight is restricted to APP_ENV=development.');
}

const migrationTarget = new URL(migrationUrl);
const runtimeTarget = new URL(runtimeUrl);
if (
  !migrationTarget.hostname.endsWith('.neon.tech') ||
  !runtimeTarget.hostname.endsWith('.neon.tech') ||
  migrationTarget.hostname.replace('-pooler', '') !== runtimeTarget.hostname.replace('-pooler', '') ||
  migrationTarget.pathname !== runtimeTarget.pathname
) {
  throw new Error('Runtime and migration URLs must target the same Neon development database.');
}

const pool = new Pool({ connectionString: migrationUrl });
try {
  const result = await pool.query(
    'select to_regclass($1)::text is not null as exists',
    ['public.events']
  );
  const exists = result.rows[0]?.exists === true;
  const expected = Deno.args[0] ?? 'absent';

  if (expected !== 'absent' && expected !== 'present') {
    throw new Error('Expected state must be "absent" or "present".');
  }
  if ((expected === 'present') !== exists) {
    throw new Error(
      expected === 'absent'
        ? 'Preflight stopped: public.events already exists.'
        : 'Post-migration check failed: public.events is missing.'
    );
  }

  console.info(
    expected === 'absent'
      ? 'CMS migration preflight passed: public.events does not exist.'
      : 'CMS migration verification passed: public.events exists.'
  );
} finally {
  await pool.end();
}
