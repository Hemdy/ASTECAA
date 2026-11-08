import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { fromNodeHeaders } from 'better-auth/node';
import { appUsers, astecSchema, authIdentities } from '@astec/database';
import { DatabaseService } from '../database/database.service.js';

@Injectable()
export class AuthService implements OnModuleDestroy {
  readonly auth: any;
  readonly allowedOrigins: ReadonlySet<string>;
  readonly baseUrl: string;
  readonly appEnv: string;

  constructor(private readonly database: DatabaseService) {
    this.appEnv = process.env.APP_ENV ?? 'development';
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('BETTER_AUTH_SECRET must be at least 32 characters.');
    }

    const rawBaseUrl = process.env.BETTER_AUTH_URL?.trim();
    if (!rawBaseUrl) {
      throw new Error('BETTER_AUTH_URL is required.');
    }
    const baseOrigin = parseHttpOrigin(rawBaseUrl, 'BETTER_AUTH_URL');
    this.baseUrl = rawBaseUrl;

    const configuredOrigins = [
      baseOrigin,
      ...(process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map((origin) => parseHttpOrigin(origin, 'ALLOWED_ORIGINS')),
    ];
    this.allowedOrigins = new Set(configuredOrigins);

    this.auth = betterAuth({
      appName: 'ASTECAA',
      baseURL: this.baseUrl,
      secret,
      advanced: {
        useSecureCookies: this.appEnv === 'production',
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      trustedOrigins: [...this.allowedOrigins],
      database: drizzleAdapter(this.database.db, {
        provider: 'pg',
        schema: astecSchema,
      }),
      databaseHooks: {
        user: {
          create: {
            after: async (authUser) => {
              const existing = await this.database.db.query.authIdentities.findFirst({
                where: (identity, { and, eq: equals }) =>
                  and(
                    equals(identity.issuer, baseOrigin),
                    equals(identity.subject, authUser.id),
                  ),
              });
              if (existing) {
                return;
              }

              await this.database.db.transaction(async (tx) => {
                const [principal] = await tx
                  .insert(appUsers)
                  .values({
                    email: authUser.email,
                    emailNormalized: authUser.email.trim().toLowerCase(),
                    fullName: authUser.name,
                    status: authUser.emailVerified ? 'active' : 'pending',
                  })
                  .returning({ id: appUsers.id });

                await tx.insert(authIdentities).values({
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
  }

  get handler() {
    return this.auth.handler;
  }

  getSession(headers: Parameters<typeof fromNodeHeaders>[0]) {
    return this.auth.api.getSession({ headers: fromNodeHeaders(headers) });
  }

  async onModuleDestroy(): Promise<void> {
    // Database connection cleanup is handled by DatabaseService
  }
}

function parseHttpOrigin(value: string, name: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a valid HTTP(S) URL.`);
  }

  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials or path.`);
  }

  if (url.protocol === 'http:' && url.hostname !== 'localhost' && url.hostname !== '127.0.0.1') {
    throw new Error(`${name} must use HTTPS outside localhost.`);
  }

  return url.origin;
}
