import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { EventsModule } from './events/events.module.js';
import { VotingModule } from './voting/voting.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { StorageModule } from './storage/storage.module.js';
import { CmsModule } from './cms/cms.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    EventsModule,
    VotingModule,
    DashboardModule,
    StorageModule,
    CmsModule,
    HealthModule,
  ],
})
export class AppModule {}

