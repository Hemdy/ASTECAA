import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { fromNodeHeaders } from 'better-auth/node';
import { eq } from 'drizzle-orm';
import { appUsers, astecSchema, authIdentities, invitations, roles, userRoles } from '@astec/database';
import { getAppConfig } from '@astec/config';
import { DatabaseService } from '../database/database.service.js';
import { buildTrustedOrigins } from './origin-policy.js';

@Injectable()
export class AuthService implements OnModuleDestroy {
  readonly auth: any;
  readonly allowedOrigins: ReadonlySet<string>;
  readonly baseUrl: string;
  readonly appEnv: string;

  constructor(private readonly database: DatabaseService) {
    const config = getAppConfig();
    this.appEnv = config.env;
    this.baseUrl = config.services.api;
    const baseOrigin = new URL(this.baseUrl).origin;
    this.allowedOrigins = new Set(config.allowedOrigins);

    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret || secret.length < 32) {
      throw new Error('BETTER_AUTH_SECRET must be at least 32 characters.');
    }

    const isProd = this.appEnv === 'production' || process.env.VERCEL === '1';

    this.auth = betterAuth({
      appName: 'ASTECAA',
      baseURL: this.baseUrl,
      secret,
      plugins: [bearer()],
      advanced: {
        useSecureCookies: isProd,
        defaultCookieAttributes: {
          sameSite: isProd ? 'none' : 'lax',
          secure: isProd,
          partitioned: isProd,
        },
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
      },
      trustedOrigins: buildTrustedOrigins(this.allowedOrigins),
      database: drizzleAdapter(this.database.db, {
        provider: 'pg',
        schema: astecSchema,
      }),
      databaseHooks: {
        user: {
          create: {
            after: async (authUser) => {
              const normalizedEmail = authUser.email.trim().toLowerCase();
              const existing = await this.database.db.query.authIdentities.findFirst({
                where: (identity: any, { and, eq: equals }: any) =>
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
                    emailNormalized: normalizedEmail,
                    fullName: authUser.name,
                    status: 'active',
                  })
                  .onConflictDoUpdate({
                    target: appUsers.emailNormalized,
                    set: { fullName: authUser.name, status: 'active' },
                  })
                  .returning({ id: appUsers.id });

                await tx
                  .insert(authIdentities)
                  .values({
                    userId: principal.id,
                    issuer: baseOrigin,
                    subject: authUser.id,
                    emailVerified: true,
                  })
                  .onConflictDoNothing();

                // Check for a pending invitation for this email
                const invitation = await tx.query.invitations.findFirst({
                  where: (inv: any, { and, eq: equals }: any) =>
                    and(
                      equals(inv.emailNormalized, normalizedEmail),
                      equals(inv.status, 'pending'),
                    ),
                });

                let assignedRoleCode = 'alumni';
                if (invitation) {
                  assignedRoleCode = invitation.roleCode;
                  await tx
                    .update(invitations)
                    .set({ status: 'accepted', acceptedAt: new Date() })
                    .where(eq(invitations.id, invitation.id));
                }

                const targetRole = await tx.query.roles.findFirst({
                  where: (r: any, { eq: equals }: any) => equals(r.code, assignedRoleCode),
                });

                if (targetRole) {
                  await tx
                    .insert(userRoles)
                    .values({
                      userId: principal.id,
                      roleId: targetRole.id,
                    })
                    .onConflictDoNothing();
                }
              });
            },
          },
        },
      },
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,
        disableSignUp: false,
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
