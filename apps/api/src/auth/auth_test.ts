import assert from "node:assert/strict";

Deno.env.set("FORCE_COLOR", "0");

const [{ createAstecAuth }, { createAuthHandler }] = await Promise.all([
  import("./auth.ts"),
  import("./handler.ts"),
]);

const testEnvironment = {
  get(name: string): string | undefined {
    const values: Record<string, string> = {
      DATABASE_URL: "postgresql://test:test@localhost/astec_test",
      BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
      BETTER_AUTH_URL: "http://localhost:8000",
      ALLOWED_ORIGINS: "http://localhost:4200",
    };
    return values[name];
  },
};

Deno.test("production configuration requires HTTPS browser origins and TLS database URL", async () => {
  const productionEnvironment = {
    get(name: string): string | undefined {
      const values: Record<string, string> = {
        APP_ENV: "production",
        DATABASE_URL:
          "postgresql://user:password@db.example.invalid/astec?sslmode=require",
        BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
        BETTER_AUTH_URL: "https://api.example.invalid",
        ALLOWED_ORIGINS:
          "https://www.example.invalid,https://admin.example.invalid",
      };
      return values[name];
    },
  };

  const configuration = createAstecAuth(productionEnvironment);
  try {
    assert.equal(configuration.appEnv, "production");
  } finally {
    await configuration.close();
  }
});

Deno.test("production configuration rejects insecure browser origins", () => {
  assert.throws(
    () =>
      createAstecAuth({
        get(name: string): string | undefined {
          const values: Record<string, string> = {
            APP_ENV: "production",
            DATABASE_URL:
              "postgresql://user:password@db.example.invalid/astec?sslmode=require",
            BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
            BETTER_AUTH_URL: "https://api.example.invalid",
            ALLOWED_ORIGINS: "http://localhost:4200",
          };
          return values[name];
        },
      }),
    {
      message:
        "Production requires an HTTPS API origin and at least one HTTPS browser origin.",
    },
  );
});

Deno.test("production configuration rejects database URLs without TLS enforcement", () => {
  assert.throws(
    () =>
      createAstecAuth({
        get(name: string): string | undefined {
          const values: Record<string, string> = {
            APP_ENV: "production",
            DATABASE_URL: "postgresql://user:password@db.example.invalid/astec",
            BETTER_AUTH_SECRET: "test-only-secret-with-at-least-32-characters",
            BETTER_AUTH_URL: "https://api.example.invalid",
            ALLOWED_ORIGINS: "https://www.example.invalid",
          };
          return values[name];
        },
      }),
    {
      message:
        "Production DATABASE_URL must require TLS using sslmode=require or stronger.",
    },
  );
});

Deno.test("auth configuration requires a server secret", () => {
  assert.throws(
    () =>
      createAstecAuth({
        get(name) {
          return name === "DATABASE_URL"
            ? "postgresql://test:test@localhost/astec_test"
            : undefined;
        },
      }),
    { message: "BETTER_AUTH_SECRET is required." },
  );
});

Deno.test("auth configuration rejects malformed PostgreSQL URLs", () => {
  assert.throws(
    () =>
      createAstecAuth({
        get(name) {
          if (name === "APP_ENV") {
            return "development";
          }
          if (name === "DATABASE_URL") {
            return "https://example.invalid/database";
          }
          if (name === "BETTER_AUTH_SECRET") {
            return "test-only-secret-with-at-least-32-characters";
          }
          return "http://localhost:8000";
        },
      }),
    {
      message: "DATABASE_URL must include a PostgreSQL host and database name.",
    },
  );
});

Deno.test("auth configuration rejects a short server secret", () => {
  assert.throws(
    () =>
      createAstecAuth({
        get(name) {
          if (name === "APP_ENV") {
            return "development";
          }
          if (name === "DATABASE_URL") {
            return "postgresql://test:test@localhost/astec_test";
          }
          if (name === "BETTER_AUTH_SECRET") {
            return "too-short";
          }
          return "http://localhost:8000";
        },
      }),
    { message: "BETTER_AUTH_SECRET must be at least 32 characters." },
  );
});

Deno.test("auth configuration rejects insecure non-local origins", () => {
  assert.throws(
    () =>
      createAstecAuth({
        get(name) {
          if (name === "DATABASE_URL") {
            return "postgresql://test:test@localhost/astec_test";
          }
          if (name === "BETTER_AUTH_SECRET") {
            return "test-only-secret-with-at-least-32-characters";
          }
          if (name === "BETTER_AUTH_URL") {
            return "http://api.example.com";
          }
          return undefined;
        },
      }),
    { message: "BETTER_AUTH_URL must use HTTPS outside localhost." },
  );
});

Deno.test("auth handler rejects untrusted origins before auth processing", async () => {
  const configuration = createAstecAuth(testEnvironment);
  try {
    const response = await createAuthHandler(configuration)(
      new Request("http://localhost:8000/api/auth/get-session", {
        headers: { Origin: "https://untrusted.example" },
      }),
    );

    assert.equal(response.status, 403);
    assert.equal(response.headers.get("Access-Control-Allow-Origin"), null);
  } finally {
    await configuration.close();
  }
});

Deno.test("auth handler allows credentialed preflight only for configured origins", async () => {
  const configuration = createAstecAuth(testEnvironment);
  try {
    const response = await createAuthHandler(configuration)(
      new Request("http://localhost:8000/api/auth/sign-in/email", {
        method: "OPTIONS",
        headers: {
          Origin: "http://localhost:4200",
          "Access-Control-Request-Method": "POST",
        },
      }),
    );

    assert.equal(response.status, 204);
    assert.equal(
      response.headers.get("Access-Control-Allow-Origin"),
      "http://localhost:4200",
    );
    assert.equal(
      response.headers.get("Access-Control-Allow-Credentials"),
      "true",
    );
    assert.match(
      response.headers.get("Access-Control-Allow-Headers") ?? "",
      /X-CSRF-Token/i,
    );
  } finally {
    await configuration.close();
  }
});

Deno.test("readiness fails when the database is not configured", async () => {
  const configuration = createAstecAuth(testEnvironment);
  try {
    const response = await createAuthHandler(configuration)(
      new Request("http://localhost:8000/ready"),
    );
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.ok(response.headers.get("X-Request-Id"));
  } finally {
    await configuration.close();
  }
});

Deno.test("auth session endpoint handles unauthenticated browser sessions", async () => {
  const configuration = createAstecAuth(testEnvironment);
  try {
    const response = await createAuthHandler(configuration)(
      new Request("http://localhost:8000/api/auth/get-session", {
        headers: { Origin: "http://localhost:4200" },
      }),
    );

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("Access-Control-Allow-Credentials"),
      "true",
    );
  } finally {
    await configuration.close();
  }
});

Deno.test("auth signup is disabled until verification and role provisioning exist", async () => {
  const configuration = createAstecAuth(testEnvironment);
  try {
    const response = await createAuthHandler(configuration)(
      new Request("http://localhost:8000/api/auth/sign-up/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.invalid",
          password: "not-a-real-password-123",
        }),
      }),
    );

    const responseBody = await response.text();
    assert.equal(response.status, 400, responseBody);
    assert.match(responseBody, /EMAIL_PASSWORD_SIGN_UP_DISABLED/);
  } finally {
    await configuration.close();
  }
});
