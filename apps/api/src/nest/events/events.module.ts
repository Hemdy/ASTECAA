import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module.js";
import { DatabaseModule } from "../database/database.module.js";
import { EventsController } from "./events.controller.js";
import { AdminEventsController } from "./admin-events.controller.js";
import { EventsService } from "./events.service.js";

@Module({
  imports: [DatabaseModule, AdminModule],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
})
export class EventsModule {}
