import { Module } from '@nestjs/common';
import { EventsController } from './events.controller.js';
import { AdminEventsController } from './admin-events.controller.js';
import { EventsService } from './events.service.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  controllers: [EventsController, AdminEventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}

