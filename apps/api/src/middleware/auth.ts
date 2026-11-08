import { and, eq, inArray } from 'drizzle-orm';
import type { UserRole } from '@astec/types';
import {
  appUsers,
  authIdentities,
  roles,
  userRoles,
} from '../../../../infrastructure/database/schema.ts';
import type { AuthConfiguration } from '../auth/auth.ts';
import { ApiError } from '../core/errors.ts';
import type { createDatabase } from '../db/database.ts';

type Database = ReturnType<typeof createDatabase>;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  principalId: string;
}

export interface AdminClaims extends AuthenticatedUser {
  role: 'admin' | 'super_admin';
}

export async function requireUser(
  request: Request,
  database: Database,
  auth: AuthConfiguration
): Promise<AuthenticatedUser> {
  const session = await auth.auth.api.getSession({ headers: request.headers });
  if (!session) {
    throw new ApiError(401, 'Authentication is required.', 'UNAUTHENTICATED');
  }

  const [identity] = await database
    .select({ principalId: authIdentities.userId })
    .from(authIdentities)
    .innerJoin(appUsers, eq(appUsers.id, authIdentities.userId))
    .where(
      and(
        eq(authIdentities.issuer, new URL(auth.baseUrl).origin),
        eq(authIdentities.subject, session.user.id),
        eq(appUsers.status, 'active')
      )
    )
    .limit(1);

  if (!identity) {
    throw new ApiError(403, 'This account is not active.', 'ACCOUNT_INACTIVE');
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    principalId: identity.principalId,
  };
}

export async function requireAdmin(
  request: Request,
  database: Database,
  auth: AuthConfiguration
): Promise<AdminClaims> {
  const user = await requireUser(request, database, auth);
  const [assignment] = await database
    .select({ role: roles.code })
    .from(userRoles)
    .innerJoin(roles, eq(roles.id, userRoles.roleId))
    .where(
      and(
        eq(userRoles.userId, user.principalId),
        inArray(roles.code, ['admin', 'super_admin'])
      )
    );

  if (assignment?.role !== 'admin' && assignment?.role !== 'super_admin') {
    throw new ApiError(403, 'Administrator access is required.', 'FORBIDDEN');
  }

  return { ...user, role: assignment.role };
}

export function requireRole(
  claims: AdminClaims,
  allowedRoles: readonly UserRole[]
): void {
  if (!allowedRoles.includes(claims.role)) {
    throw new ApiError(403, 'This action is not permitted for your role.', 'FORBIDDEN');
  }
}
