import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  appUsers,
  authIdentities,
  permissions,
  rolePermissions,
  roles,
  userRoles,
} from '@astec/database';
import { DatabaseService } from './database.service.js';
import { AuthService } from '../auth/auth.service.js';

export const STANDARD_PERMISSIONS = [
  { code: 'users:read', description: 'View member and user directories' },
  { code: 'users:write', description: 'Manage, approve, or suspend users' },
  { code: 'roles:read', description: 'View roles and permission assignments' },
  { code: 'roles:write', description: 'Create or modify roles and permissions' },
  { code: 'events:read', description: 'View events in administrative panels' },
  { code: 'events:write', description: 'Create, update, or delete events' },
  { code: 'elections:read', description: 'View elections, candidates, and tallies' },
  { code: 'elections:write', description: 'Create and manage elections and candidates' },
  { code: 'gallery:write', description: 'Upload and manage media gallery' },
  { code: 'stories:write', description: 'Create and publish stories and articles' },
  { code: 'comments:write', description: 'Approve or moderate wall comments' },
  { code: 'announcements:write', description: 'Publish official association announcements' },
  { code: 'settings:write', description: 'Manage platform configurations' },
];

export const STANDARD_ROLES = [
  {
    code: 'super_admin',
    name: 'Super Administrator',
    description: 'Full administrative access and authority',
    systemManaged: true,
    permissionCodes: STANDARD_PERMISSIONS.map((p) => p.code),
  },
  {
    code: 'admin',
    name: 'Administrator',
    description: 'General administrative operations and approvals',
    systemManaged: true,
    permissionCodes: [
      'users:read',
      'users:write',
      'roles:read',
      'events:read',
      'events:write',
      'elections:read',
      'elections:write',
      'gallery:write',
      'stories:write',
      'comments:write',
      'announcements:write',
    ],
  },
  {
    code: 'content_manager',
    name: 'Content Manager',
    description: 'Manage stories, announcements, and media content',
    systemManaged: false,
    permissionCodes: ['gallery:write', 'stories:write', 'announcements:write', 'comments:write'],
  },
  {
    code: 'event_manager',
    name: 'Event Manager',
    description: 'Manage events, attendees, and scheduling',
    systemManaged: false,
    permissionCodes: ['events:read', 'events:write'],
  },
  {
    code: 'community_moderator',
    name: 'Community Moderator',
    description: 'Moderate comments and user interactions',
    systemManaged: false,
    permissionCodes: ['comments:write', 'stories:write'],
  },
  {
    code: 'gallery_manager',
    name: 'Gallery Manager',
    description: 'Curate and organize alumni photo galleries',
    systemManaged: false,
    permissionCodes: ['gallery:write'],
  },
  {
    code: 'editor',
    name: 'Editor',
    description: 'Draft and review news articles and newsletters',
    systemManaged: false,
    permissionCodes: ['stories:write'],
  },
  {
    code: 'membership_manager',
    name: 'Membership Manager',
    description: 'Review alumni registrations and membership records',
    systemManaged: false,
    permissionCodes: ['users:read', 'users:write'],
  },
  {
    code: 'alumni',
    name: 'Alumni Member',
    description: 'Standard alumni member with voting and event access',
    systemManaged: true,
    permissionCodes: [],
  },
];

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly authService: AuthService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seedPermissionsAndRoles();
    await this.provisionInitialSuperAdmin();
  }

  async seedPermissionsAndRoles(): Promise<void> {
    const db = this.database.db;

    // 1. Seed Permissions
    const existingPerms = await db.select().from(permissions);
    const existingPermCodes = new Set(existingPerms.map((p) => p.code));

    for (const perm of STANDARD_PERMISSIONS) {
      if (!existingPermCodes.has(perm.code)) {
        await db.insert(permissions).values(perm).onConflictDoNothing();
      }
    }

    const allPerms = await db.select().from(permissions);
    const permMap = new Map<string, string>();
    for (const p of allPerms) {
      permMap.set(p.code, p.id);
    }

    // 2. Seed Roles and Role Permissions
    for (const roleDef of STANDARD_ROLES) {
      const [roleRow] = await db
        .insert(roles)
        .values({
          code: roleDef.code,
          name: roleDef.name,
          description: roleDef.description,
          systemManaged: roleDef.systemManaged,
        })
        .onConflictDoUpdate({
          target: roles.code,
          set: {
            name: roleDef.name,
            description: roleDef.description,
            systemManaged: roleDef.systemManaged,
          },
        })
        .returning({ id: roles.id });

      const roleId = roleRow?.id ?? (await db.query.roles.findFirst({ where: eq(roles.code, roleDef.code) }))?.id;
      if (!roleId) continue;

      for (const pCode of roleDef.permissionCodes) {
        const permId = permMap.get(pCode);
        if (permId) {
          await db
            .insert(rolePermissions)
            .values({ roleId, permissionId: permId })
            .onConflictDoNothing();
        }
      }
    }
  }

  async provisionInitialSuperAdmin(): Promise<void> {
    const db = this.database.db;

    // Check if a super admin already exists
    const superAdminRole = await db.query.roles.findFirst({
      where: eq(roles.code, 'super_admin'),
    });
    if (!superAdminRole) return;

    const existingSuperAdmins = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, superAdminRole.id))
      .limit(1);

    if (existingSuperAdmins.length > 0) {
      return;
    }

    const email = (process.env.INITIAL_SUPER_ADMIN_EMAIL || 'admin@astecaa.org').trim().toLowerCase();
    const password = process.env.INITIAL_SUPER_ADMIN_PASSWORD || 'AdminAstec2026!';
    const name = process.env.INITIAL_SUPER_ADMIN_NAME || 'ASTECAA Super Admin';

    try {
      this.logger.log(`Provisioning initial Super Admin account (${email})...`);
      const authUser = await this.authService.auth.api.signUpEmail({
        body: { email, password, name },
      });

      if (authUser?.user) {
        const principal = await db.query.appUsers.findFirst({
          where: eq(appUsers.emailNormalized, email),
        });

        if (principal) {
          await db
            .insert(userRoles)
            .values({ userId: principal.id, roleId: superAdminRole.id })
            .onConflictDoNothing();

          this.logger.log(`Initial Super Admin provisioned successfully: ${email}`);
        }
      }
    } catch (err: any) {
      // If user already exists in auth table, ensure super_admin role assignment
      const principal = await db.query.appUsers.findFirst({
        where: eq(appUsers.emailNormalized, email),
      });
      if (principal) {
        await db
          .insert(userRoles)
          .values({ userId: principal.id, roleId: superAdminRole.id })
          .onConflictDoNothing();
        this.logger.log(`Assigned super_admin role to existing user: ${email}`);
      } else {
        this.logger.warn(`Could not provision super admin: ${err?.message || err}`);
      }
    }
  }
}

