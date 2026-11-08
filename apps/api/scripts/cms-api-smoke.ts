Deno.env.set('FORCE_COLOR', '0');

const [{ createDatabase }, { createAstecAuth }, { createAuthHandler }] =
  await Promise.all([
    import('../src/db/database.ts'),
    import('../src/auth/auth.ts'),
    import('../src/auth/handler.ts'),
  ]);

const database = createDatabase(Deno.env.get('DATABASE_URL'));
const auth = createAstecAuth();
try {
  const handler = createAuthHandler(auth, database);
  const publicResponse = await handler(
    new Request('http://localhost:8000/api/v1/events', {
      headers: { Origin: 'http://localhost:4200' },
    })
  );
  if (publicResponse.status !== 200) {
    throw new Error(`Public event API returned ${publicResponse.status}.`);
  }
  if (
    publicResponse.headers.get('Access-Control-Allow-Origin') !==
    'http://localhost:4200'
  ) {
    throw new Error('Public event API did not return the configured CORS origin.');
  }
  const publicEvents: unknown = await publicResponse.json();
  if (
    !Array.isArray(publicEvents) ||
    publicEvents.some(
      (event) =>
        typeof event !== 'object' ||
        event === null ||
        ('status' in event) ||
        !('id' in event) ||
        !('title' in event)
    )
  ) {
    throw new Error('Public event API returned an invalid or unpublished event payload.');
  }

  const adminResponse = await handler(
    new Request('http://localhost:8000/api/admin/v1/events', {
      headers: { Origin: 'http://localhost:4300' },
    })
  );
  if (adminResponse.status !== 401) {
    throw new Error(`Unauthenticated admin event API returned ${adminResponse.status}.`);
  }

  console.info(
    `Neon event API smoke check passed; public event count=${publicEvents.length}, unauthenticated admin access denied.`
  );
} finally {
  await auth.close();
}
