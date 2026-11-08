import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppError } from '../core/app-error.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { PERMISSIONS_KEY, ROLES_KEY } from './permissions.decorator.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
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

    // Attach identity to request
    (request as any).user = identity;

    // Super Admin has full unrestricted access across the entire system
    const isSuperAdmin = identity.role === 'super_admin' || identity.roles.includes('super_admin');
    if (isSuperAdmin) {
      return true;
    }

    // Role check if required by handler/class
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((r) => identity.roles.includes(r) || identity.role === r);
      if (!hasRole) {
        throw new AppError(403, 'Administrator access is required.', 'FORBIDDEN');
      }
    } else if (identity.role !== 'admin') {
      throw new AppError(403, 'Administrator access is required.', 'FORBIDDEN');
    }

    // Granular permissions check if required by handler/class
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (requiredPermissions && requiredPermissions.length > 0) {
      const hasAllPermissions = requiredPermissions.every((p) =>
        identity.permissions.includes(p),
      );
      if (!hasAllPermissions) {
        throw new AppError(
          403,
          'You do not have sufficient permissions to perform this action.',
          'INSUFFICIENT_PERMISSIONS',
        );
      }
    }

    return true;
  }
}

