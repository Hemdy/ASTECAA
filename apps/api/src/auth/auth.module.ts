import { Global, Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AdminGuard } from './admin.guard.js';
import { UsersModule } from '../users/users.module.js';

@Global()
@Module({
  imports: [forwardRef(() => UsersModule)],
  providers: [AuthService, AdminGuard],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}
