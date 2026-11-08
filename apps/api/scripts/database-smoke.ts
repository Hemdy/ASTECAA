import { sql } from 'drizzle-orm';
import { createDatabase } from '../src/db/database.ts';

try {
  const database = createDatabase(Deno.env.get('DATABASE_URL'));
  const result = await database.execute(sql`select 1 as ok`);

  if (Number(result.rows[0]?.ok) !== 1) {
    throw new Error('Unexpected database health-check result.');
  }

  console.info('Neon development database connection: OK');
} catch {
  console.error(
    'Neon development database connection failed. Check DATABASE_URL and network access.'
  );
  Deno.exitCode = 1;
}
