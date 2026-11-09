import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { DatabaseService } from '../database/database.service.js';

@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('health')
  health() {
    return { status: 'ok', version: '2026-11-09-v2', auth: 'bearer-ready' };
  }

  @Get('ready')
  async ready() {
    await this.database.db.execute(sql`select 1`);
    return { status: 'ready' };
  }
}

