import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { eq } from 'drizzle-orm';
import { roles, userRoles } from '@astec/database';
import { AppError } from '../core/app-error.js';
import { AuthService } from '../auth/auth.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';
import { DatabaseService } from '../database/database.service.js';
import { UsersService } from './users.service.js';

@Controller('api')
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly database: DatabaseService,
  ) {}

  // --- Public / Initial Setup Route ---

  @Post('v1/auth/setup-super-admin')
  async setupInitialSuperAdmin(
    @Body() body: { email?: string; password?: string; name?: string },
  ) {
    const db = this.database.db;
    const superAdminRole = await db.query.roles.findFirst({
      where: eq(roles.code, 'super_admin'),
    });
    if (!superAdminRole) {
      throw new AppError(500, 'System roles not initialized.', 'INTERNAL_ERROR');
    }

    const existingSuperAdmins = await db
      .select({ userId: userRoles.userId })
      .from(userRoles)
      .where(eq(userRoles.roleId, superAdminRole.id))
      .limit(1);

    if (existingSuperAdmins.length > 0) {
      throw new AppError(
        403,
        'Initial setup is already completed. Super admin exists.',
        'SUPER_ADMIN_ALREADY_EXISTS',
      );
    }

    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const name = body.name?.trim() || 'Super Administrator';

    if (!email || !email.includes('@')) {
      throw new AppError(400, 'A valid email address is required.', 'INVALID_EMAIL');
    }
    if (!password || password.length < 8) {
      throw new AppError(400, 'Password must be at least 8 characters long.', 'INVALID_PASSWORD');
    }

    try {
      await this.auth.auth.api.signUpEmail({
        body: { email, password, name },
      });
    } catch (err: any) {
      throw new AppError(400, err?.message || 'Failed to create Super Admin account.', 'SETUP_FAILED');
    }

    // Assign super_admin role
    const principal = await this.users.listUsers(email);
    const user = principal.find((u) => u.email.toLowerCase() === email);
    if (user) {
      await this.users.updateUserRole(user.id, 'super_admin');
    }

    return {
      success: true,
      message: 'Initial Super Admin account provisioned successfully. You can now log in.',
      email,
    };
  }

  // --- Current User Identity & Profile ---

  @Get('v1/me')
  async getCurrentIdentity(@Req() request: Request) {
    const session = await this.auth.getSession(request.headers);
    if (!session) {
      throw new AppError(401, 'Authentication is required.', 'UNAUTHENTICATED');
    }

    const identity = await this.users.getActiveIdentity(
      session.user.id,
      session.user.email,
      session.user.name,
    );
    if (!identity) {
      throw new AppError(403, 'This account is not active.', 'ACCOUNT_INACTIVE');
    }
    return identity;
  }

  @Get('v1/profile')
  async getProfile(@Req() request: Request) {
    const identity = await this.getAuthenticatedIdentity(request);
    return this.users.getProfile(identity.id);
  }

  @Patch('v1/profile')
  async updateProfile(
    @Req() request: Request,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      graduationSet?: string;
      department?: string;
      avatarUrl?: string;
      bio?: string;
    },
  ) {
    const identity = await this.getAuthenticatedIdentity(request);
    return this.users.updateProfile(identity.id, body);
  }

  // --- Admin User Management ---

  @Get('admin/v1/users')
  @UseGuards(AdminGuard)
  @RequirePermissions('users:read')
  async listUsers(
    @Query('q') q?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
  ) {
    return this.users.listUsers(q, role, status);
  }

  @Patch('admin/v1/users/:id/role')
  @UseGuards(AdminGuard)
  @RequirePermissions('users:write')
  async updateUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    if (!body.role) {
      throw new AppError(400, 'Role is required.', 'INVALID_INPUT');
    }
    return this.users.updateUserRole(id, body.role);
  }

  @Patch('admin/v1/users/:id/status')
  @UseGuards(AdminGuard)
  @RequirePermissions('users:write')
  async updateUserStatus(
    @Param('id') id: string,
    @Body() body: { status: 'active' | 'suspended' | 'pending' },
  ) {
    if (!body.status || !['active', 'suspended', 'pending'].includes(body.status)) {
      throw new AppError(400, 'Invalid status.', 'INVALID_INPUT');
    }
    return this.users.updateUserStatus(id, body.status);
  }

  // --- Admin Roles & Permissions ---

  @Get('admin/v1/roles')
  @UseGuards(AdminGuard)
  @RequirePermissions('roles:read')
  async listRoles() {
    return this.users.listRoles();
  }

  @Patch('admin/v1/roles/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('roles:write')
  async updateRole(
    @Param('id') id: string,
    @Body()
    body: {
      users?: boolean;
      events?: boolean;
      gallery?: boolean;
      stories?: boolean;
      comments?: boolean;
      announcements?: boolean;
      settings?: boolean;
    },
  ) {
    return this.users.updateRolePermissions(id, body);
  }

  @Get('admin/v1/permissions')
  @UseGuards(AdminGuard)
  async listPermissions() {
    return this.users.listPermissions();
  }

  // --- Admin Invitations ---

  @Get('admin/v1/invitations')
  @UseGuards(AdminGuard)
  @RequirePermissions('users:read')
  async listInvitations() {
    return this.users.listInvitations();
  }

  @Post('admin/v1/invitations')
  @UseGuards(AdminGuard)
  @RequirePermissions('users:write')
  async createInvitation(
    @Req() request: Request,
    @Body() body: { email: string; role: string },
  ) {
    if (!body.email?.includes('@')) {
      throw new AppError(400, 'A valid email address is required.', 'INVALID_EMAIL');
    }
    const currentIdentity = (request as any).user;
    return this.users.createInvitation(body.email, body.role || 'alumni', currentIdentity?.id);
  }

  @Delete('admin/v1/invitations/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('users:write')
  async revokeInvitation(@Param('id') id: string) {
    return this.users.revokeInvitation(id);
  }

  private async getAuthenticatedIdentity(request: Request) {
    const session = await this.auth.getSession(request.headers);
    if (!session) {
      throw new AppError(401, 'Authentication is required.', 'UNAUTHENTICATED');
    }
    const identity = await this.users.getActiveIdentity(
      session.user.id,
      session.user.email,
      session.user.name,
    );
    if (!identity) {
      throw new AppError(403, 'Account inactive or unavailable.', 'ACCOUNT_INACTIVE');
    }
    return identity;
  }
}
