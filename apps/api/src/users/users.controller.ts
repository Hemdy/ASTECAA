import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AppError } from '../core/app-error.js';
import { AuthService } from '../auth/auth.service.js';
import { UsersService } from './users.service.js';

@Controller('api/v1')
export class UsersController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
  ) {}

  @Get('me')
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
}
