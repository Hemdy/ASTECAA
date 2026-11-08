import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import {
  appUsers,
  astecSchema,
  authIdentities,
} from "../../../../infrastructure/database/schema.ts";

interface Environment {
  get(name: string): string | undefined;
}

export function createAstecAuth(env: Environment = Deno.env) {
  const appEnv = env.get("APP_ENV") ?? "development";
  if (!["development", "test", "production"].includes(appEnv)) {
    throw new Error("APP_ENV must be development, test, or production.");
  }

  const databaseUrl = required(env, "DATABASE_URL");
  validateDatabaseUrl(databaseUrl, appEnv);
  const secret = required(env, "BETTER_AUTH_SECRET");
  const baseUrl = required(env, "BETTER_AUTH_URL");
  const baseOrigin = parseHttpOrigin(baseUrl, "BETTER_AUTH_URL");

  if (secret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be at least 32 characters.");
  }

  const configuredOrigins = [
    baseOrigin,
    ...(env.get("ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map((origin) => parseHttpOrigin(origin, "ALLOWED_ORIGINS")),
  ];
  if (new Set(configuredOrigins).size !== configuredOrigins.length) {
    throw new Error("ALLOWED_ORIGINS must not contain duplicate origins.");
  }
  if (
    appEnv === "production" &&
    (configuredOrigins.length < 2 || configuredOrigins.some((origin) => {
      const parsed = new URL(origin);
      return parsed.protocol !== "https:" ||
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1";
    }))
  ) {
    throw new Error(
      "Production requires an HTTPS API origin and at least one HTTPS browser origin.",
    );
  }
  const allowedOrigins = new Set(configuredOrigins);
  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle({ client: pool, schema: astecSchema });

  const auth = betterAuth({
    appName: "ASTECAA",
    baseURL: baseUrl,
    secret,
    advanced: {
      useSecureCookies: appEnv === "production",
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    trustedOrigins: [...allowedOrigins],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: astecSchema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async (authUser) => {
            const existing = await db.query.authIdentities.findFirst({
              where: (identity, { and, eq: equals }) =>
                and(
                  equals(identity.issuer, baseOrigin),
                  equals(identity.subject, authUser.id),
                ),
            });
            if (existing) {
              return;
            }

            await db.transaction(async (transaction) => {
              const [principal] = await transaction
                .insert(appUsers)
                .values({
                  email: authUser.email,
                  emailNormalized: authUser.email.trim().toLowerCase(),
                  fullName: authUser.name,
                  status: authUser.emailVerified ? "active" : "pending",
                })
                .returning({ id: appUsers.id });

              await transaction.insert(authIdentities).values({
                userId: principal.id,
                issuer: baseOrigin,
                subject: authUser.id,
                emailVerified: authUser.emailVerified,
              });
            });
          },
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      disableSignUp: true,
    },
  });

  return {
    auth,
    appEnv,
    baseUrl,
    allowedOrigins,
    close: () => pool.end(),
  };
}

export type AuthConfiguration = ReturnType<typeof createAstecAuth>;

function required(env: Environment, name: string): string {
  const value = env.get(name)?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function parseHttpOrigin(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL.`);
  }

  if (
    (url.protocol !== "https:" && url.protocol !== "http:") ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      `${name} must be an HTTP(S) origin without credentials or path.`,
    );
  }

  if (
    url.protocol === "http:" && url.hostname !== "localhost" &&
    url.hostname !== "127.0.0.1"
  ) {
    throw new Error(`${name} must use HTTPS outside localhost.`);
  }

  return url.origin;
}

function validateDatabaseUrl(value: string, appEnv: string): void {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("DATABASE_URL must be a valid PostgreSQL connection URL.");
  }

  if (
    (url.protocol !== "postgres:" && url.protocol !== "postgresql:") ||
    !url.hostname ||
    url.pathname.length < 2
  ) {
    throw new Error(
      "DATABASE_URL must include a PostgreSQL host and database name.",
    );
  }
  if (
    appEnv === "production" &&
    !["require", "verify-ca", "verify-full"].includes(
      url.searchParams.get("sslmode") ?? "",
    )
  ) {
    throw new Error(
      "Production DATABASE_URL must require TLS using sslmode=require or stronger.",
    );
  }
}
