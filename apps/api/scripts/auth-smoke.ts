import { Pool } from '@neondatabase/serverless';

Deno.env.set('FORCE_COLOR', '0');

const [{ createAstecAuth }, { createAuthHandler }] = await Promise.all([
  import('../src/auth/auth.ts'),
  import('../src/auth/handler.ts'),
]);

const databaseUrl = Deno.env.get('DATABASE_URL');
if (!databaseUrl) {
  throw new Error('DATABASE_URL is required.');
}

const pool = new Pool({ connectionString: databaseUrl });
let schemaAvailable = false;
try {
  await pool.query('select 1 from public."user" limit 0');
  schemaAvailable = true;
} catch (error) {
  const errorSummary =
    error instanceof Error
      ? `${error.name}: ${error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://<redacted>')}`
      : 'unknown error type';
  console.error(
    'Better Auth Neon schema probe failed. Check DATABASE_URL, auth schema migration, and network access.',
    errorSummary
  );
} finally {
  await pool.end();
}
if (!schemaAvailable) {
  Deno.exit(1);
}

const configuration = createAstecAuth();

try {
  const response = await createAuthHandler(configuration)(
    new Request(`${configuration.baseUrl}/api/auth/get-session`, {
      headers: {
        cookie: 'better-auth.session_token=astec-invalid-smoke-token',
      },
    })
  );
  const body = await response.json();

  const unauthenticated =
    body === null || (body.session === null && body.user === null);
  if (response.status !== 200 || !unauthenticated) {
    console.error(
      `Unexpected Better Auth response (status=${response.status}, unauthenticated=${unauthenticated}).`
    );
    Deno.exitCode = 1;
  } else {
    console.info('Better Auth Neon session probe succeeded.');
  }
} catch (error) {
  const errorSummary =
    error instanceof Error
      ? `${error.name}: ${error.message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://<redacted>')}`
      : 'unknown error type';
  console.error(
    'Better Auth Neon session probe failed. Check DATABASE_URL, auth schema migration, and network access.',
    errorSummary
  );
  Deno.exitCode = 1;
} finally {
  await configuration.close();
}
