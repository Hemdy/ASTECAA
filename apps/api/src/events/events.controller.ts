import { Controller, Get, Param } from '@nestjs/common';
import { AppError } from '../core/app-error.js';
import { EventsService } from './events.service.js';

@Controller('api/v1/events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list() {
    return this.events.listPublic();
  }

  @Get(':slug')
  get(@Param('slug') slug: string) {
    if (!slug || slug.includes('/')) {
      throw new AppError(400, 'Event identifier is invalid.', 'INVALID_EVENT_ID');
    }
    return this.events.getPublic(slug);
  }
}
