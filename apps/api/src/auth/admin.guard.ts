import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../core/app-error.js';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
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
    if (identity.role !== 'admin' && identity.role !== 'super_admin') {
      throw new AppError(403, 'Administrator access is required.', 'FORBIDDEN');
    }
    return true;
  }
}

