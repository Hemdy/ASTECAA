import { Module } from "@nestjs/common";
import { UsersModule } from "../users/users.module.js";
import { AdminGuard } from "./admin.guard.js";

@Module({
  imports: [UsersModule],
  providers: [AdminGuard],
  exports: [AdminGuard],
})
export class AdminModule {}
