import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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

  @Post(':id/register')
  async register(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      email: string;
      phone?: string;
      graduationYear?: string;
      userId?: string;
    },
  ) {
    if (!body?.name?.trim() || !body?.email?.includes('@')) {
      throw new AppError(400, 'Name and valid email are required to register.', 'INVALID_INPUT');
    }
    return this.events.register(id, body);
  }
}

