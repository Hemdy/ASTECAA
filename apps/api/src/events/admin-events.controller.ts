import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';
import { EventsService } from './events.service.js';

@Controller('api/admin/v1/events')
@UseGuards(AdminGuard)
export class AdminEventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  @RequirePermissions('events:read')
  list() {
    return this.events.listAdmin();
  }

  @Post()
  @RequirePermissions('events:write')
  create(@Body() body: unknown) {
    return this.events.create(body);
  }

  @Patch(':id')
  @RequirePermissions('events:write')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.events.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions('events:write')
  async delete(@Param('id') id: string): Promise<void> {
    await this.events.delete(id);
  }

  @Get(':id/attendees')
  @RequirePermissions('events:read')
  getAttendees(@Param('id') id: string) {
    return this.events.getAttendees(id);
  }
}

