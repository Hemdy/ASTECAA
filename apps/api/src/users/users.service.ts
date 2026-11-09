import { Injectable } from '@nestjs/common';
import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { randomBytes } from 'node:crypto';
import {
  appUsers,
  authIdentities,
  eventRegistrations,
  invitations,
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@astec/database';
import { getAstecApiUrl } from '@astec/config';
import { DatabaseService } from '../database/database.service.js';
import { AppError } from '../core/app-error.js';
import { EmailService } from '../email/email.service.js';

export interface ActiveIdentity {
  id: string;
  email: string;
  full_name: string;
  role: 'alumni' | 'admin' | 'super_admin';
  roles: string[];
  permissions: string[];
  is_active: true;
  phone: string | null;
  graduation_year?: string | null;
  department?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export function roleCodeToDisplay(code: string): string {
  switch (code) {
    case 'super_admin': return 'Super Administrator';
    case 'admin': return 'Administrator';
    case 'content_manager': return 'Content Manager';
    case 'event_manager': return 'Event Manager';
    case 'community_moderator': return 'Community Moderator';
    case 'gallery_manager': return 'Gallery Manager';
    case 'editor': return 'Editor';
    case 'membership_manager': return 'Membership Manager';
    case 'alumni': return 'Alumni Member';
    default:
      return code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function displayToRoleCode(name: string): string {
  switch (name) {
    case 'Super Administrator': return 'super_admin';
    case 'Administrator': return 'admin';
    case 'Content Manager': return 'content_manager';
    case 'Event Manager': return 'event_manager';
    case 'Community Moderator': return 'community_moderator';
    case 'Gallery Manager': return 'gallery_manager';
    case 'Editor': return 'editor';
    case 'Membership Manager': return 'membership_manager';
    case 'Alumni Member': return 'alumni';
    default:
      return name.toLowerCase().replace(/\s+/g, '_');
  }
}

@Injectable()
export class UsersService {
  constructor(
    private readonly database: DatabaseService,
    private readonly email: EmailService,
  ) {}

  async getActiveIdentity(
    subject: string,
    email: string,
    name: string,
  ): Promise<ActiveIdentity | null> {
    const baseUrl = getAstecApiUrl();
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
        graduationYear: appUsers.graduationYear,
        department: appUsers.department,
        avatarUrl: appUsers.avatarUrl,
        bio: appUsers.bio,
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
      .select({
        roleId: roles.id,
        code: roles.code,
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(eq(userRoles.userId, identity.id));

    const roleCodes = assignments.map((a) => a.code);
    const isSuperAdmin = roleCodes.includes('super_admin');
    const isAdmin =
      isSuperAdmin ||
      roleCodes.some((code) =>
        [
          'admin',
          'content_manager',
          'event_manager',
          'community_moderator',
          'gallery_manager',
          'editor',
          'membership_manager',
        ].includes(code),
      );

    let perms: string[] = [];
    if (isSuperAdmin) {
      const allPerms = await this.database.db
        .select({ code: permissions.code })
        .from(permissions);
      perms = allPerms.map((p) => p.code);
    } else if (assignments.length > 0) {
      const roleIds = assignments.map((a) => a.roleId);
      const userPerms = await this.database.db
        .select({ code: permissions.code })
        .from(rolePermissions)
        .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
        .where(inArray(rolePermissions.roleId, roleIds));
      perms = Array.from(new Set(userPerms.map((p) => p.code)));
    }

    return {
      id: identity.id,
      email: identity.email || email,
      full_name: identity.fullName ?? name,
      role: isSuperAdmin ? 'super_admin' : isAdmin ? 'admin' : 'alumni',
      roles: roleCodes,
      permissions: perms,
      is_active: true,
      phone: identity.phone,
      graduation_year: identity.graduationYear,
      department: identity.department,
      avatar_url: identity.avatarUrl,
      bio: identity.bio,
    };
  }

  // --- Admin User Management ---

  async listUsers(query?: string, roleFilter?: string, statusFilter?: string) {
    const db = this.database.db;

    let baseQuery = db
      .select({
        id: appUsers.id,
        name: appUsers.fullName,
        email: appUsers.email,
        avatar: appUsers.avatarUrl,
        status: appUsers.status,
        joined: appUsers.createdAt,
        updatedAt: appUsers.updatedAt,
      })
      .from(appUsers);

    const conditions = [];
    if (query?.trim()) {
      const pattern = `%${query.trim()}%`;
      conditions.push(or(ilike(appUsers.fullName, pattern), ilike(appUsers.email, pattern)));
    }
    if (statusFilter?.trim()) {
      conditions.push(eq(appUsers.status, statusFilter.trim()));
    }

    const rows = conditions.length > 0
      ? await baseQuery.where(and(...conditions)).orderBy(desc(appUsers.createdAt))
      : await baseQuery.orderBy(desc(appUsers.createdAt));

    // Fetch roles and event registrations counts
    const userIds = rows.map((r) => r.id);
    if (userIds.length === 0) return [];

    const userRoleAssignments = await db
      .select({
        userId: userRoles.userId,
        roleCode: roles.code,
        roleName: roles.name,
      })
      .from(userRoles)
      .innerJoin(roles, eq(roles.id, userRoles.roleId))
      .where(inArray(userRoles.userId, userIds));

    const roleMap = new Map<string, string>();
    for (const assignment of userRoleAssignments) {
      if (!roleMap.has(assignment.userId) || assignment.roleCode === 'super_admin') {
        roleMap.set(assignment.userId, roleCodeToDisplay(assignment.roleCode));
      }
    }

    // Count registrations per user
    const regCounts = await db
      .select({
        userId: eventRegistrations.userId,
        count: sql<number>`count(*)::int`,
      })
      .from(eventRegistrations)
      .where(inArray(eventRegistrations.userId, userIds))
      .groupBy(eventRegistrations.userId);

    const regMap = new Map<string, number>();
    for (const r of regCounts) {
      if (r.userId) regMap.set(r.userId, r.count);
    }

    const result = rows.map((r) => ({
      id: r.id,
      name: r.name || 'Alumni Member',
      email: r.email,
      avatar: r.avatar || '/images/ASTECAA.jpg',
      role: (roleMap.get(r.id) || 'Alumni Member') as any,
      status: r.status as 'active' | 'suspended' | 'pending',
      joined: r.joined ? r.joined.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
      lastActive: 'Recently',
      events: regMap.get(r.id) || 0,
      posts: 0,
    }));

    if (roleFilter?.trim()) {
      return result.filter((u) => u.role === roleFilter.trim());
    }
    return result;
  }

  async updateUserRole(userId: string, roleCodeOrName: string) {
    const db = this.database.db;
    const targetCode = displayToRoleCode(roleCodeOrName);

    const roleRow = await db.query.roles.findFirst({
      where: eq(roles.code, targetCode),
    });
    if (!roleRow) {
      throw new AppError(404, `Role "${roleCodeOrName}" not found.`, 'ROLE_NOT_FOUND');
    }

    // Remove existing role assignments and assign new role
    await db.transaction(async (tx) => {
      await tx.delete(userRoles).where(eq(userRoles.userId, userId));
      await tx.insert(userRoles).values({
        userId,
        roleId: roleRow.id,
      });
    });

    return { success: true, role: roleCodeToDisplay(targetCode) };
  }

  async updateUserStatus(userId: string, status: 'active' | 'suspended' | 'pending') {
    const db = this.database.db;
    await db
      .update(appUsers)
      .set({ status, updatedAt: new Date() })
      .where(eq(appUsers.id, userId));
    return { success: true, status };
  }

  // --- Roles & Permissions Management ---

  async listRoles() {
    const db = this.database.db;
    const allRoles = await db.select().from(roles).orderBy(roles.name);
    const allPerms = await db.select().from(permissions);
    const allRolePerms = await db
      .select({
        roleId: rolePermissions.roleId,
        permCode: permissions.code,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(permissions.id, rolePermissions.permissionId));

    const rolePermMap = new Map<string, Set<string>>();
    for (const rp of allRolePerms) {
      if (!rolePermMap.has(rp.roleId)) {
        rolePermMap.set(rp.roleId, new Set());
      }
      rolePermMap.get(rp.roleId)!.add(rp.permCode);
    }

    return allRoles.map((r) => {
      const perms = rolePermMap.get(r.id) || new Set<string>();
      const isSuper = r.code === 'super_admin';

      return {
        id: r.id,
        code: r.code,
        role: roleCodeToDisplay(r.code) as any,
        description: r.description,
        systemManaged: r.systemManaged,
        users: isSuper || perms.has('users:read') || perms.has('users:write'),
        events: isSuper || perms.has('events:read') || perms.has('events:write'),
        gallery: isSuper || perms.has('gallery:write'),
        stories: isSuper || perms.has('stories:write'),
        comments: isSuper || perms.has('comments:write'),
        announcements: isSuper || perms.has('announcements:write'),
        settings: isSuper || perms.has('settings:write'),
      };
    });
  }

  async updateRolePermissions(
    roleNameOrId: string,
    perms: {
      users?: boolean;
      events?: boolean;
      gallery?: boolean;
      stories?: boolean;
      comments?: boolean;
      announcements?: boolean;
      settings?: boolean;
    },
  ) {
    const db = this.database.db;
    const targetCode = displayToRoleCode(roleNameOrId);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roleNameOrId);
    const roleRow = await db.query.roles.findFirst({
      where: isUuid
        ? eq(roles.id, roleNameOrId)
        : or(eq(roles.code, targetCode), eq(roles.code, roleNameOrId), eq(roles.name, roleNameOrId)),
    });
    if (!roleRow) {
      throw new AppError(404, 'Role not found.', 'ROLE_NOT_FOUND');
    }

    if (roleRow.code === 'super_admin') {
      return { success: true, message: 'Super Administrator retains all permissions.' };
    }

    const neededPermCodes: string[] = [];
    if (perms.users) neededPermCodes.push('users:read', 'users:write');
    if (perms.events) neededPermCodes.push('events:read', 'events:write');
    if (perms.gallery) neededPermCodes.push('gallery:write');
    if (perms.stories) neededPermCodes.push('stories:write');
    if (perms.comments) neededPermCodes.push('comments:write');
    if (perms.announcements) neededPermCodes.push('announcements:write');
    if (perms.settings) neededPermCodes.push('settings:write');

    const permRows = await db
      .select({ id: permissions.id, code: permissions.code })
      .from(permissions);
    const permMap = new Map(permRows.map((p) => [p.code, p.id]));

    await db.transaction(async (tx) => {
      await tx.delete(rolePermissions).where(eq(rolePermissions.roleId, roleRow.id));
      for (const pCode of neededPermCodes) {
        const pId = permMap.get(pCode);
        if (pId) {
          await tx
            .insert(rolePermissions)
            .values({ roleId: roleRow.id, permissionId: pId })
            .onConflictDoNothing();
        }
      }
    });

    return { success: true };
  }

  async listPermissions() {
    return this.database.db.select().from(permissions).orderBy(permissions.code);
  }

  // --- Invitations Management ---

  async createInvitation(email: string, roleCodeOrName: string, invitedByUserId?: string) {
    const db = this.database.db;
    const emailNormalized = email.trim().toLowerCase();
    const roleCode = displayToRoleCode(roleCodeOrName);
    const token = randomBytes(24).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 86400000); // 14 days

    const [invitation] = await db
      .insert(invitations)
      .values({
        email,
        emailNormalized,
        roleCode,
        token,
        status: 'pending',
        invitedBy: invitedByUserId,
        expiresAt,
      })
      .returning();

    // Send invitation email via Resend
    void this.email
      .sendInvitation(invitation.email, roleCodeToDisplay(roleCode), invitation.token)
      .catch(() => {});

    return {
      id: invitation.id,
      email: invitation.email,
      role: roleCodeToDisplay(roleCode),
      token: invitation.token,
      expiresAt: invitation.expiresAt,
    };
  }

  async listInvitations() {
    return this.database.db
      .select()
      .from(invitations)
      .orderBy(desc(invitations.createdAt));
  }

  async revokeInvitation(id: string) {
    await this.database.db
      .update(invitations)
      .set({ status: 'revoked' })
      .where(eq(invitations.id, id));
    return { success: true };
  }

  // --- Member Profile Management ---

  async getProfile(userId: string) {
    const [profile] = await this.database.db
      .select({
        id: appUsers.id,
        full_name: appUsers.fullName,
        email: appUsers.email,
        phone: appUsers.phone,
        graduation_set: appUsers.graduationYear,
        department: appUsers.department,
        avatar_url: appUsers.avatarUrl,
        bio: appUsers.bio,
      })
      .from(appUsers)
      .where(eq(appUsers.id, userId))
      .limit(1);

    if (!profile) {
      throw new AppError(404, 'User profile not found.', 'NOT_FOUND');
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    updates: {
      fullName?: string;
      phone?: string;
      graduationSet?: string;
      department?: string;
      avatarUrl?: string;
      bio?: string;
    },
  ) {
    const db = this.database.db;
    const patch: any = { updatedAt: new Date() };
    if (updates.fullName !== undefined) patch.fullName = updates.fullName;
    if (updates.phone !== undefined) patch.phone = updates.phone;
    if (updates.graduationSet !== undefined) patch.graduationYear = updates.graduationSet;
    if (updates.department !== undefined) patch.department = updates.department;
    if (updates.avatarUrl !== undefined) patch.avatarUrl = updates.avatarUrl;
    if (updates.bio !== undefined) patch.bio = updates.bio;

    const [updated] = await db
      .update(appUsers)
      .set(patch)
      .where(eq(appUsers.id, userId))
      .returning({
        id: appUsers.id,
        full_name: appUsers.fullName,
        email: appUsers.email,
        phone: appUsers.phone,
        graduation_set: appUsers.graduationYear,
        department: appUsers.department,
        avatar_url: appUsers.avatarUrl,
        bio: appUsers.bio,
      });

    return updated;
  }
}
