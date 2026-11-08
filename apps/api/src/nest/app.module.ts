import { Module } from "@nestjs/common";
import { AdminModule } from "./admin/admin.module.js";
import { AuthModule } from "./auth/auth.module.js";
import { CategoriesModule } from "./categories/categories.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { EventsModule } from "./events/events.module.js";
import { HealthModule } from "./health/health.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    UsersModule,
    AdminModule,
    CategoriesModule,
    EventsModule,
    HealthModule,
  ],
})
export class AppModule {}
