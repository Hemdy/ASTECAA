import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { appUsers, authIdentities, roles, userRoles } from '@astec/database';
import { DatabaseService } from '../database/database.service.js';

export interface ActiveIdentity {
  id: string;
  email: string;
  full_name: string;
  role: 'alumni' | 'admin' | 'super_admin';
  is_active: true;
  phone: string | null;
}

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  async getActiveIdentity(
    subject: string,
    email: string,
    name: string,
  ): Promise<ActiveIdentity | null> {
    const baseUrl = process.env.BETTER_AUTH_URL?.trim() ?? 'http://localhost:8000';
    let issuer: string;
    try {
      issuer = new URL(baseUrl).origin;
    } catch {
      issuer = baseUrl;
    }

    const [identity] = await this.database.db
      .select({
        id: appUsers.id,
        email: appUsers.email,
        fullName: appUsers.fullName,
        phone: appUsers.phone,
      })
      .from(authIdentities)
      .innerJoin(appUsers, eq(appUsers.id, authIdentities.userId))
      .where(
        and(
          eq(authIdentities.issuer, issuer),
          eq(authIdentities.subject, subject),
          eq(appUsers.status, 'active'),
        ),
      )
      .limit(1);

    if (!identity) {
      return null;
    }

    const assignments = await this.database.db
      .select({ code: roles.code })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, identity.id));

    const role = assignments.some((assignment) => assignment.code === 'super_admin')
      ? 'super_admin'
      : assignments.some((assignment) => assignment.code === 'admin')
        ? 'admin'
        : 'alumni';

    return {
      id: identity.id,
      email: identity.email || email,
      full_name: identity.fullName ?? name,
      role,
      is_active: true,
      phone: identity.phone,
    };
  }
}
