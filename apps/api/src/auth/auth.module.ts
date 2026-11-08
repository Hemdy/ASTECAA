import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AdminGuard } from './admin.guard.js';
import { UsersModule } from '../users/users.module.js';
import { BootstrapService } from '../database/bootstrap.service.js';

@Global()
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [AuthService, AdminGuard, BootstrapService],
  exports: [AuthService, AdminGuard, BootstrapService],
})
export class AuthModule {}

